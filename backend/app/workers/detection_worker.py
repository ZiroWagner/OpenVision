import json
from datetime import UTC, datetime

import numpy as np
from redis.asyncio import Redis
from redis.asyncio import from_url as redis_from_url

from app.core.config import get_settings
from app.services.detector import YOLODetector

settings = get_settings()
detector = YOLODetector()


async def detection_job(ctx: dict, frame_key: str, camera_id: str) -> dict | None:
    redis: Redis = ctx["redis"]
    frame_data = await redis.get(frame_key)
    if frame_data is None:
        return None

    frame = np.frombuffer(frame_data, dtype=np.uint8)
    detections = detector.predict(frame, classes=[0])

    event_data = {
        "camera_id": camera_id,
        "detections": detections,
        "person_count": sum(1 for d in detections if d["class_id"] == 0),
        "timestamp": datetime.now(UTC).isoformat(),
    }

    await redis.publish(
        f"openvision:detections:{camera_id}",
        json.dumps(event_data, default=str),
    )

    return event_data


class WorkerSettings:
    redis_settings = redis_from_url(settings.redis_url)
    functions = [detection_job]
    max_jobs = 10
    keep_result_seconds = 300
