import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, CheckSquare, History, Settings } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/tasks", icon: CheckSquare, label: "Tarefas" },
  { to: "/history", icon: History, label: "Histórico" },
  { to: "/settings", icon: Settings, label: "Config" },
] as const;

export function Layout() {
  return (
    <div className="flex h-screen bg-background">
      <nav className="w-56 bg-background-secondary border-r border-border flex flex-col p-4 gap-1">
        <div className="mb-6 px-2">
          <h1 className="font-mono text-lg font-bold text-purple-accent tracking-tight">
            FlowDay
          </h1>
          <p className="text-xs text-text-muted mt-0.5">auto-scheduling</p>
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-purple-muted text-purple-accent"
                  : "text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
              }`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
