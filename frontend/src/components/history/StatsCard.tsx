interface StatsCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

export function StatsCard({ label, value, sub, highlight }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-1">
      <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-mono font-semibold ${highlight ? "text-purple-accent" : "text-text-primary"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  );
}
