import { useEffect, useRef, useState } from "react";

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

// Renders a YouTube clip that is force-confined to [start, end]. Unlike the
// plain <iframe src="...?start=..&end=.."> approach, this uses the real
// IFrame JS API and actively polls playback position, so the clip reliably
// stops at `end` and never drifts into the rest of the source video —
// URL-param `end` alone is known to be unreliable, especially with autoplay.
export default function ClipPlayer({ videoId, start, end, onClose }) {
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const pollRef = useRef(null);
  const duration = Math.max(0, end - start);
  const [elapsed, setElapsed] = useState(0);

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
            clearInterval(pollRef.current);
            if (e.data !== YT.PlayerState.PLAYING) return;

            pollRef.current = setInterval(() => {
              const player = playerRef.current;
              if (!player || typeof player.getCurrentTime !== "function") return;
              const t = player.getCurrentTime();
              // If playback ever reaches/passes the clip end, or somehow
              // drifts before the clip start, snap back and pause instead
              // of letting the rest of the source video play.
              if (t >= end || t < start - 1) {
                player.pauseVideo();
                player.seekTo(start, true);
                setElapsed(0);
                clearInterval(pollRef.current);
                return;
              }
              setElapsed(Math.min(duration, Math.max(0, t - start)));
            }, 200);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearInterval(pollRef.current);
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, start, end]);

  return (
    <>
      <div className="clipflow-clip-player" style={{ overflow: "hidden" }}>
        <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      </div>
      {/* Masks YouTube's own title/channel overlay so this reads as a clip,
          not an embedded video with branding on top of it. */}
      <div className="clipflow-clip-top-mask" />
      <div className="clipflow-clip-timer">
        {formatTime(elapsed)} / {formatTime(duration)}
      </div>
      <button
        className="clipflow-clip-stop"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Stop preview"
      >
        ✕
      </button>
    </>
  );
}