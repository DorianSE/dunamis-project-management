// ========== SISTEMA DE AUTENTICACIÓN ==========

let usuarioActual = null;

// Función para iniciar sesión
async function iniciarSesion() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const mensaje = document.getElementById('loginMessage');

  // Limpiar mensaje anterior
  mensaje.textContent = '';
  mensaje.style.color = '';

  if (!username || !password) {
    mensaje.textContent = 'Por favor ingrese usuario y contraseña';
    mensaje.style.color = '#c53030';
    return;
  }

  try {
    const respuesta = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await respuesta.json();

    if (respuesta.ok) {
      usuarioActual = data.user;
      localStorage.setItem('usuario', JSON.stringify(usuarioActual));
      
      // Limpiar mensaje
      mensaje.textContent = '';
      
      // Actualizar interfaz
      document.getElementById('loginFormContainer').style.display = 'none';
      document.getElementById('userInfoContainer').style.display = 'flex';
      document.getElementById('userNameDisplay').textContent = `Bienvenido, ${usuarioActual.username} (${usuarioActual.rol_nombre})`;
      
      // Mostrar TODAS las secciones protegidas
      document.querySelectorAll('.menu a.protected').forEach(enlace => {
        enlace.style.display = 'block';
      });
      
      // Ocultar SOLO Inicio y Portafolio (no todas las no protegidas)
      document.querySelectorAll('.menu a:not(.protected)').forEach(enlace => {
        const texto = enlace.textContent.trim();
        if (texto === '🏠 Inicio' || texto === '📂 Portafolio de Éxitos') {
          enlace.style.display = 'none';
          enlace.classList.remove('active');
        }
      });

      // Cargar primera sección protegida
      const primerEnlaceProtegido = document.querySelector('.menu a.protected');
      if (primerEnlaceProtegido) {
        primerEnlaceProtegido.classList.add('active');
        showScreen({ preventDefault: () => {}, target: primerEnlaceProtegido }, 'crearReportes');
      }
    } else {
      mensaje.textContent = data.error || 'Error en el login';
      mensaje.style.color = '#c53030';
    }
  } catch (error) {
    mensaje.textContent = 'Error de conexión con el servidor';
    mensaje.style.color = '#c53030';
    console.error('Error en login:', error);
  }
}

// Función para cerrar sesión
function cerrarSesion() {
  usuarioActual = null;
  localStorage.removeItem('usuario');
  
  // Limpiar mensaje de login
  const mensaje = document.getElementById('loginMessage');
  mensaje.textContent = '';
  
  // Restaurar interfaz
  document.getElementById('loginFormContainer').style.display = 'flex';
  document.getElementById('userInfoContainer').style.display = 'none';
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  
  // Ocultar TODAS las secciones protegidas
  document.querySelectorAll('.menu a.protected').forEach(enlace => {
    enlace.style.display = 'none';
    enlace.classList.remove('active');
  });
  
  // Mostrar SOLO Inicio y Portafolio
  document.querySelectorAll('.menu a:not(.protected)').forEach(enlace => {
    const texto = enlace.textContent.trim();
    if (texto === '🏠 Inicio' || texto === '📂 Portafolio de Éxitos') {
      enlace.style.display = 'block';
      enlace.classList.remove('active');
    }
  });

  // Activar y mostrar la sección de inicio
  const enlaceInicio = document.querySelector('.menu a[onclick*="inicio"]');
  if (enlaceInicio) {
    enlaceInicio.classList.add('active');
    showScreen({ preventDefault: () => {}, target: enlaceInicio }, 'inicio');
  }
}

// Verificar si hay usuario logueado al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  const usuarioGuardado = localStorage.getItem('usuario');
  
  if (usuarioGuardado) {
    usuarioActual = JSON.parse(usuarioGuardado);
    
    // Actualizar interfaz si hay usuario guardado
    document.getElementById('loginFormContainer').style.display = 'none';
    document.getElementById('userInfoContainer').style.display = 'block';
    document.getElementById('userNameDisplay').textContent = `Bienvenido, ${usuarioActual.username} (${usuarioActual.rol_nombre})`;
    
    // Mostrar TODAS las secciones protegidas
    document.querySelectorAll('.menu a.protected').forEach(enlace => {
      enlace.style.display = 'block';
    });
    
    // Ocultar SOLO Inicio y Portafolio
    document.querySelectorAll('.menu a:not(.protected)').forEach(enlace => {
      const texto = enlace.textContent.trim();
      if (texto === '🏠 Inicio' || texto === '📂 Portafolio de Éxitos') {
        enlace.style.display = 'none';
      }
    });

    // Cargar primera sección protegida
    const primerEnlaceProtegido = document.querySelector('.menu a.protected');
    if (primerEnlaceProtegido) {
      showScreen({ preventDefault: () => {}, target: primerEnlaceProtegido }, 'crearReportes');
    }
  } else {
    // Si no hay usuario, mostrar pantalla de inicio
    const enlaceInicio = document.querySelector('.menu a[onclick*="inicio"]');
    if (enlaceInicio) {
      showScreen({ preventDefault: () => {}, target: enlaceInicio }, 'inicio');
    }
  }
});

