-- ==============================================================================
-- AbogaSys - Creación de Login y Usuario de Aplicación para SQL Server
-- ==============================================================================

USE [master];
GO

IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'AbogaSysApp')
BEGIN
    CREATE LOGIN [AbogaSysApp] WITH PASSWORD = N'AbogaSys!123', CHECK_POLICY = OFF;
END
GO

USE [AbogaSysDB];
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'AbogaSysApp')
BEGIN
    CREATE USER [AbogaSysApp] FOR LOGIN [AbogaSysApp];
END
GO

ALTER ROLE [db_datareader] ADD MEMBER [AbogaSysApp];
ALTER ROLE [db_datawriter] ADD MEMBER [AbogaSysApp];
GO
