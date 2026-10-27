/**
 * ==========================================================================
 * AbogaSys - Lógica para Registrar Usuario
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
    const form = document.getElementById('register-user-form');
    const toast = document.getElementById('toast-feedback');

    // Configuración para alternar visibilidad de contraseñas
    setupPasswordToggle('toggle-password', 'password');
    setupPasswordToggle('toggle-confirm-password', 'confirm-password');

    function setupPasswordToggle(buttonId, inputId) {
        const btn = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (!btn || !input) return;

        btn.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');

            const eyeIcon = btn.querySelector('.icon-eye');
            const eyeOffIcon = btn.querySelector('.icon-eye-off');
            if (eyeIcon && eyeOffIcon) {
                eyeIcon.style.display = isPassword ? 'none' : 'block';
                eyeOffIcon.style.display = isPassword ? 'block' : 'none';
            }
        });
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

    // Limpiar errores en tiempo real
    ['empleado-id', 'email', 'password', 'confirm-password', 'role'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => clearFieldError(id, `${id}-error`));
        }
    });

    // Cargar empleados y roles
    async function loadFormData() {
        try {
            const empRes = await fetch('/api/empleados/sin-usuario', {
                credentials: 'include'
            });
            if (empRes.status === 401) { window.location.href = '/index.html'; return; }
            if (empRes.status === 403) { showToast('Acceso denegado a empleados'); return; }
            
            const empData = await empRes.json();
            const empSelect = document.getElementById('empleado-id');
            empSelect.innerHTML = '<option value="" disabled selected>Selecciona un empleado...</option>';
            empData.forEach(e => {
                empSelect.innerHTML += `<option value="${e.EmpleadoID}">${e.PrimerNombre} ${e.PrimerApellido} - ${e.NombreCargo}</option>`;
            });

            // Obtener roles
            const rolesRes = await fetch('/api/roles', {
                credentials: 'include'
            });
            if (rolesRes.status === 401) { window.location.href = '/index.html'; return; }
            if (rolesRes.status === 403) { showToast('Acceso denegado a roles'); return; }
            
            const rolData = await rolesRes.json();
            const rolSelect = document.getElementById('role');
            rolSelect.innerHTML = '<option value="" disabled selected>Selecciona un rol...</option>';
            rolData.forEach(r => {
                rolSelect.innerHTML += `<option value="${r.RolID}">${r.NombreRol}</option>`;
            });
        } catch (error) {
            console.error('Error cargando datos:', error);
            showToast('Error de conexión con el servidor.');
        }
    }
    loadFormData();

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            let isValid = true;
            const empleadoId = document.getElementById('empleado-id').value;
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const role = document.getElementById('role').value;

            if (!empleadoId) {
                setFieldError('empleado-id', 'empleado-id-error', 'Por favor, selecciona un empleado.');
                isValid = false;
            }

            if (!email) {
                setFieldError('email', 'email-error', 'Por favor, ingresa el correo electrónico.');
                isValid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setFieldError('email', 'email-error', 'Ingresa un formato de correo válido.');
                isValid = false;
            }

            if (!password) {
                setFieldError('password', 'password-error', 'Por favor, ingresa una contraseña.');
                isValid = false;
            } else if (password.length < 6) {
                setFieldError('password', 'password-error', 'La contraseña debe tener al menos 6 caracteres.');
                isValid = false;
            }

            if (!confirmPassword) {
                setFieldError('confirm-password', 'confirm-password-error', 'Por favor, confirma la contraseña.');
                isValid = false;
            } else if (password !== confirmPassword) {
                setFieldError('confirm-password', 'confirm-password-error', 'Las contraseñas no coinciden.');
                isValid = false;
            }

            if (!role) {
                setFieldError('role', 'role-error', 'Por favor, selecciona un rol.');
                isValid = false;
            }

            if (isValid) {
                try {
                    const res = await fetch('/api/usuarios', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            empleadoId: parseInt(empleadoId),
                            correoAcceso: email,
                            password: password,
                            rolId: parseInt(role)
                        })
                    });
                    
                    if (res.status === 401) {
                        window.location.href = '/index.html';
                        return;
                    }
                    if (res.status === 403) {
                        showToast('Acceso denegado para registrar usuarios.');
                        return;
                    }
                    
                    const data = await res.json();
                    
                    if (res.ok) {
                        showToast('Usuario guardado con éxito. Redirigiendo...');
                        setTimeout(() => {
                            window.location.href = 'usuarios.html';
                        }, 1200);
                    } else {
                        showToast(data.message || 'Ocurrió un error al guardar el usuario.');
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