// Modificar la función showScreen para controlar acceso
const showScreenOriginal = window.showScreen;
window.showScreen = function(event, seccion) {
  // Verificar si la sección es protegida y no hay usuario logueado
  const seccionesProtegidas = ['usuario', 'crearReportes', 'recursos', 'reportes', 'progreso', 'costos', 'ajustes'];
  
  if (seccionesProtegidas.includes(seccion) && !usuarioActual) {
    alert('Debe iniciar sesión para acceder a esta sección');
    return;
  }
  
  // Si la sección es pública y el usuario está logueado, no permitir acceso
  const seccionesPublicas = ['inicio', 'portafolio'];
  if (seccionesPublicas.includes(seccion) && usuarioActual) {
    alert('Esta sección no está disponible después del login');
    return;
  }
  
  // Llamar a la función original
  showScreenOriginal(event, seccion);
};

function showScreen(event, seccion) {
  event.preventDefault();

  document.querySelectorAll('.menu a').forEach(link => link.classList.remove('active'));
  event.target.classList.add('active');

  fetch(`/screens/${seccion}.html`)
    .then(res => {
      if (!res.ok) throw new Error(`No se pudo cargar screens/${seccion}.html (HTTP ${res.status})`);
      return res.text();
    })
    .then(html => {
      const contenedor = document.getElementById('contenido');
      contenedor.innerHTML = html;
      // Los scripts insertados con innerHTML no se ejecutan automáticamente.
      // Reemplazarlos por elementos nuevos permite inicializar los módulos de cada pantalla.
      contenedor.querySelectorAll('script').forEach(scriptOriginal => {
        const scriptNuevo = document.createElement('script');
        for (const atributo of scriptOriginal.attributes) scriptNuevo.setAttribute(atributo.name, atributo.value);
        scriptNuevo.textContent = scriptOriginal.textContent;
        scriptOriginal.replaceWith(scriptNuevo);
      });
      if (seccion === 'usuario') inicializarFormularioUsuarios();
    })
    .catch(err => {
      document.getElementById('contenido').innerHTML = `<p class="error-carga">No se pudo cargar la sección «${seccion}». Abra DUNAMIS desde http://localhost:3001 y compruebe que el servidor esté activo.</p>`;
      console.error('Error cargando sección:', seccion, err);
    });
}

function inicializarFormularioUsuarios() {
  const form = document.getElementById('formUsuario');
  const mensaje = document.getElementById('mensaje');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value.trim();
    const role_id = document.getElementById('role_id').value;

    // Validaciones frontend (las mismas que ya tenías)
    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ_]+$/;

    if (!username || !password || !role_id) {
      mensaje.textContent = 'Todos los campos obligatorios deben completarse.';
      mensaje.style.color = '#c53030';
      return;
    }

    if (!soloLetras.test(username)) {
      mensaje.textContent = 'El nombre de usuario no puede contener números ni símbolos.';
      mensaje.style.color = '#c53030';
      return;
    }

    if (email && (!email.includes('@') || !email.includes('.'))) {
      mensaje.textContent = 'El correo electrónico no es válido.';
      mensaje.style.color = '#c53030';
      return;
    }

    // Mostrar mensaje de "procesando"
    mensaje.textContent = 'Creando usuario...';
    mensaje.style.color = '#22543d';

    try {
      // Enviar datos al backend
      const respuesta = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          password: password,
          email: email || null,
          role_id: parseInt(role_id)
        })
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        // Éxito
        mensaje.textContent = `✅ Usuario "${username}" creado exitosamente con ID: ${data.usuario_id}`;
        mensaje.style.color = '#22543d';
        
        // Limpiar formulario
        form.reset();
        
      } else {
        // Error del backend
        mensaje.textContent = `❌ Error: ${data.error || 'Error desconocido'}`;
        mensaje.style.color = '#c53030';
      }
      
    } catch (error) {
      // Error de red o conexión
      mensaje.textContent = '❌ Error de conexión con el servidor';
      mensaje.style.color = '#c53030';
      console.error('Error al crear usuario:', error);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const enlaceInicio = document.querySelector('.menu a[onclick*="inicio"]');

  if (enlaceInicio) {
    showScreen({ preventDefault: () => {}, target: enlaceInicio }, 'inicio');
  }
});

