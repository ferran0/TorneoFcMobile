/* app.js
   Versión completa: guarda en localStorage.
   - Admin key: 48279509
   - Generar códigos de registro (4 dígitos) con botón "Pagar"
   - Registro de jugadores requiere código; al registrarse se genera PIN (mostrarlo)
   - Enviar resultados validando PIN del jugador que registra
   - Screenshots como data-URL guardadas en results
   - Tabla formal (PJ, PG, PE, PP, GF, GC, DG, PTS)
   - Seed: 'eca' con PIN 'entoec6el', 'rival', partido con resultado 2-1 a favor de eca
*/

(() => {
  // LocalStorage keys
  const LS_PLAYERS = 'fc_players_v2';
  const LS_MATCHES = 'fc_matches_v2';
  const LS_RESULTS = 'fc_results_v2';
  const LS_CODES = 'fc_codes_v2';

  // Admin key (fija)
  const ADMIN_KEY = '48279509';

  // Elements
  const tabs = {
    register: document.getElementById('tab-register'),
    table: document.getElementById('tab-table'),
    calendar: document.getElementById('tab-calendar'),
    adminBtn: document.getElementById('tab-admin-btn'),
  };
  const panels = {
    register: document.getElementById('panel-register'),
    table: document.getElementById('panel-table'),
    calendar: document.getElementById('panel-calendar'),
    submit: document.getElementById('panel-submit'),
    adminLogin: document.getElementById('panel-admin-login'),
    admin: document.getElementById('panel-admin'),
  };

  // Register form
  const formRegister = document.getElementById('form-register');
  const regName = document.getElementById('reg-name');
  const regCode = document.getElementById('reg-code');
  const regMsg = document.getElementById('reg-msg');
  const regPinBox = document.getElementById('reg-pin');

  // Table / matches
  const standingsWrap = document.getElementById('standings-wrap');
  const matchesList = document.getElementById('matches-list');
  const calendarList = document.getElementById('calendar-list');
  const exportStandingsBtn = document.getElementById('export-standings');

  // Submit result form
  const formSubmit = document.getElementById('form-submit');
  const selectMatch = document.getElementById('select-match');
  const goalsA = document.getElementById('goals-a');
  const goalsB = document.getElementById('goals-b');
  const submitPin = document.getElementById('submit-pin');
  const evidenceInput = document.getElementById('evidence');
  const submitMsg = document.getElementById('submit-msg');

  // Admin login & panel
  const formAdminLogin = document.getElementById('form-admin-login');
  const adminKeyInput = document.getElementById('admin-key');
  const adminLoginMsg = document.getElementById('admin-login-msg');
  const btnPay = document.getElementById('btn-pay');
  const codeListBox = document.getElementById('code-list');
  const formAddMatch = document.getElementById('form-add-match');
  const amDate = document.getElementById('am-date');
  const amA = document.getElementById('am-a');
  const amB = document.getElementById('am-b');
  const formAdminResult = document.getElementById('form-admin-result');
  const adminMatch = document.getElementById('admin-match');
  const adminGoalsA = document.getElementById('admin-goals-a');
  const adminGoalsB = document.getElementById('admin-goals-b');
  const adminComment = document.getElementById('admin-comment');
  const adminPlayersBox = document.getElementById('admin-players');
  const adminResultsBox = document.getElementById('admin-results');
  const btnExportAll = document.getElementById('btn-export-csv');
  const btnLogoutAdmin = document.getElementById('btn-logout-admin');

  // Utilities: load/save
  function load(key){ return JSON.parse(localStorage.getItem(key) || '[]'); }
  function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

  // Seed initial sample if empty
  function seed() {
    let players = load(LS_PLAYERS);
    let matches = load(LS_MATCHES);
    let results = load(LS_RESULTS);
    let codes = load(LS_CODES);

    if (players.length === 0 && matches.length === 0 && results.length === 0) {
      // players: eca (fixed pin) and rival
      players.push({ id: uid(), name: 'eca', pin: 'entoec6el', logo: null });
      players.push({ id: uid(), name: 'rival', pin: genPin(), logo: null });
      save(LS_PLAYERS, players);

      // match
      const mId = uid();
      const now = new Date();
      matches.push({ id: mId, datetime: now.toISOString(), playerA: players[0].id, playerB: players[1].id, played: true });
      save(LS_MATCHES, matches);

      // result where eca ganó 2-1
      results.push({
        id: uid(),
        matchId: mId,
        goalsA: 2,
        goalsB: 1,
        evidence: null,
        submittedBy: players[0].id,
        createdAt: new Date().toISOString()
      });
      save(LS_RESULTS, results);
    }
  }

  // uid & PIN generator
  function uid(){ return 'id_' + Math.random().toString(36).slice(2,9); }
  function genPin(){ return Math.random().toString(36).slice(2,10); } // 8 chars
  function gen4Digit(){ return String(Math.floor(1000 + Math.random()*9000)); }

  /* ---------- UI: tabs ---------- */
  function setActive(tabKey){
    Object.keys(tabs).forEach(k=> tabs[k].classList.remove('active'));
    Object.keys(panels).forEach(k=> panels[k].classList.add('hidden'));
    if (tabs[tabKey]) tabs[tabKey].classList.add('active');
    if (panels[tabKey]) panels[tabKey].classList.remove('hidden');
    // refresh views
    if (tabKey === 'table') renderAll();
    if (tabKey === 'calendar') renderAll();
    if (tabKey === 'register') renderAll();
  }
  tabs.register.addEventListener('click', ()=> setActive('register'));
  tabs.table.addEventListener('click', ()=> setActive('table'));
  tabs.calendar.addEventListener('click', ()=> setActive('calendar'));
  tabs.adminBtn.addEventListener('click', ()=> {
    // show admin login (not admin panel directly)
    setActive('adminLogin');
  });

  /* ---------- RENDER / STATE ---------- */
  function renderAll(){
    renderStandings();
    renderMatches();
    fillMatchSelect();
    fillAdminSelects();
    renderAdminPlayers();
    renderAdminResults();
    renderCodes();
  }

  function renderStandings(){
    const players = load(LS_PLAYERS);
    const matches = load(LS_MATCHES);
    const results = load(LS_RESULTS);

    // init stats
    const stats = {};
    players.forEach(p => stats[p.id] = { id:p.id, name:p.name, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 });

    // mapping match->teams
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

    // compute gd
    const arr = Object.values(stats);
    arr.forEach(s=> s.gd = s.gf - s.gc);
    // sort: pts, gd, gf
    arr.sort((x,y) => {
      if (y.pts !== x.pts) return y.pts - x.pts;
      if (y.gd !== x.gd) return y.gd - x.gd;
      return y.gf - x.gf;
    });

    // build table HTML
    let html = `<table><thead><tr>
      <th>#</th><th>Logo</th><th>Jugador</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th>
    </tr></thead><tbody>`;
    arr.forEach((s,i)=>{
      const player = load(LS_PLAYERS).find(p=>p.id===s.id) || {};
      const logo = player.logo ? `<img src="${player.logo}" class="logo-thumb">` : '';
      html += `<tr>
        <td>${i+1}</td>
        <td>${logo}</td>
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
    html += `</tbody></table>`;
    standingsWrap.innerHTML = html;
  }

  function renderMatches(){
    const matches = load(LS_MATCHES);
    const players = load(LS_PLAYERS);
    const pmap = {}; players.forEach(p=> pmap[p.id]=p);
    if (matches.length === 0) { matchesList.innerHTML = '<p class="small">No hay partidos.</p>'; return; }
    let html = '';
    matches.sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));
    matches.forEach(m=>{
      const res = load(LS_RESULTS).find(r=> r.matchId === m.id);
      const aName = pmap[m.playerA]?.name || 'Desconocido';
      const bName = pmap[m.playerB]?.name || 'Desconocido';
      const resultHtml = res ? `<strong>${res.goalsA} - ${res.goalsB}</strong><div class="small">by ${pmap[res.submittedBy]?.name||'admin'} · ${new Date(res.createdAt).toLocaleString()}</div>
        ${res.evidence ? `<div style="margin-top:6px"><img src="${res.evidence}" style="max-width:160px;border-radius:6px;border:1px solid #eee"></div>` : ''}` : '<div class="small">Pendiente</div>' ;
      html += `<div class="match-row">
        <div><strong>${escapeHtml(aName)}</strong> vs <strong>${escapeHtml(bName)}</strong><div class="small">${new Date(m.datetime).toLocaleString()}</div></div>
        <div>${resultHtml}</div>
      </div>`;
    });
    matchesList.innerHTML = html;
  }

  function renderCalendar(){
    const matches = load(LS_MATCHES);
    const players = load(LS_PLAYERS); const pmap={}; players.forEach(p=>pmap[p.id]=p);
    if (matches.length === 0) { calendarList.innerHTML = '<p class="small">No hay partidos.</p>'; return; }
    let html='';
    matches.sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));
    matches.forEach(m=>{
      html += `<div class="fc-event"><div><strong>${escapeHtml(pmap[m.playerA]?.name||'--')} vs ${escapeHtml(pmap[m.playerB]?.name||'--')}</strong></div><div class="small">${new Date(m.datetime).toLocaleString()}</div></div>`;
    });
    calendarList.innerHTML = html;
  }

  function fillMatchSelect(){
    const matches = load(LS_MATCHES);
    const players = load(LS_PLAYERS);
    const pmap = {}; players.forEach(p=>pmap[p.id]=p);
    selectMatch.innerHTML = '<option value="">Seleccionar partido...</option>';
    matches.forEach(m=>{
      const label = `${pmap[m.playerA]?.name||'--'} vs ${pmap[m.playerB]?.name||'--'} — ${new Date(m.datetime).toLocaleString()}`;
      selectMatch.insertAdjacentHTML('beforeend', `<option value="${m.id}">${escapeHtml(label)}</option>`);
    });
  }

  function fillAdminSelects(){
    const players = load(LS_PLAYERS);
    amA.innerHTML = '<option value="">Jugador A</option>';
    amB.innerHTML = '<option value="">Jugador B</option>';
    adminMatch.innerHTML = '<option value="">Seleccionar partido</option>';
    const matches = load(LS_MATCHES);
    matches.forEach(m => adminMatch.insertAdjacentHTML('beforeend', `<option value="${m.id}">${escapeHtml(m.datetime)} — ${m.id}</option>`));
    players.forEach(p=>{
      amA.insertAdjacentHTML('beforeend', `<option value="${p.id}">${escapeHtml(p.name)}</option>`);
      amB.insertAdjacentHTML('beforeend', `<option value="${p.id}">${escapeHtml(p.name)}</option>`);
    });
  }

  /* ---------- Register player (requires code) ---------- */
  formRegister.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    regMsg.textContent = '';
    regPinBox.textContent = '';
    const name = regName.value.trim();
    const code = regCode.value.trim();
    if (!name || !code){ regMsg.textContent = 'Completa los campos'; return; }
    const codes = load(LS_CODES);
    const idx = codes.indexOf(code);
    if (idx === -1){ regMsg.textContent = 'Código inválido o ya usado'; return; }
    // create player with PIN
    const players = load(LS_PLAYERS);
    const newPin = genPin();
    const newPlayer = { id: uid(), name: name, pin: newPin, logo: null };
    players.push(newPlayer);
    save(LS_PLAYERS, players);
    // remove used code
    codes.splice(idx,1);
    save(LS_CODES, codes);
    regMsg.textContent = 'Registro exitoso. Guarda tu PIN (no se mostrará otra vez):';
    regPinBox.innerHTML = `<strong>PIN:</strong> <code>${newPin}</code>`;
    regName.value = ''; regCode.value = '';
    renderAll();
  });

  /* ---------- Submit result (public) ---------- */
  formSubmit && formSubmit.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    submitMsg.textContent = '';
    const matchId = selectMatch.value;
    const gA = parseInt(goalsA.value, 10);
    const gB = parseInt(goalsB.value, 10);
    const pin = submitPin.value.trim();
    if (!matchId || isNaN(gA) || isNaN(gB) || !pin){ submitMsg.textContent = 'Completa todo'; return; }
    const matches = load(LS_MATCHES);
    const match = matches.find(m=>m.id===matchId);
    if (!match){ submitMsg.textContent = 'Partido no encontrado'; return; }
    const players = load(LS_PLAYERS);
    const submitting = players.find(p=>p.pin === pin);
    if (!submitting){ submitMsg.textContent = 'PIN inválido'; return; }
    // ensure submitting is part of the match
    if (submitting.id !== match.playerA && submitting.id !== match.playerB){ submitMsg.textContent = 'Tu PIN no corresponde a ningún jugador de este partido'; return; }

    // read evidence
    const file = evidenceInput.files[0];
    if (!file){ submitMsg.textContent = 'Subí la screenshot'; return; }
    const reader = new FileReader();
    reader.onload = function(e){
      const dataUrl = e.target.result;
      const results = load(LS_RESULTS);
      results.push({
        id: uid(),
        matchId: matchId,
        goalsA: gA,
        goalsB: gB,
        evidence: dataUrl,
        submittedBy: submitting.id,
        createdAt: new Date().toISOString()
      });
      save(LS_RESULTS, results);
      // mark match as played (optional)
      const mIndex = matches.findIndex(x=>x.id===matchId);
      if (mIndex !== -1){ matches[mIndex].played = true; save(LS_MATCHES, matches); }
      submitMsg.textContent = 'Resultado guardado ✅';
      // reset form
      goalsA.value=''; goalsB.value=''; submitPin.value=''; evidenceInput.value='';
      renderAll();
    };
    reader.readAsDataURL(file);
  });

  /* ---------- Admin login ---------- */
  formAdminLogin.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    adminLoginMsg.textContent = '';
    const entered = adminKeyInput.value.trim();
    if (entered === ADMIN_KEY){
      // show admin panel
      setActive('admin');
    } else {
      adminLoginMsg.textContent = 'Clave incorrecta';
    }
    adminKeyInput.value = '';
  });

  /* ---------- Admin: Generate code (Pagar) ---------- */
  btnPay.addEventListener('click', ()=>{
    const codes = load(LS_CODES);
    const newCode = gen4Digit();
    codes.push(newCode);
    save(LS_CODES, codes);
    renderCodes();
    alert('Código generado: ' + newCode + '\nEnvíalo por WhatsApp al competidor');
  });

  function renderCodes(){
    const codes = load(LS_CODES);
    if (!codeListBox) return;
    if (codes.length === 0) codeListBox.innerHTML = '<p class="small">No hay códigos activos.</p>';
    else codeListBox.innerHTML = '<div class="small">Códigos activos (uso único): ' + codes.join(' · ') + '</div>';
  }

  /* ---------- Admin: Add match ---------- */
  formAddMatch.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const date = amDate.value;
    const a = amA.value;
    const b = amB.value;
    if (!date || !a || !b) return alert('Completa todo');
    if (a === b) return alert('Seleccioná jugadores distintos');
    const matches = load(LS_MATCHES);
    matches.push({ id: uid(), datetime: new Date(date).toISOString(), playerA: a, playerB: b, played: false });
    save(LS_MATCHES, matches);
    amDate.value=''; amA.value=''; amB.value='';
    renderAll();
    alert('Partido agregado');
  });

  /* ---------- Admin: Save result (direct) ---------- */
  formAdminResult.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const matchId = adminMatch.value;
    const gA = parseInt(adminGoalsA.value,10);
    const gB = parseInt(adminGoalsB.value,10);
    const comment = adminComment.value.trim();
    if (!matchId || isNaN(gA) || isNaN(gB)) return alert('Completa todo');
    const results = load(LS_RESULTS);
    results.push({
      id: uid(),
      matchId: matchId,
      goalsA: gA,
      goalsB: gB,
      evidence: null,
      submittedBy: 'admin',
      comment: comment,
      createdAt: new Date().toISOString()
    });
    save(LS_RESULTS, results);
    // mark match played
    const matches = load(LS_MATCHES);
    const mi = matches.findIndex(m=>m.id===matchId);
    if (mi!==-1) { matches[mi].played = true; save(LS_MATCHES,matches); }
    adminGoalsA.value=''; adminGoalsB.value=''; adminComment.value='';
    renderAll();
    alert('Resultado guardado por admin');
  });

  /* ---------- Admin: render players (with delete) ---------- */
  function renderAdminPlayers(){
    const players = load(LS_PLAYERS);
    if (!adminPlayersBox) return;
    if (players.length === 0) { adminPlayersBox.innerHTML = '<p class="small">No hay jugadores.</p>'; return; }
    let html = '';
    players.forEach(p=>{
      html += `<div class="player-row"><div>
        <strong>${escapeHtml(p.name)}</strong><div class="small">PIN: <code>${escapeHtml(p.pin)}</code></div>
      </div>
      <div>
        <button class="btn-del-player" data-id="${p.id}">Eliminar</button>
      </div></div>`;
    });
    adminPlayersBox.innerHTML = html;
    // attach delete events
    document.querySelectorAll('.btn-del-player').forEach(btn=>{
      btn.addEventListener('click', ()=> {
        const id = btn.getAttribute('data-id');
        if (!confirm('Eliminar jugador?')) return;
        let players = load(LS_PLAYERS);
        players = players.filter(x=> x.id !== id);
        save(LS_PLAYERS, players);
        renderAll();
      });
    });
  }

  /* ---------- Admin: render results (with evidence) ---------- */
  function renderAdminResults(){
    const results = load(LS_RESULTS).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    const matches = load(LS_MATCHES);
    const players = load(LS_PLAYERS);
    const pmap={}; players.forEach(p=>pmap[p.id]=p);
    if (!adminResultsBox) return;
    if (results.length === 0){ adminResultsBox.innerHTML = '<p class="small">No hay resultados.</p>'; return; }
    let html='';
    results.forEach(r=>{
      const m = matches.find(mm=> mm.id === r.matchId) || {};
      const aName = pmap[m.playerA]?.name || '---';
      const bName = pmap[m.playerB]?.name || '---';
      html += `<div class="res-row"><div>
        <strong>${escapeHtml(aName)} ${r.goalsA} - ${r.goalsB} ${escapeHtml(bName)}</strong>
        <div class="small">Fecha: ${new Date(r.createdAt).toLocaleString()} · enviado por: ${r.submittedBy==='admin' ? 'admin' : (pmap[r.submittedBy]?.name||r.submittedBy)}</div>
        ${r.comment ? `<div class="small">Comentario: ${escapeHtml(r.comment)}</div>` : ''}
      </div>
      <div>${ r.evidence ? `<img src="${r.evidence}" style="max-width:140px;border-radius:6px;border:1px solid #eee">` : '<span class="small">Sin evidencia</span>' }</div></div>`;
    });
    adminResultsBox.innerHTML = html;
  }

  /* ---------- Export CSVs ---------- */
  exportStandingsBtn.addEventListener('click', ()=>{
    const csv = buildStandingsCSV();
    downloadBlob(csv, 'text/csv;charset=utf-8;', 'fc_standings.csv');
  });
  btnExportAll.addEventListener('click', ()=>{
    // all results CSV
    const csv = buildResultsCSV();
    downloadBlob(csv, 'text/csv;charset=utf-8;', 'fc_results.csv');
  });

  function buildStandingsCSV(){
    const players = load(LS_PLAYERS);
    const matches = load(LS_MATCHES);
    const results = load(LS_RESULTS);
    // compute standings same as renderStandings but simple
    const stats = {};
    players.forEach(p => stats[p.id] = { name:p.name, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 });
    const matchMap = {}; matches.forEach(m=>matchMap[m.id]=m);
    results.forEach(r=>{
      const m = matchMap[r.matchId];
      if (!m) return;
      const a=m.playerA, b=m.playerB;
      stats[a].pj++; stats[b].pj++;
      stats[a].gf += r.goalsA; stats[a].gc += r.goalsB;
      stats[b].gf += r.goalsB; stats[b].gc += r.goalsA;
      if (r.goalsA > r.goalsB){ stats[a].pg++; stats[b].pp++; stats[a].pts+=3; }
      else if (r.goalsA < r.goalsB){ stats[b].pg++; stats[a].pp++; stats[b].pts+=3; }
      else { stats[a].pe++; stats[b].pe++; stats[a].pts++; stats[b].pts++; }
    });
    const rows = [['Jugador','PJ','PG','PE','PP','GF','GC','DG','PTS']];
    Object.values(stats).forEach(s=> rows.push([s.name,s.pj,s.pg,s.pe,s.pp,s.gf,s.gc,s.gf-s.gc,s.pts]));
    return rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  }

  function buildResultsCSV(){
    const players = load(LS_PLAYERS);
    const matches = load(LS_MATCHES);
    const results = load(LS_RESULTS);
    const pmap={}; players.forEach(p=>pmap[p.id]=p);
    const mMap={}; matches.forEach(m=>mMap[m.id]=m);
    const rows=[['MatchID','FechaPartido','JugadorA','JugadorB','GolesA','GolesB','EnviadoPor','FechaEnvio','TieneEvidencia']];
    results.forEach(r=>{
      const m = mMap[r.matchId] || {};
      const a=pmap[m.playerA]?.name||'--';
      const b=pmap[m.playerB]?.name||'--';
      rows.push([r.matchId, m.datetime||'', a, b, r.goalsA, r.goalsB, (r.submittedBy==='admin' ? 'admin' : (pmap[r.submittedBy]?.name||r.submittedBy)), r.createdAt, r.evidence ? 'SI' : 'NO' ]);
    });
    return rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  }

  // download helper
  function downloadBlob(text, mime, filename){
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  /* ---------- Admin logout ---------- */
  btnLogoutAdmin && btnLogoutAdmin.addEventListener('click', ()=>{
    setActive('register');
  });

  /* ---------- Helpers ---------- */
  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ---------- Init ---------- */
  seed();
  renderAll();
  setActive('register'); // default

})();
