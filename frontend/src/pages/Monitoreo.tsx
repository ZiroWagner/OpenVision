import { useEffect, useState } from "react";
import { Camera, Plus } from "lucide-react";
import { VideoPlayer } from "../components/VideoPlayer";

interface CameraData {
  id: string;
  name: string;
  status: string;
  location: string | null;
  rtsp_url: string;
}

export function Monitoreo() {
  const [cameras, setCameras] = useState<CameraData[]>([]);

  useEffect(() => {
    fetch("/api/cameras")
      .then((r) => r.json())
      .then(setCameras)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitoreo</h1>
          <p className="text-muted-foreground mt-1">
            Visualización de cámaras en tiempo real
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Añadir Cámara
        </button>
      </div>

      {cameras.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Camera className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">No hay cámaras configuradas</p>
          <p className="text-sm mt-1">
            Agrega una cámara RTSP desde la configuración para comenzar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cameras.map((cam) => (
            <div
              key={cam.id}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <VideoPlayer
                cameraId={cam.id}
                cameraName={cam.name}
                location={cam.location}
              />
              <div className="p-4">
                <p className="text-xs text-muted-foreground truncate">
                  {cam.rtsp_url}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
