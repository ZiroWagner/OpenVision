import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    camera_id: uuid.UUID
    event_type: str = Field(..., max_length=50)
    image_path: str | None = None
    extra_data: str | None = None


class EventResponse(BaseModel):
    id: uuid.UUID
    camera_id: uuid.UUID
    event_type: str
    image_path: str | None
    extra_data: str | None
    timestamp: datetime

    model_config = {"from_attributes": True}
