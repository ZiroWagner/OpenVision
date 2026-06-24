import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Monitor,
  Bell,
  Settings,
  Eye,
} from "lucide-react";
import { cn } from "../lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/monitoreo", icon: Monitor, label: "Monitoreo" },
  { to: "/eventos", icon: Bell, label: "Eventos" },
  { to: "/config", icon: Settings, label: "Configuración" },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <Eye className="h-7 w-7 text-primary" />
        <span className="text-lg font-bold text-foreground">OpenVision</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">OpenVision v0.1.0</p>
      </div>
    </aside>
  );
}
