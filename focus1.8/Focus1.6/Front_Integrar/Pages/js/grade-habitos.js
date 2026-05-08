// ══════════════════════════════════════
//  GRADE DE HÁBITOS — Focus Study
//  grade-habitos.js //corrigir a tela
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Estado ──
  let habits = JSON.parse(localStorage.getItem('fs_habits') || '[]');
  // habit: { id, name, goal, activeDays: [0-6], checks: { 'YYYY-MM-DD': true } }
  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth(); // 0-based
  let habitToDelete = null;

  let dailyChart = null, weeklyChart = null;

  // ── Data ──
  const today = new Date();
  document.getElementById('current-date').innerText = today.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });
  document.getElementById('today-badge').textContent = `Hoje: ${today.getDate()} de ${today.toLocaleDateString('pt-BR',{month:'long'})}`;

  // ── Helpers ──
  function pad(n) { return String(n).padStart(2,'0'); }
  function dateKey(y,m,d) { return `${y}-${pad(m+1)}-${pad(d)}`; }
  function daysInMonth(y,m) { return new Date(y, m+1, 0).getDate(); }
  function firstDayOfMonth(y,m) { return new Date(y, m, 1).getDay(); } // 0=Sun

  function save() { localStorage.setItem('fs_habits', JSON.stringify(habits)); }

  // ── Month navigation ──
  function updateMonthLabel() {
    const label = new Date(viewYear, viewMonth, 1).toLocaleDateString('pt-BR', { month:'long', year:'numeric' });
    document.getElementById('month-label').textContent = label.charAt(0).toUpperCase() + label.slice(1);
  }

  document.getElementById('prev-month').addEventListener('click', () => {
    viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderAll();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderAll();
  });

  // ── Summary ──
  function updateSummary() {
    const days = daysInMonth(viewYear, viewMonth);
    let totalChecks = 0, totalPossible = 0;

    habits.forEach(h => {
      for (let d = 1; d <= days; d++) {
        const dt = new Date(viewYear, viewMonth, d);
        if (h.activeDays.includes(dt.getDay())) {
          totalPossible++;
          if (h.checks[dateKey(viewYear, viewMonth, d)]) totalChecks++;
        }
      }
    });

    document.getElementById('s-active').textContent = habits.length;
    document.getElementById('s-done').textContent = totalChecks;
    const rate = totalPossible ? Math.round(totalChecks / totalPossible * 100) : 0;
    document.getElementById('s-rate').textContent = rate + '%';

    // Daily progress (today)
    const td = today.getDate();
    const tm = today.getMonth();
    const ty = today.getFullYear();
    let todayPoss = 0, todayDone = 0;
    habits.forEach(h => {
      if (h.activeDays.includes(today.getDay())) {
        todayPoss++;
        if (h.checks[dateKey(ty, tm, td)]) todayDone++;
      }
    });
    document.getElementById('s-daily').textContent = todayPoss ? Math.round(todayDone/todayPoss*100) + '%' : '0%';

    // Best week
    let bestWeek = '--', bestPct = -1;
    for (let w = 0; w < 4; w++) {
      let wp = 0, wd = 0;
      for (let d = w*7+1; d <= Math.min((w+1)*7, days); d++) {
        const dt = new Date(viewYear, viewMonth, d);
        habits.forEach(h => {
          if (h.activeDays.includes(dt.getDay())) {
            wp++;
            if (h.checks[dateKey(viewYear, viewMonth, d)]) wd++;
          }
        });
      }
      if (wp && (wd/wp) > bestPct) { bestPct = wd/wp; bestWeek = `S${w+1} (${Math.round(bestPct*100)}%)`; }
    }
    document.getElementById('s-best').textContent = bestWeek;
  }

  // ── Habit grid ──
  function renderGrid() {
    const wrapper = document.getElementById('habits-grid-wrapper');
    const days = daysInMonth(viewYear, viewMonth);

    if (!habits.length) {
      wrapper.innerHTML = '<div class="grid-empty-state">Nenhum hábito ainda.<br>Clique em "+ Novo Hábito" para começar!</div>';
      return;
    }

    // Header
    let html = '<div class="grid-days-header"><div class="grid-days-header-spacer"></div><div class="grid-day-nums">';
    for (let d = 1; d <= days; d++) {
      const dt = new Date(viewYear, viewMonth, d);
      const isT = dt.toDateString() === today.toDateString();
      const isWk = dt.getDay() === 0 || dt.getDay() === 6;
      html += `<div class="grid-day-num${isT ? ' today' : isWk ? ' weekend' : ''}">${d}</div>`;
    }
    html += '</div><div style="min-width:38px"></div><div style="min-width:20px"></div></div>';

    habits.forEach(h => {
      html += `<div class="habit-row">
        <div class="habit-row-label" title="${h.name}">${h.name}</div>
        <div class="days-row" id="days-row-${h.id}">`;
      let doneCount = 0, possCount = 0;
      for (let d = 1; d <= days; d++) {
        const dt = new Date(viewYear, viewMonth, d);
        const key = dateKey(viewYear, viewMonth, d);
        const isActive = h.activeDays.includes(dt.getDay());
        const isChecked = h.checks[key];
        const isT = dt.toDateString() === today.toDateString();
        if (isActive) possCount++;
        if (isActive && isChecked) doneCount++;
        html += `<div class="day-cell${isChecked ? ' checked' : ''}${!isActive ? ' off-day' : ''}${isT ? ' today-marker' : ''}"
          data-hid="${h.id}" data-key="${key}" data-active="${isActive}"></div>`;
      }
      const pct = possCount ? Math.round(doneCount/possCount*100) : 0;
      html += `</div>
        <div class="habit-row-pct">${pct}%</div>
        <button class="habit-del-btn" data-hid="${h.id}" title="Remover hábito">✕</button>
      </div>`;
    });

    wrapper.innerHTML = html;

    // Click handlers
    wrapper.querySelectorAll('.day-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        if (cell.dataset.active !== 'true') return;
        const h = habits.find(x => x.id === cell.dataset.hid);
        if (!h) return;
        h.checks[cell.dataset.key] = !h.checks[cell.dataset.key];
        if (!h.checks[cell.dataset.key]) delete h.checks[cell.dataset.key];
        save();
        renderAll();
      });
    });

    wrapper.querySelectorAll('.habit-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        habitToDelete = btn.dataset.hid;
        document.getElementById('modal-del-habit').classList.add('open');
      });
    });
  }

  // ── Analyses ──
  function renderAnalyses() {
    const list = document.getElementById('analyses-list');
    const days = daysInMonth(viewYear, viewMonth);
    list.innerHTML = '';

    if (!habits.length) {
      list.innerHTML = '<li style="text-align:center;color:var(--text-muted);font-size:13px;padding:20px">Sem hábitos para analisar</li>';
      return;
    }

    habits.forEach(h => {
      let done = 0, poss = 0;
      for (let d = 1; d <= days; d++) {
        const dt = new Date(viewYear, viewMonth, d);
        if (h.activeDays.includes(dt.getDay())) {
          poss++;
          if (h.checks[dateKey(viewYear, viewMonth, d)]) done++;
        }
      }
      const pct = h.goal ? Math.min(Math.round(done/h.goal*100), 100) : (poss ? Math.round(done/poss*100) : 0);
      const li = document.createElement('li');
      li.className = 'analysis-item';
      li.innerHTML = `
        <span class="an-name" title="${h.name}">${h.name}</span>
        <span class="an-meta">${h.goal || poss}</span>
        <span class="an-curr">${done}</span>
        <div class="an-bar-wrap"><div class="an-bar-fill" style="width:${pct}%"></div></div>
      `;
      list.appendChild(li);
    });
  }

  // ── Charts ──
  function renderCharts() {
    const days = daysInMonth(viewYear, viewMonth);
    const labels = Array.from({length: days}, (_, i) => i+1);
    const dailyData = labels.map(d => {
      const dt = new Date(viewYear, viewMonth, d);
      let done = 0, poss = 0;
      habits.forEach(h => {
        if (h.activeDays.includes(dt.getDay())) {
          poss++;
          if (h.checks[dateKey(viewYear, viewMonth, d)]) done++;
        }
      });
      return poss ? Math.round(done/poss*100) : 0;
    });

    const weekLabels = ['Semana 1','Semana 2','Semana 3','Semana 4'];
    const weekData = weekLabels.map((_, w) => {
      let done = 0, poss = 0;
      for (let d = w*7+1; d <= Math.min((w+1)*7, days); d++) {
        const dt = new Date(viewYear, viewMonth, d);
        habits.forEach(h => {
          if (h.activeDays.includes(dt.getDay())) {
            poss++;
            if (h.checks[dateKey(viewYear, viewMonth, d)]) done++;
          }
        });
      }
      return poss ? Math.round(done/poss*100) : 0;
    });

    const chartOpts = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#a0aec0', font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#a0aec0', font: { size: 10 }, callback: v => v + '%' }, min: 0, max: 100 }
      }
    };

    if (dailyChart) dailyChart.destroy();
    dailyChart = new Chart(document.getElementById('daily-chart'), {
      type: 'line',
      data: {
        labels,
        datasets: [{ data: dailyData, borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.08)', fill: true, tension: 0.4, pointRadius: 2, pointBackgroundColor: '#06b6d4', borderWidth: 2 }]
      },
      options: chartOpts
    });

    if (weeklyChart) weeklyChart.destroy();
    weeklyChart = new Chart(document.getElementById('weekly-chart'), {
      type: 'bar',
      data: {
        labels: weekLabels,
        datasets: [{ data: weekData, backgroundColor: ['rgba(6,182,212,0.6)','rgba(236,72,153,0.6)','rgba(6,182,212,0.6)','rgba(236,72,153,0.6)'], borderRadius: 8, borderSkipped: false }]
      },
      options: chartOpts
    });
  }

  function renderAll() {
    updateMonthLabel();
    updateSummary();
    renderGrid();
    renderAnalyses();
    renderCharts();
  }

  // ── Modal: Novo Hábito ──
  document.getElementById('btn-new-habit').addEventListener('click', () => {
    document.getElementById('h-name').value = '';
    document.getElementById('h-goal').value = '';
    document.querySelectorAll('.day-pill').forEach(p => {
      p.classList.toggle('active', ['1','2','3','4','5'].includes(p.dataset.day));
    });
    document.getElementById('modal-habit').classList.add('open');
    setTimeout(() => document.getElementById('h-name').focus(), 100);
  });

  document.querySelectorAll('.day-pill').forEach(p => {
    p.addEventListener('click', () => p.classList.toggle('active'));
  });

  document.getElementById('habit-cancel').addEventListener('click', () => document.getElementById('modal-habit').classList.remove('open'));
  document.getElementById('modal-habit').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-habit')) document.getElementById('modal-habit').classList.remove('open');
  });

  document.getElementById('habit-confirm').addEventListener('click', () => {
    const name = document.getElementById('h-name').value.trim();
    if (!name) { document.getElementById('h-name').focus(); return; }
    const goal = parseInt(document.getElementById('h-goal').value) || 0;
    const activeDays = [...document.querySelectorAll('.day-pill.active')].map(p => parseInt(p.dataset.day));

    habits.push({ id: Date.now().toString(), name, goal, activeDays, checks: {} });
    save();
    document.getElementById('modal-habit').classList.remove('open');
    renderAll();
  });

  // ── Modal: Deletar ──
  document.getElementById('del-cancel').addEventListener('click', () => document.getElementById('modal-del-habit').classList.remove('open'));
  document.getElementById('del-confirm').addEventListener('click', () => {
    habits = habits.filter(h => h.id !== habitToDelete);
    save();
    document.getElementById('modal-del-habit').classList.remove('open');
    renderAll();
  });

  renderAll();
});
