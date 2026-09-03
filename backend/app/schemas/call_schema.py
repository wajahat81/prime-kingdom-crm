from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date # Ensure 'date' is imported

class CallCreate(BaseModel):
    customer_name: str
    phone_number: str
    status: str = "retained"
    commission: Optional[float] = 0.0
    handy_id: Optional[str] = None
    closer_id: Optional[str] = None
    doc_sign_id: Optional[str] = None
    date: Optional[date] = None  # <-- Add this[cite: 4]

class CallUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|retained|not_retained)$")

class CallResponse(BaseModel):
    id: str
    client_name: str
    employee_id: str
    status: str
    created_by: str
    created_at: datetime
    commission: Optional[float] = None
    handy_id: Optional[str] = None
    closer_id: Optional[str] = None
    doc_sign_id: Optional[str] = None
    date: Optional[str] = None # <-- Add this so the UI gets the date back[cite: 4]