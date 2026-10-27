from fastapi import Depends, HTTPException, status
from typing import List, Callable
import pyodbc
from .deps import get_connection, get_current_user_token

def get_user_permissions(usuario_id: int, conn: pyodbc.Connection) -> List[str]:
    cursor = conn.cursor()
    
    # Check if user is still active
    cursor.execute("""
        SELECT Estado
        FROM Usuarios
        WHERE UsuarioID = ?
    """, usuario_id)
    row = cursor.fetchone()
    
    if not row or not row.Estado:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario inactivo o no encontrado.")
        
    # Get permissions
    cursor.execute("""
        SELECT p.CodigoPermiso
        FROM Usuarios u
        INNER JOIN Roles_Permisos rp ON u.RolID = rp.RolID
        INNER JOIN Permisos p ON rp.PermisoID = p.PermisoID
        WHERE u.UsuarioID = ?
    """, usuario_id)
    
    return [p.CodigoPermiso for p in cursor.fetchall()]

def require_permission(permission: str) -> Callable:
    def dependency(
        payload: dict = Depends(get_current_user_token),
        conn: pyodbc.Connection = Depends(get_connection)
    ):
        permisos = get_user_permissions(payload["usuarioId"], conn)
        if permission not in permisos:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado: permisos insuficientes.")
        return payload
    return dependency

def require_any_permission(permissions: List[str]) -> Callable:
    def dependency(
        payload: dict = Depends(get_current_user_token),
        conn: pyodbc.Connection = Depends(get_connection)
    ):
        permisos = get_user_permissions(payload["usuarioId"], conn)
        if not any(p in permisos for p in permissions):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado: permisos insuficientes.")
        return payload
    return dependency
