import { useState, useEffect } from "react";

// Paste the API key you created in Google Cloud Console here.
// This is a separate credential from the OAuth Client ID used for sign-in —
// this one is for read-only public video data, not login.
const YOUTUBE_API_KEY = "AIzaSyBgA-1QVtdZCs2n3vKXSgJ6D7ytY1ScYBU";

// Pulls the 11-character video ID out of any common YouTube URL shape:
// watch?v=, youtu.be/, shorts/, embed/
function extractYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

// Converts YouTube's ISO 8601 duration (e.g. "PT18M42S") into "18:42" or "1:02:15"
function formatDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  const pad = (n) => String(n).padStart(2, "0");

  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

// "1234567" -> "1.2M views"
function formatViewCount(count) {
  const num = parseInt(count, 10);
  const formatted = new Intl.NumberFormat("en", { notation: "compact" }).format(num);
  return `${formatted} views`;
}

// "2024-03-11T10:00:00Z" -> "Mar 2024"
function formatPublishedDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function ImportStage({ onSubmit }) {
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleUrlChange(e) {
    setUrl(e.target.value);
  }

  // Auto-fetch whenever the pasted/typed text resolves to a valid video ID —
  // debounced slightly so it doesn't fire on every keystroke of a partial URL.
  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setVideoInfo(null);
      setError(null);
      return;
    }

    const videoId = extractYouTubeId(trimmed);
    if (!videoId) {
      setVideoInfo(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchVideo(videoId);
    }, 400);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  async function fetchVideo(videoId) {
    setError(null);
    setVideoInfo(null);
    setLoading(true);
    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Request failed.");

      const data = await res.json();
      const video = data.items && data.items[0];
      if (!video) throw new Error("Video not found or not public.");

      setVideoInfo({
        videoId,
        title: video.snippet.title,
        channel: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.medium.url,
        duration: formatDuration(video.contentDetails.duration),
        views: formatViewCount(video.statistics.viewCount),
        published: formatPublishedDate(video.snippet.publishedAt),
      });
    } catch (err) {
      setError("Couldn't find that video. Check the link and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="clipflow-import-headline">Paste a link to get started</p>
      <p className="clipflow-import-copy">
        Works with any public YouTube video — we'll fetch it automatically.
      </p>

      <div className="clipflow-url-row">
        <input
          className="clipflow-field"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://youtube.com/watch?v=..."
          autoFocus
        />
      </div>

      {loading && (
        <p style={{ color: "var(--ink-dim)", fontSize: 13, textAlign: "center", marginTop: 8 }}>
          Fetching video details...
        </p>
      )}

      {error && (
        <p style={{ color: "var(--orange)", fontSize: 13, textAlign: "center", marginTop: 8 }}>
          {error}
        </p>
      )}

      {videoInfo && (
        <>
          <div
            className="clipflow-source-card"
            onClick={() =>
              window.open(
                `https://www.youtube.com/watch?v=${videoInfo.videoId}`,
                "_blank",
                "noopener,noreferrer"
              )
            }
            title="Open on YouTube"
          >
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="clipflow-source-thumb"
              style={{ objectFit: "cover" }}
            />
            <div className="clipflow-source-meta">
              <div className="clipflow-source-title">{videoInfo.title}</div>
              <div className="clipflow-source-sub">
                {videoInfo.duration} · {videoInfo.channel}
              </div>
              <div className="clipflow-source-sub">
                {videoInfo.views} · {videoInfo.published}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
            <button
              className="clipflow-btn clipflow-btn-primary"
              style={{ width: "auto", padding: "13px 32px", margin: 0 }}
              onClick={() => onSubmit(videoInfo)}
            >
              Find the moment
            </button>
          </div>
        </>
      )}
    </div>
  );
}