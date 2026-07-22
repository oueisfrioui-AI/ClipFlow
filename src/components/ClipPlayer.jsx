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
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const pollRef = useRef(null);
  const trackRef = useRef(null);
  const duration = Math.max(0, end - start);

  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !mountRef.current) return;

      playerRef.current = new YT.Player(mountRef.current, {
        videoId,
        width: "100%",
        height: "100%",
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
                // video or auto-loop, and surface a replay control.
                if (t >= end || t < start - 1) {
                  player.pauseVideo();
                  player.seekTo(start, true);
                  setElapsed(0);
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
            }
          },
        },
      });
    });

    // Close on Escape, like the Edit modal.
    function handleKey(e) {
      if (e.key === "Escape") onClose();
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
    if (ended) {
      seekToFraction(0);
    } else if (isPlaying) {
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
        <div className="clipflow-clip-player" style={{ overflow: "hidden" }}>
          <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Intercepts all pointer interaction with the embed itself, so
            YouTube's own hover-triggered overlays (title/channel bar, logo
            tooltip, "watch on YouTube") never get a chance to appear — the
            mouse never actually reaches the iframe. Also drives play/pause. */}
        <div className="clipflow-clip-hit-layer" onClick={togglePlayPause} />

        {/* Static masks for the moments (e.g. right on load, or while
            paused) where YouTube shows title/channel or its logo without a
            hover trigger. The popup format gives extra room for these to
            sit comfortably without covering the actual clip content. */}
        <div className="clipflow-clip-top-mask" />
        <div className="clipflow-clip-bottom-mask" />

        {ended ? (
          <button
            className="clipflow-clip-replay"
            onClick={(e) => {
              e.stopPropagation();
              seekToFraction(0);
            }}
            aria-label="Replay clip"
          >
            ↻
          </button>
        ) : (
          !isPlaying && (
            <button
              className="clipflow-clip-resume"
              onClick={(e) => {
                e.stopPropagation();
                playerRef.current?.playVideo();
              }}
              aria-label="Resume clip"
            />
          )
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
          </div>
        </div>

        <div className="clipflow-clip-timer">
          {formatTime(elapsed)} / {formatTime(duration)}
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