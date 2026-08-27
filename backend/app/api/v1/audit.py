from fastapi import APIRouter, Depends, HTTPException
from app.db.session import supabase
from app.core.permissions import require_role

router = APIRouter()

def log_audit(admin_id: str, action_type: str, description: str):
    """
    Helper function to record admin actions in the database.
    Import this into your other route files!
    """
    try:
        supabase.table('audit_logs').insert({
            "admin_id": admin_id,
            "action_type": action_type,
            "description": description
        }).execute()
    except Exception as e:
        print(f"Failed to write audit log: {e}")

@router.get("/")
async def get_audit_logs(
    current_user: dict = Depends(require_role(["super_admin", "admin"]))
):
    """Fetch all audit logs for the frontend dashboard."""
    try:
        response = supabase.table('audit_logs') \
            .select('id, action_type, description, created_at, profiles:admin_id(full_name)') \
            .order('created_at', desc=True) \
            .limit(100) \
            .execute()
            
        return {"data": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))