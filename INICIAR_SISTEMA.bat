@echo off
chcp 65001 >nul
title AbogaSys - Servidor Unificado (Python FastAPI)
echo ==========================================================
echo           INICIANDO SISTEMA ABOGASYS (PUERTO 3000)
echo ==========================================================
echo.
cd /d "%~dp0backend-python"

:: Verificar si el entorno virtual (.venv) pertenece a esta computadora
.\.venv\Scripts\python.exe -c "import fastapi, uvicorn, pyodbc" >nul 2>&1
if errorlevel 1 (
    echo [Aviso] Configurando entorno virtual de Python para esta computadora...
    if exist .venv rmdir /s /q .venv
    python -m venv .venv
    .\.venv\Scripts\python.exe -m pip install --upgrade pip
    .\.venv\Scripts\pip.exe install -r requirements.txt
    echo [OK] Entorno virtual configurado correctamente.
    echo.
)

start "" "http://localhost:3000"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 3000
pause
