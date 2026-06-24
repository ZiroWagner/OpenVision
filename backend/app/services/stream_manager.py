import asyncio
import io

import av


def _encode_jpeg(frame: av.VideoFrame, quality: int = 75) -> bytes:
    img = frame.to_image()
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality)
    return buf.getvalue()


class LocalFileReader:
    def __init__(self, file_path: str, fps: int = 30):
        self.file_path = file_path
        self.frame_interval = 1.0 / fps
        self._container: av.container.InputContainer | None = None
        self._lock = asyncio.Lock()

    async def _open(self) -> bool:
        try:
            loop = asyncio.get_running_loop()
            self._container = await loop.run_in_executor(
                None,
                lambda: av.open(str(self.file_path)),
            )
            return True
        except Exception:
            self._container = None
            return False

    async def get_jpeg_frame(self) -> bytes | None:
        async with self._lock:
            if self._container is None:
                if not await self._open():
                    return None

            try:
                loop = asyncio.get_running_loop()

                def _decode() -> bytes | None:
                    for frame in self._container.decode(video=0):
                        return _encode_jpeg(frame)
                    return None

                jpeg = await loop.run_in_executor(None, _decode)
                if jpeg is not None:
                    return jpeg

                self._container.close()
                self._container = None
                return None

            except Exception:
                try:
                    if self._container:
                        self._container.close()
                except Exception:
                    pass
                self._container = None
                return None

    async def close(self):
        async with self._lock:
            if self._container:
                try:
                    self._container.close()
                except Exception:
                    pass
                self._container = None


class FrameReader:
    def __init__(self, rtsp_url: str, fps: int = 15):
        self.rtsp_url = rtsp_url
        self.frame_interval = 1.0 / fps
        self._container: av.container.InputContainer | None = None
        self._lock = asyncio.Lock()

    async def _open(self) -> bool:
        try:
            loop = asyncio.get_running_loop()
            self._container = await loop.run_in_executor(
                None,
                lambda: av.open(
                    self.rtsp_url,
                    options={
                        "rtsp_transport": "tcp",
                        "stimeout": "3000000",
                        "max_delay": "500000",
                    },
                ),
            )
            return True
        except Exception:
            self._container = None
            return False

    async def get_jpeg_frame(self) -> bytes | None:
        async with self._lock:
            if self._container is None:
                if not await self._open():
                    return None

            try:
                loop = asyncio.get_running_loop()

                def _decode() -> bytes | None:
                    for frame in self._container.decode(video=0):
                        return _encode_jpeg(frame)
                    return None

                jpeg = await loop.run_in_executor(None, _decode)
                if jpeg is not None:
                    return jpeg

                self._container.close()
                self._container = None
                return None

            except Exception:
                try:
                    if self._container:
                        self._container.close()
                except Exception:
                    pass
                self._container = None
                return None

    async def close(self):
        async with self._lock:
            if self._container:
                try:
                    self._container.close()
                except Exception:
                    pass
                self._container = None


def create_reader(url: str, fps: int = 15) -> LocalFileReader | FrameReader:
    if url.startswith("rtsp://") or url.startswith("rtsps://"):
        return FrameReader(url, fps=fps)
    return LocalFileReader(url, fps=fps)
