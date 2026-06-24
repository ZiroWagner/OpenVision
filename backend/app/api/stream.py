import asyncio
import uuid as uuid_lib

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.camera import Camera
from app.services.stream_manager import FrameReader

router = APIRouter()


@router.websocket("/ws/stream/{camera_id}")
async def stream_websocket(
    websocket: WebSocket,
    camera_id: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        uid = uuid_lib.UUID(camera_id)
    except ValueError:
        await websocket.close(code=4004, reason="Invalid camera ID")
        return

    result = await db.execute(select(Camera).where(Camera.id == uid))
    camera = result.scalar_one_or_none()
    if camera is None:
        await websocket.close(code=4004, reason="Camera not found")
        return

    await websocket.accept()

    reader = FrameReader(camera.rtsp_url, fps=camera.fps)

    try:
        while True:
            jpeg = await asyncio.wait_for(reader.get_jpeg_frame(), timeout=10.0)
            if jpeg is None:
                await websocket.send_text("STREAM_ENDED")
                break
            await websocket.send_bytes(jpeg)
            await asyncio.sleep(reader.frame_interval)
    except TimeoutError:
        await websocket.send_text("STREAM_TIMEOUT")
    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.send_text("STREAM_ERROR")
        except Exception:
            pass
    finally:
        await reader.close()
