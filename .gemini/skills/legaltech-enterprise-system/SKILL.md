---
name: legaltech-enterprise-system
description: Directrices maestras de diseño y arquitectura para sistemas web de gestión jurídica profesional (LegalTech), garantizando estándares comerciales de software vendible a bufetes de abogados.
---

# AbogaSys — Estándares Maestros de Diseño LegalTech Profesional

Este documento establece las especificaciones de diseño de interfaz (UI), experiencia de usuario (UX) y arquitectura de componentes para convertir **AbogaSys** en un producto comercial de alto valor para despachos de abogados, eliminando cualquier aspecto de prototipo, plantilla genérica o aplicación creada por IA.

---

## 1. Filosofía de Producto LegalTech Comercial

Los abogados y firmas jurídicas manejan información crítica, plazos procesales fatales y secretos profesionales. Un software que compite con herramientas líderes en el mercado (como Clio, Aranzadi, Smokeball o vLex) debe transmitir:

1. **Autoridad y Sobriedad:** Estética corporativa de alta gama. Cero colores chillones, animaciones innecesarias o interfaces infantiles.
2. **Densidad de Información Óptima:** Los abogados leen expedientes con docenas de datos. Los espacios en blanco desmedidos son contraproducentes. Las tablas deben ser compactas, legibles y con números tabulares.
3. **Cero Tolerancia a Vencimientos (Semáforo Procesal):** El mayor temor de un jurista es el vencimiento de un término o plazo judicial. Los plazos fatales deben tener alerta visual prioritaria (Verde: en tiempo; Ámbar: vence en <72h; Rojo: vence hoy o vencido).
4. **Respeto a la Terminología Jurídica Real:**
   - No usar términos genéricos como "Tareas" cuando se trata de "Diligencias Procesales" o "Actuaciones".
   - Utilizar conceptos correctos: *Expediente, Juzgado / Tribunal, Cuaderno Principal, Partes Procesales (Demandante / Demandado), Etapa Procesal, Auto / Providencia, Plazo Fatal*.
5. **Cero `alert()` o `confirm()` del navegador:**
   - Todo diálogo de confirmación, alerta o error debe gestionarse mediante modales y componentes `Toast` estilizados integrados en la aplicación.

---

## 2. Sistema de Diseño (Design System Tokens)

### 2.1 Paleta Cromática Institucional
* **Primario Profundo (Deep Navy):** `#0a0f1d` / `#0f172a` — Solidez, rigor legal, fondo de barras laterales y encabezados de autoridad.
* **Superficie y Tarjetas:** `#ffffff` (modo claro) / `#f8fafc` (fondos de página de bajo brillo) / bordes `#e2e8f0`.
* **Acento Legal (Bronce / Oro Imperial):** `#c5a059` / `#b38e44` — Refuerzo de marca, balanza de la justicia, selectores activos y botones de alta jerarquía.
* **Estados Procesales Semánticos:**
  * *Éxito / Favorable / En Plazo:* `#059669` (Esmeralda oscuro) con fondo `#ecfdf5`.
  * *Advertencia / Por Vencer / Trámite:* `#d97706` (Ámbar) con fondo `#fffbeb`.
  * *Crítico / Fatal / Vencido / Desfavorable:* `#dc2626` (Rojo carmesí) con fondo `#fef2f2`.
  * *Informativo / En Estudio:* `#2563eb` (Azul corporativo) con fondo `#eff6ff`.

### 2.2 Tipografía
* Pila del sistema: `'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
* Uso de fuentes monoespaciadas/tabulares para folios, números de cédula/RUC y montos: `font-variant-numeric: tabular-nums`.

---

## 3. Componentes Obligatorios de Grado Corporativo

### 3.1 Data Grids & Tablas Avanzadas
1. **Filtros rápidos por pestañas:** (Ejemplo: *Todos*, *Activos*, *Urgentes*, *Por Vencer*).
2. **Búsqueda en tiempo real:** Campo de búsqueda reactiva por expediente, cliente, juzgado o materia.
3. **Estados Vacíos (*Empty States*) Profesionales:** Cuando no hay datos, nunca mostrar una tabla vacía sin más; mostrar ilustración SVG sobria, mensaje de contexto y botón de acción principal (ej. `+ Crear primer expediente`).
4. **Acciones por Fila Claras:** Menú desplegable o botones discretos de acción rápida (*Ver Detalle*, *Editar*, *Descargar Carátula*).

### 3.2 Diálogos y Notificaciones (Sin librerías externas pesadas)
* Componente `AppToast.show(message, type, duration)` para notificaciones flotantes elegantes en la esquina superior derecha.
* Componente `AppDialog.confirm({ title, message, confirmText, type })` que devuelve una Promesa (`Promise<boolean>`) para confirmaciones destructivas o críticas con respaldo visual.

### 3.3 Barra Superior (Top Navigation)
* Buscador global con acceso directo rápido (`Ctrl + K`).
* Menú de usuario con Avatar de iniciales, Rol en badge de alto contraste, y menú desplegable (*Mi Perfil*, *Configuración del Despacho*, *Cerrar Sesión*).
* Botones de acción rápida global: `+ Nuevo Expediente`, `+ Agendar Diligencia`.

---

## 4. Control de Calidad y Ergonomía
* Cualquier formulario debe tener validación visual en vivo al desenfocar (`blur`), máscaras de entrada (para números de caso o teléfonos) y botones con estado de carga interactivo (*Spinner* + texto deshabilitado mientras se procesa la petición HTTP).
* No permitir links ciegos tipo `href="#"` sin comportamiento real o indicador de funcionalidad en desarrollo.
