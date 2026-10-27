from pydantic import BaseModel
from typing import Union

class UsuarioCreate(BaseModel):
    empleadoId: int
    correoAcceso: str
    password: str
    rolId: int

class UsuarioUpdate(BaseModel):
    correoAcceso: str
    rolId: int
    estado: Union[bool, int, str]
