export default function PublishStage({
  isShort,
  onToggleShort,
  thumbIndex,
  onSelectThumb,
  onPublish,
}) {
  return (
    <div className="clipflow-publish-grid">
      <div className="clipflow-preview-player">
        <div className="clipflow-preview-caption">0:38 · vertical · captions on</div>
      </div>

      <div>
        <div className="clipflow-form-group">
          <label className="clipflow-form-label">Title</label>
          <input
            className="clipflow-field"
            defaultValue="The moment my morning routine actually clicked"
          />
        </div>

        <div className="clipflow-form-group">
          <label className="clipflow-form-label">Description</label>
          <textarea
            className="clipflow-field textarea"
            defaultValue="Day 9 of rebuilding my mornings from scratch — this is the part that changed everything. Full video linked below."
          />
        </div>

        <div className="clipflow-form-group">
          <label className="clipflow-form-label">Thumbnail</label>
          <div className="clipflow-thumb-row">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={
                  "clipflow-thumb-opt" + (thumbIndex === i ? " selected" : "")
                }
                onClick={() => onSelectThumb(i)}
              />
            ))}
          </div>
        </div>

        <div className="clipflow-toggle-row">
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            Publish as a YouTube Short
          </span>
          <button
            className={"clipflow-toggle " + (isShort ? "on" : "off")}
            onClick={onToggleShort}
            aria-label="Toggle YouTube Short"
          />
        </div>

        <div className="clipflow-toggle-row" style={{ borderTop: "none" }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Visibility</span>
          <span style={{ fontSize: 13, color: "var(--ink-dim)" }}>Public</span>
        </div>

        <button
          className="clipflow-btn clipflow-btn-primary"
          style={{ marginTop: 18 }}
          onClick={onPublish}
        >
          Publish to YouTube
        </button>
      </div>
    </div>
  );
}
