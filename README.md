# AbogaSys - Sistema Web de Gestión Jurídica

AbogaSys es una plataforma web modular diseñada para la administración y gestión integral del trabajo en despachos jurídicos y bufetes de abogados, incluyendo control de clientes (personas naturales y jurídicas), expedientes judiciales, agenda procesal, repositorio documental con análisis asistido por Inteligencia Artificial (OpenAI) y control de acceso basado en roles y permisos (RBAC).

---

## Estructura del Proyecto

El proyecto está organizado de forma desacoplada y modular, con un backend **100% en Python (FastAPI)**:

```text
AbogaSys-web/
├── backend-python/                     # Servidor API REST 100% en Python (FastAPI)
│   ├── app/
│   │   ├── main.py                     # Punto de entrada FastAPI, CORS, Rate Limiting y registro de routers
│   │   ├── api/
│   │   │   ├── deps.py                 # Dependencias de inyección (conexión DB y validación JWT en cookie)
│   │   │   ├── permissions.py          # Middleware/dependencias RBAC (require_permission, require_any_permission)
│   │   │   └── routers/                # Endpoints modulares del API
│   │   │       ├── auth.py             # Autenticación (/api/auth)
│   │       │   ├── usuarios.py         # Gestión de cuentas de usuario (/api/usuarios)
│   │       │   ├── empleados.py        # Gestión de personal y abogados (/api/empleados)
│   │       │   ├── cargos.py           # Catálogo de cargos laborales (/api/cargos)
│   │       │   ├── roles.py            # Catálogo de roles del sistema (/api/roles)
│   │       │   ├── clientes.py         # Clientes Naturales y Jurídicos (/api/clientes)
│   │       │   ├── expedientes.py      # Expedientes judiciales (/api/expedientes)
│   │       │   ├── materias.py         # Catálogo de materias de derecho (/api/materias)
│   │       │   ├── agenda.py           # Calendario y actividades procesales (/api/agenda)
│   │       │   ├── tipos_actividad.py  # Catálogo de tipos de actividad (/api/tipos-actividad)
│   │       │   ├── documentos.py       # Repositorio documental y descargas (/api/documentos)
│   │       │   ├── tipos_documento.py  # Catálogo de tipos de documento (/api/tipos-documento)
│   │       │   ├── dashboard.py        # Métricas e indicadores del panel principal (/api/dashboard)
│   │       │   ├── ia.py               # Análisis inteligente de documentos PDF (/api/ia)
│   │       │   └── test_permissions.py # Endpoints de verificación de permisos (/api/test)
│   │   ├── config/
│   │   │   └── database.py             # Gestión de conexiones a SQL Server mediante pyodbc
│   │   ├── core/
│   │   │   ├── limiter.py              # Configuración de Rate Limiting (SlowAPI)
│   │   │   └── security.py             # Hashing con bcrypt y firma/validación de tokens JWT
│   │   ├── schemas/                    # Modelos de validación de datos con Pydantic
│   │   │   ├── agenda.py
│   │   │   ├── auth.py
│   │   │   ├── cliente.py
│   │   │   ├── documento.py
│   │   │   ├── empleado.py
│   │   │   ├── expediente.py
│   │   │   └── usuario.py
│   │   └── services/                   # Servicios de negocio
│   │       ├── ai_service.py           # Integración con OpenAI Structured Outputs (gpt-4o-mini)
│   │       └── document_text_service.py# Extracción de texto de archivos PDF con pypdf
│   ├── scripts/                        # Scripts administrativos CLI en Python
│   │   ├── init_admin.py               # Creación interactiva del usuario Administrador inicial
│   │   └── reset_admin_password.py     # Restablecimiento interactivo de contraseña del Administrador
│   ├── uploads/
│   │   └── documentos/                 # Almacenamiento físico de documentos jurídicos (.pdf, .doc, .docx)
│   ├── .env                            # Variables de entorno del servidor
│   ├── requirements.txt                # Dependencias de Python
│   └── run.py                          # Script de arranque con Uvicorn
│
├── database/                           # Scripts SQL de estructura y datos semilla
│   ├── 01_crear_base_datos.sql         # Creación de AbogaSysDB, tablas, claves foráneas, índices y restricciones
│   └── 02_datos_iniciales.sql          # Catálogos base, permisos RBAC y asignación de permisos por rol
│
├── frontend/                           # Aplicación cliente (HTML5, CSS3, JavaScript Vanilla modular)
│   ├── index.html                      # Pantalla de inicio de sesión (Login)
│   ├── pages/                          # Vistas organizadas por módulos
│   │   ├── dashboard.html              # Panel de control principal
│   │   ├── usuarios/                   # Módulo de usuarios (listado, registro y edición)
│   │   ├── empleados/                  # Módulo de empleados/personal (listado, registro y edición)
│   │   ├── clientes/                   # Módulo de clientes naturales y jurídicos
│   │   ├── expedientes/                # Módulo de expedientes judiciales
│   │   ├── agenda/                     # Módulo de calendario y agenda jurídica
│   │   └── documentos/                 # Módulo de documentos jurídicos y asistente IA
│   ├── css/                            # Hojas de estilo modulares por vista
│   └── js/                             # Lógica de interfaz, permisos (RBAC) y consumo del API REST
│
├── .gitignore
└── README.md
```

