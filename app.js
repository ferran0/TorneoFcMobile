// ==========================
// DATA STORAGE
// ==========================
let players = JSON.parse(localStorage.getItem("players") || "[]");
let matches = JSON.parse(localStorage.getItem("matches") || "[]");
let validCodes = JSON.parse(localStorage.getItem("validCodes") || "[]");

// ==========================
// SHOW SECTIONS
// ==========================
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
  if (id === "table") loadTable();
  if (id === "calendar") loadCalendar();
  if (id === "admin") loadAdminPlayers();
}

// ==========================
// REGISTRO JUGADOR
// ==========================
function registerPlayer() {
  let name = document.getElementById("playerName").value.trim();
  let code = document.getElementById("playerCode").value.trim();
  let msg = document.getElementById("regMsg");

  if (!name || !code) {
    msg.innerText = "Completa todo.";
    return;
  }

  if (!validCodes.includes(code)) {
    msg.innerText = "Código inválido.";
    return;
  }

  players.push({ name, gf: 0, gc: 0, pts: 0 });
  validCodes = validCodes.filter(c => c !== code);

  localStorage.setItem("players", JSON.stringify(players));
  localStorage.setItem("validCodes", JSON.stringify(validCodes));

  msg.innerText = "Registrado con éxito.";
}

// ==========================
// TABLA
// ==========================
function loadTable() {
  let tbody = document.querySelector("#standingsTable tbody");
  tbody.innerHTML = "";

  let sorted = [...players].sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc));

  sorted.forEach(p => {
    let tr = `<tr>
      <td>${p.name}</td>
      <td>${p.gf}</td>
      <td>${p.gc}</td>
      <td>${p.gf - p.gc}</td>
      <td>${p.pts}</td>
    </tr>`;
    tbody.innerHTML += tr;
  });
}

// ==========================
// CALENDARIO
// ==========================
function loadCalendar() {
  let list = document.getElementById("matchList");
  list.innerHTML = "";

  matches.forEach((m, i) => {
    list.innerHTML += `
      <div class="match-card">
        <b>ID:</b> ${i} <br>
        ${m.p1} vs ${m.p2} <br>
        <b>Fecha:</b> ${m.date} <br>
        <b>Resultado:</b> ${m.result || "Pendiente"}
      </div><br>
    `;
  });
}

// ==========================
// ADMIN LOGIN
// ==========================
function adminLogin() {
  let pass = prompt("Clave de admin:");
  if (pass === "48279509") showSection("admin");
  else alert("Clave incorrecta");
}

// ==========================
// ADMIN: GENERAR CÓDIGO
// ==========================
function generateCode() {
  let code = Math.floor(1000 + Math.random() * 9000).toString();
  validCodes.push(code);
  localStorage.setItem("validCodes", JSON.stringify(validCodes));
  document.getElementById("generatedCode").innerText = "Código generado: " + code;
}

// ==========================
// ADMIN: AGREGAR PARTIDO
// ==========================
function addMatch() {
  let p1 = document.getElementById("p1").value.trim();
  let p2 = document.getElementById("p2").value.trim();
  let date = document.getElementById("date").value;

  if (!p1 || !p2 || !date) return alert("Completa todo");

  matches.push({ p1, p2, date, result: null });
  localStorage.setItem("matches", JSON.stringify(matches));
  alert("Partido agregado");
}

// ==========================
// ADMIN: INGRESAR RESULTADO
// ==========================
function submitResult() {
  let id = document.getElementById("resId").value;
  let ga = parseInt(document.getElementById("resA").value);
  let gb = parseInt(document.getElementById("resB").value);

  if (!matches[id]) return alert("ID inválido");

  let m = matches[id];
  m.result = `${ga} - ${gb}`;

  // Actualizar tabla
  let A = players.find(p => p.name === m.p1);
  let B = players.find(p => p.name === m.p2);

  A.gf += ga; A.gc += gb;
  B.gf += gb; B.gc += ga;

  if (ga > gb) A.pts += 3;
  else if (gb > ga) B.pts += 3;
  else { A.pts++; B.pts++; }

  localStorage.setItem("players", JSON.stringify(players));
  localStorage.setItem("matches", JSON.stringify(matches));

  alert("Resultado guardado");
}

// ==========================
// ADMIN: LISTADO JUGADORES
// ==========================
function loadAdminPlayers() {
  let list = document.getElementById("playerList");
  list.innerHTML = "";

  players.forEach((p, i) => {
    list.innerHTML += `
      <li>${p.name} 
        <button onclick="delPlayer(${i})">Eliminar</button>
      </li>
    `;
  });
}

function delPlayer(i) {
  players.splice(i, 1);
  localStorage.setItem("players", JSON.stringify(players));
  loadAdminPlayers();
}
