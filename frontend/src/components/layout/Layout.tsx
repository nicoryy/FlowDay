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
      {/* Sidebar — visível apenas em md+ */}
      <nav className="hidden md:flex w-56 bg-background-secondary border-r border-border flex-col p-4 gap-1 flex-shrink-0">
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

      {/* Área de conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar mobile — logo + título da rota */}
        <header className="md:hidden flex items-center px-4 py-3 bg-background-secondary border-b border-border flex-shrink-0">
          <h1 className="font-mono text-base font-bold text-purple-accent tracking-tight">
            FlowDay
          </h1>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — visível apenas em mobile (< md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch bg-background-secondary border-t border-border">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-purple-accent"
                  : "text-text-muted hover:text-text-secondary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? "text-purple-accent" : "text-text-muted"} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
