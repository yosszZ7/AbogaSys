from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, RedirectResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from datetime import datetime, timezone
import os
import pyodbc

# slowapi
from slowapi.errors import RateLimitExceeded

# Cargar variables de entorno antes de importar la configuración
ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=ENV_PATH)

from .config.database import get_connection
from .api.routers import (
    auth,
    test_permissions,
    empleados,
    cargos,
    roles,
    materias,
    tipos_actividad,
    tipos_documento,
    usuarios,
    clientes,
    expedientes,
    agenda,
    dashboard,
    documentos,
    ia,
)
from .core.limiter import limiter

app = FastAPI()

app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    msg = "Demasiados intentos de inicio de sesión. Por favor, inténtalo de nuevo más tarde."
    return JSONResponse(
        status_code=429,
        content={"detail": msg, "message": msg}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "message": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"detail": "Datos inválidos o faltan campos obligatorios.", "message": "Datos inválidos o faltan campos obligatorios."}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:8080",
        "http://localhost:8080",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(test_permissions.router, prefix="/api/test", tags=["test"])
app.include_router(empleados.router, prefix="/api/empleados", tags=["empleados"])
app.include_router(cargos.router, prefix="/api/cargos", tags=["cargos"])
app.include_router(roles.router, prefix="/api/roles", tags=["roles"])
app.include_router(materias.router, prefix="/api/materias", tags=["materias"])
app.include_router(tipos_actividad.router, prefix="/api/tipos-actividad", tags=["tipos-actividad"])
app.include_router(tipos_documento.router, prefix="/api/tipos-documento", tags=["tipos-documento"])
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["usuarios"])
app.include_router(clientes.router, prefix="/api/clientes", tags=["clientes"])
app.include_router(expedientes.router, prefix="/api/expedientes", tags=["expedientes"])
app.include_router(agenda.router, prefix="/api/agenda", tags=["agenda"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(documentos.router, prefix="/api/documentos", tags=["documentos"])
app.include_router(ia.router, prefix="/api/ia", tags=["ia"])

# Ruta de estado del API
@app.get("/api/status")
def api_status(conn: pyodbc.Connection = Depends(get_connection)):
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT DB_NAME() AS databaseName")
        row = cursor.fetchone()
        return {
            "app": "AbogaSys API",
            "version": "1.0.0",
            "status": "online",
            "database": row.databaseName if row else None,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "app": "AbogaSys API",
                "version": "1.0.0",
                "status": "error",
                "message": "Error de conexión a la base de datos",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "AbogaSys Python API"}

@app.get("/api/health/database")
def health_check_database(conn: pyodbc.Connection = Depends(get_connection)):
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT DB_NAME() AS database_name")
        row = cursor.fetchone()
        return {"status": "ok", "database": row.database_name if row else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database connection failed")

FAVICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="4" y1="7" x2="20" y2="7"/><polyline points="4 7 1 14 7 14 4 7"/><polyline points="20 7 17 14 23 14 20 7"/><line x1="8" y1="21" x2="16" y2="21"/></svg>"""

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(content=FAVICON_SVG, media_type="image/svg+xml")

@app.get("/login.html", include_in_schema=False)
@app.get("/pages/login.html", include_in_schema=False)
@app.get("/frontend/login.html", include_in_schema=False)
@app.get("/frontend/pages/login.html", include_in_schema=False)
def redirect_to_login():
    return RedirectResponse(url="/index.html")

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))
if os.path.isdir(FRONTEND_DIR):
    app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend_subpath")
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend_root")


