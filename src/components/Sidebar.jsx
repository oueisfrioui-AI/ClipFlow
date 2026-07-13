// Mock history — swap this for real data from your backend once you have one.
const MOCK_HISTORY = [
    { id: "clip_0038", title: "The moment the routine actually clicked", duration: "0:38", date: "Jul 10", status: "Published" },
    { id: "clip_0031", title: "\u201cI almost quit on day 9\u201d", duration: "0:24", date: "Jul 6", status: "Published" },
    { id: "clip_0024", title: "Before and after, side by side", duration: "0:51", date: "Jun 29", status: "Published" },
    { id: "clip_0019", title: "Why nobody tells you this part", duration: "0:44", date: "Jun 21", status: "Draft" },
  ];
  
  export default function Sidebar({ open, onClose, user, theme, onToggleTheme, onLogout }) {
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
            <div className="clipflow-sidebar-history-list">
              {MOCK_HISTORY.map((item) => (
                <div className="clipflow-history-row" key={item.id}>
                  <div className="clipflow-history-thumb" />
                  <div className="clipflow-history-meta">
                    <div className="clipflow-history-title">{item.title}</div>
                    <div className="clipflow-history-sub">
                      {item.date} · {item.duration} · {item.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
  
          <button className="clipflow-btn clipflow-sidebar-logout" onClick={onLogout}>
            Log out
          </button>
        </aside>
      </>
    );
  }