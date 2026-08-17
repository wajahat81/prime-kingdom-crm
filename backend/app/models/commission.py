from typing import TypedDict
from datetime import datetime

class CommissionModel(TypedDict):
    id: str
    employee_id: str
    total_retained_calls: int
    payout_amount: float
    month: str  # YYYY-MM
    created_at: datetime