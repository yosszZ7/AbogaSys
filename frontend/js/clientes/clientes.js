/**
 * ==========================================================================
 * AbogaSys - Lógica del Módulo Clientes (Listado, Búsqueda y Consulta)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar permisos
    if (window.AbogaSysPermissions) {
        const hasAccess = await window.AbogaSysPermissions.init('CLIENTES_VIEW');
        if (!hasAccess) return;
    } else {
        console.error('[AbogaSys] permissions.js no cargado.');
        return;
    }

    const searchInput = document.getElementById('search-client');
    const clientsTableBody = document.querySelector('#clients-table tbody');
    const modalOverlay = document.getElementById('client-modal-overlay');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCloseModalFooter = document.getElementById('btn-close-modal-footer');
    const modalTitle = document.getElementById('modal-client-title');
    const modalContent = document.getElementById('modal-client-content');

    // Cargar clientes desde el backend
    async function loadClientes() {
        try {
            clientsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Cargando clientes...</td></tr>';
            const response = await fetch('/api/clientes', {
                credentials: 'include'
            });

            if (response.status === 401) { window.location.href = '/index.html'; return; }
            if (response.status === 403) {
                clientsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger-color);">Acceso denegado a los clientes.</td></tr>';
                return;
            }
            if (!response.ok) {
                throw new Error('Error al obtener los clientes');
            }

            const clientes = await response.json();
            renderClientes(clientes);
        } catch (error) {
            console.error('Error:', error);
            clientsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger-color);">Error de conexión al cargar los clientes.</td></tr>';
        }
    }

    function renderClientes(clientes) {
        clientsTableBody.innerHTML = '';

        if (clientes.length === 0) {
            clientsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay clientes registrados.</td></tr>';
            return;
        }

        clientes.forEach(c => {
            const tr = document.createElement('tr');
            
            let tipoBadge = '';
            let nombre = '';
            let avatarContent = '';
            let userInfoHtml = '';
            let identificacion = '';

            if (c.TipoCliente === 'N') {
                tipoBadge = '<span class="type-badge natural">Persona natural</span>';
                nombre = `${c.PrimerNombre} ${c.PrimerApellido}`;
                avatarContent = `<div class="user-cell-avatar" aria-hidden="true">${nombre.charAt(0).toUpperCase()}</div>`;
                userInfoHtml = `<span class="user-cell-name client-name-text">${nombre}</span>`;
                identificacion = `<span class="id-badge">${c.Cedula}</span>`;
            } else {
                tipoBadge = '<span class="type-badge juridica">Persona jurídica</span>';
                nombre = c.RazonSocial;
                avatarContent = `<div class="user-cell-avatar" aria-hidden="true" style="background-color: rgba(217, 119, 6, 0.15); color: #b45309; border-color: rgba(217, 119, 6, 0.3);">${nombre.charAt(0).toUpperCase()}</div>`;
                userInfoHtml = `<span class="user-cell-name client-name-text">${nombre}</span>`;
                identificacion = `<span class="id-badge">${c.RUC}</span>`;
            }

            tr.innerHTML = `
                <td>
                    <div class="user-cell">
                        ${avatarContent}
                        <div class="user-cell-info">
                            ${userInfoHtml}
                        </div>
                    </div>
                </td>
                <td>${identificacion}</td>
                <td>${tipoBadge}</td>
                <td>${c.Telefono}</td>
                <td><span class="client-email-text">${c.Correo || 'Sin correo'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn-action btn-view-client" data-id="${c.ClienteID}" title="Consultar ficha completa">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <a href="editar-cliente.html?id=${c.ClienteID}" class="btn-action edit" title="Editar cliente" data-permission="CLIENTES_EDIT">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </a>
                    </div>
                </td>
            `;
            clientsTableBody.appendChild(tr);
        });

        // Aplicar permisos a los botones generados
        if (window.AbogaSysPermissions) {
            window.AbogaSysPermissions.applyPermissions();
        }
    }

    /**
     * Búsqueda en tiempo real en la tabla
     */
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const rows = clientsTableBody.querySelectorAll('tr');

            rows.forEach(row => {
                const nameText = row.querySelector('.client-name-text')?.textContent.toLowerCase() || '';
                const idText = row.querySelector('.id-badge')?.textContent.toLowerCase() || '';
                const typeText = row.querySelector('.type-badge')?.textContent.toLowerCase() || '';
                const emailText = row.querySelector('.client-email-text')?.textContent.toLowerCase() || '';

                if (nameText.includes(query) || idText.includes(query) || typeText.includes(query) || emailText.includes(query)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    /**
     * Abrir modal de consulta detallada
     */
    async function openClientModal(clientId) {
        if (!modalOverlay) return;

        modalTitle.textContent = `Cargando detalles...`;
        modalContent.innerHTML = '<p style="text-align:center;">Por favor espere...</p>';
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        try {
            const response = await fetch(`/api/clientes/${clientId}`, {
                credentials: 'include'
            });

            if (response.status === 401) { window.location.href = '/index.html'; return; }
            if (response.status === 403) {
                modalContent.innerHTML = '<p style="text-align:center; color: var(--danger-color);">Acceso denegado para ver este cliente.</p>';
                return;
            }
            if (!response.ok) {
                throw new Error('Error al obtener los datos del cliente');
            }

            const client = await response.json();

            let detailsHtml = '';
            if (client.TipoCliente === 'N') {
                modalTitle.textContent = `Ficha del Cliente: ${client.PrimerNombre} ${client.PrimerApellido}`;
                detailsHtml = `
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Tipo de Cliente</span>
                            <span class="detail-value"><span class="type-badge natural">Persona natural</span></span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Cédula de Identidad</span>
                            <span class="detail-value"><span class="id-badge">${client.Cedula}</span></span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Nombre Completo</span>
                            <span class="detail-value">${client.PrimerNombre} ${client.SegundoNombre || ''} ${client.PrimerApellido} ${client.SegundoApellido || ''}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Fecha de Nacimiento</span>
                            <span class="detail-value">${client.FechaNacimiento ? new Date(client.FechaNacimiento).toLocaleDateString() : 'No registrado'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Sexo</span>
                            <span class="detail-value">${client.Sexo || 'No registrado'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Estado Civil</span>
                            <span class="detail-value">${client.EstadoCivil || 'No registrado'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Tipo de Sangre</span>
                            <span class="detail-value">${client.TipoSangre || 'No registrado'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Teléfono</span>
                            <span class="detail-value">${client.Telefono}</span>
                        </div>
                        <div class="detail-item full-width">
                            <span class="detail-label">Correo Electrónico</span>
                            <span class="detail-value">${client.Correo || 'No registrado'}</span>
                        </div>
                        <div class="detail-item full-width">
                            <span class="detail-label">Dirección</span>
                            <span class="detail-value">${client.Direccion || 'No registrado'}</span>
                        </div>
                        <div class="detail-item full-width">
                            <span class="detail-label">Observaciones</span>
                            <span class="detail-value">${client.ObsNatural || 'Sin observaciones'}</span>
                        </div>
                    </div>
                `;
            } else {
                modalTitle.textContent = `Ficha del Cliente: ${client.RazonSocial}`;
                detailsHtml = `
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Tipo de Cliente</span>
                            <span class="detail-value"><span class="type-badge juridica">Persona jurídica</span></span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">RUC</span>
                            <span class="detail-value"><span class="id-badge">${client.RUC}</span></span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Razón Social</span>
                            <span class="detail-value">${client.RazonSocial}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Nombre Comercial</span>
                            <span class="detail-value">${client.NombreComercial || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Teléfono de la Empresa</span>
                            <span class="detail-value">${client.Telefono}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Correo de la Empresa</span>
                            <span class="detail-value">${client.Correo || 'No registrado'}</span>
                        </div>
                        <div class="detail-item full-width">
                            <span class="detail-label">Dirección Fiscal</span>
                            <span class="detail-value">${client.Direccion || 'No registrado'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Representante Legal</span>
                            <span class="detail-value"><strong>${client.RepresentantePrimerNombre} ${client.RepresentanteSegundoNombre || ''} ${client.RepresentantePrimerApellido} ${client.RepresentanteSegundoApellido || ''}</strong></span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Cédula Representante</span>
                            <span class="detail-value"><span class="id-badge">${client.RepresentanteCedula}</span></span>
                        </div>
                        <div class="detail-item full-width">
                            <span class="detail-label">Observaciones</span>
                            <span class="detail-value">${client.ObsJuridica || 'Sin observaciones'}</span>
                        </div>
                    </div>
                `;
            }
            modalContent.innerHTML = detailsHtml;

        } catch (err) {
            console.error(err);
            modalContent.innerHTML = '<p style="text-align:center; color: var(--danger-color);">Error al cargar los detalles del cliente.</p>';
        }
    }

    function closeModal() {
        if (!modalOverlay) return;
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Delegación de eventos para botones de consulta en la tabla
    if (clientsTableBody) {
        clientsTableBody.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.btn-view-client');
            if (viewBtn) {
                const clientId = viewBtn.getAttribute('data-id');
                openClientModal(clientId);
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

    // Cargar inicialmente
    loadClientes();
});
