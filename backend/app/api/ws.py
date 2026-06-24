import json

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis

from app.core.redis import get_redis

router = APIRouter()

active_connections: dict[str, list[WebSocket]] = {
    "events": [],
    "alerts": [],
    "cameras": [],
}


@router.websocket("/ws/{channel}")
async def websocket_endpoint(
    websocket: WebSocket,
    channel: str,
    redis: Redis = Depends(get_redis),
):
    if channel not in active_connections:
        await websocket.close(code=4004, reason=f"Invalid channel: {channel}")
        return

    await websocket.accept()
    active_connections[channel].append(websocket)

    pubsub = redis.pubsub()
    await pubsub.subscribe(f"openvision:{channel}")

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                await websocket.send_text(data)
    except WebSocketDisconnect:
        pass
    finally:
        active_connections[channel].remove(websocket)
        await pubsub.unsubscribe(f"openvision:{channel}")
        await pubsub.close()


async def broadcast(channel: str, data: dict) -> None:
    message = json.dumps(data, default=str)
    for connection in active_connections.get(channel, []):
        try:
            await connection.send_text(message)
        except Exception:
            pass
