-- ==============================================================================
-- AbogaSys - Script de Creación de Base de Datos y Estructura (V3)
-- ==============================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'AbogaSysDB')
BEGIN
    CREATE DATABASE AbogaSysDB;
END
GO

USE AbogaSysDB;
GO

-- ==============================================================================
-- 1. TABLAS DE CONFIGURACIÓN Y CATÁLOGOS BASE
-- ==============================================================================

-- 1.1 Permisos
CREATE TABLE Permisos (
    PermisoID INT IDENTITY(1,1) CONSTRAINT PK_Permisos PRIMARY KEY,
    CodigoPermiso NVARCHAR(50) NOT NULL CONSTRAINT UQ_Permisos_Codigo UNIQUE,
    Descripcion NVARCHAR(200) NOT NULL
);
GO

-- 1.2 Roles
CREATE TABLE Roles (
    RolID INT IDENTITY(1,1) CONSTRAINT PK_Roles PRIMARY KEY,
    NombreRol NVARCHAR(50) NOT NULL CONSTRAINT UQ_Roles_Nombre UNIQUE,
    Descripcion NVARCHAR(200) NULL,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Roles_FechaCreacion DEFAULT SYSDATETIME(),
    FechaModificacion DATETIME2 NULL
);
GO

-- 1.3 Roles_Permisos (N:M)
CREATE TABLE Roles_Permisos (
    RolID INT NOT NULL,
    PermisoID INT NOT NULL,
    CONSTRAINT PK_Roles_Permisos PRIMARY KEY (RolID, PermisoID),
    CONSTRAINT FK_RolesPermisos_Roles FOREIGN KEY (RolID) REFERENCES Roles(RolID),
    CONSTRAINT FK_RolesPermisos_Permisos FOREIGN KEY (PermisoID) REFERENCES Permisos(PermisoID)
);
GO

-- 1.4 Cargos (Laborales)
CREATE TABLE Cargos (
    CargoID INT IDENTITY(1,1) CONSTRAINT PK_Cargos PRIMARY KEY,
    NombreCargo NVARCHAR(100) NOT NULL CONSTRAINT UQ_Cargos_Nombre UNIQUE
);
GO

-- 1.5 Materias (Derecho)
CREATE TABLE Materias (
    MateriaID INT IDENTITY(1,1) CONSTRAINT PK_Materias PRIMARY KEY,
    NombreMateria NVARCHAR(100) NOT NULL CONSTRAINT UQ_Materias_Nombre UNIQUE
);
GO

-- 1.6 TiposDocumento
CREATE TABLE TiposDocumento (
    TipoDocumentoID INT IDENTITY(1,1) CONSTRAINT PK_TiposDocumento PRIMARY KEY,
    NombreTipo NVARCHAR(100) NOT NULL CONSTRAINT UQ_TiposDocumento_Nombre UNIQUE
);
GO

-- 1.7 TiposActividad
CREATE TABLE TiposActividad (
    TipoActividadID INT IDENTITY(1,1) CONSTRAINT PK_TiposActividad PRIMARY KEY,
    NombreActividad NVARCHAR(100) NOT NULL CONSTRAINT UQ_TiposActividad_Nombre UNIQUE
);
GO

-- ==============================================================================
-- 2. MÓDULO EMPLEADOS Y USUARIOS
-- ==============================================================================

