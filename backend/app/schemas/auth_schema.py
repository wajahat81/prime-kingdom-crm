from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "employee"
    dialing_id: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str