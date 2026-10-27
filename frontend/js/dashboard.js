/**
 * ==========================================================================
 * AbogaSys - Lógica específica del Dashboard y Navegación Responsive
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Ejecutar únicamente en la vista principal del Dashboard (evita colisión con sidebar.js en subpáginas)
    const isDashboardPage = Boolean(document.getElementById('val-clientes'));
    if (!isDashboardPage) return;

    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    /**
     * Alternar apertura/cierre del Sidebar en pantallas pequeñas
     */
    function toggleSidebar() {
        if (!sidebar || !sidebarOverlay) return;
        const isOpen = sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active', isOpen);
        
        if (sidebarToggleBtn) {
            sidebarToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
    }

    /**
     * Cerrar el Sidebar
     */
    function closeSidebar() {
        if (!sidebar || !sidebarOverlay) return;
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        if (sidebarToggleBtn) {
            sidebarToggleBtn.setAttribute('aria-expanded', 'false');
        }
    }

    // Eventos de apertura y cierre
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', toggleSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Cerrar sidebar al pulsar la tecla Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });

    // Cerrar sidebar si se redimensiona la ventana a tamaño de escritorio
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992 && sidebar && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });

    // --- Verificación de Sesión y Permisos ---
    if (window.AbogaSysPermissions) {
        const hasAccess = await window.AbogaSysPermissions.init('DASHBOARD_VIEW');
        if (!hasAccess) return;

    } else {
        console.error('[AbogaSys] permissions.js no cargado.');
        return;
    }

    // --- Buscador Global y Command Palette (Ctrl+K) ---
    const btnQuickSearch = document.getElementById('btn-quick-search');
    if (btnQuickSearch) {
        btnQuickSearch.addEventListener('click', () => {
            if (window.AppCommandPalette) {
                window.AppCommandPalette.open();
            }
        });
    }

    // --- Notificaciones del Despacho ---
    const btnNotifications = document.getElementById('btn-notifications');
    if (btnNotifications) {
        btnNotifications.addEventListener('click', () => {
            if (window.AppToast) {
                window.AppToast.info('Bandeja de notificaciones al día. No se registran plazos fatales vencidos en tus expedientes.', 'Notificaciones Procesales');
            }
        });
    }

    // --- Cargar Dashboard Dinámico ---
    async function loadDashboardData() {
        try {
            const response = await fetch('/api/dashboard', { credentials: 'include' });
            if (!response.ok) {
                console.error('Error fetching dashboard stats');
                return;
            }
            const data = await response.json();
            
            // 1. Clientes registrados
            if (data.clientesRegistrados !== undefined) {
                const el = document.getElementById('val-clientes');
                if (el) el.textContent = data.clientesRegistrados;
            }
            
            // 2. Expedientes activos
            if (data.expedientesActivos !== undefined) {
                const el = document.getElementById('val-expedientes');
                if (el) el.textContent = data.expedientesActivos;
            }
            
            // 3. Próximas audiencias y tareas
            if (data.audienciasProximas !== undefined) {
                const el = document.getElementById('val-audiencias');
                if (el) el.textContent = data.audienciasProximas;
            }
            if (data.documentosRegistrados !== undefined) {
                const el = document.getElementById('val-documentos');
                if (el) el.textContent = data.documentosRegistrados;
            }
            
            // Tabla de audiencias
            const tbody = document.getElementById('lista-audiencias-body');
            if (tbody) {
                if (data.listaAudiencias && data.listaAudiencias.length > 0) {
                    tbody.innerHTML = '';
                    data.listaAudiencias.forEach(a => {
                        const dateObj = new Date(a.FechaHora);
                        const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        let statusBadgeClass = 'status-scheduled';
                        if (a.Estado === 'Confirmada') statusBadgeClass = 'status-confirmed';
                        else if (a.Estado === 'Concluida') statusBadgeClass = 'status-active';
                        else if (a.Estado === 'Cancelada') statusBadgeClass = 'status-danger';
                        else if (a.Estado === 'Pendiente') statusBadgeClass = 'status-pending';
                        
                        tbody.innerHTML += `
                            <tr>
                                <td><strong style="color: var(--legal-slate-800);">${a.Cliente || 'N/A'}</strong></td>
                                <td><span class="expediente-badge" style="font-family: var(--font-mono, monospace); font-size: 0.775rem; background: var(--legal-gold-100); color: var(--legal-gold-600); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600;">${a.Expediente || 'S/E'}</span></td>
                                <td style="font-variant-numeric: tabular-nums;">${dateStr}</td>
                                <td>${a.Juzgado || 'Tribunal General'}</td>
                                <td>
                                    <span class="badge-status ${statusBadgeClass}">
                                        <span class="status-dot"></span>
                                        ${a.Estado}
                                    </span>
                                </td>
                            </tr>
                        `;
                    });
                } else {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="5" style="padding: 0;">
                                <div class="enterprise-empty-state" style="padding: 3rem 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                    <div class="empty-state-icon-box" style="width: 48px; height: 48px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: #64748b;">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    </div>
                                    <h4 class="empty-state-title" style="font-size: 0.95rem; font-weight: 600; color: #0f172a; margin-bottom: 0.25rem;">No hay audiencias programadas</h4>
                                    <p class="empty-state-desc" style="font-size: 0.8125rem; color: #64748b; max-width: 380px; margin-bottom: 1rem; line-height: 1.4;">No se registran comparecencias judiciales ni diligencias en los próximos días hábiles.</p>
                                    <a href="agenda/agenda.html" class="header-quick-action-btn" style="height: 32px; font-size: 0.775rem;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        <span>Agendar Nueva Diligencia</span>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            }
            
            // Lista de actividad (documentos)
            const ul = document.getElementById('lista-actividad-body');
            if (ul) {
                if (data.actividadDocumentos && data.actividadDocumentos.length > 0) {
                    ul.innerHTML = '';
                    data.actividadDocumentos.forEach(d => {
                        ul.innerHTML += `
                            <li class="activity-item" data-permission="DOCUMENTOS_VIEW">
                                <div class="activity-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                    </svg>
                                </div>
                                <div class="activity-content">
                                    <span class="activity-title">Documento incorporado</span>
                                    <span class="activity-meta">${d.Documento} &bull; Causa: ${d.Expediente || 'S/E'}</span>
                                </div>
                            </li>
                        `;
                    });
                } else {
                    ul.innerHTML = `
                        <li style="padding: 2.5rem 1rem; text-align: center; color: #64748b;">
                            <div class="empty-state-icon-box" style="margin: 0 auto 0.75rem; width: 40px; height: 40px; border-radius: 8px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #64748b;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            </div>
                            <div style="font-weight: 600; color: #0f172a; font-size: 0.8125rem;">Sin actuaciones recientes</div>
                            <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">Las resoluciones y escritos anexados se listarán aquí.</div>
                        </li>
                    `;
                }
            }
            
            // Re-aplicar permisos a los nuevos elementos generados
            if (window.AbogaSysPermissions) {
                window.AbogaSysPermissions.applyPermissions();
            }
            
        } catch (error) {
            console.error('Error al cargar datos dinámicos:', error);
        }
    }

    loadDashboardData();

    // --- Logout Seguro con Confirmación Modal ---
    const logoutBtn = document.querySelector('.nav-item-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            let confirmLogout = true;
            if (window.AppDialog) {
                confirmLogout = await window.AppDialog.confirm({
                    title: '¿Cerrar sesión de trabajo?',
                    message: 'Tu sesión se cerrará de manera segura y se protegerá la información confidencial de los expedientes.',
                    confirmText: 'Cerrar Sesión',
                    cancelText: 'Continuar Trabajando',
                    type: 'primary'
                });
            }

            if (!confirmLogout) return;

            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                if (response.ok) {
                    if (window.AppToast) {
                        window.AppToast.info('Sesión cerrada correctamente. Hasta pronto.', 'Desconexión Segura');
                    }
                    setTimeout(() => {
                        window.location.href = '/index.html';
                    }, 400);
                } else {
                    console.error('[AbogaSys] Error al cerrar sesión (Status:', response.status, ')');
                    if (window.AppToast) {
                        window.AppToast.error('No se pudo cerrar la sesión en el servidor.', 'Error');
                    }
                }
            } catch (error) {
                console.error('[AbogaSys] Error de red al cerrar sesión:', error);
                if (window.AppToast) {
                    window.AppToast.error('Problema de conexión al procesar el cierre de sesión.', 'Error de Red');
                }
            }
        });
    }

    console.log('[AbogaSys] Dashboard inicializado.');
});
