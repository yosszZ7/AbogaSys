USE AbogaSysDB;
GO

-- ==============================================================================
-- 1. ROLES
-- ==============================================================================
IF NOT EXISTS (SELECT 1 FROM Roles WHERE NombreRol = 'Administrador')
    INSERT INTO Roles (NombreRol, Descripcion) VALUES ('Administrador', 'Acceso total al sistema');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE NombreRol = 'Abogado')
    INSERT INTO Roles (NombreRol, Descripcion) VALUES ('Abogado', 'Acceso operativo y gestión de casos');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE NombreRol = 'Asistente legal')
    INSERT INTO Roles (NombreRol, Descripcion) VALUES ('Asistente legal', 'Acceso limitado para soporte en expedientes');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE NombreRol = 'Recepcionista')
    INSERT INTO Roles (NombreRol, Descripcion) VALUES ('Recepcionista', 'Recepción y atención inicial de clientes');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE NombreRol = 'Contador')
    INSERT INTO Roles (NombreRol, Descripcion) VALUES ('Contador', 'Gestión administrativa y financiera');
GO

-- ==============================================================================
-- 2. CARGOS
-- ==============================================================================
IF NOT EXISTS (SELECT 1 FROM Cargos WHERE NombreCargo = 'Abogado')
    INSERT INTO Cargos (NombreCargo) VALUES ('Abogado');
IF NOT EXISTS (SELECT 1 FROM Cargos WHERE NombreCargo = 'Asistente legal')
    INSERT INTO Cargos (NombreCargo) VALUES ('Asistente legal');
IF NOT EXISTS (SELECT 1 FROM Cargos WHERE NombreCargo = 'Recepcionista')
    INSERT INTO Cargos (NombreCargo) VALUES ('Recepcionista');
IF NOT EXISTS (SELECT 1 FROM Cargos WHERE NombreCargo = 'Administrador')
    INSERT INTO Cargos (NombreCargo) VALUES ('Administrador');
IF NOT EXISTS (SELECT 1 FROM Cargos WHERE NombreCargo = 'Contador')
    INSERT INTO Cargos (NombreCargo) VALUES ('Contador');
IF NOT EXISTS (SELECT 1 FROM Cargos WHERE NombreCargo = 'Otro')
    INSERT INTO Cargos (NombreCargo) VALUES ('Otro');
GO

-- ==============================================================================
-- 3. MATERIAS
-- ==============================================================================
IF NOT EXISTS (SELECT 1 FROM Materias WHERE NombreMateria = 'Civil')
    INSERT INTO Materias (NombreMateria) VALUES ('Civil');
IF NOT EXISTS (SELECT 1 FROM Materias WHERE NombreMateria = 'Penal')
    INSERT INTO Materias (NombreMateria) VALUES ('Penal');
IF NOT EXISTS (SELECT 1 FROM Materias WHERE NombreMateria = 'Laboral')
    INSERT INTO Materias (NombreMateria) VALUES ('Laboral');
IF NOT EXISTS (SELECT 1 FROM Materias WHERE NombreMateria = 'Familia')
    INSERT INTO Materias (NombreMateria) VALUES ('Familia');
IF NOT EXISTS (SELECT 1 FROM Materias WHERE NombreMateria = 'Mercantil')
    INSERT INTO Materias (NombreMateria) VALUES ('Mercantil');
IF NOT EXISTS (SELECT 1 FROM Materias WHERE NombreMateria = 'Administrativo')
    INSERT INTO Materias (NombreMateria) VALUES ('Administrativo');
GO

-- ==============================================================================
-- 4. TIPOS DE DOCUMENTO
-- ==============================================================================
IF NOT EXISTS (SELECT 1 FROM TiposDocumento WHERE NombreTipo = 'Demanda')
    INSERT INTO TiposDocumento (NombreTipo) VALUES ('Demanda');
IF NOT EXISTS (SELECT 1 FROM TiposDocumento WHERE NombreTipo = 'Contestación')
    INSERT INTO TiposDocumento (NombreTipo) VALUES ('Contestación');
IF NOT EXISTS (SELECT 1 FROM TiposDocumento WHERE NombreTipo = 'Sentencia / Resolución')
    INSERT INTO TiposDocumento (NombreTipo) VALUES ('Sentencia / Resolución');
IF NOT EXISTS (SELECT 1 FROM TiposDocumento WHERE NombreTipo = 'Contrato')
    INSERT INTO TiposDocumento (NombreTipo) VALUES ('Contrato');
