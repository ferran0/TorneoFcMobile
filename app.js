// ---------- INICIALIZACIÓN ----------
if (!localStorage.jugadores) localStorage.jugadores = JSON.stringify([]);
if (!localStorage.codigos) localStorage.codigos = JSON.stringify([]);
if (!localStorage.partidos) localStorage.partidos = JSON.stringify([]);

function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');

    if (id === "calendario") actualizarCalendario();
    if (id === "tabla") actualizarTabla();
}

// ---------- ADMIN ----------
function adminAccess() {
    let clave = prompt("Ingrese clave de acceso:");

    if (clave === "48279509") {
        document.getElementById('admin').classList.remove("hidden");
        cargarJugadoresAdmin();
        cargarPartidosAdmin();
    } else {
        alert("Acceso denegado");
    }
}

function cerrarAdmin() {
    document.getElementById('admin').classList.add("hidden");
}

// ---------- GENERAR CÓDIGO ----------
function generarCodigo() {
    let codigo = Math.floor(1000 + Math.random() * 9000).toString();
    let lista = JSON.parse(localStorage.codigos);

    lista.push({ codigo, usado: false });
    localStorage.codigos = JSON.stringify(lista);

    document.getElementById("codigoGenerado").innerText = "Código generado: " + codigo;
}

// ---------- REGISTRO DE JUGADOR ----------
function registrarJugador() {
    let nombre = document.getElementById("nombreJugador").value.trim();
    let codigo = document.getElementById("codigoRegistro").value.trim();

    if (!nombre || !codigo) {
        return alert("Complete los datos");
    }

    let codigos = JSON.parse(localStorage.codigos);
    let jugadores = JSON.parse(localStorage.jugadores);

    let encontrado = codigos.find(c => c.codigo === codigo && !c.usado);

    if (!encontrado) {
        return alert("Código inválido o ya usado");
    }

    jugadores.push({
        nombre,
        pj: 0, pg: 0, pe: 0, pp: 0,
        gf: 0, gc: 0, puntos: 0
    });

    encontrado.usado = true;

    localStorage.jugadores = JSON.stringify(jugadores);
    localStorage.codigos = JSON.stringify(codigos);

    alert("Registro completado");
}

// ---------- ADMIN: AGREGAR PARTIDO ----------
function cargarJugadoresAdmin() {
    let jugadores = JSON.parse(localStorage.jugadores);
    let selectA = document.getElementById("equipoA");
    let selectB = document.getElementById("equipoB");

    selectA.innerHTML = "";
    selectB.innerHTML = "";

    jugadores.forEach(j => {
        selectA.innerHTML += `<option>${j.nombre}</option>`;
        selectB.innerHTML += `<option>${j.nombre}</option>`;
    });

    actualizarListaJugadores();
}

function agregarPartido() {
    let A = equipoA.value;
    let B = equipoB.value;
    let fecha = fechaPartido.value;
    let hora = horaPartido.value;

    if (A === B) return alert("Seleccione jugadores distintos");

    let partidos = JSON.parse(localStorage.partidos);

    partidos.push({
        A, B, fecha, hora,
        golesA: null,
        golesB: null
    });

    localStorage.partidos = JSON.stringify(partidos);
    alert("Partido agregado");
}

// ---------- ADMIN: REGISTRAR RESULTADO ----------
function cargarPartidosAdmin() {
    let partidos = JSON.parse(localStorage.partidos);
    let select = document.getElementById("partidoSelect");

    select.innerHTML = "";

    partidos.forEach((p, i) => {
        select.innerHTML += `<option value="${i}">${p.A} vs ${p.B}</option>`;
    });
}

function registrarResultado() {
    let index = partidoSelect.value;
    let golesA = parseInt(document.getElementById("golesA").value);
    let golesB = parseInt(document.getElementById("golesB").value);

    let partidos = JSON.parse(localStorage.partidos);
    let jugadores = JSON.parse(localStorage.jugadores);

    let p = partidos[index];
    p.golesA = golesA;
    p.golesB = golesB;

    let JA = jugadores.find(j => j.nombre === p.A);
    let JB = jugadores.find(j => j.nombre === p.B);

    JA.pj++; JB.pj++;
    JA.gf += golesA; JA.gc += golesB;
    JB.gf += golesB; JB.gc += golesA;

    if (golesA > golesB) {
        JA.pg++; JB.pp++; JA.puntos += 3;
    } else if (golesB > golesA) {
        JB.pg++; JA.pp++; JB.puntos += 3;
    } else {
        JA.pe++; JB.pe++; JA.puntos++; JB.puntos++;
    }

    localStorage.partidos = JSON.stringify(partidos);
    localStorage.jugadores = JSON.stringify(jugadores);

    alert("Resultado guardado");
}

// ---------- LISTA JUGADORES ADMIN ----------
function actualizarListaJugadores() {
    let jugadores = JSON.parse(localStorage.jugadores);
    let div = document.getElementById("listaJugadores");

    div.innerHTML = "";

    jugadores.forEach((j, i) => {
        div.innerHTML += `
            <p>${j.nombre}
            <button onclick="eliminarJugador(${i})">Eliminar</button></p>`;
    });
}

function eliminarJugador(i) {
    let jugadores = JSON.parse(localStorage.jugadores);
    jugadores.splice(i, 1);
    localStorage.jugadores = JSON.stringify(jugadores);
    actualizarListaJugadores();
}

// ---------- CALENDARIO ----------
function actualizarCalendario() {
    let partidos = JSON.parse(localStorage.partidos);
    let lista = document.getElementById("listaCalendario");

    lista.innerHTML = "";

    partidos.forEach(p => {
        lista.innerHTML += `<p>${p.fecha} ${p.hora} — ${p.A} vs ${p.B}</p>`;
    });
}

// ---------- TABLA ----------
function actualizarTabla() {
    let jugadores = JSON.parse(localStorage.jugadores);

    jugadores.sort((a, b) => b.puntos - a.puntos);

    let cuerpo = document.getElementById("tablaCuerpo");
    cuerpo.innerHTML = "";

    jugadores.forEach(j => {
        cuerpo.innerHTML += `
            <tr>
                <td>${j.nombre}</td>
                <td>${j.pj}</td>
                <td>${j.pg}</td>
                <td>${j.pe}</td>
                <td>${j.pp}</td>
                <td>${j.gf}</td>
                <td>${j.gc}</td>
                <td>${j.gf - j.gc}</td>
                <td>${j.puntos}</td>
            </tr>`;
    });
}
