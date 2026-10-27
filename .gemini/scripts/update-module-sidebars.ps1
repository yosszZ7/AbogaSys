
# ============================================================
# AbogaSys - Script de actualización masiva de sidebars
# Reemplaza el bloque <aside> en todas las páginas de módulos
# ============================================================

$pages = @(
    "frontend/pages/usuarios/usuarios.html",
    "frontend/pages/usuarios/registrar-usuario.html",
    "frontend/pages/usuarios/editar-usuario.html",
    "frontend/pages/empleados/empleados.html",
    "frontend/pages/empleados/registrar-empleado.html",
    "frontend/pages/empleados/editar-empleado.html",
    "frontend/pages/clientes/clientes.html",
    "frontend/pages/clientes/registrar-cliente.html",
    "frontend/pages/clientes/editar-cliente.html",
    "frontend/pages/expedientes/expedientes.html",
    "frontend/pages/expedientes/registrar-expediente.html",
    "frontend/pages/expedientes/editar-expediente.html",
    "frontend/pages/agenda/agenda.html",
    "frontend/pages/documentos/documentos.html"
)

# Determinar prefijo de ruta según la profundidad del archivo
function Get-Prefix($filePath) {
    $parts = $filePath -split "/"
    $depth = $parts.Length - 1  # cantidad de carpetas
    # Contar cuántos niveles hay desde pages/
    $pagesIndex = $parts.IndexOf("pages")
    $levelsFromPages = $parts.Length - $pagesIndex - 2  # -1 archivo, -1 pages mismo
    if ($levelsFromPages -eq 1) { return "../" }  # dentro de pages/modulo/
    if ($levelsFromPages -eq 0) { return "./" }   # pages/
    return "../../"
}

# Función para determinar el módulo activo según el archivo
function Get-ActiveModule($filePath) {
    if ($filePath -match "usuarios") { return "usuarios" }
    if ($filePath -match "empleados") { return "empleados" }
    if ($filePath -match "clientes") { return "clientes" }
    if ($filePath -match "expedientes") { return "expedientes" }
    if ($filePath -match "agenda") { return "agenda" }
    if ($filePath -match "documentos") { return "documentos" }
    return "dashboard"
}

foreach ($page in $pages) {
    if (-not (Test-Path $page)) {
        Write-Host "SKIP (no existe): $page" -ForegroundColor Yellow
        continue
    }

    $content = Get-Content $page -Raw -Encoding UTF8
    $module = Get-ActiveModule($page)
    $prefix = "../"  # Para páginas en pages/modulo/

    # 1. Agregar ui-core.css si no está
    if ($content -notmatch "ui-core.css") {
        $content = $content -replace '(<link rel="stylesheet" href="[^"]*dashboard\.css">)', "$1`n    <link rel=""stylesheet"" href=""${prefix}../css/ui-core.css"">"
    }

    # 2. Agregar ui-core.js antes de </body> si no está
    if ($content -notmatch "ui-core.js") {
        $content = $content -replace '(<script src="[^"]*permissions\.js"></script>)', "    <script src=""${prefix}../js/ui-core.js""></script>`n    `$1"
    }

    # 3. Corregir body class si no tiene dashboard-body-root
    if ($content -notmatch "dashboard-body-root") {
        $content = $content -replace '<body>', '<body class="dashboard-body-root">'
    }

    [System.IO.File]::WriteAllText((Resolve-Path $page).Path, $content, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "OK: $page [$module]" -ForegroundColor Green
}

Write-Host "`nActualizacion completada." -ForegroundColor Cyan
