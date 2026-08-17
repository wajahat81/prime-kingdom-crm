from app.db.session import supabase
from typing import List, Dict
import uuid

def create_call_record(call_data, admin_id: str) -> Dict:
    """Create a new call record."""
    record = {
        "id": str(uuid.uuid4()),
        "client_name": call_data.client_name,
        "employee_id": call_data.employee_id,
        "status": call_data.status,
        "created_by": admin_id,
        "call_duration": getattr(call_data, 'call_duration', None),
        "commission": None,
        "created_at": "now()"
    }
    response = supabase.table('calls').insert(record).execute()
    if response.data:
        return response.data[0]
    raise Exception("Failed to create call record")

def get_employee_calls(employee_id: str) -> List[Dict]:
    """Get calls for a specific employee."""
    response = supabase.table('calls').select('*').eq('employee_id', employee_id).order('created_at', desc=True).execute()
    return response.data if response.data else []

def get_all_calls() -> List[Dict]:
    """Get all calls."""
    response = supabase.table('calls').select('*').order('created_at', desc=True).execute()
    return response.data if response.data else []

def update_call_status(call_id: str, status: str) -> Dict:
    """Update call status."""
    # Don't use updated_at if column doesn't exist
    response = supabase.table('calls').update({
        'status': status
    }).eq('id', call_id).execute()
    if response.data:
        return response.data[0]
    raise Exception("Call not found")

def update_call_commission(call_id: str, commission: float) -> Dict:
    """Update call commission."""
    if commission is None or commission < 0:
        raise Exception("Invalid commission amount")
    
    # First check if call exists and is retained
    check_response = supabase.table('calls').select('status').eq('id', call_id).execute()
    if not check_response.data:
        raise Exception("Call not found")
    
    if check_response.data[0].get('status') != 'retained':
        raise Exception("Commission can only be added to retained calls")
    
    response = supabase.table('calls').update({
        'commission': commission
    }).eq('id', call_id).execute()
    if response.data:
        return response.data[0]
    raise Exception("Failed to update commission")