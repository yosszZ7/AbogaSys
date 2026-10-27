/**
 * Global Permissions Utility
 * Fetches and manages user permissions in memory for UI adaptation.
 */

window.AbogaSysPermissions = (function() {
    let userPermissions = [];
    let userData = null;
    let isInitialized = false;

    async function init(requiredViewPermission = null) {
        if (isInitialized) {
            if (requiredViewPermission) {
                checkViewAccess(requiredViewPermission);
            }
            applyPermissions();
            return true;
        }

        try {
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.status === 401) {
                window.location.href = '/index.html';
                return false;
            }

            if (!response.ok) {
                console.error('[AbogaSys] Error validando la sesión (Status:', response.status, ')');
                if (window.AppToast) {
                    window.AppToast.warning('Problema al validar la sesión activa. Por favor, vuelve a iniciar sesión.', 'Sesión Expirada');
                }
                setTimeout(() => { window.location.href = '/index.html'; }, 1200);
                return false;
            }

            const data = await response.json();
            console.log('[DEBUG] Response JSON:', data);
            
            userPermissions = data.user.permisos || [];
            userData = data.user;
            console.log('[DEBUG] userPermissions:', userPermissions);
            
            isInitialized = true;
            
            updateUserHeader();
            
            console.log('[AbogaSys] Sesión y permisos validados correctamente.');

            if (requiredViewPermission) {
                console.log(`[DEBUG] hasPermission('${requiredViewPermission}'):`, hasPermission(requiredViewPermission));
                const hasAccess = checkViewAccess(requiredViewPermission);
                if (!hasAccess) return false;
            }

            applyPermissions();
            return true;
        } catch (error) {
            console.error('[AbogaSys] Error de red validando la sesión:', error);
            if (window.AppToast) {
                window.AppToast.error('No se pudo conectar con el servidor para validar su sesión.', 'Error de Conexión');
            }
            return false;
        }
    }

    function checkViewAccess(permissionCode) {
        if (!hasPermission(permissionCode)) {
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                // Find the main body or content wrapper, excluding header if possible
                const dashboardBody = mainContent.querySelector('.dashboard-body') || mainContent.querySelector('main');
                if (dashboardBody) {
                    dashboardBody.style.display = 'none';
                }
                
                // Show access denied message
                const deniedMsg = document.createElement('div');
                deniedMsg.className = 'access-denied-message';
                deniedMsg.innerHTML = `
                    <div style="text-align: center; padding: 50px 20px; color: var(--text-color, #333);">
                        <h2>🚫 Acceso Denegado</h2>
                        <p style="margin: 15px 0;">No tienes permiso para acceder a este módulo.</p>
                        <a href="../dashboard.html" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: var(--primary-color, #0056b3); color: white; text-decoration: none; border-radius: 5px;">Volver al Inicio</a>
                    </div>
                `;
                mainContent.appendChild(deniedMsg);
            }
            return false;
        }
        return true;
    }

    function hasPermission(permissionCode) {
        return userPermissions.includes(permissionCode);
    }

    function getUserData() {
        return userData;
    }

    function updateUserHeader() {
        if (!userData) return;
        
        const userNameEl = document.getElementById('header-user-name');
        const userRoleEl = document.getElementById('header-user-role');
        const userAvatarEl = document.getElementById('header-user-avatar');

        if (userNameEl && userData.nombre) {
            userNameEl.textContent = userData.nombre;
        }

        if (userRoleEl && userData.rol) {
            userRoleEl.textContent = userData.rol;
        }

        if (userAvatarEl && userData.nombre) {
            const parts = userData.nombre.trim().split(' ');
            let initials = parts[0].charAt(0).toUpperCase();
            if (parts.length > 1) {
                initials += parts[parts.length - 1].charAt(0).toUpperCase();
            } else if (parts[0].length > 1) {
                initials += parts[0].charAt(1).toUpperCase();
            }
            userAvatarEl.textContent = initials;
        }
    }

    function applyPermissions() {
        const elements = document.querySelectorAll('[data-permission]');
        elements.forEach(el => {
            const requiredPerm = el.getAttribute('data-permission');
            if (requiredPerm && !hasPermission(requiredPerm)) {
                el.style.display = 'none';
            } else {
                if (el.style.display === 'none') {
                    el.style.display = ''; 
                }
            }
        });
    }

    return {
        init,
        hasPermission,
        applyPermissions,
        getUserData,
        updateUserHeader
    };
})();