---

## Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript Vanilla (modular, consumo de API con `fetch` y cookies `HttpOnly`).
- **Backend**: **100% Python** con **FastAPI** y servidor ASGI **Uvicorn**.
  - **Conector de Base de Datos**: `pyodbc` (ODBC Driver 17/18 for SQL Server).
  - **Seguridad y Autenticación**: `bcrypt` (hash de contraseñas), `PyJWT` (tokens JWT en cookies `HttpOnly`), `slowapi` (protección contra fuerza bruta en login).
  - **Procesamiento Documental e IA**: `pypdf` (extracción de texto PDF), `python-multipart` (carga de archivos), `openai` con Pydantic Structured Outputs (`gpt-4o-mini`).
- **Base de Datos**: Microsoft SQL Server (`AbogaSysDB`).

---

## Instrucciones de Ejecución

### 1. Base de Datos (SQL Server)
1. Abrir **SQL Server Management Studio (SSMS)** y ejecutar en orden:
   - `database/01_crear_base_datos.sql` (crea la base de datos `AbogaSysDB` y todas las tablas/restricciones).
   - `database/02_datos_iniciales.sql` (inserta roles, cargos, materias, tipos de documento/actividad y matriz de permisos).

### 2. Backend (Python + FastAPI)
1. Abrir una terminal en la carpeta `backend-python`:
   ```bash
   cd backend-python
   ```
2. Crear y activar el entorno virtual de Python (si aún no está creado):
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```
3. Instalar las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Verificar las variables de entorno en el archivo `backend-python/.env`:
   ```env
   DB_SERVER=TU_SERVIDOR_SQL
   DB_DATABASE=AbogaSysDB
   DB_USER=AbogaSysApp
   DB_PASSWORD=TuPassword
   DB_DRIVER=ODBC Driver 17 for SQL Server
   DB_TRUST_SERVER_CERTIFICATE=yes
   JWT_SECRET=super_secret_jwt_key_abogasys_2026_dev
   OPENAI_API_KEY=tu_api_key_de_openai
   PORT=3000
   ```
5. *(Opcional)* Inicializar o restablecer la cuenta del Administrador:
   ```bash
   python scripts/init_admin.py
   # o para restablecer la contraseña:
   python scripts/reset_admin_password.py
   ```
6. Iniciar el servidor FastAPI:
   ```bash
   python run.py
   ```
   *(Alternativamente: `uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload`)*
7. El servidor estará escuchando en `http://localhost:3000`.
   - Documentación interactiva Swagger UI: `http://localhost:3000/docs`
   - Documentación ReDoc: `http://localhost:3000/redoc`
   - Estado del servicio: `http://localhost:3000/api/status`

### 3. Frontend
- Servir la carpeta raíz o `frontend/` mediante una extensión como **Live Server** (en `http://localhost:5500` o `http://127.0.0.1:5500` / `8080`) y abrir `frontend/index.html` en el navegador web.
