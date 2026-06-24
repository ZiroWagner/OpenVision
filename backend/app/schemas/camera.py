import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CameraBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    rtsp_url: str = Field(..., min_length=1)
    location: str | None = None
    enabled: bool = True
    fps: int = Field(default=15, ge=1, le=60)
    width: int = Field(default=1280, ge=320, le=7680)
    height: int = Field(default=720, ge=240, le=4320)


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    name: str | None = None
    rtsp_url: str | None = None
    location: str | None = None
    enabled: bool | None = None
    status: str | None = None
    fps: int | None = Field(default=None, ge=1, le=60)
    width: int | None = Field(default=None, ge=320, le=7680)
    height: int | None = Field(default=None, ge=240, le=4320)


class CameraResponse(CameraBase):
    id: uuid.UUID
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CameraStatusCount(BaseModel):
    total: int
    online: int
    offline: int
    error: int
