export const STAGES = [
  { key: "login", label: "Sign in" },
  { key: "import", label: "Import" },
  { key: "review", label: "Review" },
  { key: "publish", label: "Publish" },
];

export function stageIndexFor(step) {
  if (step === "login") return 0;
  if (step === "import" || step === "processing") return 1;
  if (step === "review") return 2;
  return 3; // publish, done
}

export default function Stepper({ step }) {
  const idx = stageIndexFor(step);
  return (
    <div className="clipflow-stepper">
      {STAGES.map((s, i) => (
        <div
          className="clipflow-step"
          key={s.key}
          style={{ flex: i === STAGES.length - 1 ? "0 0 auto" : 1 }}
        >
          <div
            className={
              "clipflow-step-dot" +
              (i < idx ? " done" : i === idx ? " current" : "")
            }
          >
            {i < idx ? "✓" : i + 1}
          </div>
          <div className={"clipflow-step-label" + (i <= idx ? " active" : "")}>
            {s.label}
          </div>
          {i < STAGES.length - 1 && <div className="clipflow-step-line" />}
        </div>
      ))}
    </div>
  );
}
