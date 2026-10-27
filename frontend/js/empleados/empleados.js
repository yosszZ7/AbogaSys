/**
 * ==========================================================================
 * AbogaSys - Lógica del Módulo Empleados / Personal
 * Gestión de directorio laboral, consulta de fichas y cuentas de usuario
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

    let employees = []; // Se cargará dinámicamente desde el backend

    // --------------------------------------------------------------------------
    // Descripciones Informativas de Roles y Permisos (Informativo)
    // --------------------------------------------------------------------------
    const rolePermissionsInfo = {
        'Administrador': {
            resumen: 'Acceso administrativo integral y configuración global.',
            modulos: ['Gestión total de Usuarios', 'Gestión de Empleados', 'Control de Clientes', 'Expedientes Judiciales', 'Agenda', 'Repositorio Documental', 'Auditoría y Configuración']
        },
        'Abogado': {
            resumen: 'Atención jurídica a clientes y tramitación de causas asignadas.',
            modulos: ['Clientes del Despacho', 'Expedientes asignados', 'Agenda procesal y audiencias', 'Repositorio documental', 'Futuro Asistente IA']
        },
        'Asistente legal': {
            resumen: 'Apoyo operativo y seguimiento de causas según directrices.',
            modulos: ['Consulta de Clientes', 'Tramitación de Expedientes', 'Agenda procesal', 'Carga de Documentos']
        },
        'Recepcionista': {
            resumen: 'Atención presencial, recepción y calendarización de citas.',
            modulos: ['Registro de Clientes', 'Agenda de citas y reuniones', 'Directorio del despacho']
        },
        'Contador': {
            resumen: 'Gestión administrativa/financiera sin acceso a causas judiciales confidenciales.',
            modulos: ['Módulos contables y administrativos futuros', 'Control de honorarios y facturación', 'Sin acceso a expedientes jurídicos']
        }
    };

    // --------------------------------------------------------------------------
    // Referencias del DOM
    // --------------------------------------------------------------------------
    const searchInput = document.getElementById('search-empleado');
    const filterCargo = document.getElementById('filter-cargo');
    const filterEstado = document.getElementById('filter-estado');
    const tableBody = document.getElementById('empleados-table-body');

    // Modal de Consulta
    const modalView = document.getElementById('modal-view-employee');
    const btnCloseView = document.getElementById('btn-close-view-modal');
    const btnCloseViewFooter = document.getElementById('btn-close-view-modal-footer');

    // Campos de la Ficha
    const viewName = document.getElementById('view-emp-name');
    const viewDni = document.getElementById('view-emp-dni');
    const viewBirthdate = document.getElementById('view-emp-birthdate');
    const viewGender = document.getElementById('view-emp-gender');
    const viewCivil = document.getElementById('view-emp-civil');
    const viewBlood = document.getElementById('view-emp-blood');
    const viewPhone = document.getElementById('view-emp-phone');
    const viewEmail = document.getElementById('view-emp-email');
    const viewAddress = document.getElementById('view-emp-address');
    const viewCargo = document.getElementById('view-emp-cargo');
    const viewArea = document.getElementById('view-emp-area');
    const viewHiredate = document.getElementById('view-emp-hiredate');
    const viewInss = document.getElementById('view-emp-inss');
    const viewSalary = document.getElementById('view-emp-salary');
    const viewStatus = document.getElementById('view-emp-status');
    const viewDocsContainer = document.getElementById('view-emp-docs-container');
    const viewAccessContainer = document.getElementById('view-emp-access-container');

    // Toast
    const toast = document.getElementById('toast-feedback');
    const toastMessage = document.getElementById('toast-message');
    let toastTimeout = null;

    // --------------------------------------------------------------------------
    // Utilidades
    // --------------------------------------------------------------------------
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function getInitials(nombre, apellido) {
        const n = (nombre || '').trim().charAt(0).toUpperCase();
        const a = (apellido || '').trim().charAt(0).toUpperCase();
        return `${n}${a}` || 'EM';
    }

    function getLaborPillClass(estado) {
        switch ((estado || '').toLowerCase()) {
            case 'activo': return 'activo';
            case 'inactivo': return 'inactivo';
            case 'vacaciones': return 'vacaciones';
            case 'suspendido': return 'suspendido';
            default: return 'inactivo';
        }
    }

    function showToast(message, type = 'info') {
        if (!toast || !toastMessage) return;
        if (toastTimeout) clearTimeout(toastTimeout);

        toastMessage.textContent = message;
        toast.className = `toast-feedback ${type}`;
        toast.style.display = 'flex';

        toastTimeout = setTimeout(() => {
            toast.style.display = 'none';
        }, 3500);
    }

    // --------------------------------------------------------------------------
    // Carga de Datos desde el Backend
    // --------------------------------------------------------------------------
    async function loadEmpleados() {
        try {
            const response = await fetch('/api/empleados', {
                credentials: 'include'
            });
            if (response.status === 401) { window.location.href = '/index.html'; return; }
            if (response.status === 403) { showToast('Acceso denegado a empleados.', 'error'); return; }
            if (!response.ok) {
                throw new Error('No se pudo cargar la lista de empleados.');
            }
            const data = await response.json();
            
            // Llenar el filtro de cargos dinámicamente basado en los empleados
            populateCargosFilter(data);

            // Mapear los datos de SQL a la estructura que espera la interfaz
            employees = data.map(e => ({
                id: e.EmpleadoID,
                primerNombre: e.PrimerNombre,
                segundoNombre: e.SegundoNombre,
                primerApellido: e.PrimerApellido,
                segundoApellido: e.SegundoApellido,
                nombreCompleto: `${e.PrimerNombre} ${e.PrimerApellido}`,
                cedula: e.Cedula,
                fechaNacimiento: e.FechaNacimiento ? e.FechaNacimiento.substring(0, 10) : '',
                sexo: e.Sexo,
                estadoCivil: e.EstadoCivil,
                tipoSangre: e.TipoSangre,
                telefono: e.Telefono,
                correo: e.CorreoPersonal,
                direccion: e.Direccion,
                cargo: e.NombreCargo,
                cargoId: e.CargoID,
                area: e.Area,
                fechaContratacion: e.FechaContratacion ? e.FechaContratacion.substring(0, 10) : '',
                inss: e.NumeroINSS,
                salario: e.Salario !== null ? `C$ ${parseFloat(e.Salario).toLocaleString('es-NI', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '',
                estadoLaboral: e.EstadoLaboral,
                tieneUsuario: e.TieneUsuario,
                estadoUsuario: e.EstadoUsuario,
                rol: e.NombreRol,
                documentos: [] // Omitido por ahora
            }));

            renderTable();
        } catch (error) {
            console.error('[Error]:', error);
            showToast('Error al cargar la lista de empleados desde el servidor.', 'error');
        }
    }

    function populateCargosFilter(data) {
        if (!filterCargo) return;
        // Obtener cargos únicos
        const cargos = new Set(data.map(e => e.NombreCargo));
        filterCargo.innerHTML = '<option value="todos" selected>Todos los cargos</option>';
        cargos.forEach(cargo => {
            const option = document.createElement('option');
            option.value = cargo;
            option.textContent = cargo;
            filterCargo.appendChild(option);
        });
    }

    // --------------------------------------------------------------------------
    // Renderizado de la Tabla de Empleados
    // --------------------------------------------------------------------------
    function renderTable() {
        if (!tableBody) return;

        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedCargo = filterCargo ? filterCargo.value : 'todos';
        const selectedEstado = filterEstado ? filterEstado.value : 'todos';

        const filtered = employees.filter(emp => {
            const matchesCargo = selectedCargo === 'todos' || emp.cargo === selectedCargo;
            const matchesEstado = selectedEstado === 'todos' || emp.estadoLaboral === selectedEstado;

            const textPool = `
                ${emp.nombreCompleto}
                ${emp.cedula}
                ${emp.cargo}
                ${emp.area}
                ${emp.telefono}
                ${emp.correo}
                ${emp.rol || ''}
            `.toLowerCase();

            const matchesQuery = !query || textPool.includes(query);

            return matchesCargo && matchesEstado && matchesQuery;
        });

        tableBody.innerHTML = '';

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-table-state">
                            <div class="empty-table-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <div class="empty-table-title">No se encontraron empleados</div>
                            <div class="empty-table-desc">Intenta ajustar los filtros de cargo, estado o la búsqueda.</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(emp => {
            const tr = document.createElement('tr');
            const initials = getInitials(emp.primerNombre, emp.primerApellido);
            const statusClass = getLaborPillClass(emp.estadoLaboral);

            // Badge de Cuenta de Usuario AbogaSys
            let userBadgeHtml = '';
            if (emp.tieneUsuario) {
                userBadgeHtml = `
                    <span class="user-account-badge has-account" title="Cuenta activa con rol ${escapeHtml(emp.rol)}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Sí &bull; ${escapeHtml(emp.rol)}
                    </span>
                `;
            } else {
                userBadgeHtml = `
                    <span class="user-account-badge no-account" title="No cuenta con usuario de acceso en AbogaSys">
                        Sin cuenta
                    </span>
                `;
            }

            tr.innerHTML = `
                <td>
                    <div class="employee-cell">
                        <div class="employee-avatar" aria-hidden="true">${initials}</div>
                        <div class="employee-info-col">
                            <strong class="employee-name">${escapeHtml(emp.nombreCompleto)}</strong>
                            <span class="employee-area-sub">${escapeHtml(emp.area || '')}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="id-badge">${escapeHtml(emp.cedula)}</span>
                </td>
                <td>
                    <span class="cargo-badge">${escapeHtml(emp.cargo)}</span>
                </td>
                <td>
                    <span style="font-size: 0.85rem; color: #475569;">${escapeHtml(emp.telefono)}</span>
                </td>
                <td>
                    <span style="font-size: 0.825rem; color: var(--text-muted, #64748b);">${escapeHtml(emp.correo || '-')}</span>
                </td>
                <td>
                    <span class="labor-pill ${statusClass}">${escapeHtml(emp.estadoLaboral)}</span>
                </td>
                <td>
                    ${userBadgeHtml}
                </td>
                <td style="text-align: right;">
                    <div class="action-buttons" style="justify-content: flex-end;">
                        <!-- Consultar -->
                        <button type="button" class="btn-action view btn-view-employee" data-id="${emp.id}" title="Consultar ficha de ${escapeHtml(emp.nombreCompleto)}" aria-label="Consultar ${escapeHtml(emp.nombreCompleto)}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>

                        <!-- Editar -->
                        <a href="editar-empleado.html?id=${emp.id}" class="btn-action edit" title="Editar información de ${escapeHtml(emp.nombreCompleto)}" aria-label="Editar ${escapeHtml(emp.nombreCompleto)}" data-permission="EMPLEADOS_EDIT">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </a>
                    </div>
                </td>
            `;

            tableBody.appendChild(tr);
        });

        // Eventos para botones de consulta
        tableBody.querySelectorAll('.btn-view-employee').forEach(btn => {
            btn.addEventListener('click', () => openViewModal(parseInt(btn.dataset.id)));
        });

        if (window.AbogaSysPermissions) {
            window.AbogaSysPermissions.applyPermissions();
        }
    }

    // --------------------------------------------------------------------------
    // Modal de Consulta Detallada
    // --------------------------------------------------------------------------
    function openViewModal(empId) {
        const emp = employees.find(e => e.id === empId);
        if (!emp || !modalView) return;

        // Datos Personales
        if (viewName) viewName.textContent = emp.nombreCompleto;
        if (viewDni) viewDni.textContent = emp.cedula;
        if (viewBirthdate) viewBirthdate.textContent = emp.fechaNacimiento || 'No registrada';
        if (viewGender) viewGender.textContent = emp.sexo || 'No especificado';
        if (viewCivil) viewCivil.textContent = emp.estadoCivil || 'No especificado';
        if (viewBlood) viewBlood.textContent = emp.tipoSangre || 'No registrado';
        if (viewPhone) viewPhone.textContent = emp.telefono;
        if (viewEmail) viewEmail.textContent = emp.correo || 'Sin correo personal';
        if (viewAddress) viewAddress.textContent = emp.direccion || 'Sin dirección registrada';

        // Información Laboral
        if (viewCargo) viewCargo.textContent = emp.cargo;
        if (viewArea) viewArea.textContent = emp.area || 'Sin área asignada';
        if (viewHiredate) viewHiredate.textContent = emp.fechaContratacion;
        if (viewInss) viewInss.textContent = emp.inss || 'No afiliado';
        if (viewSalary) viewSalary.textContent = emp.salario || 'No especificado';

        if (viewStatus) {
            viewStatus.textContent = emp.estadoLaboral;
            viewStatus.className = `labor-pill ${getLaborPillClass(emp.estadoLaboral)}`;
        }

        // Documentación Laboral
        if (viewDocsContainer) {
            viewDocsContainer.innerHTML = '';
            if (emp.documentos && emp.documentos.length > 0) {
                emp.documentos.forEach(doc => {
                    const chip = document.createElement('div');
                    chip.className = 'emp-view-doc-chip';
                    chip.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <strong>${escapeHtml(doc.nombre)}:</strong> ${escapeHtml(doc.archivo)}
                    `;
                    viewDocsContainer.appendChild(chip);
                });
            } else {
                viewDocsContainer.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">Sin documentación adjunta registrada.</span>';
            }
        }

        // Acceso a AbogaSys y Rol
        if (viewAccessContainer) {
            if (emp.tieneUsuario) {
                const roleInfo = rolePermissionsInfo[emp.rol] || {
                    resumen: 'Permisos estándar del rol asignado.',
                    modulos: ['Acceso a funciones autorizadas por el despacho']
                };

                const modulesTagsHtml = roleInfo.modulos.map(m => `
                    <span class="role-module-tag">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        ${escapeHtml(m)}
                    </span>
                `).join('');

                viewAccessContainer.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                        <div class="emp-view-grid-2">
                            <div class="emp-view-item">
                                <span class="emp-view-label">Estado de la cuenta</span>
                                <div><span class="user-account-badge has-account">${emp.estadoUsuario ? 'Cuenta habilitada' : 'Cuenta inactiva'}</span></div>
                            </div>
                            <div class="emp-view-item">
                                <span class="emp-view-label">Rol del sistema</span>
                                <div><span class="cargo-badge" style="background-color: #eff6ff; color: #1d4ed8; border-color: #bfdbfe;">${escapeHtml(emp.rol)}</span></div>
                            </div>
                        </div>

                        <!-- Tarjeta informativa de permisos (Informativa) -->
                        <div class="role-info-card">
                            <div class="role-info-header">
                                <div class="role-info-title-group">
                                    <span class="role-info-title">Alcance del Rol: ${escapeHtml(emp.rol)}</span>
                                </div>
                                <span class="badge-informative">Informativo</span>
                            </div>
                            <p class="role-info-desc">${escapeHtml(roleInfo.resumen)}</p>
                            <div class="role-modules-list">
                                ${modulesTagsHtml}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                viewAccessContainer.innerHTML = `
                    <div style="background-color: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 8px; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.75rem;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                        </svg>
                        <div style="display: flex; flex-direction: column;">
                            <strong style="color: var(--primary, #0f172a); font-size: 0.885rem;">Este empleado no posee cuenta de usuario en AbogaSys</strong>
                            <span style="font-size: 0.775rem; color: var(--text-muted, #64748b);">Realiza labores en el despacho sin requerir acceso informático directo al sistema.</span>
                        </div>
                    </div>
                `;
            }
        }

        modalView.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeViewModal() {
        if (!modalView) return;
        modalView.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (btnCloseView) btnCloseView.addEventListener('click', closeViewModal);
    if (btnCloseViewFooter) btnCloseViewFooter.addEventListener('click', closeViewModal);

    if (modalView) {
        modalView.addEventListener('click', (e) => {
            if (e.target === modalView) closeViewModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalView && modalView.classList.contains('active')) {
            closeViewModal();
        }
    });

    // --------------------------------------------------------------------------
    // Eventos de Filtros y Búsqueda
    // --------------------------------------------------------------------------
    if (searchInput) searchInput.addEventListener('input', renderTable);
    if (filterCargo) filterCargo.addEventListener('change', renderTable);
    if (filterEstado) filterEstado.addEventListener('change', renderTable);

    // Mensaje de simulación al regresar de registrar o editar
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        showToast('Empleado registrado exitosamente en el despacho.', 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('updated') === 'true') {
        showToast('Información del empleado actualizada correctamente.', 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Inicialización
    loadEmpleados();
});
