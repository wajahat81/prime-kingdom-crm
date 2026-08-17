from fastapi import APIRouter, Depends, HTTPException
from app.db.session import supabase
from app.core.permissions import require_role

router = APIRouter()

@router.get("/")
async def get_users(
    role: str = None,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Get all users, optionally filtered by role."""
    try:
        query = supabase.table('profiles').select('id, email, full_name, role')
        
        if role:
            query = query.eq('role', role)
            
        response = query.execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))