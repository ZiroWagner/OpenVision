import { useEffect, useState } from "react";
import { AlertTriangle, Filter } from "lucide-react";
import { formatTimestamp } from "../lib/utils";

interface Event {
  id: string;
  camera_id: string;
  event_type: string;
  image_path: string | null;
  metadata: string | null;
  timestamp: string;
}

const eventColors: Record<string, string> = {
  person_detected: "bg-blue-500/10 text-blue-500",
  person_stayed: "bg-amber-500/10 text-amber-500",
  line_crossing: "bg-purple-500/10 text-purple-500",
  zone_intrusion: "bg-red-500/10 text-red-500",
};

export function Eventos() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    const url = filter ? `/api/events?event_type=${filter}` : "/api/events";
    fetch(url)
      .then((r) => r.json())
      .then(setEvents)
      .catch(() => {});
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Eventos</h1>
          <p className="text-muted-foreground mt-1">
            Historial de eventos de seguridad
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground"
          >
            <option value="">Todos los eventos</option>
            <option value="person_detected">Persona detectada</option>
            <option value="person_stayed">Permanencia</option>
            <option value="line_crossing">Cruce de línea</option>
            <option value="zone_intrusion">Intrusión</option>
          </select>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <AlertTriangle className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">No hay eventos registrados</p>
          <p className="text-sm mt-1">
            Los eventos aparecerán aquí cuando el sistema detecte actividad
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Tipo
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Cámara
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Fecha
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Captura
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr
                  key={ev.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        eventColors[ev.event_type] ||
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {ev.event_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {ev.camera_id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatTimestamp(ev.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    {ev.image_path ? (
                      <span className="text-xs text-primary">Ver</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
