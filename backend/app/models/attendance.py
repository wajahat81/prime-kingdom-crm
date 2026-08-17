from typing import TypedDict, Optional
from datetime import datetime

class AttendanceModel(TypedDict):
    id: str
    employee_id: str
    check_in: datetime
    check_out: Optional[datetime]
    date: str  # YYYY-MM-DD