from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal

class EmpleadoBase(BaseModel):
    primerNombre: str
    segundoNombre: Optional[str] = None
    primerApellido: str
    segundoApellido: Optional[str] = None
    cedula: str
    fechaNacimiento: date
    sexo: str
    estadoCivil: str
    tipoSangre: Optional[str] = None
    telefono: str
    correoPersonal: Optional[str] = None
    direccion: Optional[str] = None
    area: Optional[str] = None
    fechaContratacion: date
    numeroINSS: Optional[str] = None
    salario: Decimal
    estadoLaboral: str
    cargoId: int

class EmpleadoCreate(EmpleadoBase):
    pass

class EmpleadoUpdate(EmpleadoBase):
    pass
