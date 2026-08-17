from pydantic import BaseModel, Field
from typing import Optional

class AnnouncementCreate(BaseModel):
    message: str = Field(..., min_length=5, max_length=255, strip_whitespace=True)

class AnnouncementResponse(BaseModel):
    id: str
    message: str
    is_active: bool
    created_at: Optional[str] = None
    created_by: Optional[str] = None