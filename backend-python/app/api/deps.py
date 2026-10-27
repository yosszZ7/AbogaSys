from fastapi import Request, Depends, HTTPException, status
import pyodbc
import jwt
import os
from ..config.database import get_connection

def get_db() -> pyodbc.Connection:
    return next(get_connection())

def get_current_user_token(request: Request):
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No token provided")
    
    try:
        secret = os.environ.get("JWT_SECRET", "default_secret")
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        # Payload holds: usuarioId, empleadoId, rolId
        if "usuarioId" not in payload:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
