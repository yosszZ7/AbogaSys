/**
 * ==========================================================================
 * AbogaSys - Lógica del Módulo Expedientes (Filtros, Búsqueda y Consulta)
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

    const searchInput = document.getElementById('search-expediente');
    const filterStatus = document.getElementById('filter-status');
    const filterMateria = document.getElementById('filter-materia');
    const tableBody = document.querySelector('#expedientes-table tbody');
    const table = document.getElementById('expedientes-table');
    const modalOverlay = document.getElementById('docket-modal-overlay');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCloseModalFooter = document.getElementById('btn-close-modal-footer');
    const modalTitle = document.getElementById('modal-docket-title');
    const modalContent = document.getElementById('modal-docket-content');

    let expedientesData = [];

    // Cargar catálogos de materias para el filtro
    async function loadFiltroMaterias() {
        try {
            const res = await fetch('/api/materias', { credentials: 'include' });
            if (res.status === 401) { window.location.href = '/index.html'; return; }
            if (res.status === 403) { console.warn('Acceso denegado a materias'); return; }
            if (res.ok) {
                const materias = await res.json();
                if (filterMateria) {
                    filterMateria.innerHTML = '<option value="todas">Todas las materias</option>';
                    materias.forEach(m => {
                        filterMateria.innerHTML += `<option value="${m.NombreMateria.toLowerCase()}">${m.NombreMateria}</option>`;
                    });
                }
            }
        } catch (error) {
            console.error('Error al cargar materias:', error);
        }
    }

    // Cargar expedientes desde la API
    async function fetchExpedientes() {
        try {
            const response = await fetch('/api/expedientes', { credentials: 'include' });
            if (response.status === 401) { window.location.href = '/index.html'; return; }
            if (response.status === 403) {
                if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger-color);">Acceso denegado a los expedientes.</td></tr>';
                return;
            }
            if (response.ok) {
                expedientesData = await response.json();
                renderTable();
            } else {
                console.error('Error al obtener expedientes');
                if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Error al cargar los expedientes</td></tr>';
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Error de conexión con el servidor</td></tr>';
        }
    }

    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (expedientesData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay expedientes registrados</td></tr>';
            return;
        }

        expedientesData.forEach(exp => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-status', exp.EstadoProcesal.toLowerCase());
            tr.setAttribute('data-materia', exp.NombreMateria.toLowerCase());
            
            let statusClass = 'abierto';
            if (exp.EstadoProcesal === 'En proceso') statusClass = 'en-proceso';
            else if (exp.EstadoProcesal === 'Suspendido') statusClass = 'suspendido';
            else if (exp.EstadoProcesal === 'Cerrado') statusClass = 'cerrado';
            else if (exp.EstadoProcesal === 'Archivado') statusClass = 'archivado';

            const clienteNombre = exp.TipoCliente === 'N' ? `${exp.ClienteN_Nombre} ${exp.ClienteN_Apellido}` : exp.ClienteJ_RazonSocial;

            // Formatear fecha
            let fechaFormat = exp.FechaApertura ? exp.FechaApertura.split('T')[0] : '';

            tr.innerHTML = `
                <td>
                    <div class="expediente-cell">
                        <span class="exp-number">${exp.NumeroExpediente}</span>
                    </div>
                </td>
                <td>
                    <div class="client-cell">
                        <div class="client-avatar">${clienteNombre.charAt(0).toUpperCase()}</div>
                        <div class="client-info">
                            <span class="client-name">${clienteNombre}</span>
                            <span class="client-type">${exp.TipoCliente === 'N' ? 'Persona natural' : 'Persona jurídica'}</span>
                        </div>
                    </div>
                </td>
                <td><span class="materia-badge">${exp.NombreMateria}</span></td>
                <td><span class="process-text">${exp.TipoProceso}</span></td>
                <td><span class="court-text">${exp.JuzgadoTribunal}</span></td>
                <td><span class="lawyer-text">${exp.AbogadoNombre} ${exp.AbogadoApellido}</span></td>
                <td><span class="status-pill ${statusClass}">${exp.EstadoProcesal}</span></td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn-action btn-view-docket" data-id="${exp.ExpedienteID}" title="Consultar expediente" aria-label="Consultar expediente">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <a href="editar-expediente.html?id=${exp.ExpedienteID}" class="btn-action edit" title="Editar expediente" aria-label="Editar expediente" data-permission="EXPEDIENTES_EDIT">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </a>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        if (window.AbogaSysPermissions) {
            window.AbogaSysPermissions.applyPermissions();
        }

        filterTable();
    }

    function filterTable() {
        if (!table) return;

        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedStatus = filterStatus ? filterStatus.value.toLowerCase() : 'todos';
        const selectedMateria = filterMateria ? filterMateria.value.toLowerCase() : 'todas';

        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
            if (row.cells.length === 1) return; // Saltar fila de "No hay datos"
            
            const expNum = row.querySelector('.exp-number')?.textContent.toLowerCase() || '';
            const cliente = row.querySelector('.client-name')?.textContent.toLowerCase() || '';
            const materia = row.getAttribute('data-materia')?.toLowerCase() || '';
            const juzgado = row.querySelector('.court-text')?.textContent.toLowerCase() || '';
            const abogado = row.querySelector('.lawyer-text')?.textContent.toLowerCase() || '';
            const status = row.getAttribute('data-status')?.toLowerCase() || '';

            const matchesQuery = !query || expNum.includes(query) || cliente.includes(query) || juzgado.includes(query) || abogado.includes(query);
            const matchesStatus = selectedStatus === 'todos' || status === selectedStatus;
            const matchesMateria = selectedMateria === 'todas' || materia === selectedMateria;

            if (matchesQuery && matchesStatus && matchesMateria) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    if (searchInput) searchInput.addEventListener('input', filterTable);
    if (filterStatus) filterStatus.addEventListener('change', filterTable);
    if (filterMateria) filterMateria.addEventListener('change', filterTable);

    async function openDocketModal(expId) {
        if (!modalOverlay) return;
        
        try {
            const response = await fetch(`/api/expedientes/${expId}`, { credentials: 'include' });
            if (response.status === 401) { window.location.href = '/index.html'; return; }
            if (response.status === 403) {
                modalContent.innerHTML = '<p style="text-align:center; color: var(--danger-color);">Acceso denegado para ver este expediente.</p>';
                modalOverlay.classList.add('active');
                return;
            }
            if (!response.ok) throw new Error('Error al obtener detalle');
            const expDetalle = await response.json();
            
            // Buscar en expedientesData para los nombres resueltos (materia, cliente, abogado)
            const expList = expedientesData.find(e => e.ExpedienteID == expId);
            
            if (!expList) throw new Error('Expediente no en la lista');

            modalTitle.textContent = `Expediente: ${expDetalle.NumeroExpediente} — ${expDetalle.TipoProceso}`;

            let statusClass = 'abierto';
            if (expDetalle.EstadoProcesal === 'En proceso') statusClass = 'en-proceso';
            else if (expDetalle.EstadoProcesal === 'Suspendido') statusClass = 'suspendido';
            else if (expDetalle.EstadoProcesal === 'Cerrado') statusClass = 'cerrado';
            else if (expDetalle.EstadoProcesal === 'Archivado') statusClass = 'archivado';

            const clienteNombre = expList.TipoCliente === 'N' ? `${expList.ClienteN_Nombre} ${expList.ClienteN_Apellido}` : expList.ClienteJ_RazonSocial;

            modalContent.innerHTML = `
                <!-- Barra de Pestañas de Consulta -->
                <nav class="docket-tabs" role="tablist">
                    <button type="button" class="docket-tab-btn active" data-tab="tab-general" role="tab" aria-selected="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                        <span>Ficha Principal</span>
                    </button>
                    <!-- Las otras pestañas (Documentos, Audiencias, Actividad, IA) van aquí... (simplificado para el espacio) -->
                </nav>

                <!-- Pestaña 1: Ficha Principal (Información Completa) -->
                <div id="tab-general" class="docket-tab-panel active">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Número de Expediente</span>
                            <span class="detail-value"><strong>${expDetalle.NumeroExpediente}</strong></span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Estado Procesal</span>
                            <span class="detail-value"><span class="status-pill ${statusClass}">${expDetalle.EstadoProcesal}</span></span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Cliente Patrocinado</span>
                            <span class="detail-value">${clienteNombre}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Materia Jurídica</span>
                            <span class="detail-value"><span class="materia-badge">${expList.NombreMateria}</span></span>
                        </div>
                        <div class="detail-item full-width">
                            <span class="detail-label">Tipo de Proceso / Acción</span>
                            <span class="detail-value">${expDetalle.TipoProceso}</span>
                        </div>
                        <div class="detail-item full-width">
                            <span class="detail-label">Juzgado / Tribunal Asignado</span>
                            <span class="detail-value">${expDetalle.JuzgadoTribunal}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Abogado Responsable</span>
                            <span class="detail-value"><strong>${expList.AbogadoNombre} ${expList.AbogadoApellido}</strong></span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Fecha de Apertura</span>
                            <span class="detail-value">${expDetalle.FechaApertura ? expDetalle.FechaApertura.split('T')[0] : ''}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Contraparte</span>
                            <span class="detail-value">${expDetalle.Contraparte || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Abogado de Contraparte</span>
                            <span class="detail-value">${expDetalle.AbogadoContraparte || '-'} (${expDetalle.TelefonoContraparte || 'Sin teléfono'})</span>
                        </div>
                        <div class="detail-item full-width">
                            <span class="detail-label">Descripción del Caso</span>
                            <span class="detail-value">${expDetalle.DescripcionCaso || '-'}</span>
                        </div>
                        <div class="detail-item full-width">
                            <span class="detail-label">Observaciones Estratégicas</span>
                            <span class="detail-value">${expDetalle.Observaciones || '-'}</span>
                        </div>
                    </div>
                </div>
            `;

            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';

        } catch(error) {
            console.error(error);
            alert('Error al obtener los detalles del expediente.');
        }
    }

    function closeModal() {
        if (!modalOverlay) return;
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (table) {
        table.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.btn-view-docket');
            if (viewBtn) {
                const expId = viewBtn.getAttribute('data-id');
                openDocketModal(expId);
            }
        });
    }

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCloseModalFooter) btnCloseModalFooter.addEventListener('click', closeModal);

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

    // Iniciar
    loadFiltroMaterias();
    fetchExpedientes();
});
