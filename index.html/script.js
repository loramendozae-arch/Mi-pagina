// ========== CONFIGURACIÓN DE FIREBASE ==========
// 🔥 REEMPLAZA ESTOS DATOS CON LOS DE TU PROYECTO DE FIREBASE 🔥
const firebaseConfig = {
    apiKey: "AIzaSyDX7oZE9nicr74tk9P7OKWMS10F8iOliEg",
    authDomain: "plataforma-5966a.firebaseapp.com",
    projectId: "plataforma-5966a",
    storageBucket: "plataforma-5966a.firebasestorage.app",
    messagingSenderId: "431679378128",
    appId: "1:431679378128:web:6c49ec0b76212dc9c084d5",
  measurementId: "G-8FVQ72F43G"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ========== VARIABLES GLOBALES ==========
let usuarioActual = '';
let tipoUsuarioActual = '';
let cursosRechazadosEnSesion = [];
let usuarioRecienRegistrado = null;
let planSeleccionado = null;
let metodoPagoSeleccionado = null;
let pasosPago = 1;
let cursosMostrados = false;
let pagoPendiente = false;
let planPendiente = null;

// Datos desde Firebase
let usuarios = [];
let cursosData = [];
let solicitudesData = [];
let notificacionesData = [];
let afiliadosData = [];
let indicacionesData = [];

// Variables para asesorías grupales
let asesoriasGrupales = [];
let asesoriaSeleccionada = null;
let cursosMostradosAf = false;

// ========== FUNCIONES UTILITARIAS ==========
function mostrarMensaje(texto, tipo) {
    const msg = document.createElement('div');
    msg.className = `mensaje-flotante mensaje-${tipo}`;
    msg.textContent = texto;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

function mostrarLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function hashPassword(p) {
    return btoa(unescape(encodeURIComponent(p)));
}

// ========== LIMPIEZA DE FORMULARIOS ==========
function limpiarFormularioLogin() {
    const loginUsuario = document.getElementById('loginUsuario');
    const loginPassword = document.getElementById('loginPassword');
    const rolLogin = document.getElementById('rolLogin');
    const tipoLogin = document.getElementById('tipoLoginSeleccionado');
    
    if (loginUsuario) loginUsuario.value = '';
    if (loginPassword) loginPassword.value = '';
    if (rolLogin) rolLogin.value = 'estudiante';
    if (tipoLogin) tipoLogin.value = 'no-afiliado';
    
    const opciones = document.querySelectorAll('#login .tipo-opcion');
    opciones.forEach(opt => opt.classList.remove('seleccionado'));
    const opcionNoAfiliado = document.querySelector('#login .tipo-opcion[data-tipo="no-afiliado"]');
    if (opcionNoAfiliado) opcionNoAfiliado.classList.add('seleccionado');
}

function limpiarFormularioRegistro() {
    const usuarioRegistro = document.getElementById('usuarioRegistro');
    const passwordRegistro = document.getElementById('passwordRegistro');
    const rolRegistro = document.getElementById('rolRegistro');
    const tipoRegistro = document.getElementById('tipoRegistroSeleccionado');
    
    if (usuarioRegistro) usuarioRegistro.value = '';
    if (passwordRegistro) passwordRegistro.value = '';
    if (rolRegistro) rolRegistro.value = 'estudiante';
    if (tipoRegistro) tipoRegistro.value = 'no-afiliado';
    
    const opciones = document.querySelectorAll('#registro .tipo-opcion');
    opciones.forEach(opt => opt.classList.remove('seleccionado'));
    const opcionNoAfiliado = document.querySelector('#registro .tipo-opcion[data-tipo="no-afiliado"]');
    if (opcionNoAfiliado) opcionNoAfiliado.classList.add('seleccionado');
}

function limpiarFormularioPago() {
    const campos = ['numeroTarjeta', 'nombreTarjeta', 'expiracionTarjeta', 'cvvTarjeta', 'celularDaviplata', 'emailDaviplata', 'documentoDaviplata'];
    campos.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    metodoPagoSeleccionado = null;
    document.querySelectorAll('.metodo-pago').forEach(m => m.classList.remove('selected'));
    document.querySelectorAll('.form-pago').forEach(f => f.style.display = 'none');
    document.querySelectorAll('.tarjeta-icono').forEach(icon => icon.classList.remove('activo'));
    const numTarjeta = document.getElementById('numeroTarjeta');
    if (numTarjeta) numTarjeta.classList.remove('valid', 'invalid');
}

// ========== NAVEGACIÓN ==========
function ocultarTodo() {
    const secciones = ['contenedorInicio', 'afiliados', 'planes', 'pago', 'login', 'registro', 'estudiante', 'afiliadoDashboard', 'profesor'];
    secciones.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function mostrarInicio() {
    ocultarTodo();
    const inicio = document.getElementById('contenedorInicio');
    if (inicio) inicio.style.display = 'block';
    limpiarFormularioLogin();
    limpiarFormularioRegistro();
    limpiarFormularioPago();
}

function mostrarAfiliados() {
    ocultarTodo();
    const afiliados = document.getElementById('afiliados');
    if (afiliados) afiliados.style.display = 'flex';
    limpiarFormularioPago();
}

function mostrarPlanes() {
    ocultarTodo();
    const planes = document.getElementById('planes');
    if (planes) planes.style.display = 'flex';
    limpiarFormularioPago();
}

function mostrarLogin() {
    ocultarTodo();
    const login = document.getElementById('login');
    if (login) login.style.display = 'flex';
    limpiarFormularioLogin();
}

function mostrarRegistro() {
    ocultarTodo();
    const registro = document.getElementById('registro');
    if (registro) registro.style.display = 'flex';
    limpiarFormularioRegistro();
}

function volverInicio() {
    if (usuarioActual) {
        const user = usuarios.find(x => x.u === usuarioActual);
        if (user) {
            ocultarTodo();
            if (tipoUsuarioActual === 'afiliado' || user.esAfiliado) {
                const afiliadoDash = document.getElementById('afiliadoDashboard');
                if (afiliadoDash) afiliadoDash.style.display = 'block';
                cargarDashboardAfiliado();
            } else {
                const dash = document.getElementById(user.r);
                if (dash) dash.style.display = 'block';
                if (user.r === 'profesor') {
                    cargarHorariosProfesor();
                    cargarCheckboxHorarios();
                    cargarSolicitudesProfesor();
                } else if (user.r === 'estudiante') {
                    actualizarInfoPlanEstudiante();
                    cargarNotificaciones();
                    cargarAsesoriasGrupales();
                }
            }
        }
    } else {
        mostrarInicio();
    }
}

function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        usuarioActual = '';
        tipoUsuarioActual = '';
        usuarioRecienRegistrado = null;
        cursosRechazadosEnSesion = [];
        pagoPendiente = false;
        planPendiente = null;
        ocultarTodo();
        mostrarInicio();
        mostrarMensaje('Sesión cerrada', 'exito');
    }
}

function irAlDashboard() {
    if (pagoPendiente && planPendiente && usuarioActual) {
        const user = usuarios.find(x => x.u === usuarioActual);
        if (user && user.id) {
            db.collection('usuarios').doc(user.id).update({
                plan: planPendiente,
                esAfiliado: true
            }).then(() => {
                return db.collection('afiliados').add({
                    usuario: usuarioActual,
                    plan: planPendiente,
                    fechaAfiliacion: new Date().toISOString(),
                    activo: true,
                    metodoPago: metodoPagoSeleccionado
                });
            }).then(() => {
                tipoUsuarioActual = 'afiliado';
                mostrarMensaje(`¡Plan ${planPendiente} activado!`, 'exito');
                pagoPendiente = false;
                planPendiente = null;
                ocultarTodo();
                const afiliadoDash = document.getElementById('afiliadoDashboard');
                if (afiliadoDash) afiliadoDash.style.display = 'block';
                cargarDashboardAfiliado();
                cargarDatosFirebase();
            }).catch(error => {
                console.error('Error:', error);
                mostrarMensaje('Error al activar el plan', 'error');
            });
            return;
        }
    }
    
    if (usuarioActual) {
        const user = usuarios.find(x => x.u === usuarioActual);
        if (user) {
            ocultarTodo();
            if (tipoUsuarioActual === 'afiliado' || user.esAfiliado) {
                const afiliadoDash = document.getElementById('afiliadoDashboard');
                if (afiliadoDash) afiliadoDash.style.display = 'block';
                cargarDashboardAfiliado();
            } else {
                const dash = document.getElementById(user.r);
                if (dash) dash.style.display = 'block';
                if (user.r === 'profesor') {
                    cargarHorariosProfesor();
                    cargarCheckboxHorarios();
                    cargarSolicitudesProfesor();
                } else if (user.r === 'estudiante') {
                    actualizarInfoPlanEstudiante();
                    cargarNotificaciones();
                    cargarAsesoriasGrupales();
                }
            }
        }
    } else if (usuarioRecienRegistrado) {
        mostrarLogin();
        mostrarMensaje('Registro exitoso. Inicia sesión', 'exito');
    } else {
        mostrarInicio();
    }
    limpiarFormularioPago();
}

// ========== SELECTORES DE TIPO ==========
function seleccionarTipoLogin(tipo) {
    const tipoLogin = document.getElementById('tipoLoginSeleccionado');
    if (tipoLogin) tipoLogin.value = tipo;
    document.querySelectorAll('#login .tipo-opcion').forEach(opt => {
        opt.classList.remove('seleccionado');
        if (opt.getAttribute('data-tipo') === tipo) opt.classList.add('seleccionado');
    });
}

function seleccionarTipoRegistro(tipo) {
    const tipoRegistro = document.getElementById('tipoRegistroSeleccionado');
    if (tipoRegistro) tipoRegistro.value = tipo;
    document.querySelectorAll('#registro .tipo-opcion').forEach(opt => {
        opt.classList.remove('seleccionado');
        if (opt.getAttribute('data-tipo') === tipo) opt.classList.add('seleccionado');
    });
}

// ========== FUNCIONES DE PAGO ==========
function seleccionarPlan(plan) {
    planSeleccionado = plan;
    mostrarPago();
}

function mostrarPago() {
    if (!planSeleccionado) return;
    ocultarTodo();
    const pago = document.getElementById('pago');
    if (pago) pago.style.display = 'flex';
    pasosPago = 1;
    actualizarPasos();
    
    const precios = { basico: 9.99, avanzado: 24.99, premium: 49.99 };
    const nombres = { basico: 'Plan Básico', avanzado: 'Plan Avanzado', premium: 'Plan Premium' };
    const resumenPlan = document.getElementById('resumenPlan');
    if (resumenPlan) {
        resumenPlan.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 4rem;">🎯</div>
                <h2 style="color: #ff6600; margin: 15px 0;">${nombres[planSeleccionado]}</h2>
                <div class="plan-price" style="font-size: 3rem; color: #ff6600; margin: 10px 0;">
                    $${precios[planSeleccionado]}<span style="font-size: 1rem;">/mes</span>
                </div>
                <div style="background: rgba(255,255,255,0.1); border-radius: 10px; padding: 15px; margin: 15px 0;">
                    <p style="color: white;">✨ Beneficios del plan:</p>
                    <p style="color: rgba(255,255,255,0.8);">Después del pago, inicia sesión para activar tu plan</p>
                </div>
            </div>
        `;
    }
    limpiarFormularioPago();
    agregarFormatosTarjeta();
}

function mostrarPagoAfiliado(plan) {
    planSeleccionado = plan;
    ocultarTodo();
    const pago = document.getElementById('pago');
    if (pago) pago.style.display = 'flex';
    pasosPago = 1;
    actualizarPasos();
    
    const precios = { basico: 4.99, premium: 12.99, corporativo: 29.99 };
    const nombres = { basico: 'Afiliado Básico', premium: 'Afiliado Premium', corporativo: 'Afiliado Corporativo' };
    const resumenPlan = document.getElementById('resumenPlan');
    if (resumenPlan) {
        resumenPlan.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 4rem;">🤝</div>
                <h2 style="color: #ff6600; margin: 15px 0;">${nombres[plan]}</h2>
                <div class="plan-price" style="font-size: 3rem; color: #ff6600; margin: 10px 0;">
                    $${precios[plan]}<span style="font-size: 1rem;">/mes</span>
                </div>
                <div style="background: rgba(255,255,255,0.1); border-radius: 10px; padding: 15px; margin: 15px 0;">
                    <p style="color: white;">✨ Beneficios del plan:</p>
                    <p style="color: #ff6600;">⭐ Incluye membresía de afiliado</p>
                    <p style="color: rgba(255,255,255,0.8);">Después del pago, completa tu registro</p>
                </div>
            </div>
        `;
    }
    limpiarFormularioPago();
    agregarFormatosTarjeta();
}

function actualizarPasos() {
    document.querySelectorAll('.pago-content').forEach((p, i) => p.classList.toggle('active', i + 1 === pasosPago));
    document.querySelectorAll('.step').forEach((s, i) => {
        s.classList.toggle('active', i + 1 === pasosPago);
        s.classList.toggle('completed', i + 1 < pasosPago);
    });
}

function siguientePaso() {
    if (pasosPago === 2) {
        if (!metodoPagoSeleccionado) { mostrarMensaje('Selecciona método de pago', 'error'); return; }
        if (metodoPagoSeleccionado === 'tarjeta' && !validarDatosTarjeta()) return;
        if (metodoPagoSeleccionado === 'daviplata' && !validarDatosDaviplata()) return;
        procesarPago();
        return;
    }
    if (pasosPago < 3) {
        pasosPago++;
        actualizarPasos();
    }
}

function anteriorPaso() {
    if (pasosPago > 1) {
        pasosPago--;
        actualizarPasos();
    }
}

function seleccionarMetodo(metodo) {
    metodoPagoSeleccionado = metodo;
    document.querySelectorAll('.metodo-pago').forEach(m => m.classList.remove('selected'));
    const metodoElem = document.getElementById(`metodo${metodo.charAt(0).toUpperCase() + metodo.slice(1)}`);
    if (metodoElem) metodoElem.classList.add('selected');
    document.querySelectorAll('.form-pago').forEach(f => f.style.display = 'none');
    const formElem = document.getElementById(`form${metodo.charAt(0).toUpperCase() + metodo.slice(1)}`);
    if (formElem) formElem.style.display = 'block';
    if (metodo === 'tarjeta') agregarFormatosTarjeta();
}

// ========== VALIDACIÓN DE TARJETA ==========
function agregarFormatosTarjeta() {
    const numeroInput = document.getElementById('numeroTarjeta');
    const expiracionInput = document.getElementById('expiracionTarjeta');
    const cvvInput = document.getElementById('cvvTarjeta');
    
    if (numeroInput) {
        numeroInput.oninput = function(e) {
            let value = e.target.value.replace(/\D/g, '');
            let tipo = detectarTipoTarjeta(value);
            let formatted = '';
            if (tipo === 'amex') {
                for (let i = 0; i < value.length; i++) {
                    if (i === 4 || i === 10) formatted += ' ';
                    formatted += value[i];
                }
                e.target.value = formatted.substring(0, 17);
            } else {
                for (let i = 0; i < value.length; i++) {
                    if (i > 0 && i % 4 === 0) formatted += ' ';
                    formatted += value[i];
                }
                e.target.value = formatted.substring(0, 19);
            }
            const longEsp = (tipo === 'amex') ? 15 : 16;
            if (value.length === longEsp) {
                e.target.classList.add('valid');
                e.target.classList.remove('invalid');
            } else if (value.length > 0) {
                e.target.classList.remove('valid');
                e.target.classList.add('invalid');
            } else {
                e.target.classList.remove('valid', 'invalid');
            }
        };
    }
    
    if (expiracionInput) {
        expiracionInput.oninput = function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
            else e.target.value = value;
        };
    }
    
    if (cvvInput) {
        cvvInput.oninput = function(e) {
            const numTarjeta = document.getElementById('numeroTarjeta')?.value.replace(/\s/g, '') || '';
            const tipo = detectarTipoTarjeta(numTarjeta);
            const maxLen = (tipo === 'amex') ? 4 : 3;
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, maxLen);
        };
    }
}

