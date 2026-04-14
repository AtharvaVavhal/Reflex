import React from "react";

// ─── Card ────────────────────────────────────────────────────────────────────

type CardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glass?: boolean;
};

export function Card({ children, className = "", style, glass }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: glass ? "rgba(24,24,27,0.7)" : "#18181b",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        backdropFilter: glass ? "blur(12px)" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "blue" | "green" | "red" | "amber" | "indigo" | "outline";

const BADGE_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  default:  { background: "rgba(255,255,255,0.06)", color: "#a1a1aa" },
  blue:     { background: "rgba(59,130,246,0.12)",  color: "#93c5fd" },
  green:    { background: "rgba(34,197,94,0.12)",   color: "#86efac" },
  red:      { background: "rgba(239,68,68,0.12)",   color: "#fca5a5" },
  amber:    { background: "rgba(245,158,11,0.12)",  color: "#fcd34d" },
  indigo:   { background: "rgba(99,102,241,0.15)",  color: "#a5b4fc" },
  outline:  { background: "transparent", color: "#71717a", border: "1px solid rgba(255,255,255,0.1)" },
};

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  style?: React.CSSProperties;
};

export function Badge({ children, variant = "default", className = "", style }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
        ...BADGE_STYLES[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize    = "sm" | "md" | "lg";

const BTN_VARIANT: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: "#6366f1", color: "#fff", border: "none" },
  secondary: { background: "rgba(255,255,255,0.06)", color: "#e4e4e7", border: "1px solid rgba(255,255,255,0.1)" },
  ghost:     { background: "transparent", color: "#a1a1aa", border: "none" },
  danger:    { background: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" },
};

const BTN_SIZE: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "6px 14px", fontSize: 12, borderRadius: 8 },
  md: { padding: "9px 20px", fontSize: 13, borderRadius: 10 },
  lg: { padding: "12px 28px", fontSize: 15, borderRadius: 12 },
};

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  className = "",
  style,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontWeight: 600,
        letterSpacing: "0.01em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 150ms ease",
        fontFamily: "inherit",
        ...BTN_VARIANT[variant],
        ...BTN_SIZE[size],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{
      display: "block",
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "#52525b",
      ...style,
    }}>
      {children}
    </span>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      height: 1,
      background: "rgba(255,255,255,0.06)",
      width: "100%",
      ...style,
    }} />
  );
}
