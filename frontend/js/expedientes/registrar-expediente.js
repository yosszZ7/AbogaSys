/**
 * ==========================================================================
 * AbogaSys - Lógica para Registrar Expediente
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar permisos
    if (window.AbogaSysPermissions) {
        const hasAccess = await window.AbogaSysPermissions.init('EXPEDIENTES_VIEW');
        if (!hasAccess) return;
    } else {
        console.error('[AbogaSys] permissions.js no cargado.');
        return;
    }

    const form = document.getElementById('register-docket-form');
    const toast = document.getElementById('toast-feedback');
    const clientSelect = document.getElementById('client-select');
    const materiaSelect = document.getElementById('materia-select');
    const lawyerSelect = document.getElementById('lawyer-select');

    function showToast(message, isError = false) {
        if (!toast) return;
        toast.textContent = message;
        toast.style.backgroundColor = isError ? '#ef4444' : '#10b981';
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 4000);
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

    const requiredFields = [
        'docket-number', 'client-select', 'materia-select',
        'process-type', 'court-name', 'lawyer-select', 'docket-status', 'opening-date'
    ];

    requiredFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => clearFieldError(id, `${id}-error`));
            el.addEventListener('change', () => clearFieldError(id, `${id}-error`));
        }
    });

    // Cargar Catálogos
    async function loadCatalogos() {
        try {
            // Cargar Clientes
            const resClientes = await fetch('/api/clientes/lista', { credentials: 'include' });
            if (resClientes.status === 401) { window.location.href = '/index.html'; return; }
            if (resClientes.status === 403) { console.warn('Acceso denegado a clientes'); return; }
            if (resClientes.ok) {
                const clientes = await resClientes.json();
                clientSelect.innerHTML = '<option value="" disabled selected>Selecciona un cliente...</option>';
                clientes.forEach(c => {
                    const nombre = c.TipoCliente === 'N' ? `${c.PrimerNombre} ${c.PrimerApellido}` : c.RazonSocial;
                    const tipoStr = c.TipoCliente === 'N' ? 'Persona natural' : 'Persona jurídica';
                    clientSelect.innerHTML += `<option value="${c.ClienteID}">${nombre} (${tipoStr})</option>`;
                });
            }

            // Cargar Materias
            const resMaterias = await fetch('/api/materias', { credentials: 'include' });
            if (resMaterias.status === 401) { window.location.href = '/index.html'; return; }
            if (resMaterias.status === 403) { console.warn('Acceso denegado a materias'); return; }
            if (resMaterias.ok) {
                const materias = await resMaterias.json();
                materiaSelect.innerHTML = '<option value="" disabled selected>Selecciona materia...</option>';
                materias.forEach(m => {
                    materiaSelect.innerHTML += `<option value="${m.MateriaID}">${m.NombreMateria}</option>`;
                });
            }

            // Cargar Abogados
            const resAbogados = await fetch('/api/empleados/abogados', { credentials: 'include' });
            if (resAbogados.status === 401) { window.location.href = '/index.html'; return; }
            if (resAbogados.status === 403) { console.warn('Acceso denegado a abogados'); return; }
            if (resAbogados.ok) {
                const abogados = await resAbogados.json();
                lawyerSelect.innerHTML = '<option value="" disabled selected>Selecciona un abogado...</option>';
                abogados.forEach(a => {
                    lawyerSelect.innerHTML += `<option value="${a.EmpleadoID}">${a.PrimerNombre} ${a.PrimerApellido} (Abogado)</option>`;
                });
            }
        } catch (error) {
            console.error('Error al cargar catálogos:', error);
            showToast('Error de conexión al cargar catálogos.', true);
        }
    }

    loadCatalogos();

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            let isValid = true;
            const data = {
                numeroExpediente: document.getElementById('docket-number').value.trim(),
                clienteId: document.getElementById('client-select').value,
                materiaId: document.getElementById('materia-select').value,
                tipoProceso: document.getElementById('process-type').value.trim(),
                juzgadoTribunal: document.getElementById('court-name').value.trim(),
                abogadoResponsableId: document.getElementById('lawyer-select').value,
                estadoProcesal: document.getElementById('docket-status').value,
                contraparte: document.getElementById('opposing-party').value.trim(),
                abogadoContraparte: document.getElementById('opposing-lawyer').value.trim(),
                telefonoContraparte: document.getElementById('opposing-phone').value.trim(),
                fechaApertura: document.getElementById('opening-date').value,
                descripcionCaso: document.getElementById('case-description').value.trim(),
                observaciones: document.getElementById('docket-observations').value.trim()
            };

            if (!data.numeroExpediente) { setFieldError('docket-number', 'docket-number-error', 'Obligatorio'); isValid = false; }
            if (!data.clienteId) { setFieldError('client-select', 'client-select-error', 'Obligatorio'); isValid = false; }
            if (!data.materiaId) { setFieldError('materia-select', 'materia-select-error', 'Obligatorio'); isValid = false; }
            if (!data.tipoProceso) { setFieldError('process-type', 'process-type-error', 'Obligatorio'); isValid = false; }
            if (!data.juzgadoTribunal) { setFieldError('court-name', 'court-name-error', 'Obligatorio'); isValid = false; }
            if (!data.abogadoResponsableId) { setFieldError('lawyer-select', 'lawyer-select-error', 'Obligatorio'); isValid = false; }
            if (!data.estadoProcesal) { setFieldError('docket-status', 'docket-status-error', 'Obligatorio'); isValid = false; }
            if (!data.fechaApertura) { 
                const openingField = document.getElementById('opening-date');
                if (openingField) openingField.classList.add('has-error');
                isValid = false; 
            }

            if (isValid) {
                try {
                    const response = await fetch('/api/expedientes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                        credentials: 'include'
                    });

                    if (response.status === 401) { window.location.href = '/index.html'; return; }
                    if (response.status === 403) { showToast('Acceso denegado para registrar expediente.', true); return; }

                    const result = await response.json();

                    if (response.ok) {
                        showToast(`Expediente ${data.numeroExpediente} guardado con éxito. Redirigiendo...`);
                        setTimeout(() => {
                            window.location.href = 'expedientes.html';
                        }, 1200);
                    } else if (response.status === 409) {
                        setFieldError('docket-number', 'docket-number-error', result.message || 'Número de expediente duplicado');
                        showToast(result.message, true);
                    } else {
                        showToast(result.message || 'Error al guardar el expediente.', true);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showToast('Error de conexión con el servidor.', true);
                }
            }
        });
    }
});
