"""
AbogaSys - Reemplaza el bloque <aside> completo en todas las páginas de módulos
con el sidebar nuevo: íconos con width/height fijos, etiquetas de sección, atributos RBAC data-permission y estilo unificado.
"""
import os
import re

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "pages"))

def sidebar_for_module(active, prefix):
    """Genera el bloque <aside> con el módulo correcto marcado como active y sus atributos RBAC data-permission."""
    modules = [
        ("dashboard",    f"{prefix}dashboard.html",                "Panel de Control",    None,               "rect"),
        ("expedientes",  f"{prefix}expedientes/expedientes.html",  "Expedientes",         "EXPEDIENTES_VIEW", "folder"),
        ("clientes",     f"{prefix}clientes/clientes.html",        "Clientes",            "CLIENTES_VIEW",    "users"),
        ("agenda",       f"{prefix}agenda/agenda.html",            "Agenda y Términos",   "AGENDA_VIEW",      "calendar"),
        ("documentos",   f"{prefix}documentos/documentos.html",    "Bóveda Documental",   "DOCUMENTOS_VIEW",  "file"),
        ("empleados",    f"{prefix}empleados/empleados.html",      "Personal",            "EMPLEADOS_VIEW",   "id-card"),
        ("usuarios",     f"{prefix}usuarios/usuarios.html",        "Usuarios y Permisos", "USUARIOS_VIEW",    "users2"),
    ]

    ICONS = {
        "rect": """<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>""",
        "folder": """<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>""",
        "users": """<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>""",
        "calendar": """<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>""",
        "file": """<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>""",
        "id-card": """<rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="10" r="2"></circle><line x1="15" y1="8" x2="17" y2="8"></line><line x1="15" y1="12" x2="17" y2="12"></line><line x1="7" y1="16" x2="17" y2="16"></line>""",
        "users2": """<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>""",
    }

    SECTION_LABELS = {
        "dashboard": "Principal",
        "expedientes": "Gestión Legal",
    }

    nav_items = ""
    current_section = None

    for mod_id, url, label, perm, icon_key in modules:
        section = SECTION_LABELS.get(mod_id)
        if section and section != current_section:
            nav_items += f'\n                <div class="nav-section-label">{section}</div>\n'
            current_section = section
        elif mod_id == "empleados":
            nav_items += '\n                <div class="nav-section-label">Administración</div>\n'

        active_attr = ' aria-current="page"' if mod_id == active else ""
        active_class = " active" if mod_id == active else ""
        perm_attr = f' data-permission="{perm}"' if perm else ""
        icon_svg = ICONS.get(icon_key, "")

        nav_items += f"""
                <a href="{url}" class="nav-item{active_class}"{active_attr}{perm_attr}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{icon_svg}</svg>
                    <span>{label}</span>
                </a>"""

    return f"""        <!-- Menú Lateral Izquierdo (Sidebar) -->
        <aside id="sidebar" class="sidebar" aria-label="Menú principal de navegación">
            <div class="sidebar-header">
                <a href="{prefix}dashboard.html" class="sidebar-brand">
                    <div class="sidebar-logo" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="3" x2="12" y2="21"></line>
                            <line x1="4" y1="7" x2="20" y2="7"></line>
                            <polyline points="4 7 1 14 7 14 4 7"></polyline>
                            <polyline points="20 7 17 14 23 14 20 7"></polyline>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                        </svg>
                    </div>
                    <div class="sidebar-brand-text">
                        <span class="brand-title">Aboga<span>Sys</span></span>
                        <span class="brand-sub">LegalTech OS</span>
                    </div>
                </a>
            </div>

            <nav class="sidebar-nav">{nav_items}
            </nav>

            <div class="sidebar-footer">
                <a href="javascript:void(0)" class="nav-item-logout" id="logout-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Cerrar sesión</span>
                </a>
            </div>
        </aside>"""


def process_file(filepath, active_module, prefix):
    with open(filepath, "r", encoding="utf-8-sig") as f:
        content = f.read()

    # Reemplazar el bloque <aside ...> ... </aside>
    new_aside = sidebar_for_module(active_module, prefix)
    content = re.sub(
        r'(?:<!--[^>]*[Mm]enú[^>]*-->\s*\n\s*)?<aside id="sidebar"[^>]*>.*?</aside>',
        new_aside,
        content,
        flags=re.DOTALL
    )

    # Asegurarnos de que el body tiene la clase correcta
    content = re.sub(r'<body>', '<body class="dashboard-body-root">', content)
    content = re.sub(r'<body class="[^"]*">', '<body class="dashboard-body-root">', content)

    # Corregir referencia obsoleta a main.js si existe y alinear indentación de ui-core.js
    content = content.replace('<script src="../../js/main.js"></script>', '<script src="../../js/dashboard.js"></script>')
    content = content.replace('        <script src="../../js/ui-core.js"></script>', '    <script src="../../js/ui-core.js"></script>')

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  OK: {filepath}")


# Mapeo de archivos a módulo activo y prefijo de rutas
files_map = [
    # usuarios
    (r"pages\usuarios\usuarios.html",           "usuarios",    "../"),
    (r"pages\usuarios\registrar-usuario.html",  "usuarios",    "../"),
    (r"pages\usuarios\editar-usuario.html",     "usuarios",    "../"),
    # empleados
    (r"pages\empleados\empleados.html",         "empleados",   "../"),
    (r"pages\empleados\registrar-empleado.html","empleados",   "../"),
    (r"pages\empleados\editar-empleado.html",   "empleados",   "../"),
    # clientes
    (r"pages\clientes\clientes.html",           "clientes",    "../"),
    (r"pages\clientes\registrar-cliente.html",  "clientes",    "../"),
    (r"pages\clientes\editar-cliente.html",     "clientes",    "../"),
    # expedientes
    (r"pages\expedientes\expedientes.html",     "expedientes", "../"),
    (r"pages\expedientes\registrar-expediente.html","expedientes","../"),
    (r"pages\expedientes\editar-expediente.html","expedientes","../"),
    # agenda
    (r"pages\agenda\agenda.html",               "agenda",      "../"),
    # documentos
    (r"pages\documentos\documentos.html",       "documentos",  "../"),
]

if __name__ == "__main__":
    print("Actualizando sidebars de todos los módulos...")
    for rel_path, module, prefix in files_map:
        full_path = os.path.normpath(os.path.join(BASE, rel_path.replace("pages\\", "")))
        if os.path.exists(full_path):
            process_file(full_path, module, prefix)
        else:
            print(f"  SKIP (no existe): {full_path}")

    print("\nListo. Todos los sidebars actualizados.")
