from fastapi import APIRouter, Depends, HTTPException, status
import pyodbc

from ...schemas.usuario import UsuarioCreate, UsuarioUpdate
from ..deps import get_connection
from ..permissions import require_permission
from ...core.security import hash_password

router = APIRouter()

@router.get("")
@router.get("/", include_in_schema=False)
def get_usuarios(
    _: dict = Depends(require_permission("USUARIOS_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                u.UsuarioID,
                u.CorreoAcceso,
                u.Estado,
                u.EmpleadoID,
                u.RolID,
                r.NombreRol,
                e.PrimerNombre,
                e.SegundoNombre,
                e.PrimerApellido,
                e.SegundoApellido
            FROM Usuarios u
            INNER JOIN Empleados e ON u.EmpleadoID = e.EmpleadoID
            INNER JOIN Roles r ON u.RolID = r.RolID
            ORDER BY e.PrimerNombre, e.PrimerApellido
        """)
        return [dict(zip([col[0] for col in cursor.description], row)) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.get("/{usuario_id}")
def get_usuario_by_id(
    usuario_id: int,
    _: dict = Depends(require_permission("USUARIOS_VIEW")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                u.UsuarioID,
                u.CorreoAcceso,
                u.Estado,
                u.EmpleadoID,
                u.RolID,
                r.NombreRol,
                e.PrimerNombre,
                e.SegundoNombre,
                e.PrimerApellido,
                e.SegundoApellido
            FROM Usuarios u
            INNER JOIN Empleados e ON u.EmpleadoID = e.EmpleadoID
            INNER JOIN Roles r ON u.RolID = r.RolID
            WHERE u.UsuarioID = ?
        """, usuario_id)
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        return dict(zip([col[0] for col in cursor.description], row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.post("", status_code=201)
@router.post("/", status_code=201, include_in_schema=False)
def create_usuario(
    usuario: UsuarioCreate,
    _: dict = Depends(require_permission("USUARIOS_CREATE")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()

        # Comprobar que EmpleadoID existe y no tiene usuario ya asignado
        cursor.execute("""
            SELECT EmpleadoID, 
                   (SELECT COUNT(*) FROM Usuarios WHERE EmpleadoID = ?) AS NumUsuarios 
            FROM Empleados WHERE EmpleadoID = ?
        """, usuario.empleadoId, usuario.empleadoId)
        emp_row = cursor.fetchone()

        if not emp_row:
            raise HTTPException(status_code=404, detail="El empleado seleccionado no existe.")
        if emp_row.NumUsuarios > 0:
            raise HTTPException(status_code=409, detail="El empleado ya tiene una cuenta de usuario asignada.")

        # Comprobar que el Rol existe
        cursor.execute("SELECT RolID FROM Roles WHERE RolID = ?", usuario.rolId)
        rol_row = cursor.fetchone()
        if not rol_row:
            raise HTTPException(status_code=404, detail="El rol seleccionado no existe.")

        # Hashear password
        password_hash = hash_password(usuario.password)

        cursor.execute("""
            INSERT INTO Usuarios (CorreoAcceso, PasswordHash, EmpleadoID, RolID)
            OUTPUT INSERTED.UsuarioID
            VALUES (?, ?, ?, ?);
        """, usuario.correoAcceso, password_hash, usuario.empleadoId, usuario.rolId)
        
        nuevo_id = cursor.fetchone()[0]
        conn.commit()

        return {
            "message": "Usuario registrado exitosamente.",
            "usuarioId": nuevo_id
        }
    except HTTPException:
        conn.rollback()
        raise
    except pyodbc.IntegrityError as e:
        conn.rollback()
        err_msg = str(e)
        if "UQ_Usuarios_Correo" in err_msg:
            raise HTTPException(status_code=409, detail="El correo de acceso ya está en uso.")
        if "UQ_Usuarios_Empleado" in err_msg:
            raise HTTPException(status_code=409, detail="El empleado ya tiene una cuenta de usuario.")
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")

@router.put("/{usuario_id}")
def update_usuario(
    usuario_id: int,
    usuario: UsuarioUpdate,
    payload: dict = Depends(require_permission("USUARIOS_EDIT")),
    conn: pyodbc.Connection = Depends(get_connection)
):
    # Convertir estado a bit (1 o 0)
    if isinstance(usuario.estado, bool):
        estado_bit = 1 if usuario.estado else 0
    elif isinstance(usuario.estado, int):
        estado_bit = 1 if usuario.estado == 1 else 0
    else:
        estado_bit = 1 if str(usuario.estado).strip().lower() in ("true", "1") else 0

    # Evitar que un usuario se desactive a sí mismo
    if estado_bit == 0 and int(payload.get("usuarioId", 0)) == int(usuario_id):
        raise HTTPException(status_code=403, detail="No puedes desactivar tu propia cuenta.")

    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Usuarios SET 
                CorreoAcceso = ?,
                RolID = ?,
                Estado = ?,
                FechaModificacion = SYSDATETIME()
            WHERE UsuarioID = ?
        """, usuario.correoAcceso, usuario.rolId, estado_bit, usuario_id)

        if cursor.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Usuario no encontrado o no se pudo actualizar.")

        conn.commit()
        return {"message": "Usuario actualizado correctamente."}
    except HTTPException:
        raise
    except pyodbc.IntegrityError as e:
        conn.rollback()
        err_msg = str(e)
        if "UQ_Usuarios_Correo" in err_msg:
            raise HTTPException(status_code=409, detail="El correo de acceso ya está en uso.")
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
