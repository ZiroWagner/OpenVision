import { useEffect, useRef, useState } from "react";
import { StreamClient } from "../lib/stream-client";
import { Wifi, WifiOff } from "lucide-react";

interface VideoPlayerProps {
  cameraId: string;
  cameraName: string;
  location?: string | null;
}

export function VideoPlayer({ cameraId, cameraName, location }: VideoPlayerProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const clientRef = useRef<StreamClient | null>(null);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">(
    "connecting",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new StreamClient();
    clientRef.current = client;

    client.onFrame = (blob) => {
      const url = URL.createObjectURL(blob);
      if (imgRef.current) {
        const prev = imgRef.current.src;
        imgRef.current.src = url;
        if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      }
    };

    client.onStatus = (newStatus) => {
      if (newStatus === "live") {
        setStatus("live");
        setError(null);
      } else if (newStatus === "connecting") {
        setStatus("connecting");
      } else {
        setStatus("offline");
        setError("Señal perdida, reconectando...");
      }
    };

    client.connect(cameraId);

    return () => {
      client.disconnect();
    };
  }, [cameraId]);

  return (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
      <img
        ref={imgRef}
        alt={cameraName}
        className="w-full h-full object-cover"
      />

      {status === "connecting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm">Conectando...</span>
          </div>
        </div>
      )}

      {status === "offline" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
          <div className="flex flex-col items-center gap-2 text-red-500">
            <WifiOff className="h-8 w-8" />
            <span className="text-sm font-medium">
              {error || "Señal perdida"}
            </span>
          </div>
        </div>
      )}

      <div className="absolute top-2 right-2">
        {status === "live" ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-medium">
            <Wifi className="h-3 w-3" /> En vivo
          </span>
        ) : status === "connecting" ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-medium">
            Conectando...
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-medium">
            <WifiOff className="h-3 w-3" /> Offline
          </span>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <h3 className="text-white font-semibold text-sm">{cameraName}</h3>
        {location && (
          <p className="text-white/70 text-xs">{location}</p>
        )}
      </div>
    </div>
  );
}
