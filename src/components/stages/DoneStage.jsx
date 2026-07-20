export default function DoneStage({ publishedCount, onRestart, onOpenLibrary }) {
  return (
    <div className="clipflow-done-wrap">
      <div className="clipflow-done-badge">✓</div>
      <p className="clipflow-done-title">{publishedCount > 0 ? "Published" : "All set"}</p>
      <p className="clipflow-done-copy">
        {publishedCount > 0
          ? `${publishedCount} clip${publishedCount > 1 ? "s are" : " is"} live on YouTube.`
          : "Your clips are saved in My Library whenever you're ready to post them."}
      </p>
      <button className="clipflow-btn clipflow-btn-primary" onClick={onOpenLibrary}>
        Go to My Library
      </button>
      <button className="clipflow-btn" onClick={onRestart}>
        Cut another clip
      </button>
    </div>
  );
}