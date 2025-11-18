/* script.js
   Versión completa con:
   - Admin key: 48279509 (oculto)
   - Códigos 4 dígitos (uso único)
   - Registro con PIN
   - Calendario (admin crea)
   - Resultados (admin guarda)
   - Tabla automática: PJ, PG, PE, PP, GF, GC, DG, PTS
   - Eliminar jugador (admin)
   - Guardado en localStorage
*/

// ===== Storage keys =====
const LS_PLAYERS = 'fc_players_vfinal';
const LS_MATCHES = 'fc_matches_vfinal';
const LS_RESULTS = 'fc_results_vfinal';
const LS_CODES = 'fc_codes_vfinal';

// ===== Admin key =====
const ADMIN_KEY = '48279509';

// ===== Helpers: load / save =====
const load = (k) => JSON.parse(localStorage.getItem(k) || '[]');
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ===== UID & PIN generators =====
const uid = () => 'id_' + Math.random().toString(36).slice(2,9);
const genPin = () => Math.random().toString(36).slice(2,10); // 8 chars
const gen4 = () => String(Math.floor(1000 + Math.random()*9000));

// ===== Elements =====
const btnRegister = document.getElementById('btn-register');
const btnCalendar = document.getElementById('btn-calendar');
const btnTable = document.getElementById('btn-table');
const btnAdmin = document.getElementById('btn-admin');

const panelRegister = document.getElementById('panel-register');
const panelCalendar = document.getElementById('panel-calendar');
const panelTable = document.getElementById('panel-table');
const panelAdminLogin = document.getElementById('panel-admin-login');
const panelAdmin = document.getElementById('panel-admin');

const formRegister = document.getElementById('form-register');
const inputName = document.getElementById('input-name');
const inputCode = document.getElementById('input-code');
const registerMsg = document.getElementById('register-msg');
const showPin = document.getElementById('show-pin');

const calendarList = document.getElementById('calendar-list');
const standingsWrap = document.getElementById('standings-wrap');
const matchesList = document.getElementById('matches-list');
const exportCsvBtn = document.getElementById('export-csv');

const formAdminLogin = document.getElementById('form-admin-login');
const adminKeyInput = document.getElementById('admin-key');
const adminLoginMsg = document.getElementById('admin-login-msg');

const btnGenerateCode = document.getElementById('btn-generate-code');
const codesActive = document.getElementById('codes-active');

const formAddMatch = document.getElementById('form-add-match');
const selectPlayerA = document.getElementById('select-player-a');
const selectPlayerB = document.getElementById('select-player-b');
const matchDatetime = document.getElementById('match-datetime');

const formAdminResult = document.getElementById('form-admin-result');
const selectAdminMatch = document.getElementById('select-admin-match');
const adminGoalsA = document.getElementById('admin-goals-a');
const adminGoalsB = document.getElementById('admin-goals-b');

const adminPlayersBox = document.getElementById('admin-players');
const adminResultsBox = document.getElementById('admin-results');
const btnExportAll = document.getElementById('btn-export-all');
const btnLogoutAdmin = document.getElementById('btn-logout-admin');

// ===== Initial seed (only if empty) =====
function seedIfEmpty(){
  if (load(LS_PLAYERS).length === 0 && load(LS_MATCHES).length === 0 && load(LS_RESULTS).length === 0) {
    const p1 = { id: uid(), name: 'eca', pin: 'entoec6el', logo: null };
    const p2 = { id: uid(), name: 'rival', pin: genPin(), logo: null };
    save(LS_PLAYERS, [p1,p2]);

    const mId = uid();
    const now = new Date().toISOString();
    save(LS_MATCHES, [{ id: mId, datetime: now, playerA: p1.id, playerB: p2.id, played: true }]);

    save(LS_RESULTS, [{
      id: uid(),
      matchId: mId,
      goalsA: 2,
      goalsB: 1,
      evidence: null,
      submittedBy: p1.id,
      createdAt: new Date().toISOString()
    }]);
  }
}
seedIfEmpty();

// ===== UI: tab switching =====
function setActiveTab(tab) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  if (tab === 'register'){ btnRegister.classList.add('active'); panelRegister.classList.remove('hidden'); refreshAll(); }
  if (tab === 'calendar'){ btnCalendar.classList.add('active'); panelCalendar.classList.remove('hidden'); refreshAll(); }
  if (tab === 'table'){ btnTable.classList.add('active'); panelTable.classList.remove('hidden'); refreshAll(); }
  if (tab === 'adminLogin'){ btnAdmin.classList.add('active'); panelAdminLogin.classList.remove('hidden'); }
  if (tab === 'admin'){ btnAdmin.classList.add('active'); panelAdmin.classList.remove('hidden'); refreshAll(); }
}
btnRegister.addEventListener('click', ()=> setActiveTab('register'));
btnCalendar.addEventListener('click', ()=> setActiveTab('calendar'));
btnTable.addEventListener('click', ()=> setActiveTab('table'));
btnAdmin.addEventListener('click', ()=> setActiveTab('adminLogin'));
setActiveTab('register');

