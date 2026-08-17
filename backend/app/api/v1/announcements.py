from fastapi import APIRouter, Depends, HTTPException
from app.db.session import supabase
from app.core.permissions import get_current_active_user, require_role
from app.schemas.announcement_schema import AnnouncementCreate, AnnouncementResponse
import uuid

router = APIRouter()

@router.post("/")
async def create_announcement(
    announcement: AnnouncementCreate,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Deactivates previous announcements and sets the new one as active."""
    try:
        # 1. Deactivate all existing
        supabase.table('announcements').update({'is_active': False}).neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        # 2. Insert new active announcement
        new_record = {
            "id": str(uuid.uuid4()),
            "message": announcement.message,
            "is_active": True,
            "created_by": current_user["id"],
            "created_at": "now()"
        }
        response = supabase.table('announcements').insert(new_record).execute()
        
        return {"message": "Announcement broadcasted successfully", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active")
async def get_active_announcement(current_user: dict = Depends(get_current_active_user)):
    """Fetches the current live broadcast for the dashboard."""
    try:
        response = supabase.table('announcements').select('message, id, is_active, created_at').eq('is_active', True).execute()
        
        if response.data:
            return response.data[0]
        return {"message": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_all_announcements(
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Get all announcements (admin view)."""
    try:
        response = supabase.table('announcements').select('*').order('created_at', desc=True).execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    """Delete an announcement."""
    try:
        response = supabase.table('announcements').delete().eq('id', announcement_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Announcement not found")
        return {"message": "Announcement deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))