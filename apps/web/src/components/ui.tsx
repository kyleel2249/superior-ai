export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--ink-900)",
        border: "1px solid var(--ink-700)",
        borderRadius: 10,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  operational: "var(--ok)",
  ok: "var(--ok)",
  AVAILABLE: "var(--ok)",
  degraded: "var(--warn)",
  DEGRADED: "var(--warn)",
  outage: "var(--err)",
  ERROR: "var(--err)",
  unknown: "var(--idle)",
  CONFIGURATION_REQUIRED: "var(--idle)",
};

export function StatusDot({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "var(--idle)";
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${color}`,
      }}
    />
  );
}
type Tone = "default" | "signal" | "ok" | "warn" | "err";

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: Tone }) {
  const colors: Record<Tone, [string, string]> = {
    default: ["var(--ink-700)", "var(--text-mid)"],
    signal: ["rgba(245,166,35,0.12)", "var(--signal)"],
    ok: ["rgba(74,222,128,0.12)", "var(--ok)"],
    warn: ["rgba(245,166,35,0.12)", "var(--warn)"],
    err: ["rgba(242,84,91,0.12)", "var(--err)"],
  };
  const [bg, fg] = colors[tone];
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontFamily: "var(--mono)",
        padding: "2px 7px",
        borderRadius: 4,
        background: bg,
        color: fg,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid var(--ink-700)" }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--text-hi)" }}>{title}</h1>
      {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--text-mid)" }}>{subtitle}</p>}
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "ok" | "warn" | "err" }) {
  const color = tone === "ok" ? "var(--ok)" : tone === "warn" ? "var(--warn)" : tone === "err" ? "var(--err)" : "var(--text-hi)";
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-low)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: "var(--mono)", color }}>{value}</div>
    </div>
  );
}
