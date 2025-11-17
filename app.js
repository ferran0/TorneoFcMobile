/* app.js
 - Proyecto simple usando localStorage.
 - Datos: players, matches, results.
 - PIN por jugador para permitir enviar resultado.
 - Evidence (screenshot) guardada como data-URL.
*/

(() => {
  // Keys localStorage
  const LS_PLAYERS = 'fc_players_v1';
  const LS_MATCHES = 'fc_matches_v1';
  const LS_RESULTS = 'fc_results_v1';

  // Elements
  const tabs = {
    table: document.getElementById('tab-table'),
    calendar: document.getElementById('tab-calendar'),
    submit: document.getElementById('tab-submit'),
    admin: document.getElementById('tab-admin'),
  };
  const panels = {
    table: document.getElementById('panel-table'),
    calendar: document.getElementById('panel-calendar'),
    submit: document.getElementById('panel-submit'),
    admin: document.getElementById('panel-admin'),
  };

  const standingsWrap = document.getElementById('standings-wrap');
  const matchesList = document.getElementById('matches-list');
  const calendarList = document.getElementById('calendar-list');

  const selectMatch = document.getElementById('select-match');
  const goalsA = document.getElementById('goals-a');
  const goalsB = document.getElementById('goals-b');
  const pinInput = document.getElementById('pin');
  const evidenceInput = document.getElementById('evidence');
  const resultForm = document.getElementById('result-form');
  const formMessage = document.getElementById('form-message');

  const exportCsvBtn = document.getElementById('export-csv');
  const clearDataBtn = document.getElementById('clear-data');

  // Admin elements
  const apName = document.getElementById('ap-name');
  const apPin = document.getElementById('ap-pin');
  const apLogo = document.getElementById('ap-logo');
  const formAddPlayer = document.getElementById('form-add-player');

  const amDate = document.getElementById('am-date');
  const amA = document.getElementById('am-a');
  const amB = document.getElementById('am-b');
  const formAddMatch = document.getElementById('form-add-match');

  const adminResults = document.getElementById('admin-results');

  // helpers: localStorage load/save
  function load(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // initial sample data (only if empty)
  function seed() {
    let players = load(LS_PLAYERS);
    let matches = load(LS_MATCHES);
    let results = load(LS_RESULTS);

    if (players.length === 0 && matches.length === 0 && results.length === 0) {
      // sample players: eca (pin entoec6el) and rival
      players.push({id: uid(), name: 'eca', pin: 'entoec6el', logo: null});
      players.push({id: uid(), name: 'rival', pin: randomPin(), logo: null});
      save(LS_PLAYERS, players);

      // sample match
      const mId = uid();
      const nowIso = new Date().toISOString().slice(0,16);
      const matchDate = new Date().toISOString().slice(0,10);
      matches.push({id: mId, datetime: nowIso, playerA: players[0].id, playerB: players[1].id});
      save(LS_MATCHES, matches);

      // sample result: eca 2 - rival 1
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

  // uid helper
  function uid() {
    return 'id_' + Math.random().toString(36).slice(2,9);
  }
  function randomPin() {
    return Math.random().toString(36).slice(2,8);
  }

  /* ---------- Renders ---------- */
  function renderAll() {
    renderStandings();
    renderMatches();
    renderCalendar();
    fillMatchSelect();
    fillAdminPlayersSelects();
    renderAdminResults();
  }

  function renderStandings() {
    const players = load(LS_PLAYERS);
    const matches = load(LS_MATCHES);
    const results = load(LS_RESULTS);

    // initialize stats
    const stats = {};
    players.forEach(p => stats[p.id] = {id:p.id, name:p.name, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0});

    // build a map of match -> teams
    const matchMap = {};
    matches.forEach(m => matchMap[m.id] = m);

    results.forEach(r => {
      const match = matchMap[r.matchId];
      if (!match) return;
      const a = match.playerA;
      const b = match.playerB;

      stats[a].pj++; stats[b].pj++;
      stats[a].gf += r.goalsA; stats[a].gc += r.goalsB;
      stats[b].gf += r.goalsB; stats[b].gc += r.goalsA;

      if (r.goalsA > r.goalsB) {
        stats[a].pg++; stats[b].pp++;
        stats[a].pts += 3;
      } else if (r.goalsA < r.goalsB) {
        stats[b].pg++; stats[a].pp++;
        stats[b].pts += 3;
      } else {
        stats[a].pe++; stats[b].pe++;
        stats[a].pts++; stats[b].pts++;
      }
    });

    // array and sort by pts desc, gd, gf
    const arr = Object.values(stats);
    arr.forEach(s => s.gd = s.gf - s.gc);
    arr.sort((x,y) => {
      if (y.pts !== x.pts) return y.pts - x.pts;
      if (y.gd !== x.gd) return y.gd - x.gd;
      return y.gf - x.gf;
    });

    // build table
    let html = `<table>
      <thead><tr><th>#</th><th>Jugador</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th></tr></thead><tbody>`;
    arr.forEach((s,i) => {
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
    html += `</tbody></table>`;
    standingsWrap.innerHTML = html;
  }

  function renderMatches() {
    const players = load(LS_PLAYERS);
    const matches = load(LS_MATCHES);
    const results = load(LS_RESULTS);

    const pmap = {}; players.forEach(p=> pmap[p.id] = p);

    // show each match and result if exists
    let html = '';
    matches.sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));
    matches.forEach(m => {
      const res = results.find(r=> r.matchId === m.id);
      const left = `<div class="match-left">
        ${ pmap[m.playerA] && pmap[m.playerA].logo ? `<img src="${pmap[m.playerA].logo}" class="logo-thumb">` : `<div class="logo-thumb" style="display:flex;align-items:center;justify-content:center;background:#fafafa">${pmap[m.playerA]?.name?.charAt(0)||'?'}</div>` }
        <div><strong>${escapeHtml(pmap[m.playerA]?.name||'--')}</strong><br><span class="small">${new Date(m.datetime).toLocaleString()}</span></div>
      </div>`;
      const right = `<div style="text-align:right">
        ${ pmap[m.playerB] && pmap[m.playerB].logo ? `<img src="${pmap[m.playerB].logo}" class="logo-thumb">` : `<div class="logo-thumb" style="display:flex;align-items:center;justify-content:center;background:#fafafa">${pmap[m.playerB]?.name?.charAt(0)||'?'}</div>` }
        <div><strong>${escapeHtml(pmap[m.playerB]?.name||'--')}</strong></div>
      </div>`;

      const resultHtml = res ? `<div><strong>${res.goalsA} - ${res.goalsB}</strong><div class="small">by ${pmap[res.submittedBy]?.name||res.submittedBy} · ${new Date(res.createdAt).toLocaleString()}</div>
          ${res.evidence ? `<div style="margin-top:6px"><img src="${res.evidence}" style="max-width:160px;border-radius:6px;border:1px solid #eee"></div>` : ''}</div>` : `<div class="small">Pendiente</div>`;

      html += `<div class="match-row">
        <div style="display:flex;gap:12px;align-items:center">${left}<div style="padding:0 12px">${escapeHtml(pmap[m.playerA]?.name||'')} <strong>vs</strong> ${escapeHtml(pmap[m.playerB]?.name||'')}</div>${right}</div>
        <div>${resultHtml}</div>
      </div>`;
    });

    matchesList.innerHTML = html || '<p class="small">No hay partidos.</p>';
  }

  function renderCalendar(){
    const matches = load(LS_MATCHES);
    const players = load(LS_PLAYERS);
    const pmap = {}; players.forEach(p=> pmap[p.id]=p);
    if (matches.length === 0) {
      calendarList.innerHTML = '<p class="small">No hay partidos.</p>'; return;
    }
    let html = '';
    matches.sort((a,b)=> new Date(a.datetime) - new Date(b.datetime));
    matches.forEach(m => {
      html += `<div class="fc-event">
        <div><strong>${escapeHtml(pmap[m.playerA]?.name||'--')} vs ${escapeHtml(pmap[m.playerB]?.name||'--')}</strong></div>
        <div class="small">${new Date(m.datetime).toLocaleString()}</div>
      </div>`;
    });
    calendarList.innerHTML = html;
  }

  function fillMatchSelect(){
    const matches = load(LS_MATCHES);
    const players = load(LS_PLAYERS);
    const pmap = {}; players.forEach(p=> pmap[p.id]=p);
    selectMatch.innerHTML = '<option value="">Seleccionar partido...</option>';
    matches.forEach(m=>{
      const label = `${pmap[m.playerA]?.name||'--'} vs ${pmap[m.playerB]?.name||'--'} — ${new Date(m.datetime).toLocaleString()}`;
      selectMatch.insertAdjacentHTML('beforeend', `<option value="${m.id}">${escapeHtml(label)}</option>`);
    });
  }

  function fillAdminPlayersSelects(){
    const players = load(LS_PLAYERS);
    amA.innerHTML = '<option value="">Jugador A</option>';
    amB.innerHTML = '<option value="">Jugador B</option>';
    players.forEach(p=>{
      amA.insertAdjacentHTML('beforeend', `<option value="${p.id}">${escapeHtml(p.name)}</option>`);
      amB.insertAdjacentHTML('beforeend', `<option value="${p.id}">${escapeHtml(p.name)}</option>`);
    });
  }

  function renderAdminResults(){
    const results = load(LS_RESULTS);
    const matches = load(LS_MATCHES);
    const players = load(LS_PLAYERS);
    const mMap = {}; matches.forEach(m=> mMap[m.id]=m);
    const pMap = {}; players.forEach(p=> pMap[p.id]=p);

    if (results.length === 0) { adminResults.innerHTML = '<p class="small">No hay resultados.</p>'; return; }
    let html = '';
    results.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    results.forEach(r=>{
      const m = mMap[r.matchId];
      const label = m ? `${pMap[m.playerA]?.name||'--'} ${r.goalsA} - ${r.goalsB} ${pMap[m.playerB]?.name||'--'}` : 'Match removed';
      html += `<div class="res-row"><div><strong>${escapeHtml(label)}</strong><div class="small">${new Date(r.createdAt).toLocaleString()} · by ${pMap[r.submittedBy]?.name||r.submittedBy}</div></div>
        <div>${ r.evidence ? `<img src="${r.evidence}" style="max-width:120px;border-radius:6px;border:1px solid #eee">` : '' }</div></div>`;
    });
    adminResults.innerHTML = html;
  }

  /* ---------- Form actions ---------- */

  // submit result
  resultForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    formMessage.textContent = '';
    const matchId = selectMatch.value;
    if (!matchId) { formMessage.textContent = 'Elegí un partido'; return; }
    const gA = parseInt(goalsA.value,10);
    const gB = parseInt(goalsB.value,10);
    const pin = pinInput.value.trim();
    if (isNaN(gA) || isNaN(gB)) { formMessage.textContent = 'Goles inválidos'; return; }
    if (!pin) { formMessage.textContent = 'Ingresá tu PIN'; return; }
    if (!evidenceInput.files || evidenceInput.files.length === 0) { formMessage.textContent = 'Subí la screenshot'; return; }

    // check PIN matches either player of the match
    const matches = load(LS_MATCHES);
    const match = matches.find(m => m.id === matchId);
    if (!match) { formMessage.textContent = 'Partido no encontrado'; return; }
    const players = load(LS_PLAYERS);
    const playerA = players.find(p=> p.id === match.playerA);
    const playerB = players.find(p=> p.id === match.playerB);
    if (!playerA || !playerB) { formMessage.textContent = 'Jugadores del partido no encontrados'; return; }

    // find player by pin and ensure is A or B
    const submitting = players.find(p => p.pin === pin);
    if (!submitting) { formMessage.textContent = 'PIN inválido'; return; }
    if (submitting.id !== playerA.id && submitting.id !== playerB.id) { formMessage.textContent = 'El PIN no corresponde a ninguno de los jugadores de este partido'; return; }

    // read file as dataURL
    const file = evidenceInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      // save result
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
      formMessage.textContent = 'Resultado guardado ✅';
      // reset form fields
      goalsA.value = ''; goalsB.value=''; pinInput.value=''; evidenceInput.value='';
      renderAll();
    };
    reader.readAsDataURL(file);
  });

  // add player
  formAddPlayer.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = apName.value.trim();
    const pin = apPin.value.trim();
    if (!name || !pin) return alert('Nombre y PIN requeridos');
    let logoData = null;
    if (apLogo.files && apLogo.files[0]) {
      logoData = await fileToDataUrl(apLogo.files[0]);
    }
    const players = load(LS_PLAYERS);
    players.push({id: uid(), name: name, pin: pin, logo: logoData});
    save(LS_PLAYERS, players);
    apName.value=''; apPin.value=''; apLogo.value='';
    renderAll();
  });

  // add match
  formAddMatch.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const dateVal = amDate.value;
    const a = amA.value;
    const b = amB.value;
    if (!dateVal || !a || !b) return alert('Todos los campos requeridos');
    if (a === b) return alert('Los jugadores deben ser distintos');
    const matches = load(LS_MATCHES);
    matches.push({id: uid(), datetime: new Date(dateVal).toISOString(), playerA: a, playerB: b});
    save(LS_MATCHES, matches);
    amDate.value=''; amA.value=''; amB.value='';
    renderAll();
  });

  // export CSV
  exportCsvBtn.addEventListener('click', () => {
    const players = load(LS_PLAYERS);
    const matches = load(LS_MATCHES);
    const results = load(LS_RESULTS);
    const pmap = {}; players.forEach(p=> pmap[p.id]=p);

    let rows = [['Match ID','Fecha','Jugador A','Jugador B','Goles A','Goles B','Enviado por','Fecha envio']];
    results.forEach(r=>{
      const m = matches.find(mm=> mm.id === r.matchId) || {};
      const date = m.datetime ? new Date(m.datetime).toLocaleString() : '';
      const a = pmap[m.playerA]?.name || '';
      const b = pmap[m.playerB]?.name || '';
      const by = pmap[r.submittedBy]?.name || r.submittedBy;
      rows.push([r.matchId, date, a, b, r.goalsA, r.goalsB, by, new Date(r.createdAt).toLocaleString()]);
    });

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    downloadBlob(csv, 'text/csv;charset=utf-8;', 'fc_results.csv');
  });

  // clear data (for testing)
  clearDataBtn.addEventListener('click', () => {
    if (!confirm('Borrar TODOS LOS DATOS del torneo en localStorage? (solo pruebas)')) return;
    localStorage.removeItem(LS_PLAYERS);
    localStorage.removeItem(LS_MATCHES);
    localStorage.removeItem(LS_RESULTS);
    seed(); renderAll();
  });

  // tab switching
  function setActiveTab(tabKey){
    Object.keys(tabs).forEach(k=> tabs[k].classList.remove('active'));
    Object.keys(panels).forEach(k=> panels[k].classList.add('hidden'));
    tabs[tabKey].classList.add('active');
    panels[tabKey].classList.remove('hidden');
  }
  tabs.table.addEventListener('click', ()=> setActiveTab('table'));
  tabs.calendar.addEventListener('click', ()=> setActiveTab('calendar'));
  tabs.submit.addEventListener('click', ()=> setActiveTab('submit'));
  tabs.admin.addEventListener('click', ()=> setActiveTab('admin'));

  /* ---------- Utilities ---------- */
  function escapeHtml(s){ if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fileToDataUrl(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsDataURL(file); }); }
  function downloadBlob(text, mime, filename){ const blob = new Blob([text], {type: mime}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
  
  /* ---------- Init ---------- */
  seed();
  renderAll();
})();
