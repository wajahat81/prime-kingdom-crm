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