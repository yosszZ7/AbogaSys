from fastapi import APIRouter, Depends, HTTPException, status
import pyodbc
from typing import List, Dict, Any
from datetime import date, datetime

from ...schemas.expediente import ExpedienteCreate, ExpedienteUpdate
from ..deps import get_connection
from ..permissions import require_permission

router = APIRouter()

def serialize_row(columns, row) -> Dict[str, Any]:
    data = {}
    for col, val in zip(columns, row):
        if isinstance(val, (date, datetime)):
            data[col] = val.isoformat()
        else:
            data[col] = val
    return data

@router.get("")
@router.get("/", include_in_schema=False)
def get_expedientes(
    _: dict = Depends(require_permission("EXPEDIENTES_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                e.ExpedienteID,
                e.NumeroExpediente,
                e.TipoProceso,
                e.JuzgadoTribunal,
                e.FechaApertura,
                e.EstadoProcesal,
                c.TipoCliente,
                cn.PrimerNombre AS ClienteN_Nombre,
                cn.PrimerApellido AS ClienteN_Apellido,
                cj.RazonSocial AS ClienteJ_RazonSocial,
                m.NombreMateria,
                emp.PrimerNombre AS AbogadoNombre,
                emp.PrimerApellido AS AbogadoApellido
            FROM Expedientes e
            INNER JOIN Clientes c ON e.ClienteID = c.ClienteID
            LEFT JOIN Clientes_PersonasNaturales cn ON c.ClienteID = cn.ClienteID
            LEFT JOIN Clientes_PersonasJuridicas cj ON c.ClienteID = cj.ClienteID
            INNER JOIN Materias m ON e.MateriaID = m.MateriaID
            INNER JOIN Empleados emp ON e.AbogadoResponsableID = emp.EmpleadoID
            ORDER BY e.FechaCreacion DESC
        """)
        cols = [col[0] for col in cursor.description]
        return [serialize_row(cols, row) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.get("/lista")
def get_expedientes_lista(
    _: dict = Depends(require_permission("EXPEDIENTES_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                e.ExpedienteID,
                e.NumeroExpediente,
                c.TipoCliente,
                cn.PrimerNombre AS ClienteN_Nombre,
                cn.PrimerApellido AS ClienteN_Apellido,
                cj.RazonSocial AS ClienteJ_RazonSocial
            FROM Expedientes e
            INNER JOIN Clientes c ON e.ClienteID = c.ClienteID
            LEFT JOIN Clientes_PersonasNaturales cn ON c.ClienteID = cn.ClienteID
            LEFT JOIN Clientes_PersonasJuridicas cj ON c.ClienteID = cj.ClienteID
            ORDER BY e.FechaCreacion DESC
        """)
        cols = [col[0] for col in cursor.description]
        return [serialize_row(cols, row) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.get("/{expediente_id}")
def get_expediente_by_id(
    expediente_id: int,
    _: dict = Depends(require_permission("EXPEDIENTES_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Expedientes WHERE ExpedienteID = ?", expediente_id)
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Expediente no encontrado.")
        cols = [col[0] for col in cursor.description]
        return serialize_row(cols, row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.post("", status_code=201)
@router.post("/", status_code=201, include_in_schema=False)
def create_expediente(
    expediente: ExpedienteCreate,
    payload: dict = Depends(require_permission("EXPEDIENTES_CREATE")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    if (not expediente.numeroExpediente or not expediente.tipoProceso or 
        not expediente.juzgadoTribunal or not expediente.fechaApertura or 
        not expediente.estadoProcesal or not expediente.clienteId or 
        not expediente.materiaId or not expediente.abogadoResponsableId):
        raise HTTPException(status_code=400, detail="Faltan campos obligatorios.")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Expedientes (
                NumeroExpediente, TipoProceso, JuzgadoTribunal, Contraparte, AbogadoContraparte, TelefonoContraparte,
                FechaApertura, EstadoProcesal, DescripcionCaso, Observaciones, ClienteID, MateriaID, AbogadoResponsableID, CreadoPorUsuarioID
            ) OUTPUT INSERTED.ExpedienteID VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?
            );
        """, 
            expediente.numeroExpediente, expediente.tipoProceso, expediente.juzgadoTribunal,
            expediente.contraparte or None, expediente.abogadoContraparte or None, expediente.telefonoContraparte or None,
            expediente.fechaApertura, expediente.estadoProcesal, expediente.descripcionCaso or None,
            expediente.observaciones or None, expediente.clienteId, expediente.materiaId,
            expediente.abogadoResponsableId, payload.get("usuarioId")
        )
        nuevo_id = cursor.fetchone()[0]
        conn.commit()
        return {
            "message": "Expediente registrado exitosamente.",
            "expedienteId": nuevo_id
        }
    except HTTPException:
        conn.rollback()
        raise
    except pyodbc.IntegrityError as e:
        conn.rollback()
        if "UQ_Expedientes_Numero" in str(e):
            raise HTTPException(status_code=409, detail="El número de expediente ya se encuentra registrado.")
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.put("/{expediente_id}")
def update_expediente(
    expediente_id: int,
    expediente: ExpedienteUpdate,
    _: dict = Depends(require_permission("EXPEDIENTES_EDIT")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    if (not expediente.numeroExpediente or not expediente.tipoProceso or 
        not expediente.juzgadoTribunal or not expediente.fechaApertura or 
        not expediente.estadoProcesal or not expediente.clienteId or 
        not expediente.materiaId or not expediente.abogadoResponsableId):
        raise HTTPException(status_code=400, detail="Faltan campos obligatorios.")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Expedientes SET 
                NumeroExpediente = ?,
                TipoProceso = ?,
                JuzgadoTribunal = ?,
                Contraparte = ?,
                AbogadoContraparte = ?,
                TelefonoContraparte = ?,
                FechaApertura = ?,
                EstadoProcesal = ?,
                DescripcionCaso = ?,
                Observaciones = ?,
                ClienteID = ?,
                MateriaID = ?,
                AbogadoResponsableID = ?,
                FechaModificacion = SYSDATETIME()
            WHERE ExpedienteID = ?
        """, 
            expediente.numeroExpediente, expediente.tipoProceso, expediente.juzgadoTribunal,
            expediente.contraparte or None, expediente.abogadoContraparte or None, expediente.telefonoContraparte or None,
            expediente.fechaApertura, expediente.estadoProcesal, expediente.descripcionCaso or None,
            expediente.observaciones or None, expediente.clienteId, expediente.materiaId,
            expediente.abogadoResponsableId, expediente_id
        )

        if cursor.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Expediente no encontrado.")

        conn.commit()
        return {"message": "Expediente actualizado correctamente."}
    except HTTPException:
        conn.rollback()
        raise
    except pyodbc.IntegrityError as e:
        conn.rollback()
        if "UQ_Expedientes_Numero" in str(e):
            raise HTTPException(status_code=409, detail="El número de expediente ya se encuentra registrado.")
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