//recursos
function inicializarAsignacionRecursos() {
  const boton = document.querySelector('#formAsignar button');
  if (boton) {
    boton.addEventListener('click', asignarRecurso);
  }
}

function asignarRecurso() {
  const proyecto = document.getElementById('proyectoAsignar').value;
  const recurso = document.getElementById('recursoAsignar').value;
  const cantidad = parseInt(document.getElementById('cantidadAsignar').value);
  const mensaje = document.getElementById('mensajeAsignar');

  if (!proyecto || !recurso || isNaN(cantidad) || cantidad < 1) {
    mensaje.textContent = 'Todos los campos deben completarse correctamente.';
    mensaje.style.color = 'red';
    return;
  }

  mensaje.textContent = `✅ Recurso asignado: ${cantidad} × ${recurso} al ${proyecto}.`;
  mensaje.style.color = 'green';

  // Opcional: limpiar el formulario
  document.getElementById('formAsignar').reset();
}

//reporte

function exportarReporte() {
  const tipo = document.getElementById('tipoReporte').value;
  const mensaje = document.getElementById('mensajeExportar');

  mensaje.classList.remove('success', 'error');

  if (!tipo) {
    mensaje.textContent = '❌ Seleccione un tipo de reporte.';
    mensaje.classList.add('error');
    return;
  }

  const tablaId = `tabla${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
  const tabla = document.getElementById(tablaId);

  if (!tabla) {
    mensaje.textContent = '❌ No se encontró la tabla para ese reporte.';
    mensaje.classList.add('error');
    return;
  }

  tabla.classList.remove('hidden');

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(tabla);
  XLSX.utils.book_append_sheet(wb, ws, tipo);
  XLSX.writeFile(wb, `Reporte_${tipo}.xlsx`);

  mensaje.textContent = `✅ Reporte de ${tipo} exportado correctamente.`;
  mensaje.classList.add('success');

  setTimeout(() => tabla.classList.add('hidden'), 500);
  setTimeout(() => mensaje.textContent = '', 4000);
}

function asignarRecurso() {
  const proyecto = document.getElementById("proyectoAsignar").value;
  const recurso = document.getElementById("recursoAsignar").value;
  const cantidad = document.getElementById("cantidadAsignar").value;
  const mensaje = document.getElementById("mensajeAsignar");
  const formulario = document.getElementById("formAsignar");

  if (!proyecto || !recurso || !cantidad) {
    mensaje.innerHTML = "<p style='color:red;'>⚠️ Por favor complete todos los campos antes de asignar.</p>";
    return;
  }

  mensaje.innerHTML = `<p style='color:green;'>✅ Recurso asignado: ${cantidad} × ${recurso} al proyecto ${proyecto}.</p>`;

  // Limpia el formulario después de asignar
  formulario.reset();
}

function eliminarRecurso() {
  const proyecto = document.getElementById("proyectoAsignar").value;
  const recurso = document.getElementById("recursoAsignar").value;
  const cantidad = document.getElementById("cantidadAsignar").value;
  const mensaje = document.getElementById("mensajeAsignar");
  const formulario = document.getElementById("formAsignar");

  if (!proyecto || !recurso || !cantidad) {
    mensaje.innerHTML = "<p style='color:red;'>⚠️ Debe seleccionar un proyecto, recurso y cantidad para eliminar.</p>";
    return;
  }

  mensaje.innerHTML = `<p style='color:orange;'> Recurso eliminado: ${cantidad} × ${recurso} en el proyecto ${proyecto}.</p>`;

  // Limpia el formulario después de eliminar
  formulario.reset();
}

function agregarRecurso() {
  const container = document.getElementById("recursosContainer");
  const div = document.createElement("div");
  div.className = "recurso";
  div.innerHTML = `
    <input type="text" name="recurso[]" placeholder="Nombre del recurso" required />
    <input type="number" name="cantidad[]" placeholder="Cantidad" required />
  `;
  container.appendChild(div);
}

document.getElementById("formReporte")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    nombre: form.nombre.value,
    tipo: form.tipo.value,
    recursos: Array.from(form.querySelectorAll(".recurso")).map(div => ({
      nombre: div.querySelector("input[name='recurso[]']").value,
      cantidad: parseInt(div.querySelector("input[name='cantidad[]']").value)
    }))
  };

  const res = await fetch("/api/reportes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (res.ok) {
    alert("Reporte creado exitosamente");
    form.reset();
    document.getElementById("recursosContainer").innerHTML = "";
    agregarRecurso();
  } else {
    alert("Error al crear el reporte");
  }
});

async function cargarReportes() {
  const res = await fetch("/api/reportes");
  const reportes = await res.json();
  const select = document.getElementById("reporteSelect");
  reportes.forEach(r => {
    const option = document.createElement("option");
    option.value = r.id;
    option.textContent = `${r.nombre} (${r.tipo})`;
    select.appendChild(option);
  });
}

document.getElementById("reporteSelect")?.addEventListener("change", async (e) => {
  const id = e.target.value;
  if (!id) return;
  const res = await fetch(`/api/reportes`);
  const reportes = await res.json();
  const reporte = reportes.find(r => r.id == id);
  const div = document.getElementById("recursosReporte");
  div.innerHTML = `<h4>Recursos actuales:</h4>` + reporte.recursos.map(r =>
    `<p>${r.nombre} - ${r.cantidad}</p>`
  ).join("");
});

document.getElementById("formAgregarRecurso")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("reporteSelect").value;
  if (!id) return alert("Selecciona un reporte primero");

  const recurso = document.getElementById("recurso").value;
  const cantidad = parseInt(document.getElementById("cantidad").value);

  const res = await fetch(`/api/reportes`);
  const reportes = await res.json();
  const reporte = reportes.find(r => r.id == id);
  reporte.recursos.push({ nombre: recurso, cantidad });

  await fetch(`/api/reportes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reporte)
  });

  alert("Recurso agregado");
  document.getElementById("formAgregarRecurso").reset();
  document.getElementById("reporteSelect").dispatchEvent(new Event("change"));
});

