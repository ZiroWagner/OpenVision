from redis.asyncio import Redis
from redis.asyncio import from_url as redis_from_url

from app.core.config import get_settings

settings = get_settings()


async def get_redis() -> Redis:
    redis = redis_from_url(
        settings.redis_url,
        decode_responses=True,
    )
    try:
        yield redis
    finally:
        await redis.aclose()
