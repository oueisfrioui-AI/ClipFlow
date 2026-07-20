export default function Sidebar({
  open,
  onClose,
  user,
  theme,
  onToggleTheme,
  onLogout,
  library,
  onOpenLibrary,
}) {
  const recent = library.slice(0, 4);

  return (
    <>
      <div
        className={"clipflow-sidebar-backdrop" + (open ? " open" : "")}
        onClick={onClose}
      />
      <aside className={"clipflow-sidebar" + (open ? " open" : "")}>
        <div className="clipflow-sidebar-header">
          <span>Account</span>
          <button className="clipflow-sidebar-close" onClick={onClose} aria-label="Close sidebar">
            ✕
          </button>
        </div>

        <div className="clipflow-sidebar-profile">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="clipflow-avatar"
              style={{ width: 44, height: 44, objectFit: "cover" }}
            />
          ) : (
            <div className="clipflow-avatar" style={{ width: 44, height: 44 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div className="clipflow-sidebar-name">{user?.name || "Guest"}</div>
            <div className="clipflow-sidebar-email">{user?.email || "Not signed in"}</div>
          </div>
        </div>

        <div className="clipflow-sidebar-section">
          <div className="clipflow-sidebar-label">Settings</div>
          <div className="clipflow-toggle-row" style={{ borderTop: "none", padding: "4px 0" }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Dark mode</span>
            <button
              className={"clipflow-toggle " + (theme === "dark" ? "on" : "off")}
              onClick={onToggleTheme}
              aria-label="Toggle dark mode"
            />
          </div>
        </div>

        <div className="clipflow-sidebar-section clipflow-sidebar-history">
          <div className="clipflow-sidebar-label">Previous videos &amp; clips</div>

          {recent.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
              No clips yet — import a video to get started.
            </p>
          ) : (
            <div className="clipflow-sidebar-history-list">
              {recent.map((clip) => (
                <div className="clipflow-history-row" key={clip.id} onClick={onOpenLibrary}>
                  <div className="clipflow-history-thumb" />
                  <div className="clipflow-history-meta">
                    <div className="clipflow-history-title">{clip.title}</div>
                    <div className="clipflow-history-sub">
                      {clip.duration} · {clip.status === "published" ? "Published" : "Draft"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="clipflow-restart"
            style={{ padding: "10px 0 0" }}
            onClick={onOpenLibrary}
          >
            View My Library →
          </button>
        </div>

        <button className="clipflow-btn clipflow-sidebar-logout" onClick={onLogout}>
          Log out
        </button>
      </aside>
    </>
  );
}