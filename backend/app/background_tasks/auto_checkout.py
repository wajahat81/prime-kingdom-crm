import asyncio
from datetime import datetime, timedelta, timezone
from app.db.session import supabase # Initialized Supabase service role client

async def auto_checkout_employees():
    """
    Runs continuously. Checks for any attendance record where 
    check_in is older than 9 hours and check_out is null.
    """
    while True:
        try:
            nine_hours_ago = datetime.now(timezone.utc) - timedelta(hours=9)
            
            # Query for open sessions older than 9 hours
            open_sessions = supabase.table('attendance') \
                .select('id, check_in') \
                .is_('check_out', 'null') \
                .lte('check_in', nine_hours_ago.isoformat()) \
                .execute()
            
            # Automatically check them out
            for session in open_sessions.data:
                supabase.table('attendance') \
                    .update({'check_out': datetime.now(timezone.utc).isoformat()}) \
                    .eq('id', session['id']) \
                    .execute()
                print(f"Auto-checked out session: {session['id']}")
                
        except Exception as e:
            print(f"Background task error: {e}")
        
        # Run this check every 15 minutes
        await asyncio.sleep(900)