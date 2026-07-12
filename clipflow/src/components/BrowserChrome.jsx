export default function BrowserChrome({ url }) {
  return (
    <div className="clipflow-chrome">
      <div className="clipflow-dot" />
      <div className="clipflow-dot" />
      <div className="clipflow-dot" />
      <div className="clipflow-chrome-url">{url}</div>
    </div>
  );
}