IF NOT EXISTS (SELECT 1 FROM TiposDocumento WHERE NombreTipo = 'Poder')
    INSERT INTO TiposDocumento (NombreTipo) VALUES ('Poder');
IF NOT EXISTS (SELECT 1 FROM TiposDocumento WHERE NombreTipo = 'Escrito')
    INSERT INTO TiposDocumento (NombreTipo) VALUES ('Escrito');
IF NOT EXISTS (SELECT 1 FROM TiposDocumento WHERE NombreTipo = 'Documento probatorio')
    INSERT INTO TiposDocumento (NombreTipo) VALUES ('Documento probatorio');
IF NOT EXISTS (SELECT 1 FROM TiposDocumento WHERE NombreTipo = 'Identificación')
    INSERT INTO TiposDocumento (NombreTipo) VALUES ('Identificación');
IF NOT EXISTS (SELECT 1 FROM TiposDocumento WHERE NombreTipo = 'Otro')
    INSERT INTO TiposDocumento (NombreTipo) VALUES ('Otro');
GO

-- ==============================================================================
-- 5. TIPOS DE ACTIVIDAD
-- ==============================================================================
IF NOT EXISTS (SELECT 1 FROM TiposActividad WHERE NombreActividad = 'Audiencia')
    INSERT INTO TiposActividad (NombreActividad) VALUES ('Audiencia');
IF NOT EXISTS (SELECT 1 FROM TiposActividad WHERE NombreActividad = 'Reunión con cliente')
    INSERT INTO TiposActividad (NombreActividad) VALUES ('Reunión con cliente');
IF NOT EXISTS (SELECT 1 FROM TiposActividad WHERE NombreActividad = 'Vencimiento de plazo')
    INSERT INTO TiposActividad (NombreActividad) VALUES ('Vencimiento de plazo');
IF NOT EXISTS (SELECT 1 FROM TiposActividad WHERE NombreActividad = 'Presentación de escrito')
    INSERT INTO TiposActividad (NombreActividad) VALUES ('Presentación de escrito');
IF NOT EXISTS (SELECT 1 FROM TiposActividad WHERE NombreActividad = 'Recordatorio')
    INSERT INTO TiposActividad (NombreActividad) VALUES ('Recordatorio');
IF NOT EXISTS (SELECT 1 FROM TiposActividad WHERE NombreActividad = 'Otra')
    INSERT INTO TiposActividad (NombreActividad) VALUES ('Otra');
GO

-- ==============================================================================
-- 6. PERMISOS
-- ==============================================================================
-- Definimos una variable de tabla para simplificar las validaciones de existencia
DECLARE @PermisosBase TABLE (Codigo NVARCHAR(50), Descripcion NVARCHAR(200));
INSERT INTO @PermisosBase (Codigo, Descripcion) VALUES
('DASHBOARD_VIEW', 'Ver panel de control principal'),
('USUARIOS_VIEW', 'Ver listado de usuarios'),
('USUARIOS_CREATE', 'Crear nuevos usuarios'),
('USUARIOS_EDIT', 'Editar información de usuarios'),
('USUARIOS_DELETE', 'Eliminar o desactivar usuarios'),
('EMPLEADOS_VIEW', 'Ver listado de empleados'),
('EMPLEADOS_CREATE', 'Registrar nuevos empleados'),
('EMPLEADOS_EDIT', 'Editar información de empleados'),
('EMPLEADOS_DELETE', 'Eliminar o desactivar empleados'),
('CLIENTES_VIEW', 'Ver listado de clientes'),
('CLIENTES_CREATE', 'Registrar nuevos clientes'),
('CLIENTES_EDIT', 'Editar información de clientes'),
('CLIENTES_DELETE', 'Eliminar clientes'),
('EXPEDIENTES_VIEW', 'Ver expedientes y casos'),
('EXPEDIENTES_CREATE', 'Crear nuevos expedientes'),
('EXPEDIENTES_EDIT', 'Editar información de expedientes'),
('EXPEDIENTES_DELETE', 'Eliminar expedientes'),
('AGENDA_VIEW', 'Ver agenda y calendario'),
('AGENDA_CREATE', 'Programar nuevas actividades'),
('AGENDA_EDIT', 'Editar actividades programadas'),
('AGENDA_DELETE', 'Eliminar actividades'),
('DOCUMENTOS_VIEW', 'Ver documentos jurídicos'),
('DOCUMENTOS_CREATE', 'Subir nuevos documentos'),
('DOCUMENTOS_EDIT', 'Editar metadatos de documentos'),
('DOCUMENTOS_DELETE', 'Eliminar documentos');

