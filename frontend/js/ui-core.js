/**
 * ==========================================================================
 * AbogaSys - Enterprise LegalTech UI Core System (JavaScript)
 * Componentes de nivel corporativo para eliminar alertas nativas y elevar UX
 * ==========================================================================
 */

window.AppToast = (() => {
    let container = null;

    function getContainer() {
        if (!container || !document.body.contains(container)) {
            container = document.createElement('div');
            container.className = 'app-toast-container';
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }
        return container;
    }

    const ICONS = {
        success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
        info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
    };

    function show(message, type = 'info', title = null, duration = 4000) {
        const cont = getContainer();
        const toast = document.createElement('div');
        toast.className = `app-toast toast-${type}`;
        
        const defaultTitles = {
            success: 'Operación Exitosa',
            error: 'Atención Requerida',
            warning: 'Aviso del Sistema',
            info: 'Notificación'
        };
        const finalTitle = title || defaultTitles[type] || 'Aviso';

        toast.innerHTML = `
            <div class="toast-icon" aria-hidden="true">${ICONS[type] || ICONS.info}</div>
            <div class="toast-content">
                <div class="toast-title">${finalTitle}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close-btn" aria-label="Cerrar notificación">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;

        function removeToast() {
            if (toast.classList.contains('toast-exiting')) return;
            toast.classList.add('toast-exiting');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 220);
        }

        toast.querySelector('.toast-close-btn').addEventListener('click', removeToast);

        cont.appendChild(toast);

        if (duration > 0) {
            setTimeout(removeToast, duration);
        }

        return toast;
    }

    return {
        show,
        success: (msg, title, duration) => show(msg, 'success', title, duration),
        error: (msg, title, duration) => show(msg, 'error', title, duration),
        warning: (msg, title, duration) => show(msg, 'warning', title, duration),
        info: (msg, title, duration) => show(msg, 'info', title, duration)
    };
})();

window.AppDialog = (() => {
    function confirm(arg1, arg2 = {}) {
        // Soporta tanto confirm({ title, message, ... }) como confirm('mensaje', { title, ... })
        let options = {};
        if (typeof arg1 === 'string') {
            options = { ...arg2, message: arg1 };
            if (arg2 && arg2.danger && !arg2.type) {
                options.type = 'danger';
            }
        } else if (arg1 && typeof arg1 === 'object') {
            options = arg1;
        }

        const {
            title = '¿Confirmar acción?',
            message = '',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'primary'
        } = options;

        return new Promise((resolve) => {
            const backdrop = document.createElement('div');
            backdrop.className = 'app-dialog-backdrop';

            const iconClass = type === 'danger' ? 'icon-danger' : (type === 'warning' ? 'icon-warning' : 'icon-primary');
            const btnClass = type === 'danger' ? 'btn-danger-dialog' : 'btn-primary-dialog';

            let iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
            if (type === 'danger') {
                iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
            }

            const cancelButtonHtml = cancelText
                ? `<button type="button" class="btn-secondary-dialog" id="dlg-btn-cancel">${cancelText}</button>`
                : '';

            backdrop.innerHTML = `
                <div class="app-dialog-card" role="dialog" aria-modal="true">
                    <div class="app-dialog-header">
                        <div class="app-dialog-icon ${iconClass}">
                            ${iconSvg}
                        </div>
                        <div class="app-dialog-title-group">
                            <h3 class="app-dialog-title">${title}</h3>
                            <p class="app-dialog-message">${message}</p>
                        </div>
                    </div>
                    <div class="app-dialog-footer">
                        ${cancelButtonHtml}
                        <button type="button" class="${btnClass}" id="dlg-btn-confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            const onKeyDown = (e) => {
                if (e.key === 'Escape') {
                    close(false);
                }
            };

            function close(result) {
                document.removeEventListener('keydown', onKeyDown);
                backdrop.style.opacity = '0';
                setTimeout(() => {
                    if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
                    resolve(result);
                }, 150);
            }

            const cancelBtn = backdrop.querySelector('#dlg-btn-cancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => close(false));
            }
            backdrop.querySelector('#dlg-btn-confirm').addEventListener('click', () => close(true));

            document.addEventListener('keydown', onKeyDown);

            document.body.appendChild(backdrop);
            backdrop.querySelector('#dlg-btn-confirm').focus();
        });
    }

    function alert({ title = 'Información', message, buttonText = 'Entendido', type = 'primary' }) {
        return confirm({
            title,
            message,
            confirmText: buttonText,
            cancelText: '',
            type
        }).then(() => {});
    }

    return { confirm, alert };
})();

