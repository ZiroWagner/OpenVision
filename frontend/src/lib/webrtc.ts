export class WebRTCClient {
  private pc: RTCPeerConnection | null = null;
  private ws: WebSocket | null = null;

  onRemoteStream: ((stream: MediaStream) => void) | null = null;
  onError: ((error: string) => void) | null = null;

  async connect(cameraId: string): Promise<void> {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/stream/${cameraId}`;

    this.ws = new WebSocket(wsUrl);

    return new Promise((resolve, reject) => {
      if (!this.ws) return reject(new Error("WebSocket not created"));

      this.ws.onopen = async () => {
        try {
          this.pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          });

          this.pc.onicecandidate = (event) => {
            if (event.candidate && this.ws?.readyState === WebSocket.OPEN) {
              this.ws.send(
                JSON.stringify({
                  type: "candidate",
                  candidate: {
                    component: event.candidate.component,
                    foundation: event.candidate.foundation,
                    ip: event.candidate.address ?? "",
                    port: event.candidate.port,
                    priority: event.candidate.priority,
                    protocol: event.candidate.protocol,
                    type: event.candidate.type,
                    relatedAddress: event.candidate.relatedAddress ?? "",
                    relatedPort: event.candidate.relatedPort ?? 0,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdpMid: event.candidate.sdpMid ?? "",
                    tcpType: event.candidate.tcpType ?? "",
                  },
                }),
              );
            }
          };

          this.pc.ontrack = (event) => {
            if (event.streams?.[0] && this.onRemoteStream) {
              this.onRemoteStream(event.streams[0]);
            }
          };

          this.pc.oniceconnectionstatechange = () => {
            if (
              this.pc?.iceConnectionState === "failed" ||
              this.pc?.iceConnectionState === "disconnected"
            ) {
              this.onError?.("Conexión perdida");
            }
          };

          const offer = await this.pc.createOffer();
          await this.pc.setLocalDescription(offer);

          this.ws?.send(
            JSON.stringify({
              type: "offer",
              sdp: this.pc.localDescription?.sdp,
            }),
          );

          this.ws!.onmessage = async (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === "answer" && msg.sdp) {
              await this.pc?.setRemoteDescription(
                new RTCSessionDescription({ type: "answer", sdp: msg.sdp }),
              );
            } else if (msg.type === "candidate" && msg.candidate) {
              await this.pc?.addIceCandidate(
                new RTCIceCandidate(msg.candidate),
              );
            }
          };

          resolve();
        } catch (err) {
          reject(err);
        }
      };

      this.ws.onerror = () => {
        this.onError?.("Error de conexión WebSocket");
        reject(new Error("WebSocket error"));
      };
    });
  }

  disconnect(): void {
    this.pc?.close();
    this.pc = null;
    this.ws?.close();
    this.ws = null;
  }
}
