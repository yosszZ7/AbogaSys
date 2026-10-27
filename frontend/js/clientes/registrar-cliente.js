/**
 * ==========================================================================
 * AbogaSys - Lógica para Registrar Cliente (Persona Natural y Jurídica)
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

    const form = document.getElementById('register-client-form');
    const toast = document.getElementById('toast-feedback');
    const typeRadios = document.querySelectorAll('input[name="clientType"]');
    const sectionNatural = document.getElementById('section-natural');
    const sectionJuridica = document.getElementById('section-juridica');
    const typeCards = document.querySelectorAll('.client-type-card');

    /**
     * Alternar visibilidad de campos según el tipo de cliente seleccionado
     * @param {string} selectedType - 'natural' | 'juridica'
     */
    function switchClientType(selectedType) {
        if (selectedType === 'natural') {
            sectionNatural.style.display = 'block';
            sectionJuridica.style.display = 'none';
        } else {
            sectionNatural.style.display = 'none';
            sectionJuridica.style.display = 'block';
        }

        // Actualizar apariencia de las tarjetas selectoras
        typeCards.forEach(card => {
            const radio = card.querySelector('input[type="radio"]');
            if (radio && radio.value === selectedType) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    // Escuchar cambios en el selector de tipo
    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            switchClientType(e.target.value);
        });
    });

    function showToast(message, type = 'success') {
        if (!toast) return;
        toast.textContent = message;
        toast.style.backgroundColor = type === 'success' ? 'var(--success-color)' : 'var(--danger-color)';
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 4000);
    }

    function setFieldError(fieldId, errorId, message) {
        const field = document.getElementById(fieldId);
        const errorSpan = document.getElementById(errorId);
        if (field) field.classList.add('has-error');
        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.style.display = 'block';
        }
    }

    function clearFieldError(fieldId, errorId) {
        const field = document.getElementById(fieldId);
        const errorSpan = document.getElementById(errorId);
        if (field) field.classList.remove('has-error');
        if (errorSpan) {
            errorSpan.textContent = '';
            errorSpan.style.display = 'none';
        }
    }

    // Lista de campos para limpiar errores en tiempo real
    const allInputIds = [
        'natural-first-name', 'natural-second-name', 'natural-first-lastname', 'natural-second-lastname',
        'natural-dni', 'natural-birthdate', 'natural-gender', 'natural-civil-status', 'natural-blood-type',
        'natural-phone', 'natural-email', 'natural-address', 'natural-observations',
        'juridica-business-name', 'juridica-commercial-name', 'juridica-ruc', 'juridica-phone', 'juridica-email', 'juridica-address',
        'juridica-rep-firstname', 'juridica-rep-secondname', 'juridica-rep-firstlastname',
        'juridica-rep-secondlastname', 'juridica-rep-dni', 'juridica-observations'
    ];

    allInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => clearFieldError(id, `${id}-error`));
        }
    });

    /**
     * Validación y envío del formulario
     */
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentType = document.querySelector('input[name="clientType"]:checked')?.value || 'natural';
            let isValid = true;
            let payload = {};

            if (currentType === 'natural') {
                const firstName = document.getElementById('natural-first-name').value.trim();
                const secondName = document.getElementById('natural-second-name').value.trim();
                const firstLastName = document.getElementById('natural-first-lastname').value.trim();
                const secondLastName = document.getElementById('natural-second-lastname').value.trim();
                const dni = document.getElementById('natural-dni').value.trim();
                const dob = document.getElementById('natural-birthdate').value;
                const sex = document.getElementById('natural-gender').value;
                const civilStatus = document.getElementById('natural-civil-status').value;
                const bloodType = document.getElementById('natural-blood-type').value;
                const phone = document.getElementById('natural-phone').value.trim();
                const email = document.getElementById('natural-email').value.trim();
                const address = document.getElementById('natural-address').value.trim();
                const observations = document.getElementById('natural-observations').value.trim();

                if (!firstName) { setFieldError('natural-first-name', 'natural-first-name-error', 'Por favor, ingresa el primer nombre.'); isValid = false; }
                if (!firstLastName) { setFieldError('natural-first-lastname', 'natural-first-lastname-error', 'Por favor, ingresa el primer apellido.'); isValid = false; }
                if (!dni) { setFieldError('natural-dni', 'natural-dni-error', 'Por favor, ingresa la cédula.'); isValid = false; }
                if (!phone) { setFieldError('natural-phone', 'natural-phone-error', 'Por favor, ingresa el número telefónico.'); isValid = false; }
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('natural-email', 'natural-email-error', 'Ingresa un formato de correo válido.'); isValid = false; }

                if (isValid) {
                    payload = {
                        tipoCliente: 'N',
                        primerNombre: firstName,
                        segundoNombre: secondName,
                        primerApellido: firstLastName,
                        segundoApellido: secondLastName,
                        cedula: dni,
                        fechaNacimiento: dob,
                        sexo: sex,
                        estadoCivil: civilStatus,
                        tipoSangre: bloodType,
                        telefono: phone,
                        correo: email,
                        direccion: address,
                        observaciones: observations
                    };
                }

            } else {
                // Validación para Persona Jurídica / Empresa
                const businessName = document.getElementById('juridica-business-name').value.trim();
                const tradeName = document.getElementById('juridica-commercial-name').value.trim();
                const ruc = document.getElementById('juridica-ruc').value.trim();
                const phone = document.getElementById('juridica-phone').value.trim();
                const email = document.getElementById('juridica-email').value.trim();
                const address = document.getElementById('juridica-address').value.trim();
                
                const repFirstName = document.getElementById('juridica-rep-firstname').value.trim();
                const repSecondName = document.getElementById('juridica-rep-secondname').value.trim();
                const repFirstLastName = document.getElementById('juridica-rep-firstlastname').value.trim();
                const repSecondLastName = document.getElementById('juridica-rep-secondlastname').value.trim();
                const repDni = document.getElementById('juridica-rep-dni').value.trim();
                const observations = document.getElementById('juridica-observations').value.trim();

                if (!businessName) { setFieldError('juridica-business-name', 'juridica-business-name-error', 'Por favor, ingresa la razón social.'); isValid = false; }
                if (!ruc) { setFieldError('juridica-ruc', 'juridica-ruc-error', 'Por favor, ingresa el RUC.'); isValid = false; }
                if (!phone) { setFieldError('juridica-phone', 'juridica-phone-error', 'Por favor, ingresa el teléfono.'); isValid = false; }
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('juridica-email', 'juridica-email-error', 'Ingresa un formato de correo válido.'); isValid = false; }

                if (!repFirstName) { setFieldError('juridica-rep-firstname', 'juridica-rep-firstname-error', 'Ingresa el primer nombre del representante.'); isValid = false; }
                if (!repFirstLastName) { setFieldError('juridica-rep-firstlastname', 'juridica-rep-firstlastname-error', 'Ingresa el primer apellido del representante.'); isValid = false; }
                if (!repDni) { setFieldError('juridica-rep-dni', 'juridica-rep-dni-error', 'Ingresa la cédula del representante.'); isValid = false; }

                if (isValid) {
                    payload = {
                        tipoCliente: 'J',
                        razonSocial: businessName,
                        nombreComercial: tradeName,
                        ruc: ruc,
                        telefono: phone,
                        correo: email,
                        direccion: address,
                        representantePrimerNombre: repFirstName,
                        representanteSegundoNombre: repSecondName,
                        representantePrimerApellido: repFirstLastName,
                        representanteSegundoApellido: repSecondLastName,
                        representanteCedula: repDni,
                        observaciones: observations
                    };
                }
            }

            if (isValid) {
                const btnSubmit = form.querySelector('button[type="submit"]');
                const originalBtnText = btnSubmit.innerHTML;
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

                try {
                    const response = await fetch('/api/clientes', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify(payload)
                    });

                    if (response.status === 401) { window.location.href = '/index.html'; return; }
                    if (response.status === 403) { showToast('Acceso denegado para registrar cliente.', 'error'); return; }

                    const result = await response.json();

                    if (response.ok) {
                        showToast(`Cliente guardado con éxito. Redirigiendo...`, 'success');
                        setTimeout(() => {
                            window.location.href = 'clientes.html';
                        }, 1200);
                    } else if (response.status === 409) {
                        showToast(result.message, 'error');
                        // Destacar campo duplicado
                        if (currentType === 'natural' && result.message.includes('cédula')) {
                            setFieldError('natural-dni', 'natural-dni-error', result.message);
                        } else if (currentType === 'juridica' && result.message.includes('RUC')) {
                            setFieldError('juridica-ruc', 'juridica-ruc-error', result.message);
                        }
                    } else {
                        showToast(result.message || 'Error al guardar el cliente', 'error');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showToast('Error de red. Inténtalo de nuevo.', 'error');
                } finally {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = originalBtnText;
                }
            }
        });
    }

    // Inicializar con la opción por defecto (Persona natural)
    switchClientType('natural');
});
