// ══════════════════════════════════════
//  ESTATÍSTICAS — Focus Study
//  estatisticas-new.js  (corrigido) //criar tela nova
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Date ──
  const today = new Date();
  document.getElementById('current-date').innerText = today.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });

  // Load avatar
  const profile = JSON.parse(localStorage.getItem('fs_profile') || '{}');
  if (profile.avatar) {
    const navAv = document.getElementById('nav-avatar');
    if (navAv) navAv.src = profile.avatar;
  }

  // ── Year navigation ──
  let viewYear = today.getFullYear();
  document.getElementById('year-label').textContent = viewYear;

  document.getElementById('prev-year').addEventListener('click', () => { viewYear--; document.getElementById('year-label').textContent = viewYear; renderAll(); });
  document.getElementById('next-year').addEventListener('click', () => { viewYear++; document.getElementById('year-label').textContent = viewYear; renderAll(); });

  // ── Week offset for weekly hours ──
  let weekOffset = 0;

  function getWeekDates(offset) {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay() + 1 + offset * 7); // Monday
    return Array.from({length: 7}, (_, i) => {
      const day = new Date(d);
      day.setDate(d.getDate() + i);
      return day;
    });
  }

  function formatWeekLabel(offset) {
    const dates = getWeekDates(offset);
    const fmt = d => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    return `${fmt(dates[0])} – ${fmt(dates[6])}`;
  }

  function updateWeekLabel() {
    const el = document.getElementById('wh-week-label');
    if (el) el.textContent = weekOffset === 0 ? 'Esta semana' : formatWeekLabel(weekOffset);
  }

  document.getElementById('wh-prev-week')?.addEventListener('click', () => { weekOffset--; updateWeekLabel(); renderWeeklyHours(); });
  document.getElementById('wh-next-week')?.addEventListener('click', () => { weekOffset++; updateWeekLabel(); renderWeeklyHours(); });

  // ── Study hours data ──
  function getStudyData() { return JSON.parse(localStorage.getItem('fs_study_hours') || '{}'); }
  function saveStudyData(data) { localStorage.setItem('fs_study_hours', JSON.stringify(data)); }

  // Weekly goals: { 0: 60, 1: 90, ... } (Sun=0 ... Sat=6), minutes
  function getWeekGoals() {
    const defaults = { 0:0, 1:90, 2:90, 3:90, 4:90, 5:90, 6:30 };
    return { ...defaults, ...JSON.parse(localStorage.getItem('fs_week_goals') || '{}') };
  }
  function saveWeekGoals(g) { localStorage.setItem('fs_week_goals', JSON.stringify(g)); }

  // ── Summary ──
  function updateSummary() {
    const data = getStudyData();
    const pomosTotal = parseInt(localStorage.getItem('fs_pomo_total') || '0');
    const settings = JSON.parse(localStorage.getItem('fs_settings') || '{}');

    document.getElementById('s-sessions').textContent = pomosTotal;

    const totalMins = Object.values(data).reduce((a,b) => a+b, 0);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    document.getElementById('s-hours').textContent = mins ? `${hours}h${mins}m` : `${hours}h`;

    // Streak
    let streak = 0, d = new Date(today);
    while (true) {
      const k = fmtKey(d);
      if (!data[k] || data[k] === 0) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    localStorage.setItem('fs_streak', streak);
    document.getElementById('s-streak').textContent = streak + (streak === 1 ? ' dia' : ' dias');

    // Habits done
    const habits = JSON.parse(localStorage.getItem('fs_habits') || '[]');
    let habitsDone = 0;
    const yearStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0');
    habits.forEach(h => {
      habitsDone += Object.keys(h.checks || {}).filter(k => k.startsWith(yearStr)).length;
    });
    document.getElementById('s-habits-done').textContent = habitsDone;
  }

  function fmtKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // ── Weekly hours ──
  const DAYS_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  function renderWeeklyHours() {
    const grid = document.getElementById('weekly-hours-grid');
    const data = getStudyData();
    const goals = getWeekGoals();

    const weekDates = getWeekDates(weekOffset);

    grid.innerHTML = '';

    let maxMins = 0;
    const days = weekDates.map(d => {
      const key = fmtKey(d);
      const mins = data[key] || 0;
      const goal = goals[d.getDay()] || 0;
      if (mins > maxMins) maxMins = mins;
      if (goal > maxMins) maxMins = goal;
      return { d, key, mins, goal, dayOfWeek: d.getDay() };
    });

    const barMax = Math.max(maxMins, 120); // at least 2h scale

    days.forEach(({ d, key, mins, goal, dayOfWeek }) => {
      const isTodayDay = d.toDateString() === today.toDateString();
      const overGoal = goal > 0 && mins >= goal;
      const barH = mins ? Math.max(Math.round(mins / barMax * 100), 3) : 0;
      const goalH = goal ? Math.round(goal / barMax * 100) : 0;

      const col = document.createElement('div');
      col.className = 'wh-day-col';
      col.innerHTML = `
        <div class="wh-day-name${isTodayDay ? ' today-name' : ''}">${DAYS_NAMES[dayOfWeek]}</div>
        <div class="wh-bar-track">
          ${goal ? `<div class="wh-goal-line" style="bottom:${goalH}%"></div>` : ''}
          <div class="wh-bar-fill${overGoal ? ' over-goal' : ''}" style="height:${barH}%"></div>
        </div>
        <div class="wh-day-info">
          <div class="wh-day-hours">${mins ? (Math.floor(mins/60) ? Math.floor(mins/60)+'h' : '') + (mins%60 ? (mins%60)+'m' : '') : '0m'}</div>
          <div class="wh-day-goal">
            Meta: <span class="goal-text-${dayOfWeek}">${goal ? (Math.floor(goal/60) ? Math.floor(goal/60)+'h' : '')+(goal%60 ? (goal%60)+'m':'') : '--'}</span>
            <button class="wh-edit-goal" data-day="${dayOfWeek}">✎</button>
          </div>
        </div>
        <button class="wh-log-btn" data-key="${key}" data-day="${dayOfWeek}">+ Log</button>
      `;
      grid.appendChild(col);
    });

    // Edit goal buttons
    grid.querySelectorAll('.wh-edit-goal').forEach(btn => {
      btn.addEventListener('click', () => {
        const dow = parseInt(btn.dataset.day);
        const g = getWeekGoals();
        const currentGoal = g[dow] || 0;
        const inp = prompt(`Meta para ${DAYS_NAMES[dow]} (minutos):`, currentGoal);
        if (inp === null) return;
        const val = Math.max(0, parseInt(inp) || 0);
        g[dow] = val;
        saveWeekGoals(g);
        renderWeeklyHours();
      });
    });

    // Log hours buttons
    grid.querySelectorAll('.wh-log-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const dow = parseInt(btn.dataset.day);
        const data = getStudyData();
        const cur = data[key] || 0;
        const inp = prompt(`Horas estudadas em ${DAYS_NAMES[dow]} (minutos totais, atual: ${cur}min):`);
        if (inp === null) return;
        const val = Math.max(0, parseInt(inp) || 0);
        data[key] = val;
        saveStudyData(data);
        renderWeeklyHours();
        updateSummary();
        renderAnnual();
        checkAchievements();
      });
    });
  }

  // ── Annual heatmap ──
  const MONTH_ABBR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  function renderAnnual() {

    // Determine if it's a leap year
    const isLeap = (viewYear % 4 === 0 && viewYear % 100 !== 0) || viewYear % 400 === 0;
    const daysInYear = isLeap ? 366 : 365;

    const yearStart = new Date(viewYear, 0, 1);
    const yearEnd = new Date(viewYear, 11, 31);

    // Pad start so grid begins on Sunday (col 0)
    const startPad = yearStart.getDay(); // 0=Sun

    // Build all weeks
    const weeks = [];
    let week = [];

    // Fill initial padding (days before Jan 1)
    for (let i = 0; i < startPad; i++) week.push(null);

    let cursor = new Date(yearStart);
    while (cursor <= yearEnd) {
      week.push(new Date(cursor));
      if (week.length === 7) { weeks.push(week); week = []; }
      cursor.setDate(cursor.getDate() + 1);
    }
    // Pad last week
    if (week.length) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    // Max for color scale
    const allVals = Object.values(data).filter(v => v > 0);
    const maxVal = allVals.length ? Math.max(...allVals) : 120;

    // Day labels (left column)
    let dayLabelsHtml = '<div class="annual-day-labels">';
    ['','Seg','','Qua','','Sex',''].forEach(l => {
      dayLabelsHtml += `<div class="annual-day-lbl">${l}</div>`;
    });
    dayLabelsHtml += '</div>';

    // Build month positions (first week index where month appears)
    const monthPositions = [];
    let lastMonth = -1;
    weeks.forEach((wk, wi) => {
      wk.forEach(d => {
        if (!d) return;
        if (d.getMonth() !== lastMonth) {
          monthPositions.push({ wi, month: d.getMonth() });
          lastMonth = d.getMonth();
        }
      });
    });

    // Month header — place labels above corresponding week columns
    // Each cell = 15px (12px + 3px gap)
    let monthHeaderHtml = '<div style="display:flex;margin-left:40px;margin-bottom:4px;position:relative;">';
    monthPositions.forEach(({ wi, month }) => {
      monthHeaderHtml += `<div class="annual-month-label" style="position:absolute;left:${wi * 15}px;white-space:nowrap">${MONTH_ABBR[month]}</div>`;
    });
    monthHeaderHtml += '</div>';

    // Grid cells
    let gridHtml = '<div class="annual-grid">';
    weeks.forEach(wk => {
      gridHtml += '<div class="annual-week-col">';
      wk.forEach(d => {
        if (!d) {
          gridHtml += '<div class="annual-cell" style="background:transparent;cursor:default;pointer-events:none"></div>';
          return;
        }
        const k = fmtKey(d);
        const val = data[k] || 0;
        let level = 0;
        if (val > 0) level = Math.min(4, Math.ceil(val / maxVal * 4));
        const isT = d.toDateString() === today.toDateString();
        gridHtml += `<div class="annual-cell" data-level="${level}" data-date="${k}" data-mins="${val}"
          title="${d.toLocaleDateString('pt-BR',{day:'numeric',month:'short',year:'numeric'})}: ${val}min"
          ${isT ? 'style="outline:2px solid var(--cyan);outline-offset:1px;"' : ''}></div>`;
      });
      gridHtml += '</div>';
    });
    gridHtml += '</div>';

    // Compute total width of the grid for the month header container
    const totalWeeks = weeks.length;
    const gridWidth = totalWeeks * 15; // 12px cell + 3px gap

    wrap.innerHTML =
      `<div style="position:relative;height:18px;margin-left:40px;width:${gridWidth}px;margin-bottom:2px">${monthPositions.map(({wi,month}) =>
        `<span class="annual-month-label" style="position:absolute;left:${wi*15}px">${MONTH_ABBR[month]}</span>`
      ).join('')}</div>` +
      `<div style="display:flex">${dayLabelsHtml}${gridHtml}</div>`;
  }



  function getUnlocked() { return JSON.parse(localStorage.getItem('fs_ach_unlocked') || '[]'); }
  function getCustomAch() { return JSON.parse(localStorage.getItem('fs_custom_ach') || '[]'); }
  function saveCustomAch(arr) { localStorage.setItem('fs_custom_ach', JSON.stringify(arr)); }

  function checkAchievements() {
    const unlocked = getUnlocked();
    const newUnlocks = [];
    SYSTEM_ACHIEVEMENTS.forEach(a => {
      if (!unlocked.includes(a.id) && a.check()) {
        unlocked.push(a.id);
        newUnlocks.push(a);
      }
    });
    if (newUnlocks.length) {
      localStorage.setItem('fs_ach_unlocked', JSON.stringify(unlocked));
      showAchievementToast(newUnlocks[0]);
    }
  }

  function showAchievementToast(ach) {
    const toast = document.getElementById('ach-toast');
    document.getElementById('ach-toast-icon').textContent = ach.icon;
    document.getElementById('ach-toast-name').textContent = ach.name;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5000);
  }

  function renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    const unlocked = getUnlocked();
    const customs = getCustomAch();

    const all = [
      ...SYSTEM_ACHIEVEMENTS.map(a => ({ ...a, custom: false, isUnlocked: unlocked.includes(a.id) })),
      ...customs.map(a => ({ ...a, custom: true, isUnlocked: a.isUnlocked || false }))
    ];

    const total = all.length;
    const done = all.filter(a => a.isUnlocked).length;
    document.getElementById('ach-count').textContent = `${done}/${total}`;

    grid.innerHTML = '';
    all.sort((a,b) => (b.isUnlocked - a.isUnlocked));

    all.forEach(a => {
      const item = document.createElement('div');
      item.className = `ach-item${a.custom ? ' custom' : ''}${a.isUnlocked ? ' unlocked' : ' locked'}`;
      item.innerHTML = `
        ${a.custom ? `<button class="ach-del-btn" data-id="${a.id}" title="Remover">✕</button>` : ''}
        <div class="ach-icon">${a.icon}</div>
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
        <span class="ach-status ${a.isUnlocked ? 'done' : 'pending'}">${a.isUnlocked ? '✓ Desbloqueada' : 'Pendente'}</span>
        ${a.custom && !a.isUnlocked ? `<button class="ach-unlock-btn" data-id="${a.id}" style="margin-top:4px;background:rgba(6,182,212,0.1);border:1px solid var(--cyan);color:var(--cyan);font-size:11px;font-weight:700;padding:4px 10px;border-radius:7px;cursor:pointer;transition:var(--transition)">Marcar como Feita</button>` : ''}
      `;
      grid.appendChild(item);
    });

    grid.querySelectorAll('.ach-del-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        let customs = getCustomAch();
        customs = customs.filter(a => a.id !== btn.dataset.id);
        saveCustomAch(customs);
        renderAchievements();
      });
    });

    grid.querySelectorAll('.ach-unlock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const customs = getCustomAch();
        const a = customs.find(x => x.id === btn.dataset.id);
        if (a) {
          a.isUnlocked = true;
          saveCustomAch(customs);
          showAchievementToast(a);
          renderAchievements();
        }
      });
    });
  }


  document.getElementById('ach-confirm').addEventListener('click', () => {
    const title = document.getElementById('ach-title').value.trim();
    const desc = document.getElementById('ach-desc').value.trim();
    const icon = document.getElementById('ach-icon').value.trim() || '⭐';
    if (!title) { document.getElementById('ach-title').focus(); return; }
    const customs = getCustomAch();
    customs.push({ id: 'custom_' + Date.now(), icon, name: title, desc, isUnlocked: false });
    saveCustomAch(customs);
    document.getElementById('modal-custom-ach').classList.remove('open');
    renderAchievements();
  });

  function renderAll() {
    updateSummary();
    updateWeekLabel();
    renderWeeklyHours();
    renderAnnual();
    renderAchievements();
    checkAchievements();
  }

  renderAll();
});
