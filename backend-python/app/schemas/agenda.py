from pydantic import BaseModel
from typing import Optional

class AgendaCreate(BaseModel):
    titulo: Optional[str] = None
    fechaActividad: Optional[str] = None
    horaInicio: Optional[str] = None
    horaFin: Optional[str] = None
    lugar: Optional[str] = None
    recordatorio: Optional[str] = None
    descripcion: Optional[str] = None
    tipoActividadId: Optional[int] = None
    abogadoResponsableId: Optional[int] = None
    expedienteId: Optional[int] = None
    clienteId: Optional[int] = None

class AgendaUpdate(BaseModel):
    titulo: Optional[str] = None
    fechaActividad: Optional[str] = None
    horaInicio: Optional[str] = None
    horaFin: Optional[str] = None
    lugar: Optional[str] = None
    recordatorio: Optional[str] = None
    descripcion: Optional[str] = None
    tipoActividadId: Optional[int] = None
    abogadoResponsableId: Optional[int] = None
    expedienteId: Optional[int] = None
    clienteId: Optional[int] = None