INSERT INTO Permisos (CodigoPermiso, Descripcion)
SELECT Codigo, Descripcion 
FROM @PermisosBase b
WHERE NOT EXISTS (SELECT 1 FROM Permisos p WHERE p.CodigoPermiso = b.Codigo);
GO

-- ==============================================================================
-- 7. ROLES Y PERMISOS (Asignación)
-- ==============================================================================
-- Procedimiento anónimo para asignar permisos a los roles dinámicamente

DECLARE @RolID INT;

-- 7.1 Administrador (Todos los permisos)
SELECT @RolID = RolID FROM Roles WHERE NombreRol = 'Administrador';
IF @RolID IS NOT NULL
BEGIN
    INSERT INTO Roles_Permisos (RolID, PermisoID)
    SELECT @RolID, PermisoID 
    FROM Permisos p
    WHERE NOT EXISTS (
        SELECT 1 FROM Roles_Permisos rp 
        WHERE rp.RolID = @RolID AND rp.PermisoID = p.PermisoID
    );
END

-- 7.2 Abogado (Operativo completo excepto administración de usuarios/empleados y eliminación de casos)
SELECT @RolID = RolID FROM Roles WHERE NombreRol = 'Abogado';
IF @RolID IS NOT NULL
BEGIN
    INSERT INTO Roles_Permisos (RolID, PermisoID)
    SELECT @RolID, PermisoID 
    FROM Permisos p
    WHERE CodigoPermiso IN (
        'DASHBOARD_VIEW',
        'CLIENTES_VIEW', 'CLIENTES_CREATE', 'CLIENTES_EDIT',
        'EXPEDIENTES_VIEW', 'EXPEDIENTES_CREATE', 'EXPEDIENTES_EDIT',
        'AGENDA_VIEW', 'AGENDA_CREATE', 'AGENDA_EDIT', 'AGENDA_DELETE',
        'DOCUMENTOS_VIEW', 'DOCUMENTOS_CREATE', 'DOCUMENTOS_EDIT'
    )
    AND NOT EXISTS (
        SELECT 1 FROM Roles_Permisos rp 
        WHERE rp.RolID = @RolID AND rp.PermisoID = p.PermisoID
    );
END

-- 7.3 Asistente legal (Acceso limitado, principalmente de lectura y registro básico)
SELECT @RolID = RolID FROM Roles WHERE NombreRol = 'Asistente legal';
IF @RolID IS NOT NULL
BEGIN
    INSERT INTO Roles_Permisos (RolID, PermisoID)
    SELECT @RolID, PermisoID 
    FROM Permisos p
    WHERE CodigoPermiso IN (
        'DASHBOARD_VIEW',
        'CLIENTES_VIEW',
        'EXPEDIENTES_VIEW',
        'AGENDA_VIEW', 'AGENDA_CREATE',
        'DOCUMENTOS_VIEW', 'DOCUMENTOS_CREATE'
    )
    AND NOT EXISTS (
        SELECT 1 FROM Roles_Permisos rp 
        WHERE rp.RolID = @RolID AND rp.PermisoID = p.PermisoID
    );
END

-- 7.4 Recepcionista (Atención al cliente y agenda)
SELECT @RolID = RolID FROM Roles WHERE NombreRol = 'Recepcionista';
IF @RolID IS NOT NULL
BEGIN
    INSERT INTO Roles_Permisos (RolID, PermisoID)
    SELECT @RolID, PermisoID 
    FROM Permisos p
    WHERE CodigoPermiso IN (
        'DASHBOARD_VIEW',
        'CLIENTES_VIEW', 'CLIENTES_CREATE',
        'AGENDA_VIEW', 'AGENDA_CREATE'
    )
    AND NOT EXISTS (
        SELECT 1 FROM Roles_Permisos rp 
        WHERE rp.RolID = @RolID AND rp.PermisoID = p.PermisoID
    );
END

-- 7.5 Contador (Acceso mínimo por ahora al dashboard)
SELECT @RolID = RolID FROM Roles WHERE NombreRol = 'Contador';
IF @RolID IS NOT NULL
BEGIN
    INSERT INTO Roles_Permisos (RolID, PermisoID)
    SELECT @RolID, PermisoID 
    FROM Permisos p
    WHERE CodigoPermiso = 'DASHBOARD_VIEW'
    AND NOT EXISTS (
        SELECT 1 FROM Roles_Permisos rp 
        WHERE rp.RolID = @RolID AND rp.PermisoID = p.PermisoID
    );
END
GO
