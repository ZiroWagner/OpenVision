from aiortc import RTCSessionDescription
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.stream_manager import (
    CameraVideoTrack,
    create_peer_connection,
    remove_peer_connection,
)

router = APIRouter()


@router.websocket("/ws/stream/{camera_id}")
async def stream_websocket(websocket: WebSocket, camera_id: str):
    await websocket.accept()

    pc = create_peer_connection()

    @pc.on("icecandidate")
    async def on_icecandidate(candidate):
        if candidate:
            try:
                await websocket.send_json({
                    "type": "candidate",
                    "candidate": {
                        "component": candidate.component,
                        "foundation": candidate.foundation,
                        "ip": candidate.ip,
                        "port": candidate.port,
                        "priority": candidate.priority,
                        "protocol": candidate.protocol,
                        "type": candidate.type,
                        "relatedAddress": candidate.relatedAddress,
                        "relatedPort": candidate.relatedPort,
                        "sdpMLineIndex": candidate.sdpMLineIndex,
                        "sdpMid": candidate.sdpMid,
                        "tcpType": candidate.tcpType,
                    },
                })
            except Exception:
                pass

    @pc.on("iceconnectionstatechange")
    async def on_ice_state():
        if pc.iceConnectionState in ("failed", "closed", "disconnected"):
            await remove_peer_connection(str(id(pc)))

    try:
        track = CameraVideoTrack(f"rtsp://mediamtx:8554/{camera_id}")
        pc.addTrack(track)

        data = await websocket.receive_json()

        if data.get("type") == "offer":
            await pc.setRemoteDescription(
                RTCSessionDescription(sdp=data["sdp"], type="offer")
            )
            answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)

            await websocket.send_json({
                "type": "answer",
                "sdp": pc.localDescription.sdp,
            })

            while True:
                msg = await websocket.receive_json()
                if msg.get("type") == "candidate":
                    cand = msg["candidate"]
                    await pc.addIceCandidate({
                        "component": cand.get("component"),
                        "foundation": cand.get("foundation"),
                        "ip": cand.get("ip"),
                        "port": cand.get("port"),
                        "priority": cand.get("priority"),
                        "protocol": cand.get("protocol"),
                        "type": cand.get("type"),
                        "relatedAddress": cand.get("relatedAddress"),
                        "relatedPort": cand.get("relatedPort"),
                        "sdpMLineIndex": cand.get("sdpMLineIndex"),
                        "sdpMid": cand.get("sdpMid"),
                        "tcpType": cand.get("tcpType"),
                    })

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await remove_peer_connection(str(id(pc)))
