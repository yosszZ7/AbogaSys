from pydantic import BaseModel
from typing import Optional

class DocumentoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    fechaDoc: Optional[str] = None
    expedienteId: Optional[int] = None
    tipoDocumentoId: Optional[int] = None
