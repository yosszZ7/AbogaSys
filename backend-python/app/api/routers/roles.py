from fastapi import APIRouter, Depends, HTTPException
import pyodbc

from ..deps import get_connection
from ..permissions import require_any_permission

router = APIRouter()

@router.get("")
@router.get("/", include_in_schema=False)
def get_roles(
    _: dict = Depends(require_any_permission(["USUARIOS_CREATE", "USUARIOS_EDIT"])),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT RolID, NombreRol, Descripcion FROM Roles ORDER BY NombreRol")
        return [dict(zip([col[0] for col in cursor.description], row)) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
