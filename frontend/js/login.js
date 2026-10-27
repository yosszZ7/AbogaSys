/**
 * ==========================================================================
 * AbogaSys - Enterprise LegalTech Login Logic
 * Gestión de sesión segura, validaciones reactivas y ergonomía UX
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password-btn');
    const submitBtn = document.getElementById('submit-btn');
    const emailGroup = document.getElementById('email-group');
    const passwordGroup = document.getElementById('password-group');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const capsLockWarning = document.getElementById('caps-lock-warning');
    const demoAccessBtn = document.getElementById('demo-access-btn');
    const linkForgotPwd = document.getElementById('link-forgot-pwd');

    // 1. Alternar visibilidad de contraseña
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            togglePasswordBtn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
            togglePasswordBtn.setAttribute('title', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');

            const eyeIcon = togglePasswordBtn.querySelector('.icon-eye');
            const eyeOffIcon = togglePasswordBtn.querySelector('.icon-eye-off');
            if (eyeIcon && eyeOffIcon) {
                eyeIcon.style.display = isPassword ? 'none' : 'block';
                eyeOffIcon.style.display = isPassword ? 'block' : 'none';
            }
        });
    }

    // 2. Detección de Bloqueo de Mayúsculas (Caps Lock)
    if (passwordInput && capsLockWarning) {
        ['keydown', 'keyup'].forEach(eventType => {
            passwordInput.addEventListener(eventType, (e) => {
                if (e.getModifierState && e.getModifierState('CapsLock')) {
                    capsLockWarning.style.display = 'flex';
                } else {
                    capsLockWarning.style.display = 'none';
                }
            });
        });
    }

    // 3. Píldora de Demostración Rápida
    if (demoAccessBtn) {
        demoAccessBtn.addEventListener('click', () => {
            if (emailInput) emailInput.value = 'admin@abogasys.com';
            if (passwordInput) passwordInput.value = 'Admin123!';
            clearError(emailGroup, emailError);
            clearError(passwordGroup, passwordError);
            if (window.AppToast) {
                window.AppToast.info('Credenciales de Administrador cargadas. Haz clic en "Ingresar".', 'Acceso Rápido');
            }
            if (submitBtn) submitBtn.focus();
        });
    }

    // 4. Modal de "¿Olvidaste tu contraseña?"
    if (linkForgotPwd) {
        linkForgotPwd.addEventListener('click', () => {
            if (window.AppDialog) {
                window.AppDialog.alert({
                    title: 'Recuperación de Acceso Jurídico',
                    message: 'Por estrictas políticas de secreto profesional y seguridad RBAC, el restablecimiento de contraseñas debe ser procesado por el Administrador del Sistema mediante la consola de seguridad interna.',
                    buttonText: 'Comprendido',
                    type: 'primary'
                });
            }
        });
    }

    function showError(groupElement, errorElement, message) {
        if (groupElement && errorElement) {
            groupElement.classList.add('has-error');
            errorElement.textContent = message;
        }
    }

    function clearError(groupElement, errorElement) {
        if (groupElement && errorElement) {
            groupElement.classList.remove('has-error');
            errorElement.textContent = '';
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    if (emailInput) {
        emailInput.addEventListener('input', () => clearError(emailGroup, emailError));
    }
    if (passwordInput) {
        passwordInput.addEventListener('input', () => clearError(passwordGroup, passwordError));
    }

    // 5. Envío y autenticación
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            let isValid = true;
            const emailValue = emailInput ? emailInput.value.trim() : '';
            const passwordValue = passwordInput ? passwordInput.value : '';

            if (!emailValue) {
                showError(emailGroup, emailError, 'Ingresa tu correo institucional.');
                isValid = false;
            } else if (!isValidEmail(emailValue)) {
                showError(emailGroup, emailError, 'Ingresa un formato de correo electrónico válido.');
                isValid = false;
            } else {
                clearError(emailGroup, emailError);
            }

            if (!passwordValue) {
                showError(passwordGroup, passwordError, 'Ingresa tu contraseña de acceso.');
                isValid = false;
            } else {
                clearError(passwordGroup, passwordError);
            }

            if (!isValid) {
                if (!emailValue || !isValidEmail(emailValue)) {
                    emailInput?.focus();
                } else {
                    passwordInput?.focus();
                }
                return;
            }

            // Iniciar estado de carga en el botón
            if (window.AppUI) {
                window.AppUI.setButtonLoading(submitBtn, true, 'Verificando credenciales...');
            }

            try {
                // Endpoint relativo compatible con cualquier host/puerto
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailValue, password: passwordValue }),
                    credentials: 'include'
                });

                if (response.ok) {
                    if (window.AppToast) {
                        window.AppToast.success('Acceso autorizado. Redirigiendo al despacho...', 'Bienvenido');
                    }
                    setTimeout(() => {
                        window.location.href = 'pages/dashboard.html';
                    }, 400);
                } else if (response.status === 401) {
                    showError(passwordGroup, passwordError, 'Credenciales inválidas. Verifica tu correo y contraseña.');
                    if (window.AppToast) {
                        window.AppToast.error('Correo o contraseña incorrectos.', 'Acceso Denegado');
                    }
                } else if (response.status === 429) {
                    showError(passwordGroup, passwordError, 'Demasiados intentos de acceso. Espera unos minutos.');
                    if (window.AppToast) {
                        window.AppToast.warning('Has superado el límite de intentos. Bloqueo temporal por seguridad.', 'Alerta de Seguridad');
                    }
                } else {
                    showError(passwordGroup, passwordError, 'No se pudo iniciar sesión. Código ' + response.status);
                }
            } catch (err) {
                console.error('[Error de Red]:', err);
                showError(passwordGroup, passwordError, 'No se pudo conectar con el servidor de AbogaSys.');
                if (window.AppToast) {
                    window.AppToast.error('Verifica que el servicio backend esté encendido.', 'Error de Conexión');
                }
            } finally {
                if (window.AppUI) {
                    window.AppUI.setButtonLoading(submitBtn, false);
                }
            }
        });
    }
});
