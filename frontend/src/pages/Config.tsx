import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { cn } from "../lib/utils";

interface CameraData {
  id: string;
  name: string;
  rtsp_url: string;
  location: string | null;
  status: string;
  enabled: boolean;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

type Tab = "cameras" | "alerts" | "users";

export function Config() {
  const [activeTab, setActiveTab] = useState<Tab>("cameras");
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);

  useEffect(() => {
    fetch("/api/cameras")
      .then((r) => r.json())
      .then(setCameras)
      .catch(() => {});
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(
          data.map((u: UserData) => ({ ...u, is_active: true } satisfies UserData)),
        );
      })
      .catch(() => {});
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "cameras", label: "Cámaras" },
    { key: "alerts", label: "Alertas" },
    { key: "users", label: "Usuarios" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Administra cámaras, alertas y usuarios del sistema
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "cameras" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Nueva Cámara
            </button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">URL RTSP</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Ubicación</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cameras.map((cam) => (
                  <tr key={cam.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm text-foreground">{cam.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[200px]">
                      {cam.rtsp_url}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {cam.location || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                          cam.status === "online"
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-red-500/20 text-red-500",
                        )}
                      >
                        {cam.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button type="button" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cameras.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No hay cámaras configuradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Configuración de Alertas</p>
          <p className="text-sm mt-1">
            Disponible en Fase 6 — Telegram y WhatsApp
          </p>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Rol</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm text-foreground">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-sm capitalize text-foreground">{user.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                          user.is_active
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {user.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No hay usuarios registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