function detectarTipoTarjeta(numero) {
    if (!numero || numero.length === 0) return 'desconocido';
    const primerDigito = numero.charAt(0);
    const primerosDos = numero.substring(0, 2);
    const primerosTres = numero.substring(0, 3);
    const primerosCuatro = numero.substring(0, 4);
    
    document.querySelectorAll('.tarjeta-icono').forEach(icon => icon.classList.remove('activo'));
    
    if (primerosDos === '34' || primerosDos === '37') {
        document.querySelector('.tarjeta-icono.amex')?.classList.add('activo');
        return 'amex';
    } else if (primerDigito === '4') {
        document.querySelector('.tarjeta-icono.visa')?.classList.add('activo');
        return 'visa';
    } else if ((primerosDos >= '51' && primerosDos <= '55') || (parseInt(primerosCuatro) >= 2221 && parseInt(primerosCuatro) <= 2720)) {
        document.querySelector('.tarjeta-icono.mastercard')?.classList.add('activo');
        return 'mastercard';
    } else if (primerosCuatro === '6011' || primerDigito === '65' || (primerosTres >= '644' && primerosTres <= '649')) {
        document.querySelector('.tarjeta-icono.discover')?.classList.add('activo');
        return 'discover';
    }
    return 'desconocido';
}

function validarLuhn(numero) {
    let suma = 0;
    let alternar = false;
    for (let i = numero.length - 1; i >= 0; i--) {
        let digito = parseInt(numero.charAt(i));
        if (alternar) { digito *= 2; if (digito > 9) digito = (digito % 10) + 1; }
        suma += digito;
        alternar = !alternar;
    }
    return (suma % 10) === 0;
}

function validarDatosTarjeta() {
    const numeroRaw = document.getElementById('numeroTarjeta').value;
    const numero = numeroRaw.replace(/\s/g, '');
    const nombre = document.getElementById('nombreTarjeta').value.trim().toUpperCase();
    const expiracion = document.getElementById('expiracionTarjeta').value.trim();
    const cvv = document.getElementById('cvvTarjeta').value.trim();
    
    const tipo = detectarTipoTarjeta(numero);
    const longEsp = (tipo === 'amex') ? 15 : 16;
    
    if (tipo === 'desconocido') { mostrarMensaje('Tipo de tarjeta no reconocido', 'error'); return false; }
    if (!numero || numero.length !== longEsp || !/^\d+$/.test(numero)) { mostrarMensaje(`Número debe tener ${longEsp} dígitos`, 'error'); return false; }
    if (!validarLuhn(numero)) { mostrarMensaje('Número de tarjeta inválido', 'error'); return false; }
    if (!nombre || nombre.length < 3 || !/^[A-Z\s]+$/.test(nombre)) { mostrarMensaje('Nombre inválido', 'error'); return false; }
    if (!expiracion || !/^\d{2}\/\d{2}$/.test(expiracion)) { mostrarMensaje('Fecha inválida (MM/AA)', 'error'); return false; }
    
    const [mesStr, anioStr] = expiracion.split('/');
    const mes = parseInt(mesStr);
    const anio = parseInt('20' + anioStr);
    const ahora = new Date();
    if (mes < 1 || mes > 12) { mostrarMensaje('Mes inválido', 'error'); return false; }
    if (anio < ahora.getFullYear() || (anio === ahora.getFullYear() && mes < ahora.getMonth() + 1)) { mostrarMensaje('Tarjeta expirada', 'error'); return false; }
    
    const cvvLimpio = cvv.replace(/\D/g, '');
    const cvvEsp = (tipo === 'amex') ? 4 : 3;
    if (!cvvLimpio || cvvLimpio.length !== cvvEsp) { mostrarMensaje(`CVV debe tener ${cvvEsp} dígitos`, 'error'); return false; }
    
    mostrarMensaje(`✅ Tarjeta ${tipo.toUpperCase()} válida`, 'exito');
    return true;
}

