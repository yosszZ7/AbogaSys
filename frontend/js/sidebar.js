/**
 * AbogaSys - Sidebar & Logout Shared Module
 * Handles sidebar toggle (mobile), active state, notifications, search trigger, and logout.
 * Loaded in every module page after ui-core.js and permissions.js.
 */
(function () {
    document.addEventListener('DOMContentLoaded', () => {
        // ── Sidebar Toggle (Mobile) ─────────────────────────────────────────
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleBtn = document.getElementById('sidebar-toggle-btn');

        function openSidebar() {
            if (!sidebar) return;
            sidebar.classList.add('open');
            if (overlay) overlay.classList.add('active');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }

        function closeSidebar() {
            if (!sidebar) return;
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isOpen = sidebar && sidebar.classList.contains('open');
                isOpen ? closeSidebar() : openSidebar();
            });
        }

        if (overlay) {
            overlay.addEventListener('click', closeSidebar);
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        });

        // Close on desktop resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992 && sidebar && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        });

        // ── Logout Handler ──────────────────────────────────────────────────
        const logoutBtn = document.getElementById('logout-btn') || document.querySelector('.nav-item-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();

                const confirmed = window.AppDialog
                    ? await window.AppDialog.confirm({
                        title: '¿Cerrar sesión de trabajo?',
                        message: 'Tu sesión se cerrará de manera segura y se protegerá la información confidencial de los expedientes.',
                        confirmText: 'Cerrar Sesión',
                        cancelText: 'Continuar Trabajando',
                        type: 'primary'
                    })
                    : confirm('¿Estás seguro que deseas cerrar sesión?');

                if (!confirmed) return;

                try {
                    const response = await fetch('/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    if (response.ok && window.AppToast) {
                        window.AppToast.info('Sesión cerrada correctamente. Hasta pronto.', 'Desconexión Segura');
                    }
                } catch (_) { /* ignore network errors */ }

                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 350);
            });
        }

        // ── Command Palette Trigger (Header Search Button) ──────────────────
        const searchBtn = document.getElementById('header-search-btn') || document.getElementById('btn-quick-search');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                if (window.AppCommandPalette) window.AppCommandPalette.open();
            });
        }

        // ── Notifications Button ────────────────────────────────────────────
        const btnNotifications = document.getElementById('btn-notifications');
        if (btnNotifications) {
            btnNotifications.addEventListener('click', () => {
                if (window.AppToast) {
                    window.AppToast.info(
                        'Bandeja de notificaciones al día. No se registran plazos fatales vencidos en tus expedientes.',
                        'Notificaciones Procesales'
                    );
                }
            });
        }
    });
})();
