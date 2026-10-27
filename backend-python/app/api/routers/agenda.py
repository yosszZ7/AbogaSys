from fastapi import APIRouter, Depends, HTTPException, status, Query
import pyodbc
from typing import List, Dict, Any, Optional
from datetime import date, datetime, time
import re

from ...schemas.agenda import AgendaCreate, AgendaUpdate
from ..deps import get_connection
from ..permissions import require_permission

router = APIRouter()

TIME_REGEX = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")

def serialize_agenda_row(columns, row) -> Dict[str, Any]:
    data = {}
    for col, val in zip(columns, row):
        if isinstance(val, time):
            data[col] = val.strftime("%H:%M:%S")
        elif isinstance(val, (date, datetime)):
            data[col] = val.isoformat()
        else:
            data[col] = val
    return data

def validate_agenda_data(agenda: AgendaCreate | AgendaUpdate):
    if (not agenda.titulo or not agenda.fechaActividad or not agenda.horaInicio or 
        not agenda.tipoActividadId or not agenda.abogadoResponsableId):
        raise HTTPException(status_code=400, detail="Faltan campos obligatorios.")

    if agenda.expedienteId and agenda.clienteId:
        raise HTTPException(status_code=400, detail="No puede seleccionar un Expediente y un Cliente simultáneamente.")

    if not TIME_REGEX.match(agenda.horaInicio):
        raise HTTPException(status_code=400, detail="Formato de hora de inicio inválido.")

    if agenda.horaFin and agenda.horaFin.strip():
        if not TIME_REGEX.match(agenda.horaFin):
            raise HTTPException(status_code=400, detail="Formato de hora de fin inválido.")
        t_inicio = datetime.strptime(agenda.horaInicio, "%H:%M")
        t_fin = datetime.strptime(agenda.horaFin, "%H:%M")
        if t_fin <= t_inicio:
            raise HTTPException(status_code=400, detail="La hora de fin debe ser posterior a la hora de inicio.")

