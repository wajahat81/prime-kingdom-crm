from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.db.session import supabase
from app.core.permissions import require_role, get_current_active_user

router = APIRouter()

class CommissionEntry(BaseModel):
    employee_id: str
    total_retained_calls: int
    month: str
    payout_amount: float  # Admin enters this manually

class CommissionResponse(BaseModel):
    id: str
    employee_id: str
    total_retained_calls: int
    payout_amount: float
    month: str
    created_at: str

@router.post("/")
async def create_commission(
    entry: CommissionEntry,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Admin manually enters commission for employee."""
    commission_record = {
        "employee_id": entry.employee_id,
        "total_retained_calls": entry.total_retained_calls,
        "payout_amount": entry.payout_amount,
        "month": entry.month
    }
    
    response = supabase.table('commissions').insert(commission_record).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to save commission")
        
    return {"message": "Commission saved", "data": response.data[0]}

@router.get("/me")
async def get_my_commissions(
    current_user: dict = Depends(get_current_active_user)
):
    """Employee gets their own commissions."""
    response = supabase.table('commissions').select('*').eq('employee_id', current_user['id']).execute()
    return {"data": response.data}

@router.get("/")
async def get_all_commissions(
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Admin gets all commissions."""
    response = supabase.table('commissions').select('*').execute()
    return {"data": response.data}