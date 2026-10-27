from fastapi import APIRouter, Depends, HTTPException
import pyodbc
from typing import Dict, Any
from datetime import date, datetime

from ..deps import get_connection
from ..permissions import require_permission, get_user_permissions

router = APIRouter()

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
def get_dashboard_stats(
    payload: dict = Depends(require_permission("DASHBOARD_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        usuario_id = payload.get("usuarioId")
        permisos = get_user_permissions(usuario_id, conn)

        data = {}

        # 1. Clientes registrados
        if "CLIENTES_VIEW" in permisos:
            cursor.execute("SELECT COUNT(*) as total FROM Clientes")
            row = cursor.fetchone()
            data["clientesRegistrados"] = row[0] if row else 0

        # 2. Expedientes activos
        if "EXPEDIENTES_VIEW" in permisos:
            cursor.execute("SELECT COUNT(*) as total FROM Expedientes WHERE EstadoProcesal NOT IN ('Cerrado', 'Archivado', 'Finalizado')")
            row = cursor.fetchone()
            data["expedientesActivos"] = row[0] if row else 0

        # 3. Próximas audiencias y tareas (AGENDA_VIEW)
        if "AGENDA_VIEW" in permisos:
            cursor.execute("""
                SELECT COUNT(*) as total 
                FROM Actividades_Agenda a
                INNER JOIN TiposActividad ta ON a.TipoActividadID = ta.TipoActividadID
                WHERE ta.NombreActividad = 'Audiencia' AND a.FechaActividad >= CAST(GETDATE() AS DATE)
            """)
            row = cursor.fetchone()
            data["audienciasProximas"] = row[0] if row else 0

            cursor.execute("""
                SELECT TOP 4
                    ISNULL(cn.PrimerNombre + ' ' + cn.PrimerApellido, cj.RazonSocial) as Cliente,
                    e.NumeroExpediente as Expediente,
                    a.FechaActividad as FechaHora,
                    'Sede' as Juzgado,
                    'Programada' as Estado
                FROM Actividades_Agenda a
                INNER JOIN TiposActividad ta ON a.TipoActividadID = ta.TipoActividadID
                LEFT JOIN Expedientes e ON a.ExpedienteID = e.ExpedienteID
                LEFT JOIN Clientes c ON a.ClienteID = c.ClienteID OR e.ClienteID = c.ClienteID
                LEFT JOIN Clientes_PersonasNaturales cn ON c.ClienteID = cn.ClienteID
                LEFT JOIN Clientes_PersonasJuridicas cj ON c.ClienteID = cj.ClienteID
                WHERE ta.NombreActividad = 'Audiencia' AND a.FechaActividad >= CAST(GETDATE() AS DATE)
                ORDER BY a.FechaActividad ASC, a.HoraInicio ASC
            """)
            cols = [col[0] for col in cursor.description]
            data["listaAudiencias"] = [serialize_row(cols, r) for r in cursor.fetchall()]

        # 4. Actividad reciente (Documentos) y Documentos Registrados
        if "DOCUMENTOS_VIEW" in permisos:
            cursor.execute("SELECT COUNT(*) as total FROM Documentos_Juridicos")
            row = cursor.fetchone()
            data["documentosRegistrados"] = row[0] if row else 0

            cursor.execute("""
                SELECT TOP 4
                    d.NombreDocumento as Documento,
                    e.NumeroExpediente as Expediente,
                    d.FechaRegistro as FechaSubida
                FROM Documentos_Juridicos d
                INNER JOIN Expedientes e ON d.ExpedienteID = e.ExpedienteID
                ORDER BY d.FechaRegistro DESC
            """)
            cols = [col[0] for col in cursor.description]
            data["actividadDocumentos"] = [serialize_row(cols, r) for r in cursor.fetchall()]

        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
