export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-text-primary">Dashboard</h2>
        <p className="text-text-secondary mt-1 text-sm">Timeline do seu dia</p>
      </div>
      <div className="rounded-lg border border-border bg-background-secondary p-8 text-center">
        <p className="text-text-muted text-sm">
          Timeline em breve. Crie tarefas e planeje seu dia.
        </p>
      </div>
    </div>
  );
}
