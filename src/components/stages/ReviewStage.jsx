export const CLIPS = [
  { id: 0, duration: "0:38", title: "The moment the routine actually clicked" },
  { id: 1, duration: "0:24", title: "\u201cI almost quit on day 9\u201d" },
  { id: 2, duration: "0:51", title: "Before and after, side by side" },
];

export default function ReviewStage({ selectedClip, onSelectClip, onContinue }) {
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

      <div className="clipflow-clip-grid">
        {CLIPS.map((clip) => (
          <div
            className={
              "clipflow-clip-card" + (selectedClip === clip.id ? " selected" : "")
            }
            key={clip.id}
            onClick={() => onSelectClip(clip.id)}
          >
            <div className="clipflow-clip-thumb">
              <div className="clipflow-clip-play">▶</div>
              <div className="clipflow-clip-duration">{clip.duration}</div>
              {selectedClip === clip.id && (
                <div className="clipflow-clip-check">✓</div>
              )}
            </div>
            <div className="clipflow-clip-body">
              <p className="clipflow-clip-title">{clip.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="clipflow-review-footer">
        <button
          className="clipflow-btn clipflow-btn-primary"
          style={{
            opacity: selectedClip === null ? 0.5 : 1,
            cursor: selectedClip === null ? "not-allowed" : "pointer",
          }}
          onClick={() => selectedClip !== null && onContinue()}
        >
          Continue with this clip
        </button>
      </div>
    </div>
  );
}
