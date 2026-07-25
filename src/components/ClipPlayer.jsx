import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Loads the YouTube IFrame JS API once and shares the promise across every
// player instance on the page, since YouTube only fires
// window.onYouTubeIframeAPIReady a single time (globally).
let apiPromise = null;
function loadYouTubeAPI() {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previous) previous();
      resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });

  return apiPromise;
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

// Renders a YouTube clip, confined to [start, end], as a popup modal (same
// pattern as the Edit modal) rendered via a portal straight to <body> — so
// it's never trapped inside a card's stacking context and always sits
// centered above everything. Playback is driven entirely through the real
// IFrame JS API rather than the plain iframe src params (which are
// unreliable for `end`), giving us our own play/pause, a custom seek bar,
// and an end-of-clip replay state instead of relying on YouTube's own UI.
export default function ClipPlayer({ videoId, start, end, title, onClose }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const pollRef = useRef(null);
  const trackRef = useRef(null);
  const duration = Math.max(0, end - start);

  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // The YouTube API takes ownership of whatever element it's given and
    // replaces it with its own <iframe>. Handing it a disposable element we
    // create here (instead of the React-managed ref directly) means React
    // Strict Mode's dev-only double-invoke of this effect can never hand a
    // second player instance a stale/already-mutated node — each run gets
    // its own throwaway mount point, cleanly removed on cleanup.
    const mountEl = document.createElement("div");
    mountEl.style.width = "100%";
    mountEl.style.height = "100%";
    containerRef.current?.appendChild(mountEl);

    loadYouTubeAPI().then((YT) => {
      if (cancelled) return;

      playerRef.current = new YT.Player(mountEl, {
        videoId,
        // A real fixed 16:9 size (not "100%") — this becomes the iframe's
        // actual intrinsic dimensions, which is what lets the CSS below
        // crop it to fill a vertical frame edge-to-edge (Shorts-style)
        // instead of YouTube letterboxing it inside a portrait box.
        width: 640,
        height: 360,
        playerVars: {
          start,
          end,
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: (e) => {
            // Belt-and-suspenders: force the clip window even if playerVars
            // start/end get dropped on this load.
            e.target.seekTo(start, true);
            e.target.playVideo();
            // Browsers sometimes force-mute autoplaying video regardless of
            // what we asked for — reflect the real state in our own UI.
            setMuted(e.target.isMuted());
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setEnded(false);
              clearInterval(pollRef.current);
              pollRef.current = setInterval(() => {
                const player = playerRef.current;
                if (!player || typeof player.getCurrentTime !== "function") return;
                const t = player.getCurrentTime();
                // Reached (or somehow drifted past) the clip end: stop
                // instead of letting it roll into the rest of the source
                // video, and surface a replay control. Deliberately just
                // pause here rather than also seeking back to `start` —
                // calling seekTo() right after pauseVideo() can make
                // YouTube silently resume playback, racing our own
                // "ended" state and briefly showing both overlays.
                if (t >= end || t < start - 1) {
                  player.pauseVideo();
                  setElapsed(duration);
                  setIsPlaying(false);
                  setEnded(true);
                  clearInterval(pollRef.current);
                  return;
                }
                setElapsed(Math.min(duration, Math.max(0, t - start)));
              }, 200);
            } else if (e.data === YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              clearInterval(pollRef.current);
            } else if (e.data === YT.PlayerState.ENDED) {
              // The `end` playerVar makes YouTube itself fire a native
              // ENDED state once it hits that timestamp — independent of
              // our own polling above, and it comes with YouTube's own
              // centered replay icon/end-screen baked into the iframe.
              // Treat it the same as our own end-of-clip handling.
              setElapsed(duration);
              setIsPlaying(false);
              setEnded(true);
              clearInterval(pollRef.current);
            }
          },
        },
      });
    });

    // Keyboard shortcuts while the modal is open. Deliberately read live
    // state off the player itself (getPlayerState/isMuted/getCurrentTime)
    // rather than the React state variables above — this handler is only
    // re-attached when the clip identity (videoId/start/end) changes, so
    // closing over isPlaying/ended/muted directly would go stale the
    // moment any of those changed without the effect re-running.
    function handleKey(e) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      const player = playerRef.current;
      if (!player || typeof player.getPlayerState !== "function") return;

      switch (e.key) {
        case " ":
        case "Spacebar": {
          e.preventDefault();
          const state = player.getPlayerState();
          if (state === window.YT?.PlayerState.PLAYING) {
            player.pauseVideo();
          } else {
            player.playVideo();
          }
          break;
        }
        case "ArrowLeft":
          e.preventDefault();
          nudgeSeconds(-5);
          break;
        case "ArrowRight":
          e.preventDefault();
          nudgeSeconds(5);
          break;
        case "ArrowUp":
          e.preventDefault();
          adjustVolume(10);
          break;
        case "ArrowDown":
          e.preventDefault();
          adjustVolume(-10);
          break;
        case "m":
        case "M":
          toggleMute();
          break;
        default:
          break;
      }
    }
    document.addEventListener("keydown", handleKey);

    return () => {
      cancelled = true;
      document.removeEventListener("keydown", handleKey);
      clearInterval(pollRef.current);
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
      }
      playerRef.current = null;
      mountEl.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, start, end]);

  function seekToFraction(fraction) {
    const player = playerRef.current;
    if (!player || typeof player.seekTo !== "function" || !duration) return;
    const clamped = Math.min(1, Math.max(0, fraction));
    player.seekTo(start + clamped * duration, true);
    setElapsed(clamped * duration);
    setEnded(false);
    player.playVideo();
  }

  // Nudges playback by `delta` seconds, clamped within the clip's own
  // [start, end] window — used by the ←/→ keyboard shortcuts.
  function nudgeSeconds(delta) {
    const player = playerRef.current;
    if (!player || typeof player.getCurrentTime !== "function") return;
    const target = Math.min(end, Math.max(start, player.getCurrentTime() + delta));
    player.seekTo(target, true);
    setElapsed(Math.min(duration, Math.max(0, target - start)));
    setEnded(false);
    if (player.getPlayerState() !== window.YT?.PlayerState.PLAYING) {
      player.playVideo();
    }
  }

  function adjustVolume(delta) {
    const player = playerRef.current;
    if (!player || typeof player.getVolume !== "function") return;
    const next = Math.min(100, Math.max(0, player.getVolume() + delta));
    player.setVolume(next);
    if (next > 0 && player.isMuted()) {
      player.unMute();
      setMuted(false);
    }
  }

  function toggleMute() {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted()) {
      player.unMute();
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  }

  function handleBarClick(e) {
    e.stopPropagation();
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    seekToFraction((e.clientX - rect.left) / rect.width);
  }

  function togglePlayPause(e) {
    e.stopPropagation();
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }

  const progressPct = duration ? (elapsed / duration) * 100 : 0;

  return createPortal(
    <>
      <div className="clipflow-clip-modal-backdrop" onClick={onClose} />
      <div className="clipflow-clip-modal" role="dialog" aria-modal="true" aria-label={title || "Clip preview"}>
        <div className="clipflow-clip-frame">
          <div className="clipflow-clip-player" style={{ overflow: "hidden" }}>
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
          </div>

          {/* Intercepts all pointer interaction with the embed itself, so
              YouTube's own hover-triggered overlays (title/channel bar, logo
              tooltip, "watch on YouTube") never get a chance to appear — the
              mouse never actually reaches the iframe. Also drives play/pause. */}
          <div
            className="clipflow-clip-hit-layer"
            onClick={togglePlayPause}
            style={{ pointerEvents: ended ? "none" : "auto" }}
          />

          {/* Static masks for the moments (e.g. right on load, or while
              paused) where YouTube shows title/channel or its logo without a
              hover trigger. Anchored to this frame — which is sized to the
              video's actual 16:9 content area — rather than the outer 9:16
              modal, so they land exactly where that branding renders instead
              of over empty letterbox space. */}
          <div className="clipflow-clip-top-mask" />
          <div className="clipflow-clip-bottom-mask" />

          {/* Purely decorative — sits behind YouTube's own native
              replay icon (which appears automatically once `ended` fires)
              and dresses it up with a glow, without blocking clicks to it. */}
          {ended && <div className="clipflow-clip-native-repeat-glow" />}

          {!ended && !isPlaying && (
            <button
              className="clipflow-clip-resume"
              onClick={(e) => {
                e.stopPropagation();
                playerRef.current?.playVideo();
              }}
              aria-label="Resume clip"
            />
          )}

          <div
            className="clipflow-clip-bar"
            onClick={handleBarClick}
            role="slider"
            aria-label="Seek within clip"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={elapsed}
          >
            <div className="clipflow-clip-bar-track" ref={trackRef}>
              <div className="clipflow-clip-bar-fill" style={{ width: `${progressPct}%` }} />
              <div className="clipflow-clip-bar-thumb" style={{ left: `${progressPct}%` }} />
            </div>
          </div>

          <div className="clipflow-clip-timer">
            {formatTime(elapsed)} / {formatTime(duration)}
          </div>

          <button
            className="clipflow-clip-mute"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 9 3 15 8 15 13 20 13 4 8 9 3 9" fill="currentColor" stroke="none" />
                <line x1="16" y1="9" x2="22" y2="15" />
                <line x1="22" y1="9" x2="16" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 9 3 15 8 15 13 20 13 4 8 9 3 9" fill="currentColor" stroke="none" />
                <path d="M16 8a5 5 0 0 1 0 8" />
                <path d="M19 5a9 9 0 0 1 0 14" />
              </svg>
            )}
          </button>
        </div>

        <button
          className="clipflow-clip-stop"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close preview"
        >
          ✕
        </button>
      </div>
    </>,
    document.body
  );
}