/**
 * ==========================================================================
 * AbogaSys - Lógica para Editar Usuario
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar permisos
    if (window.AbogaSysPermissions) {
        const hasAccess = await window.AbogaSysPermissions.init('USUARIOS_VIEW');
        if (!hasAccess) return;
    } else {
        console.error('[AbogaSys] permissions.js no cargado.');
        return;
    }
    const form = document.getElementById('edit-user-form');
    const toast = document.getElementById('toast-feedback');

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
        showToast('ID de usuario no proporcionado.');
        setTimeout(() => { window.location.href = 'usuarios.html'; }, 1500);
        return;
    }

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    function setFieldError(fieldId, errorId, message) {
        const field = document.getElementById(fieldId);
        const errorSpan = document.getElementById(errorId);
        if (field) field.classList.add('has-error');
        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.style.display = 'block';
        }
    }

    function clearFieldError(fieldId, errorId) {
        const field = document.getElementById(fieldId);
        const errorSpan = document.getElementById(errorId);
        if (field) field.classList.remove('has-error');
        if (errorSpan) {
            errorSpan.textContent = '';
            errorSpan.style.display = 'none';
        }
    }

    ['email', 'role'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => clearFieldError(id, `${id}-error`));
        }
    });

    // Cargar datos
    async function loadData() {
        try {
            // Roles
            const rolRes = await fetch('/api/roles', {
                credentials: 'include'
            });
            if (rolRes.status === 401) { window.location.href = '/index.html'; return; }
            if (rolRes.status === 403) { showToast('Acceso denegado a roles'); return; }
            
            const rolData = await rolRes.json();
            const rolSelect = document.getElementById('role');
            rolSelect.innerHTML = '<option value="" disabled>Selecciona un rol...</option>';
            rolData.forEach(r => {
                rolSelect.innerHTML += `<option value="${r.RolID}">${r.NombreRol}</option>`;
            });

            // Usuario actual
            const userRes = await fetch(`/api/usuarios/${userId}`, {
                credentials: 'include'
            });

            if (userRes.status === 401) { window.location.href = '/index.html'; return; }
            if (userRes.status === 403) { showToast('Acceso denegado a este usuario.'); return; }
            
            if (!userRes.ok) {
                showToast('Usuario no encontrado.');
                setTimeout(() => { window.location.href = 'usuarios.html'; }, 1500);
                return;
            }

            const userData = await userRes.json();
            
            const nombreCompleto = `${userData.PrimerNombre} ${userData.PrimerApellido}`;
            document.getElementById('display-name').textContent = nombreCompleto;
            document.getElementById('empleado-nombre').value = nombreCompleto;
            document.getElementById('email').value = userData.CorreoAcceso;
            document.getElementById('role').value = userData.RolID;

            const isActivo = userData.Estado === true || userData.Estado === 1;
            document.querySelector(`input[name="status"][value="${isActivo ? 'active' : 'inactive'}"]`).checked = true;

        } catch (error) {
            console.error('Error cargando datos:', error);
            showToast('Error al conectar con el servidor.');
        }
    }

    loadData();

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            let isValid = true;
            const email = document.getElementById('email').value.trim();
            const role = document.getElementById('role').value;
            const status = document.querySelector('input[name="status"]:checked').value;

            if (!email) {
                setFieldError('email', 'email-error', 'Por favor, ingresa el correo electrónico.');
                isValid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setFieldError('email', 'email-error', 'Ingresa un formato de correo válido.');
                isValid = false;
            }

            if (!role) {
                setFieldError('role', 'role-error', 'Por favor, selecciona un rol.');
                isValid = false;
            }

            if (isValid) {
                try {
                    const res = await fetch(`/api/usuarios/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            correoAcceso: email,
                            rolId: parseInt(role),
                            estado: status === 'active'
                        })
                    });
                    
                    if (res.status === 401) { window.location.href = '/index.html'; return; }
                    if (res.status === 403) { showToast('Acceso denegado para editar usuario.'); return; }
                    
                    const data = await res.json();

                    if (res.ok) {
                        showToast('Cambios guardados con éxito. Redirigiendo...');
                        setTimeout(() => {
                            window.location.href = 'usuarios.html';
                        }, 1200);
                    } else {
                        showToast(data.message || 'Error al guardar los cambios.');
                        if (res.status === 409 && data.message.includes('correo')) {
                            setFieldError('email', 'email-error', 'El correo de acceso ya está en uso.');
                        }
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showToast('Error de conexión con el servidor.');
                }
            }
        });
    }
});
