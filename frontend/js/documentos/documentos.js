/**
 * ==========================================================================
 * AbogaSys - Lógica del Módulo Documentos
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar permisos
    if (window.AbogaSysPermissions) {
        const hasAccess = await window.AbogaSysPermissions.init('DOCUMENTOS_VIEW');
        if (!hasAccess) return;
    } else {
        console.error('[AbogaSys] permissions.js no cargado.');
        return;
    }

    let expedientesMap = {};
    let documents = [];

    // --------------------------------------------------------------------------
    // Referencias del DOM
    // --------------------------------------------------------------------------
    const searchInput = document.getElementById('search-document');
    const filterType = document.getElementById('filter-type');
    const filterExpediente = document.getElementById('filter-expediente');
    const tableBody = document.getElementById('documents-table-body');

    const btnOpenRegisterModal = document.getElementById('btn-open-register-modal');
    const modalRegister = document.getElementById('modal-register-document');
    const btnCloseRegisterModal = document.getElementById('btn-close-register-modal');
    const btnCancelRegisterModal = document.getElementById('btn-cancel-register-modal');
    const formRegister = document.getElementById('form-register-document');
    const regDocName = document.getElementById('reg-doc-name');
    const regDocType = document.getElementById('reg-doc-type');
    const regDocDate = document.getElementById('reg-doc-date');
    const regDocExpediente = document.getElementById('reg-doc-expediente');
    const regClientName = document.getElementById('reg-client-name');
    const regDocDesc = document.getElementById('reg-doc-desc');

    const regDropzone = document.getElementById('reg-dropzone');
    const regFileInput = document.getElementById('reg-file-input');
    const regSelectedFileCard = document.getElementById('reg-selected-file-card');
    const regSelectedFileName = document.getElementById('reg-selected-file-name');
    const regSelectedFileSize = document.getElementById('reg-selected-file-size');
    const regFileIconBox = document.getElementById('reg-file-icon-box');
    const btnRegRemoveFile = document.getElementById('btn-reg-remove-file');
    const regFileError = document.getElementById('reg-file-error');

    const modalView = document.getElementById('modal-view-document');
    const btnCloseViewModal = document.getElementById('btn-close-view-modal');
    const btnCloseViewModalFooter = document.getElementById('btn-close-view-modal-footer');

    const modalEdit = document.getElementById('modal-edit-document');
    const btnCloseEditModal = document.getElementById('btn-close-edit-modal');
    const btnCancelEditModal = document.getElementById('btn-cancel-edit-modal');
    const formEdit = document.getElementById('form-edit-document');
    const editDocId = document.getElementById('edit-doc-id');
    const editDocName = document.getElementById('edit-doc-name');
    const editDocType = document.getElementById('edit-doc-type');
    const editDocDate = document.getElementById('edit-doc-date');
    const editDocExpediente = document.getElementById('edit-doc-expediente');
    const editClientName = document.getElementById('edit-client-name');
    const editDocDesc = document.getElementById('edit-doc-desc');
    const editFileName = document.getElementById('edit-file-name');
    const editFileIconBox = document.getElementById('edit-file-icon-box');

    const toast = document.getElementById('toast-feedback');
    const toastMessage = document.getElementById('toast-message');
    let toastTimeout = null;

    let regSelectedFile = null;
    const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    // --------------------------------------------------------------------------
    // Utilidades
    // --------------------------------------------------------------------------
    function showToast(message, type = 'info') {
        if (!toast || !toastMessage) return;
        if (toastTimeout) clearTimeout(toastTimeout);
        toastMessage.textContent = message;
        toast.className = `toast-feedback ${type}`;
        toast.style.display = 'flex';
        toastTimeout = setTimeout(() => {
            toast.style.display = 'none';
        }, 3800);
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function getTypeBadgeClass(tipo) {
        switch (tipo) {
            case 'Demanda': return 'demanda';
            case 'Contestación': return 'contestacion';
            case 'Sentencia / Resolución': return 'sentencia';
            case 'Contrato': return 'contrato';
            case 'Poder': return 'poder';
            case 'Escrito': return 'escrito';
            case 'Documento probatorio': return 'probatorio';
            case 'Identificación': return 'identificacion';
            default: return 'otro';
        }
    }

    function getFileIconSvg(ext) {
        if (ext === 'pdf') {
            return `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
            `;
        }
        return `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
        `;
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --------------------------------------------------------------------------
    // Carga de Catálogos (TiposDocumento y Expedientes)
    // --------------------------------------------------------------------------
    async function loadCatalogs() {
        try {
            const [resTipos, resExpedientes] = await Promise.all([
                fetch('/api/tipos-documento', { credentials: 'include' }),
                fetch('/api/expedientes', { credentials: 'include' })
            ]);

            if (resTipos.status === 401 || resExpedientes.status === 401) { window.location.href = '/index.html'; return; }
            if (resTipos.status === 403 || resExpedientes.status === 403) { console.warn('Acceso denegado a catálogos'); return; }

            if (resTipos.ok) {
                const tipos = await resTipos.json();
                tipos.forEach(t => {
                    const optionF = new Option(t.NombreTipo, t.TipoDocumentoID);
                    const optionR = new Option(t.NombreTipo, t.TipoDocumentoID);
                    const optionE = new Option(t.NombreTipo, t.TipoDocumentoID);
                    if (filterType) filterType.add(optionF);
                    if (regDocType) regDocType.add(optionR);
                    if (editDocType) editDocType.add(optionE);
                });
            }

            if (resExpedientes.ok) {
                const expedientes = await resExpedientes.json();
                expedientesMap = {};
                expedientes.forEach(e => {
                    const id = e.ExpedienteID;
                    const numero = e.NumeroExpediente;
                    
                    let nombreCliente = 'Sin cliente';
                    if (e.ClienteN_Nombre) {
                        nombreCliente = e.ClienteN_Nombre + ' ' + (e.ClienteN_Apellido || '');
                    } else if (e.ClienteJ_RazonSocial) {
                        nombreCliente = e.ClienteJ_RazonSocial;
                    }
                    
                    e.id = id; 
                    e.numeroExpediente = numero;
                    e.cliente = nombreCliente.trim();
                    e.materia = e.NombreMateria || '';

                    expedientesMap[id] = e;
                    
                    const text = `${numero} - ${e.cliente || 'Sin cliente'}`;
                    const optionF = new Option(text, id);
                    const optionR = new Option(text, id);
                    const optionE = new Option(text, id);
                    if (filterExpediente) filterExpediente.add(optionF);
                    if (regDocExpediente) regDocExpediente.add(optionR);
                    if (editDocExpediente) editDocExpediente.add(optionE);
                });
            }
        } catch (error) {
            console.error('Error al cargar catálogos:', error);
            showToast('Error de conexión al cargar catálogos.', 'error');
        }
    }

    // --------------------------------------------------------------------------
    // Renderizado y Fetch de la Tabla
    // --------------------------------------------------------------------------
    async function fetchDocumentos() {
        try {
            let url = '/api/documentos?';
            if (searchInput && searchInput.value) url += `query=${encodeURIComponent(searchInput.value)}&`;
            if (filterType && filterType.value !== 'todos') url += `tipo=${filterType.value}&`;
            if (filterExpediente && filterExpediente.value !== 'todos') url += `expediente=${filterExpediente.value}&`;

            const response = await fetch(url, { credentials: 'include' });
            if (response.status === 401) { window.location.href = '/index.html'; return; }
            if (response.status === 403) {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger-color);">Acceso denegado a documentos.</td></tr>';
                return;
            }
            if (response.ok) {
                documents = await response.json();
                renderTable();
            } else {
                throw new Error('Error al obtener documentos');
            }
        } catch (error) {
            console.error(error);
            tableBody.innerHTML = '<tr><td colspan="7">Error al cargar los documentos.</td></tr>';
        }
    }

    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (documents.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-table-state">
                            <div class="empty-table-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <div class="empty-table-title">No se encontraron documentos</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        documents.forEach(doc => {
            const tr = document.createElement('tr');
            const typeBadgeClass = getTypeBadgeClass(doc.tipo);
            const isPdf = doc.extension === 'pdf';
            const iconBoxClass = isPdf ? 'pdf' : 'word';

            tr.innerHTML = `
                <td>
                    <div class="doc-cell">
                        <div class="doc-icon-box ${iconBoxClass}" aria-hidden="true">
                            ${getFileIconSvg(doc.extension)}
                        </div>
                        <div class="doc-info">
                            <span class="doc-name">${escapeHtml(doc.nombre)}</span>
                        </div>
                    </div>
                </td>
                <td><span class="doc-type-badge ${typeBadgeClass}">${escapeHtml(doc.tipo)}</span></td>
                <td><span class="expediente-badge">${escapeHtml(doc.expediente)}</span></td>
                <td><strong style="color: var(--primary, #0f172a); font-size: 0.875rem;">${escapeHtml(doc.cliente || 'Sin cliente')}</strong></td>
                <td><span style="font-weight: 500; font-size: 0.85rem; color: #475569;">${escapeHtml(doc.fechaDocRaw || '-')}</span></td>
                <td><span style="font-size: 0.85rem; color: var(--text-muted, #64748b);">${escapeHtml(doc.registradoPor)}</span></td>
                <td style="text-align: right;">
                    <div class="action-buttons" style="justify-content: flex-end;">
                        <button type="button" class="btn-action view btn-view-doc" data-id="${doc.id}" title="Consultar documento">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        ${isPdf && window.AbogaSysPermissions && window.AbogaSysPermissions.hasPermission('EXPEDIENTES_VIEW') ? `
                        <button type="button" class="btn-action ia btn-ia-doc" data-id="${doc.id}" title="Analizar con IA" style="color: #4f46e5;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                        </button>
                        ` : ''}
                        <button type="button" class="btn-action edit btn-edit-doc" data-id="${doc.id}" title="Editar información" data-permission="DOCUMENTOS_EDIT">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button type="button" class="btn-action download btn-download-doc-action" data-id="${doc.id}" title="Descargar documento">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        tableBody.querySelectorAll('.btn-view-doc').forEach(btn => {
            btn.addEventListener('click', () => openViewModal(btn.dataset.id));
        });
        tableBody.querySelectorAll('.btn-ia-doc').forEach(btn => {
            btn.addEventListener('click', () => openIaModal(btn.dataset.id));
        });
        tableBody.querySelectorAll('.btn-edit-doc').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });
        tableBody.querySelectorAll('.btn-download-doc-action').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = `/api/documentos/${btn.dataset.id}/descarga`;
            });
        });

        if (window.AbogaSysPermissions) {
            window.AbogaSysPermissions.applyPermissions();
        }
    }

    if (searchInput) searchInput.addEventListener('input', fetchDocumentos);
    if (filterType) filterType.addEventListener('change', fetchDocumentos);
    if (filterExpediente) filterExpediente.addEventListener('change', fetchDocumentos);

    // --------------------------------------------------------------------------
    // Sincronización Expediente -> Cliente en Modales
    // --------------------------------------------------------------------------
    if (regDocExpediente && regClientName) {
        regDocExpediente.addEventListener('change', () => {
            const val = regDocExpediente.value;
            if (val && expedientesMap[val]) {
                regClientName.textContent = expedientesMap[val].cliente || 'Sin cliente';
            } else {
                regClientName.textContent = 'Seleccione un expediente para vincular';
            }
        });
    }

    if (editDocExpediente && editClientName) {
        editDocExpediente.addEventListener('change', () => {
            const val = editDocExpediente.value;
            if (val && expedientesMap[val]) {
                editClientName.textContent = expedientesMap[val].cliente || 'Sin cliente';
            } else {
                editClientName.textContent = 'Expediente no válido';
            }
        });
    }

    // --------------------------------------------------------------------------
    // Zona de Carga de Archivo (Dropzone)
    // --------------------------------------------------------------------------
    function validateAndProcessFile(file) {
        if (!file) return false;

        const allowedExtensions = ['pdf', 'doc', 'docx'];
        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(fileExt)) {
            setFileError('Formato no permitido. Solo se aceptan archivos .pdf, .doc y .docx.');
            clearSelectedFile();
            return false;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setFileError(`El archivo supera el tamaño máximo de 10 MB.`);
            clearSelectedFile();
            return false;
        }

        clearFileError();
        regSelectedFile = file;

        if (regSelectedFileName) regSelectedFileName.textContent = fileName;
        if (regSelectedFileSize) regSelectedFileSize.textContent = formatBytes(file.size);
        if (regFileIconBox) {
            regFileIconBox.className = `selected-file-icon ${fileExt === 'pdf' ? 'pdf' : 'word'}`;
            regFileIconBox.innerHTML = getFileIconSvg(fileExt);
        }

        if (regSelectedFileCard) regSelectedFileCard.style.display = 'flex';
        return true;
    }

    function clearSelectedFile() {
        regSelectedFile = null;
        if (regFileInput) regFileInput.value = '';
        if (regSelectedFileCard) regSelectedFileCard.style.display = 'none';
    }

    function setFileError(msg) {
        if (regFileError) {
            regFileError.textContent = msg;
            regFileError.style.display = 'block';
        }
    }

    function clearFileError() {
        if (regFileError) {
            regFileError.textContent = '';
            regFileError.style.display = 'none';
        }
    }

    if (regDropzone && regFileInput) {
        regDropzone.addEventListener('click', (e) => {
            if (e.target !== regFileInput) regFileInput.click();
        });
        regFileInput.addEventListener('change', () => {
            if (regFileInput.files && regFileInput.files[0]) validateAndProcessFile(regFileInput.files[0]);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            regDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                regDropzone.classList.add('dragover');
            });
        });
        ['dragleave', 'drop'].forEach(eventName => {
            regDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                regDropzone.classList.remove('dragover');
            });
        });
        regDropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files[0]) validateAndProcessFile(dt.files[0]);
        });
    }

    if (btnRegRemoveFile) {
        btnRegRemoveFile.addEventListener('click', (e) => {
            e.stopPropagation();
            clearSelectedFile();
            clearFileError();
        });
    }

    // --------------------------------------------------------------------------
    // Control de Modales
    // --------------------------------------------------------------------------
    function openModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (btnOpenRegisterModal && modalRegister) {
        btnOpenRegisterModal.addEventListener('click', () => {
            if (formRegister) formRegister.reset();
            clearSelectedFile();
            clearFileError();
            if (regClientName) regClientName.textContent = 'Seleccione un expediente para vincular';
            openModal(modalRegister);
        });
    }

    [btnCloseRegisterModal, btnCancelRegisterModal].forEach(btn => {
        if (btn) btn.addEventListener('click', () => closeModal(modalRegister));
    });
    [btnCloseViewModal, document.getElementById('btn-close-view-modal-footer')].forEach(btn => {
        if (btn) btn.addEventListener('click', () => closeModal(modalView));
    });
    [btnCloseEditModal, btnCancelEditModal].forEach(btn => {
        if (btn) btn.addEventListener('click', () => closeModal(modalEdit));
    });

    // --------------------------------------------------------------------------
    // Registrar Documento (POST con FormData)
    // --------------------------------------------------------------------------
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!regSelectedFile) {
                setFileError('Debe adjuntar un archivo obligatorio (.pdf, .doc, .docx hasta 10 MB).');
                return;
            }
            if (!regDocDate.value) {
                showToast('Debe ingresar la fecha del documento.', 'error');
                return;
            }

            const expedienteVal = regDocExpediente.value;
            if (!expedienteVal || isNaN(parseInt(expedienteVal))) {
                showToast('Debe seleccionar un expediente judicial válido.', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('nombre', regDocName.value.trim());
            formData.append('tipoDocumentoId', regDocType.value);
            formData.append('fechaDoc', regDocDate.value);
            formData.append('expedienteId', expedienteVal);
            formData.append('descripcion', regDocDesc.value.trim());
            formData.append('archivo', regSelectedFile);

            try {
                const response = await fetch('/api/documentos', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
                
                if (response.status === 401) { window.location.href = '/index.html'; return; }
                if (response.status === 403) { showToast('Acceso denegado para esta acción.', 'error'); return; }

                if (response.ok) {
                    showToast('Documento registrado exitosamente.', 'success');
                    closeModal(modalRegister);
                    fetchDocumentos();
                } else {
                    const data = await response.json();
                    showToast(data.message || 'Error al registrar documento.', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('Error de conexión al registrar el documento.', 'error');
            }
        });
    }

    // --------------------------------------------------------------------------
    // Consultar Documento
    // --------------------------------------------------------------------------
    async function openViewModal(id) {
        try {
            const response = await fetch(`/api/documentos/${id}`, { credentials: 'include' });
            if (!response.ok) throw new Error('Error al obtener datos');
            const doc = await response.json();

            document.getElementById('view-doc-name').textContent = doc.nombre;
            const typeEl = document.getElementById('view-doc-type');
            typeEl.textContent = doc.tipoDocumentoId; 
            // Buscamos nombre de tipo en select options para mostrarlo bonito
            const typeOpt = Array.from(filterType.options).find(o => o.value == doc.tipoDocumentoId);
            const tipoNombre = typeOpt ? typeOpt.text : doc.tipoDocumentoId;
            typeEl.textContent = tipoNombre;
            typeEl.className = `doc-type-badge ${getTypeBadgeClass(tipoNombre)}`;

            document.getElementById('view-doc-expediente').textContent = doc.expediente;
            document.getElementById('view-doc-client').textContent = doc.cliente || 'Sin cliente';
            document.getElementById('view-doc-date').textContent = doc.fechaDoc;
            document.getElementById('view-doc-created-at').textContent = doc.fechaRegistro;
            document.getElementById('view-doc-author').textContent = doc.registradoPor;
            document.getElementById('view-doc-desc').textContent = doc.descripcion || 'Sin descripción registrada.';
            
            document.getElementById('view-file-name').textContent = doc.archivoNombre;
            document.getElementById('view-file-size').textContent = formatBytes(parseInt(doc.archivoTamano));

            const isPdf = doc.extension === 'pdf';
            const iconBox = document.getElementById('view-file-icon-box');
            iconBox.className = `selected-file-icon ${isPdf ? 'pdf' : 'word'}`;
            iconBox.innerHTML = getFileIconSvg(doc.extension);

            const btnDownload = document.getElementById('btn-view-modal-download');
            btnDownload.onclick = () => {
                window.location.href = `/api/documentos/${id}/descarga`;
            };

            openModal(modalView);

            if (window.AbogaSysPermissions) {
                window.AbogaSysPermissions.applyPermissions();
            }
        } catch (error) {
            console.error(error);
            showToast('Error al cargar la información del documento.', 'error');
        }
    }

    // --------------------------------------------------------------------------
    // Editar Documento (PUT)
    // --------------------------------------------------------------------------
    async function openEditModal(id) {
        try {
            const response = await fetch(`/api/documentos/${id}`, { credentials: 'include' });
            if (response.status === 401) { window.location.href = '/index.html'; return; }
            if (response.status === 403) { showToast('Acceso denegado para editar.', 'error'); return; }
            if (!response.ok) throw new Error('Error al obtener datos');
            const doc = await response.json();

            if (formEdit) formEdit.reset();
            if (editDocId) editDocId.value = doc.id;
            if (editDocName) editDocName.value = doc.nombre;
            if (editDocType) editDocType.value = doc.tipoDocumentoId;
            if (editDocDate) editDocDate.value = doc.fechaDocRaw;
            if (editDocExpediente) {
                editDocExpediente.value = doc.expedienteId;
                if (editClientName) editClientName.textContent = doc.cliente || 'Sin cliente';
            }
            if (editDocDesc) editDocDesc.value = doc.descripcion || '';
            
            if (document.getElementById('edit-file-name')) document.getElementById('edit-file-name').textContent = doc.archivoNombre;
            if (document.getElementById('edit-file-icon-box')) {
                const isPdf = doc.extension === 'pdf';
                document.getElementById('edit-file-icon-box').className = `selected-file-icon ${isPdf ? 'pdf' : 'word'}`;
                document.getElementById('edit-file-icon-box').innerHTML = getFileIconSvg(doc.extension);
            }

            openModal(modalEdit);
        } catch (error) {
            console.error(error);
            showToast('Error al cargar la información para edición.', 'error');
        }
    }

    if (formEdit) {
        formEdit.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!editDocDate.value) {
                showToast('Debe ingresar la fecha del documento.', 'error');
                return;
            }

            const expedienteVal = editDocExpediente.value;
            if (!expedienteVal || isNaN(parseInt(expedienteVal))) {
                showToast('Debe seleccionar un expediente judicial válido.', 'error');
                return;
            }

            const id = editDocId.value;
            const payload = {
                nombre: editDocName.value.trim(),
                tipoDocumentoId: editDocType.value,
                fechaDoc: editDocDate.value,
                expedienteId: expedienteVal,
                descripcion: editDocDesc.value.trim()
            };

            try {
                const response = await fetch(`/api/documentos/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                
                if (response.status === 401) { window.location.href = '/index.html'; return; }
                if (response.status === 403) { showToast('Acceso denegado.', 'error'); return; }

                if (response.ok) {
                    showToast('Documento actualizado exitosamente.', 'success');
                    closeModal(modalEdit);
                    fetchDocumentos();
                } else {
                    const data = await response.json();
                    showToast(data.message || 'Error al actualizar documento.', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('Error de conexión al actualizar el documento.', 'error');
            }
        });
    }

    // --------------------------------------------------------------------------
    // Asistente IA
    // --------------------------------------------------------------------------
    const modalIa = document.getElementById('modal-ia-analysis');
    const btnCloseIaModal = document.getElementById('btn-close-ia-modal');
    const btnCancelIaModal = document.getElementById('btn-cancel-ia-modal');
    const iaResultsContainer = document.getElementById('ia-results-container');
    const iaWarningPartial = document.getElementById('ia-warning-partial');

    if (btnCloseIaModal) btnCloseIaModal.addEventListener('click', () => closeModal(modalIa));
    if (btnCancelIaModal) btnCancelIaModal.addEventListener('click', () => closeModal(modalIa));

    async function openIaModal(documentoId) {
        iaResultsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 2s linear infinite; margin-bottom: 10px;">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
                <br>Generando análisis con IA...
            </div>
        `;
        iaWarningPartial.style.display = 'none';
        openModal(modalIa);

        try {
            const response = await fetch('/api/ia/analizar-documento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ documentoId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en el análisis IA');
            }

            if (data.analisisParcial) {
                iaWarningPartial.style.display = 'block';
            }

            iaResultsContainer.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h4 style="margin: 0 0 12px 0; color: #334155; font-size: 0.95rem;">Datos Principales</h4>
                        ${renderIaField('Expediente', data.numeroExpediente)}
                        ${renderIaField('Juzgado', data.juzgado)}
                        ${renderIaField('Fecha Documento', data.fechaDocumento)}
                        ${renderIaField('Tipo Documento', data.tipoDocumento)}
                    </div>
                    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h4 style="margin: 0 0 12px 0; color: #334155; font-size: 0.95rem;">Entidades Identificadas</h4>
                        <div style="margin-bottom: 12px;"><strong>Partes:</strong> ${data.partes && data.partes.length ? data.partes.join(', ') : 'Ninguna'}</div>
                        <div style="margin-bottom: 12px;"><strong>Abogados:</strong> ${data.abogados && data.abogados.length ? data.abogados.join(', ') : 'Ninguno'}</div>
                        <div style="margin-bottom: 12px;"><strong>Fechas Clave:</strong> ${data.fechasImportantes && data.fechasImportantes.length ? data.fechasImportantes.join(', ') : 'Ninguna'}</div>
                    </div>
                </div>
                <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 16px;">
                    <h4 style="margin: 0 0 8px 0; color: #334155; font-size: 0.95rem;">Resumen del Contenido</h4>
                    <p style="margin:0; font-size: 0.9rem; color: #475569; line-height: 1.5;">${data.resumen || 'Sin resumen disponible.'}</p>
                </div>
            `;

        } catch (error) {
            console.error(error);
            iaResultsContainer.innerHTML = `
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; color: #7f1d1d;">
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
        }
    }

    function renderIaField(label, fieldObj) {
        if (!fieldObj) return '';
        let color = fieldObj.estado === 'encontrado' ? '#10b981' : (fieldObj.estado === 'incierto' ? '#f59e0b' : '#ef4444');
        let icon = fieldObj.estado === 'encontrado' ? '✓' : (fieldObj.estado === 'incierto' ? '?' : '✗');
        return `
            <div style="margin-bottom: 12px;">
                <div style="font-size: 0.85rem; color: #64748b; font-weight: 500;">${label} <span style="color:${color}; font-weight:bold;">[${icon}]</span></div>
                <div style="font-size: 0.95rem; color: #0f172a;">${fieldObj.valor || 'No especificado'}</div>
                ${fieldObj.evidencia ? `<div style="font-size: 0.75rem; color: #94a3b8; font-style: italic; margin-top: 2px;">"${fieldObj.evidencia}"</div>` : ''}
            </div>
        `;
    }

    // Inicialización
    loadCatalogs().then(fetchDocumentos);
});