//cargarReportes();

function agregarRecurso() {
  const container = document.getElementById("recursosContainer");

  const div = document.createElement("div");
  div.classList.add("recurso");

  const selectRecurso = document.createElement("select");
  selectRecurso.name = "recurso[]";
  selectRecurso.required = true;
  selectRecurso.innerHTML = `
    <option value="">Seleccione recurso</option>
    <option value="Material">Material</option>
    <option value="Herramienta">Herramienta</option>
    <option value="Personal">Personal</option>
    <option value="Equipo">Equipo</option>
  `;

  const inputCantidad = document.createElement("input");
  inputCantidad.type = "number";
  inputCantidad.name = "cantidad[]";
  inputCantidad.placeholder = "Cantidad";
  inputCantidad.required = true;
  inputCantidad.min = 1;

  const botonEliminar = document.createElement("button");
  botonEliminar.type = "button";
  botonEliminar.textContent = "Eliminar";
  botonEliminar.onclick = function () {
    container.removeChild(div);
  };

  div.appendChild(selectRecurso);
  div.appendChild(inputCantidad);
  div.appendChild(botonEliminar);

  container.appendChild(div);
}

function eliminarRecurso(boton) {
  const recurso = boton.parentNode;
  recurso.remove();
}

// Inicializar formulario de proyectos cuando se cargue la sección
function inicializarCreacionProyectos() {
  // Este script ya está incluido en el HTML, no necesita inicialización adicional
  console.log('Formulario de proyectos cargado');
}

// Modificar la función showScreen para inicializar el formulario de proyectos
const originalShowScreen = window.showScreen;
window.showScreen = function(event, seccion) {
  // Primero llamar a la función original
  originalShowScreen(event, seccion);
  
  // Luego inicializar formularios específicos
  if (seccion === 'crearReportes') {
    // Dar tiempo a que cargue el contenido dinámico
    setTimeout(() => {
      if (typeof inicializarFormularioProyecto === 'function') {
        inicializarFormularioProyecto();
      }
    }, 100);
  }
};

// Manejar inicialización de formularios específicos cuando se cargan dinámicamente
function inicializarFormulariosDinamicos() {
    // Verificar si el formulario de proyectos está presente
    if (document.getElementById('formProyecto') && typeof inicializarFormularioProyecto === 'function') {
        console.log('Inicializando formulario de proyectos dinámicamente...');
        inicializarFormularioProyecto();
    }
}

// Observar cambios en el contenido dinámico
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Esperar un momento para que el contenido se renderice
            setTimeout(inicializarFormulariosDinamicos, 100);
        }
    });
});

// Configurar el observer
observer.observe(document.getElementById('contenido'), {
    childList: true,
    subtree: true
});