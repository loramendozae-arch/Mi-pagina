// ========== VARIABLES GLOBALES ==========
let usuarioActual = '';
let slideIndex = 0;
let slides = [];
let visible = false;
let cursosRechazadosEnSesion = [];
let notificacionesMostradas = [];
let usuarioRecienRegistrado = null;
let planSeleccionado = null;
let metodoPagoSeleccionado = null;
let pasosPago = 1;
let cursosMostrados = false;

// DATOS GLOBALES
let cursos = [];
let solicitudes = [];
let notis = [];
let users = [];
let indicaciones = [];

// ========== FUNCIONES UTILITARIAS ==========
function hashPassword(password) {
    return btoa(unescape(encodeURIComponent(password)));
}

function verifyPassword(inputPassword, storedHash) {
    try {
        const inputHash = btoa(unescape(encodeURIComponent(inputPassword)));
        return inputHash === storedHash;
    } catch (error) {
        console.error('Error verificando contraseña:', error);
        return false;
    }
}

function mostrarMensaje(texto, tipo = 'info', icono = '') {
    const mensajesAnteriores = document.querySelectorAll('.mensaje-flotante');
    mensajesAnteriores.forEach(msg => msg.remove());
    
    const mensaje = document.createElement('div');
    mensaje.className = `mensaje-flotante mensaje-${tipo}`;
    mensaje.innerHTML = icono ? `<span style="font-size: 1.5rem">${icono}</span> ${texto}` : texto;
    
    document.body.appendChild(mensaje);
    
    setTimeout(() => {
        if (mensaje.parentNode) {
            mensaje.parentNode.removeChild(mensaje);
        }
    }, 3000);
}

function mostrarLoader(mostrar) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = mostrar ? 'flex' : 'none';
    }
}

function mostrarPagoLoader(mostrar) {
    const loader = document.getElementById('pagoLoader');
    if (loader) {
        loader.style.display = mostrar ? 'flex' : 'none';
        if (!mostrar) {
            document.getElementById('pagoProgressBar').style.width = '0%';
            document.getElementById('pagoLoaderText').textContent = 'Procesando pago...';
        }
    }
}

function ocultarTodo() {
    document.querySelectorAll('section').forEach(sec => {
        sec.style.display = 'none';
    });
}

// ========== SLIDER ==========
function inicializarSlider() {
    slides = document.querySelectorAll('.slide');
    if (slides.length > 0) {
        slides[0].classList.add('active');
        setInterval(cambiarSlide, 5000);
    }
}

function cambiarSlide() {
    if (slides.length === 0) return;
    
    slides[slideIndex].classList.remove('active');
    slideIndex = (slideIndex + 1) % slides.length;
    slides[slideIndex].classList.add('active');
}

// ========== NAVEGACIÓN ==========
function irARegistro() {
    ocultarTodo();
    document.getElementById('registro').style.display = 'flex';
    mostrarMensaje('Completa el formulario para registrarte', 'info', '📝');
}

function mostrarLogin() {
    ocultarTodo();
    document.getElementById('login').style.display = 'flex';
    limpiarCamposLogin();
    mostrarMensaje('Ingresa tus credenciales para acceder', 'info', '🔑');
}

function limpiarCamposLogin() {
    document.getElementById('loginUsuario').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('rolLogin').selectedIndex = 0;
}

function mostrarPlanes() {
    ocultarTodo();
    document.getElementById('planes').style.display = 'flex';
    mostrarMensaje('Elige el plan que mejor se adapte a tus necesidades', 'info', '🎯');
}

function mostrarPago() {
    if (!planSeleccionado) {
        mostrarMensaje('Por favor selecciona un plan primero', 'error', '❌');
        return;
    }
    
    ocultarTodo();
    document.getElementById('pago').style.display = 'flex';
    
    pasosPago = 1;
    actualizarPasos();
    
    cargarResumenPlan(planSeleccionado);
}

function volverDesdePlanes() {
    if (usuarioActual) {
        const user = users.find(x => x.u === usuarioActual);
        if (user) {
            ocultarTodo();
            document.getElementById(user.r).style.display = 'block';
            if (user.r === 'profesor') {
                cargarHorariosProfesor();
                cargarCheckboxHorarios();
                cargarSolicitudesProfesor();
            } else if (user.r === 'estudiante') {
                actualizarInfoPlanEstudiante();
                cargarNotificaciones();
            }
        }
    } else {
        mostrarLogin();
    }
}

function cerrarSesion() {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
        mostrarLoader(true);
        
        setTimeout(() => {
            usuarioActual = '';
            usuarioRecienRegistrado = null;
            cursosRechazadosEnSesion = [];
            notificacionesMostradas = [];
            planSeleccionado = null;
            metodoPagoSeleccionado = null;
            cursosMostrados = false;
            
            const indicacionesSection = document.getElementById('indicacionesEstudiante');
            if (indicacionesSection) {
                indicacionesSection.remove();
            }
            
            ocultarTodo();
            document.getElementById('presentacion').style.display = 'flex';
            
            visible = false;
            
            mostrarLoader(false);
            mostrarMensaje('Sesión cerrada exitosamente', 'exito', '👋');
        }, 1000);
    }
}

