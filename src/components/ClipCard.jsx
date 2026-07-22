import { useState } from "react";
import ClipPlayer from "./ClipPlayer.jsx";

export default function ClipCard({ clip, onPost, onDelete, onSave, showSource }) {
  const [editing, setEditing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [title, setTitle] = useState(clip.title);
  const [description, setDescription] = useState(clip.description);
  const [thumbIndex, setThumbIndex] = useState(clip.thumbnailIndex);
  const [isShort, setIsShort] = useState(clip.isShort);

  function openEdit() {
    setTitle(clip.title);
    setDescription(clip.description);
    setThumbIndex(clip.thumbnailIndex);
    setIsShort(clip.isShort);
    setEditing(true);
  }

  function handleSave() {
    onSave(clip.id, {
      title,
      description,
      thumbnailIndex: thumbIndex,
      isShort,
    });
    setEditing(false);
  }

  return (
    <>
      <div className="clipflow-lib-card">
        <div className="clipflow-lib-thumb">
          {playing ? (
            <ClipPlayer
              videoId={clip.videoId}
              start={clip.start}
              end={clip.end}
              title={clip.title}
              onClose={() => setPlaying(false)}
            />
          ) : (
            <>
              <div className={"clipflow-lib-status " + clip.status}>
                {clip.status === "published" ? "Published" : "Draft"}
              </div>
              <button
                className="clipflow-clip-play"
                onClick={() => setPlaying(true)}
                aria-label="Preview clip"
              />
              <div className="clipflow-clip-duration">{clip.duration}</div>
            </>
          )}
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
            <button onClick={openEdit}>Edit</button>
            <button className="danger" onClick={() => onDelete(clip.id)}>
              Delete
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <>
          <div className="clipflow-modal-backdrop" onClick={() => setEditing(false)} />
          <div className="clipflow-modal" role="dialog" aria-modal="true">
            <div className="clipflow-modal-header">
              <span>Edit clip</span>
              <button
                className="clipflow-modal-close"
                onClick={() => setEditing(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="clipflow-modal-body">
              <div>
                <label className="clipflow-form-label">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div>
                <label className="clipflow-form-label">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <label className="clipflow-form-label">Thumbnail</label>
                <div className="clipflow-thumb-row">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={"clipflow-thumb-opt" + (thumbIndex === i ? " selected" : "")}
                      onClick={() => setThumbIndex(i)}
                    />
                  ))}
                </div>
              </div>

              <div className="clipflow-toggle-row" style={{ borderTop: "none", padding: "4px 0 0" }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>YouTube Short</span>
                <button
                  className={"clipflow-toggle " + (isShort ? "on" : "off")}
                  onClick={() => setIsShort(!isShort)}
                  aria-label="Toggle YouTube Short"
                />
              </div>
            </div>

            <div className="clipflow-modal-actions">
              <button onClick={() => setEditing(false)}>Cancel</button>
              <button className="primary" onClick={handleSave}>
                Save changes
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}