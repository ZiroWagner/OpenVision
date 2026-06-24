import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AlertCreate(BaseModel):
    event_id: uuid.UUID | None = None
    alert_type: str = Field(..., max_length=50)
    channel: str = Field(default="telegram", max_length=50)
    message: str | None = None


class AlertResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID | None
    alert_type: str
    channel: str
    status: str
    message: str | None
    sent_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
