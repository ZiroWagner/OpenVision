import { type FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "../lib/api";

interface CameraData {
  id: string;
  name: string;
  rtsp_url: string;
  location: string | null;
  status: string;
  enabled: boolean;
  fps: number;
  width: number;
  height: number;
}

interface CameraModalProps {
  open: boolean;
  camera: CameraData | null;
  onClose: () => void;
  onSaved: () => void;
}

export function CameraModal({ open, camera, onClose, onSaved }: CameraModalProps) {
  const [name, setName] = useState("");
  const [rtspUrl, setRtspUrl] = useState("");
  const [location, setLocation] = useState("");
  const [fps, setFps] = useState("15");
  const [width, setWidth] = useState("1280");
  const [height, setHeight] = useState("720");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (camera) {
      setName(camera.name);
      setRtspUrl(camera.rtsp_url);
      setLocation(camera.location ?? "");
      setFps(String(camera.fps));
      setWidth(String(camera.width));
      setHeight(String(camera.height));
    } else {
      setName("");
      setRtspUrl("");
      setLocation("");
      setFps("15");
      setWidth("1280");
      setHeight("720");
    }
    setError(null);
  }, [camera, open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (camera) {
        await api.cameras.update(camera.id, {
          name,
          rtsp_url: rtspUrl,
          location: location || null,
          fps: Number(fps),
          width: Number(width),
          height: Number(height),
        });
      } else {
        await api.cameras.create({
          name,
          rtsp_url: rtspUrl,
          location: location || null,
          fps: Number(fps),
          width: Number(width),
          height: Number(height),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {camera ? "Editar Cámara" : "Nueva Cámara"}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">URL RTSP</label>
            <input
              type="text"
              required
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              placeholder="rtsp://mediamtx:8554/cam1"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Ubicación</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">FPS</label>
              <input
                type="number"
                min={1}
                max={60}
                value={fps}
                onChange={(e) => setFps(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Ancho</label>
              <input
                type="number"
                min={320}
                max={7680}
                step={10}
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Alto</label>
              <input
                type="number"
                min={240}
                max={4320}
                step={10}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Guardando..." : camera ? "Guardar Cambios" : "Crear Cámara"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
