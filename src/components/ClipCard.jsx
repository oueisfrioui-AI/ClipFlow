import { useState } from "react";

export default function ClipCard({ clip, onPost, onDelete, onSave, showSource }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(clip.title);
  const [description, setDescription] = useState(clip.description);
  const [thumbIndex, setThumbIndex] = useState(clip.thumbnailIndex);
  const [isShort, setIsShort] = useState(clip.isShort);

  function handleSave() {
    onSave(clip.id, {
      title,
      description,
      thumbnailIndex: thumbIndex,
      isShort,
    });
    setEditing(false);
  }

  function handleCancel() {
    setTitle(clip.title);
    setDescription(clip.description);
    setThumbIndex(clip.thumbnailIndex);
    setIsShort(clip.isShort);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="clipflow-lib-card">
        <div className="clipflow-lib-edit-form">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
          />
          <div className="clipflow-thumb-row">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={"clipflow-thumb-opt" + (thumbIndex === i ? " selected" : "")}
                onClick={() => setThumbIndex(i)}
              />
            ))}
          </div>
          <div className="clipflow-toggle-row" style={{ borderTop: "none", padding: "2px 0" }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>YouTube Short</span>
            <button
              className={"clipflow-toggle " + (isShort ? "on" : "off")}
              onClick={() => setIsShort(!isShort)}
              aria-label="Toggle YouTube Short"
            />
          </div>
          <div className="clipflow-lib-edit-actions">
            <button onClick={handleCancel}>Cancel</button>
            <button className="primary" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="clipflow-lib-card">
      <div className="clipflow-lib-thumb">
        <div className={"clipflow-lib-status " + clip.status}>
          {clip.status === "published" ? "Published" : "Draft"}
        </div>
        <div className="clipflow-clip-play">▶</div>
        <div className="clipflow-clip-duration">{clip.duration}</div>
      </div>
      <div className="clipflow-lib-body">
        <p className="clipflow-lib-title">{clip.title}</p>
        {showSource && <p className="clipflow-lib-source">From: {clip.videoTitle}</p>}
        {clip.status === "published" && clip.publishedUrl && (
          <p className="clipflow-lib-link">{clip.publishedUrl}</p>
        )}
        <div className="clipflow-lib-actions">
          {clip.status !== "published" && (
            <button className="primary" onClick={() => onPost(clip.id)}>
              Post
            </button>
          )}
          <button onClick={() => setEditing(true)}>Edit</button>
          <button className="danger" onClick={() => onDelete(clip.id)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
