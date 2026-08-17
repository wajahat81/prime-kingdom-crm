from typing import TypedDict, Optional
from datetime import datetime

class CallLogModel(TypedDict):
    id: str
    employee_id: str
    client_name: str
    status: str  # 'pending', 'retained', 'not_retained'
    created_by: Optional[str]  # Admin ID who uploaded it
    created_at: datetime