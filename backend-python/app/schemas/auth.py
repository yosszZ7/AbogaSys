from pydantic import BaseModel, Field
from typing import List, Optional

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=150, pattern="^.+@.+$")
    password: str

class LoginResponse(BaseModel):
    message: str
    user: dict

class UserMeData(BaseModel):
    id: int
    nombre: str
    correo: str
    rol: str
    permisos: List[str]

class UserMeResponse(BaseModel):
    user: UserMeData
