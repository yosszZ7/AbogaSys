from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.responses import FileResponse
import pyodbc
from typing import List, Dict, Any, Optional
from datetime import date, datetime
import os
import random

from ...schemas.documento import DocumentoUpdate
from ..deps import get_connection
from ..permissions import require_permission

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", "documentos"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

def resolve_file_path(ruta_archivo: str) -> str:
    if not ruta_archivo:
        return ""
    if os.path.isabs(ruta_archivo) and os.path.exists(ruta_archivo):
        return ruta_archivo
    if os.path.exists(ruta_archivo):
        return os.path.abspath(ruta_archivo)

    filename = os.path.basename(ruta_archivo)
    return os.path.join(UPLOAD_DIR, filename)

def serialize_row(columns, row) -> Dict[str, Any]:
    d = {}
    for col, val in zip(columns, row):
        if isinstance(val, (date, datetime)):
            d[col] = val.isoformat()
        else:
            d[col] = val
    return d

@router.get("")
@router.get("/", include_in_schema=False)
def get_all_documentos(
    query: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    expediente: Optional[str] = Query(None),
    _: dict = Depends(require_permission("DOCUMENTOS_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        sql_query = """
            SELECT 
                d.DocumentoID as id,
                d.NombreDocumento as nombre,
                d.Extension as extension,
                d.TamanoBytes as archivoTamano,
                d.FechaDocumento as fechaDoc,
                CONVERT(varchar, d.FechaDocumento, 23) as fechaDocRaw,
                FORMAT(d.FechaRegistro, 'dd/MM/yyyy hh:mm tt') as fechaRegistro,
                t.NombreTipo as tipo,
                e.NumeroExpediente as expediente,
                ISNULL(cn.PrimerNombre + ' ' + cn.PrimerApellido, cj.RazonSocial) as cliente,
                emp.PrimerNombre + ' ' + emp.PrimerApellido as registradoPor,
                d.Descripcion as descripcion
            FROM Documentos_Juridicos d
            INNER JOIN TiposDocumento t ON d.TipoDocumentoID = t.TipoDocumentoID
            INNER JOIN Expedientes e ON d.ExpedienteID = e.ExpedienteID
            LEFT JOIN Clientes c ON e.ClienteID = c.ClienteID
            LEFT JOIN Clientes_PersonasNaturales cn ON c.ClienteID = cn.ClienteID
            LEFT JOIN Clientes_PersonasJuridicas cj ON c.ClienteID = cj.ClienteID
            INNER JOIN Usuarios u ON d.RegistradoPorUsuarioID = u.UsuarioID
            INNER JOIN Empleados emp ON u.EmpleadoID = emp.EmpleadoID
            WHERE 1=1
        """
        params = []

        if tipo and tipo != 'todos':
            sql_query += " AND d.TipoDocumentoID = ?"
            params.append(int(tipo))

        if expediente and expediente != 'todos':
            sql_query += " AND d.ExpedienteID = ?"
            params.append(int(expediente))

        if query:
            sql_query += """ AND (
                d.NombreDocumento LIKE ? OR
                d.Descripcion LIKE ? OR
                e.NumeroExpediente LIKE ? OR
                cn.PrimerNombre LIKE ? OR
                cn.PrimerApellido LIKE ? OR
                cj.RazonSocial LIKE ? OR
                emp.PrimerNombre LIKE ? OR
                emp.PrimerApellido LIKE ?
            )"""
            pattern = f"%{query}%"
            params.extend([pattern] * 8)

        sql_query += " ORDER BY d.FechaRegistro DESC"

        cursor.execute(sql_query, params)
        cols = [col[0] for col in cursor.description]
        return [serialize_row(cols, r) for r in cursor.fetchall()]

    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.get("/{documento_id}")
def get_documento_by_id(
    documento_id: int,
    _: dict = Depends(require_permission("DOCUMENTOS_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                d.DocumentoID as id,
                d.NombreDocumento as nombre,
                d.Descripcion as descripcion,
                CONVERT(varchar, d.FechaDocumento, 23) as fechaDocRaw,
                FORMAT(d.FechaDocumento, 'dd/MM/yyyy') as fechaDoc,
                d.Extension as extension,
                d.TamanoBytes as archivoTamano,
                d.ExpedienteID as expedienteId,
                d.TipoDocumentoID as tipoDocumentoId,
                e.NumeroExpediente as expediente,
                ISNULL(cn.PrimerNombre + ' ' + cn.PrimerApellido, cj.RazonSocial) as cliente,
                emp.PrimerNombre + ' ' + emp.PrimerApellido as registradoPor,
                FORMAT(d.FechaRegistro, 'dd/MM/yyyy hh:mm tt') as fechaRegistro,
                d.RutaArchivo
            FROM Documentos_Juridicos d
            INNER JOIN TiposDocumento t ON d.TipoDocumentoID = t.TipoDocumentoID
            INNER JOIN Expedientes e ON d.ExpedienteID = e.ExpedienteID
            LEFT JOIN Clientes c ON e.ClienteID = c.ClienteID
            LEFT JOIN Clientes_PersonasNaturales cn ON c.ClienteID = cn.ClienteID
            LEFT JOIN Clientes_PersonasJuridicas cj ON c.ClienteID = cj.ClienteID
            INNER JOIN Usuarios u ON d.RegistradoPorUsuarioID = u.UsuarioID
            INNER JOIN Empleados emp ON u.EmpleadoID = emp.EmpleadoID
            WHERE d.DocumentoID = ?
        """, documento_id)

        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Documento no encontrado.")

        cols = [col[0] for col in cursor.description]
        doc = serialize_row(cols, row)
        ruta_archivo = doc.pop("RutaArchivo", "") or ""
        doc["archivoNombre"] = os.path.basename(ruta_archivo)

        return doc

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.post("", status_code=201)
@router.post("/", status_code=201, include_in_schema=False)
async def create_documento(
    archivo: Optional[UploadFile] = File(None),
    nombre: Optional[str] = Form(None),
    descripcion: Optional[str] = Form(None),
    fechaDoc: Optional[str] = Form(None),
    expedienteId: Optional[str] = Form(None),
    tipoDocumentoId: Optional[str] = Form(None),
    payload: dict = Depends(require_permission("DOCUMENTOS_CREATE")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    if not archivo or not archivo.filename:
        raise HTTPException(status_code=400, detail="Debe adjuntar un archivo válido (.pdf, .doc, .docx).")

    allowed_types = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    allowed_extensions = ['.pdf', '.doc', '.docx']
    ext = os.path.splitext(archivo.filename)[1].lower()

    if ext not in allowed_extensions or (archivo.content_type and archivo.content_type not in allowed_types):
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido. Solo se aceptan .pdf, .doc, .docx.")

    if not nombre or not fechaDoc or not expedienteId or not tipoDocumentoId:
        raise HTTPException(status_code=400, detail="Faltan campos obligatorios.")

    try:
        exp_id = int(expedienteId)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="El Expediente seleccionado no es válido.")

    try:
        tipo_id = int(tipoDocumentoId)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="El tipo de documento seleccionado no es válido.")

    content = await archivo.read()
    tamano_bytes = len(content)

    if tamano_bytes > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo supera el tamaño máximo permitido de 10 MB.")

    unique_suffix = f"{int(datetime.now().timestamp() * 1000)}-{random.randint(100000000, 999999999)}"
    saved_filename = f"doc-{unique_suffix}{ext}"
    saved_file_path = os.path.join(UPLOAD_DIR, saved_filename)

    with open(saved_file_path, "wb") as f:
        f.write(content)

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Documentos_Juridicos (
                NombreDocumento, Descripcion, FechaDocumento, RutaArchivo, Extension, 
                TamanoBytes, ExpedienteID, TipoDocumentoID, RegistradoPorUsuarioID
            ) OUTPUT INSERTED.DocumentoID VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?
            );
        """, 
            nombre, descripcion or None, fechaDoc, saved_file_path, ext.replace('.', ''),
            tamano_bytes, exp_id, tipo_id, payload.get("usuarioId")
        )

        nuevo_id = cursor.fetchone()[0]
        conn.commit()

        return {
            "message": "Documento registrado exitosamente.",
            "documentoId": nuevo_id
        }

    except Exception as e:
        conn.rollback()
        if os.path.exists(saved_file_path):
            try:
                os.remove(saved_file_path)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.put("/{documento_id}")
def update_documento(
    documento_id: int,
    doc: DocumentoUpdate,
    _: dict = Depends(require_permission("DOCUMENTOS_EDIT")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    if not doc.nombre or not doc.fechaDoc or not doc.expedienteId or not doc.tipoDocumentoId:
        raise HTTPException(status_code=400, detail="Faltan campos obligatorios.")

    try:
        exp_id = int(doc.expedienteId)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="El Expediente seleccionado no es válido.")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Documentos_Juridicos SET
                NombreDocumento = ?,
                Descripcion = ?,
                FechaDocumento = ?,
                ExpedienteID = ?,
                TipoDocumentoID = ?
            WHERE DocumentoID = ?;
        """, doc.nombre, doc.descripcion or None, doc.fechaDoc, exp_id, doc.tipoDocumentoId, documento_id)

        if cursor.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Documento no encontrado.")

        conn.commit()
        return {"message": "Documento actualizado exitosamente."}

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.get("/{documento_id}/descarga")
def download_documento(
    documento_id: int,
    _: dict = Depends(require_permission("DOCUMENTOS_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT RutaArchivo, NombreDocumento, Extension
            FROM Documentos_Juridicos
            WHERE DocumentoID = ?
        """, documento_id)

        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Documento no encontrado.")

        ruta_fisica = resolve_file_path(row.RutaArchivo)

        if not os.path.exists(ruta_fisica):
            raise HTTPException(status_code=404, detail="El archivo físico no existe en el servidor.")

        filename = f"{row.NombreDocumento}.{row.Extension}"
        return FileResponse(
            path=ruta_fisica,
            filename=filename,
            media_type="application/octet-stream"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
