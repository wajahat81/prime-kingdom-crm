from pydantic import BaseModel
from typing import Optional
from pydantic import BaseModel, Field
from datetime import date

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None

class UserCreate(BaseModel):
    email: Optional[str] = None
    password: str
    full_name: str
    role: str = "employee"
    dialing_id: str = None
    joining_date: date = None

class UserLogin(BaseModel):
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)