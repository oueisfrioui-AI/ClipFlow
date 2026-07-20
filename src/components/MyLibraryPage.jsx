import ClipCard from "./ClipCard.jsx";

export default function MyLibraryPage({ library, onPost, onDelete, onSave }) {
  if (library.length === 0) {
    return (
      <div>
        <p className="clipflow-import-headline">My Library</p>
        <p className="clipflow-import-copy">
          Nothing here yet — import a video and select a few clips to get started.
        </p>
      </div>
    );
  }

  // Group clips by their source video, preserving first-seen order.
  const groups = [];
  const groupByVideoId = new Map();
  for (const clip of library) {
    if (!groupByVideoId.has(clip.videoId)) {
      const group = {
        videoId: clip.videoId,
        videoTitle: clip.videoTitle,
        videoThumbnail: clip.videoThumbnail,
        videoChannel: clip.videoChannel,
        clips: [],
      };
      groupByVideoId.set(clip.videoId, group);
      groups.push(group);
    }
    groupByVideoId.get(clip.videoId).clips.push(clip);
  }

  return (
    <div>
      <p className="clipflow-import-headline">My Library</p>
      <p className="clipflow-import-copy">
        Every clip you've pulled, ready to post, edit, or clear out.
      </p>

      {groups.map((group) => (
        <div className="clipflow-lib-video-group" key={group.videoId}>
          <div className="clipflow-lib-video-header">
            <img
              src={group.videoThumbnail}
              alt={group.videoTitle}
              className="clipflow-lib-video-thumb"
              style={{ objectFit: "cover" }}
            />
            <div>
              <p className="clipflow-lib-video-title">{group.videoTitle}</p>
              <p className="clipflow-lib-video-sub">
                {group.videoChannel} · {group.clips.length} clip
                {group.clips.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="clipflow-lib-grid">
            {group.clips.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                onPost={onPost}
                onDelete={onDelete}
                onSave={onSave}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
