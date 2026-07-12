import { useState, useEffect, useRef } from "react";

const CHECK_ITEMS = [
  { label: "Fetching video" },
  { label: "Transcribing audio" },
  { label: "Scoring moments for attention" },
  { label: "Rendering clips" },
];

export default function ProcessingStage({ onDone }) {
  // 0 = pending, 1 = active, 2 = done
  const [statusList, setStatusList] = useState([1, 0, 0, 0]);
  const timeouts = useRef([]);

  useEffect(() => {
    let delay = 0;
    CHECK_ITEMS.forEach((_, i) => {
      delay += 900;
      timeouts.current.push(
        setTimeout(() => {
          setStatusList((prev) => {
            const next = [...prev];
            next[i] = 2;
            if (i + 1 < CHECK_ITEMS.length) next[i + 1] = 1;
            return next;
          });
        }, delay)
      );
    });
    timeouts.current.push(setTimeout(onDone, delay + 700));
    return () => timeouts.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="clipflow-processing-wrap">
      <div className="clipflow-spinner" />
      <p className="clipflow-processing-title">Finding the moment</p>
      <p className="clipflow-processing-sub">This usually takes under a minute.</p>
      <div className="clipflow-checklist">
        {CHECK_ITEMS.map((item, i) => (
          <div className="clipflow-check-row" key={item.label}>
            <div
              className={
                "clipflow-check-icon " +
                (statusList[i] === 2
                  ? "done"
                  : statusList[i] === 1
                  ? "active"
                  : "pending")
              }
            >
              {statusList[i] === 2 ? "✓" : statusList[i] === 1 ? "···" : i + 1}
            </div>
            <div
              className={"clipflow-check-text" + (statusList[i] === 0 ? " pending" : "")}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
