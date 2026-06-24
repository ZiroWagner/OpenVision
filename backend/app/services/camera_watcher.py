import asyncio
import logging

from sqlalchemy import select

from app.core.database import async_session_factory
from app.models.camera import Camera

logger = logging.getLogger(__name__)


async def check_camera_health(camera: Camera) -> bool:
    try:
        proc = await asyncio.create_subprocess_exec(
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_streams",
            "-timeout", "5000000",
            "-rtsp_transport", "tcp",
            camera.rtsp_url,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            await asyncio.wait_for(proc.communicate(), timeout=10)
        except TimeoutError:
            proc.kill()
            return False
        return proc.returncode == 0
    except FileNotFoundError:
        logger.warning("ffprobe not found, skipping camera health check")
        return True


async def camera_watch_loop(interval: int = 30):
    logger.info("Camera watch loop started")
    while True:
        try:
            async with async_session_factory() as db:
                result = await db.execute(
                    select(Camera).where(Camera.enabled == True)  # noqa: E712
                )
                cameras = result.scalars().all()

                for camera in cameras:
                    is_healthy = await check_camera_health(camera)
                    new_status = "online" if is_healthy else "offline"
                    if camera.status != new_status:
                        camera.status = new_status
                        logger.info(
                            "Camera %s (%s) status changed to %s",
                            camera.name, camera.id, new_status,
                        )

                await db.commit()
        except Exception as e:
            logger.error("Camera watch loop error: %s", e)

        await asyncio.sleep(interval)
