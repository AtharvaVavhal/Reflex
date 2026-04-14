import { useState } from "react";
import { DecisionResult, Intervention, UserProfile } from "../stages/types";
import { PipelineOutput } from "../core/pipeline";
import { Card, SectionLabel } from "./ui";

type Props = {
  profile: UserProfile;
  decision: DecisionResult;
  intervention: Intervention;
  action: PipelineOutput;
};

type StageEntry = {
  name: string;
  status: "done";
  fields: Array<{ key: string; value: string }>;
};

function buildStages({ profile, decision, intervention, action }: Props): StageEntry[] {
  return [
    {
      name: "Context",
      status: "done",
      fields: [
        { key: "user",    value: "user-1" },
        { key: "session", value: `session-${Date.now() % 10000}` },
      ],
    },
    {
      name: "Behavior",
      status: "done",
      fields: [
        { key: "engagement",  value: profile.engagement.toFixed(2) },
        { key: "churn risk",  value: profile.churnRisk.toFixed(2)  },
        { key: "impulsivity", value: profile.impulsivity.toFixed(2) },
      ],
    },
    {
      name: "Decision",
      status: "done",
      fields: [
        { key: "best",    value: decision.best },
        { key: "score",   value: (decision.ranked[0]?.score ?? 0).toFixed(4) },
        { key: "options", value: decision.ranked.length.toString() },
      ],
    },
    {
      name: "Intervention",
      status: "done",
      fields: [
        { key: "decision",  value: intervention.decision },
        { key: "intensity", value: intervention.intensity },
      ],
    },
    {
      name: "Action",
      status: "done",
      fields: [
        { key: "action",    value: action.action },
        { key: "intensity", value: action.intensity },
      ],
    },
  ];
}

function StageRow({ entry, index, total }: { entry: StageEntry; index: number; total: number }) {
  const [open, setOpen] = useState(false);
  const isLast = index === total - 1;

  return (
    <div style={{ display: "flex", gap: 0 }}>
      {/* Track */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        width: 20, flexShrink: 0, paddingTop: 10,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#6366f1",
          boxShadow: "0 0 6px rgba(99,102,241,0.5)",
          flexShrink: 0, zIndex: 1,
        }} />
        {!isLast && (
          <div style={{
            flex: 1, width: 1,
            background: "rgba(255,255,255,0.06)",
            marginTop: 4, minHeight: 12,
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 4 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            width: "100%", background: "none", border: "none",
            padding: "5px 0 5px 10px", cursor: "pointer", textAlign: "left",
          }}
          aria-expanded={open}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7" }}>{entry.name}</span>
          <span style={{
            fontSize: 9, color: "#3f3f46",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            display: "inline-block", transition: "transform 150ms ease",
          }}>
            ▾
          </span>
        </button>

        {open && (
          <div style={{ padding: "2px 10px 8px" }}>
            {entry.fields.map(({ key, value }) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span style={{ fontSize: 11, color: "#52525b", fontWeight: 500 }}>{key}</span>
                <span style={{ fontSize: 11, color: "#a1a1aa", fontFamily: "var(--font-mono)", fontWeight: 500 }}>{value}</span>
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
    <Card style={{ padding: "18px 20px" }}>
      <SectionLabel style={{ marginBottom: 16 }}>Pipeline</SectionLabel>
      {stages.map((entry, i) => (
        <StageRow key={entry.name} entry={entry} index={i} total={stages.length} />
      ))}
    </Card>
  );
}