// ===== Register logic =====
formRegister.addEventListener('submit', (e) => {
  e.preventDefault();
  registerMsg.textContent = '';
  showPin.textContent = '';
  const name = inputName.value.trim();
  const code = inputCode.value.trim();
  if (!name || !code){ registerMsg.textContent = 'Completa los campos'; return; }

  const codes = load(LS_CODES);
  const codeIndex = codes.findIndex(c => c.code === code && c.used === false);
  if (codeIndex === -1){ registerMsg.textContent = 'Código inválido o usado'; return; }

  // create player
  const players = load(LS_PLAYERS);
  if (players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
    registerMsg.textContent = 'Ya existe ese nombre de jugador (usa otro)';
    return;
  }
  const newPin = genPin();
  const newPlayer = { id: uid(), name, pin: newPin, logo: null };
  players.push(newPlayer);
  save(LS_PLAYERS, players);

  // mark code used
  codes[codeIndex].used = true;
  save(LS_CODES, codes);

  registerMsg.textContent = 'Registro exitoso. Guarda tu PIN (se muestra una sola vez):';
  showPin.innerHTML = `<strong>PIN:</strong> <code>${newPin}</code>`;
  inputName.value=''; inputCode.value='';
  refreshAll();
});

// ===== Admin login =====
formAdminLogin.addEventListener('submit', (e) => {
  e.preventDefault();
  const key = adminKeyInput.value.trim();
  adminLoginMsg.textContent = '';
  adminKeyInput.value = '';
  if (key === ADMIN_KEY){
    setActiveTab('admin');
  } else {
    adminLoginMsg.textContent = 'Clave incorrecta';
  }
});

// ===== Generate code (pay symbolic) =====
btnGenerateCode.addEventListener('click', ()=>{
  const codes = load(LS_CODES);
  const newCode = { id: uid(), code: gen4(), used: false, createdAt: new Date().toISOString() };
  codes.push(newCode);
  save(LS_CODES, codes);
  renderCodes();
  alert('Código generado: ' + newCode.code + '\nCópialo y envíalo por WhatsApp al que pagó.');
});
function renderCodes(){
  const codes = load(LS_CODES);
  if (!codesActive) return;
  const active = codes.filter(c=>!c.used).map(c=>c.code);
  codesActive.innerHTML = active.length ? `<div class="small">Códigos activos: ${active.join(' · ')}</div>` : '<div class="small">No hay códigos activos</div>';
}

// ===== Add match (admin) =====
formAddMatch.addEventListener('submit', (e)=>{
  e.preventDefault();
  const dt = matchDatetime.value;
  const a = selectPlayerA.value;
  const b = selectPlayerB.value;
  if (!dt || !a || !b){ alert('Completa todos los campos'); return; }
  if (a === b){ alert('Selecciona jugadores distintos'); return; }
  const players = load(LS_PLAYERS);
  const pa = players.find(p=>p.id === a);
  const pb = players.find(p=>p.id === b);
  if (!pa || !pb){ alert('Jugador no encontrado'); return; }
  const matches = load(LS_MATCHES);
  matches.push({ id: uid(), datetime: new Date(dt).toISOString(), playerA: a, playerB: b, played: false });
  save(LS_MATCHES, matches);
  matchDatetime.value='';
  refreshAll();
  alert('Partido agregado');
});

// ===== Admin save result =====
formAdminResult.addEventListener('submit', (e)=>{
  e.preventDefault();
  const matchId = selectAdminMatch.value;
  const gA = parseInt(adminGoalsA.value,10);
  const gB = parseInt(adminGoalsB.value,10);
  if (!matchId || isNaN(gA) || isNaN(gB)){ alert('Completa campos'); return; }
  const matches = load(LS_MATCHES);
  const matchIdx = matches.findIndex(m=>m.id===matchId);
  if (matchIdx === -1){ alert('Partido no encontrado'); return; }

  // save result
  const results = load(LS_RESULTS);
  results.push({ id: uid(), matchId, goalsA: gA, goalsB: gB, evidence: null, submittedBy: 'admin', createdAt: new Date().toISOString() });
  save(LS_RESULTS, results);

  // mark match played
  matches[matchIdx].played = true;
  save(LS_MATCHES, matches);

  // update stats
  computeAndApplyStats();

  adminGoalsA.value=''; adminGoalsB.value='';
  refreshAll();
  alert('Resultado guardado');
});