// ========== REGISTRO Y LOGIN ==========
function registrar() {
    try {
        mostrarLoader(true);
        
        let u = document.getElementById('usuarioRegistro').value.trim();
        let p = document.getElementById('passwordRegistro').value;
        let r = document.getElementById('rolRegistro').value;
        
        if (!u || !p) {
            mostrarMensaje('Completa todos los campos', 'error', '❌');
            mostrarLoader(false);
            return;
        }
        
        if (users.find(x => x.u === u)) {
            mostrarMensaje('El usuario ya existe', 'error', '❌');
            mostrarLoader(false);
            return;
        }
        
        const hashedPassword = hashPassword(p);
        users.push({u, p: hashedPassword, r, plan: null});
        localStorage.setItem('users', JSON.stringify(users));
        
        usuarioRecienRegistrado = u;
        
        mostrarMensaje('¡Registro exitoso!', 'exito', '🎉');
        
        document.getElementById('usuarioRegistro').value = '';
        document.getElementById('passwordRegistro').value = '';
        document.getElementById('rolRegistro').selectedIndex = 0;
        
        if (r === 'estudiante') {
            mostrarPlanes();
        } else if (r === 'profesor') {
            mostrarLogin();
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
        mostrarMensaje('Ocurrió un error durante el registro', 'error', '❌');
    } finally {
        mostrarLoader(false);
    }
}

function login() {
    try {
        mostrarLoader(true);
        
        let u = document.getElementById('loginUsuario').value.trim();
        let p = document.getElementById('loginPassword').value;
        let r = document.getElementById('rolLogin').value;
        
        let user = users.find(x => x.u === u && x.r === r);
        
        if (!user) {
            mostrarMensaje('Usuario o contraseña incorrectos', 'error', '❌');
            mostrarLoader(false);
            return;
        }
        
        if (!verifyPassword(p, user.p)) {
            mostrarMensaje('Usuario o contraseña incorrectos', 'error', '❌');
            mostrarLoader(false);
            return;
        }
        
        usuarioActual = u;
        cursosRechazadosEnSesion = [];
        cursosMostrados = false;
        
        ocultarTodo();
        
        if (r === 'estudiante') {
            const estudiante = users.find(x => x.u === u);
            
            if (!estudiante.plan) {
                mostrarPlanes();
            } else {
                document.getElementById('estudiante').style.display = 'block';
                mostrarMensaje(`¡Bienvenido de nuevo ${u}!`, 'exito', '🎓');
                actualizarInfoPlanEstudiante();
                cargarNotificaciones();
            }
        } else if (r === 'profesor') {
            document.getElementById('profesor').style.display = 'block';
            mostrarMensaje(`¡Bienvenido Profesor ${u}!`, 'exito', '👨‍🏫');
            cargarHorariosProfesor();
            cargarCheckboxHorarios();
            cargarSolicitudesProfesor();
        }
        
        limpiarCamposLogin();
        
    } catch (error) {
        console.error('Error en login:', error);
        mostrarMensaje('Ocurrió un error durante el inicio de sesión', 'error', '❌');
    } finally {
        mostrarLoader(false);
    }
}

// ========== PLAN DEL ESTUDIANTE ==========
function actualizarInfoPlanEstudiante() {
    if (!usuarioActual) return;
    
    const estudiante = users.find(x => x.u === usuarioActual);
    if (!estudiante) return;
    
    const planElement = document.getElementById('planName');
    const planIconElement = document.getElementById('planIcon');
    const nombreEstudiante = document.getElementById('nombreEstudiante');
    
    if (estudiante.plan) {
        const nombresPlanes = {
            'basico': { nombre: 'Plan Básico', icono: '🎓' },
            'avanzado': { nombre: 'Plan Avanzado', icono: '🚀' },
            'premium': { nombre: 'Plan Premium', icono: '🏆' }
        };
        
        const planInfo = nombresPlanes[estudiante.plan] || { nombre: 'Plan Desconocido', icono: '📋' };
        
        planElement.textContent = `Plan: ${planInfo.nombre}`;
        planIconElement.textContent = planInfo.icono;
    } else {
        planElement.textContent = 'Sin Plan Activo';
        planIconElement.textContent = '❌';
    }
    
    if (nombreEstudiante) {
        nombreEstudiante.textContent = usuarioActual;
    }
}

// ========== NOTIFICACIONES ==========
function cargarNotificaciones() {
    const notificacionesDiv = document.getElementById('notificaciones');
    if (!notificacionesDiv) return;
    
    cursos = JSON.parse(localStorage.getItem('cursos')) || [];
    indicaciones = JSON.parse(localStorage.getItem('indicaciones')) || [];
    
    const notisUsuario = notis.filter(n => n.usuario === usuarioActual);
    
    if (notisUsuario.length === 0) {
        notificacionesDiv.innerHTML = `
            <div class="notificacion-item" style="text-align: center; padding: 40px;">
                <span style="font-size: 3rem; display: block; margin-bottom: 15px;">📭</span>
                <h4 style="margin: 0 0 10px 0; color: #333;">No tienes notificaciones</h4>
                <p style="color: #666; margin: 0;">Aquí aparecerán las notificaciones sobre tus cursos y solicitudes.</p>
            </div>
        `;
        return;
    }
    
    notisUsuario.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    let html = '';
    
    notisUsuario.forEach(notificacion => {
        const fecha = new Date(notificacion.fecha).toLocaleDateString('es-ES');
        const hora = new Date(notificacion.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        let claseNotificacion = notificacion.leida ? 'leida' : 'nueva';
        let badgeClass = '';
        let badgeText = '';
        let icono = '📨';
        
        if (notificacion.tipo.includes('aprobada') || notificacion.tipo === 'aprobacion') {
            badgeClass = 'badge-aprobada';
            badgeText = 'APROBADA';
            icono = '✅';
        } else if (notificacion.tipo.includes('rechazada') || notificacion.tipo === 'rechazo') {
            badgeClass = 'badge-rechazada';
            badgeText = 'RECHAZADA';
            icono = '❌';
        } else if (notificacion.tipo.includes('pendiente')) {
            badgeClass = 'badge-pendiente';
            badgeText = 'PENDIENTE';
            icono = '⏳';
        } else if (notificacion.tipo === 'indicacion') {
            badgeClass = 'badge-indicacion';
            badgeText = 'INDICACIONES';
            icono = '📨';
        } else {
            badgeClass = 'badge-nueva';
            badgeText = notificacion.leida ? 'LEÍDA' : 'NUEVA';
        }
        
        let infoCurso = null;
        let indicacionesCurso = [];
        
        if (notificacion.cursoId) {
            infoCurso = cursos.find(c => c.id === notificacion.cursoId);
        }
        
        const solicitudRelacionada = solicitudes.find(s => 
            s.estudiante === usuarioActual && 
            (s.cursoId === notificacion.cursoId || s.id === notificacion.solicitudId)
        );
        
        if (notificacion.indicacionId) {
            const indicacionRelacionada = indicaciones.find(ind => ind.id === notificacion.indicacionId);
            if (indicacionRelacionada) {
                indicacionesCurso = [indicacionRelacionada];
            }
        } else if (notificacion.solicitudId) {
            indicacionesCurso = indicaciones.filter(ind => 
                ind.estudiante === usuarioActual && ind.solicitudId === notificacion.solicitudId
            );
        } else if (solicitudRelacionada) {
            indicacionesCurso = indicaciones.filter(ind => 
                ind.estudiante === usuarioActual && ind.solicitudId === solicitudRelacionada.id
            );
        } else if (infoCurso) {
            indicacionesCurso = indicaciones.filter(ind => 
                ind.estudiante === usuarioActual && ind.cursoId === infoCurso.id
            );
        }
        
        html += `
            <div class="notificacion-item ${claseNotificacion}" data-id="${notificacion.id}">
                <div class="notificacion-header">
                    <div class="notificacion-titulo">
                        ${icono} ${notificacion.mensaje}
                        <span class="notificacion-badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="notificacion-fecha">📅 ${fecha} - ${hora}</div>
                </div>
                
                <div class="notificacion-detalles">
                    <h4><span>📋</span> Información del Curso</h4>
        `;
        
        if (infoCurso) {
            html += `
                    <div class="info-item">
                        <div class="info-label"><span>📚</span> Curso:</div>
                        <div class="info-value">${infoCurso.nombre}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><span>👨‍🏫</span> Profesor:</div>
                        <div class="info-value">${infoCurso.profesor}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label"><span>📝</span> Descripción:</div>
                        <div class="info-value">${infoCurso.descripcion || 'Sin descripción'}</div>
                    </div>
                    ${infoCurso.horarios && infoCurso.horarios.length > 0 ? `
                    <div class="info-item">
                        <div class="info-label"><span>🕐</span> Horarios:</div>
                        <div class="info-value">${infoCurso.horarios.join(', ')}</div>
                    </div>
                    ` : ''}
            `;
        }
        
        if (indicacionesCurso.length > 0) {
            html += `
                    <div class="info-item">
                        <div class="info-label"><span>📨</span> Indicaciones del Profesor:</div>
                        <div class="info-value">
                            <div style="margin-top: 10px; width: 100%;">
                                <div class="notificacion-indicaciones">
            `;
            
            indicacionesCurso.forEach(indicacion => {
                const fechaInd = new Date(indicacion.fecha).toLocaleDateString('es-ES');
                const horaInd = new Date(indicacion.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                
                html += `
                    <div class="indicacion-card">
                        <div class="indicacion-header">
                            <div class="indicacion-profesor-nombre">
                                <span>👨‍🏫</span> ${indicacion.profesorNombre || indicacion.profesor}
                            </div>
                            <div class="indicacion-fecha-hora">📅 ${fechaInd} - ${horaInd}</div>
                        </div>
                        <div class="indicacion-contenido">${indicacion.mensaje.replace(/\n/g, '<br>')}</div>
                        ${indicacion.enlaceCurso ? `<a href="${indicacion.enlaceCurso}" target="_blank" class="indicacion-enlace-curso">🔗 Enlace del curso: ${indicacion.enlaceCurso}</a>` : ''}
                        <div style="margin-top: 10px;">
                            <span class="indicacion-estado-badge ${indicacion.vista ? 'indicacion-vista-badge' : 'indicacion-pendiente-badge'}">
                                ${indicacion.vista ? '✅ Vista' : '⏳ Pendiente de revisión'}
                            </span>
                            ${!indicacion.vista ? `
                            <button onclick="marcarIndicacionComoVista('${indicacion.id}', '${notificacion.id}')"
                                    style="margin-left: 10px; background: #28a745; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                                ✅ Marcar como vista
                            </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
            
            html += `</div></div></div></div>`;
        }
        
        if (solicitudRelacionada) {
            if (solicitudRelacionada.fechaSolicitada) {
                html += `<div class="info-item"><div class="info-label"><span>📅</span> Fecha solicitada:</div><div class="info-value">${solicitudRelacionada.fechaSolicitada}</div></div>`;
            }
            if (solicitudRelacionada.horarioSolicitado) {
                html += `<div class="info-item"><div class="info-label"><span>🕐</span> Horario solicitado:</div><div class="info-value">${solicitudRelacionada.horarioSolicitado}</div></div>`;
            }
            html += `<div class="info-item"><div class="info-label"><span>📋</span> Estado:</div><div class="info-value"><span class="notificacion-badge estado-${solicitudRelacionada.estado}">${solicitudRelacionada.estado.toUpperCase()}</span></div></div>`;
            
            if (solicitudRelacionada.descripcion && solicitudRelacionada.descripcion.trim() !== '') {
                html += `
                    <div class="info-item" style="flex-direction: column; align-items: flex-start;">
                        <div class="info-label" style="margin-bottom: 10px;"><span>📝</span> Descripción detallada:</div>
                        <div class="info-value" style="width: 100%;">
                            <div class="descripcion-detallada" style="margin: 10px 0;">
                                <p class="descripcion-contenido">${solicitudRelacionada.descripcion.replace(/\n/g, '<br>')}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            if (solicitudRelacionada.tipo === 'manual' && solicitudRelacionada.cursoNombre) {
                html += `<div class="info-item"><div class="info-label"><span>📚</span> Curso solicitado:</div><div class="info-value">${solicitudRelacionada.cursoNombre}</div></div>`;
            }
        }
        
        html += `
                </div>
                <div class="notificacion-acciones">
                    ${!notificacion.leida ? `<button class="btn-marcar-leida" onclick="marcarNotificacionComoLeida('${notificacion.id}')"><span>✅</span> Marcar como Leída</button>` : ''}
                    <button class="btn-eliminar-notificacion" onclick="eliminarNotificacion('${notificacion.id}')"><span>🗑️</span> Eliminar</button>
                </div>
            </div>
        `;
    });
    
    notificacionesDiv.innerHTML = html;
    
    const notificacionesNoLeidas = notisUsuario.filter(n => !n.leida).length;
    if (notificacionesNoLeidas > 0) {
        const tituloNotificaciones = document.querySelector('#estudiante .card:last-child h3');
        if (tituloNotificaciones) {
            const badgeExistente = tituloNotificaciones.querySelector('.contador-notificaciones');
            if (badgeExistente) badgeExistente.remove();
            
            const badge = document.createElement('span');
            badge.className = 'notificacion-badge badge-nueva contador-notificaciones';
            badge.style.marginLeft = '10px';
            badge.textContent = `${notificacionesNoLeidas} NUEVAS`;
            tituloNotificaciones.appendChild(badge);
        }
    }
}

function marcarIndicacionComoVista(indicacionId, notificacionId = null) {
    const indicacionIndex = indicaciones.findIndex(ind => ind.id === indicacionId);
    
    if (indicacionIndex !== -1) {
        indicaciones[indicacionIndex].vista = true;
        localStorage.setItem('indicaciones', JSON.stringify(indicaciones));
        
        if (notificacionId) {
            const notificacionIndex = notis.findIndex(n => n.id === notificacionId);
            if (notificacionIndex !== -1) {
                notis[notificacionIndex].leida = true;
                localStorage.setItem('notis', JSON.stringify(notis));
            }
        }
        
        cargarNotificaciones();
        mostrarMensaje('Indicación marcada como vista', 'exito', '✅');
    }
}

function marcarNotificacionComoLeida(notificacionId) {
    const notificacionIndex = notis.findIndex(n => n.id === notificacionId);
    
    if (notificacionIndex !== -1) {
        notis[notificacionIndex].leida = true;
        localStorage.setItem('notis', JSON.stringify(notis));
        cargarNotificaciones();
        mostrarMensaje('Notificación marcada como leída', 'exito', '✅');
    }
}

function marcarTodasComoLeidas() {
    if (confirm('¿Marcar todas las notificaciones como leídas?')) {
        notis.forEach(notificacion => {
            if (notificacion.usuario === usuarioActual) {
                notificacion.leida = true;
            }
        });
        localStorage.setItem('notis', JSON.stringify(notis));
        cargarNotificaciones();
        mostrarMensaje('Todas las notificaciones marcadas como leídas', 'exito', '✅');
    }
}

function eliminarNotificacion(notificacionId) {
    if (confirm('¿Estás seguro de eliminar esta notificación?')) {
        const notificacionIndex = notis.findIndex(n => n.id === notificacionId);
        if (notificacionIndex !== -1) {
            notis.splice(notificacionIndex, 1);
            localStorage.setItem('notis', JSON.stringify(notis));
            cargarNotificaciones();
            mostrarMensaje('Notificación eliminada', 'exito', '✅');
        }
    }
}

function eliminarNotificaciones() {
    if (confirm('¿Estás seguro de eliminar TODAS las notificaciones?')) {
        const nuevasNotis = notis.filter(n => n.usuario !== usuarioActual);
        notis = nuevasNotis;
        localStorage.setItem('notis', JSON.stringify(notis));
        cargarNotificaciones();
        mostrarMensaje('Todas las notificaciones eliminadas', 'exito', '✅');
    }
}

// ========== CURSOS DISPONIBLES (ESTUDIANTE) ==========
function toggleCursos() {
    const listaCursosDiv = document.getElementById('listaCursos');
    const btnCursos = document.getElementById('btnCursos');
    
    if (!cursosMostrados) {
        cargarCursosDisponibles();
        btnCursos.innerHTML = '<span>👁️</span> Ocultar Cursos';
        btnCursos.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        cursosMostrados = true;
    } else {
        listaCursosDiv.innerHTML = '';
        btnCursos.innerHTML = '<span>🔍</span> Ver Cursos Disponibles';
        btnCursos.style.background = 'linear-gradient(135deg, #00dbde 0%, #fc00ff 100%)';
        cursosMostrados = false;
    }
}

function cargarCursosDisponibles() {
    const listaCursosDiv = document.getElementById('listaCursos');
    if (!listaCursosDiv) return;
    
    listaCursosDiv.innerHTML = '';
    cursos = JSON.parse(localStorage.getItem('cursos')) || [];
    
    const cursosFiltrados = cursos.filter(curso => !cursosRechazadosEnSesion.includes(curso.id));
    
    if (!cursosFiltrados || cursosFiltrados.length === 0) {
        listaCursosDiv.innerHTML = `
            <div class="curso-disponible" style="text-align: center; padding: 40px;">
                <span style="font-size: 3rem; display: block; margin-bottom: 15px;">📭</span>
                <h4 style="margin: 0 0 10px 0; color: #333;">No hay cursos disponibles</h4>
                <p style="color: #666; margin: 0;">${cursosRechazadosEnSesion.length > 0 ? 'Has rechazado todos los cursos publicados.' : 'Los profesores aún no han publicado cursos.'}</p>
            </div>
        `;
        return;
    }
    
    const titulo = document.createElement('h3');
    titulo.style.cssText = 'color: #333; margin: 30px 0 20px 0; font-size: 1.5rem; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0;';
    titulo.innerHTML = `<span>📚</span> Cursos Disponibles de Profesores (${cursosFiltrados.length} disponibles)`;
    listaCursosDiv.appendChild(titulo);
    
    const cursosOrdenados = [...cursosFiltrados].sort((a, b) => {
        if (a.fechaPublicacion && b.fechaPublicacion) {
            return new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion);
        }
        return 0;
    });
    
    cursosOrdenados.forEach(curso => {
        const cursoDiv = document.createElement('div');
        cursoDiv.className = 'curso-disponible';
        cursoDiv.dataset.cursoId = curso.id;
        
        let fechaMostrar = curso.fecha;
        if (curso.fechaPublicacion) {
            const fechaPub = new Date(curso.fechaPublicacion);
            fechaMostrar = `${curso.fecha} (Publicado: ${fechaPub.toLocaleDateString('es-ES')})`;
        }
        
        cursoDiv.innerHTML = `
            <div class="curso-header">
                <div class="curso-title">
                    <h4>${curso.nombre || 'Curso sin nombre'}</h4>
                    <div class="curso-profesor"><span>👨‍🏫</span><strong>Profesor:</strong> ${curso.profesor || 'Desconocido'}</div>
                </div>
                <div class="curso-fecha"><span>📅</span> ${fechaMostrar}</div>
            </div>
            <div class="curso-details">
                <p class="curso-descripcion"><strong>📋 Descripción:</strong> ${curso.descripcion || 'Sin descripción disponible'}</p>
                ${curso.horarios && curso.horarios.length > 0 ? `<div class="curso-horarios">${curso.horarios.map(horario => `<span class="horario-badge">🕐 ${horario}</span>`).join('')}</div>` : '<p style="color: #999;">No hay horarios definidos</p>'}
            </div>
            <div class="curso-actions">
                <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
                    <div style="margin-bottom: 10px;">
                        <label for="horarioSeleccionado_${curso.id}" style="display: block; margin-bottom: 5px; color: #333; font-weight: 600;">🕐 Selecciona el horario para este curso:</label>
                        <select id="horarioSeleccionado_${curso.id}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; background: white;">
                            <option value="">-- Selecciona un horario --</option>
                            ${curso.horarios && curso.horarios.length > 0 ? curso.horarios.map(horario => `<option value="${horario}">${horario}</option>`).join('') : '<option value="">No hay horarios disponibles</option>'}
                        </select>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-inscribirse" onclick="solicitarCurso('${curso.id}')" style="flex: 1; padding: 12px;"><span>📝</span> Solicitar Curso</button>
                        <button class="logout-btn" onclick="rechazarCurso('${curso.id}')" style="flex: 1; padding: 12px;"><span>❌</span> Rechazar Curso</button>
                    </div>
                </div>
            </div>
        `;
        
        listaCursosDiv.appendChild(cursoDiv);
    });
    
    mostrarMensaje(`Se encontraron ${cursosFiltrados.length} cursos disponibles`, 'info', '📚');
}

function mostrarHorarios() {
    const fechaSeleccionada = document.getElementById('fechaCurso').value;
    const horarioSelect = document.getElementById('horarioCurso');
    
    if (!fechaSeleccionada) {
        horarioSelect.innerHTML = '<option value="">Selecciona un horario</option>';
        return;
    }
    
    horarioSelect.innerHTML = '<option value="">Selecciona un horario</option>';
    const horariosDisponibles = ["08:00 - 10:00", "10:30 - 12:30", "13:00 - 15:00", "15:30 - 17:30"];
    horariosDisponibles.forEach(horario => {
        const option = document.createElement('option');
        option.value = horario;
        option.textContent = horario;
        horarioSelect.appendChild(option);
    });
}

function enviarSolicitud() {
    const nombreCurso = document.getElementById('cursoEstudiante').value.trim();
    const descripcion = document.getElementById('descripcionCurso').value.trim();
    const fecha = document.getElementById('fechaCurso').value;
    const horario = document.getElementById('horarioCurso').value;
    
    if (!nombreCurso || !descripcion || !fecha || !horario) {
        mostrarMensaje('Completa todos los campos', 'error', '❌');
        return;
    }
    
    mostrarLoader(true);
    
    setTimeout(() => {
        const estudiante = users.find(x => x.u === usuarioActual);
        if (!estudiante) {
            mostrarMensaje('Usuario no encontrado', 'error', '❌');
            mostrarLoader(false);
            return;
        }
        
        const solicitudManual = {
            id: 'solicitud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            estudiante: usuarioActual,
            cursoNombre: nombreCurso,
            descripcion: descripcion,
            fechaSolicitada: fecha,
            horarioSolicitado: horario,
            fechaSolicitud: new Date().toISOString(),
            estado: 'pendiente',
            tipo: 'manual'
        };
        
        solicitudes.push(solicitudManual);
        localStorage.setItem('solicitudes', JSON.stringify(solicitudes));
        
        const nuevaNotificacion = {
            id: 'not_manual_' + Date.now(),
            usuario: usuarioActual,
            mensaje: `Has solicitado un curso personalizado: "${nombreCurso}"`,
            fecha: new Date().toISOString(),
            tipo: 'solicitud_manual',
            leida: false,
            solicitudId: solicitudManual.id
        };
        
        notis.push(nuevaNotificacion);
        localStorage.setItem('notis', JSON.stringify(notis));
        
        document.getElementById('cursoEstudiante').value = '';
        document.getElementById('descripcionCurso').value = '';
        document.getElementById('fechaCurso').value = '';
        document.getElementById('horarioCurso').innerHTML = '<option value="">Selecciona un horario</option>';
        
        cargarNotificaciones();
        
        mostrarLoader(false);
        mostrarMensaje('Solicitud enviada exitosamente', 'exito', '✅');
    }, 1000);
}

function solicitarCurso(cursoId) {
    cursos = JSON.parse(localStorage.getItem('cursos')) || [];
    
    const curso = cursos.find(c => c.id === cursoId);
    if (!curso) {
        mostrarMensaje('El curso no existe', 'error', '❌');
        return;
    }
    
    const horarioSeleccionado = document.getElementById(`horarioSeleccionado_${cursoId}`).value;
    
    if (!horarioSeleccionado) {
        mostrarMensaje('Por favor selecciona un horario para el curso', 'error', '❌');
        return;
    }
    
    const descripcion = prompt(`¿Deseas agregar una descripción o comentario sobre el curso "${curso.nombre}"? (opcional):`, '');
    
    const estudiante = users.find(x => x.u === usuarioActual);
    if (estudiante && estudiante.cursosInscritos) {
        const yaInscrito = estudiante.cursosInscritos.some(item => typeof item === 'object' ? item.cursoId === cursoId : item === cursoId);
        if (yaInscrito) {
            mostrarMensaje('Ya estás inscrito en este curso', 'error', '❌');
            return;
        }
    }
    
    if (confirm(`¿Deseas solicitar el curso "${curso.nombre}" impartido por ${curso.profesor} en el horario ${horarioSeleccionado}?`)) {
        mostrarLoader(true);
        
        setTimeout(() => {
            const userIndex = users.findIndex(x => x.u === usuarioActual);
            if (userIndex !== -1) {
                if (!users[userIndex].cursosInscritos) {
                    users[userIndex].cursosInscritos = [];
                }
                
                users[userIndex].cursosInscritos.push({
                    cursoId: cursoId,
                    cursoNombre: curso.nombre,
                    profesor: curso.profesor,
                    horario: horarioSeleccionado,
                    fechaSolicitud: new Date().toISOString(),
                    estado: 'pendiente',
                    descripcion: descripcion || ''
                });
                localStorage.setItem('users', JSON.stringify(users));
                
                const nuevaNotificacion = {
                    id: 'not_solicitud_' + Date.now(),
                    usuario: usuarioActual,
                    mensaje: `Has solicitado el curso "${curso.nombre}"`,
                    fecha: new Date().toISOString(),
                    tipo: 'solicitud_curso',
                    leida: false,
                    cursoId: cursoId
                };
                
                notis.push(nuevaNotificacion);
                localStorage.setItem('notis', JSON.stringify(notis));
                
                const solicitudProfesor = {
                    id: 'solicitud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    estudiante: usuarioActual,
                    cursoId: cursoId,
                    cursoNombre: curso.nombre,
                    horarioSolicitado: horarioSeleccionado,
                    fechaSolicitud: new Date().toISOString(),
                    estado: 'pendiente',
                    descripcion: descripcion || ''
                };
                
                solicitudes.push(solicitudProfesor);
                localStorage.setItem('solicitudes', JSON.stringify(solicitudes));
                
                mostrarMensaje(`¡Solicitud exitosa! Has solicitado "${curso.nombre}" en ${horarioSeleccionado}`, 'exito', '✅');
                cargarNotificaciones();
            }
            
            mostrarLoader(false);
        }, 1000);
    }
}

function rechazarCurso(cursoId) {
    cursos = JSON.parse(localStorage.getItem('cursos')) || [];
    
    const curso = cursos.find(c => c.id === cursoId);
    if (!curso) {
        mostrarMensaje('El curso no existe', 'error', '❌');
        return;
    }
    
    if (confirm(`¿Estás seguro de que no te interesa el curso "${curso.nombre}"? Esta acción no se puede deshacer en esta sesión.`)) {
        if (!cursosRechazadosEnSesion.includes(cursoId)) {
            cursosRechazadosEnSesion.push(cursoId);
        }
        
        const cursoDiv = document.querySelector(`#horarioSeleccionado_${cursoId}`)?.closest('.curso-disponible');
        if (cursoDiv) {
            cursoDiv.remove();
        }
        
        const nuevaNotificacion = {
            id: 'not_rechazo_' + Date.now(),
            usuario: usuarioActual,
            mensaje: `Has rechazado el curso "${curso.nombre}"`,
            fecha: new Date().toISOString(),
            tipo: 'rechazo_curso',
            leida: false,
            cursoId: cursoId
        };
        
        notis.push(nuevaNotificacion);
        localStorage.setItem('notis', JSON.stringify(notis));
        
        const cursosDisponibles = document.querySelectorAll('#listaCursos .curso-disponible').length;
        mostrarMensaje(`Has rechazado el curso "${curso.nombre}". Cursos disponibles: ${cursosDisponibles}`, 'info', '❌');
        
        cargarNotificaciones();
        
        if (cursosDisponibles === 0) {
            const listaCursosDiv = document.getElementById('listaCursos');
            const tituloCursos = listaCursosDiv.querySelector('h3');
            if (tituloCursos) {
                const mensajeNoCursos = document.createElement('div');
                mensajeNoCursos.className = 'curso-disponible';
                mensajeNoCursos.style.textAlign = 'center';
                mensajeNoCursos.style.padding = '40px';
                mensajeNoCursos.innerHTML = `
                    <span style="font-size: 3rem; display: block; margin-bottom: 15px;">📭</span>
                    <h4 style="margin: 0 0 10px 0; color: #333;">No hay más cursos disponibles</h4>
                    <p style="color: #666; margin: 0;">Has rechazado todos los cursos publicados.</p>
                `;
                listaCursosDiv.appendChild(mensajeNoCursos);
            }
        }
    }
}

// ========== PROFESOR: HORARIOS Y CURSOS ==========
function cargarCheckboxHorarios() {
    const checkboxHorariosDiv = document.getElementById('checkboxHorarios');
    if (!checkboxHorariosDiv) return;
    
    checkboxHorariosDiv.innerHTML = '';
    
    const horariosDisponibles = ["08:00 - 10:00", "10:30 - 12:30", "13:00 - 15:00", "15:30 - 17:30"];
    horariosDisponibles.forEach((horario, index) => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'checkbox-horario';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `horario${index}`;
        checkbox.value = horario;
        
        const label = document.createElement('label');
        label.htmlFor = `horario${index}`;
        label.textContent = horario;
        
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        checkboxHorariosDiv.appendChild(checkboxDiv);
    });
}

function cargarHorariosProfesor() {
    const horariosProfesorDiv = document.getElementById('horariosProfesor');
    if (!horariosProfesorDiv) return;
    
    horariosProfesorDiv.innerHTML = '';
    cursos = JSON.parse(localStorage.getItem('cursos')) || [];
    
    const cursosProfesor = cursos.filter(curso => curso.profesor === usuarioActual);
    
    if (cursosProfesor.length === 0) {
        horariosProfesorDiv.innerHTML = '<p>No has publicado ningún curso aún.</p>';
        return;
    }
    
    cursosProfesor.forEach(curso => {
        const cursoDiv = document.createElement('div');
        cursoDiv.className = 'curso-disponible';
        
        cursoDiv.innerHTML = `
            <div class="curso-header">
                <div class="curso-title">
                    <h4>${curso.nombre}</h4>
                    <div class="curso-profesor"><span>👨‍🏫</span><strong>Profesor:</strong> ${usuarioActual} (Tú)</div>
                </div>
                <div class="curso-fecha"><span>📅</span> ${curso.fecha}</div>
            </div>
            <div class="curso-details">
                <p class="curso-descripcion"><strong>📋 Descripción:</strong> ${curso.descripcion}</p>
                <div class="curso-horarios">${curso.horarios.map(horario => `<span class="horario-badge">🕐 ${horario}</span>`).join('')}</div>
            </div>
            <div class="curso-actions">
                <button class="back-btn" onclick="editarCurso('${curso.id}')" style="padding: 10px 20px;"><span>✏️</span> Editar</button>
                <button class="logout-btn" onclick="eliminarCurso('${curso.id}')" style="padding: 10px 20px;"><span>🗑️</span> Eliminar</button>
            </div>
        `;
        
        horariosProfesorDiv.appendChild(cursoDiv);
    });
}

function publicarCurso() {
    const nombreCurso = document.getElementById('nombreCurso').value.trim();
    const descripcion = document.getElementById('descripcionTemasCurso').value.trim();
    const fecha = document.getElementById('fechaCursoProfesor').value;
    
    if (!nombreCurso || !descripcion || !fecha) {
        mostrarMensaje('Completa todos los campos', 'error', '❌');
        return;
    }
    
    const horariosSeleccionados = [];
    const checkboxes = document.querySelectorAll('#checkboxHorarios input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
        mostrarMensaje('Selecciona al menos un horario', 'error', '❌');
        return;
    }
    
    checkboxes.forEach(checkbox => {
        horariosSeleccionados.push(checkbox.value);
    });
    
    const nuevoCurso = {
        id: 'curso_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        nombre: nombreCurso,
        descripcion: descripcion,
        fecha: fecha,
        horarios: horariosSeleccionados,
        profesor: usuarioActual,
        fechaPublicacion: new Date().toISOString()
    };
    
    cursos = JSON.parse(localStorage.getItem('cursos')) || [];
    cursos.push(nuevoCurso);
    localStorage.setItem('cursos', JSON.stringify(cursos));
    
    document.getElementById('nombreCurso').value = '';
    document.getElementById('descripcionTemasCurso').value = '';
    document.getElementById('fechaCursoProfesor').value = '';
    document.querySelectorAll('#checkboxHorarios input[type="checkbox"]').forEach(cb => { cb.checked = false; });
    
    cargarHorariosProfesor();
    mostrarMensaje('Curso publicado exitosamente', 'exito', '✅');
}

function editarCurso(cursoId) {
    cursos = JSON.parse(localStorage.getItem('cursos')) || [];
    const curso = cursos.find(c => c.id === cursoId);
    if (!curso) return;
    
    document.getElementById('nombreCurso').value = curso.nombre;
    document.getElementById('descripcionTemasCurso').value = curso.descripcion;
    document.getElementById('fechaCursoProfesor').value = curso.fecha;
    
    document.querySelectorAll('#checkboxHorarios input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = curso.horarios.includes(checkbox.value);
    });
    
    eliminarCurso(cursoId, false);
    mostrarMensaje('Edita los datos del curso y haz clic en "Publicar Curso" para guardar cambios', 'info', '✏️');
}

function eliminarCurso(cursoId, mostrarMensajeConfirmacion = true) {
    if (mostrarMensajeConfirmacion && !confirm('¿Estás seguro de eliminar este curso?')) {
        return;
    }
    
    cursos = JSON.parse(localStorage.getItem('cursos')) || [];
    cursos = cursos.filter(c => c.id !== cursoId);
    localStorage.setItem('cursos', JSON.stringify(cursos));
    
    cargarHorariosProfesor();
    if (mostrarMensajeConfirmacion) {
        mostrarMensaje('Curso eliminado exitosamente', 'exito', '✅');
    }
}

// ========== PROFESOR: SOLICITUDES E INDICACIONES ==========
function cargarSolicitudesProfesor() {
    const solicitudesDiv = document.getElementById('solicitudes');
    if (!solicitudesDiv) return;
    
    cursos = JSON.parse(localStorage.getItem('cursos')) || [];
    const cursosProfesor = cursos.filter(curso => curso.profesor === usuarioActual);
    const cursosIds = cursosProfesor.map(curso => curso.id);
    
    const solicitudesProfesor = solicitudes.filter(solicitud => 
        cursosIds.includes(solicitud.cursoId) || (solicitud.tipo === 'manual' && solicitud.estado === 'pendiente')
    );
    
    if (solicitudesProfesor.length === 0) {
        solicitudesDiv.innerHTML = `<div style="text-align: center; padding: 40px; color: #666;"><span style="font-size: 3rem; display: block; margin-bottom: 15px;">📭</span><p>No hay solicitudes pendientes.</p></div>`;
        return;
    }
    
    let html = '';
    solicitudesProfesor.forEach(solicitud => {
        const fechaSolicitud = new Date(solicitud.fechaSolicitud).toLocaleDateString('es-ES');
        const horaSolicitud = new Date(solicitud.fechaSolicitud).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        let cursoInfo = '';
        if (solicitud.cursoId) {
            const curso = cursos.find(c => c.id === solicitud.cursoId);
            if (curso) {
                cursoInfo = `<p class="solicitud-curso"><strong>📚 Curso:</strong> ${curso.nombre}</p>`;
            }
        } else if (solicitud.cursoNombre) {
            cursoInfo = `<p class="solicitud-curso"><strong>📚 Curso solicitado:</strong> ${solicitud.cursoNombre}</p>`;
        }
        
        let descripcionHtml = '';
        if (solicitud.descripcion) {
            descripcionHtml = `
                <div class="descripcion-detallada">
                    <p class="descripcion-titulo"><span>📋</span> Descripción detallada del estudiante:</p>
                    <p class="descripcion-contenido">${solicitud.descripcion.replace(/\n/g, '<br>')}</p>
                </div>
            `;
        }
        
        html += `
            <div class="solicitud-item" data-id="${solicitud.id}">
                <div class="solicitud-header">
                    <div class="solicitud-info">
                        <div class="solicitud-estudiante"><span>👨‍🎓</span> ${solicitud.estudiante}<span class="solicitud-fecha" style="font-size: 0.85rem; margin-left: 15px;">📅 ${fechaSolicitud} - ${horaSolicitud}</span></div>
                        ${cursoInfo}
                        <p class="solicitud-horario"><span>🕐</span><strong>Horario solicitado:</strong> ${solicitud.horarioSolicitado}</p>
                        ${solicitud.fechaSolicitada ? `<p class="solicitud-fecha"><strong>📅 Fecha solicitada:</strong> ${solicitud.fechaSolicitada}</p>` : ''}
                    </div>
                    <div class="solicitud-estado estado-${solicitud.estado}">${solicitud.estado.toUpperCase()}</div>
                </div>
                ${descripcionHtml}
                <div class="solicitud-acciones">
                    ${solicitud.estado === 'pendiente' ? `
                        <button class="btn-aprobar" onclick="aprobarSolicitud('${solicitud.id}')"><span>✅</span> Aprobar</button>
                        <button class="btn-rechazar" onclick="rechazarSolicitud('${solicitud.id}')"><span>❌</span> Rechazar</button>
                    ` : ''}
                    <button class="btn-enviar-indicacion" onclick="mostrarFormularioIndicaciones('${solicitud.id}', '${solicitud.estudiante}')"><span>📨</span> Enviar Indicaciones</button>
                </div>
                <div class="panel-indicaciones" id="panelIndicaciones_${solicitud.id}">
                    <div class="form-indicaciones">
                        <textarea id="mensajeIndicacion_${solicitud.id}" class="input-indicaciones" placeholder="✏️ Escribe las indicaciones para ${solicitud.estudiante}..." rows="3"></textarea>
                        <input type="text" id="enlaceCurso_${solicitud.id}" class="input-indicaciones" placeholder="🔗 Enlace del curso (opcional)">
                        <button class="btn-enviar-indicaciones" onclick="enviarIndicacion('${solicitud.id}', '${solicitud.estudiante}')"><span>📨</span> Enviar Indicaciones</button>
                    </div>
                </div>
                <div id="indicacionesExistente_${solicitud.id}"></div>
            </div>
        `;
    });
    
    solicitudesDiv.innerHTML = html;
    
    solicitudesProfesor.forEach(solicitud => {
        cargarIndicacionesSolicitud(solicitud.id, solicitud.estudiante);
    });
}

function mostrarFormularioIndicaciones(solicitudId, estudiante) {
    const panel = document.getElementById(`panelIndicaciones_${solicitudId}`);
    const formularios = document.querySelectorAll('.panel-indicaciones');
    
    formularios.forEach(form => { form.classList.remove('visible'); });
    
    if (panel.classList.contains('visible')) {
        panel.classList.remove('visible');
    } else {
        panel.classList.add('visible');
        setTimeout(() => {
            const textarea = document.getElementById(`mensajeIndicacion_${solicitudId}`);
            if (textarea) textarea.focus();
        }, 100);
    }
}

function cargarIndicacionesSolicitud(solicitudId, estudiante) {
    const contenedor = document.getElementById(`indicacionesExistente_${solicitudId}`);
    if (!contenedor) return;
    
    const indicacionesFiltradas = indicaciones.filter(ind => 
        ind.estudiante === estudiante && ind.profesor === usuarioActual && ind.solicitudId === solicitudId
    );
    
    if (indicacionesFiltradas.length === 0) {
        contenedor.innerHTML = '';
        return;
    }
    
    indicacionesFiltradas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    let html = '<div style="margin-top: 20px;"><h4 style="margin-bottom: 15px; color: #555; font-size: 1.1rem;">📋 Indicaciones enviadas:</h4>';
    
    indicacionesFiltradas.forEach(indicacion => {
        const fecha = new Date(indicacion.fecha).toLocaleDateString('es-ES');
        const hora = new Date(indicacion.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        html += `
            <div class="indicacion-item">
                <div class="indicacion-header">
                    <div class="indicacion-estudiante"><span>📨</span><strong>Para:</strong> ${indicacion.estudiante}</div>
                    <div class="indicacion-fecha">📅 ${fecha} - ${hora}</div>
                </div>
                <div class="indicacion-mensaje">${indicacion.mensaje.replace(/\n/g, '<br>')}</div>
                ${indicacion.enlaceCurso ? `<a href="${indicacion.enlaceCurso}" target="_blank" class="indicacion-enlace">🔗 ${indicacion.enlaceCurso}</a>` : ''}
                <div class="indicacion-estado ${indicacion.vista ? 'indicacion-vista' : 'indicacion-pendiente'}">${indicacion.vista ? '✅ Vista por el estudiante' : '⏳ Pendiente de revisión'}</div>
                <div class="indicacion-acciones">
                    ${!indicacion.vista ? `<button class="btn-marcar-vista" onclick="marcarIndicacionComoVista('${indicacion.id}')">✅ Marcar como vista</button>` : ''}
                    <button class="btn-eliminar-indicacion" onclick="eliminarIndicacion('${indicacion.id}')">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    contenedor.innerHTML = html;
}

function enviarIndicacion(solicitudId, estudiante) {
    const mensaje = document.getElementById(`mensajeIndicacion_${solicitudId}`).value.trim();
    const enlaceCurso = document.getElementById(`enlaceCurso_${solicitudId}`).value.trim();
    
    if (!mensaje) {
        mostrarMensaje('Escribe las indicaciones primero', 'error', '❌');
        return;
    }
    
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) {
        mostrarMensaje('Solicitud no encontrada', 'error', '❌');
        return;
    }
    
    const nuevaIndicacion = {
        id: 'ind_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        profesor: usuarioActual,
        estudiante: estudiante,
        mensaje: mensaje,
        enlaceCurso: enlaceCurso || null,
        fecha: new Date().toISOString(),
        vista: false,
        profesorNombre: usuarioActual,
        solicitudId: solicitudId,
        cursoId: solicitud.cursoId,
        cursoNombre: solicitud.cursoNombre
    };
    
    indicaciones.push(nuevaIndicacion);
    localStorage.setItem('indicaciones', JSON.stringify(indicaciones));
    
    const cursoNombre = solicitud.cursoNombre || (solicitud.cursoId ? (cursos.find(c => c.id === solicitud.cursoId)?.nombre || 'curso') : 'curso');
    
    const notificacionEstudiante = {
        id: 'not_ind_' + Date.now(),
        usuario: estudiante,
        mensaje: `📨 El profesor ${usuarioActual} te ha enviado indicaciones para el curso "${cursoNombre}"`,
        fecha: new Date().toISOString(),
        tipo: 'indicacion',
        leida: false,
        indicacionId: nuevaIndicacion.id,
        solicitudId: solicitudId,
        cursoId: solicitud.cursoId
    };
    
    notis.push(notificacionEstudiante);
    localStorage.setItem('notis', JSON.stringify(notis));
    
    document.getElementById(`mensajeIndicacion_${solicitudId}`).value = '';
    document.getElementById(`enlaceCurso_${solicitudId}`).value = '';
    
    const panel = document.getElementById(`panelIndicaciones_${solicitudId}`);
    panel.classList.remove('visible');
    
    cargarIndicacionesSolicitud(solicitudId, estudiante);
    mostrarMensaje(`Indicaciones enviadas a ${estudiante}`, 'exito', '✅');
    cargarSolicitudesProfesor();
}

function eliminarIndicacion(indicacionId) {
    if (!confirm('¿Estás seguro de eliminar esta indicación?')) return;
    
    const indicacionIndex = indicaciones.findIndex(ind => ind.id === indicacionId);
    if (indicacionIndex === -1) return;
    
    const indicacion = indicaciones[indicacionIndex];
    indicaciones.splice(indicacionIndex, 1);
    localStorage.setItem('indicaciones', JSON.stringify(indicaciones));
    
    const indicacionElement = document.querySelector(`[data-id="${indicacion.solicitudId}"]`);
    if (indicacionElement) {
        cargarIndicacionesSolicitud(indicacion.solicitudId, indicacion.estudiante);
    }
    
    mostrarMensaje('Indicación eliminada', 'exito', '✅');
}

function aprobarSolicitud(solicitudId) {
    const solicitudIndex = solicitudes.findIndex(s => s.id === solicitudId);
    if (solicitudIndex !== -1) {
        solicitudes[solicitudIndex].estado = 'aprobada';
        localStorage.setItem('solicitudes', JSON.stringify(solicitudes));
        
        const solicitud = solicitudes[solicitudIndex];
        const cursoNombre = solicitud.cursoNombre || (solicitud.cursoId ? (cursos.find(c => c.id === solicitud.cursoId)?.nombre || 'curso') : 'curso');
        
        const notificacionEstudiante = {
            id: 'not_apr_' + Date.now(),
            usuario: solicitud.estudiante,
            mensaje: `✅ Tu solicitud para el curso "${cursoNombre}" ha sido aprobada por el profesor ${usuarioActual}`,
            fecha: new Date().toISOString(),
            tipo: 'aprobada',
            leida: false,
            cursoId: solicitud.cursoId,
            solicitudId: solicitudId
        };
        
        notis.push(notificacionEstudiante);
        localStorage.setItem('notis', JSON.stringify(notis));
        
        mostrarMensaje('Solicitud aprobada exitosamente', 'exito', '✅');
        cargarSolicitudesProfesor();
    }
}

function rechazarSolicitud(solicitudId) {
    const solicitudIndex = solicitudes.findIndex(s => s.id === solicitudId);
    if (solicitudIndex !== -1) {
        solicitudes[solicitudIndex].estado = 'rechazada';
        localStorage.setItem('solicitudes', JSON.stringify(solicitudes));
        
        const solicitud = solicitudes[solicitudIndex];
        const cursoNombre = solicitud.cursoNombre || (solicitud.cursoId ? (cursos.find(c => c.id === solicitud.cursoId)?.nombre || 'curso') : 'curso');
        
        const notificacionEstudiante = {
            id: 'not_rech_' + Date.now(),
            usuario: solicitud.estudiante,
            mensaje: `❌ Tu solicitud para el curso "${cursoNombre}" ha sido rechazada por el profesor ${usuarioActual}`,
            fecha: new Date().toISOString(),
            tipo: 'rechazada',
            leida: false,
            cursoId: solicitud.cursoId,
            solicitudId: solicitudId
        };
        
        notis.push(notificacionEstudiante);
        localStorage.setItem('notis', JSON.stringify(notis));
        
        mostrarMensaje('Solicitud rechazada', 'info', '❌');
        cargarSolicitudesProfesor();
    }
}

// ========== PAGO ==========
function seleccionarPlan(plan) {
    planSeleccionado = plan;
    mostrarPago();
}

function cargarResumenPlan(plan) {
    const planes = {
        'basico': { nombre: 'Plan Básico', precio: '9.99', icono: '🎓' },
        'avanzado': { nombre: 'Plan Avanzado', precio: '24.99', icono: '🚀' },
        'premium': { nombre: 'Plan Premium', precio: '49.99', icono: '🏆' }
    };
    
    const planData = planes[plan] || planes['basico'];
    
    document.getElementById('planIconResumen').textContent = planData.icono;
    document.getElementById('planNombreResumen').textContent = planData.nombre;
    document.getElementById('planPrecioResumen').innerHTML = `$${planData.precio}<span style="font-size: 1rem; color: #aaa;">/mes</span>`;
}

function actualizarPasos() {
    document.querySelectorAll('.pago-content').forEach(paso => { paso.classList.remove('active'); });
    
    const pasoActual = document.getElementById(`pagoStep${pasosPago}`);
    if (pasoActual) { pasoActual.classList.add('active'); }
    
    document.querySelectorAll('.step').forEach((paso, index) => {
        paso.classList.remove('active', 'completed');
        if (index + 1 === pasosPago) { paso.classList.add('active'); }
        else if (index + 1 < pasosPago) { paso.classList.add('completed'); }
    });
}

function siguientePaso(paso) {
    if (paso === 2 && pasosPago === 1) {
        if (!planSeleccionado) {
            mostrarMensaje('Por favor selecciona un plan primero', 'error', '❌');
            return;
        }
    }
    
    if (paso === 3 && pasosPago === 2) {
        if (!metodoPagoSeleccionado) {
            mostrarMensaje('Por favor selecciona un método de pago', 'error', '❌');
            return;
        }
        
        if (metodoPagoSeleccionado === 'tarjeta') {
            if (!validarDatosTarjeta()) { return; }
        }
        
        procesarPago();
        return;
    }
    
    pasosPago = paso;
    actualizarPasos();
}

function anteriorPaso() {
    if (pasosPago > 1) {
        pasosPago--;
        actualizarPasos();
    }
}

function seleccionarMetodo(metodo) {
    metodoPagoSeleccionado = metodo;
    
    document.querySelectorAll('.metodo-pago').forEach(metodoElement => { metodoElement.classList.remove('selected'); });
    
    const metodoElement = document.getElementById(`metodo${metodo.charAt(0).toUpperCase() + metodo.slice(1)}`);
    if (metodoElement) { metodoElement.classList.add('selected'); }
    
    document.querySelectorAll('.form-pago').forEach(form => { form.style.display = 'none'; });
    
    const formElement = document.getElementById(`form${metodo.charAt(0).toUpperCase() + metodo.slice(1)}`);
    if (formElement) { formElement.style.display = 'block'; }
    
    if (metodo === 'tarjeta') { agregarFormatosTarjeta(); }
}

function agregarFormatosTarjeta() {
    const numeroTarjetaInput = document.getElementById('numeroTarjeta');
    const expiracionInput = document.getElementById('expiracionTarjeta');
    
    if (numeroTarjetaInput) {
        numeroTarjetaInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) { formattedValue += ' '; }
                formattedValue += value[i];
            }
            e.target.value = formattedValue.substring(0, 19);
        });
    }
    
    if (expiracionInput) {
        expiracionInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) { e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4); }
            else { e.target.value = value; }
        });
        
        expiracionInput.addEventListener('blur', function(e) {
            let value = e.target.value.trim();
            if (value && value.length === 5 && value.includes('/')) {
                const [mesStr, anioStr] = value.split('/');
                const mes = parseInt(mesStr);
                if (mes < 1 || mes > 12) {
                    mostrarMensaje('El mes debe estar entre 01 y 12', 'error', '❌', 2000);
                    e.target.value = mesStr + '/';
                }
            }
        });
    }
}

function validarDatosTarjeta() {
    const numeroTarjeta = document.getElementById('numeroTarjeta').value.trim();
    const nombreTarjeta = document.getElementById('nombreTarjeta').value.trim();
    const expiracionTarjeta = document.getElementById('expiracionTarjeta').value.trim();
    const cvvTarjeta = document.getElementById('cvvTarjeta').value.trim();
    
    const numeroLimpio = numeroTarjeta.replace(/\s/g, '');
    
    if (!numeroLimpio || numeroLimpio.length < 16 || numeroLimpio.length > 19) {
        mostrarMensaje('Número de tarjeta inválido. Debe tener entre 16 y 19 dígitos.', 'error', '❌');
        return false;
    }
    if (!/^\d+$/.test(numeroLimpio)) {
        mostrarMensaje('El número de tarjeta solo puede contener dígitos.', 'error', '❌');
        return false;
    }
    if (!nombreTarjeta || nombreTarjeta.length < 3) {
        mostrarMensaje('Por favor ingresa el nombre completo en la tarjeta.', 'error', '❌');
        return false;
    }
    if (!expiracionTarjeta || !/^\d{2}\/\d{2}$/.test(expiracionTarjeta)) {
        mostrarMensaje('Fecha de expiración inválida. Usa el formato MM/AA.', 'error', '❌');
        return false;
    }
    
    const [mesStr, anioStr] = expiracionTarjeta.split('/');
    const mes = parseInt(mesStr);
    const anio = parseInt('20' + anioStr);
    const ahora = new Date();
    const anioActual = ahora.getFullYear();
    const mesActual = ahora.getMonth() + 1;
    
    if (mes < 1 || mes > 12) {
        mostrarMensaje('Mes inválido. Debe estar entre 01 y 12.', 'error', '❌');
        return false;
    }
    if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
        mostrarMensaje('La tarjeta está expirada.', 'error', '❌');
        return false;
    }
    
    const cvvLimpio = cvvTarjeta.replace(/\D/g, '');
    if (!cvvLimpio || cvvLimpio.length < 3 || cvvLimpio.length > 4) {
        mostrarMensaje('CVV inválido. Debe tener 3 o 4 dígitos numéricos.', 'error', '❌');
        return false;
    }
    
    return true;
}

function procesarPago() {
    if (!metodoPagoSeleccionado) {
        mostrarMensaje('Por favor selecciona un método de pago', 'error', '❌');
        return;
    }
    
    if (metodoPagoSeleccionado === 'tarjeta') {
        if (!validarDatosTarjeta()) { return; }
    }
    
    mostrarPagoLoader(true);
    
    let progreso = 0;
    const intervalo = setInterval(() => {
        progreso += 10;
        document.getElementById('pagoProgressBar').style.width = progreso + '%';
        
        if (progreso === 30) { document.getElementById('pagoLoaderText').textContent = 'Verificando datos...'; }
        else if (progreso === 60) { document.getElementById('pagoLoaderText').textContent = 'Procesando pago...'; }
        else if (progreso === 90) { document.getElementById('pagoLoaderText').textContent = 'Confirmando transacción...'; }
        else if (progreso >= 100) {
            clearInterval(intervalo);
            
            setTimeout(() => {
                mostrarPagoLoader(false);
                const numeroTransaccion = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                
                document.getElementById('numeroTransaccion').textContent = numeroTransaccion;
                document.getElementById('comprobantePlan').textContent = document.getElementById('planNombreResumen').textContent;
                document.getElementById('comprobanteMonto').textContent = document.getElementById('planPrecioResumen').textContent + ' USD';
                
                asignarPlanDespuesDePago();
                
                pasosPago = 3;
                actualizarPasos();
            }, 1000);
        }
    }, 300);
}

function asignarPlanDespuesDePago() {
    try {
        if (!planSeleccionado) return;
        
        let usuarioAActualizar = usuarioActual || usuarioRecienRegistrado;
        if (!usuarioAActualizar) {
            console.error('No hay usuario al que asignar el plan');
            return;
        }
        
        let userIndex = users.findIndex(x => x.u === usuarioAActualizar);
        if (userIndex === -1) {
            console.error('Usuario no encontrado');
            return;
        }
        
        users[userIndex].plan = planSeleccionado;
        localStorage.setItem('users', JSON.stringify(users));
        
        mostrarMensaje(`¡Plan ${planSeleccionado} activado exitosamente!`, 'exito', '✅');
        
        if (usuarioAActualizar === usuarioActual) {
            actualizarInfoPlanEstudiante();
        }
        
        planSeleccionado = null;
        metodoPagoSeleccionado = null;
        
    } catch (error) {
        console.error('Error al asignar plan después de pago:', error);
        mostrarMensaje('Error al activar el plan', 'error', '❌');
    }
}

function irAlDashboard() {
    if (usuarioActual) {
        const user = users.find(x => x.u === usuarioActual);
        if (user) {
            ocultarTodo();
            if (user.r === 'estudiante') {
                document.getElementById('estudiante').style.display = 'block';
                actualizarInfoPlanEstudiante();
                cargarNotificaciones();
            } else if (user.r === 'profesor') {
                document.getElementById('profesor').style.display = 'block';
                cargarHorariosProfesor();
                cargarCheckboxHorarios();
                cargarSolicitudesProfesor();
            }
        }
    } else if (usuarioRecienRegistrado) {
        mostrarLogin();
        mostrarMensaje('¡Registro completado! Ahora inicia sesión con tu nueva cuenta.', 'exito', '🔑');
    } else {
        mostrarLogin();
    }
}

function descargarComprobante() {
    mostrarMensaje('Generando comprobante...', 'info', '📄');
    
    const contenido = `
        <html>
        <head>
            <title>Comprobante de Pago - Plataforma Académica</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .details { margin: 20px 0; }
                .footer { margin-top: 50px; font-size: 0.9em; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Comprobante de Pago</h1>
                <p>Plataforma Académica de Excelencia</p>
            </div>
            <div class="details">
                <p><strong>Número de Transacción:</strong> ${document.getElementById('numeroTransaccion').textContent}</p>
                <p><strong>Plan:</strong> ${document.getElementById('comprobantePlan').textContent}</p>
                <p><strong>Monto:</strong> ${document.getElementById('comprobanteMonto').textContent}</p>
                <p><strong>Método de Pago:</strong> ${metodoPagoSeleccionado}</p>
                <p><strong>Usuario:</strong> ${usuarioActual || usuarioRecienRegistrado}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                <p><strong>Estado:</strong> Completado</p>
            </div>
            <div class="footer">
                <p>Este documento es un comprobante de pago electrónico.</p>
                <p>Plataforma Académica © ${new Date().getFullYear()}</p>
            </div>
        </body>
        </html>
    `;
    
    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    
    setTimeout(() => {
        ventana.print();
        mostrarMensaje('Comprobante generado exitosamente', 'exito', '✅');
    }, 500);
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('cursos')) {
        cursos = [];
        localStorage.setItem('cursos', JSON.stringify(cursos));
    } else {
        cursos = JSON.parse(localStorage.getItem('cursos')) || [];
    }
    
    if (!localStorage.getItem('solicitudes')) {
        localStorage.setItem('solicitudes', JSON.stringify([]));
    } else {
        solicitudes = JSON.parse(localStorage.getItem('solicitudes')) || [];
    }
    
    if (!localStorage.getItem('notis')) {
        localStorage.setItem('notis', JSON.stringify([]));
    } else {
        notis = JSON.parse(localStorage.getItem('notis')) || [];
    }
    
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    } else {
        users = JSON.parse(localStorage.getItem('users')) || [];
    }
    
    if (!localStorage.getItem('indicaciones')) {
        localStorage.setItem('indicaciones', JSON.stringify([]));
    } else {
        indicaciones = JSON.parse(localStorage.getItem('indicaciones')) || [];
    }
    
    inicializarSlider();
    
    cursosMostrados = false;
    usuarioRecienRegistrado = null;
    cursosRechazadosEnSesion = [];
    
    const btnVolverLogin = document.getElementById('btnVolverLogin');
    if (btnVolverLogin) { btnVolverLogin.onclick = volverDesdePlanes; }
    
    ocultarTodo();
    document.getElementById('presentacion').style.display = 'flex';
    
    setTimeout(() => {
        mostrarMensaje('¡Bienvenido a la Plataforma Académica!', 'info', '🎓');
    }, 1000);
});