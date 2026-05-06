// ══════════════════════════════════════
//  HORÁRIOS DA SEMANA — Focus Study
//  horarios.js  (corrigido)
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const CAT_LABELS = {
    study: '📚 Estudo',
    exercise: '🏋️ Exercício',
    meal: '🍽️ Refeição',
    work: '💼 Trabalho',
    personal: '🌟 Pessoal',
    rest: '😴 Descanso',
    other: '📌 Outro'
  };

  // ── Estado ──
  let weekOffset = 0;
  let activities = {};

  // ── Data atual ──
  const dateEl = document.getElementById('current-date');
  if (dateEl) {
    dateEl.innerText = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  // ── Avatar ──
  const profile = JSON.parse(localStorage.getItem('fs_profile') || '{}');
  if (profile.avatar) {
    const navAv = document.getElementById('nav-avatar');
    if (navAv) navAv.src = profile.avatar;
  }

  // ── Calcular semana ──
  function getWeekKey(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1 + offset * 7);
    const year = d.getFullYear();
    const week = getWeekNumber(d);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  function getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  }

  function getWeekDates(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1 + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(d);
      day.setDate(d.getDate() + i);
      return day;
    });
  }

  function formatDate(d) {
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  }

  function isToday(d) {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  }

  function dayKey(weekKey, dayIdx) {
    return `${weekKey}-D${dayIdx}`;
  }

  function getDayActivities(weekKey, dayIdx) {
    const dates = getWeekDates(weekOffset);
    const dateKey = dates[dayIdx].toISOString().split('T')[0];
    return activities[dateKey] || [];
  }

  // ── Render ──
  function render() {
    const wk = getWeekKey(weekOffset);
    const dates = getWeekDates(weekOffset);
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;

    const wlabel = document.getElementById('week-label');
    if (wlabel) {
      wlabel.textContent = `${formatDate(dates[0])} – ${formatDate(dates[6])}`;
    }

    grid.innerHTML = '';

    let totalActs = 0, doneActs = 0, totalMins = 0;

    dates.forEach((date, dayIdx) => {
      const acts = getDayActivities(wk, dayIdx);
      acts.sort((a, b) => a.start.localeCompare(b.start));

      const done = acts.filter(a => a.done).length;
      const pct = acts.length ? Math.round(done / acts.length * 100) : 0;

      totalActs += acts.length;
      doneActs += done;
      acts.forEach(a => {
        const [sh, sm] = a.start.split(':').map(Number);
        const [eh, em] = a.end.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff > 0) totalMins += diff;
      });

      const col = document.createElement('div');
      col.className = 'day-column';

      col.innerHTML = `
        <div class="day-header">
          <p class="day-name${isToday(date) ? ' today' : ''}">${DAYS[dayIdx]}</p>
          <span class="day-date-label">${formatDate(date)}</span>
          <p class="day-progress${acts.length ? ' has-tasks' : ''}">${acts.length ? pct + '%' : '--'}</p>
          <div class="day-progress-bar"><div class="day-progress-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="day-activities" id="day-acts-${dayIdx}"></div>
      `;
      grid.appendChild(col);

      const actsEl = col.querySelector(`#day-acts-${dayIdx}`);
      if (!acts.length) {
        actsEl.innerHTML = '<p style="font-size:11px;color:var(--text-muted);text-align:center;padding:16px 4px">Sem atividades</p>';
      }
      acts.forEach(act => {
        console.log("Renderizando tarefa:", act.title, "Tag:", act.tag);
        const item = document.createElement('div');
        item.className = `activity-item${act.done ? ' done' : ''}`;
        item.dataset.id = act.scheduling_id;
        if (act.notes) {
          item.setAttribute('title', `Observação: ${act.notes}`);
        }
        item.innerHTML = `
    <div class="act-time">${act.start} – ${act.end}</div>
    <div class="act-title">${act.title}</div>
    <div class="act-cat-badge">${CAT_LABELS[act.tag] || '📌' + (act.tag || 'Outro')}</div> 
    <div class="act-actions">
        <button class="act-btn check" title="Concluir">✓</button>
        <button class="act-btn del" title="Remover">✕</button>
    </div>
`;
        actsEl.appendChild(item);

        // Ação de CONCLUIR
        item.querySelector('.act-btn.check').addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            const response = await fetch('php/api_horarios.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'toggle_done', id: act.scheduling_id })
            });

            const result = await response.json();
            if (result.success) {
              // Recarrega os dados e a interface
              await carregarAtividadesDoBanco();
            } else {
              alert("Erro ao atualizar status: " + (result.error || 'Erro desconhecido'));
            }
          } catch (err) {
            console.error("Erro na requisição:", err);
          }
        });

        // Ação de DELETAR
        item.querySelector('.act-btn.del').addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirm("Deseja excluir esta atividade?")) return;

          try {
            const response = await fetch('php/api_horarios.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }, // ADICIONADO: Necessário para o PHP ler o JSON
              body: JSON.stringify({ action: 'delete', id: act.scheduling_id })
            });

            const result = await response.json();
            if (result.success) {
              await carregarAtividadesDoBanco();
            } else {
              alert("Erro ao deletar: " + (result.error || 'Erro desconhecido'));
            }
          } catch (err) {
            console.error("Erro na requisição de delete:", err);
          }
        });
        actsEl.appendChild(item);
      });
    });

    // Update summary
    const weekPct = totalActs ? Math.round(doneActs / totalActs * 100) : 0;
    document.getElementById('week-progress').textContent = weekPct + '%';
    document.getElementById('total-activities').textContent = totalActs;
    document.getElementById('done-activities').textContent = doneActs;
    const totalH = Math.floor(totalMins / 60);
    const totalM = totalMins % 60;
    document.getElementById('planned-hours').textContent = totalM ? `${totalH}h${totalM}m` : `${totalH}h`;
  }

  // ── Modal ──
  let selectedDay = 0;

  function openModal(dayIdx) {
    selectedDay = dayIdx;
    document.getElementById('act-day').value = dayIdx;
    document.getElementById('act-title').value = '';
    document.getElementById('act-notes').value = '';
    document.getElementById('act-start').value = '08:00';
    document.getElementById('act-end').value = '09:00';
    document.getElementById('modal-activity').classList.add('open');
    setTimeout(() => document.getElementById('act-title').focus(), 100);
  }

  // Main "Adicionar Atividade" button — day defaults to today's weekday (Mon=0)
  document.getElementById('btn-add-activity').addEventListener('click', () => {
    const todayDow = new Date().getDay(); // 0=Sun
    // Convert Sun=0..Sat=6 to Mon=0..Sun=6
    const mapped = todayDow === 0 ? 6 : todayDow - 1;
    openModal(mapped);
  });

  document.getElementById('modal-act-cancel').addEventListener('click', () => {
    document.getElementById('modal-activity').classList.remove('open');
  });
  document.getElementById('modal-activity').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-activity'))
      document.getElementById('modal-activity').classList.remove('open');
  });

  document.getElementById('modal-act-confirm').addEventListener('click', () => {
    const title = document.getElementById('act-title').value.trim();
    if (!title) { document.getElementById('act-title').focus(); return; }

    const dados = {
      action: 'create',
      title: title,
      day: document.getElementById('act-day').value,
      start: document.getElementById('act-start').value,
      end: document.getElementById('act-end').value,
      tag: document.getElementById('act-category').value,
      notes: document.getElementById('act-notes').value.trim(),
      date: getWeekDates(weekOffset)[document.getElementById('act-day').value].toISOString().split('T')[0]
    };

    salvarAtividadeNoBanco(dados);
    document.getElementById('modal-activity').classList.remove('open');
  });

  // ── Limpeza ──
  document.getElementById('btn-clear-week').addEventListener('click', () => {
    document.getElementById('modal-clear').classList.add('open');
  });
  document.getElementById('clear-cancel').addEventListener('click', () => {
    document.getElementById('modal-clear').classList.remove('open');
  });
  document.getElementById('clear-confirm').addEventListener('click', async () => {
    const dates = getWeekDates(weekOffset);
    const inicio = dates[0].toISOString().split('T')[0];
    const fim = dates[6].toISOString().split('T')[0];

    try {
      const response = await fetch('php/api_horarios.php', {
        method: 'POST',
        body: JSON.stringify({
          action: 'clear_week',
          inicio: inicio,
          fim: fim
        })
      });

      if (response.ok) {
        document.getElementById('modal-clear').classList.remove('open');
        carregarAtividadesDoBanco();
      } else {
        alert("Erro ao limpar a semana no servidor.");
      }
    } catch (err) {
      console.error("Erro na requisição de limpeza:", err);
      alert("Erro de conexão ao tentar limpar.");
    }
  });

  // ── Navegação de semana ──
  document.getElementById('prev-week').addEventListener('click', () => { weekOffset--; carregarAtividadesDoBanco(); });
  document.getElementById('next-week').addEventListener('click', () => { weekOffset++; carregarAtividadesDoBanco(); });

  async function carregarAtividadesDoBanco() {
    const wk = getWeekKey(weekOffset);
    const dates = getWeekDates(weekOffset);
    const dataInicio = dates[0].toISOString().split('T')[0]; // Segunda
    const dataFim = dates[6].toISOString().split('T')[0];    // Domingo

    try {
      const response = await fetch(`php/api_horarios.php?action=list&inicio=${dataInicio}&fim=${dataFim}`);
      const dados = await response.json();
      activities = dados;
      render();
    } catch (err) {
      console.error("Erro ao buscar horários:", err);
    }
  }

  async function salvarAtividadeNoBanco(dados) {
    try {
      const response = await fetch('php/api_horarios.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'create', ...dados })
      });
      if (response.ok) carregarAtividadesDoBanco();
    } catch (err) {
      alert("Erro ao salvar atividade.");
    }
  }
  carregarAtividadesDoBanco();
});
