/**
 * ==========================================================================
 * AbogaSys - Lógica del Módulo Usuarios (Listado y Búsqueda)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar permisos
    if (window.AbogaSysPermissions) {
        const hasAccess = await window.AbogaSysPermissions.init('USUARIOS_VIEW');
        if (!hasAccess) return; // Detener ejecución si no tiene permiso
    } else {
        console.error('[AbogaSys] permissions.js no cargado.');
        return;
    }

    const searchInput = document.getElementById('search-user');
    const usersTable = document.getElementById('users-table');
    const toast = document.getElementById('toast-feedback');

    /**
     * Muestra una notificación temporal en pantalla
     * @param {string} message 
     */
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    /**
     * Filtrado en tiempo real en la tabla de usuarios
     */
    if (searchInput && usersTable) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const rows = usersTable.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const nameText = row.querySelector('.user-cell-name')?.textContent.toLowerCase() || '';
                const emailText = row.querySelector('.user-cell-email')?.textContent.toLowerCase() || '';
                const roleText = row.querySelector('.role-badge')?.textContent.toLowerCase() || '';

                if (nameText.includes(query) || emailText.includes(query) || roleText.includes(query)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    const tbody = document.getElementById('usuarios-tbody');

    async function loadUsuarios() {
        try {
            const res = await fetch('/api/usuarios', {
                credentials: 'include'
            });
            
            if (res.status === 401) {
                window.location.href = '/index.html';
                return;
            }
            if (res.status === 403) {
                showToast('Acceso denegado al cargar usuarios.');
                return;
            }
            if (!res.ok) throw new Error('Error al obtener usuarios');
            
            const data = await res.json();
            renderUsuarios(data);
        } catch (error) {
            console.error(error);
            showToast('Error de conexión al cargar los usuarios.');
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error al cargar datos.</td></tr>';
        }
    }

    function renderUsuarios(usuarios) {
        if (!tbody) return;
        tbody.innerHTML = '';
        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay usuarios registrados.</td></tr>';
            return;
        }

        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            
            const isActivo = user.Estado === true || user.Estado === 1;
            const statusClass = isActivo ? 'active' : 'inactive';
            const statusText = isActivo ? 'Activo' : 'Inactivo';
            
            const toggleClass = isActivo ? 'deactivate' : 'activate';
            const toggleTitle = isActivo ? 'Desactivar usuario' : 'Activar usuario';
            const toggleIcon = isActivo 
                ? '<circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>'
                : '<polyline points="20 6 9 17 4 12"></polyline>';

            let roleClass = 'asistente';
            if (user.NombreRol.toLowerCase() === 'administrador') roleClass = 'admin';
            if (user.NombreRol.toLowerCase() === 'abogado') roleClass = 'abogado';

            const iniciales = (user.PrimerNombre.charAt(0) + user.PrimerApellido.charAt(0)).toUpperCase();
            const nombreCompleto = `${user.PrimerNombre} ${user.PrimerApellido}`;

            tr.innerHTML = `
                <td>
                    <div class="user-cell">
                        <div class="user-cell-avatar" aria-hidden="true">${iniciales}</div>
                        <div class="user-cell-info">
                            <span class="user-cell-name">${nombreCompleto}</span>
                        </div>
                    </div>
                </td>
                <td><span class="user-cell-email">${user.CorreoAcceso}</span></td>
                <td><span class="role-badge ${roleClass}">${user.NombreRol}</span></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <a href="editar-usuario.html?id=${user.UsuarioID}" class="btn-action edit" title="Ver / Editar usuario" aria-label="Editar ${nombreCompleto}" data-permission="USUARIOS_EDIT">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </a>
                        <button type="button" class="btn-action ${toggleClass} btn-toggle-status" data-id="${user.UsuarioID}" data-email="${user.CorreoAcceso}" data-rol="${user.RolID}" data-estado="${isActivo}" title="${toggleTitle}" aria-label="${toggleTitle}" data-permission="USUARIOS_EDIT">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                ${toggleIcon}
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Aplicar permisos a los elementos recién generados
        if (window.AbogaSysPermissions) {
            window.AbogaSysPermissions.applyPermissions();
        }
    }

    /**
     * Alternar estado Activo / Inactivo de un usuario (Llamada al backend)
     */
    if (usersTable) {
        usersTable.addEventListener('click', async (event) => {
            const toggleBtn = event.target.closest('.btn-toggle-status');
            if (!toggleBtn) return;

            const userId = toggleBtn.getAttribute('data-id');
            const email = toggleBtn.getAttribute('data-email');
            const rolId = toggleBtn.getAttribute('data-rol');
            const isActivo = toggleBtn.getAttribute('data-estado') === 'true';

            try {
                const res = await fetch(`/api/usuarios/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        correoAcceso: email,
                        rolId: parseInt(rolId),
                        estado: !isActivo // Enviamos el estado invertido
                    })
                });

                if (res.status === 401) {
                    window.location.href = '/index.html';
                    return;
                }
                
                const data = await res.json();
                
                if (res.status === 403) {
                    showToast(data.message || 'Acceso denegado.');
                    return;
                }
                
                if (res.ok) {
                    showToast('Estado actualizado.');
                    loadUsuarios(); // Recargar la tabla completa para reflejar los cambios
                } else {
                    showToast(data.message || 'Error al cambiar estado.');
                }
            } catch (error) {
                console.error(error);
                showToast('Error de conexión.');
            }
        });
    }

    // Inicializar
    loadUsuarios();
});
