type Props = {
  values:      number[];
  width?:      number;
  height?:     number;
  color?:      string;
  fillOpacity?: number;
};

function buildPath(values: number[], w: number, h: number): string {
  if (values.length < 2) return "";
  const min   = Math.min(...values);
  const max   = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - ((v - min) / range) * (h * 0.8) - h * 0.1,
  }));

  return pts.reduce((d, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cx   = (prev.x + p.x) / 2;
    return `${d} C ${cx.toFixed(1)} ${prev.y.toFixed(1)} ${cx.toFixed(1)} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, "");
}

export function Sparkline({ values, width = 64, height = 24, color = "#6366f1", fillOpacity = 0.15 }: Props) {
  if (values.length < 2) {
    return (
      <svg width={width} height={height}>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      </svg>
    );
  }

  const line = buildPath(values, width, height);
  const fill = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${color.replace("#", "")})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
