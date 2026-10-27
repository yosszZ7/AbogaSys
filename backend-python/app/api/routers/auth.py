import os
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
import pyodbc

from ...schemas.auth import LoginRequest, LoginResponse, UserMeResponse
from ...core.security import verify_password, create_access_token
from ...core.limiter import limiter
from ..deps import get_connection, get_current_user_token

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/15minute")
def login(request: Request, login_data: LoginRequest, response: Response, conn: pyodbc.Connection = Depends(get_connection)):
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.UsuarioID, u.PasswordHash, u.Estado, u.EmpleadoID, u.RolID
            FROM Usuarios u
            WHERE u.CorreoAcceso = ?
        """, login_data.email.strip().lower())
        
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
        
        # Verify active state
        if not row.Estado:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
            
        # Verify password
        if not verify_password(login_data.password, row.PasswordHash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
            
        # Create token
        token_payload = {
            "usuarioId": row.UsuarioID,
            "empleadoId": row.EmpleadoID,
            "rolId": row.RolID
        }
        
        token = create_access_token(token_payload)
        
        # Set cookie matching exactly node settings
        is_secure = os.environ.get("NODE_ENV") == "production"
        
        response.set_cookie(
            key="token",
            value=token,
            httponly=True,
            secure=is_secure,
            samesite="lax",
            max_age=8 * 60 * 60, # 8 hours in seconds
            path="/"
        )
        
        return {
            "message": "Inicio de sesión exitoso",
            "user": {
                "usuarioId": row.UsuarioID,
                "rolId": row.RolID
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al procesar la solicitud.")

@router.get("/me", response_model=UserMeResponse)
def get_me(payload: dict = Depends(get_current_user_token), conn: pyodbc.Connection = Depends(get_connection)):
    try:
        usuario_id = payload["usuarioId"]
        cursor = conn.cursor()
        
        # Get user details
        cursor.execute("""
            SELECT 
                u.UsuarioID, 
                e.PrimerNombre + ' ' + e.PrimerApellido AS Nombre, 
                u.CorreoAcceso AS Correo, 
                r.NombreRol
            FROM Usuarios u
            INNER JOIN Empleados e ON u.EmpleadoID = e.EmpleadoID
            INNER JOIN Roles r ON u.RolID = r.RolID
            WHERE u.UsuarioID = ? AND u.Estado = 1
        """, usuario_id)
        
        user_row = cursor.fetchone()
        if not user_row:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado o inactivo.")
            
        # Get permissions
        cursor.execute("""
            SELECT p.CodigoPermiso
            FROM Usuarios u
            INNER JOIN Roles_Permisos rp ON u.RolID = rp.RolID
            INNER JOIN Permisos p ON rp.PermisoID = p.PermisoID
            WHERE u.UsuarioID = ?
        """, usuario_id)
        
        permisos_rows = cursor.fetchall()
        permisos = [row.CodigoPermiso for row in permisos_rows]
        
        return {
            "user": {
                "id": user_row.UsuarioID,
                "nombre": user_row.Nombre,
                "correo": user_row.Correo,
                "rol": user_row.NombreRol,
                "permisos": permisos
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al procesar la solicitud.")

@router.post("/logout")
def logout(response: Response, _: dict = Depends(get_current_user_token)):
    is_secure = os.environ.get("NODE_ENV") == "production"
    response.delete_cookie(
        key="token",
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/"
    )
    return {"message": "Sesión cerrada exitosamente."}
