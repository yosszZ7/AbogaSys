import os
import sys
import getpass

# Permitir importar desde la raíz de backend-python
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config.database import get_connection
from app.core.security import hash_password


def create_admin():
    conn_gen = get_connection()
    conn = next(conn_gen)
    try:
        cursor = conn.cursor()

        # 1. Verificar si ya existe un usuario Administrador
        cursor.execute("""
            SELECT u.UsuarioID 
            FROM Usuarios u
            INNER JOIN Roles r ON u.RolID = r.RolID
            WHERE r.NombreRol = 'Administrador'
        """)
        if cursor.fetchone():
            print("[Info] Ya existe un usuario Administrador en la base de datos.")
            return

        email = input("Introduce el correo para el nuevo Administrador: ").strip().lower()
        password = getpass.getpass("Introduce la contraseña: ")

        if not email or not password:
            print("[Error] Correo y contraseña son obligatorios.")
            return

        print("\n[Procesando...] Creando el administrador...")

        # Buscar RolID
        cursor.execute("SELECT RolID FROM Roles WHERE NombreRol = 'Administrador'")
        rol_row = cursor.fetchone()
        if not rol_row:
            raise RuntimeError("No existe el rol 'Administrador' en la base de datos.")
        rol_id = rol_row[0]

        # Buscar CargoID
        cursor.execute("SELECT CargoID FROM Cargos WHERE NombreCargo = 'Administrador'")
        cargo_row = cursor.fetchone()
        if not cargo_row:
            raise RuntimeError("No existe el cargo 'Administrador' en la base de datos.")
        cargo_id = cargo_row[0]

        # Insertar Empleado base del sistema
        cursor.execute("""
            INSERT INTO Empleados (
                PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido, 
                Cedula, FechaNacimiento, Sexo, EstadoCivil, Telefono, 
                FechaContratacion, Salario, EstadoLaboral, CargoID
            )
            OUTPUT INSERTED.EmpleadoID
            VALUES (
                'Admin', NULL, 'Sistema', NULL, 
                '000-000000-0000A', '1990-01-01', 'Masculino', 'Soltero', '00000000', 
                SYSDATETIME(), 0.00, 'Activo', ?
            )
        """, cargo_id)
        empleado_id = cursor.fetchone()[0]

        # Generar hash bcrypt (10 rondas)
        pwd_hash = hash_password(password)

        # Insertar Usuario
        cursor.execute("""
            INSERT INTO Usuarios (CorreoAcceso, PasswordHash, Estado, EmpleadoID, RolID)
            VALUES (?, ?, 1, ?, ?)
        """, email, pwd_hash, empleado_id, rol_id)

        conn.commit()
        print("[Éxito] Administrador creado exitosamente.")
    except Exception as exc:
        conn.rollback()
        print(f"[Error] Falló la creación. Haciendo rollback: {exc}")
    finally:
        try:
            next(conn_gen)
        except StopIteration:
            pass


if __name__ == "__main__":
    create_admin()
