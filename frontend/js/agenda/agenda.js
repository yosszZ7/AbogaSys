/**
 * ==========================================================================
 * AbogaSys - Lógica del Módulo Agenda (Calendario Jurídico y Actividades)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar permisos
    if (window.AbogaSysPermissions) {
        const hasAccess = await window.AbogaSysPermissions.init('AGENDA_VIEW');
        if (!hasAccess) return;
    } else {
        console.error('[AbogaSys] permissions.js no cargado.');
        return;
    }

    // Referencias al DOM - Navegación y Calendario
    const currentMonthYearEl = document.getElementById('current-month-year');
    const calendarGridEl = document.getElementById('calendar-grid');
    const btnPrevMonth = document.getElementById('btn-prev-month');
    const btnNextMonth = document.getElementById('btn-next-month');
    const btnToday = document.getElementById('btn-cal-today');

    // Referencias al DOM - Panel de Próximas Actividades
    const upcomingListEl = document.getElementById('upcoming-events-list');
    const upcomingPanelTitleEl = document.getElementById('upcoming-panel-title');
    const upcomingCountBadgeEl = document.getElementById('upcoming-count-badge');
    const btnShowAllActivities = document.getElementById('btn-show-all-activities');

    // Filtros de categoría
    const filterChips = document.querySelectorAll('.filter-chip');

    // Referencias al DOM - Modal Nueva Actividad
    const btnOpenNewModal = document.getElementById('btn-open-new-modal');
    const modalNewOverlay = document.getElementById('modal-new-activity-overlay');
    const btnCloseNewModal = document.getElementById('btn-close-new-modal');
    const btnCancelNewActivity = document.getElementById('btn-cancel-new-activity');
    const formNewActivity = document.getElementById('form-new-activity');
    const formTitle = document.getElementById('modal-new-title');

    // Referencias al DOM - Modal Consulta Actividad
    const modalViewOverlay = document.getElementById('modal-view-activity-overlay');
    const btnCloseViewModal = document.getElementById('btn-close-view-modal');
    const btnCloseViewModalFooter = document.getElementById('btn-close-view-modal-footer');
    const viewModalTitleEl = document.getElementById('view-modal-title');
    const viewModalBodyEl = document.getElementById('view-modal-body');
    const btnEditActivity = document.getElementById('btn-edit-activity');
    const btnDeleteActivity = document.getElementById('btn-delete-activity');

    // Selectores
    const actTypeSelect = document.getElementById('act-type');
    const actLawyerSelect = document.getElementById('act-lawyer');
    const actDocketSelect = document.getElementById('act-docket');
    const actClientSelect = document.getElementById('act-client');

    const toast = document.getElementById('toast-feedback');

    let displayDate = new Date();
    let selectedDateStr = null; 
    let currentCategoryFilter = 'todos';
    let currentActiveActivityId = null;
    let isEditing = false;
    let activities = [];
    
    // Almacenamos el catálogo original para el form Edit
    let catTipos = [];
    let catAbogados = [];
    let catExpedientes = [];
    let catClientes = [];

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    function getCategoryClass(tipo) {
        if (!tipo) return 'cat-otra';
        const norm = tipo.toLowerCase();
        if (norm.includes('audiencia')) return 'cat-audiencia';
        if (norm.includes('reunión') || norm.includes('reunion')) return 'cat-reunion';
        if (norm.includes('plazo') || norm.includes('vencimiento')) return 'cat-plazo';
        if (norm.includes('escrito')) return 'cat-escrito';
        if (norm.includes('recordatorio')) return 'cat-recordatorio';
        return 'cat-otra';
    }

    function formatDateDisplay(dateStr) {
        if (!dateStr) return '-';
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length !== 3) return dateStr;
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const shortMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${day} ${shortMonths[monthIndex]} ${year}`;
    }

    function formatTime(timeStr) {
        if (!timeStr) return '';
        // Si viene un datetime (ISO)
        if (timeStr.includes('T')) {
            const date = new Date(timeStr);
            return date.toISOString().substring(11, 16);
        }
        return timeStr.substring(0, 5); // HH:mm
    }

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3200);
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

    // ---------------------------------------------------------
    // Carga de datos
    // ---------------------------------------------------------

    async function loadCatalogs() {
        try {
            const [resTipos, resAbogados, resExpedientes, resClientes] = await Promise.all([
                fetch('/api/tipos-actividad', { credentials: 'include' }),
                fetch('/api/empleados/abogados', { credentials: 'include' }),
                fetch('/api/expedientes/lista', { credentials: 'include' }),
                fetch('/api/clientes/lista', { credentials: 'include' })
            ]);

            if (resTipos.status === 401 || resAbogados.status === 401 || resExpedientes.status === 401 || resClientes.status === 401) { window.location.href = '/index.html'; return; }
            if (resTipos.status === 403 || resAbogados.status === 403 || resExpedientes.status === 403 || resClientes.status === 403) { console.warn('Acceso denegado a catálogos'); return; }

            if (resTipos.ok) {
                catTipos = await resTipos.json();
                actTypeSelect.innerHTML = '';
                catTipos.forEach(t => {
                    actTypeSelect.innerHTML += `<option value="${t.TipoActividadID}">${t.NombreActividad}</option>`;
                });
            }

            if (resAbogados.ok) {
                catAbogados = await resAbogados.json();
                actLawyerSelect.innerHTML = '';
                catAbogados.forEach(a => {
                    actLawyerSelect.innerHTML += `<option value="${a.EmpleadoID}">${a.PrimerNombre} ${a.PrimerApellido} (Abogado)</option>`;
                });
            }

            if (resExpedientes.ok) {
                catExpedientes = await resExpedientes.json();
                actDocketSelect.innerHTML = '<option value="">Sin expediente asociado</option>';
                catExpedientes.forEach(e => {
                    const clientName = e.TipoCliente === 'N' ? `${e.ClienteN_Nombre} ${e.ClienteN_Apellido}` : e.ClienteJ_RazonSocial;
                    actDocketSelect.innerHTML += `<option value="${e.ExpedienteID}">${e.NumeroExpediente} (${clientName})</option>`;
                });
            }

            if (resClientes.ok) {
                catClientes = await resClientes.json();
                actClientSelect.innerHTML = '<option value="">Sin cliente asociado</option>';
                catClientes.forEach(c => {
                    const clientName = c.TipoCliente === 'N' ? `${c.PrimerNombre} ${c.PrimerApellido}` : c.RazonSocial;
                    actClientSelect.innerHTML += `<option value="${c.ClienteID}">${clientName}</option>`;
                });
            }

        } catch (error) {
            console.error('Error cargando catálogos:', error);
        }
    }

    async function fetchActivities() {
        try {
            const mes = displayDate.getMonth() + 1;
            const anio = displayDate.getFullYear();
            const response = await fetch(`/api/agenda?mes=${mes}&anio=${anio}`, { credentials: 'include' });
            if (response.status === 401) { window.location.href = '/index.html'; return; }
            if (response.status === 403) {
                upcomingListEl.innerHTML = '<p style="text-align: center; color: var(--danger-color);">Acceso denegado al calendario.</p>';
                return;
            }
            if (response.ok) {
                activities = await response.json();
            } else {
                activities = [];
            }
            renderCalendar();
            renderUpcomingActivities();
        } catch (error) {
            console.error('Error obteniendo agenda:', error);
            activities = [];
        }
    }

    // Regla de Exclusión Mutua para Expediente y Cliente
    actDocketSelect.addEventListener('change', () => {
        const val = actDocketSelect.value;
        if (val && val.trim() !== '') {
            actClientSelect.value = '';
            actClientSelect.disabled = true;
        } else {
            actClientSelect.disabled = false;
            actClientSelect.removeAttribute('disabled');
        }
    });

    actClientSelect.addEventListener('change', () => {
        const val = actClientSelect.value;
        if (val && val.trim() !== '') {
            actDocketSelect.value = '';
            actDocketSelect.disabled = true;
        } else {
            actDocketSelect.disabled = false;
            actDocketSelect.removeAttribute('disabled');
        }
    });


    // ---------------------------------------------------------
    // Calendario y UI
    // ---------------------------------------------------------

    function renderCalendar() {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        currentMonthYearEl.textContent = `${monthNames[month]} ${year}`;
        calendarGridEl.innerHTML = '';

        const firstDayOfMonth = new Date(year, month, 1);
        let firstDayIndex = firstDayOfMonth.getDay() - 1;
        if (firstDayIndex === -1) firstDayIndex = 6;

        const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const today = new Date();
        const isCurrentRealMonth = (today.getFullYear() === year && today.getMonth() === month);
        const todayDate = today.getDate();

        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const prevDayNum = daysInPrevMonth - i;
            const dateStr = formatDateToISO(new Date(year, month - 1, prevDayNum));
            calendarGridEl.appendChild(createDayCell(prevDayNum, dateStr, true, false));
        }

        for (let day = 1; day <= daysInCurrentMonth; day++) {
            const dateStr = formatDateToISO(new Date(year, month, day));
            const isToday = isCurrentRealMonth && (day === todayDate);
            calendarGridEl.appendChild(createDayCell(day, dateStr, false, isToday));
        }

        const totalCells = firstDayIndex + daysInCurrentMonth;
        const remainingCells = (totalCells % 7 === 0) ? 0 : 7 - (totalCells % 7);

        for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
            const dateStr = formatDateToISO(new Date(year, month + 1, nextDay));
            calendarGridEl.appendChild(createDayCell(nextDay, dateStr, true, false));
        }
    }

    function formatDateToISO(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function createDayCell(dayNum, dateStr, isOtherMonth, isToday) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        if (isOtherMonth) cell.classList.add('is-other-month');
        if (isToday) cell.classList.add('is-today');
        if (selectedDateStr === dateStr) cell.classList.add('is-selected');
        cell.setAttribute('data-date', dateStr);

        const header = document.createElement('div');
        header.className = 'day-header';
        
        const numberSpan = document.createElement('span');
        numberSpan.className = 'day-number';
        numberSpan.textContent = dayNum;
        header.appendChild(numberSpan);

        if (isToday) {
            const todayBadge = document.createElement('span');
            todayBadge.className = 'day-badge-today';
            todayBadge.textContent = 'Hoy';
            header.appendChild(todayBadge);
        }

        cell.appendChild(header);

        const dayEvents = activities.filter(act => {
            const actDate = act.FechaActividad.split('T')[0];
            const matchDate = actDate === dateStr;
            const matchFilter = (currentCategoryFilter === 'todos') || (act.TipoActividad === currentCategoryFilter);
            return matchDate && matchFilter;
        });

        if (dayEvents.length > 0) {
            const eventsList = document.createElement('div');
            eventsList.className = 'day-events-list';

            const maxVisible = 2;
            dayEvents.slice(0, maxVisible).forEach(act => {
                const pill = document.createElement('div');
                const catClass = getCategoryClass(act.TipoActividad);
                pill.className = `cal-event-pill ${catClass}`;
                pill.textContent = act.Titulo;
                pill.title = `${act.TipoActividad}: ${act.Titulo}`;

                pill.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openViewActivityModal(act.ActividadID);
                });

                eventsList.appendChild(pill);
            });

            if (dayEvents.length > maxVisible) {
                const moreBadge = document.createElement('div');
                moreBadge.className = 'more-events-badge';
                moreBadge.textContent = `+${dayEvents.length - maxVisible} más`;
                eventsList.appendChild(moreBadge);
            }
            cell.appendChild(eventsList);
        }

        cell.addEventListener('click', () => {
            handleDayClick(dateStr);
        });

        return cell;
    }

    function handleDayClick(dateStr) {
        selectedDateStr = (selectedDateStr === dateStr) ? null : dateStr;
        document.querySelectorAll('.calendar-day').forEach(cell => {
            if (cell.getAttribute('data-date') === selectedDateStr) {
                cell.classList.add('is-selected');
            } else {
                cell.classList.remove('is-selected');
            }
        });
        renderUpcomingActivities();
    }

    function renderUpcomingActivities() {
        upcomingListEl.innerHTML = '';

        let filtered = activities.filter(act => {
            const actDate = act.FechaActividad.split('T')[0];
            const matchDay = !selectedDateStr || (actDate === selectedDateStr);
            const matchCategory = (currentCategoryFilter === 'todos') || (act.TipoActividad === currentCategoryFilter);
            return matchDay && matchCategory;
        });

        filtered.sort((a, b) => {
            const dateA = a.FechaActividad.split('T')[0];
            const dateB = b.FechaActividad.split('T')[0];
            if (dateA !== dateB) return dateA.localeCompare(dateB);
            
            const timeA = formatTime(a.HoraInicio);
            const timeB = formatTime(b.HoraInicio);
            return timeA.localeCompare(timeB);
        });

        if (selectedDateStr) {
            upcomingPanelTitleEl.textContent = `Actividades del ${formatDateDisplay(selectedDateStr)}`;
            btnShowAllActivities.style.display = 'inline-block';
        } else {
            upcomingPanelTitleEl.textContent = 'Próximas actividades';
            btnShowAllActivities.style.display = 'none';
        }

        upcomingCountBadgeEl.textContent = filtered.length;

        if (filtered.length === 0) {
            upcomingListEl.innerHTML = `
                <div class="activity-empty-state">
                    <p style="font-weight: 600; color: #334155;">No hay actividades programadas</p>
                </div>
            `;
            return;
        }

        filtered.forEach(act => {
            const card = document.createElement('article');
            const catClass = getCategoryClass(act.TipoActividad);
            card.className = `activity-card ${catClass}`;
            card.setAttribute('role', 'button');

            const hInicio = formatTime(act.HoraInicio);
            const hFin = act.HoraFin ? formatTime(act.HoraFin) : '';
            const timeRange = hFin ? `${hInicio} - ${hFin}` : `${hInicio}`;

            const clienteName = act.ClienteN_Nombre ? `${act.ClienteN_Nombre} ${act.ClienteN_Apellido}` : act.ClienteJ_RazonSocial;

            card.innerHTML = `
                <div class="activity-card-top">
                    <span class="badge-type ${catClass}">${act.TipoActividad}</span>
                    <span class="activity-date-time">
                        ${formatDateDisplay(act.FechaActividad)} &bull; ${timeRange}
                    </span>
                </div>
                <h4 class="activity-card-title">${act.Titulo}</h4>
                <div class="activity-meta-grid">
                    ${act.NumeroExpediente ? `<span class="activity-meta-item"><span class="activity-tag-docket">${act.NumeroExpediente}</span></span>` : ''}
                    ${clienteName ? `<span class="activity-meta-item">${clienteName}</span>` : ''}
                    ${act.Lugar ? `<span class="activity-meta-item">${act.Lugar}</span>` : ''}
                    <span class="activity-meta-item">
                        <strong>${act.AbogadoNombre} ${act.AbogadoApellido}</strong>
                    </span>
                </div>
            `;

            card.addEventListener('click', () => openViewActivityModal(act.ActividadID));
            upcomingListEl.appendChild(card);
        });

        if (window.AbogaSysPermissions) {
            window.AbogaSysPermissions.applyPermissions();
        }
    }

    // ---------------------------------------------------------
    // Modales y Formularios
    // ---------------------------------------------------------

    if (btnOpenNewModal) {
        btnOpenNewModal.addEventListener('click', () => {
            isEditing = false;
            currentActiveActivityId = null;
            formTitle.textContent = 'Nueva Actividad';
            formNewActivity.reset();
            clearFormErrors();
            actDocketSelect.disabled = false;
            actClientSelect.disabled = false;
            
            const dateInput = document.getElementById('act-date');
            if (dateInput && selectedDateStr) {
                dateInput.value = selectedDateStr;
            }
            modalNewOverlay.classList.add('active');
        });
    }

    function closeNewModal() {
        modalNewOverlay.classList.remove('active');
        clearFormErrors();
    }

    if (btnCloseNewModal) btnCloseNewModal.addEventListener('click', closeNewModal);
    if (btnCancelNewActivity) btnCancelNewActivity.addEventListener('click', closeNewModal);
    modalNewOverlay.addEventListener('click', (e) => { if (e.target === modalNewOverlay) closeNewModal(); });

    function clearFormErrors() {
        ['act-type', 'act-title', 'act-date', 'act-time-start', 'act-time-end', 'act-lawyer'].forEach(id => clearFieldError(id, `${id}-error`));
    }

    ['act-type', 'act-title', 'act-date', 'act-time-start', 'act-time-end', 'act-lawyer'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => clearFieldError(id, `${id}-error`));
            input.addEventListener('change', () => clearFieldError(id, `${id}-error`));
        }
    });

    if (formNewActivity) {
        formNewActivity.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearFormErrors();

            const tipoId = actTypeSelect.value;
            const titulo = document.getElementById('act-title').value.trim();
            const fecha = document.getElementById('act-date').value;
            const horaInicio = document.getElementById('act-time-start').value;
            const horaFin = document.getElementById('act-time-end').value; 
            const expediente = actDocketSelect.value;
            const cliente = actClientSelect.value;
            const abogado = actLawyerSelect.value;
            const lugar = document.getElementById('act-location').value.trim();
            const recordatorio = document.getElementById('act-reminder').value;
            const descripcion = document.getElementById('act-description').value.trim();

            let hasError = false;

            if (!titulo) { setFieldError('act-title', 'act-title-error', 'Obligatorio.'); hasError = true; }
            if (!fecha) { setFieldError('act-date', 'act-date-error', 'Obligatorio.'); hasError = true; }
            if (!horaInicio) { setFieldError('act-time-start', 'act-time-start-error', 'Obligatorio.'); hasError = true; }
            if (!abogado) { setFieldError('act-lawyer', 'act-lawyer-error', 'Obligatorio.'); hasError = true; }

            if (horaFin && horaInicio && horaFin <= horaInicio) {
                setFieldError('act-time-end', 'act-time-end-error', 'Debe ser posterior a hora de inicio.');
                hasError = true;
            }

            if (hasError) return;

            const payload = {
                tipoActividadId: parseInt(tipoId),
                titulo,
                fechaActividad: fecha,
                horaInicio,
                horaFin: horaFin || null,
                expedienteId: expediente ? parseInt(expediente) : null,
                clienteId: cliente ? parseInt(cliente) : null,
                abogadoResponsableId: parseInt(abogado),
                lugar: lugar || null,
                recordatorio: recordatorio || null,
                descripcion: descripcion || null
            };

            try {
                const url = isEditing ? `/api/agenda/${currentActiveActivityId}` : '/api/agenda';
                const method = isEditing ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });

                if (response.status === 401) { window.location.href = '/index.html'; return; }
                if (response.status === 403) { showToast('Acceso denegado para esta acción.', true); return; }

                const data = await response.json();
                if (response.ok) {
                    showToast(isEditing ? 'Actividad actualizada.' : 'Actividad programada.');
                    closeNewModal();
                    fetchActivities(); // Refresh
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (err) {
                alert('Error de conexión al guardar la actividad.');
            }
        });
    }

    async function openViewActivityModal(activityId) {
        try {
            const response = await fetch(`/api/agenda/${activityId}`, { credentials: 'include' });
            if (response.status === 401) { window.location.href = '/index.html'; return; }
            if (response.status === 403) { showToast('Acceso denegado para ver detalles.', true); return; }
            if (!response.ok) throw new Error('Error al obtener detalle');
            const act = await response.json();

            currentActiveActivityId = act.ActividadID;
            viewModalTitleEl.textContent = act.Titulo;

            const hInicio = formatTime(act.HoraInicio);
            const hFin = act.HoraFin ? formatTime(act.HoraFin) : '';
            const timeDisplay = hFin ? `${hInicio} - ${hFin}` : `${hInicio} (Sin hora de fin)`;
            const catClass = getCategoryClass(act.TipoActividad);
            const clienteName = act.ClienteN_Nombre ? `${act.ClienteN_Nombre} ${act.ClienteN_Apellido}` : act.ClienteJ_RazonSocial;

            viewModalBodyEl.innerHTML = `
                <div class="activity-detail-grid">
                    <div class="detail-block">
                        <span class="detail-label">Tipo de Actividad</span>
                        <span class="detail-value">
                            <span class="badge-type ${catClass}">${act.TipoActividad}</span>
                        </span>
                    </div>
                    <div class="detail-block">
                        <span class="detail-label">Fecha y Horario</span>
                        <span class="detail-value" style="font-weight: 600;">
                            ${formatDateDisplay(act.FechaActividad)} &bull; ${timeDisplay}
                        </span>
                    </div>
                    <div class="detail-block">
                        <span class="detail-label">Expediente Relacionado</span>
                        <span class="detail-value">
                            ${act.NumeroExpediente ? `<span class="activity-tag-docket">${act.NumeroExpediente}</span>` : '<span style="color: #94a3b8;">No vinculado</span>'}
                        </span>
                    </div>
                    <div class="detail-block">
                        <span class="detail-label">Cliente Patrocinado</span>
                        <span class="detail-value">
                            ${clienteName ? `<strong>${clienteName}</strong>` : '<span style="color: #94a3b8;">Sin cliente asignado</span>'}
                        </span>
                    </div>
                    <div class="detail-block">
                        <span class="detail-label">Abogado Responsable</span>
                        <span class="detail-value">
                            <strong>${act.AbogadoNombre} ${act.AbogadoApellido}</strong>
                        </span>
                    </div>
                    <div class="detail-block">
                        <span class="detail-label">Lugar / Sede Judicial</span>
                        <span class="detail-value">${act.Lugar || 'No especificado'}</span>
                    </div>
                    <div class="detail-block full-width">
                        <span class="detail-label">Aviso y Recordatorio</span>
                        <span class="detail-value" style="color: #b45309; font-weight: 600;">
                            🔔 ${act.Recordatorio || 'Sin recordatorio'}
                        </span>
                    </div>
                    <div class="detail-block full-width">
                        <span class="detail-label">Descripción</span>
                        <div class="detail-desc-box">
                            ${act.Descripcion || 'Sin observaciones.'}
                        </div>
                    </div>
                </div>
            `;
            modalViewOverlay.classList.add('active');

            if (window.AbogaSysPermissions) {
                window.AbogaSysPermissions.applyPermissions();
            }
        } catch (error) {
            alert('Error al cargar la actividad.');
        }
    }

    function closeViewModal() {
        modalViewOverlay.classList.remove('active');
    }

    if (btnCloseViewModal) btnCloseViewModal.addEventListener('click', closeViewModal);
    if (btnCloseViewModalFooter) btnCloseViewModalFooter.addEventListener('click', closeViewModal);
    modalViewOverlay.addEventListener('click', (e) => { if (e.target === modalViewOverlay) closeViewModal(); });

    if (btnEditActivity) {
        btnEditActivity.addEventListener('click', async () => {
            if (!currentActiveActivityId) return;
            
            try {
                // Obtenemos los datos frescos
                const response = await fetch(`/api/agenda/${currentActiveActivityId}`, { credentials: 'include' });
                if (response.status === 401) { window.location.href = '/index.html'; return; }
                if (response.status === 403) { showToast('Acceso denegado.', true); return; }
                if (!response.ok) throw new Error('Error de datos');
                const act = await response.json();
                
                closeViewModal();
                
                isEditing = true;
                formTitle.textContent = 'Editar Actividad';
                clearFormErrors();

                // Llenar datos
                actTypeSelect.value = act.TipoActividadID;
                document.getElementById('act-title').value = act.Titulo;
                document.getElementById('act-date').value = act.FechaActividad.split('T')[0];
                document.getElementById('act-time-start').value = formatTime(act.HoraInicio);
                document.getElementById('act-time-end').value = act.HoraFin ? formatTime(act.HoraFin) : '';
                actLawyerSelect.value = act.AbogadoResponsableID;
                document.getElementById('act-location').value = act.Lugar || '';
                document.getElementById('act-reminder').value = act.Recordatorio || '';
                document.getElementById('act-description').value = act.Descripcion || '';
                
                if (act.ExpedienteID) {
                    actDocketSelect.value = act.ExpedienteID;
                    actClientSelect.value = '';
                    actClientSelect.disabled = true;
                    actDocketSelect.disabled = false;
                } else if (act.ClienteID) {
                    actClientSelect.value = act.ClienteID;
                    actDocketSelect.value = '';
                    actDocketSelect.disabled = true;
                    actClientSelect.disabled = false;
                } else {
                    actDocketSelect.value = '';
                    actClientSelect.value = '';
                    actDocketSelect.disabled = false;
                    actClientSelect.disabled = false;
                }

                modalNewOverlay.classList.add('active');

            } catch (err) {
                alert('No se pudo cargar la actividad para editar.');
            }
        });
    }

    if (btnDeleteActivity) {
        btnDeleteActivity.addEventListener('click', () => {
            alert('Eliminación física no implementada en esta etapa.');
        });
    }

    // ---------------------------------------------------------
    // Eventos de Navegación del Calendario
    // ---------------------------------------------------------
    btnPrevMonth.addEventListener('click', () => {
        displayDate.setMonth(displayDate.getMonth() - 1);
        fetchActivities();
    });

    btnNextMonth.addEventListener('click', () => {
        displayDate.setMonth(displayDate.getMonth() + 1);
        fetchActivities();
    });

    btnToday.addEventListener('click', () => {
        displayDate = new Date();
        selectedDateStr = formatDateToISO(displayDate);
        fetchActivities();
    });

    btnShowAllActivities.addEventListener('click', () => {
        selectedDateStr = null;
        document.querySelectorAll('.calendar-day').forEach(cell => cell.classList.remove('is-selected'));
        renderUpcomingActivities();
    });

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCategoryFilter = chip.getAttribute('data-type');
            renderCalendar();
            renderUpcomingActivities();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeNewModal();
            closeViewModal();
        }
    });

    // Iniciar Módulo
    loadCatalogs().then(() => fetchActivities());
});