@router.get("")
@router.get("/", include_in_schema=False)
def get_agenda(
    mes: Optional[int] = Query(None),
    anio: Optional[int] = Query(None),
    _: dict = Depends(require_permission("AGENDA_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        query = """
            SELECT 
                a.ActividadID,
                a.Titulo,
                a.FechaActividad,
                a.HoraInicio,
                a.HoraFin,
                a.Lugar,
                a.Recordatorio,
                t.NombreActividad AS TipoActividad,
                emp.PrimerNombre AS AbogadoNombre,
                emp.PrimerApellido AS AbogadoApellido,
                e.NumeroExpediente,
                c.TipoCliente,
                cn.PrimerNombre AS ClienteN_Nombre,
                cn.PrimerApellido AS ClienteN_Apellido,
                cj.RazonSocial AS ClienteJ_RazonSocial
            FROM Actividades_Agenda a
            INNER JOIN TiposActividad t ON a.TipoActividadID = t.TipoActividadID
            INNER JOIN Empleados emp ON a.AbogadoResponsableID = emp.EmpleadoID
            LEFT JOIN Expedientes e ON a.ExpedienteID = e.ExpedienteID
            LEFT JOIN Clientes c ON a.ClienteID = c.ClienteID OR e.ClienteID = c.ClienteID
            LEFT JOIN Clientes_PersonasNaturales cn ON c.ClienteID = cn.ClienteID
            LEFT JOIN Clientes_PersonasJuridicas cj ON c.ClienteID = cj.ClienteID
            WHERE 1=1
        """
        params = []
        if mes is not None and anio is not None:
            query += " AND MONTH(a.FechaActividad) = ? AND YEAR(a.FechaActividad) = ?"
            params.extend([mes, anio])

        query += " ORDER BY a.FechaActividad ASC, a.HoraInicio ASC"

        cursor.execute(query, params)
        cols = [col[0] for col in cursor.description]
        return [serialize_agenda_row(cols, row) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.get("/{actividad_id}")
def get_agenda_by_id(
    actividad_id: int,
    _: dict = Depends(require_permission("AGENDA_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                a.*,
                t.NombreActividad AS TipoActividad,
                emp.PrimerNombre AS AbogadoNombre,
                emp.PrimerApellido AS AbogadoApellido,
                e.NumeroExpediente,
                c.TipoCliente,
                cn.PrimerNombre AS ClienteN_Nombre,
                cn.PrimerApellido AS ClienteN_Apellido,
                cj.RazonSocial AS ClienteJ_RazonSocial
            FROM Actividades_Agenda a
            INNER JOIN TiposActividad t ON a.TipoActividadID = t.TipoActividadID
            INNER JOIN Empleados emp ON a.AbogadoResponsableID = emp.EmpleadoID
            LEFT JOIN Expedientes e ON a.ExpedienteID = e.ExpedienteID
            LEFT JOIN Clientes c ON a.ClienteID = c.ClienteID OR e.ClienteID = c.ClienteID
            LEFT JOIN Clientes_PersonasNaturales cn ON c.ClienteID = cn.ClienteID
            LEFT JOIN Clientes_PersonasJuridicas cj ON c.ClienteID = cj.ClienteID
            WHERE a.ActividadID = ?
        """, actividad_id)
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Actividad no encontrada.")
        cols = [col[0] for col in cursor.description]
        return serialize_agenda_row(cols, row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.post("", status_code=201)
@router.post("/", status_code=201, include_in_schema=False)
def create_agenda(
    agenda: AgendaCreate,
    payload: dict = Depends(require_permission("AGENDA_CREATE")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    validate_agenda_data(agenda)

    hora_inicio = f"{agenda.horaInicio}:00" if len(agenda.horaInicio) == 5 else agenda.horaInicio
    hora_fin = (f"{agenda.horaFin}:00" if len(agenda.horaFin) == 5 else agenda.horaFin) if (agenda.horaFin and agenda.horaFin.strip()) else None

    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Actividades_Agenda (
                Titulo, FechaActividad, HoraInicio, HoraFin, Lugar, Recordatorio, Descripcion,
                TipoActividadID, AbogadoResponsableID, ExpedienteID, ClienteID, CreadoPorUsuarioID
            ) OUTPUT INSERTED.ActividadID VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?
            );
        """, 
            agenda.titulo, agenda.fechaActividad, hora_inicio, hora_fin,
            agenda.lugar or None, agenda.recordatorio or None, agenda.descripcion or None,
            agenda.tipoActividadId, agenda.abogadoResponsableId,
            agenda.expedienteId or None, agenda.clienteId or None, payload.get("usuarioId")
        )
        nuevo_id = cursor.fetchone()[0]
        conn.commit()
        return {
            "message": "Actividad programada exitosamente.",
            "actividadId": nuevo_id
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.put("/{actividad_id}")
def update_agenda(
    actividad_id: int,
    agenda: AgendaUpdate,
    _: dict = Depends(require_permission("AGENDA_EDIT")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    validate_agenda_data(agenda)

    hora_inicio = f"{agenda.horaInicio}:00" if len(agenda.horaInicio) == 5 else agenda.horaInicio
    hora_fin = (f"{agenda.horaFin}:00" if len(agenda.horaFin) == 5 else agenda.horaFin) if (agenda.horaFin and agenda.horaFin.strip()) else None

    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Actividades_Agenda SET
                Titulo = ?,
                FechaActividad = ?,
                HoraInicio = ?,
                HoraFin = ?,
                Lugar = ?,
                Recordatorio = ?,
                Descripcion = ?,
                TipoActividadID = ?,
                AbogadoResponsableID = ?,
                ExpedienteID = ?,
                ClienteID = ?
            WHERE ActividadID = ?
        """, 
            agenda.titulo, agenda.fechaActividad, hora_inicio, hora_fin,
            agenda.lugar or None, agenda.recordatorio or None, agenda.descripcion or None,
            agenda.tipoActividadId, agenda.abogadoResponsableId,
            agenda.expedienteId or None, agenda.clienteId or None, actividad_id
        )

        if cursor.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Actividad no encontrada.")

        conn.commit()
        return {"message": "Actividad actualizada exitosamente."}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
