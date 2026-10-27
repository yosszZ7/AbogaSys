from fastapi import APIRouter, Depends, HTTPException, status
import pyodbc
from typing import List, Dict, Any
from datetime import date, datetime
from decimal import Decimal

from ...schemas.empleado import EmpleadoCreate, EmpleadoUpdate
from ..deps import get_connection
from ..permissions import require_permission, require_any_permission

router = APIRouter()

def serialize_row(columns, row) -> Dict[str, Any]:
    data = {}
    for col, val in zip(columns, row):
        if isinstance(val, (date, datetime)):
            data[col] = val.isoformat()
        elif isinstance(val, Decimal):
            data[col] = float(val)
        else:
            data[col] = val
    return data

def get_list_from_cursor(cursor) -> List[Dict[str, Any]]:
    columns = [column[0] for column in cursor.description]
    return [serialize_row(columns, row) for row in cursor.fetchall()]

@router.get("")
@router.get("/", include_in_schema=False)
def get_empleados(
    _: dict = Depends(require_permission("EMPLEADOS_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                e.EmpleadoID, 
                e.PrimerNombre, 
                e.SegundoNombre, 
                e.PrimerApellido, 
                e.SegundoApellido, 
                e.Cedula, 
                e.FechaNacimiento, 
                e.Sexo, 
                e.EstadoCivil, 
                e.TipoSangre, 
                e.Telefono, 
                e.CorreoPersonal, 
                e.Direccion, 
                e.Area, 
                e.FechaContratacion, 
                e.NumeroINSS, 
                e.Salario, 
                e.EstadoLaboral, 
                e.CargoID,
                c.NombreCargo,
                CAST(CASE WHEN u.UsuarioID IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS TieneUsuario,
                u.Estado AS EstadoUsuario,
                r.NombreRol
            FROM Empleados e
            INNER JOIN Cargos c ON e.CargoID = c.CargoID
            LEFT JOIN Usuarios u ON e.EmpleadoID = u.EmpleadoID
            LEFT JOIN Roles r ON u.RolID = r.RolID
            ORDER BY e.PrimerNombre, e.PrimerApellido
        """)
        return get_list_from_cursor(cursor)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.get("/sin-usuario")
def get_empleados_sin_usuario(
    _: dict = Depends(require_any_permission(['USUARIOS_CREATE', 'USUARIOS_EDIT'])),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                e.EmpleadoID, 
                e.PrimerNombre, 
                e.SegundoNombre, 
                e.PrimerApellido, 
                e.SegundoApellido,
                c.NombreCargo
            FROM Empleados e
            INNER JOIN Cargos c ON e.CargoID = c.CargoID
            WHERE e.EmpleadoID NOT IN (SELECT EmpleadoID FROM Usuarios)
            ORDER BY e.PrimerNombre, e.PrimerApellido
        """)
        return get_list_from_cursor(cursor)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.get("/abogados")
def get_abogados(
    _: dict = Depends(require_any_permission(['EXPEDIENTES_CREATE', 'EXPEDIENTES_EDIT', 'AGENDA_CREATE', 'AGENDA_EDIT'])),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                e.EmpleadoID, 
                e.PrimerNombre, 
                e.SegundoNombre, 
                e.PrimerApellido, 
                e.SegundoApellido
            FROM Empleados e
            INNER JOIN Cargos c ON e.CargoID = c.CargoID
            WHERE c.NombreCargo = 'Abogado' AND e.EstadoLaboral = 'Activo'
            ORDER BY e.PrimerNombre, e.PrimerApellido
        """)
        return get_list_from_cursor(cursor)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.get("/{empleado_id}")
def get_empleado_by_id(
    empleado_id: int,
    _: dict = Depends(require_permission("EMPLEADOS_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                e.EmpleadoID, 
                e.PrimerNombre, 
                e.SegundoNombre, 
                e.PrimerApellido, 
                e.SegundoApellido, 
                e.Cedula, 
                e.FechaNacimiento, 
                e.Sexo, 
                e.EstadoCivil, 
                e.TipoSangre, 
                e.Telefono, 
                e.CorreoPersonal, 
                e.Direccion, 
                e.Area, 
                e.FechaContratacion, 
                e.NumeroINSS, 
                e.Salario, 
                e.EstadoLaboral, 
                e.CargoID
            FROM Empleados e
            WHERE e.EmpleadoID = ?
        """, empleado_id)
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Empleado no encontrado.")
            
        columns = [column[0] for column in cursor.description]
        return serialize_row(columns, row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.post("", status_code=201)
@router.post("/", status_code=201, include_in_schema=False)
def create_empleado(
    empleado: EmpleadoCreate,
    payload: dict = Depends(require_permission("EMPLEADOS_CREATE")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Empleados (
                PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido,
                Cedula, FechaNacimiento, Sexo, EstadoCivil, TipoSangre,
                Telefono, CorreoPersonal, Direccion, Area, FechaContratacion,
                NumeroINSS, Salario, EstadoLaboral, CargoID, CreadoPorUsuarioID
            ) OUTPUT INSERTED.EmpleadoID VALUES (
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?
            );
        """, 
            empleado.primerNombre, empleado.segundoNombre or None, empleado.primerApellido, empleado.segundoApellido or None,
            empleado.cedula, empleado.fechaNacimiento, empleado.sexo, empleado.estadoCivil, empleado.tipoSangre or None,
            empleado.telefono, empleado.correoPersonal or None, empleado.direccion or None, empleado.area or None, empleado.fechaContratacion,
            empleado.numeroINSS or None, float(empleado.salario), empleado.estadoLaboral, empleado.cargoId, payload["usuarioId"]
        )
        
        row = cursor.fetchone()
        conn.commit()
        
        return {
            "message": "Empleado registrado exitosamente.",
            "empleadoId": row[0]
        }
    except pyodbc.IntegrityError as e:
        conn.rollback()
        error_msg = str(e)
        if 'UQ_Empleados_Cedula' in error_msg:
            raise HTTPException(status_code=409, detail="Ya existe un empleado registrado con esa cédula de identidad.")
        if 'UQ_Empleados_NumeroINSS' in error_msg:
            raise HTTPException(status_code=409, detail="El número INSS especificado ya está asociado a otro empleado.")
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.put("/{empleado_id}")
def update_empleado(
    empleado_id: int,
    empleado: EmpleadoUpdate,
    _: dict = Depends(require_permission("EMPLEADOS_EDIT")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Empleados SET 
                PrimerNombre = ?,
                SegundoNombre = ?,
                PrimerApellido = ?,
                SegundoApellido = ?,
                Cedula = ?,
                FechaNacimiento = ?,
                Sexo = ?,
                EstadoCivil = ?,
                TipoSangre = ?,
                Telefono = ?,
                CorreoPersonal = ?,
                Direccion = ?,
                Area = ?,
                FechaContratacion = ?,
                NumeroINSS = ?,
                Salario = ?,
                EstadoLaboral = ?,
                CargoID = ?,
                FechaModificacion = SYSDATETIME()
            WHERE EmpleadoID = ?
        """, 
            empleado.primerNombre, empleado.segundoNombre or None, empleado.primerApellido, empleado.segundoApellido or None,
            empleado.cedula, empleado.fechaNacimiento, empleado.sexo, empleado.estadoCivil, empleado.tipoSangre or None,
            empleado.telefono, empleado.correoPersonal or None, empleado.direccion or None, empleado.area or None, empleado.fechaContratacion,
            empleado.numeroINSS or None, float(empleado.salario), empleado.estadoLaboral, empleado.cargoId,
            empleado_id
        )
        
        if cursor.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Empleado no encontrado o no se pudo actualizar.")
            
        conn.commit()
        return {"message": "Empleado actualizado correctamente."}
        
    except pyodbc.IntegrityError as e:
        conn.rollback()
        error_msg = str(e)
        if 'UQ_Empleados_Cedula' in error_msg:
            raise HTTPException(status_code=409, detail="Ya existe un empleado registrado con esa cédula de identidad.")
        if 'UQ_Empleados_NumeroINSS' in error_msg:
            raise HTTPException(status_code=409, detail="El número INSS especificado ya está asociado a otro empleado.")
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
