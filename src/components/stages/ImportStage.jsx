export default function ImportStage({ onSubmit }) {
  return (
    <div>
      <p className="clipflow-import-headline">Paste a link to get started</p>
      <p className="clipflow-import-copy">Works with any public YouTube video.</p>
      <div className="clipflow-url-row">
        <input
          className="clipflow-field"
          defaultValue="https://youtube.com/watch?v=3fK9m2Lp1qs"
        />
        <button className="clipflow-btn clipflow-btn-primary" onClick={onSubmit}>
          Find the moment
        </button>
      </div>
      <div className="clipflow-source-card">
        <div className="clipflow-source-thumb" />
        <div className="clipflow-source-meta">
          <div className="clipflow-source-title">
            How I rebuilt my morning routine in 30 days
          </div>
          <div className="clipflow-source-sub">18:42 · uploaded by Wren Ashford</div>
        </div>
      </div>
    </div>
  );
}
