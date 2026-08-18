from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AttendanceResponse(BaseModel):
    id: str
    employee_id: str
    check_in: datetime
    check_out: Optional[datetime]
    date: str
    status: Optional[str] = "checked_out" 

# New Schema for Approve/Reject Modal
class AttendanceStatusUpdate(BaseModel):
    status: str

# New Schema for the Edit Times Modal
class AttendanceTimeUpdate(BaseModel):
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None