window.AppCommandPalette = (() => {
    const COMMANDS = [
        { title: 'Ver Panel Principal', desc: 'Ir al Dashboard', icon: 'home', url: '/pages/dashboard.html', permission: null },
        { title: 'Expedientes Judiciales', desc: 'Listado y seguimiento de causas', icon: 'folder', url: '/pages/expedientes/expedientes.html', permission: 'EXPEDIENTES_VIEW' },
        { title: 'Nuevo Expediente', desc: 'Aperturar causa jurídica', icon: 'plus-folder', url: '/pages/expedientes/registrar-expediente.html', permission: 'EXPEDIENTES_CREATE' },
        { title: 'Agenda Procesal', desc: 'Audiencias y términos fatales', icon: 'calendar', url: '/pages/agenda/agenda.html', permission: 'AGENDA_VIEW' },
        { title: 'Cartera de Clientes', desc: 'Personas naturales y jurídicas', icon: 'users', url: '/pages/clientes/clientes.html', permission: 'CLIENTES_VIEW' },
        { title: 'Registrar Cliente', desc: 'Añadir nuevo poderdante', icon: 'user-plus', url: '/pages/clientes/registrar-cliente.html', permission: 'CLIENTES_CREATE' },
        { title: 'Bóveda de Documentos', desc: 'Repositorio y análisis asistido', icon: 'file', url: '/pages/documentos/documentos.html', permission: 'DOCUMENTOS_VIEW' },
        { title: 'Directorio de Personal', desc: 'Abogados y colaboradores', icon: 'briefcase', url: '/pages/empleados/empleados.html', permission: 'EMPLEADOS_VIEW' },
        { title: 'Gestión de Usuarios y Roles', desc: 'Control de accesos RBAC', icon: 'shield', url: '/pages/usuarios/usuarios.html', permission: 'USUARIOS_VIEW' }
    ];

    let isOpen = false;

    function open() {
        // Deshabilitar en la pantalla de Login
        if (document.body.classList.contains('login-page-body') || window.location.pathname === '/' || window.location.pathname.endsWith('/index.html')) {
            return;
        }
        if (isOpen) return;
        isOpen = true;

        const backdrop = document.createElement('div');
        backdrop.className = 'command-palette-backdrop';
        backdrop.id = 'app-command-palette';

        backdrop.innerHTML = `
            <div class="command-palette-card" role="dialog" aria-modal="true">
                <div class="command-search-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input type="text" class="command-search-input" id="command-search" placeholder="Buscar módulo, expediente o acción jurídica..." autocomplete="off">
                    <span class="command-kbd-badge">ESC para salir</span>
                </div>
                <ul class="command-results-list" id="command-results">
                    <!-- Dinámico -->
                </ul>
                <div class="command-footer">
                    <span>Navega con &uarr; &darr; y pulsa <strong>Enter</strong></span>
                    <span>AbogaSys LegalTech OS</span>
                </div>
            </div>
        `;

        const input = backdrop.querySelector('#command-search');
        const results = backdrop.querySelector('#command-results');

        function canAccessCommand(cmd) {
            if (!cmd.permission) return true;
            if (window.AbogaSysPermissions && typeof window.AbogaSysPermissions.getUserData === 'function' && window.AbogaSysPermissions.getUserData()) {
                return window.AbogaSysPermissions.hasPermission(cmd.permission);
            }
            return true;
        }

        function renderList(filter = '') {
            const query = filter.toLowerCase().trim();
            const filtered = COMMANDS.filter(c =>
                canAccessCommand(c) &&
                (c.title.toLowerCase().includes(query) || c.desc.toLowerCase().includes(query))
            );

            results.innerHTML = '';
            if (filtered.length === 0) {
                results.innerHTML = `<li style="padding: 1.5rem; text-align: center; color: var(--legal-slate-400); font-size: 0.875rem;">No se encontraron acciones coincidentes</li>`;
                return;
            }

            filtered.forEach((cmd, idx) => {
                const li = document.createElement('li');
                li.className = `command-item ${idx === 0 ? 'active' : ''}`;
                li.innerHTML = `
                    <div class="command-item-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                    <span class="command-item-title">${cmd.title}</span>
                    <span class="command-item-desc">${cmd.desc}</span>
                `;
                li.addEventListener('click', () => {
                    close();
                    window.location.href = cmd.url;
                });
                results.appendChild(li);
            });
        }

        renderList();

        input.addEventListener('input', (e) => renderList(e.target.value));

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                close();
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const items = Array.from(results.querySelectorAll('.command-item'));
                if (!items.length) return;
                const activeIndex = items.findIndex(it => it.classList.contains('active'));
                items.forEach(it => it.classList.remove('active'));
                let nextIndex = activeIndex;
                if (e.key === 'ArrowDown') {
                    nextIndex = (activeIndex + 1) % items.length;
                } else {
                    nextIndex = (activeIndex - 1 + items.length) % items.length;
                }
                items[nextIndex].classList.add('active');
                items[nextIndex].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                const active = results.querySelector('.command-item.active');
                if (active) active.click();
            }
        };

        function close() {
            isOpen = false;
            document.removeEventListener('keydown', onKeyDown);
            if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        }

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) close();
        });

        document.addEventListener('keydown', onKeyDown);
        document.body.appendChild(backdrop);
        input.focus();
    }

    function init() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
                if (document.body.classList.contains('login-page-body')) return;
                e.preventDefault();
                open();
            }
        });
    }

    return { init, open };
})();

window.AppUI = {
    setButtonLoading: (button, isLoading, loadingText = 'Procesando...') => {
        if (!button) return;
        if (isLoading) {
            button.dataset.originalText = button.innerHTML;
            button.disabled = true;
            button.style.opacity = '0.75';
            button.innerHTML = `
                <svg style="animation: spin 0.8s linear infinite; width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
                </svg>
                <span>${loadingText}</span>
            `;
        } else {
            button.disabled = false;
            button.style.opacity = '1';
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }
};

// Inicializar Command Palette
document.addEventListener('DOMContentLoaded', () => {
    window.AppCommandPalette.init();
});
