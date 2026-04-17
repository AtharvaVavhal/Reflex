import { useState } from "react";
import { DecisionResult, Intervention, UserProfile } from "../stages/types";
import { PipelineOutput } from "../core/pipeline";

type Props = {
  profile: UserProfile;
  decision: DecisionResult;
  intervention: Intervention;
  action: PipelineOutput;
};

type StageEntry = {
  name: string;
  fields: Array<{ key: string; value: string }>;
};

function buildStages({ profile, decision, intervention, action }: Props): StageEntry[] {
  return [
    {
      name: "Context",
      fields: [
        { key: "user",    value: "user-1" },
        { key: "session", value: `session-${Date.now() % 10000}` },
      ],
    },
    {
      name: "Behavior",
      fields: [
        { key: "engagement", value: profile.engagement.toFixed(2) },
      ],
    },
    {
      name: "Decision",
      fields: [
        { key: "best",       value: decision.best },
        { key: "confidence", value: `${Math.round((decision.ranked[0]?.score ?? 0) * 100)}%` },
      ],
    },
    {
      name: "Intervention",
      fields: [
        { key: "type",      value: intervention.decision },
        { key: "intensity", value: intervention.intensity },
      ],
    },
    {
      name: "Action",
      fields: [
        { key: "action",    value: action.action },
        { key: "intensity", value: action.intensity },
      ],
    },
  ];
}

function StageRow({
  entry,
  index,
  total,
}: {
  entry: StageEntry;
  index: number;
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const isLast = index === total - 1;

  return (
    <div style={{ display: "flex", gap: 0 }}>

      <div style={s.track}>
        <div style={s.dot} />
        {!isLast && <div style={s.line} />}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 4 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={s.stageBtn}
          aria-expanded={open}
        >
          <span style={s.stageName}>{entry.name}</span>
          <span style={{
            ...s.chevron,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}>
            ▾
          </span>
        </button>

        {open && (
          <div style={s.fields}>
            {entry.fields.map(({ key, value }) => (
              <div key={key} style={s.field}>
                <span style={s.fieldKey}>{key}</span>
                <span style={s.fieldValue}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export function TimelinePanel(props: Props) {
  const stages = buildStages(props);

  return (
    <div style={s.panel}>
      <span style={s.sectionLabel}>Pipeline</span>
      <div>
        {stages.map((entry, i) => (
          <StageRow key={entry.name} entry={entry} index={i} total={stages.length} />
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    background: "#fcfcfd",
    borderRadius: 14,
    padding: "18px 18px",
    boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
  },
  sectionLabel: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#aaa",
    marginBottom: 14,
  },
  track: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: 24,
    flexShrink: 0,
    paddingTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#378add",
    flexShrink: 0,
    zIndex: 1,
  },
  line: {
    flex: 1,
    width: 1,
    background: "#e5e7eb",
    marginTop: 4,
    minHeight: 12,
  },
  stageBtn: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    background: "none",
    border: "none",
    padding: "6px 0",
    cursor: "pointer",
    textAlign: "left" as const,
  },
  stageName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111",
  },
  chevron: {
    fontSize: 10,
    color: "#ccc",
    transition: "transform 150ms ease",
    display: "inline-block",
  },
  fields: {
    paddingBottom: 8,
  },
  field: {
    display: "flex",
    justifyContent: "space-between",
    padding: "3px 0",
  },
  fieldKey: {
    fontSize: 11,
    color: "#aaa",
    fontWeight: 500,
  },
  fieldValue: {
    fontSize: 11,
    fontFamily: "'SF Mono', 'Fira Code', 'Menlo', monospace",
    color: "#444",
    fontWeight: 500,
  },
};  