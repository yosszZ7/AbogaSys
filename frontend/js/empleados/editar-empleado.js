/**
 * ==========================================================================
 * AbogaSys - Lógica para Editar Empleado
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

    const form = document.getElementById('edit-employee-form');
    const headerTitle = document.getElementById('edit-employee-header-title');
    const toast = document.getElementById('toast-feedback');
    const selectCargo = document.getElementById('edit-emp-cargo');
    const inputId = document.getElementById('edit-emp-id');

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
    // Precarga de Datos del Empleado
    // --------------------------------------------------------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('id');

    if (!empId) {
        window.location.href = 'empleados.html';
        return;
    }

    async function loadEmpleado() {
        try {
            const res = await fetch(`/api/empleados/${empId}`, { credentials: 'include' });
            if (res.status === 401) { window.location.href = '/index.html'; return; }
            if (res.status === 403) { showToast('Acceso denegado para editar este empleado.', 'error'); return; }

            if (!res.ok) {
                throw new Error('Empleado no encontrado');
            }
            const emp = await res.json();

            if (headerTitle) {
                headerTitle.textContent = `Modificar: ${emp.PrimerNombre} ${emp.PrimerApellido}`;
            }

            if (inputId) inputId.value = emp.EmpleadoID;
            document.getElementById('edit-emp-first-name').value = emp.PrimerNombre || '';
            document.getElementById('edit-emp-second-name').value = emp.SegundoNombre || '';
            document.getElementById('edit-emp-first-lastname').value = emp.PrimerApellido || '';
            document.getElementById('edit-emp-second-lastname').value = emp.SegundoApellido || '';
            document.getElementById('edit-emp-dni').value = emp.Cedula || '';
            document.getElementById('edit-emp-birthdate').value = emp.FechaNacimiento ? emp.FechaNacimiento.substring(0, 10) : '';
            document.getElementById('edit-emp-gender').value = emp.Sexo || '';
            document.getElementById('edit-emp-civil-status').value = emp.EstadoCivil || '';
            document.getElementById('edit-emp-blood-type').value = emp.TipoSangre || '';
            document.getElementById('edit-emp-phone').value = emp.Telefono || '';
            document.getElementById('edit-emp-email').value = emp.CorreoPersonal || '';
            document.getElementById('edit-emp-address').value = emp.Direccion || '';

            if (selectCargo) selectCargo.value = emp.CargoID;
            document.getElementById('edit-emp-area').value = emp.Area || '';
            document.getElementById('edit-emp-hiredate').value = emp.FechaContratacion ? emp.FechaContratacion.substring(0, 10) : '';
            document.getElementById('edit-emp-inss').value = emp.NumeroINSS || '';
            document.getElementById('edit-emp-salary').value = emp.Salario || '';
            document.getElementById('edit-emp-status').value = emp.EstadoLaboral || '';
            
        } catch (error) {
            console.error('[Error LoadEmpleado]:', error);
            showToast('Error al cargar datos del empleado.', 'error');
        }
    }
    await loadEmpleado();

    // --------------------------------------------------------------------------
    // Panel de Usuario (Visualmente mantenido, pero no se procesa)
    // --------------------------------------------------------------------------
    const accessRadios = document.querySelectorAll('input[name="editHasSystemAccess"]');
    const userConfigPanel = document.getElementById('edit-user-config-panel');
    const cardAccessNo = document.getElementById('edit-card-access-no');
    const cardAccessYes = document.getElementById('edit-card-access-yes');
    
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
    // Errores de Validación
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

    const editFieldsToWatch = [
        'edit-emp-first-name', 'edit-emp-first-lastname', 'edit-emp-dni',
        'edit-emp-phone', 'edit-emp-cargo', 'edit-emp-hiredate'
    ];

    editFieldsToWatch.forEach(id => {
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

            const primerNombre = document.getElementById('edit-emp-first-name')?.value.trim();
            const segundoNombre = document.getElementById('edit-emp-second-name')?.value.trim();
            const primerApellido = document.getElementById('edit-emp-first-lastname')?.value.trim();
            const segundoApellido = document.getElementById('edit-emp-second-lastname')?.value.trim();
            const cedula = document.getElementById('edit-emp-dni')?.value.trim();
            const fechaNacimiento = document.getElementById('edit-emp-birthdate')?.value;
            const sexo = document.getElementById('edit-emp-gender')?.value;
            const estadoCivil = document.getElementById('edit-emp-civil-status')?.value;
            const tipoSangre = document.getElementById('edit-emp-blood-type')?.value;
            const telefono = document.getElementById('edit-emp-phone')?.value.trim();
            const correoPersonal = document.getElementById('edit-emp-email')?.value.trim();
            const direccion = document.getElementById('edit-emp-address')?.value.trim();
            
            const cargoId = selectCargo?.value;
            const area = document.getElementById('edit-emp-area')?.value.trim();
            const fechaContratacion = document.getElementById('edit-emp-hiredate')?.value;
            const numeroINSS = document.getElementById('edit-emp-inss')?.value.trim();
            const salarioStr = document.getElementById('edit-emp-salary')?.value.trim().replace(/,/g, '');
            const estadoLaboral = document.getElementById('edit-emp-status')?.value;

            if (!primerNombre) { setFieldError('edit-emp-first-name', 'edit-emp-first-name-error', 'Obligatorio.'); isValid = false; }
            if (!primerApellido) { setFieldError('edit-emp-first-lastname', 'edit-emp-first-lastname-error', 'Obligatorio.'); isValid = false; }
            if (!cedula) { setFieldError('edit-emp-dni', 'edit-emp-dni-error', 'Obligatorio.'); isValid = false; }
            if (!telefono) { setFieldError('edit-emp-phone', 'edit-emp-phone-error', 'Obligatorio.'); isValid = false; }
            if (!cargoId) { setFieldError('edit-emp-cargo', 'edit-emp-cargo-error', 'Obligatorio.'); isValid = false; }
            if (!fechaContratacion) { setFieldError('edit-emp-hiredate', 'edit-emp-hiredate-error', 'Obligatorio.'); isValid = false; }

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
                const res = await fetch(`/api/empleados/${empId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                
                if (res.status === 401) { window.location.href = '/index.html'; return; }
                if (res.status === 403) { showToast('Acceso denegado para actualizar empleado.', 'error'); return; }

                const data = await res.json();

                if (res.ok) {
                    window.location.href = 'empleados.html?updated=true';
                } else {
                    showToast(data.message || 'Error al actualizar', 'error');
                }
            } catch (error) {
                console.error('[Error PutEmpleado]:', error);
                showToast('Error de conexión al guardar.', 'error');
            }
        });
    }
});