-- 2.1 Empleados (Sin FK a Usuarios todavía para romper dependencia circular)
CREATE TABLE Empleados (
    EmpleadoID INT IDENTITY(1,1) CONSTRAINT PK_Empleados PRIMARY KEY,
    PrimerNombre NVARCHAR(50) NOT NULL,
    SegundoNombre NVARCHAR(50) NULL,
    PrimerApellido NVARCHAR(50) NOT NULL,
    SegundoApellido NVARCHAR(50) NULL,
    Cedula NVARCHAR(20) NOT NULL CONSTRAINT UQ_Empleados_Cedula UNIQUE,
    FechaNacimiento DATE NOT NULL,
    Sexo NVARCHAR(15) NOT NULL,
    EstadoCivil NVARCHAR(20) NOT NULL,
    TipoSangre NVARCHAR(5) NULL,
    Telefono NVARCHAR(20) NOT NULL,
    CorreoPersonal NVARCHAR(100) NULL,
    Direccion NVARCHAR(MAX) NULL,
    Area NVARCHAR(50) NULL,
    FechaContratacion DATE NOT NULL,
    NumeroINSS NVARCHAR(20) NULL,
    Salario DECIMAL(18,2) NOT NULL,
    EstadoLaboral NVARCHAR(20) NOT NULL,
    CargoID INT NOT NULL,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Empleados_FechaCreacion DEFAULT SYSDATETIME(),
    FechaModificacion DATETIME2 NULL,
    CreadoPorUsuarioID INT NULL, -- Se agregará FK posteriormente
    CONSTRAINT FK_Empleados_Cargos FOREIGN KEY (CargoID) REFERENCES Cargos(CargoID)
);
GO

-- Índice único filtrado para NumeroINSS (permite múltiples NULLs)
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE UNIQUE NONCLUSTERED INDEX UQ_Empleados_NumeroINSS 
ON Empleados(NumeroINSS) 
WHERE NumeroINSS IS NOT NULL;
GO

-- 2.2 Usuarios
CREATE TABLE Usuarios (
    UsuarioID INT IDENTITY(1,1) CONSTRAINT PK_Usuarios PRIMARY KEY,
    CorreoAcceso NVARCHAR(100) NOT NULL CONSTRAINT UQ_Usuarios_Correo UNIQUE,
    PasswordHash NVARCHAR(256) NOT NULL,
    Estado BIT NOT NULL CONSTRAINT DF_Usuarios_Estado DEFAULT 1,
    EmpleadoID INT NOT NULL CONSTRAINT UQ_Usuarios_Empleado UNIQUE,
    RolID INT NOT NULL,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Usuarios_FechaCreacion DEFAULT SYSDATETIME(),
    FechaModificacion DATETIME2 NULL,
    CONSTRAINT FK_Usuarios_Empleados FOREIGN KEY (EmpleadoID) REFERENCES Empleados(EmpleadoID),
    CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (RolID) REFERENCES Roles(RolID)
);
GO

-- 2.3 Resolución de Dependencia Circular (Empleados -> Usuarios)
ALTER TABLE Empleados
ADD CONSTRAINT FK_Empleados_CreadoPorUsuario 
FOREIGN KEY (CreadoPorUsuarioID) REFERENCES Usuarios(UsuarioID);
GO

-- 2.4 Empleados_Documentacion
CREATE TABLE Empleados_Documentacion (
    DocumentoLaboralID INT IDENTITY(1,1) CONSTRAINT PK_Empleados_Documentacion PRIMARY KEY,
    TipoDocumento NVARCHAR(50) NOT NULL,
    NombreArchivo NVARCHAR(200) NOT NULL,
    RutaAlmacenamiento NVARCHAR(500) NOT NULL,
    FechaCarga DATETIME2 NOT NULL CONSTRAINT DF_EmpleadosDoc_FechaCarga DEFAULT SYSDATETIME(),
    EmpleadoID INT NOT NULL,
    CONSTRAINT FK_EmpleadosDoc_Empleados FOREIGN KEY (EmpleadoID) REFERENCES Empleados(EmpleadoID)
);
GO

-- ==============================================================================
-- 3. MÓDULO CLIENTES (HERENCIA / TABLE PER TYPE)
-- ==============================================================================

-- 3.1 Clientes (Tabla Maestra)
CREATE TABLE Clientes (
    ClienteID INT IDENTITY(1,1) CONSTRAINT PK_Clientes PRIMARY KEY,
    TipoCliente CHAR(1) NOT NULL CONSTRAINT CHK_Clientes_Tipo CHECK (TipoCliente IN ('N', 'J')),
    Telefono NVARCHAR(20) NOT NULL,
    Correo NVARCHAR(100) NULL,
    Direccion NVARCHAR(MAX) NULL,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Clientes_FechaCreacion DEFAULT SYSDATETIME(),
    FechaModificacion DATETIME2 NULL,
    CreadoPorUsuarioID INT NULL,
    CONSTRAINT FK_Clientes_Usuarios FOREIGN KEY (CreadoPorUsuarioID) REFERENCES Usuarios(UsuarioID)
);
GO

