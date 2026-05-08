// ══════════════════════════════════════
//  CONFIGURAÇÕES — Focus Study
//  configuracoes.js
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('current-date').innerText = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });

  // ── Load avatar ──
  const profile = JSON.parse(localStorage.getItem('fs_profile') || '{}');
  if (profile.avatar) {
    const navAv = document.getElementById('nav-avatar');
    if (navAv) navAv.src = profile.avatar;
  }

  // ── Tab switching ──
  document.querySelectorAll('.cfg-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cfg-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.cfg-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // ── Load settings ──
  const defaults = {
    focusDuration: 25, shortBreak: 5, longBreak: 15, sessionsLong: 4,
    autoBreak: false, autoFocus: false,
    notifBrowser: true, notifSound: true, notifAchievements: true, reminderTime: '08:00',
    accentColor: 'cyan', compact: false, animations: true, blur: true,
    alertVol: 70, musicVol: 40, defaultSound: 'none'
  };

  let settings = { ...defaults, ...JSON.parse(localStorage.getItem('fs_settings') || '{}') };
  let dirty = false;

  function loadUI() {
    document.getElementById('cfg-focus').value = settings.focusDuration;
    document.getElementById('cfg-short-break').value = settings.shortBreak;
    document.getElementById('cfg-long-break').value = settings.longBreak;
    document.getElementById('cfg-sessions-long').value = settings.sessionsLong;
    document.getElementById('cfg-auto-break').checked = settings.autoBreak;
    document.getElementById('cfg-auto-focus').checked = settings.autoFocus;

    document.getElementById('cfg-notif-browser').checked = settings.notifBrowser;
    document.getElementById('cfg-notif-sound').checked = settings.notifSound;
    document.getElementById('cfg-notif-achievements').checked = settings.notifAchievements;
    document.getElementById('cfg-reminder-time').value = settings.reminderTime;

    document.getElementById('cfg-compact').checked = settings.compact;
    document.getElementById('cfg-animations').checked = settings.animations;
    document.getElementById('cfg-blur').checked = settings.blur;

    document.getElementById('cfg-alert-vol').value = settings.alertVol;
    document.getElementById('alert-vol-val').textContent = settings.alertVol + '%';
    document.getElementById('cfg-music-vol').value = settings.musicVol;
    document.getElementById('music-vol-val').textContent = settings.musicVol + '%';
    document.getElementById('cfg-default-sound').value = settings.defaultSound;

    document.querySelectorAll('.swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color === settings.accentColor);
    });
  }

  loadUI();

  // ── Mark dirty ──
  function markDirty() {
    if (!dirty) {
      dirty = true;
      document.getElementById('save-bar').classList.add('visible');
    }
  }

  document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', markDirty);
  });

  // ── Range live update ──
  document.getElementById('cfg-alert-vol').addEventListener('input', e => {
    document.getElementById('alert-vol-val').textContent = e.target.value + '%';
  });
  document.getElementById('cfg-music-vol').addEventListener('input', e => {
    document.getElementById('music-vol-val').textContent = e.target.value + '%';
  });

  // ── Color swatches ──
  document.querySelectorAll('.swatch').forEach(s => {
    s.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
      s.classList.add('active');
      markDirty();
    });
  });

  // ── Save ──
  function collectSettings() {
    settings.focusDuration = parseInt(document.getElementById('cfg-focus').value);
    settings.shortBreak = parseInt(document.getElementById('cfg-short-break').value);
    settings.longBreak = parseInt(document.getElementById('cfg-long-break').value);
    settings.sessionsLong = parseInt(document.getElementById('cfg-sessions-long').value);
    settings.autoBreak = document.getElementById('cfg-auto-break').checked;
    settings.autoFocus = document.getElementById('cfg-auto-focus').checked;
    settings.notifBrowser = document.getElementById('cfg-notif-browser').checked;
    settings.notifSound = document.getElementById('cfg-notif-sound').checked;
    settings.notifAchievements = document.getElementById('cfg-notif-achievements').checked;
    settings.reminderTime = document.getElementById('cfg-reminder-time').value;
    settings.compact = document.getElementById('cfg-compact').checked;
    settings.animations = document.getElementById('cfg-animations').checked;
    settings.blur = document.getElementById('cfg-blur').checked;
    settings.alertVol = parseInt(document.getElementById('cfg-alert-vol').value);
    settings.musicVol = parseInt(document.getElementById('cfg-music-vol').value);
    settings.defaultSound = document.getElementById('cfg-default-sound').value;
    const activeSwatch = document.querySelector('.swatch.active');
    if (activeSwatch) settings.accentColor = activeSwatch.dataset.color;
  }

  document.getElementById('save-all-settings').addEventListener('click', () => {
    collectSettings();
    localStorage.setItem('fs_settings', JSON.stringify(settings));
    dirty = false;
    document.getElementById('save-bar').classList.remove('visible');
    showToast('Configurações salvas!');
  });

  document.getElementById('discard-changes').addEventListener('click', () => {
    settings = { ...defaults, ...JSON.parse(localStorage.getItem('fs_settings') || '{}') };
    loadUI();
    dirty = false;
    document.getElementById('save-bar').classList.remove('visible');
  });

  // ── Data actions ──
  document.getElementById('btn-export').addEventListener('click', () => {
    const data = {
      profile: JSON.parse(localStorage.getItem('fs_profile') || '{}'),
      habits: JSON.parse(localStorage.getItem('fs_habits') || '[]'),
      schedule: JSON.parse(localStorage.getItem('fs_schedule') || '{}'),
      tasks: JSON.parse(localStorage.getItem('fs_tasks') || '[]'),
      settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `focusstudy-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    showToast('Dados exportados!');
  });

  document.getElementById('btn-clear-habits').addEventListener('click', () => {
    if (confirm('Remover todos os hábitos?')) {
      localStorage.removeItem('fs_habits');
      showToast('Hábitos removidos!');
    }
  });

  document.getElementById('btn-clear-tasks').addEventListener('click', () => {
    if (confirm('Remover todas as missões?')) {
      localStorage.removeItem('fs_tasks');
      showToast('Missões removidas!');
    }
  });

  document.getElementById('btn-reset-all').addEventListener('click', () => {
    document.getElementById('modal-reset').classList.add('open');
  });
  document.getElementById('reset-cancel').addEventListener('click', () => document.getElementById('modal-reset').classList.remove('open'));
  document.getElementById('reset-confirm').addEventListener('click', () => {
    ['fs_habits','fs_schedule','fs_tasks','fs_notes','fs_settings','fs_pomo_count','fs_pomo_total','fs_streak'].forEach(k => localStorage.removeItem(k));
    document.getElementById('modal-reset').classList.remove('open');
    showToast('Dados resetados!');
    setTimeout(() => location.reload(), 1000);
  });

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast success show';
    setTimeout(() => t.classList.remove('show'), 3000);
  }
});