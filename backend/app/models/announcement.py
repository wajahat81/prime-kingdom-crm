from typing import TypedDict, Optional
from datetime import datetime

class AnnouncementModel(TypedDict):
    id: str
    message: str
    is_active: bool
    created_by: Optional[str]
    created_at: datetime