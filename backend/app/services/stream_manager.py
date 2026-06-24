import asyncio
import uuid

import av
from aiortc import RTCPeerConnection, VideoStreamTrack

from app.core.config import get_settings

settings = get_settings()

pc_pool: dict[str, RTCPeerConnection] = {}


class CameraVideoTrack(VideoStreamTrack):
    def __init__(self, rtsp_url: str) -> None:
        super().__init__()
        self.container = av.open(rtsp_url)
        self.stream = self.container.streams.video[0]

    async def recv(self) -> av.VideoFrame:
        await asyncio.sleep(0)
        for frame in self.container.decode(video=0):
            frame.pts = None
            return frame
        raise StopAsyncIteration


def create_peer_connection() -> RTCPeerConnection:
    pc = RTCPeerConnection()
    pc_id = str(uuid.uuid4())
    pc_pool[pc_id] = pc
    return pc


def get_peer_connection(pc_id: str) -> RTCPeerConnection | None:
    return pc_pool.get(pc_id)


async def remove_peer_connection(pc_id: str) -> None:
    pc = pc_pool.pop(pc_id, None)
    if pc:
        await pc.close()
