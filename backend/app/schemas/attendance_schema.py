from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AttendanceResponse(BaseModel):
    id: str
    employee_id: str
    check_in: datetime
    check_out: Optional[datetime]
    date: str