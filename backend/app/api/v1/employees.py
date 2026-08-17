from fastapi import APIRouter, Depends, HTTPException
from app.db.session import supabase
from app.core.permissions import require_role

router = APIRouter()

@router.get("/")
async def get_all_employees(
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """
    Fetches a list of all active employees. 
    Restricted to Admins and Super Admins for populating UI dropdowns.
    """
    try:
        response = supabase.table('profiles') \
            .select('id, full_name, role') \
            .eq('role', 'employee') \
            .execute()
            
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch employees: {str(e)}")