-- 3.2 Clientes_PersonasNaturales
CREATE TABLE Clientes_PersonasNaturales (
    ClienteID INT NOT NULL CONSTRAINT PK_Clientes_PersonasNaturales PRIMARY KEY,
    PrimerNombre NVARCHAR(50) NOT NULL,
    SegundoNombre NVARCHAR(50) NULL,
    PrimerApellido NVARCHAR(50) NOT NULL,
    SegundoApellido NVARCHAR(50) NULL,
    Cedula NVARCHAR(20) NOT NULL CONSTRAINT UQ_ClientesNat_Cedula UNIQUE,
    FechaNacimiento DATE NULL,
    Sexo NVARCHAR(15) NULL,
    EstadoCivil NVARCHAR(20) NULL,
    TipoSangre NVARCHAR(5) NULL,
    Observaciones NVARCHAR(MAX) NULL,
    CONSTRAINT FK_ClientesNat_Clientes FOREIGN KEY (ClienteID) REFERENCES Clientes(ClienteID)
);
GO

-- 3.3 Clientes_PersonasJuridicas
CREATE TABLE Clientes_PersonasJuridicas (
    ClienteID INT NOT NULL CONSTRAINT PK_Clientes_PersonasJuridicas PRIMARY KEY,
    RazonSocial NVARCHAR(200) NOT NULL,
    NombreComercial NVARCHAR(200) NULL,
    RUC NVARCHAR(20) NOT NULL CONSTRAINT UQ_ClientesJur_RUC UNIQUE,
    RepresentantePrimerNombre NVARCHAR(50) NOT NULL,
    RepresentanteSegundoNombre NVARCHAR(50) NULL,
    RepresentantePrimerApellido NVARCHAR(50) NOT NULL,
    RepresentanteSegundoApellido NVARCHAR(50) NULL,
    RepresentanteCedula NVARCHAR(20) NOT NULL,
    Observaciones NVARCHAR(MAX) NULL,
    CONSTRAINT FK_ClientesJur_Clientes FOREIGN KEY (ClienteID) REFERENCES Clientes(ClienteID)
);
GO

-- ==============================================================================
-- 4. MÓDULO EXPEDIENTES
-- ==============================================================================

CREATE TABLE Expedientes (
    ExpedienteID INT IDENTITY(1,1) CONSTRAINT PK_Expedientes PRIMARY KEY,
    NumeroExpediente NVARCHAR(50) NOT NULL CONSTRAINT UQ_Expedientes_Numero UNIQUE,
    TipoProceso NVARCHAR(100) NOT NULL,
    JuzgadoTribunal NVARCHAR(150) NOT NULL,
    Contraparte NVARCHAR(150) NULL,
    AbogadoContraparte NVARCHAR(150) NULL,
    TelefonoContraparte NVARCHAR(20) NULL,
    FechaApertura DATE NOT NULL,
    EstadoProcesal NVARCHAR(50) NOT NULL,
    DescripcionCaso NVARCHAR(MAX) NULL,
    Observaciones NVARCHAR(MAX) NULL,
    ClienteID INT NOT NULL,
    MateriaID INT NOT NULL,
    AbogadoResponsableID INT NOT NULL,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Expedientes_FechaCreacion DEFAULT SYSDATETIME(),
    FechaModificacion DATETIME2 NULL,
    CreadoPorUsuarioID INT NULL,
    CONSTRAINT FK_Expedientes_Clientes FOREIGN KEY (ClienteID) REFERENCES Clientes(ClienteID),
    CONSTRAINT FK_Expedientes_Materias FOREIGN KEY (MateriaID) REFERENCES Materias(MateriaID),
    CONSTRAINT FK_Expedientes_Empleados FOREIGN KEY (AbogadoResponsableID) REFERENCES Empleados(EmpleadoID),
    CONSTRAINT FK_Expedientes_Usuarios FOREIGN KEY (CreadoPorUsuarioID) REFERENCES Usuarios(UsuarioID)
);
GO

