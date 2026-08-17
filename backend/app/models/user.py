from typing import TypedDict
from datetime import datetime

class ProfileModel(TypedDict):
    id: str  # UUID from auth.users
    full_name: str
    role: str  # 'employee', 'admin', 'super_admin'
    password_hash: str
    created_at: datetime