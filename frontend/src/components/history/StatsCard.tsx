interface StatsCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  negative?: boolean;
}

export function StatsCard({ label, value, sub, highlight, negative }: StatsCardProps) {
  const valueColor = negative
    ? "text-red-400"
    : highlight
    ? "text-purple-accent"
    : "text-text-primary";

  return (
    <div className={`rounded-lg border bg-background-secondary p-4 space-y-1 ${negative ? "border-red-500/20" : "border-border"}`}>
      <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-mono font-semibold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  );
}
