import { useState } from "react";
import ClipPlayer from "../ClipPlayer.jsx";

// Converts a backend "mm:ss" or "h:mm:ss" timestamp string into seconds,
// for the player (which seeks numerically). Falls back to 0 on anything
// unparseable rather than throwing, since this drives a UI, not logic.
function parseTimestamp(ts) {
  if (typeof ts === "number") return ts;
  if (typeof ts !== "string") return 0;
  const parts = ts.split(":").map((p) => parseInt(p, 10));
  if (parts.some((p) => Number.isNaN(p))) return 0;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

// "92" (seconds) -> "1:32", for the duration badge on each card.
function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function ReviewStage({
  videoId,
  videoThumbnail,
  clips,
  selectedClipIds,
  onToggleClip,
  onSetSelectedClipIds,
  onContinue,
}) {
  const [playingId, setPlayingId] = useState(null);
  const count = selectedClipIds.length;
  const allSelected = clips.length > 0 && count === clips.length;

  function selectAll() {
    onSetSelectedClipIds(clips.map((c) => c.id));
  }

  function deselectAll() {
    onSetSelectedClipIds([]);
  }

  return (
    <div>
      <div className="clipflow-timeline">
        <div className="clipflow-timeline-tag">✦ ClipFlow pick · 0:38</div>
        <div className="clipflow-timeline-track">
          <div className="clipflow-timeline-spike" />
        </div>
        <div className="clipflow-timeline-marks">
          <span>00:00</span>
          <span>04:41</span>
          <span>09:21</span>
          <span>14:02</span>
          <span>18:42</span>
        </div>
      </div>

      <p className="clipflow-review-hint">
        Tap <span className="clipflow-hint-play">▶</span> to preview, tap the card to select —
        pick as many as you'd like.
      </p>

      <div className="clipflow-bulk-bar">
        <span className="clipflow-bulk-count">
          {count} of {clips.length} selected
        </span>
        <div className="clipflow-bulk-actions">
          <button
            className="clipflow-bulk-btn"
            onClick={selectAll}
            disabled={allSelected}
          >
            Select all
          </button>
          <button
            className="clipflow-bulk-btn"
            onClick={deselectAll}
            disabled={count === 0}
          >
            Deselect all
          </button>
        </div>
      </div>

      <div className="clipflow-clip-row">
        {clips.map((clip) => {
          const selected = selectedClipIds.includes(clip.id);
          const playing = playingId === clip.id;
          const startSeconds = parseTimestamp(clip.start);
          const endSeconds = parseTimestamp(clip.end);
          const durationLabel =
            typeof clip.duration === "number"
              ? formatDuration(clip.duration)
              : clip.duration || formatDuration(endSeconds - startSeconds);

          return (
            <div
              className={"clipflow-clip-card" + (selected ? " selected" : "")}
              key={clip.id}
              onClick={() => onToggleClip(clip.id)}
            >
              <div className="clipflow-clip-thumb">
                {playing ? (
                  <ClipPlayer
                    videoId={videoId}
                    start={startSeconds}
                    end={endSeconds}
                    title={clip.title}
                    onClose={() => setPlayingId(null)}
                  />
                ) : (
                  <>
                    {videoThumbnail && (
                      <img
                        className="clipflow-clip-thumb-img"
                        src={videoThumbnail}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <button
                      className="clipflow-clip-play"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingId(clip.id);
                      }}
                      aria-label="Preview clip"
                    />
                    <div className="clipflow-clip-duration">{durationLabel}</div>
                    {selected && <div className="clipflow-clip-check">✓</div>}
                  </>
                )}
              </div>
              <div className="clipflow-clip-body">
                <p className="clipflow-clip-title">{clip.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="clipflow-review-footer">
        <button
          className="clipflow-btn clipflow-btn-primary"
          style={{
            opacity: count === 0 ? 0.5 : 1,
            cursor: count === 0 ? "not-allowed" : "pointer",
          }}
          onClick={() => count > 0 && onContinue()}
        >
          {count === 0
            ? "Select clips to continue"
            : `Send ${count} clip${count > 1 ? "s" : ""} to Publish`}
        </button>
      </div>
    </div>
  );
}