// ===== Delete player (admin) =====
function deletePlayer(playerId){
  if (!confirm('Eliminar jugador y sus registros?')) return;
  let players = load(LS_PLAYERS);
  players = players.filter(p=>p.id !== playerId);
  save(LS_PLAYERS, players);

  // remove matches and results involving that player
  let matches = load(LS_MATCHES);
  const removedMatchIds = matches.filter(m=> m.playerA===playerId || m.playerB===playerId).map(m=>m.id);
  matches = matches.filter(m=> m.playerA!==playerId && m.playerB!==playerId);
  save(LS_MATCHES, matches);

  let results = load(LS_RESULTS);
  results = results.filter(r=> !removedMatchIds.includes(r.matchId));
  save(LS_RESULTS, results);

  computeAndApplyStats();
  refreshAll();
}

// ===== Compute stats (from results) =====
function computeStats(){
  const players = load(LS_PLAYERS);
  const matches = load(LS_MATCHES);
  const results = load(LS_RESULTS);

  // init zeroed stats map
  const stats = {};
  players.forEach(p => stats[p.id] = { pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 });

  // map matches by id to get teams
  const matchMap = {};
  matches.forEach(m => matchMap[m.id] = m);

  results.forEach(r => {
    const m = matchMap[r.matchId];
    if (!m) return;
    const a = m.playerA; const b = m.playerB;
    stats[a].pj++; stats[b].pj++;
    stats[a].gf += r.goalsA; stats[a].gc += r.goalsB;
    stats[b].gf += r.goalsB; stats[b].gc += r.goalsA;
    if (r.goalsA > r.goalsB){ stats[a].pg++; stats[b].pp++; stats[a].pts += 3; }
    else if (r.goalsA < r.goalsB){ stats[b].pg++; stats[a].pp++; stats[b].pts += 3; }
    else { stats[a].pe++; stats[b].pe++; stats[a].pts++; stats[b].pts++; }
  });

  // compute gd and attach to player objects copy
  const out = [];
  const playersList = load(LS_PLAYERS);
  playersList.forEach(p => {
    const s = stats[p.id] || { pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 };
    out.push({ id:p.id, name:p.name, pj:s.pj, pg:s.pg, pe:s.pe, pp:s.pp, gf:s.gf, gc:s.gc, gd:(s.gf - s.gc), pts:s.pts });
  });
  return out;
}

// Apply stats to players if we want to store stats on player objects (optional)
function computeAndApplyStats(){
  // We keep stats in derived form; players array does not store stats permanently to avoid drift.
  // But if you want to store, implement here.
}

