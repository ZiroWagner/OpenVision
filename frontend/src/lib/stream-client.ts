export class StreamClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private _disposed = false;

  onFrame: ((blob: Blob) => void) | null = null;
  onStatus: ((status: string) => void) | null = null;

  connect(cameraId: string): void {
    this._disposed = false;
    this.reconnectAttempts = 0;
    this._doConnect(cameraId);
  }

  disconnect(): void {
    this._disposed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this._closeWs();
  }

  private _doConnect(cameraId: string): void {
    if (this._disposed) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/stream/${cameraId}`;

    this._closeWs();
    this.ws = new WebSocket(wsUrl);
    this.ws.binaryType = "blob";

    this.onStatus?.("connecting");

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.onStatus?.("live");
    };

    this.ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        this.onFrame?.(event.data);
      } else if (typeof event.data === "string") {
        if (event.data === "STREAM_ENDED" || event.data === "STREAM_TIMEOUT" || event.data === "STREAM_ERROR") {
          this.onStatus?.("offline");
          this._scheduleReconnect(cameraId);
        }
      }
    };

    this.ws.onclose = () => {
      if (!this._disposed) {
        this.onStatus?.("offline");
        this._scheduleReconnect(cameraId);
      }
    };

    this.ws.onerror = () => {
      this.onStatus?.("offline");
    };
  }

  private _scheduleReconnect(cameraId: string): void {
    if (this._disposed || this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 10000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this._doConnect(cameraId);
    }, delay);
  }

  private _closeWs(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }
}
