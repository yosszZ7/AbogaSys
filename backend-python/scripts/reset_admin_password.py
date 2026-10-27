import os
import sys
import getpass

# Permitir importar desde la raíz de backend-python
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config.database import get_connection
from app.core.security import hash_password


def reset_admin_password():
    conn_gen = get_connection()
    conn = next(conn_gen)
    try:
        cursor = conn.cursor()

        # 1. Verificar si existe administrador
        cursor.execute("""
            SELECT TOP 1 u.UsuarioID, u.CorreoAcceso 
            FROM Usuarios u
            INNER JOIN Roles r ON u.RolID = r.RolID
            WHERE r.NombreRol = 'Administrador'
        """)
        admin_user = cursor.fetchone()
        if not admin_user:
            print("[Error] No existe ningún usuario Administrador en el sistema.")
            sys.exit(1)

        usuario_id, correo_acceso = admin_user[0], admin_user[1]
        print(f"[Info] Administrador encontrado: {correo_acceso}")

        # 2. Solicitar nueva contraseña interactivamente
        pass1 = getpass.getpass("Introduce la nueva contraseña: ")
        pass2 = getpass.getpass("Confirma la nueva contraseña: ")

        if pass1 != pass2:
            print("[Error] Las contraseñas no coinciden.")
            sys.exit(1)

        if len(pass1) < 8:
            print("[Error] La contraseña debe tener al menos 8 caracteres por seguridad.")
            sys.exit(1)

        print("\n[Procesando...] Encriptando y actualizando contraseña...")

        # 3. Generar hash y actualizar
        pwd_hash = hash_password(pass1)
        cursor.execute("""
            UPDATE Usuarios 
            SET PasswordHash = ?, FechaModificacion = SYSDATETIME()
            WHERE UsuarioID = ?
        """, pwd_hash, usuario_id)

        conn.commit()
        print("[Éxito] La contraseña del administrador fue restablecida correctamente.")
    except Exception as exc:
        conn.rollback()
        print(f"[Error fatal]: {exc}")
        sys.exit(1)
    finally:
        try:
            next(conn_gen)
        except StopIteration:
            pass


if __name__ == "__main__":
    reset_admin_password()
