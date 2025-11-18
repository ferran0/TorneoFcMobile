document.addEventListener('DOMContentLoaded', () => {
    inicializar();
    cargarDatos();
    document.getElementById('botonAdmin').addEventListener('click', solicitarAccesoAdmin);
});

const CLAVE_ADMIN = "0007";

let jugadores = [];
let codigos = [];
let partidos = [];

function inicializar() {
    if (!localStorage.getItem('jugadores')) {
        localStorage.setItem('jugadores', JSON.stringify([]));
    }
    if (!localStorage.getItem('codigos')) {
        localStorage.setItem('codigos', JSON.stringify([]));
    }
    if (!localStorage.getItem('partidos')) {
        localStorage.setItem('partidos', JSON.stringify([]));
    }
}

function cargarDatos() {
    jugadores = JSON.parse(localStorage.getItem('jugadores'));
    codigos = JSON.parse(localStorage.getItem('codigos'));
    partidos = JSON.parse(localStorage.getItem('partidos'));

    renderTablaPosiciones();
    renderCalendario();
    renderJugadoresAdmin();
    renderCodigosAdmin();
    renderPartidosPendientes();
    actualizarOpcionesJugadores();
}

function guardarDatos() {
    localStorage.setItem('jugadores', JSON.stringify(jugadores));
    localStorage.setItem('codigos', JSON.stringify(codigos));
    localStorage.setItem('partidos', JSON.stringify(partidos));
}

function mostrarSeccion(id) {
    document.querySelectorAll('section.contenedor').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

function solicitarAccesoAdmin() {
    const clave = prompt("Introduce la clave de administrador:");
    if (clave === CLAVE_ADMIN) {
        mostrarSeccion('admin');
    } else {
        alert("Clave incorrecta.");
    }
}

// 🔐 1. Sistema de códigos de registro
function generarCodigo() {
    let codigo;
    do {
        codigo = Math.floor(1000 + Math.random() * 9000).toString();
    } while (codigos.some(c => c.codigo === codigo));
    codigos.push({ codigo, usado: false });
    guardarDatos();
    renderCodigosAdmin();
}

// 🧑‍💻 2. Registro de jugadores
function registrarJugador() {
    const nombre = document.getElementById('nombreJugador').value.trim();
    const codigoIngresado = document.getElementById('codigoRegistro').value.trim();
    const mensajeRegistro = document.getElementById('mensaje-registro');

    if (!nombre || !codigoIngresado) {
        mensajeRegistro.textContent = "Ambos campos son obligatorios.";
        return;
    }

    const codigoValido = codigos.find(c => c.codigo === codigoIngresado && !c.usado);
    if (!codigoValido) {
        mensajeRegistro.textContent = "Código inválido o ya utilizado.";
        return;
    }

    if (jugadores.some(j => j.nombre.toLowerCase() === nombre.toLowerCase())) {
        mensajeRegistro.textContent = "Ya existe un jugador con este nombre.";
        return;
    }

    jugadores.push({
        nombre,
        pj: 0, pg: 0, pe: 0, pp: 0,
        gf: 0, gc: 0, dg: 0, puntos: 0
    });
    codigoValido.usado = true;
    guardarDatos();
    alert("¡Registro exitoso! Ya eres parte del torneo.");
    document.getElementById('nombreJugador').value = '';
    document.getElementById('codigoRegistro').value = '';
    cargarDatos();
}

// 📅 3. Calendario
function registrarPartido() {
    const jugadorA = document.getElementById('jugadorA').value;
    const jugadorB = document.getElementById('jugadorB').value;
    const fecha = document.getElementById('fechaPartido').value;
    const hora = document.getElementById('horaPartido').value;
    const mensajePartido = document.getElementById('mensaje-partido');

    if (!jugadorA || !jugadorB || !fecha || !hora) {
        mensajePartido.textContent = "Todos los campos son obligatorios.";
        return;
    }
    if (jugadorA === jugadorB) {
        mensajePartido.textContent = "Los jugadores deben ser diferentes.";
        return;
    }
    if (partidos.some(p => (p.jugadorA === jugadorA && p.jugadorB === jugadorB && !p.jugado) || (p.jugadorA === jugadorB && p.jugadorB === jugadorA && !p.jugado))) {
        mensajePartido.textContent = "Este partido ya está programado.";
        return;
    }

    partidos.push({ jugadorA, jugadorB, fecha, hora, resultadoA: null, resultadoB: null, jugado: false });
    guardarDatos();
    alert("Partido programado con éxito.");
    cargarDatos();
}

// 🏆 4. Registrar resultados
function registrarResultado() {
    const partidoSeleccionado = document.getElementById('partidosPendientes').value;
    const golesA = parseInt(document.getElementById('golesA').value);
    const golesB = parseInt(document.getElementById('golesB').value);
    const mensajeResultado = document.getElementById('mensaje-resultado');

    if (!partidoSeleccionado || isNaN(golesA) || isNaN(golesB) || golesA < 0 || golesB < 0) {
        mensajeResultado.textContent = "Selecciona un partido e ingresa goles válidos.";
        return;
    }

    const [jugadorANombre, jugadorBNombre] = partidoSeleccionado.split('|');
    const partidoIndex = partidos.findIndex(p => p.jugadorA === jugadorANombre && p.jugadorB === jugadorBNombre && !p.jugado);

    if (partidoIndex === -1) {
        mensajeResultado.textContent = "Error al encontrar el partido.";
        return;
    }

    const partido = partidos[partidoIndex];
    partido.resultadoA = golesA;
    partido.resultadoB = golesB;
    partido.jugado = true;

    // Actualizar estadísticas de jugadores
    const jugadorAObj = jugadores.find(j => j.nombre === jugadorANombre);
    const jugadorBObj = jugadores.find(j => j.nombre === jugadorBNombre);

    jugadorAObj.pj++;
    jugadorBObj.pj++;
    jugadorAObj.gf += golesA;
    jugadorBObj.gf += golesB;
    jugadorAObj.gc += golesB;
    jugadorBObj.gc += golesA;

    if (golesA > golesB) {
        jugadorAObj.pg++;
        jugadorBObj.pp++;
        jugadorAObj.puntos += 3;
    } else if (golesA < golesB) {
        jugadorBObj.pg++;
        jugadorAObj.pp++;
        jugadorBObj.puntos += 3;
    } else {
        jugadorAObj.pe++;
        jugadorBObj.pe++;
        jugadorAObj.puntos += 1;
        jugadorBObj.puntos += 1;
    }
    jugadorAObj.dg = jugadorAObj.gf - jugadorAObj.gc;
    jugadorBObj.dg = jugadorBObj.gf - jugadorBObj.gc;

    guardarDatos();
    alert("¡Resultado registrado! Estadísticas actualizadas.");
    cargarDatos();
}

// 📊 5. Tabla de posiciones
function renderTablaPosiciones() {
    const tablaBody = document.getElementById('tabla-posiciones').querySelector('tbody');
    tablaBody.innerHTML = '';
    
    const jugadoresOrdenados = [...jugadores].sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.dg !== a.dg) return b.dg - a.dg;
        return b.gf - a.gf;
    });

    jugadoresOrdenados.forEach((jugador, index) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${index + 1}</td>
            <td>${jugador.nombre}</td>
            <td>${jugador.pj}</td>
            <td>${jugador.pg}</td>
            <td>${jugador.pe}</td>
            <td>${jugador.pp}</td>
            <td>${jugador.gf}</td>
            <td>${jugador.gc}</td>
            <td>${jugador.dg}</td>
            <td>${jugador.puntos}</td>
        `;
        tablaBody.appendChild(fila);
    });
}

// Renderizar Calendario en la interfaz de usuario
function renderCalendario() {
    const tablaBody = document.getElementById('tabla-calendario').querySelector('tbody');
    tablaBody.innerHTML = '';
    
    partidos.forEach(p => {
        const fila = document.createElement('tr');
        const resultado = p.jugado ? `${p.resultadoA} - ${p.resultadoB}` : ' - ';
        fila.innerHTML = `
            <td>${p.fecha}</td>
            <td>${p.hora}</td>
            <td>${p.jugadorA}</td>
            <td class="resultado-celda">${resultado}</td>
            <td>${p.jugadorB}</td>
        `;
        tablaBody.appendChild(fila);
    });
}

// Renderizar jugadores en la sección de administración
function renderJugadoresAdmin() {
    const lista = document.getElementById('lista-jugadores');
    lista.innerHTML = '';
    jugadores.forEach(j => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${j.nombre}</span><button onclick="eliminarJugador('${j.nombre}')">Eliminar</button>`;
        lista.appendChild(li);
    });
}

