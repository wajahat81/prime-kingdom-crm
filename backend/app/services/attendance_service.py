from datetime import datetime, timezone
from app.db.session import supabase

def get_open_shift(employee_id: str, date: str):
    response = supabase.table('attendance') \
        .select('*') \
        .eq('employee_id', employee_id) \
        .eq('date', date) \
        .is_('check_out', 'null') \
        .execute()
    return response.data[0] if response.data else None

# New Function: Update Status (Approve/Reject)
def update_attendance_status(log_id: str, status: str):
    response = supabase.table('attendance').update({
        'status': status
    }).eq('id', log_id).execute()
    return response.data[0] if response.data else None

# New Function: Manually Update Times
def update_attendance_times(log_id: str, check_in: str = None, check_out: str = None):
    update_data = {}
    if check_in:
        update_data['check_in'] = check_in
    if check_out:
        update_data['check_out'] = check_out
        
    if not update_data:
        return None
        
    response = supabase.table('attendance').update(update_data).eq('id', log_id).execute()
    return response.data[0] if response.data else None