document.addEventListener('DOMContentLoaded', async () => {
  let currentPeriod = 'monthly';
  let chart = null;
  let allDailyStats = [];

  const periods = {
    daily: { label: 'Hoje', days: 1 },
    weekly: { label: 'Esta semana', days: 7 },
    monthly: { label: 'Este mês', days: 30 },
    semester: { label: 'Este semestre', days: 180 },
    annual: { label: 'Este ano', days: 365 }
  };

  // ════════════════════════════════════════════════════════
  // Funções utilitárias
  // ════════════════════════════════════════════════════════

  function formatDate(date) {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ════════════════════════════════════════════════════════
  // Inicialização da data
  // ════════════════════════════════════════════════════════

  function updateCurrentDate() {
    const el = document.getElementById('current-date');
    if (el) el.textContent = formatDate(new Date());
  }
  updateCurrentDate();

  // ════════════════════════════════════════════════════════
  // Carregar dados do backend
  // ════════════════════════════════════════════════════════

  async function loadData(period = 'monthly') {
    try {
      console.log('📊 Carregando dados do período:', period);
      const res = await fetch(`php/api_estatisticas.php?action=stats&period=${period}`);
      const data = await res.json();

      if (!data.success) {
        console.error('❌ Erro:', data.error);
        return null;
      }

      console.log('✅ Dados carregados:', data);
      allDailyStats = data.daily_stats || [];
      return data;
    } catch (e) {
      console.error('❌ Erro ao carregar dados:', e);
      return null;
    }
  }

  // ════════════════════════════════════════════════════════
  // Atualizar cards de resumo
  // ════════════════════════════════════════════════════════

  function updateStats(data) {
    if (!data) return;

    const summary = data.summary || {};
    const dailyStats = data.daily_stats || [];

    let maxDay = 0;
    let bestDayName = '--';
    let streak = 0;

    // Encontrar melhor dia
    dailyStats.forEach(day => {
      if (day.completas > maxDay) {
        maxDay = day.completas;
        bestDayName = new Date(day.data).toLocaleDateString('pt-BR', { weekday: 'short' });
      }
    });

    // Calcular sequência
    const sorted = [...dailyStats].reverse();
    for (const day of sorted) {
      if (day.completas > 0) {
        streak++;
      } else {
        break;
      }
    }

    document.getElementById('stat-completed').textContent = summary.total_completas || 0;
    document.getElementById('stat-rate').textContent = (summary.completion_rate || 0) + '%';
    document.getElementById('stat-best-day').textContent = bestDayName;
    document.getElementById('stat-streak').textContent = streak;
  }

  // ════════════════════════════════════════════════════════
  // Renderizar gráfico com Chart.js
  // ════════════════════════════════════════════════════════

  function renderChart() {
    if (!allDailyStats || allDailyStats.length === 0) return;

    const ctx = document.getElementById('main-chart');
    if (!ctx) return;

    const labels = allDailyStats.map(day => {
      const d = new Date(day.data);
      if (currentPeriod === 'daily') return 'Hoje';
      if (currentPeriod === 'weekly') return d.toLocaleDateString('pt-BR', { weekday: 'short' });
      if (currentPeriod === 'monthly') return d.getDate();
      if (currentPeriod === 'semester' || currentPeriod === 'annual') {
        return d.toLocaleDateString('pt-BR', { month: 'short' });
      }
      return day.data;
    });

    const doneCounts = allDailyStats.map(day => day.completas);
    const totalCounts = allDailyStats.map(day => day.total_tarefas);

    // Atualizar label do período
    if (allDailyStats.length > 0) {
      const startDate = new Date(allDailyStats[0].data);
      const endDate = new Date(allDailyStats[allDailyStats.length - 1].data);
      const label = document.getElementById('chart-label');
      label.textContent = `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} → ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
    }

    // Destruir gráfico anterior
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Missões cumpridas',
            data: doneCounts,
            backgroundColor: 'rgba(6,182,212,0.8)',
            borderColor: 'rgb(6,182,212)',
            borderWidth: 2,
            borderRadius: 8,
            barPercentage: 0.7
          },
          {
            label: 'Total de missões',
            data: totalCounts,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderColor: 'rgba(255,255,255,0.2)',
            borderWidth: 1,
            borderRadius: 8,
            barPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: 'rgba(255,255,255,0.7)',
              font: { size: 12, weight: '600' },
              padding: 16
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: 'rgba(255,255,255,0.5)' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          x: {
            ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 12 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // ════════════════════════════════════════════════════════
  // Renderizar heatmap anual
  // ════════════════════════════════════════════════════════

  async function renderAnnualHeatmap() {
    const data = await loadData('annual');
    if (!data) return;

    const container = document.getElementById('annual-heatmap');
    if (!container) return;

    container.innerHTML = '';

    const today = new Date();
    const yearAgo = new Date(today.getFullYear(), 0, 1);

    let maxActivity = 0;
    const activity = {};

    // Mapear dados
    (data.daily_stats || []).forEach(day => {
      activity[day.data] = day.completas;
      if (day.completas > maxActivity) maxActivity = day.completas;
    });

    // Criar grid de semanas
    let currentDate = new Date(yearAgo);
    const weeks = [];

    while (currentDate <= today) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        if (currentDate <= today) {
          week.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      if (week.length > 0) weeks.push(week);
    }

    // Renderizar células
    weeks.forEach(week => {
      const weekCol = document.createElement('div');
      weekCol.style.display = 'flex';
      weekCol.style.flexDirection = 'column';
      weekCol.style.gap = '3px';

      week.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const count = activity[dateStr] || 0;
        const level = count === 0 ? 0 : Math.max(1, Math.ceil((count / maxActivity) * 4));

        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.dataset.level = level;
        cell.title = `${dateStr}: ${count} tarefas completas`;
        weekCol.appendChild(cell);
      });

      container.appendChild(weekCol);
    });
  }

  // ════════════════════════════════════════════════════════
  // Event Listeners
  // ════════════════════════════════════════════════════════

  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentPeriod = e.target.dataset.period;

      const data = await loadData(currentPeriod);
      if (data) {
        updateStats(data);
        renderChart();
      }
    });
  });

  // ════════════════════════════════════════════════════════
  // Inicialização
  // ════════════════════════════════════════════════════════

  const initialData = await loadData(currentPeriod);
  if (initialData) {
    updateStats(initialData);
    renderChart();
  }
  await renderAnnualHeatmap();
});