function validarDatosDaviplata() {
    const celular = document.getElementById('celularDaviplata').value.trim();
    const email = document.getElementById('emailDaviplata').value.trim();
    const documento = document.getElementById('documentoDaviplata').value.trim();
    
    if (!celular) { mostrarMensaje('Ingresa tu número de celular', 'error'); return false; }
    const celularLimpio = celular.replace(/\D/g, '');
    if (celularLimpio.length !== 10) { mostrarMensaje('Número de celular inválido (10 dígitos)', 'error'); return false; }
    if (!email) { mostrarMensaje('Ingresa tu correo electrónico', 'error'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { mostrarMensaje('Correo electrónico inválido', 'error'); return false; }
    if (!documento) { mostrarMensaje('Ingresa tu número de documento', 'error'); return false; }
    mostrarMensaje('✅ Datos de Daviplata válidos', 'exito');
    return true;
}

function obtenerMontoPlan(plan) {
    const precios = {
        basico: 9.99,
        avanzado: 24.99,
        premium: 49.99,
        basico_afiliado: 4.99,
        premium_afiliado: 12.99,
        corporativo: 29.99
    };
    return precios[plan] || 0;
}

function procesarPago() {
    mostrarLoader(true);
    const pagoLoader = document.getElementById('pagoLoader');
    const progressBar = document.getElementById('pagoProgressBar');
    const loaderText = document.getElementById('pagoLoaderText');
    if (pagoLoader) pagoLoader.style.display = 'flex';
    
    let progreso = 0;
    const intervalo = setInterval(() => {
        progreso += 10;
        if (progressBar) progressBar.style.width = progreso + '%';
        if (loaderText) {
            if (progreso === 30) loaderText.textContent = 'Verificando datos...';
            else if (progreso === 60) loaderText.textContent = 'Procesando pago...';
            else if (progreso === 90) loaderText.textContent = 'Confirmando transacción...';
        }
        if (progreso >= 100) {
            clearInterval(intervalo);
            setTimeout(() => {
                if (pagoLoader) pagoLoader.style.display = 'none';
                mostrarLoader(false);
                pagoPendiente = true;
                planPendiente = planSeleccionado;
                
                const transaccion = 'TXN-' + Date.now();
                const monto = obtenerMontoPlan(planSeleccionado);
                const metodo = metodoPagoSeleccionado === 'tarjeta' ? 'Tarjeta de Crédito/Débito' : 'Daviplata';
                
                document.getElementById('numeroTransaccion').textContent = transaccion;
                document.getElementById('comprobantePlan').textContent = planSeleccionado;
                document.getElementById('comprobanteMetodo').textContent = metodo;
                
                // Guardar registro de pago en Firebase
                db.collection('pagos').add({
                    usuario: usuarioActual || 'anonimo',
                    plan: planSeleccionado,
                    metodo: metodoPagoSeleccionado,
                    transaccion: transaccion,
                    monto: monto,
                    fecha: new Date().toISOString()
                }).catch(error => console.error('Error guardando pago:', error));
                
                const esPlanAfiliado = ['basico', 'premium', 'corporativo'].includes(planSeleccionado);
                if (esPlanAfiliado) {
                    mostrarMensaje('¡Pago exitoso! Completa tu registro', 'exito');
                    limpiarFormularioPago();
                    mostrarRegistro();
                } else {
                    mostrarMensaje('¡Pago exitoso! Inicia sesión', 'exito');
                    pasosPago = 3;
                    actualizarPasos();
                }
            }, 500);
        }
    }, 200);
}

function descargarComprobante() { mostrarMensaje('Comprobante generado', 'exito'); }

// ========== REGISTRO Y LOGIN ==========
async function registrar() {
    const u = document.getElementById('usuarioRegistro').value.trim();
    const p = document.getElementById('passwordRegistro').value;
    const r = document.getElementById('rolRegistro').value;
    const tipoRegistro = document.getElementById('tipoRegistroSeleccionado').value;
    
    if (!u || !p) { mostrarMensaje('Completa todos los campos', 'error'); return; }
    mostrarLoader(true);
    
    try {
        const usuariosRef = await db.collection('usuarios').where('u', '==', u).get();
        if (!usuariosRef.empty) { mostrarMensaje('Usuario ya existe', 'error'); mostrarLoader(false); return; }
        
        const nuevoUsuario = { u, p: hashPassword(p), r, plan: null, esAfiliado: tipoRegistro === 'afiliado', fechaRegistro: new Date().toISOString() };
        await db.collection('usuarios').add(nuevoUsuario);
        usuarioRecienRegistrado = u;
        
        if (pagoPendiente && planPendiente) {
            const userRef = await db.collection('usuarios').where('u', '==', u).get();
            await userRef.docs[0].ref.update({ plan: planPendiente, esAfiliado: true });
            await db.collection('afiliados').add({ usuario: u, plan: planPendiente, fechaAfiliacion: new Date().toISOString(), activo: true, metodoPago: metodoPagoSeleccionado });
            mostrarMensaje(`¡Registro exitoso! Plan ${planPendiente} activado.`, 'exito');
            pagoPendiente = false; planPendiente = null;
            limpiarFormularioRegistro();
            mostrarLogin();
            await cargarDatosFirebase();
            mostrarLoader(false);
            return;
        }
        
        if (tipoRegistro === 'afiliado') { mostrarMensaje('Registro exitoso. Ahora elige tu plan de afiliación', 'exito'); mostrarAfiliados(); }
        else { mostrarMensaje('Registro exitoso', 'exito'); if (r === 'estudiante') mostrarPlanes(); else mostrarLogin(); }
        limpiarFormularioRegistro();
        await cargarDatosFirebase();
    } catch (error) { console.error(error); mostrarMensaje('Error en el registro', 'error'); }
    mostrarLoader(false);
}

async function login() {
    const u = document.getElementById('loginUsuario').value.trim();
    const p = document.getElementById('loginPassword').value;
    const r = document.getElementById('rolLogin').value;
    const tipoLogin = document.getElementById('tipoLoginSeleccionado').value;
    
    if (!u || !p) { mostrarMensaje('Completa todos los campos', 'error'); return; }
    mostrarLoader(true);
    
    try {
        const usuariosRef = await db.collection('usuarios').where('u', '==', u).where('r', '==', r).get();
        if (usuariosRef.empty) { mostrarMensaje('Credenciales incorrectas', 'error'); mostrarLoader(false); return; }
        
        const userDoc = usuariosRef.docs[0];
        const user = userDoc.data();
        if (user.p !== hashPassword(p)) { mostrarMensaje('Credenciales incorrectas', 'error'); mostrarLoader(false); return; }
        
        if (pagoPendiente && planPendiente) {
            await userDoc.ref.update({ plan: planPendiente, esAfiliado: true });
            await db.collection('afiliados').add({ usuario: u, plan: planPendiente, fechaAfiliacion: new Date().toISOString(), activo: true, metodoPago: metodoPagoSeleccionado });
            mostrarMensaje(`¡Bienvenido! Plan ${planPendiente} activado.`, 'exito');
            pagoPendiente = false; planPendiente = null;
            tipoUsuarioActual = 'afiliado'; usuarioActual = u;
            ocultarTodo(); document.getElementById('afiliadoDashboard').style.display = 'block';
            cargarDashboardAfiliado();
            limpiarFormularioLogin();
            await cargarDatosFirebase();
            mostrarLoader(false);
            return;
        }
        
        if (tipoLogin === 'afiliado' && !user.esAfiliado) { mostrarMensaje('Esta cuenta no es de afiliado. ¿Deseas afiliarte?', 'info'); mostrarAfiliados(); limpiarFormularioLogin(); mostrarLoader(false); return; }
        
        usuarioActual = u;
        tipoUsuarioActual = tipoLogin;
        ocultarTodo();
        
        if (tipoLogin === 'afiliado' || user.esAfiliado) {
            document.getElementById('afiliadoDashboard').style.display = 'block';
            cargarDashboardAfiliado();
            cargarNotificacionesAfiliado();
            cargarCursosDisponiblesAfiliado();
        } else {
            if (r === 'estudiante') {
                if (!user.plan) mostrarPlanes();
                else { document.getElementById('estudiante').style.display = 'block'; actualizarInfoPlanEstudiante(); cargarNotificaciones(); cargarAsesoriasGrupales(); }
            } else { document.getElementById('profesor').style.display = 'block'; cargarHorariosProfesor(); cargarCheckboxHorarios(); cargarSolicitudesProfesor(); }
        }
        limpiarFormularioLogin();
        await cargarDatosFirebase();
    } catch (error) { console.error(error); mostrarMensaje('Error en el inicio de sesión', 'error'); }
    mostrarLoader(false);
}

// ========== CARGAR DATOS DE FIREBASE ==========
async function cargarDatosFirebase() {
    try {
        const usuariosSnap = await db.collection('usuarios').get();
        usuarios = []; usuariosSnap.forEach(doc => usuarios.push({ id: doc.id, ...doc.data() }));
        
        const cursosSnap = await db.collection('cursos').get();
        cursosData = []; cursosSnap.forEach(doc => cursosData.push({ id: doc.id, ...doc.data() }));
        
        const solicitudesSnap = await db.collection('solicitudes').get();
        solicitudesData = []; solicitudesSnap.forEach(doc => solicitudesData.push({ id: doc.id, ...doc.data() }));
        
        const notificacionesSnap = await db.collection('notificaciones').get();
        notificacionesData = []; notificacionesSnap.forEach(doc => notificacionesData.push({ id: doc.id, ...doc.data() }));
        
        const afiliadosSnap = await db.collection('afiliados').get();
        afiliadosData = []; afiliadosSnap.forEach(doc => afiliadosData.push({ id: doc.id, ...doc.data() }));
        
        const indicacionesSnap = await db.collection('indicaciones').get();
        indicacionesData = []; indicacionesSnap.forEach(doc => indicacionesData.push({ id: doc.id, ...doc.data() }));
        
        const asesoriasSnap = await db.collection('asesoriasGrupales').get();
        asesoriasGrupales = []; asesoriasSnap.forEach(doc => asesoriasGrupales.push({ id: doc.id, ...doc.data() }));
        
        console.log('Datos cargados:', { usuarios: usuarios.length, cursos: cursosData.length, asesorias: asesoriasGrupales.length });
    } catch (error) { console.error('Error cargando datos:', error); }
}

// ========== FUNCIONES PARA ASESORÍAS GRUPALES ==========
async function cargarAsesoriasGrupales() {
    try {
        const asesoriasSnap = await db.collection('asesoriasGrupales').get();
        asesoriasGrupales = [];
        asesoriasSnap.forEach(doc => {
            asesoriasGrupales.push({ id: doc.id, ...doc.data() });
        });
        return asesoriasGrupales;
    } catch (error) {
        console.error('Error cargando asesorías:', error);
        return [];
    }
}

function mostrarModalCrearAsesoria() {
    const modal = document.getElementById('modalCrearAsesoria');
    if (modal) modal.style.display = 'flex';
    
    const titulo = document.getElementById('tituloAsesoria');
    const tema = document.getElementById('temaAsesoria');
    const descripcion = document.getElementById('descripcionAsesoria');
    const fecha = document.getElementById('fechaAsesoria');
    const hora = document.getElementById('horaAsesoria');
    const duracion = document.getElementById('duracionAsesoria');
    const maxParticipantes = document.getElementById('maxParticipantes');
    const aporte = document.getElementById('aportePorPersona');
    const enlace = document.getElementById('enlaceVideollamada');
    
    if (titulo) titulo.value = '';
    if (tema) tema.value = '';
    if (descripcion) descripcion.value = '';
    if (fecha) fecha.value = '';
    if (hora) hora.value = '';
    if (duracion) duracion.value = '1';
    if (maxParticipantes) maxParticipantes.value = '5';
    if (aporte) aporte.value = '0';
    if (enlace) enlace.value = '';
}

function cerrarModalCrearAsesoria() {
    const modal = document.getElementById('modalCrearAsesoria');
    if (modal) modal.style.display = 'none';
}

function cerrarModalInvitar() {
    const modal = document.getElementById('modalInvitarAmigos');
    if (modal) modal.style.display = 'none';
    asesoriaSeleccionada = null;
}

async function crearAsesoriaGrupal() {
    const titulo = document.getElementById('tituloAsesoria')?.value.trim();
    const tema = document.getElementById('temaAsesoria')?.value.trim();
    const descripcion = document.getElementById('descripcionAsesoria')?.value.trim();
    const fecha = document.getElementById('fechaAsesoria')?.value;
    const hora = document.getElementById('horaAsesoria')?.value;
    const duracion = parseFloat(document.getElementById('duracionAsesoria')?.value || 1);
    const maxParticipantes = parseInt(document.getElementById('maxParticipantes')?.value || 5);
    const aportePorPersona = parseInt(document.getElementById('aportePorPersona')?.value || 0);
    const enlaceVideollamada = document.getElementById('enlaceVideollamada')?.value.trim();
    
    if (!titulo || !tema || !descripcion || !fecha || !hora) {
        mostrarMensaje('Completa todos los campos obligatorios', 'error');
        return;
    }
    
    mostrarLoader(true);
    
    try {
        const nuevaAsesoria = {
            titulo: titulo,
            tema: tema,
            descripcion: descripcion,
            fecha: fecha,
            hora: hora,
            duracion: duracion,
            maxParticipantes: maxParticipantes,
            aportePorPersona: aportePorPersona,
            enlaceVideollamada: enlaceVideollamada || null,
            organizador: usuarioActual,
            participantes: [usuarioActual],
            invitaciones: [],
            estado: 'activa',
            fechaCreacion: new Date().toISOString(),
            codigoInvitacion: 'ASES-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase()
        };
        
        await db.collection('asesoriasGrupales').add(nuevaAsesoria);
        
        await db.collection('notificaciones').add({
            usuario: usuarioActual,
            mensaje: `🎉 Has creado la asesoría grupal "${titulo}"`,
            fecha: new Date().toISOString(),
            leida: false,
            tipo: 'asesoria'
        });
        
        mostrarMensaje('Asesoría grupal creada exitosamente', 'exito');
        cerrarModalCrearAsesoria();
        await cargarAsesoriasGrupales();
        
        if (tipoUsuarioActual === 'afiliado') {
            mostrarMisAsesoriasAfiliado();
        } else {
            mostrarMisAsesorias();
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al crear la asesoría', 'error');
    }
    
    mostrarLoader(false);
}

async function mostrarMisAsesorias() {
    const contenedor = document.getElementById('contenedorAsesoriasGrupales');
    const btnMostrar = document.getElementById('btnVerMisAsesorias');
    
    if (!contenedor) return;
    
    await cargarAsesoriasGrupales();
    
    const misAsesorias = asesoriasGrupales.filter(a => 
        a.organizador === usuarioActual || (a.participantes && a.participantes.includes(usuarioActual))
    );
    
    if (misAsesorias.length === 0) {
        contenedor.innerHTML = '<div class="card" style="text-align: center;"><span style="font-size: 3rem;">👥</span><p>No tienes asesorías grupales aún. ¡Crea una!</p></div>';
        contenedor.style.display = 'block';
        if (btnMostrar) btnMostrar.innerHTML = '📋 Ocultar Mis Asesorías';
        return;
    }
    
    let html = '<h3 style="margin-bottom: 15px;">📋 Mis Asesorías Grupales</h3>';
    
    for (const asesoria of misAsesorias) {
        const fechaObj = new Date(asesoria.fecha);
        const fechaFormateada = fechaObj.toLocaleDateString('es-ES');
        const participantesRestantes = asesoria.maxParticipantes - (asesoria.participantes ? asesoria.participantes.length : 1);
        const esOrganizador = asesoria.organizador === usuarioActual;
        
        html += `
            <div class="curso-disponible" style="border-left: 4px solid ${esOrganizador ? '#ff6600' : '#00a8a8'}; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap;">
                    <div>
                        <h4>${asesoria.titulo}</h4>
                        <p><strong>📚 Tema:</strong> ${asesoria.tema}</p>
                        <p>${asesoria.descripcion}</p>
                        <p><strong>📅 Fecha:</strong> ${fechaFormateada} - ${asesoria.hora} (${asesoria.duracion} horas)</p>
                        <p><strong>👥 Participantes:</strong> ${asesoria.participantes ? asesoria.participantes.length : 1}/${asesoria.maxParticipantes}</p>
                        ${asesoria.aportePorPersona > 0 ? `<p><strong>💰 Aporte:</strong> $${asesoria.aportePorPersona.toLocaleString()} por persona</p>` : '<p><strong>🎉 Asesoría Gratuita!</strong></p>'}
                        ${asesoria.enlaceVideollamada ? `<p><strong>🔗 Enlace:</strong> <a href="${asesoria.enlaceVideollamada}" target="_blank">Unirse a videollamada</a></p>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <span class="solicitud-estado estado-${asesoria.estado === 'activa' ? 'pendiente' : 'aprobada'}">
                            ${asesoria.estado === 'activa' ? '🟢 Activa' : '✅ Completada'}
                        </span>
                    </div>
                </div>
                <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    ${esOrganizador ? `
                        <button class="green-btn" onclick="invitarAmigos('${asesoria.id}')">👥 Invitar Amigos</button>
                        <button class="green-btn" onclick="verParticipantes('${asesoria.id}')">👤 Ver Participantes</button>
                        ${participantesRestantes > 0 ? `<button class="green-btn" onclick="compartirEnlace('${asesoria.id}')">📤 Compartir Enlace</button>` : ''}
                        <button class="back-btn" onclick="cancelarAsesoria('${asesoria.id}')">❌ Cancelar Asesoría</button>
                    ` : `
                        ${participantesRestantes > 0 && asesoria.estado === 'activa' && !asesoria.participantes?.includes(usuarioActual) ? `
                            <button class="green-btn" onclick="unirseAsesoria('${asesoria.id}')">➕ Unirme</button>
                        ` : participantesRestantes === 0 ? '<span style="color: #999;">⚠️ Cupo lleno</span>' : ''}
                        ${asesoria.participantes?.includes(usuarioActual) && asesoria.organizador !== usuarioActual ? `
                            <button class="back-btn" onclick="salirAsesoria('${asesoria.id}')">🚪 Salir</button>
                        ` : ''}
                    `}
                </div>
                <div id="participantes_${asesoria.id}" style="display: none; margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;"></div>
            </div>
        `;
    }
    
    contenedor.innerHTML = html;
    contenedor.style.display = 'block';
    if (btnMostrar) btnMostrar.innerHTML = '📋 Ocultar Mis Asesorías';
}

async function mostrarMisAsesoriasAfiliado() {
    const contenedor = document.getElementById('contenedorAsesoriasGrupalesAfiliado');
    const btnMostrar = document.getElementById('btnVerMisAsesoriasAfiliado');
    
    if (!contenedor) return;
    
    await cargarAsesoriasGrupales();
    
    const misAsesorias = asesoriasGrupales.filter(a => 
        a.organizador === usuarioActual || (a.participantes && a.participantes.includes(usuarioActual))
    );
    
    if (misAsesorias.length === 0) {
        contenedor.innerHTML = '<div class="card" style="text-align: center;"><span style="font-size: 3rem;">👥</span><p>No tienes asesorías grupales aún. ¡Crea una!</p></div>';
        contenedor.style.display = 'block';
        if (btnMostrar) btnMostrar.innerHTML = '📋 Ocultar Mis Asesorías';
        return;
    }
    
    let html = '<h3 style="margin-bottom: 15px;">📋 Mis Asesorías Grupales (Afiliado)</h3>';
    
    for (const asesoria of misAsesorias) {
        const fechaObj = new Date(asesoria.fecha);
        const fechaFormateada = fechaObj.toLocaleDateString('es-ES');
        const participantesRestantes = asesoria.maxParticipantes - (asesoria.participantes ? asesoria.participantes.length : 1);
        const esOrganizador = asesoria.organizador === usuarioActual;
        
        html += `
            <div class="curso-disponible" style="border-left: 4px solid ${esOrganizador ? '#ff6600' : '#00a8a8'}; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap;">
                    <div>
                        <h4>${asesoria.titulo}</h4>
                        <p><strong>📚 Tema:</strong> ${asesoria.tema}</p>
                        <p>${asesoria.descripcion}</p>
                        <p><strong>📅 Fecha:</strong> ${fechaFormateada} - ${asesoria.hora} (${asesoria.duracion} horas)</p>
                        <p><strong>👥 Participantes:</strong> ${asesoria.participantes ? asesoria.participantes.length : 1}/${asesoria.maxParticipantes}</p>
                        ${asesoria.aportePorPersona > 0 ? `<p><strong>💰 Aporte:</strong> $${asesoria.aportePorPersona.toLocaleString()} por persona</p>` : '<p><strong>🎉 Asesoría Gratuita!</strong></p>'}
                        ${asesoria.enlaceVideollamada ? `<p><strong>🔗 Enlace:</strong> <a href="${asesoria.enlaceVideollamada}" target="_blank">Unirse a videollamada</a></p>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <span class="solicitud-estado estado-${asesoria.estado === 'activa' ? 'pendiente' : 'aprobada'}">
                            ${asesoria.estado === 'activa' ? '🟢 Activa' : '✅ Completada'}
                        </span>
                    </div>
                </div>
                <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    ${esOrganizador ? `
                        <button class="green-btn" onclick="invitarAmigos('${asesoria.id}')">👥 Invitar Amigos</button>
                        <button class="green-btn" onclick="verParticipantes('${asesoria.id}')">👤 Ver Participantes</button>
                        ${participantesRestantes > 0 ? `<button class="green-btn" onclick="compartirEnlace('${asesoria.id}')">📤 Compartir Enlace</button>` : ''}
                        <button class="back-btn" onclick="cancelarAsesoria('${asesoria.id}')">❌ Cancelar Asesoría</button>
                    ` : `
                        ${participantesRestantes > 0 && asesoria.estado === 'activa' && !asesoria.participantes?.includes(usuarioActual) ? `
                            <button class="green-btn" onclick="unirseAsesoria('${asesoria.id}')">➕ Unirme</button>
                        ` : participantesRestantes === 0 ? '<span style="color: #999;">⚠️ Cupo lleno</span>' : ''}
                        ${asesoria.participantes?.includes(usuarioActual) && asesoria.organizador !== usuarioActual ? `
                            <button class="back-btn" onclick="salirAsesoria('${asesoria.id}')">🚪 Salir</button>
                        ` : ''}
                    `}
                </div>
                <div id="participantes_${asesoria.id}" style="display: none; margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;"></div>
            </div>
        `;
    }
    
    contenedor.innerHTML = html;
    contenedor.style.display = 'block';
    if (btnMostrar) btnMostrar.innerHTML = '📋 Ocultar Mis Asesorías';
}

async function invitarAmigos(asesoriaId) {
    const asesoria = asesoriasGrupales.find(a => a.id === asesoriaId);
    if (!asesoria) {
        mostrarMensaje('Asesoría no encontrada', 'error');
        return;
    }
    
    asesoriaSeleccionada = asesoria;
    const enlace = `${window.location.origin}?invitacion=${asesoria.codigoInvitacion}`;
    const enlaceElement = document.getElementById('enlaceInvitacion');
    if (enlaceElement) enlaceElement.textContent = enlace;
    
    const modal = document.getElementById('modalInvitarAmigos');
    if (modal) modal.style.display = 'flex';
}

function compartirEnlace(asesoriaId) {
    invitarAmigos(asesoriaId);
}

function copiarEnlaceInvitacion() {
    const enlace = document.getElementById('enlaceInvitacion')?.textContent;
    if (enlace) {
        navigator.clipboard.writeText(enlace).then(() => {
            mostrarMensaje('Enlace copiado al portapapeles', 'exito');
        }).catch(() => {
            mostrarMensaje('No se pudo copiar el enlace', 'error');
        });
    }
}

async function enviarInvitacionEmail() {
    const email = document.getElementById('emailInvitacion')?.value.trim();
    if (!email) {
        mostrarMensaje('Ingresa un correo electrónico', 'error');
        return;
    }
    
    if (!asesoriaSeleccionada) {
        mostrarMensaje('Error: No hay asesoría seleccionada', 'error');
        return;
    }
    
    mostrarLoader(true);
    
    try {
        const invitacion = {
            asesoriaId: asesoriaSeleccionada.id,
            asesoriaTitulo: asesoriaSeleccionada.titulo,
            email: email,
            invitadoPor: usuarioActual,
            codigo: asesoriaSeleccionada.codigoInvitacion,
            fechaInvitacion: new Date().toISOString(),
            estado: 'pendiente'
        };
        
        await db.collection('invitaciones').add(invitacion);
        
        mostrarMensaje(`Invitación enviada a ${email}`, 'exito');
        const emailInput = document.getElementById('emailInvitacion');
        if (emailInput) emailInput.value = '';
        
        await db.collection('notificaciones').add({
            usuario: usuarioActual,
            mensaje: `📧 Has invitado a ${email} a la asesoría "${asesoriaSeleccionada.titulo}"`,
            fecha: new Date().toISOString(),
            leida: false
        });
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al enviar la invitación', 'error');
    }
    
    mostrarLoader(false);
}

async function unirseAsesoria(asesoriaId) {
    const asesoria = asesoriasGrupales.find(a => a.id === asesoriaId);
    
    if (!asesoria) {
        mostrarMensaje('Asesoría no encontrada', 'error');
        return;
    }
    
    if (asesoria.participantes && asesoria.participantes.length >= asesoria.maxParticipantes) {
        mostrarMensaje('Cupo completo para esta asesoría', 'error');
        return;
    }
    
    if (asesoria.participantes && asesoria.participantes.includes(usuarioActual)) {
        mostrarMensaje('Ya estás participando en esta asesoría', 'info');
        return;
    }
    
    mostrarLoader(true);
    
    try {
        const nuevosParticipantes = asesoria.participantes ? [...asesoria.participantes, usuarioActual] : [usuarioActual];
        
        await db.collection('asesoriasGrupales').doc(asesoriaId).update({
            participantes: nuevosParticipantes
        });
        
        await db.collection('notificaciones').add({
            usuario: asesoria.organizador,
            mensaje: `👤 ${usuarioActual} se ha unido a tu asesoría "${asesoria.titulo}"`,
            fecha: new Date().toISOString(),
            leida: false,
            tipo: 'asesoria'
        });
        
        await db.collection('notificaciones').add({
            usuario: usuarioActual,
            mensaje: `🎉 Te has unido a la asesoría "${asesoria.titulo}"`,
            fecha: new Date().toISOString(),
            leida: false,
            tipo: 'asesoria'
        });
        
        mostrarMensaje('Te has unido a la asesoría', 'exito');
        await cargarAsesoriasGrupales();
        
        if (tipoUsuarioActual === 'afiliado') {
            mostrarMisAsesoriasAfiliado();
        } else {
            mostrarMisAsesorias();
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al unirse a la asesoría', 'error');
    }
    
    mostrarLoader(false);
}

async function verParticipantes(asesoriaId) {
    const asesoria = asesoriasGrupales.find(a => a.id === asesoriaId);
    const divParticipantes = document.getElementById(`participantes_${asesoriaId}`);
    
    if (!asesoria || !divParticipantes) return;
    
    if (divParticipantes.style.display === 'none') {
        let participantesHtml = '<h5>👥 Lista de Participantes:</h5><ul style="margin-top: 10px;">';
        
        const participantes = asesoria.participantes || [asesoria.organizador];
        for (const participante of participantes) {
            const esOrganizador = participante === asesoria.organizador;
            participantesHtml += `<li>${participante} ${esOrganizador ? '⭐ (Organizador)' : ''}</li>`;
        }
        
        participantesHtml += `</ul><p><strong>Cupos disponibles:</strong> ${asesoria.maxParticipantes - participantes.length}</p>`;
        
        if (asesoria.aportePorPersona > 0) {
            participantesHtml += `<p><strong>Total recaudado:</strong> $${(participantes.length * asesoria.aportePorPersona).toLocaleString()}</p>`;
        }
        
        divParticipantes.innerHTML = participantesHtml;
        divParticipantes.style.display = 'block';
    } else {
        divParticipantes.style.display = 'none';
    }
}

async function salirAsesoria(asesoriaId) {
    const asesoria = asesoriasGrupales.find(a => a.id === asesoriaId);
    
    if (!asesoria) {
        mostrarMensaje('Asesoría no encontrada', 'error');
        return;
    }
    
    if (asesoria.organizador === usuarioActual) {
        mostrarMensaje('Eres el organizador. No puedes salir, solo cancelar la asesoría', 'info');
        return;
    }
    
    if (!confirm('¿Estás seguro de que quieres salir de esta asesoría?')) return;
    
    mostrarLoader(true);
    
    try {
        const nuevosParticipantes = asesoria.participantes.filter(p => p !== usuarioActual);
        
        await db.collection('asesoriasGrupales').doc(asesoriaId).update({
            participantes: nuevosParticipantes
        });
        
        await db.collection('notificaciones').add({
            usuario: asesoria.organizador,
            mensaje: `👋 ${usuarioActual} ha salido de tu asesoría "${asesoria.titulo}"`,
            fecha: new Date().toISOString(),
            leida: false
        });
        
        mostrarMensaje('Has salido de la asesoría', 'info');
        await cargarAsesoriasGrupales();
        
        if (tipoUsuarioActual === 'afiliado') {
            mostrarMisAsesoriasAfiliado();
        } else {
            mostrarMisAsesorias();
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al salir de la asesoría', 'error');
    }
    
    mostrarLoader(false);
}

async function cancelarAsesoria(asesoriaId) {
    const asesoria = asesoriasGrupales.find(a => a.id === asesoriaId);
    
    if (!asesoria) {
        mostrarMensaje('Asesoría no encontrada', 'error');
        return;
    }
    
    if (asesoria.organizador !== usuarioActual) {
        mostrarMensaje('Solo el organizador puede cancelar la asesoría', 'error');
        return;
    }
    
    if (!confirm('¿Estás seguro de que quieres cancelar esta asesoría? Los participantes serán notificados.')) return;
    
    mostrarLoader(true);
    
    try {
        await db.collection('asesoriasGrupales').doc(asesoriaId).update({
            estado: 'cancelada'
        });
        
        const participantes = asesoria.participantes || [asesoria.organizador];
        for (const participante of participantes) {
            if (participante !== usuarioActual) {
                await db.collection('notificaciones').add({
                    usuario: participante,
                    mensaje: `❌ La asesoría "${asesoria.titulo}" ha sido cancelada por el organizador`,
                    fecha: new Date().toISOString(),
                    leida: false,
                    tipo: 'asesoria'
                });
            }
        }
        
        mostrarMensaje('Asesoría cancelada', 'info');
        await cargarAsesoriasGrupales();
        
        if (tipoUsuarioActual === 'afiliado') {
            mostrarMisAsesoriasAfiliado();
        } else {
            mostrarMisAsesorias();
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cancelar la asesoría', 'error');
    }
    
    mostrarLoader(false);
}

async function mostrarInvitacionesPendientes() {
    const contenedor = document.getElementById('contenedorAsesoriasGrupales');
    const btnMostrar = document.getElementById('btnVerInvitaciones');
    
    if (!contenedor) return;
    
    try {
        const invitacionesSnap = await db.collection('invitaciones')
            .where('email', '==', usuarioActual + '@placeholder.com')
            .where('estado', '==', 'pendiente')
            .get();
        
        const invitaciones = [];
        invitacionesSnap.forEach(doc => invitaciones.push({ id: doc.id, ...doc.data() }));
        
        if (invitaciones.length === 0) {
            contenedor.innerHTML = '<div class="card" style="text-align: center;"><span style="font-size: 3rem;">📭</span><p>No tienes invitaciones pendientes</p></div>';
            contenedor.style.display = 'block';
            if (btnMostrar) btnMostrar.innerHTML = '📨 Ocultar Invitaciones';
            return;
        }
        
        let html = '<h3 style="margin-bottom: 15px;">📨 Invitaciones Pendientes</h3>';
        
        for (const invitacion of invitaciones) {
            const asesoria = asesoriasGrupales.find(a => a.id === invitacion.asesoriaId);
            if (asesoria) {
                html += `
                    <div class="curso-disponible" style="border-left: 4px solid #ff6600;">
                        <h4>${asesoria.titulo}</h4>
                        <p><strong>Invitado por:</strong> ${invitacion.invitadoPor}</p>
                        <p><strong>📅 Fecha:</strong> ${asesoria.fecha} - ${asesoria.hora}</p>
                        <p><strong>👥 Participantes:</strong> ${asesoria.participantes ? asesoria.participantes.length : 1}/${asesoria.maxParticipantes}</p>
                        <div style="margin-top: 15px;">
                            <button class="green-btn" onclick="aceptarInvitacion('${invitacion.id}', '${asesoria.id}')">✅ Aceptar</button>
                            <button class="back-btn" onclick="rechazarInvitacion('${invitacion.id}')">❌ Rechazar</button>
                        </div>
                    </div>
                `;
            }
        }
        
        contenedor.innerHTML = html;
        contenedor.style.display = 'block';
        if (btnMostrar) btnMostrar.innerHTML = '📨 Ocultar Invitaciones';
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cargar invitaciones', 'error');
    }
}

async function mostrarInvitacionesPendientesAfiliado() {
    const contenedor = document.getElementById('contenedorAsesoriasGrupalesAfiliado');
    const btnMostrar = document.getElementById('btnVerInvitacionesAfiliado');
    
    if (!contenedor) return;
    
    try {
        const invitacionesSnap = await db.collection('invitaciones')
            .where('email', '==', usuarioActual + '@placeholder.com')
            .where('estado', '==', 'pendiente')
            .get();
        
        const invitaciones = [];
        invitacionesSnap.forEach(doc => invitaciones.push({ id: doc.id, ...doc.data() }));
        
        if (invitaciones.length === 0) {
            contenedor.innerHTML = '<div class="card" style="text-align: center;"><span style="font-size: 3rem;">📭</span><p>No tienes invitaciones pendientes</p></div>';
            contenedor.style.display = 'block';
            if (btnMostrar) btnMostrar.innerHTML = '📨 Ocultar Invitaciones';
            return;
        }
        
        let html = '<h3 style="margin-bottom: 15px;">📨 Invitaciones Pendientes</h3>';
        
        for (const invitacion of invitaciones) {
            const asesoria = asesoriasGrupales.find(a => a.id === invitacion.asesoriaId);
            if (asesoria) {
                html += `
                    <div class="curso-disponible" style="border-left: 4px solid #ff6600;">
                        <h4>${asesoria.titulo}</h4>
                        <p><strong>Invitado por:</strong> ${invitacion.invitadoPor}</p>
                        <p><strong>📅 Fecha:</strong> ${asesoria.fecha} - ${asesoria.hora}</p>
                        <p><strong>👥 Participantes:</strong> ${asesoria.participantes ? asesoria.participantes.length : 1}/${asesoria.maxParticipantes}</p>
                        <div style="margin-top: 15px;">
                            <button class="green-btn" onclick="aceptarInvitacion('${invitacion.id}', '${asesoria.id}')">✅ Aceptar</button>
                            <button class="back-btn" onclick="rechazarInvitacion('${invitacion.id}')">❌ Rechazar</button>
                        </div>
                    </div>
                `;
            }
        }
        
        contenedor.innerHTML = html;
        contenedor.style.display = 'block';
        if (btnMostrar) btnMostrar.innerHTML = '📨 Ocultar Invitaciones';
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cargar invitaciones', 'error');
    }
}

async function aceptarInvitacion(invitacionId, asesoriaId) {
    mostrarLoader(true);
    
    try {
        await unirseAsesoria(asesoriaId);
        
        await db.collection('invitaciones').doc(invitacionId).update({
            estado: 'aceptada',
            fechaRespuesta: new Date().toISOString()
        });
        
        mostrarMensaje('Invitación aceptada', 'exito');
        await cargarAsesoriasGrupales();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al aceptar la invitación', 'error');
    }
    
    mostrarLoader(false);
}

async function rechazarInvitacion(invitacionId) {
    if (!confirm('¿Rechazar esta invitación?')) return;
    
    mostrarLoader(true);
    
    try {
        await db.collection('invitaciones').doc(invitacionId).update({
            estado: 'rechazada',
            fechaRespuesta: new Date().toISOString()
        });
        
        mostrarMensaje('Invitación rechazada', 'info');
        mostrarInvitacionesPendientes();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al rechazar la invitación', 'error');
    }
    
    mostrarLoader(false);
}

function toggleAsesorias() {
    const contenedor = document.getElementById('contenedorAsesoriasGrupales');
    const btn = document.getElementById('btnVerMisAsesorias');
    
    if (!contenedor) return;
    
    if (contenedor.style.display === 'none' || contenedor.style.display === '') {
        mostrarMisAsesorias();
    } else {
        contenedor.style.display = 'none';
        if (btn) btn.innerHTML = '📋 Ver Mis Asesorías';
    }
}

function toggleAsesoriasAfiliado() {
    const contenedor = document.getElementById('contenedorAsesoriasGrupalesAfiliado');
    const btn = document.getElementById('btnVerMisAsesoriasAfiliado');
    
    if (!contenedor) return;
    
    if (contenedor.style.display === 'none' || contenedor.style.display === '') {
        mostrarMisAsesoriasAfiliado();
    } else {
        contenedor.style.display = 'none';
        if (btn) btn.innerHTML = '📋 Ver Mis Asesorías';
    }
}

function toggleInvitaciones() {
    const contenedor = document.getElementById('contenedorAsesoriasGrupales');
    const btn = document.getElementById('btnVerInvitaciones');
    
    if (!contenedor) return;
    
    if (contenedor.style.display === 'none' || contenedor.style.display === '') {
        mostrarInvitacionesPendientes();
    } else {
        contenedor.style.display = 'none';
        if (btn) btn.innerHTML = '📨 Invitaciones Pendientes';
    }
}

function toggleInvitacionesAfiliado() {
    const contenedor = document.getElementById('contenedorAsesoriasGrupalesAfiliado');
    const btn = document.getElementById('btnVerInvitacionesAfiliado');
    
    if (!contenedor) return;
    
    if (contenedor.style.display === 'none' || contenedor.style.display === '') {
        mostrarInvitacionesPendientesAfiliado();
    } else {
        contenedor.style.display = 'none';
        if (btn) btn.innerHTML = '📨 Invitaciones Pendientes';
    }
}

// ========== INDICACIONES DEL PROFESOR ==========
async function mostrarFormularioIndicaciones(solicitudId, estudiante, cursoNombre) {
    const formularioExistente = document.getElementById(`formIndicaciones_${solicitudId}`);
    if (formularioExistente) {
        formularioExistente.remove();
        return;
    }
    
    const solicitudDiv = document.querySelector(`.solicitud-item[data-id="${solicitudId}"]`);
    if (!solicitudDiv) return;
    
    const formHtml = `
        <div id="formIndicaciones_${solicitudId}" class="form-indicaciones">
            <h4 style="margin-bottom: 10px; color: #333;">📨 Enviar Indicaciones a ${estudiante}</h4>
            <textarea id="mensajeIndicacion_${solicitudId}" rows="3" placeholder="Escribe las indicaciones para el estudiante..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px;"></textarea>
            <input type="text" id="enlaceIndicacion_${solicitudId}" placeholder="🔗 Enlace del curso o material (opcional)" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; gap: 10px;">
                <button class="green-btn" onclick="enviarIndicacion('${solicitudId}', '${estudiante}', '${cursoNombre.replace(/'/g, "\\'")}')">📤 Enviar Indicación</button>
                <button class="back-btn" onclick="cerrarFormularioIndicaciones('${solicitudId}')">Cancelar</button>
            </div>
        </div>
    `;
    solicitudDiv.insertAdjacentHTML('beforeend', formHtml);
}

function cerrarFormularioIndicaciones(solicitudId) {
    const formulario = document.getElementById(`formIndicaciones_${solicitudId}`);
    if (formulario) formulario.remove();
}

async function enviarIndicacion(solicitudId, estudiante, cursoNombre) {
    const mensaje = document.getElementById(`mensajeIndicacion_${solicitudId}`)?.value.trim();
    const enlace = document.getElementById(`enlaceIndicacion_${solicitudId}`)?.value.trim();
    
    if (!mensaje) {
        mostrarMensaje('Escribe un mensaje para el estudiante', 'error');
        return;
    }
    
    mostrarLoader(true);
    
    try {
        const nuevaIndicacion = {
            solicitudId: solicitudId,
            profesor: usuarioActual,
            estudiante: estudiante,
            cursoNombre: cursoNombre,
            mensaje: mensaje,
            enlace: enlace || null,
            fecha: new Date().toISOString(),
            leida: false,
            tipo: 'indicacion'
        };
        
        const docRef = await db.collection('indicaciones').add(nuevaIndicacion);
        
        await db.collection('notificaciones').add({
            usuario: estudiante,
            mensaje: `📨 El profesor ${usuarioActual} te ha enviado indicaciones para el curso "${cursoNombre}"`,
            fecha: new Date().toISOString(),
            leida: false,
            tipo: 'indicacion',
            indicacionId: docRef.id,
            solicitudId: solicitudId,
            cursoNombre: cursoNombre
        });
        
        cerrarFormularioIndicaciones(solicitudId);
        await cargarSolicitudesProfesor();
        await cargarDatosFirebase();
        
        mostrarMensaje('Indicaciones enviadas exitosamente', 'exito');
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al enviar las indicaciones', 'error');
    }
    mostrarLoader(false);
}

async function cargarIndicacionesDeSolicitud(solicitudId) {
    const contenedor = document.getElementById(`indicacionesLista_${solicitudId}`);
    if (!contenedor) return;
    
    const indicaciones = indicacionesData.filter(ind => ind.solicitudId === solicitudId).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    if (indicaciones.length === 0) {
        contenedor.innerHTML = '';
        return;
    }
    
    let html = '<div style="margin-top: 15px;"><h5 style="color: #555; margin-bottom: 10px;">📋 Indicaciones enviadas:</h5>';
    
    indicaciones.forEach(ind => {
        const fecha = new Date(ind.fecha).toLocaleString('es-ES');
        html += `
            <div style="background: #f0f0f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; border-left: 3px solid #ff6600;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong style="color: #ff6600;">📨 Para: ${ind.estudiante}</strong>
                    <small style="color: #666;">${fecha}</small>
                </div>
                <p style="margin: 8px 0; color: #333;">${ind.mensaje.replace(/\n/g, '<br>')}</p>
                ${ind.enlace ? `<a href="${ind.enlace}" target="_blank" style="color: #00a8a8;">🔗 ${ind.enlace}</a>` : ''}
                <div style="margin-top: 8px;">
                    <span style="font-size: 0.8rem; color: ${ind.leida ? '#28a745' : '#ff6600'};">
                        ${ind.leida ? '✅ Vista por el estudiante' : '⏳ Pendiente de revisión'}
                    </span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    contenedor.innerHTML = html;
}

// ========== DASHBOARD AFILIADO ==========
function cargarDashboardAfiliado() {
    const nombreAfiliado = document.getElementById('nombreAfiliado');
    if (nombreAfiliado) nombreAfiliado.textContent = usuarioActual;
    
    const afiliacion = afiliadosData.find(a => a.usuario === usuarioActual);
    const user = usuarios.find(x => x.u === usuarioActual);
    const planActivo = user?.plan || afiliacion?.plan;
    const nombres = { basico: 'Afiliado Básico', premium: 'Afiliado Premium', corporativo: 'Afiliado Corporativo' };
    const beneficios = {
        basico: ['✅ 3 asesorías mensuales', '✅ Descuento 15%', '✅ Webinars mensuales'],
        premium: ['✅ 8 asesorías mensuales', '✅ Descuento 25%', '✅ Workshops semanales', '✅ Mentoría quincenal'],
        corporativo: ['✅ Asesorías ilimitadas', '✅ Descuento 35%', '✅ Eventos exclusivos', '✅ Hasta 5 usuarios']
    };
    
    const planAfiliadoNombre = document.getElementById('planAfiliadoNombre');
    if (planAfiliadoNombre) planAfiliadoNombre.textContent = nombres[planActivo] || 'Plan Activo';
    
    const beneficiosActivos = document.getElementById('beneficiosActivos');
    if (beneficiosActivos && planActivo) {
        beneficiosActivos.innerHTML = (beneficios[planActivo] || beneficios.basico).map(b => `<p>${b}</p>`).join('');
    }
    
    cargarNotificacionesAfiliado();
    cargarCursosDisponiblesAfiliado();
}

function cargarCursosDisponiblesAfiliado() {
    const div = document.getElementById('listaCursosAf');
    if (!div) return;
    const filtrados = cursosData.filter(c => !cursosRechazadosEnSesion.includes(c.id));
    if (filtrados.length === 0) { div.innerHTML = '<p>No hay cursos disponibles</p>'; return; }
    div.innerHTML = '<h3>📚 Cursos Disponibles (Prioridad Afiliados)</h3>' + filtrados.map(c => `
        <div class="curso-disponible" style="border-left: 5px solid #ff6600;">
            <h4>${c.nombre}</h4><p>Profesor: ${c.profesor}</p><p>${c.descripcion}</p>
            <select id="horarioSelAf_${c.id}">${c.horarios.map(h => `<option>${h}</option>`).join('')}</select>
            <button class="green-btn" onclick="solicitarCursoAfiliado('${c.id}')">Solicitar (Prioritario)</button>
            <button class="back-btn" onclick="rechazarCursoAf('${c.id}')">Rechazar</button>
        </div>
    `).join('');
}

async function cargarNotificacionesAfiliado() {
    const div = document.getElementById('notificacionesAf');
    if (!div) return;
    
    const misNotis = notificacionesData.filter(n => n.usuario === usuarioActual).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    if (misNotis.length === 0) { div.innerHTML = '<div style="text-align: center; padding: 40px;"><span style="font-size: 3rem;">📭</span><p>No hay notificaciones</p></div>'; return; }
    
    div.innerHTML = '';
    
    for (const notificacion of misNotis) {
        const fecha = new Date(notificacion.fecha).toLocaleString('es-ES');
        let contenidoExtra = '';
        
        if (notificacion.tipo === 'indicacion' && notificacion.indicacionId) {
            const indicacion = indicacionesData.find(ind => ind.id === notificacion.indicacionId);
            if (indicacion) {
                contenidoExtra = `
                    <div style="background: #fff8e1; border-radius: 8px; padding: 15px; margin-top: 10px; border-left: 3px solid #ff6600;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <strong style="color: #ff6600;">📨 Indicaciones del profesor ${indicacion.profesor}</strong>
                            <small>${new Date(indicacion.fecha).toLocaleString('es-ES')}</small>
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 8px; margin: 10px 0;">
                            <p style="margin: 0; white-space: pre-wrap;">${indicacion.mensaje.replace(/\n/g, '<br>')}</p>
                        </div>
                        ${indicacion.enlace ? `<a href="${indicacion.enlace}" target="_blank" style="color: #00a8a8;">🔗 ${indicacion.enlace}</a>` : ''}
                        <div style="margin-top: 10px;">
                            <button class="green-btn" onclick="marcarIndicacionComoLeida('${indicacion.id}', '${notificacion.id}')">✅ Marcar como leída</button>
                        </div>
                    </div>
                `;
            }
        }
        
        div.innerHTML += `
            <div class="notificacion-item" style="border-left: 4px solid #ff6600;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div><strong>⭐ ${notificacion.mensaje}</strong>${!notificacion.leida ? '<span style="background: #ff6600; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; margin-left: 8px;">NUEVA</span>' : ''}</div>
                    <small style="color: #666;">${fecha}</small>
                </div>
                ${contenidoExtra}
                <div style="margin-top: 10px;">
                    ${!notificacion.leida && notificacion.tipo !== 'indicacion' ? `<button class="green-btn" onclick="marcarNotificacionComoLeida('${notificacion.id}')">✅ Marcar como leída</button>` : ''}
                    <button class="back-btn" onclick="eliminarNotificacion('${notificacion.id}')">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    }
}

async function solicitarCursoAfiliado(cursoId) {
    const curso = cursosData.find(c => c.id === cursoId);
    const horario = document.getElementById(`horarioSelAf_${cursoId}`).value;
    if (!horario) { mostrarMensaje('Selecciona horario', 'error'); return; }
    mostrarLoader(true);
    try {
        await db.collection('solicitudes').add({ estudiante: usuarioActual, cursoId, cursoNombre: curso.nombre, horarioSolicitado: horario, fechaSolicitud: new Date().toISOString(), estado: 'pendiente', prioridad: 'alta' });
        await db.collection('notificaciones').add({ usuario: usuarioActual, mensaje: `📚 Has solicitado el curso "${curso.nombre}" con prioridad`, fecha: new Date().toISOString(), leida: false });
        mostrarMensaje('Solicitud enviada con prioridad', 'exito');
        await cargarDatosFirebase();
        cargarNotificacionesAfiliado();
    } catch (error) { console.error(error); mostrarMensaje('Error', 'error'); }
    mostrarLoader(false);
}

function rechazarCursoAf(cursoId) { cursosRechazadosEnSesion.push(cursoId); cargarCursosDisponiblesAfiliado(); }

async function enviarSolicitudAfiliado() {
    const nombre = document.getElementById('cursoEstudianteAf')?.value.trim();
    const desc = document.getElementById('descripcionCursoAf')?.value.trim();
    const fecha = document.getElementById('fechaCursoAf')?.value;
    const horario = document.getElementById('horarioCursoAf')?.value;
    if (!nombre || !desc || !fecha || !horario) { mostrarMensaje('Completa todos los campos', 'error'); return; }
    mostrarLoader(true);
    try {
        await db.collection('solicitudes').add({ estudiante: usuarioActual, cursoNombre: nombre, descripcion: desc, fechaSolicitada: fecha, horarioSolicitado: horario, estado: 'pendiente', tipo: 'manual', prioridad: 'alta' });
        await db.collection('notificaciones').add({ usuario: usuarioActual, mensaje: `📝 Solicitud personalizada: "${nombre}" (Prioridad)`, fecha: new Date().toISOString(), leida: false });
        mostrarMensaje('Solicitud prioritaria enviada', 'exito');
        const cursoEstudianteAf = document.getElementById('cursoEstudianteAf');
        const descripcionCursoAf = document.getElementById('descripcionCursoAf');
        const fechaCursoAf = document.getElementById('fechaCursoAf');
        if (cursoEstudianteAf) cursoEstudianteAf.value = '';
        if (descripcionCursoAf) descripcionCursoAf.value = '';
        if (fechaCursoAf) fechaCursoAf.value = '';
        await cargarDatosFirebase();
    } catch (error) { console.error(error); mostrarMensaje('Error', 'error'); }
    mostrarLoader(false);
}

// ========== FUNCIONES ESTUDIANTE ==========
function actualizarInfoPlanEstudiante() {
    const estudiante = usuarios.find(x => x.u === usuarioActual);
    const planName = document.getElementById('planName');
    const nombreEstudiante = document.getElementById('nombreEstudiante');
    const nombreProfesor = document.getElementById('nombreProfesor');
    
    if (planName) planName.textContent = estudiante?.plan ? `Plan: ${estudiante.plan.toUpperCase()}` : 'Sin Plan Activo';
    if (nombreEstudiante) nombreEstudiante.textContent = usuarioActual;
    if (nombreProfesor) nombreProfesor.textContent = usuarioActual;
}

function cargarCursosDisponibles() {
    const div = document.getElementById('listaCursos');
    if (!div) return;
    const filtrados = cursosData.filter(c => !cursosRechazadosEnSesion.includes(c.id));
    if (filtrados.length === 0) { div.innerHTML = '<p>No hay cursos disponibles</p>'; return; }
    div.innerHTML = '<h3>📚 Cursos Disponibles</h3>' + filtrados.map(c => `
        <div class="curso-disponible">
            <h4>${c.nombre}</h4><p>Profesor: ${c.profesor}</p><p>${c.descripcion}</p>
            <select id="horarioSel_${c.id}">${c.horarios.map(h => `<option>${h}</option>`).join('')}</select>
            <button class="green-btn" onclick="solicitarCurso('${c.id}')">Solicitar</button>
            <button class="back-btn" onclick="rechazarCurso('${c.id}')">Rechazar</button>
        </div>
    `).join('');
}

function toggleCursos() {
    const div = document.getElementById('listaCursos');
    const btn = document.getElementById('btnVerCursos');
    if (!div || !btn) return;
    if (cursosMostrados) { div.innerHTML = ''; btn.innerHTML = 'Ver Cursos Disponibles'; }
    else { cargarCursosDisponibles(); btn.innerHTML = 'Ocultar Cursos'; }
    cursosMostrados = !cursosMostrados;
}

async function solicitarCurso(cursoId) {
    const curso = cursosData.find(c => c.id === cursoId);
    const horario = document.getElementById(`horarioSel_${cursoId}`).value;
    if (!horario) { mostrarMensaje('Selecciona horario', 'error'); return; }
    mostrarLoader(true);
    try {
        await db.collection('solicitudes').add({ estudiante: usuarioActual, cursoId, cursoNombre: curso.nombre, horarioSolicitado: horario, fechaSolicitud: new Date().toISOString(), estado: 'pendiente' });
        await db.collection('notificaciones').add({ usuario: usuarioActual, mensaje: `📚 Has solicitado el curso "${curso.nombre}"`, fecha: new Date().toISOString(), leida: false });
        mostrarMensaje('Solicitud enviada', 'exito');
        await cargarDatosFirebase();
        cargarNotificaciones();
    } catch (error) { console.error(error); mostrarMensaje('Error', 'error'); }
    mostrarLoader(false);
}

function rechazarCurso(cursoId) { cursosRechazadosEnSesion.push(cursoId); cargarCursosDisponibles(); }

async function enviarSolicitud() {
    const nombre = document.getElementById('cursoEstudiante')?.value.trim();
    const desc = document.getElementById('descripcionCurso')?.value.trim();
    const fecha = document.getElementById('fechaCurso')?.value;
    const horario = document.getElementById('horarioCurso')?.value;
    if (!nombre || !desc || !fecha || !horario) { mostrarMensaje('Completa todos los campos', 'error'); return; }
    mostrarLoader(true);
    try {
        await db.collection('solicitudes').add({ estudiante: usuarioActual, cursoNombre: nombre, descripcion: desc, fechaSolicitada: fecha, horarioSolicitado: horario, estado: 'pendiente', tipo: 'manual' });
        await db.collection('notificaciones').add({ usuario: usuarioActual, mensaje: `📝 Solicitud personalizada: "${nombre}"`, fecha: new Date().toISOString(), leida: false });
        mostrarMensaje('Solicitud enviada', 'exito');
        const cursoEstudiante = document.getElementById('cursoEstudiante');
        const descripcionCurso = document.getElementById('descripcionCurso');
        const fechaCurso = document.getElementById('fechaCurso');
        if (cursoEstudiante) cursoEstudiante.value = '';
        if (descripcionCurso) descripcionCurso.value = '';
        if (fechaCurso) fechaCurso.value = '';
        await cargarDatosFirebase();
    } catch (error) { console.error(error); mostrarMensaje('Error', 'error'); }
    mostrarLoader(false);
}

async function cargarNotificaciones() {
    const div = document.getElementById('notificaciones');
    if (!div) return;
    
    const misNotis = notificacionesData.filter(n => n.usuario === usuarioActual).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    if (misNotis.length === 0) { div.innerHTML = '<div style="text-align: center; padding: 40px;"><span style="font-size: 3rem;">📭</span><p>No hay notificaciones</p></div>'; return; }
    
    div.innerHTML = '';
    
    for (const notificacion of misNotis) {
        const fecha = new Date(notificacion.fecha).toLocaleString('es-ES');
        let contenidoExtra = '';
        let estiloBorde = 'border-left: 4px solid #00a8a8;';
        
        if (notificacion.tipo === 'indicacion' && notificacion.indicacionId) {
            const indicacion = indicacionesData.find(ind => ind.id === notificacion.indicacionId);
            if (indicacion) {
                estiloBorde = 'border-left: 4px solid #ff6600;';
                contenidoExtra = `
                    <div style="background: #fff8e1; border-radius: 8px; padding: 15px; margin-top: 10px; border-left: 3px solid #ff6600;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <strong style="color: #ff6600;">📨 Indicaciones del profesor ${indicacion.profesor}</strong>
                            <small>${new Date(indicacion.fecha).toLocaleString('es-ES')}</small>
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 8px; margin: 10px 0;">
                            <p style="margin: 0; white-space: pre-wrap;">${indicacion.mensaje.replace(/\n/g, '<br>')}</p>
                        </div>
                        ${indicacion.enlace ? `<a href="${indicacion.enlace}" target="_blank" style="color: #00a8a8;">🔗 ${indicacion.enlace}</a>` : ''}
                        <div style="margin-top: 10px;">
                            <button class="green-btn" onclick="marcarIndicacionComoLeida('${indicacion.id}', '${notificacion.id}')">✅ Marcar como leída</button>
                        </div>
                    </div>
                `;
            }
        }
        
        div.innerHTML += `
            <div class="notificacion-item ${!notificacion.leida ? 'nueva' : ''}" style="${estiloBorde}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div><strong>${notificacion.mensaje}</strong>${!notificacion.leida ? '<span style="background: #2196f3; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; margin-left: 8px;">NUEVA</span>' : ''}</div>
                    <small style="color: #666;">${fecha}</small>
                </div>
                ${contenidoExtra}
                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    ${!notificacion.leida && notificacion.tipo !== 'indicacion' ? `<button class="green-btn" onclick="marcarNotificacionComoLeida('${notificacion.id}')">✅ Marcar como leída</button>` : ''}
                    <button class="back-btn" onclick="eliminarNotificacion('${notificacion.id}')">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    }
}

async function marcarIndicacionComoLeida(indicacionId, notificacionId) {
    mostrarLoader(true);
    try {
        await db.collection('indicaciones').doc(indicacionId).update({ leida: true });
        await db.collection('notificaciones').doc(notificacionId).update({ leida: true });
        mostrarMensaje('Indicación marcada como leída', 'exito');
        await cargarDatosFirebase();
        cargarNotificaciones();
        if (document.getElementById('afiliadoDashboard').style.display === 'block') cargarNotificacionesAfiliado();
    } catch (error) { console.error(error); mostrarMensaje('Error', 'error'); }
    mostrarLoader(false);
}

async function marcarNotificacionComoLeida(notificacionId) {
    try {
        await db.collection('notificaciones').doc(notificacionId).update({ leida: true });
        await cargarDatosFirebase();
        cargarNotificaciones();
        mostrarMensaje('Notificación marcada como leída', 'exito');
    } catch (error) { console.error(error); }
}

async function eliminarNotificacion(notificacionId) {
    if (confirm('¿Eliminar esta notificación?')) {
        try {
            await db.collection('notificaciones').doc(notificacionId).delete();
            await cargarDatosFirebase();
            cargarNotificaciones();
            mostrarMensaje('Notificación eliminada', 'exito');
        } catch (error) { console.error(error); mostrarMensaje('Error al eliminar', 'error'); }
    }
}

// ========== FUNCIONES PROFESOR ==========
function cargarCheckboxHorarios() {
    const div = document.getElementById('checkboxHorarios');
    if (!div) return;
    div.innerHTML = ["08:00-10:00", "10:30-12:30", "13:00-15:00", "15:30-17:30"].map((h, i) => `<div><input type="checkbox" value="${h}" id="h${i}"> <label>${h}</label></div>`).join('');
}

function cargarHorariosProfesor() {
    const div = document.getElementById('horariosProfesor');
    if (!div) return;
    const misCursos = cursosData.filter(c => c.profesor === usuarioActual);
    if (misCursos.length === 0) { div.innerHTML = '<p>No has publicado cursos</p>'; return; }
    div.innerHTML = misCursos.map(c => `<div class="curso-disponible"><h4>${c.nombre}</h4><p>${c.descripcion} - ${c.fecha}</p><p>Horarios: ${c.horarios.join(', ')}</p><button class="back-btn" onclick="eliminarCurso('${c.id}')">Eliminar</button></div>`).join('');
}

async function publicarCurso() {
    const nombre = document.getElementById('nombreCurso')?.value.trim();
    const desc = document.getElementById('descripcionTemasCurso')?.value.trim();
    const fecha = document.getElementById('fechaCursoProfesor')?.value;
    const checkboxes = document.querySelectorAll('#checkboxHorarios input:checked');
    const horarios = Array.from(checkboxes).map(cb => cb.value);
    if (!nombre || !desc || !fecha || horarios.length === 0) { mostrarMensaje('Completa todos los campos', 'error'); return; }
    mostrarLoader(true);
    try {
        await db.collection('cursos').add({ nombre, descripcion: desc, fecha, horarios, profesor: usuarioActual, fechaPublicacion: new Date().toISOString() });
        mostrarMensaje('Curso publicado', 'exito');
        const nombreCurso = document.getElementById('nombreCurso');
        const descripcionTemasCurso = document.getElementById('descripcionTemasCurso');
        const fechaCursoProfesor = document.getElementById('fechaCursoProfesor');
        if (nombreCurso) nombreCurso.value = '';
        if (descripcionTemasCurso) descripcionTemasCurso.value = '';
        if (fechaCursoProfesor) fechaCursoProfesor.value = '';
        document.querySelectorAll('#checkboxHorarios input').forEach(cb => cb.checked = false);
        await cargarDatosFirebase();
        cargarHorariosProfesor();
    } catch (error) { console.error(error); mostrarMensaje('Error', 'error'); }
    mostrarLoader(false);
}

async function eliminarCurso(cursoId) {
    if (confirm('¿Eliminar este curso?')) {
        mostrarLoader(true);
        try { await db.collection('cursos').doc(cursoId).delete(); await cargarDatosFirebase(); cargarHorariosProfesor(); mostrarMensaje('Curso eliminado', 'exito'); } 
        catch (error) { console.error(error); mostrarMensaje('Error', 'error'); }
        mostrarLoader(false);
    }
}

async function cargarSolicitudesProfesor() {
    const div = document.getElementById('solicitudes');
    if (!div) return;
    
    mostrarLoader(true);
    
    try {
        const cursosSnap = await db.collection('cursos').where('profesor', '==', usuarioActual).get();
        const misCursosIds = [];
        cursosSnap.forEach(doc => misCursosIds.push(doc.id));
        
        const misSolicitudes = solicitudesData.filter(s => misCursosIds.includes(s.cursoId) || s.tipo === 'manual');
        
        if (misSolicitudes.length === 0) {
            div.innerHTML = '<div style="text-align: center; padding: 40px;"><span style="font-size: 3rem;">📭</span><p>No hay solicitudes pendientes.</p></div>';
            mostrarLoader(false);
            return;
        }
        
        div.innerHTML = '';
        
        for (const solicitud of misSolicitudes) {
            const fechaSolicitud = new Date(solicitud.fechaSolicitud).toLocaleString('es-ES');
            const cursoNombre = solicitud.cursoNombre || (solicitud.cursoId ? 'Curso' : 'Personalizado');
            
            const solicitudDiv = document.createElement('div');
            solicitudDiv.className = 'solicitud-item';
            solicitudDiv.setAttribute('data-id', solicitud.id);
            solicitudDiv.setAttribute('data-estudiante', solicitud.estudiante);
            solicitudDiv.setAttribute('data-curso', cursoNombre);
            
            solicitudDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <p><strong>👨‍🎓 Estudiante:</strong> ${solicitud.estudiante} ${solicitud.prioridad ? '<span style="background: #ff6600; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem;">⭐ PRIORITARIO</span>' : ''}</p>
                        <p><strong>📚 Curso:</strong> ${cursoNombre}</p>
                        <p><strong>🕐 Horario solicitado:</strong> ${solicitud.horarioSolicitado || 'No especificado'}</p>
                        ${solicitud.fechaSolicitada ? `<p><strong>📅 Fecha:</strong> ${solicitud.fechaSolicitada}</p>` : ''}
                        ${solicitud.descripcion ? `<p><strong>📝 Descripción:</strong> ${solicitud.descripcion}</p>` : ''}
                        <p><strong>📅 Solicitud:</strong> ${fechaSolicitud}</p>
                    </div>
                    <div>
                        <span class="solicitud-estado estado-${solicitud.estado}">${solicitud.estado.toUpperCase()}</span>
                    </div>
                </div>
                
                <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    ${solicitud.estado === 'pendiente' ? `
                        <button class="green-btn" onclick="aprobarSolicitud('${solicitud.id}')">✅ Aprobar</button>
                        <button class="back-btn" onclick="rechazarSolicitud('${solicitud.id}')">❌ Rechazar</button>
                    ` : ''}
                    <button class="btn-enviar-indicacion" onclick="mostrarFormularioIndicaciones('${solicitud.id}', '${solicitud.estudiante}', '${cursoNombre.replace(/'/g, "\\'")}')">📨 Enviar Indicaciones</button>
                </div>
                
                <div id="indicacionesLista_${solicitud.id}"></div>
            `;
            
            div.appendChild(solicitudDiv);
            await cargarIndicacionesDeSolicitud(solicitud.id);
        }
        
    } catch (error) {
        console.error('Error:', error);
        div.innerHTML = '<p style="color: red;">Error al cargar las solicitudes</p>';
    }
    
    mostrarLoader(false);
}

async function aprobarSolicitud(id) {
    mostrarLoader(true);
    try {
        const solicitud = solicitudesData.find(s => s.id === id);
        if (!solicitud) throw new Error('Solicitud no encontrada');
        
        await db.collection('solicitudes').doc(id).update({ estado: 'aprobada' });
        
        await db.collection('notificaciones').add({
            usuario: solicitud.estudiante,
            mensaje: `✅ Tu solicitud para el curso "${solicitud.cursoNombre || 'personalizado'}" fue APROBADA por el profesor ${usuarioActual}`,
            fecha: new Date().toISOString(),
            leida: false,
            tipo: 'aprobacion'
        });
        
        await cargarDatosFirebase();
        await cargarSolicitudesProfesor();
        mostrarMensaje('Solicitud aprobada', 'exito');
    } catch (error) { console.error(error); mostrarMensaje('Error', 'error'); }
    mostrarLoader(false);
}

async function rechazarSolicitud(id) {
    mostrarLoader(true);
    try {
        const solicitud = solicitudesData.find(s => s.id === id);
        if (!solicitud) throw new Error('Solicitud no encontrada');
        
        await db.collection('solicitudes').doc(id).update({ estado: 'rechazada' });
        
        await db.collection('notificaciones').add({
            usuario: solicitud.estudiante,
            mensaje: `❌ Tu solicitud para el curso "${solicitud.cursoNombre || 'personalizado'}" fue RECHAZADA por el profesor ${usuarioActual}`,
            fecha: new Date().toISOString(),
            leida: false,
            tipo: 'rechazo'
        });
        
        await cargarDatosFirebase();
        await cargarSolicitudesProfesor();
        mostrarMensaje('Solicitud rechazada', 'info');
    } catch (error) { console.error(error); mostrarMensaje('Error', 'error'); }
    mostrarLoader(false);
}

// ========== MODALES ==========
function mostrarCanalesContacto() { 
    const modal = document.getElementById('modalCanales');
    if (modal) modal.style.display = 'flex';
}
function mostrarMediosPago() { 
    const modal = document.getElementById('modalMediosPago');
    if (modal) modal.style.display = 'flex';
}
function mostrarTurnoVirtual() { 
    const modal = document.getElementById('modalTurno');
    if (modal) modal.style.display = 'flex';
}
function mostrarDirectorioMedico() { 
    const listaAsesores = document.getElementById('listaAsesores');
    if (listaAsesores) listaAsesores.innerHTML = '<p>👨‍🏫 Dr. Juan Pérez</p><p>👩‍🏫 Dra. María Gómez</p>';
    const modal = document.getElementById('modalDirectorio');
    if (modal) modal.style.display = 'flex';
}
function mostrarCertificadoDiscapacidad() { 
    const modal = document.getElementById('modalCertificado');
    if (modal) modal.style.display = 'flex';
}
function mostrarCursosDestacados() { mostrarMensaje('Próximamente', 'info'); }
function solicitarTurno() { 
    cerrarModal('modalTurno'); 
    mostrarMensaje('Turno solicitado', 'exito'); 
}
function solicitarCertificado() { 
    cerrarModal('modalCertificado'); 
    mostrarMensaje('Certificado solicitado', 'exito'); 
}
function cerrarModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none'; 
}

// ========== INICIALIZACIÓN DE EVENTOS ==========
function inicializarEventos() {
    const logoInicio = document.getElementById('logoInicio');
    const navInicio = document.getElementById('navInicio');
    const navAfiliados = document.getElementById('navAfiliados');
    const btnIniciarSesionHeader = document.getElementById('btnIniciarSesionHeader');
    const servicioLogin = document.getElementById('servicioLogin');
    const servicioRegistro = document.getElementById('servicioRegistro');
    const servicioAfiliado = document.getElementById('servicioAfiliado');
    const btnVolverInicioAfiliados = document.getElementById('btnVolverInicioAfiliados');
    const btnVolverInicioPlanes = document.getElementById('btnVolverInicioPlanes');
    
    if (logoInicio) logoInicio.addEventListener('click', mostrarInicio);
    if (navInicio) navInicio.addEventListener('click', mostrarInicio);
    if (navAfiliados) navAfiliados.addEventListener('click', mostrarAfiliados);
    if (btnIniciarSesionHeader) btnIniciarSesionHeader.addEventListener('click', mostrarLogin);
    if (servicioLogin) servicioLogin.addEventListener('click', mostrarLogin);
    if (servicioRegistro) servicioRegistro.addEventListener('click', mostrarRegistro);
    if (servicioAfiliado) servicioAfiliado.addEventListener('click', mostrarAfiliados);
    if (btnVolverInicioAfiliados) btnVolverInicioAfiliados.addEventListener('click', volverInicio);
    if (btnVolverInicioPlanes) btnVolverInicioPlanes.addEventListener('click', volverInicio);
    
    document.querySelectorAll('.plan-btn').forEach(btn => {
        btn.addEventListener('click', () => seleccionarPlan(btn.getAttribute('data-plan')));
    });
    document.querySelectorAll('.afiliado-btn').forEach(btn => {
        btn.addEventListener('click', () => mostrarPagoAfiliado(btn.getAttribute('data-plan')));
    });
    
    const btnContinuarPago = document.getElementById('btnContinuarPago');
    const btnCancelarPago = document.getElementById('btnCancelarPago');
    const btnRegresarPaso = document.getElementById('btnRegresarPaso');
    const metodoTarjeta = document.getElementById('metodoTarjeta');
    const metodoDaviplata = document.getElementById('metodoDaviplata');
    const btnPagarTarjeta = document.getElementById('btnPagarTarjeta');
    const btnPagarDaviplata = document.getElementById('btnPagarDaviplata');
    const btnIrDashboard = document.getElementById('btnIrDashboard');
    const btnDescargarComprobante = document.getElementById('btnDescargarComprobante');
    
    if (btnContinuarPago) btnContinuarPago.addEventListener('click', () => siguientePaso());
    if (btnCancelarPago) btnCancelarPago.addEventListener('click', volverInicio);
    if (btnRegresarPaso) btnRegresarPaso.addEventListener('click', anteriorPaso);
    if (metodoTarjeta) metodoTarjeta.addEventListener('click', () => seleccionarMetodo('tarjeta'));
    if (metodoDaviplata) metodoDaviplata.addEventListener('click', () => seleccionarMetodo('daviplata'));
    if (btnPagarTarjeta) btnPagarTarjeta.addEventListener('click', () => siguientePaso());
    if (btnPagarDaviplata) btnPagarDaviplata.addEventListener('click', () => siguientePaso());
    if (btnIrDashboard) btnIrDashboard.addEventListener('click', irAlDashboard);
    if (btnDescargarComprobante) btnDescargarComprobante.addEventListener('click', descargarComprobante);
    
    const btnLogin = document.getElementById('btnLogin');
    const btnRegistrar = document.getElementById('btnRegistrar');
    const linkRegistro = document.getElementById('linkRegistro');
    const linkLogin = document.getElementById('linkLogin');
    const linkAfiliadosLogin = document.getElementById('linkAfiliadosLogin');
    
    if (btnLogin) btnLogin.addEventListener('click', login);
    if (btnRegistrar) btnRegistrar.addEventListener('click', registrar);
    if (linkRegistro) linkRegistro.addEventListener('click', mostrarRegistro);
    if (linkLogin) linkLogin.addEventListener('click', mostrarLogin);
    if (linkAfiliadosLogin) linkAfiliadosLogin.addEventListener('click', mostrarAfiliados);
    
    document.querySelectorAll('#login .tipo-opcion').forEach(opt => {
        opt.addEventListener('click', () => seleccionarTipoLogin(opt.getAttribute('data-tipo')));
    });
    document.querySelectorAll('#registro .tipo-opcion').forEach(opt => {
        opt.addEventListener('click', () => seleccionarTipoRegistro(opt.getAttribute('data-tipo')));
    });
    
    const btnEnviarSolicitudEstudiante = document.getElementById('btnEnviarSolicitudEstudiante');
    const btnVerCursos = document.getElementById('btnVerCursos');
    const btnCerrarSesionEstudiante = document.getElementById('btnCerrarSesionEstudiante');
    const btnActualizarPlanEstudiante = document.getElementById('btnActualizarPlanEstudiante');
    const fechaCurso = document.getElementById('fechaCurso');
    
    if (btnEnviarSolicitudEstudiante) btnEnviarSolicitudEstudiante.addEventListener('click', enviarSolicitud);
    if (btnVerCursos) btnVerCursos.addEventListener('click', toggleCursos);
    if (btnCerrarSesionEstudiante) btnCerrarSesionEstudiante.addEventListener('click', cerrarSesion);
    if (btnActualizarPlanEstudiante) btnActualizarPlanEstudiante.addEventListener('click', mostrarPlanes);
    if (fechaCurso) {
        fechaCurso.addEventListener('change', function() {
            const horarioSelect = document.getElementById('horarioCurso');
            if (horarioSelect) {
                horarioSelect.innerHTML = '<option>Selecciona horario</option>';
                ["08:00-10:00", "10:30-12:30", "13:00-15:00", "15:30-17:30"].forEach(h => {
                    const opt = document.createElement('option');
                    opt.value = h; opt.textContent = h;
                    horarioSelect.appendChild(opt);
                });
            }
        });
    }
    
    const btnEnviarSolicitudAfiliado = document.getElementById('btnEnviarSolicitudAfiliado');
    const btnVerCursosAf = document.getElementById('btnVerCursosAf');
    const btnCerrarSesionAfiliado = document.getElementById('btnCerrarSesionAfiliado');
    const fechaCursoAf = document.getElementById('fechaCursoAf');
    
    if (btnEnviarSolicitudAfiliado) btnEnviarSolicitudAfiliado.addEventListener('click', enviarSolicitudAfiliado);
    if (btnVerCursosAf) btnVerCursosAf.addEventListener('click', toggleCursosAf);
    if (btnCerrarSesionAfiliado) btnCerrarSesionAfiliado.addEventListener('click', cerrarSesion);
    if (fechaCursoAf) {
        fechaCursoAf.addEventListener('change', function() {
            const horarioSelect = document.getElementById('horarioCursoAf');
            if (horarioSelect) {
                horarioSelect.innerHTML = '<option>Selecciona horario</option>';
                ["08:00-10:00", "10:30-12:30", "13:00-15:00", "15:30-17:30"].forEach(h => {
                    const opt = document.createElement('option');
                    opt.value = h; opt.textContent = h;
                    horarioSelect.appendChild(opt);
                });
            }
        });
    }
    
    const btnPublicarCurso = document.getElementById('btnPublicarCurso');
    const btnCerrarSesionProfesor = document.getElementById('btnCerrarSesionProfesor');
    
    if (btnPublicarCurso) btnPublicarCurso.addEventListener('click', publicarCurso);
    if (btnCerrarSesionProfesor) btnCerrarSesionProfesor.addEventListener('click', cerrarSesion);
    cargarCheckboxHorarios();
    
    const opcionCanalesContacto = document.getElementById('opcionCanalesContacto');
    const opcionMediosPago = document.getElementById('opcionMediosPago');
    const opcionTurnoVirtual = document.getElementById('opcionTurnoVirtual');
    const opcionDirectorio = document.getElementById('opcionDirectorio');
    const opcionCertificado = document.getElementById('opcionCertificado');
    const servicioCursos = document.getElementById('servicioCursos');
    const btnSolicitarTurno = document.getElementById('btnSolicitarTurno');
    const btnSolicitarCertificado = document.getElementById('btnSolicitarCertificado');
    
    if (opcionCanalesContacto) opcionCanalesContacto.addEventListener('click', mostrarCanalesContacto);
    if (opcionMediosPago) opcionMediosPago.addEventListener('click', mostrarMediosPago);
    if (opcionTurnoVirtual) opcionTurnoVirtual.addEventListener('click', mostrarTurnoVirtual);
    if (opcionDirectorio) opcionDirectorio.addEventListener('click', mostrarDirectorioMedico);
    if (opcionCertificado) opcionCertificado.addEventListener('click', mostrarCertificadoDiscapacidad);
    if (servicioCursos) servicioCursos.addEventListener('click', mostrarCursosDestacados);
    if (btnSolicitarTurno) btnSolicitarTurno.addEventListener('click', solicitarTurno);
    if (btnSolicitarCertificado) btnSolicitarCertificado.addEventListener('click', solicitarCertificado);
    
    const linkLeyTransparencia = document.getElementById('linkLeyTransparencia');
    const linkPreguntasFrecuentes = document.getElementById('linkPreguntasFrecuentes');
    const linkPQRS = document.getElementById('linkPQRS');
    const linkCanalesContacto = document.getElementById('linkCanalesContacto');
    const linkSolicitarClave = document.getElementById('linkSolicitarClave');
    const btnConectate = document.getElementById('btnConectate');
    
    if (linkLeyTransparencia) linkLeyTransparencia.addEventListener('click', () => mostrarMensaje('Ley de transparencia', 'info'));
    if (linkPreguntasFrecuentes) linkPreguntasFrecuentes.addEventListener('click', () => mostrarMensaje('Preguntas frecuentes', 'info'));
    if (linkPQRS) linkPQRS.addEventListener('click', () => mostrarMensaje('Escríbenos tus PQRS', 'info'));
    if (linkCanalesContacto) linkCanalesContacto.addEventListener('click', mostrarCanalesContacto);
    if (linkSolicitarClave) linkSolicitarClave.addEventListener('click', () => mostrarMensaje('Solicitar clave', 'info'));
    if (btnConectate) btnConectate.addEventListener('click', () => mostrarMensaje('Conéctate a la audiencia', 'exito'));
    
    const navEmpleadores = document.getElementById('navEmpleadores');
    const navIndependientes = document.getElementById('navIndependientes');
    const navAsesores = document.getElementById('navAsesores');
    const navPrestadores = document.getElementById('navPrestadores');
    const navPAC = document.getElementById('navPAC');
    
    if (navEmpleadores) navEmpleadores.addEventListener('click', mostrarPlanes);
    if (navIndependientes) navIndependientes.addEventListener('click', mostrarPlanes);
    if (navAsesores) navAsesores.addEventListener('click', mostrarPlanes);
    if (navPrestadores) navPrestadores.addEventListener('click', mostrarPlanes);
    if (navPAC) navPAC.addEventListener('click', mostrarPlanes);
    
    document.querySelectorAll('.modal-close').forEach(close => {
        close.addEventListener('click', () => { 
            const modal = close.closest('.modal');
            if (modal) modal.style.display = 'none'; 
        });
    });
    
    // Eventos para asesorías grupales
    const btnCrearAsesoriaGrupal = document.getElementById('btnCrearAsesoriaGrupal');
    const btnGuardarAsesoria = document.getElementById('btnGuardarAsesoria');
    const btnVerMisAsesorias = document.getElementById('btnVerMisAsesorias');
    const btnVerInvitaciones = document.getElementById('btnVerInvitaciones');
    const btnCopiarEnlace = document.getElementById('btnCopiarEnlace');
    const btnEnviarInvitacionEmail = document.getElementById('btnEnviarInvitacionEmail');
    
    if (btnCrearAsesoriaGrupal) btnCrearAsesoriaGrupal.addEventListener('click', mostrarModalCrearAsesoria);
    if (btnGuardarAsesoria) btnGuardarAsesoria.addEventListener('click', crearAsesoriaGrupal);
    if (btnVerMisAsesorias) btnVerMisAsesorias.addEventListener('click', toggleAsesorias);
    if (btnVerInvitaciones) btnVerInvitaciones.addEventListener('click', toggleInvitaciones);
    if (btnCopiarEnlace) btnCopiarEnlace.addEventListener('click', copiarEnlaceInvitacion);
    if (btnEnviarInvitacionEmail) btnEnviarInvitacionEmail.addEventListener('click', enviarInvitacionEmail);
    
    // Eventos para afiliados
    const btnCrearAsesoriaGrupalAfiliado = document.getElementById('btnCrearAsesoriaGrupalAfiliado');
    const btnVerMisAsesoriasAfiliado = document.getElementById('btnVerMisAsesoriasAfiliado');
    const btnVerInvitacionesAfiliado = document.getElementById('btnVerInvitacionesAfiliado');
    
    if (btnCrearAsesoriaGrupalAfiliado) btnCrearAsesoriaGrupalAfiliado.addEventListener('click', mostrarModalCrearAsesoria);
    if (btnVerMisAsesoriasAfiliado) btnVerMisAsesoriasAfiliado.addEventListener('click', toggleAsesoriasAfiliado);
    if (btnVerInvitacionesAfiliado) btnVerInvitacionesAfiliado.addEventListener('click', toggleInvitacionesAfiliado);
}

function toggleCursosAf() {
    const div = document.getElementById('listaCursosAf');
    const btn = document.getElementById('btnVerCursosAf');
    if (!div || !btn) return;
    if (cursosMostradosAf) { div.innerHTML = ''; btn.innerHTML = 'Ver Cursos Disponibles'; }
    else { cargarCursosDisponiblesAfiliado(); btn.innerHTML = 'Ocultar Cursos'; }
    cursosMostradosAf = !cursosMostradosAf;
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosFirebase();
    inicializarEventos();
    mostrarInicio();
    window.onclick = e => { 
        if (e.target.classList && e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    };
});