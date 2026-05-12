// ══════════════════════════════════════════
//  ESTATÍSTICAS — Focus Study
//  Persistência por mês + modal de exclusão customizado //criar tela nova
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  const DAYS      = ['seg', 'ter', 'qua', 'qui', 'sex'];
  const DAY_LABELS= ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  const WEEKS     = 4;
  const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                     'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  // ── Estado ──────────────────────────────
  let currentMonth = new Date().getMonth();
  let currentYear  = new Date().getFullYear();
  let currentWeek  = 0;

  // Estrutura salva por chave "YYYY-MM"
  // monthData[key] = { habits: [{ name, goal, weeks }] }
  let habits = [];      // hábitos do mês atual

  // ── DOM ─────────────────────────────────
  const dateEl       = document.getElementById('current-date');
  const monthLabel   = document.getElementById('month-label');
  const prevBtn      = document.getElementById('prev-month');
  const nextBtn      = document.getElementById('next-month');
  const tbody        = document.getElementById('habits-tbody');
  const analysesList = document.getElementById('analyses-list');
  const addHabitBtn  = document.getElementById('add-habit-btn');

  // Modal adicionar
  const modalAdd     = document.getElementById('modal-overlay');
  const modalCancel  = document.getElementById('modal-cancel');
  const modalConfirm = document.getElementById('modal-confirm');
  const habitNameIn  = document.getElementById('modal-habit-name');
  const habitGoalIn  = document.getElementById('modal-habit-goal');

  // Modal deletar (será injetado dinamicamente)
  let pendingDeleteIdx = null;

  // ── Data ─────────────────────────────────
  const opts = { weekday: 'long', day: 'numeric', month: 'long' };
  if (dateEl) dateEl.innerText = new Date().toLocaleDateString('pt-BR', opts);

  // ══════════════════════════════════════════
  //  PERSISTÊNCIA POR MÊS
  // ══════════════════════════════════════════

  function monthKey(y, m) { return `fs_habits_${y}_${String(m).padStart(2,'0')}`; }

  /** Salva hábitos do mês atual no localStorage */
  function saveMonthData() {
    try {
      localStorage.setItem(monthKey(currentYear, currentMonth), JSON.stringify(habits));
    } catch(e) {}
  }

  /**
   * Carrega hábitos de um mês específico.
   * Se não houver dados, copia a lista de hábitos (sem progresso) do mês anterior
   * para que o usuário não precise re-cadastrar tudo.
   */
  function loadMonthData(year, month) {
    try {
      const raw = localStorage.getItem(monthKey(year, month));
      if (raw) return JSON.parse(raw);
    } catch(e) {}

    // Tenta copiar nomes/metas do mês anterior (sem progresso)
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear  = month === 0 ? year - 1 : year;
    try {
      const prevRaw = localStorage.getItem(monthKey(prevYear, prevMonth));
      if (prevRaw) {
        const prevHabits = JSON.parse(prevRaw);
        // Retorna mesmos hábitos mas com progresso zerado
        return prevHabits.map(h => ({
          name: h.name,
          goal: h.goal,
          weeks: Array.from({ length: WEEKS }, () => Array(5).fill(false))
        }));
      }
    } catch(e) {}

    // Sem histórico: retorna defaults para o mês atual, vazio nos demais
    if (year === new Date().getFullYear() && month === new Date().getMonth()) {
      return getDefaultHabits();
    }
    return [];
  }

  function getDefaultHabits() {
    return [
      { name: 'Acordar 6h30 da manhã',  goal: 20, weeks: Array.from({length:4}, () => [true,true,false,true,false]) },
      { name: 'Tomar café da manhã',     goal: 20, weeks: Array.from({length:4}, () => [true,true,true,false,true]) },
      { name: 'Beber 2 litros de água',  goal: 20, weeks: Array.from({length:4}, () => [false,true,false,true,false]) },
      { name: 'Estudar / Curso',         goal: 20, weeks: Array.from({length:4}, () => [true,false,true,true,false]) },
      { name: 'Ler',                     goal: 20, weeks: Array.from({length:4}, () => [false,true,false,false,true]) },
    ];
  }

  // ── Navegação de meses ───────────────────
  function renderMonthLabel() {
    monthLabel.textContent = `${MONTHS_PT[currentMonth]} ${currentYear}`;
  }

  function changeMonth(delta) {
    // Salva progresso do mês atual antes de navegar
    saveMonthData();

    currentMonth += delta;
    if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
    if (currentMonth > 11) { currentMonth = 0;  currentYear++; }

    // Reseta semana ativa
    currentWeek = 0;
    document.querySelectorAll('.week-tab').forEach((b, i) => b.classList.toggle('active', i === 0));

    habits = loadMonthData(currentYear, currentMonth);
    renderAll();
  }

  prevBtn?.addEventListener('click', () => changeMonth(-1));
  nextBtn?.addEventListener('click', () => changeMonth(+1));

  // ── Semana tabs ─────────────────────────
  document.querySelectorAll('.week-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.week-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentWeek = parseInt(btn.dataset.week);
      renderTable();
      renderFooter();
      renderChart();
    });
  });

  // ══════════════════════════════════════════
  //  MODAL ADICIONAR HÁBITO
  // ══════════════════════════════════════════
  addHabitBtn?.addEventListener('click', () => {
    habitNameIn.value = '';
    habitGoalIn.value = '';
    modalAdd.classList.add('open');
    setTimeout(() => habitNameIn.focus(), 100);
  });

  modalCancel?.addEventListener('click', () => modalAdd.classList.remove('open'));
  modalAdd?.addEventListener('click', e => { if (e.target === modalAdd) modalAdd.classList.remove('open'); });

  modalConfirm?.addEventListener('click', () => {
    const name = habitNameIn.value.trim();
    const goal = Math.min(Math.max(parseInt(habitGoalIn.value) || 20, 1), 31);
    if (!name) { habitNameIn.focus(); return; }
    habits.push({
      name, goal,
      weeks: Array.from({ length: WEEKS }, () => Array(5).fill(false))
    });
    saveMonthData();
    modalAdd.classList.remove('open');
    renderAll();
  });

  habitNameIn?.addEventListener('keydown', e => { if (e.key === 'Enter') habitGoalIn.focus(); });
  habitGoalIn?.addEventListener('keydown', e => { if (e.key === 'Enter') modalConfirm.click(); });

  // ══════════════════════════════════════════
  //  MODAL DELETAR HÁBITO (custom, sem confirm())
  // ══════════════════════════════════════════

  // Injeta modal de deleção customizado no body (se não existir)
  if (!document.getElementById('modal-delete-habit')) {
    const delModal = document.createElement('div');
    delModal.id = 'modal-delete-habit';
    delModal.className = 'fs-modal-overlay';
    delModal.innerHTML = `
      <div class="fs-modal">
        <div class="fs-modal-icon pink">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </div>
        <h3>Remover Hábito</h3>
        <p class="fs-modal-sub">Deseja remover <strong id="del-habit-name" class="gradient-text">"..."</strong>?<br>
        <span style="font-size:12px;color:var(--text-muted)">O progresso deste hábito será perdido permanentemente.</span></p>
        <div class="fs-modal-actions">
          <button class="fs-btn-cancel" id="del-habit-cancel">Cancelar</button>
          <button class="fs-btn-danger" id="del-habit-confirm">Remover</button>
        </div>
      </div>
    `;
    document.body.appendChild(delModal);

    document.getElementById('del-habit-cancel').addEventListener('click', () => {
      delModal.classList.remove('open');
      pendingDeleteIdx = null;
    });
    delModal.addEventListener('click', e => {
      if (e.target === delModal) { delModal.classList.remove('open'); pendingDeleteIdx = null; }
    });
    document.getElementById('del-habit-confirm').addEventListener('click', () => {
      if (pendingDeleteIdx !== null) {
        habits.splice(pendingDeleteIdx, 1);
        saveMonthData();
        renderAll();
      }
      delModal.classList.remove('open');
      pendingDeleteIdx = null;
    });
  }

  function openDeleteModal(idx) {
    pendingDeleteIdx = idx;
    document.getElementById('del-habit-name').textContent = `"${habits[idx].name}"`;
    document.getElementById('modal-delete-habit').classList.add('open');
  }

  // ══════════════════════════════════════════
  //  RENDERIZAÇÃO DA TABELA
  // ══════════════════════════════════════════
  function renderTable() {
    tbody.innerHTML = '';
    if (habits.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="table-empty">
        Nenhum hábito ainda. Clique em <strong style="color:var(--cyan)">+ Novo Hábito</strong>!
      </td></tr>`;
      return;
    }

    habits.forEach((habit, hi) => {
      const weekData = habit.weeks[currentWeek];
      const done = weekData.filter(Boolean).length;
      const pct  = Math.round((done / 5) * 100);
      const color = pct >= 80 ? '#4ade80' : pct >= 50 ? 'var(--cyan)' : 'var(--pink)';

      const tr = document.createElement('tr');
      let cells = `<td title="${escapeHtml(habit.name)}">${escapeHtml(habit.name)}</td>`;

      DAYS.forEach((_, di) => {
        cells += `<td><input type="checkbox" class="table-check" data-hi="${hi}" data-di="${di}" ${weekData[di] ? 'checked' : ''}></td>`;
      });

      cells += `<td><span class="habit-pct" style="color:${color}">${pct}%</span></td>`;
      cells += `<td><button class="btn-remove-habit" data-hi="${hi}" title="Remover">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
        </svg>
      </button></td>`;

      tr.innerHTML = cells;
      tbody.appendChild(tr);
    });

    // Checkboxes
    tbody.querySelectorAll('.table-check').forEach(cb => {
      cb.addEventListener('change', e => {
        const hi = parseInt(e.target.dataset.hi);
        const di = parseInt(e.target.dataset.di);
        habits[hi].weeks[currentWeek][di] = e.target.checked;
        saveMonthData();
        renderTable();
        renderFooter();
        renderSummary();
        renderAnalyses();
        renderChart();
      });
    });

    // Botões remover
    tbody.querySelectorAll('.btn-remove-habit').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(parseInt(btn.dataset.hi)));
    });
  }

  // ── Footer ───────────────────────────────
  function renderFooter() {
    DAYS.forEach((day, di) => {
      const total = habits.length;
      const done  = habits.filter(h => h.weeks[currentWeek][di]).length;
      const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
      const fpEl = document.getElementById(`f-${day}`);
      const fdEl = document.getElementById(`d-${day}`);
      const fnEl = document.getElementById(`n-${day}`);
      if (fpEl) fpEl.textContent = total > 0 ? `${pct}%` : '--';
      if (fdEl) fdEl.textContent = done;
      if (fnEl) fnEl.textContent = total - done;
    });
  }

  // ── Resumo ────────────────────────────────
  function renderSummary() {
    const total = habits.length;
    document.getElementById('total-habits').textContent = total;

    let totalDone = 0;
    habits.forEach(h => h.weeks.forEach(w => { totalDone += w.filter(Boolean).length; }));
    document.getElementById('total-done').textContent = totalDone;

    const maxPossible = total * WEEKS * 5;
    const pct = maxPossible > 0 ? Math.round((totalDone / maxPossible) * 100) : 0;
    document.getElementById('overall-progress').textContent = `${pct}%`;

    let bestWeekIdx = 0, bestCount = -1;
    for (let w = 0; w < WEEKS; w++) {
      let cnt = habits.reduce((acc, h) => acc + h.weeks[w].filter(Boolean).length, 0);
      if (cnt > bestCount) { bestCount = cnt; bestWeekIdx = w; }
    }
    document.getElementById('best-week').textContent = total > 0 ? `Semana ${bestWeekIdx + 1}` : '--';
  }

  // ── Análises ──────────────────────────────
  function renderAnalyses() {
    analysesList.innerHTML = '';
    if (habits.length === 0) {
      analysesList.innerHTML = `<li style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px 0">
        Adicione hábitos para ver as análises.
      </li>`;
      return;
    }

    habits.forEach(habit => {
      const totalDone = habit.weeks.reduce((a, w) => a + w.filter(Boolean).length, 0);
      const pct   = Math.min(Math.round((totalDone / habit.goal) * 100), 100);
      const color = pct >= 80 ? '#4ade80' : pct >= 50 ? 'var(--cyan)' : 'var(--pink)';
      const li = document.createElement('li');
      li.className = 'analysis-item';
      li.title = habit.name;
      li.innerHTML = `
        <span class="analysis-meta">${habit.goal}</span>
        <span class="analysis-current">${totalDone}</span>
        <div class="analysis-bar-wrap">
          <div class="analysis-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      `;
      analysesList.appendChild(li);
    });
  }

  // ── Gráfico de linha (canvas puro) ────────
  function renderChart() {
    const canvas = document.getElementById('progress-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const total = habits.length || 1;
    const dataPoints = DAYS.map((_, di) => {
      const done = habits.filter(h => h.weeks[currentWeek][di]).length;
      return Math.round((done / total) * 100);
    });
    drawLineChart(ctx, canvas, DAY_LABELS, dataPoints);
  }

  function drawLineChart(ctx, canvas, labels, data) {
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const W    = rect.width;
    const H    = 220;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const padL = 44, padR = 20, padT = 24, padB = 36;
    const cW = W - padL - padR;
    const cH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    // Linhas de grade
    for (let i = 0; i <= 4; i++) {
      const y = padT + (cH / 4) * i;
      ctx.strokeStyle = 'rgba(55,65,81,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + cW, y); ctx.stroke();
      ctx.fillStyle = 'rgba(160,174,192,0.65)';
      ctx.font = '11px system-ui,sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${100 - 25 * i}%`, padL - 8, y + 4);
    }

    const pts = data.map((v, i) => ({
      x: padL + (i / (data.length - 1)) * cW,
      y: padT + cH - (v / 100) * cH
    }));

    // Área
    const grad = ctx.createLinearGradient(0, padT, 0, padT + cH);
    grad.addColorStop(0, 'rgba(6,182,212,0.3)');
    grad.addColorStop(1, 'rgba(6,182,212,0.01)');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, padT + cH);
    ctx.lineTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i-1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cx, pts[i-1].y, cx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.lineTo(pts[pts.length-1].x, padT + cH);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    // Linha
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i-1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cx, pts[i-1].y, cx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round'; ctx.stroke();

    // Pontos e labels
    pts.forEach((pt, i) => {
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 5, 0, Math.PI*2);
      ctx.fillStyle = '#06b6d4'; ctx.fill();
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI*2);
      ctx.fillStyle = '#0f0f0f'; ctx.fill();
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 11px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${data[i]}%`, pt.x, pt.y - 10);
      ctx.fillStyle = 'rgba(160,174,192,0.8)';
      ctx.font = '12px system-ui,sans-serif';
      ctx.fillText(labels[i], pt.x, H - 8);
    });
  }

  // ── Render tudo ───────────────────────────
  function renderAll() {
    renderMonthLabel();
    renderTable();
    renderFooter();
    renderSummary();
    renderAnalyses();
    renderChart();
  }

  window.addEventListener('resize', renderChart);

  // ── Inicialização ─────────────────────────
  habits = loadMonthData(currentYear, currentMonth);
  renderAll();

  // ── Utils ─────────────────────────────────
  function escapeHtml(s) {
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
});
