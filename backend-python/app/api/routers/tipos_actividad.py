from fastapi import APIRouter, Depends, HTTPException
import pyodbc

from ..deps import get_connection, get_current_user_token

router = APIRouter()

@router.get("")
@router.get("/", include_in_schema=False)
def get_tipos_actividad(
    _: dict = Depends(get_current_user_token),
    conn: pyodbc.Connection = Depends(get_connection)
):
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT TipoActividadID, NombreActividad FROM TiposActividad ORDER BY NombreActividad")
        return [dict(zip([col[0] for col in cursor.description], row)) for row in cursor.fetchall()]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la solicitud.")
