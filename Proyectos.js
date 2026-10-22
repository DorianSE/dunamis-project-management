// proyectos.js - Funciones para la gestión de proyectos

// Esta función se ejecutará cuando se cargue el formulario de proyectos
function inicializarFormularioProyecto() {
    const form = document.getElementById('formProyecto');
    const mensaje = document.getElementById('mensajeProyecto');
    
    if (!form) {
        console.log('Formulario de proyectos no encontrado');
        return;
    }
    
    console.log('Inicializando formulario de proyectos...');
    
    // Cargar proyectos existentes
    cargarProyectos();
    
    // Configurar evento submit
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Obtener datos del formulario
        const proyectoData = {
            codigo: document.getElementById('codigo').value.trim(),
            nombre: document.getElementById('nombre').value.trim(),
            descripcion: document.getElementById('descripcion').value.trim(),
            fecha_inicio: document.getElementById('fecha_inicio').value,
            fecha_fin: document.getElementById('fecha_fin').value,
            estado: document.getElementById('estado').value
        };
        
        // Validaciones básicas
        if (!proyectoData.nombre) {
            mostrarMensajeProyecto('El nombre del proyecto es obligatorio', 'error');
            return;
        }
        
        if (!proyectoData.estado) {
            mostrarMensajeProyecto('Debe seleccionar un estado', 'error');
            return;
        }
        
        // Mostrar mensaje de procesando
        mostrarMensajeProyecto('Creando proyecto...', 'info');
        
        try {
            // Enviar al backend
            const respuesta = await fetch('/api/proyectos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proyectoData)
            });
            
            const data = await respuesta.json();
            
            if (respuesta.ok) {
                mostrarMensajeProyecto(`✅ Proyecto "${proyectoData.nombre}" creado exitosamente con ID: ${data.proyecto_id}`, 'success');
                form.reset();
                cargarProyectos(); // Recargar la lista
            } else {
                mostrarMensajeProyecto(`❌ Error: ${data.error || 'Error al crear proyecto'}`, 'error');
            }
        } catch (error) {
            mostrarMensajeProyecto('❌ Error de conexión con el servidor', 'error');
            console.error('Error al crear proyecto:', error);
        }
    });
    
    console.log('Formulario de proyectos inicializado correctamente');
}

function limpiarFormularioProyecto() {
    const form = document.getElementById('formProyecto');
    const mensaje = document.getElementById('mensajeProyecto');
    
    if (form) form.reset();
    if (mensaje) {
        mensaje.textContent = '';
        mensaje.className = 'mensaje-proyecto';
    }
}

async function cargarProyectos() {
    const container = document.getElementById('proyectosContainer');
    if (!container) {
        console.log('Contenedor de proyectos no encontrado');
        return;
    }
    
    try {
        const respuesta = await fetch('/api/proyectos');
        
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        
        const proyectos = await respuesta.json();
        
        if (!Array.isArray(proyectos)) {
            throw new Error('La respuesta no es un array');
        }
        
        if (proyectos.length === 0) {
            container.innerHTML = '<p style="color: #718096; text-align: center;">No hay proyectos registrados.</p>';
            return;
        }
        
        let html = '';
        proyectos.forEach(proyecto => {
            // Crear clase CSS para el estado
            const estadoClass = proyecto.estado 
                ? `estado-${proyecto.estado.toLowerCase().replace(' ', '-')}` 
                : 'estado-planificado';
            
            // Formatear fechas
            const fechaInicio = proyecto.fecha_inicio 
                ? new Date(proyecto.fecha_inicio).toLocaleDateString('es-ES')
                : 'No definida';
                
            const fechaFin = proyecto.fecha_fin 
                ? new Date(proyecto.fecha_fin).toLocaleDateString('es-ES')
                : 'No definida';
            
            html += `
                <div class="proyecto-item">
                    <div class="proyecto-header">
                        <span class="proyecto-codigo">${proyecto.codigo || 'Sin código'}</span>
                        <span class="proyecto-estado ${estadoClass}">${proyecto.estado || 'Planificado'}</span>
                    </div>
                    <div class="proyecto-nombre"><strong>${proyecto.nombre}</strong></div>
                    ${proyecto.descripcion ? `<div class="proyecto-descripcion">${proyecto.descripcion.substring(0, 100)}${proyecto.descripcion.length > 100 ? '...' : ''}</div>` : ''}
                    <div class="proyecto-fechas">
                        <small>Inicio: ${fechaInicio} | Fin: ${fechaFin}</small>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error cargando proyectos:', error);
        container.innerHTML = '<p style="color: #c53030; text-align: center;">Error al cargar los proyectos. Por favor, intente nuevamente.</p>';
    }
}

function mostrarMensajeProyecto(texto, tipo) {
    const mensaje = document.getElementById('mensajeProyecto');
    if (!mensaje) return;
    
    mensaje.textContent = texto;
    mensaje.className = 'mensaje-proyecto';
    
    // Añadir clase según el tipo
    if (tipo === 'error') {
        mensaje.classList.add('mensaje-error');
    } else if (tipo === 'success') {
        mensaje.classList.add('mensaje-success');
    } else {
        mensaje.classList.add('mensaje-info');
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Verificar si estamos en la página de proyectos
        if (document.getElementById('formProyecto')) {
            inicializarFormularioProyecto();
        }
    });
} else {
    // DOM ya cargado
    if (document.getElementById('formProyecto')) {
        inicializarFormularioProyecto();
    }
}