-- ==============================================================================
-- 5. MÓDULO DOCUMENTOS JURÍDICOS
-- ==============================================================================

CREATE TABLE Documentos_Juridicos (
    DocumentoID INT IDENTITY(1,1) CONSTRAINT PK_Documentos_Juridicos PRIMARY KEY,
    NombreDocumento NVARCHAR(200) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    FechaDocumento DATE NOT NULL,
    RutaArchivo NVARCHAR(500) NOT NULL,
    Extension NVARCHAR(10) NOT NULL,
    TamanoBytes BIGINT NOT NULL,
    ExpedienteID INT NOT NULL,
    TipoDocumentoID INT NOT NULL,
    RegistradoPorUsuarioID INT NOT NULL,
    FechaRegistro DATETIME2 NOT NULL CONSTRAINT DF_DocumentosJur_FechaRegistro DEFAULT SYSDATETIME(),
    CONSTRAINT FK_DocumentosJur_Expedientes FOREIGN KEY (ExpedienteID) REFERENCES Expedientes(ExpedienteID),
    CONSTRAINT FK_DocumentosJur_Tipos FOREIGN KEY (TipoDocumentoID) REFERENCES TiposDocumento(TipoDocumentoID),
    CONSTRAINT FK_DocumentosJur_Usuarios FOREIGN KEY (RegistradoPorUsuarioID) REFERENCES Usuarios(UsuarioID)
);
GO

-- ==============================================================================
-- 6. MÓDULO AGENDA Y CALENDARIO
-- ==============================================================================

CREATE TABLE Actividades_Agenda (
    ActividadID INT IDENTITY(1,1) CONSTRAINT PK_Actividades_Agenda PRIMARY KEY,
    Titulo NVARCHAR(200) NOT NULL,
    FechaActividad DATE NOT NULL,
    HoraInicio TIME NOT NULL,
    HoraFin TIME NULL,
    Lugar NVARCHAR(200) NULL,
    Recordatorio NVARCHAR(50) NULL,
    Descripcion NVARCHAR(MAX) NULL,
    TipoActividadID INT NOT NULL,
    AbogadoResponsableID INT NOT NULL,
    ExpedienteID INT NULL,
    ClienteID INT NULL,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Agenda_FechaCreacion DEFAULT SYSDATETIME(),
    CreadoPorUsuarioID INT NULL,
    
    -- Claves foráneas
    CONSTRAINT FK_Agenda_TiposActividad FOREIGN KEY (TipoActividadID) REFERENCES TiposActividad(TipoActividadID),
    CONSTRAINT FK_Agenda_Empleados FOREIGN KEY (AbogadoResponsableID) REFERENCES Empleados(EmpleadoID),
    CONSTRAINT FK_Agenda_Expedientes FOREIGN KEY (ExpedienteID) REFERENCES Expedientes(ExpedienteID),
    CONSTRAINT FK_Agenda_Clientes FOREIGN KEY (ClienteID) REFERENCES Clientes(ClienteID),
    CONSTRAINT FK_Agenda_Usuarios FOREIGN KEY (CreadoPorUsuarioID) REFERENCES Usuarios(UsuarioID),
    
    -- Restricciones CHECK
    CONSTRAINT CHK_Agenda_ExpedienteCliente CHECK (
        (ExpedienteID IS NOT NULL AND ClienteID IS NULL) OR 
        (ExpedienteID IS NULL AND ClienteID IS NOT NULL) OR 
        (ExpedienteID IS NULL AND ClienteID IS NULL)
    ),
    CONSTRAINT CHK_Agenda_HoraFin CHECK (HoraFin IS NULL OR HoraFin > HoraInicio)
);
GO
