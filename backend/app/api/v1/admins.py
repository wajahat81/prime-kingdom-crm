from fastapi import APIRouter, Depends, HTTPException
from app.db.session import supabase
from app.core.permissions import require_role

router = APIRouter()

@router.get("/")
async def get_all_admins(current_user: dict = Depends(require_role(["super_admin"]))):
    """
    Fetches a list of all active administrative accounts. 
    Strictly restricted to Super Admins.
    """
    try:
        response = supabase.table('profiles') \
            .select('id, full_name, role') \
            .eq('role', 'admin') \
            .execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")