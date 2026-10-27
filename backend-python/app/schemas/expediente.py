from pydantic import BaseModel
from typing import Optional

class ExpedienteCreate(BaseModel):
    numeroExpediente: Optional[str] = None
    tipoProceso: Optional[str] = None
    juzgadoTribunal: Optional[str] = None
    contraparte: Optional[str] = None
    abogadoContraparte: Optional[str] = None
    telefonoContraparte: Optional[str] = None
    fechaApertura: Optional[str] = None
    estadoProcesal: Optional[str] = None
    descripcionCaso: Optional[str] = None
    observaciones: Optional[str] = None
    clienteId: Optional[int] = None
    materiaId: Optional[int] = None
    abogadoResponsableId: Optional[int] = None

class ExpedienteUpdate(BaseModel):
    numeroExpediente: Optional[str] = None
    tipoProceso: Optional[str] = None
    juzgadoTribunal: Optional[str] = None
    contraparte: Optional[str] = None
    abogadoContraparte: Optional[str] = None
    telefonoContraparte: Optional[str] = None
    fechaApertura: Optional[str] = None
    estadoProcesal: Optional[str] = None
    descripcionCaso: Optional[str] = None
    observaciones: Optional[str] = None
    clienteId: Optional[int] = None
    materiaId: Optional[int] = None
    abogadoResponsableId: Optional[int] = None
