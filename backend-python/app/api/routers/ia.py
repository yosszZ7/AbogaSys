from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import pyodbc

from ..deps import get_connection
from ..permissions import require_permission
from ...services import document_text_service, ai_service

router = APIRouter()

class AnalizarDocumentoRequest(BaseModel):
    documentoId: Optional[int] = None

@router.post("/analizar-documento")
def analizar_documento(
    req: AnalizarDocumentoRequest,
    _doc: dict = Depends(require_permission("DOCUMENTOS_VIEW")),
    _exp: dict = Depends(require_permission("EXPEDIENTES_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    if not req.documentoId:
        raise HTTPException(status_code=400, detail="documentoId es requerido.")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT RutaArchivo, ExpedienteID
            FROM Documentos_Juridicos
            WHERE DocumentoID = ?
        """, req.documentoId)

        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Documento no encontrado.")

        ruta_archivo = row.RutaArchivo

        # 1. Extraer texto usando el servicio de documentos (valida PDF y extrae texto puro)
        text_to_analyze = document_text_service.extract_text_from_pdf(ruta_archivo)

        # 2. Extraer datos con IA usando el servicio AI
        analysis_result = ai_service.extract_document_data(text_to_analyze)

        return analysis_result

    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar el análisis de IA.")
