import { useEffect, useState } from "react";
import {
  Camera,
  Activity,
  AlertTriangle,
  Users,
} from "lucide-react";

interface StatusCount {
  total: number;
  online: number;
  offline: number;
  error: number;
}

interface Event {
  id: string;
  event_type: string;
  camera_id: string;
  timestamp: string;
}

type EventMap = Record<string, number>;

export function Dashboard() {
  const [statusCount, setStatusCount] = useState<StatusCount>({
    total: 0, online: 0, offline: 0, error: 0,
  });
  const [eventCount, setEventCount] = useState(0);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch("/api/cameras/status-count")
      .then((r) => r.json())
      .then(setStatusCount)
      .catch(() => {});

    fetch("/api/events/count")
      .then((r) => r.json())
      .then(setEventCount)
      .catch(() => {});

    fetch("/api/events?limit=5")
      .then((r) => r.json())
      .then(setRecentEvents)
      .catch(() => {});
  }, []);

  const eventTypeCounts: EventMap = {};
  for (const ev of recentEvents) {
    eventTypeCounts[ev.event_type] = (eventTypeCounts[ev.event_type] || 0) + 1;
  }

  const cards = [
    {
      title: "Cámaras",
      value: `${statusCount.online}/${statusCount.total}`,
      subtitle: `${statusCount.offline} offline`,
      icon: Camera,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Eventos Hoy",
      value: eventCount,
      subtitle: "últimas 24h",
      icon: Activity,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Alertas Activas",
      value: statusCount.error,
      subtitle: "requieren atención",
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      title: "Personas Detectadas",
      value: eventTypeCounts["person_detected"] ?? 0,
      subtitle: "en eventos recientes",
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Estado general del sistema de monitoreo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ title, value, subtitle, icon: Icon, color, bg }) => (
          <div
            key={title}
            className="rounded-xl border border-border bg-card p-5 flex items-start gap-4"
          >
            <div className={`rounded-lg ${bg} p-3 ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Eventos Recientes
        </h2>
        {recentEvents.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay eventos recientes. Conecta una cámara para comenzar.
          </p>
        ) : (
          <div className="space-y-2">
            {recentEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {ev.event_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    Cam: {ev.camera_id.slice(0, 8)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(ev.timestamp).toLocaleString("es-ES")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