// Renderizar códigos en la sección de administración
function renderCodigosAdmin() {
    const lista = document.getElementById('lista-codigos');
    lista.innerHTML = '';
    codigos.forEach(c => {
        const li = document.createElement('li');
        li.className = c.usado ? 'usado' : '';
        li.textContent = `Código: ${c.codigo} (${c.usado ? 'Usado' : 'Disponible'})`;
        lista.appendChild(li);
    });
}

// Renderizar partidos pendientes en la sección de administración
function renderPartidosPendientes() {
    const selectPartidos = document.getElementById('partidosPendientes');
    selectPartidos.innerHTML = '<option value="">Selecciona un partido</option>';
    partidos.filter(p => !p.jugado).forEach(p => {
        const option = document.createElement('option');
        option.value = `${p.jugadorA}|${p.jugadorB}`;
        option.textContent = `${p.jugadorA} vs ${p.jugadorB} (${p.fecha} ${p.hora})`;
        selectPartidos.appendChild(option);
    });
}

// Actualizar opciones de jugadores en la sección de administración
function actualizarOpcionesJugadores() {
    const selectA = document.getElementById('jugadorA');
    const selectB = document.getElementById('jugadorB');
    selectA.innerHTML = '<option value="">Selecciona Jugador A</option>';
    selectB.innerHTML = '<option value="">Selecciona Jugador B</option>';
    jugadores.forEach(j => {
        const optionA = document.createElement('option');
        optionA.value = optionA.textContent = j.nombre;
        selectA.appendChild(optionA);
        const optionB = document.createElement('option');
        optionB.value = optionB.textContent = j.nombre;
        selectB.appendChild(optionB);
    });
}

// Eliminar jugador (solo admin)
function eliminarJugador(nombreJugador) {
    if (!confirm(`¿Estás seguro de eliminar a ${nombreJugador}? Esto eliminará también sus registros de partidos.`)) {
        return;
    }

    // Filtrar jugadores
    jugadores = jugadores.filter(j => j.nombre !== nombreJugador);
    
    // Eliminar partidos donde el jugador estaba involucrado
    partidos = partidos.filter(p => p.jugadorA !== nombreJugador && p.jugadorB !== nombreJugador);

    guardarDatos();
    alert(`Jugador ${nombreJugador} eliminado.`);
    cargarDatos();
}
