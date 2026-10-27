from fastapi import APIRouter, Depends, HTTPException, status
import pyodbc
from typing import List, Dict, Any
from datetime import date, datetime

from ...schemas.cliente import ClienteCreate, ClienteUpdate
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

@router.get("/")
def get_clientes(
    _: dict = Depends(require_permission("CLIENTES_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                c.ClienteID,
                c.TipoCliente,
                c.Telefono,
                c.Correo,
                n.PrimerNombre,
                n.PrimerApellido,
                n.Cedula,
                j.RazonSocial,
                j.RUC
            FROM Clientes c
            LEFT JOIN Clientes_PersonasNaturales n ON c.ClienteID = n.ClienteID
            LEFT JOIN Clientes_PersonasJuridicas j ON c.ClienteID = j.ClienteID
            ORDER BY c.FechaCreacion DESC
        """)
        cols = [col[0] for col in cursor.description]
        return [serialize_row(cols, row) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.get("/lista")
def get_clientes_lista(
    _: dict = Depends(require_permission("CLIENTES_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                c.ClienteID,
                c.TipoCliente,
                n.PrimerNombre, n.PrimerApellido,
                j.RazonSocial
            FROM Clientes c
            LEFT JOIN Clientes_PersonasNaturales n ON c.ClienteID = n.ClienteID
            LEFT JOIN Clientes_PersonasJuridicas j ON c.ClienteID = j.ClienteID
            ORDER BY c.ClienteID DESC
        """)
        cols = [col[0] for col in cursor.description]
        return [serialize_row(cols, row) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.get("/{cliente_id}")
def get_cliente_by_id(
    cliente_id: int,
    _: dict = Depends(require_permission("CLIENTES_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                c.*,
                n.PrimerNombre, n.SegundoNombre, n.PrimerApellido, n.SegundoApellido, n.Cedula, n.FechaNacimiento, n.Sexo, n.EstadoCivil, n.TipoSangre, n.Observaciones AS ObsNatural,
                j.RazonSocial, j.NombreComercial, j.RUC, j.RepresentantePrimerNombre, j.RepresentanteSegundoNombre, j.RepresentantePrimerApellido, j.RepresentanteSegundoApellido, j.RepresentanteCedula, j.Observaciones AS ObsJuridica
            FROM Clientes c
            LEFT JOIN Clientes_PersonasNaturales n ON c.ClienteID = n.ClienteID
            LEFT JOIN Clientes_PersonasJuridicas j ON c.ClienteID = j.ClienteID
            WHERE c.ClienteID = ?
        """, cliente_id)
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Cliente no encontrado.")
        cols = [col[0] for col in cursor.description]
        return serialize_row(cols, row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.post("", status_code=201)
@router.post("/", status_code=201, include_in_schema=False)
def create_cliente(
    cliente: ClienteCreate,
    payload: dict = Depends(require_permission("CLIENTES_CREATE")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    if not cliente.tipoCliente or cliente.tipoCliente not in ('N', 'J'):
        raise HTTPException(status_code=400, detail="Tipo de cliente inválido. Debe ser N o J.")

    if not cliente.telefono:
        raise HTTPException(status_code=400, detail="El teléfono es obligatorio.")

    if cliente.tipoCliente == 'N':
        if not cliente.primerNombre or not cliente.primerApellido or not cliente.cedula:
            raise HTTPException(status_code=400, detail="Primer nombre, primer apellido y cédula son obligatorios para persona natural.")
    elif cliente.tipoCliente == 'J':
        if not cliente.razonSocial or not cliente.ruc or not cliente.representantePrimerNombre or not cliente.representantePrimerApellido or not cliente.representanteCedula:
            raise HTTPException(status_code=400, detail="Faltan campos obligatorios para persona jurídica (Razón social, RUC o datos del representante legal).")

    try:
        cursor = conn.cursor()

        # 1. Insertar en Clientes
        cursor.execute("""
            INSERT INTO Clientes (TipoCliente, Telefono, Correo, Direccion, CreadoPorUsuarioID)
            OUTPUT INSERTED.ClienteID
            VALUES (?, ?, ?, ?, ?)
        """, cliente.tipoCliente, cliente.telefono, cliente.correo or None, cliente.direccion or None, payload.get("usuarioId"))

        nuevo_cliente_id = cursor.fetchone()[0]

        # 2. Insertar en Subtipo
        if cliente.tipoCliente == 'N':
            fecha_nac = cliente.fechaNacimiento.strip() if (cliente.fechaNacimiento and cliente.fechaNacimiento.strip()) else None
            cursor.execute("""
                INSERT INTO Clientes_PersonasNaturales 
                (ClienteID, PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido, Cedula, FechaNacimiento, Sexo, EstadoCivil, TipoSangre, Observaciones)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, nuevo_cliente_id, cliente.primerNombre, cliente.segundoNombre or None, cliente.primerApellido, cliente.segundoApellido or None, cliente.cedula, fecha_nac, cliente.sexo or None, cliente.estadoCivil or None, cliente.tipoSangre or None, cliente.observaciones or None)
        else:
            cursor.execute("""
                INSERT INTO Clientes_PersonasJuridicas
                (ClienteID, RazonSocial, NombreComercial, RUC, RepresentantePrimerNombre, RepresentanteSegundoNombre, RepresentantePrimerApellido, RepresentanteSegundoApellido, RepresentanteCedula, Observaciones)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, nuevo_cliente_id, cliente.razonSocial, cliente.nombreComercial or None, cliente.ruc, cliente.representantePrimerNombre, cliente.representanteSegundoNombre or None, cliente.representantePrimerApellido, cliente.representanteSegundoApellido or None, cliente.representanteCedula, cliente.observaciones or None)

        conn.commit()
        return {"message": "Cliente registrado exitosamente.", "clienteId": nuevo_cliente_id}

    except HTTPException:
        conn.rollback()
        raise
    except pyodbc.IntegrityError as e:
        conn.rollback()
        err_msg = str(e)
        if "UQ_ClientesNat_Cedula" in err_msg:
            raise HTTPException(status_code=409, detail="La cédula ingresada ya está registrada.")
        if "UQ_ClientesJur_RUC" in err_msg:
            raise HTTPException(status_code=409, detail="El RUC ingresado ya está registrado.")
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.put("/{cliente_id}")
def update_cliente(
    cliente_id: int,
    cliente: ClienteUpdate,
    _: dict = Depends(require_permission("CLIENTES_EDIT")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    if not cliente.telefono:
        raise HTTPException(status_code=400, detail="El teléfono es obligatorio.")

    try:
        cursor = conn.cursor()

        # Consultar el cliente existente para obtener su tipo real
        cursor.execute("SELECT TipoCliente FROM Clientes WHERE ClienteID = ?", cliente_id)
        check_row = cursor.fetchone()
        if not check_row:
            raise HTTPException(status_code=404, detail="Cliente no encontrado.")

        tipo_real = check_row[0]

        # Validaciones según tipo real
        if tipo_real == 'N':
            if not cliente.primerNombre or not cliente.primerApellido or not cliente.cedula:
                raise HTTPException(status_code=400, detail="Primer nombre, primer apellido y cédula son obligatorios.")
        elif tipo_real == 'J':
            if not cliente.razonSocial or not cliente.ruc or not cliente.representantePrimerNombre or not cliente.representantePrimerApellido or not cliente.representanteCedula:
                raise HTTPException(status_code=400, detail="Faltan campos obligatorios para la actualización.")

        # 1. Actualizar Maestro
        cursor.execute("""
            UPDATE Clientes SET 
                Telefono = ?,
                Correo = ?,
                Direccion = ?,
                FechaModificacion = SYSDATETIME()
            WHERE ClienteID = ?
        """, cliente.telefono, cliente.correo or None, cliente.direccion or None, cliente_id)

        # 2. Actualizar Subtipo
        if tipo_real == 'N':
            fecha_nac = cliente.fechaNacimiento.strip() if (cliente.fechaNacimiento and cliente.fechaNacimiento.strip()) else None
            cursor.execute("""
                UPDATE Clientes_PersonasNaturales SET
                    PrimerNombre = ?,
                    SegundoNombre = ?,
                    PrimerApellido = ?,
                    SegundoApellido = ?,
                    Cedula = ?,
                    FechaNacimiento = ?,
                    Sexo = ?,
                    EstadoCivil = ?,
                    TipoSangre = ?,
                    Observaciones = ?
                WHERE ClienteID = ?
            """, cliente.primerNombre, cliente.segundoNombre or None, cliente.primerApellido, cliente.segundoApellido or None, cliente.cedula, fecha_nac, cliente.sexo or None, cliente.estadoCivil or None, cliente.tipoSangre or None, cliente.observaciones or None, cliente_id)
        else:
            cursor.execute("""
                UPDATE Clientes_PersonasJuridicas SET
                    RazonSocial = ?,
                    NombreComercial = ?,
                    RUC = ?,
                    RepresentantePrimerNombre = ?,
                    RepresentanteSegundoNombre = ?,
                    RepresentantePrimerApellido = ?,
                    RepresentanteSegundoApellido = ?,
                    RepresentanteCedula = ?,
                    Observaciones = ?
                WHERE ClienteID = ?
            """, cliente.razonSocial, cliente.nombreComercial or None, cliente.ruc, cliente.representantePrimerNombre, cliente.representanteSegundoNombre or None, cliente.representantePrimerApellido, cliente.representanteSegundoApellido or None, cliente.representanteCedula, cliente.observaciones or None, cliente_id)

        conn.commit()
        return {"message": "Cliente actualizado correctamente."}

    except HTTPException:
        conn.rollback()
        raise
    except pyodbc.IntegrityError as e:
        conn.rollback()
        err_msg = str(e)
        if "UQ_ClientesNat_Cedula" in err_msg:
            raise HTTPException(status_code=409, detail="La cédula ingresada ya está registrada en otro cliente.")
        if "UQ_ClientesJur_RUC" in err_msg:
            raise HTTPException(status_code=409, detail="El RUC ingresado ya está registrado en otro cliente.")
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
