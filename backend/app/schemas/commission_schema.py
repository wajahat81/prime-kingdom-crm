from pydantic import BaseModel, constr
from typing import Optional

class CommissionCreate(BaseModel):
    employee_id: str
    total_retained_calls: int
    month: constr(pattern=r"^\d{4}-\d{2}$") # Ensures format is YYYY-MM

class CommissionResponse(BaseModel):
    id: str
    employee_id: str
    total_retained_calls: int
    payout_amount: float
    month: str