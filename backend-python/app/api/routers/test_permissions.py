from fastapi import APIRouter, Depends
from ..permissions import require_permission

router = APIRouter()

@router.get("/permiso-documentos")
def test_documentos(payload: dict = Depends(require_permission("DOCUMENTOS_VIEW"))):
    return {"message": "Acceso permitido a documentos", "user_id": payload["usuarioId"]}

@router.get("/permiso-usuarios")
def test_usuarios(payload: dict = Depends(require_permission("USUARIOS_VIEW"))):
    return {"message": "Acceso permitido a usuarios", "user_id": payload["usuarioId"]}
