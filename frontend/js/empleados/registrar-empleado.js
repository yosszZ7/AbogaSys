/**
 * ==========================================================================
 * AbogaSys - Lógica para Registrar Empleado
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar permisos
    if (window.AbogaSysPermissions) {
        const hasAccess = await window.AbogaSysPermissions.init('EMPLEADOS_VIEW');
        if (!hasAccess) return;
    } else {
        console.error('[AbogaSys] permissions.js no cargado.');
        return;
    }

    const form = document.getElementById('register-employee-form');
    const toast = document.getElementById('toast-feedback');
    const selectCargo = document.getElementById('emp-cargo');

    // --------------------------------------------------------------------------
    // Cargar Cargos desde el Backend
    // --------------------------------------------------------------------------
    async function loadCargos() {
        try {
            const res = await fetch('/api/cargos', { credentials: 'include' });
            if (res.status === 401) { window.location.href = '/index.html'; return; }
            if (res.status === 403) { showToast('Acceso denegado a cargos'); return; }
            
            if (res.ok) {
                const cargos = await res.json();
                if (selectCargo) {
                    selectCargo.innerHTML = '<option value="" disabled selected>Seleccione cargo...</option>';
                    cargos.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.CargoID;
                        opt.textContent = c.NombreCargo;
                        selectCargo.appendChild(opt);
                    });
                }
            }
        } catch (error) {
            console.error('[Error LoadCargos]:', error);
        }
    }
    await loadCargos();

    // --------------------------------------------------------------------------
    // Panel de Usuario (Visualmente mantenido, pero no se procesa)
    // --------------------------------------------------------------------------
    const accessRadios = document.querySelectorAll('input[name="hasSystemAccess"]');
    const userConfigPanel = document.getElementById('user-config-panel');
    const cardAccessNo = document.getElementById('card-access-no');
    const cardAccessYes = document.getElementById('card-access-yes');
    
    accessRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const hasAccess = e.target.value === 'yes';
            if (hasAccess) {
                if (userConfigPanel) userConfigPanel.style.display = 'flex';
                if (cardAccessYes) cardAccessYes.classList.add('selected');
                if (cardAccessNo) cardAccessNo.classList.remove('selected');
            } else {
                if (userConfigPanel) userConfigPanel.style.display = 'none';
                if (cardAccessNo) cardAccessNo.classList.add('selected');
                if (cardAccessYes) cardAccessYes.classList.remove('selected');
            }
        });
    });

    // --------------------------------------------------------------------------
    // Validación Visual Simple
    // --------------------------------------------------------------------------
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

    const inputFieldsToWatch = [
        'emp-first-name', 'emp-first-lastname', 'emp-dni',
        'emp-birthdate', 'emp-gender', 'emp-civil-status',
        'emp-phone', 'emp-cargo', 'emp-hiredate'
    ];

    inputFieldsToWatch.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => clearFieldError(id, `${id}-error`));
            el.addEventListener('change', () => clearFieldError(id, `${id}-error`));
        }
    });

    function showToast(message, type = 'info') {
        const toastMessage = document.getElementById('toast-message') || document.createElement('span');
        if (!document.getElementById('toast-message')) {
            toastMessage.id = 'toast-message';
            toast.appendChild(toastMessage);
        }
        toastMessage.textContent = message;
        toast.className = `toast-feedback ${type}`;
        toast.style.display = 'flex';
        setTimeout(() => toast.style.display = 'none', 3500);
    }

    // --------------------------------------------------------------------------
    // Envío del Formulario
    // --------------------------------------------------------------------------
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            let isValid = true;

            const primerNombre = document.getElementById('emp-first-name')?.value.trim();
            const segundoNombre = document.getElementById('emp-second-name')?.value.trim();
            const primerApellido = document.getElementById('emp-first-lastname')?.value.trim();
            const segundoApellido = document.getElementById('emp-second-lastname')?.value.trim();
            const cedula = document.getElementById('emp-dni')?.value.trim();
            const fechaNacimiento = document.getElementById('emp-birthdate')?.value;
            const sexo = document.getElementById('emp-gender')?.value;
            const estadoCivil = document.getElementById('emp-civil-status')?.value;
            const tipoSangre = document.getElementById('emp-blood-type')?.value;
            const telefono = document.getElementById('emp-phone')?.value.trim();
            const correoPersonal = document.getElementById('emp-email')?.value.trim();
            const direccion = document.getElementById('emp-address')?.value.trim();
            
            const cargoId = document.getElementById('emp-cargo')?.value;
            const area = document.getElementById('emp-area')?.value.trim();
            const fechaContratacion = document.getElementById('emp-hiredate')?.value;
            const numeroINSS = document.getElementById('emp-inss')?.value.trim();
            const salarioStr = document.getElementById('emp-salary')?.value.trim().replace(/,/g, '');
            const estadoLaboral = document.getElementById('emp-status')?.value;

            // Validar requeridos
            if (!primerNombre) { setFieldError('emp-first-name', 'emp-first-name-error', 'Obligatorio.'); isValid = false; }
            if (!primerApellido) { setFieldError('emp-first-lastname', 'emp-first-lastname-error', 'Obligatorio.'); isValid = false; }
            if (!cedula) { setFieldError('emp-dni', 'emp-dni-error', 'Obligatorio.'); isValid = false; }
            if (!fechaNacimiento) { setFieldError('emp-birthdate', 'emp-birthdate-error', 'Obligatorio.'); isValid = false; }
            if (!sexo) { setFieldError('emp-gender', 'emp-gender-error', 'Obligatorio.'); isValid = false; }
            if (!estadoCivil) { setFieldError('emp-civil-status', 'emp-civil-status-error', 'Obligatorio.'); isValid = false; }
            if (!telefono) { setFieldError('emp-phone', 'emp-phone-error', 'Obligatorio.'); isValid = false; }
            if (!cargoId) { setFieldError('emp-cargo', 'emp-cargo-error', 'Obligatorio.'); isValid = false; }
            if (!fechaContratacion) { setFieldError('emp-hiredate', 'emp-hiredate-error', 'Obligatorio.'); isValid = false; }

            const salario = parseFloat(salarioStr) || 0;

            if (!isValid) {
                const firstError = document.querySelector('.has-error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
                return;
            }

            const payload = {
                primerNombre, segundoNombre, primerApellido, segundoApellido,
                cedula, fechaNacimiento, sexo, estadoCivil, tipoSangre,
                telefono, correoPersonal, direccion, area, fechaContratacion,
                numeroINSS, salario, estadoLaboral, cargoId
            };

            try {
                const res = await fetch('/api/empleados', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                
                if (res.status === 401) { window.location.href = '/index.html'; return; }
                if (res.status === 403) { showToast('Acceso denegado para registrar empleado.', 'error'); return; }

                const data = await res.json();

                if (res.ok) {
                    window.location.href = 'empleados.html?registered=true';
                } else {
                    showToast(data.message || 'Error al registrar', 'error');
                }
            } catch (error) {
                console.error('[Error PostEmpleado]:', error);
                showToast('Error de conexión al guardar.', 'error');
            }
        });
    }
});
