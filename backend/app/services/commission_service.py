from app.db.session import supabase
from app.schemas.commission_schema import CommissionCreate

def calculate_payout(retained_calls: int, rate: float = 15.00) -> float:
    return retained_calls * rate

def save_commission(data: CommissionCreate, payout: float):
    record = {
        "employee_id": data.employee_id,
        "total_retained_calls": data.total_retained_calls,
        "payout_amount": payout,
        "month": data.month
    }
    response = supabase.table('commissions').insert(record).execute()
    return response.data[0]