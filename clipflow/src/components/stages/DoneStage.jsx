export default function DoneStage({ isShort, onRestart }) {
  return (
    <div className="clipflow-done-wrap">
      <div className="clipflow-done-badge">✓</div>
      <p className="clipflow-done-title">Published</p>
      <p className="clipflow-done-copy">
        Your clip is live on YouTube{isShort ? " as a Short" : ""}.
      </p>
      <div className="clipflow-done-link">youtube.com/shorts/clip_0038</div>
      <button className="clipflow-btn clipflow-btn-primary" onClick={onRestart}>
        Cut another clip
      </button>
    </div>
  );
}
