export const CLIPS = [
  { id: 0, duration: "0:38", title: "The moment the routine actually clicked" },
  { id: 1, duration: "0:24", title: "\u201cI almost quit on day 9\u201d" },
  { id: 2, duration: "0:51", title: "Before and after, side by side" },
  { id: 3, duration: "0:19", title: "The one line that stuck with me" },
  { id: 4, duration: "0:44", title: "Why nobody tells you this part" },
  { id: 5, duration: "0:29", title: "The reaction says it all" },
];

export default function ReviewStage({ selectedClipIds, onToggleClip, onContinue }) {
  const count = selectedClipIds.length;

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
        Tap as many clips as you'd like — they'll all move to Publish together.
      </p>

      <div className="clipflow-clip-row">
        {CLIPS.map((clip) => {
          const selected = selectedClipIds.includes(clip.id);
          return (
            <div
              className={"clipflow-clip-card" + (selected ? " selected" : "")}
              key={clip.id}
              onClick={() => onToggleClip(clip.id)}
            >
              <div className="clipflow-clip-thumb">
                <div className="clipflow-clip-play">▶</div>
                <div className="clipflow-clip-duration">{clip.duration}</div>
                {selected && <div className="clipflow-clip-check">✓</div>}
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