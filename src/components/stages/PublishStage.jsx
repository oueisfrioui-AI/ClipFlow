import ClipCard from "../ClipCard.jsx";

export default function PublishStage({ clips, onPost, onDelete, onSave, onDone }) {
  const publishedCount = clips.filter((c) => c.status === "published").length;

  return (
    <div>
      <p className="clipflow-import-headline">Publish your clips</p>
      <p className="clipflow-import-copy">
        Post each one when it's ready, fine-tune the details, or remove the ones you don't want.
      </p>

      {clips.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--ink-dim)", fontSize: 14 }}>
          Nothing left here — check My Library or start over to pull more clips.
        </p>
      ) : (
        <div className="clipflow-lib-grid">
          {clips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              onPost={onPost}
              onDelete={onDelete}
              onSave={onSave}
            />
          ))}
        </div>
      )}

      <div className="clipflow-review-footer">
        <button className="clipflow-btn clipflow-btn-primary" onClick={onDone}>
          {publishedCount > 0 ? "Finish" : "Skip for now"}
        </button>
      </div>
    </div>
  );
}