from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CallCreate(BaseModel):
    client_name: str = Field(..., min_length=2)
    employee_id: str
    status: str = Field(..., pattern="^(pending|retained|not_retained)$")
    call_duration: Optional[str] = None

class CallUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|retained|not_retained)$")

class CallResponse(BaseModel):
    id: str
    client_name: str
    employee_id: str
    status: str
    created_by: str
    created_at: datetime
    call_duration: Optional[str] = None
    commission: Optional[float] = None