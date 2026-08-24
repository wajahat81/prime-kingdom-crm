from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.db.session import supabase
from app.core.security import get_current_user
from app.core.permissions import require_role

router = APIRouter()

class AnnouncementCreate(BaseModel):
    message: str
    target_role: str = "all"
    valid_until: Optional[str] = None # Accepts ISO datetime string

@router.post("/")
async def create_announcement(
    announcement: AnnouncementCreate,
    current_user: dict = Depends(require_role(["admin", "super_admin"]))
):
    try:
        data = {
            "message": announcement.message,
            "target_role": announcement.target_role,
            "valid_until": announcement.valid_until
        }
        response = supabase.table('announcements').insert(data).execute()
        return {"message": "Announcement created", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active")
async def get_active_announcement(current_user: dict = Depends(get_current_user)):
    """Fetches the latest active announcement strictly for the user's role."""
    try:
        user_role = current_user['role']
        
        # Fetch recent announcements
        response = supabase.table('announcements').select('*').order('created_at', desc=True).limit(20).execute()
        announcements = response.data or []
        
        current_time = datetime.now(timezone.utc)
        
        for ann in announcements:
            # 1. Check Role Match
            target = ann.get('target_role') or 'all'
            if target != 'all' and target != user_role:
                continue # Skip if it's not for them
                
            # 2. Check Validity Date
            if ann.get('valid_until'):
                valid_date = datetime.fromisoformat(ann['valid_until'].replace('Z', '+00:00'))
                if current_time > valid_date:
                    continue # Skip if it has expired
            
            # If it passes both checks, return it!
            return ann
            
        return {"message": None} # No valid announcements found
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_all_announcements(current_user: dict = Depends(get_current_user)):
    """Fetches announcement history."""
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
    try:
        supabase.table('announcements').delete().eq('id', announcement_id).execute()
        return {"message": "Deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))