// ===== Render functions =====
function renderStandings(){
  const stats = computeStats();
  // sort by pts, gd, gf
  stats.sort((x,y) => {
    if (y.pts !== x.pts) return y.pts - x.pts;
    if (y.gd !== x.gd) return y.gd - x.gd;
    return y.gf - x.gf;
  });

  let html = `<table><thead><tr>
    <th>#</th><th>Jugador</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th>
  </tr></thead><tbody>`;
  stats.forEach((s,i) => {
    html += `<tr>
      <td>${i+1}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${s.pj}</td>
      <td>${s.pg}</td>
      <td>${s.pe}</td>
      <td>${s.pp}</td>
      <td>${s.gf}</td>
      <td>${s.gc}</td>
      <td>${s.gd}</td>
      <td>${s.pts}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  standingsWrap.innerHTML = html;
}

function renderMatchesList(){
  const matches = load(LS_MATCHES);
  const players = load(LS_PLAYERS);
  const map = {}; players.forEach(p => map[p.id] = p.name);
  if (matches.length === 0){ matchesList.innerHTML = '<p class="small">No hay partidos.</p>'; return; }
  let html = '';
  matches.sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));
  matches.forEach(m=>{
    const res = load(LS_RESULTS).find(r=> r.matchId === m.id);
    html += `<div class="match-row">
      <div>
        <strong>${escapeHtml(map[m.playerA]||'--')}</strong> vs <strong>${escapeHtml(map[m.playerB]||'--')}</strong>
        <div class="small">${new Date(m.datetime).toLocaleString()}</div>
      </div>
      <div>${ res ? `<strong>${res.goalsA} - ${res.goalsB}</strong>` : '<span class="small">Pendiente</span>' }</div>
    </div>`;
  });
  matchesList.innerHTML = html;
}

function renderCalendar(){
  const matches = load(LS_MATCHES);
  const players = load(LS_PLAYERS);
  const map = {}; players.forEach(p => map[p.id] = p.name);
  if (matches.length === 0){ calendarList.innerHTML = '<p class="small">No hay partidos.</p>'; return; }
  let html = '';
  matches.sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));
  matches.forEach(m=>{
    html += `<div class="res-row"><div>
      <strong>${escapeHtml(map[m.playerA]||'--')} vs ${escapeHtml(map[m.playerB]||'--')}</strong><div class="small">${new Date(m.datetime).toLocaleString()}</div>
    </div></div>`;
  });
  calendarList.innerHTML = html;
}

// fill selects for admin
function fillAdminSelects(){
  const players = load(LS_PLAYERS);
  selectPlayerA.innerHTML = '<option value="">Jugador A</option>';
  selectPlayerB.innerHTML = '<option value="">Jugador B</option>';
  selectAdminMatch.innerHTML = '<option value="">Seleccionar partido</option>';
  const matches = load(LS_MATCHES);

  players.forEach(p=>{
    selectPlayerA.insertAdjacentHTML('beforeend', `<option value="${p.id}">${escapeHtml(p.name)}</option>`);
    selectPlayerB.insertAdjacentHTML('beforeend', `<option value="${p.id}">${escapeHtml(p.name)}</option>`);
  });

  matches.forEach(m=>{
    selectAdminMatch.insertAdjacentHTML('beforeend', `<option value="${m.id}">${new Date(m.datetime).toLocaleString()} — ${m.id}</option>`);
  });
}

// render admin players with delete button and show PIN
function renderAdminPlayers(){
  const players = load(LS_PLAYERS);
  if (!adminPlayersBox) return;
  if (players.length === 0){ adminPlayersBox.innerHTML = '<p class="small">No hay jugadores.</p>'; return; }
  let html = '';
  players.forEach(p=>{
    html += `<div class="player-row"><div><strong>${escapeHtml(p.name)}</strong><div class="small">PIN: <code>${escapeHtml(p.pin)}</code></div></div>
      <div><button data-id="${p.id}" class="btn-delete-player">Eliminar</button></div></div>`;
  });
  adminPlayersBox.innerHTML = html;
  document.querySelectorAll('.btn-delete-player').forEach(b=>{
    b.addEventListener('click', ()=> {
      const id = b.getAttribute('data-id');
      deletePlayer(id);
    });
  });
}

// render admin results
function renderAdminResults(){
  const results = load(LS_RESULTS).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
  const matches = load(LS_MATCHES);
  const players = load(LS_PLAYERS);
  const pmap = {}; players.forEach(p=> pmap[p.id] = p.name);
  if (!adminResultsBox) return;
  if (results.length === 0){ adminResultsBox.innerHTML = '<p class="small">No hay resultados.</p>'; return; }
  let html = '';
  results.forEach(r=>{
    const m = matches.find(mm=> mm.id === r.matchId) || {};
    const a = pmap[m.playerA] || '--';
    const b = pmap[m.playerB] || '--';
    html += `<div class="res-row"><div><strong>${escapeHtml(a)} ${r.goalsA} - ${r.goalsB} ${escapeHtml(b)}</strong>
      <div class="small">Fecha: ${new Date(r.createdAt).toLocaleString()} · enviado por: ${r.submittedBy}</div></div></div>`;
  });
  adminResultsBox.innerHTML = html;
}

// ===== Export CSV helpers =====
function buildStandingsCSV(){
  const stats = computeStats();
  const rows = [['Jugador','PJ','PG','PE','PP','GF','GC','DG','PTS']];
  stats.forEach(s => rows.push([s.name,s.pj,s.pg,s.pe,s.pp,s.gf,s.gc,s.gd,s.pts]));
  return rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
}
function buildAllCSV(){
  const players = load(LS_PLAYERS);
  const matches = load(LS_MATCHES);
  const results = load(LS_RESULTS);
  const rows = [['MatchID','Fecha','JugadorA','JugadorB','GolesA','GolesB','EnviadoPor','FechaEnvio']];
  results.forEach(r=>{
    const m = matches.find(mm=> mm.id === r.matchId) || {};
    const a = players.find(p=>p.id===m.playerA)?.name || '--';
    const b = players.find(p=>p.id===m.playerB)?.name || '--';
    rows.push([r.matchId, m.datetime || '', a,b,r.goalsA,r.goalsB,r.submittedBy,r.createdAt]);
  });
  return rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
}
function downloadBlob(text, mime, filename){
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
exportCsvBtn.addEventListener('click', ()=> {
  downloadBlob(buildStandingsCSV(), 'text/csv;charset=utf-8;', 'standings.csv');
});
btnExportAll.addEventListener('click', ()=> {
  downloadBlob(buildAllCSV(), 'text/csv;charset=utf-8;', 'results_all.csv');
});

// ===== Refresh / orchestrator =====
function refreshAll(){
  renderCodes();
  renderStandings();
  renderMatchesList();
  renderCalendar();
  fillAdminSelects();
  renderAdminPlayers();
  renderAdminResults();
}
refreshAll();

// ===== Utilities =====
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ===== Expose deletePlayer to inner functions =====
window.deletePlayer = deletePlayer;

// ===== End =====
