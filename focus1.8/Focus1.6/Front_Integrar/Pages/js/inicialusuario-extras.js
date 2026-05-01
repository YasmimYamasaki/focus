// ══════════════════════════════════════
//  EXTRAS — inicialusuario
//  inicialusuario-extras.js
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Perfil e Avatar ──
  const profile = JSON.parse(localStorage.getItem('fs_profile') || '{}');
  if (profile.name) {
    const nameEl = document.getElementById('welcome-name');
    if (nameEl) nameEl.textContent = profile.name.split(' ')[0];
  }
  if (profile.avatar) {
    const navAv = document.getElementById('nav-avatar');
    if (navAv) navAv.src = profile.avatar;
  }

  // ── Elementos do Fullscreen Timer ──
  const fsEl       = document.getElementById('fullscreen-timer');
  const openBtn    = document.getElementById('fullscreen-btn');
  const closeBtn   = document.getElementById('fs-exit-btn');
  const fsMinEl    = document.getElementById('fs-min');
  const fsSecEl    = document.getElementById('fs-sec');
  const fsStatus   = document.getElementById('fs-status');
  const fsPlayBtn  = document.getElementById('fs-play');
  const fsResetBtn = document.getElementById('fs-reset');
  const fsDotsEl   = document.getElementById('fs-dots');
  const fsModes    = document.querySelectorAll('.fs-mode-btn');
  const minEl      = document.getElementById('minutes');
  const secEl      = document.getElementById('seconds');
  const statusEl   = document.querySelector('.js-timer-status');
  const mainPlayBtn = document.querySelector('.js-play');

  // ── Sincronização do Timer ──
  function syncFromMain() {
    if (!fsMinEl || !fsSecEl) return;
    fsMinEl.textContent = minEl?.innerText || '25';
    fsSecEl.textContent = secEl?.innerText || '00';
    if (fsStatus) fsStatus.textContent = statusEl?.innerText || '';
  }

  if (minEl && secEl) {
    const obs = new MutationObserver(syncFromMain);
    obs.observe(minEl, { childList: true, characterData: true, subtree: true });
    obs.observe(secEl, { childList: true, characterData: true, subtree: true });
  }

  if (statusEl) {
    new MutationObserver(() => {
      if (fsStatus) fsStatus.textContent = statusEl.textContent;
    }).observe(statusEl, { childList: true, characterData: true, subtree: true });
  }

  function syncDots() {
    if (!fsDotsEl) return;
    const mainDots = document.getElementById('pomo-dots');
    if (mainDots) {
      fsDotsEl.innerHTML = mainDots.innerHTML;
      fsDotsEl.querySelectorAll('.pomo-dot').forEach(d => d.classList.add('pomo-dot'));
    }
  }

  // ── Controles Fullscreen ──
  openBtn?.addEventListener('click', () => {
    fsEl.classList.add('active');
    syncFromMain();
    syncDots();
  });

  closeBtn?.addEventListener('click', () => fsEl.classList.remove('active'));

  fsModes?.forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = btn.dataset.minutes;
      const mainBtn = document.querySelector(`.mode-btn[data-minutes="${mins}"]`);
      if (mainBtn) mainBtn.click();
      fsModes.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      syncFromMain();
    });
  });

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = btn.dataset.minutes;
      fsModes.forEach(b => b.classList.toggle('active', b.dataset.minutes === mins));
    });
  });

  fsPlayBtn?.addEventListener('click', () => {
    document.querySelector('.js-play')?.click();
    syncFromMain();
    if (fsPlayBtn && mainPlayBtn) {
      const txt = mainPlayBtn.textContent.trim();
      fsPlayBtn.textContent = txt.includes('Pausar') ? '⏸ Pausar' : txt.includes('Retomar') ? '▶ Retomar' : '▶ Iniciar';
    }
  });

  fsResetBtn?.addEventListener('click', () => {
    document.querySelector('.js-reset')?.click();
    syncFromMain();
    if (fsPlayBtn) fsPlayBtn.textContent = '▶ Iniciar';
  });

  if (mainPlayBtn) {
    new MutationObserver(() => {
      if (!fsPlayBtn) return;
      const txt = mainPlayBtn.textContent.trim();
      if (txt.includes('Pausar')) fsPlayBtn.textContent = '⏸ Pausar';
      else if (txt.includes('Retomar')) fsPlayBtn.textContent = '▶ Retomar';
      else fsPlayBtn.textContent = '▶ Iniciar';
    }).observe(mainPlayBtn, { childList: true, subtree: true, characterData: true });
  }

  // ── Shuffle Music ──
  let shuffleOn = false;
  const shuffleBtn = document.getElementById('player-shuffle');
  const nextBtn = document.getElementById('player-next');
  const tracks = Array.from(document.querySelectorAll('.track-item'));

  shuffleBtn?.addEventListener('click', () => {
    shuffleOn = !shuffleOn;
    shuffleBtn.classList.toggle('player-btn-shuffle', shuffleOn);
    shuffleBtn.style.color = shuffleOn ? 'var(--cyan)' : '';
    shuffleBtn.style.background = shuffleOn ? 'rgba(6,182,212,0.1)' : '';
    shuffleBtn.style.borderRadius = shuffleOn ? '6px' : '';
    shuffleBtn.title = shuffleOn ? 'Aleatório: ON' : 'Aleatório: OFF';
  });

  if (nextBtn && tracks.length) {
    nextBtn.addEventListener('click', () => {
      if (!shuffleOn) return;
      const activeIdx = tracks.findIndex(t => t.classList.contains('active'));
      let next;
      do { next = Math.floor(Math.random() * tracks.length); } while (next === activeIdx && tracks.length > 1);
      tracks[next]?.click();
    }, true);
  }

  // ── Estudo e Estatísticas ──
  const settings = JSON.parse(localStorage.getItem('fs_settings') || '{}');
  const focusDur = settings.focusDuration || 25;
  let lastPomoCount = parseInt(localStorage.getItem('fs_pomo_count') || '0');

  setInterval(() => {
    const cur = parseInt(localStorage.getItem('fs_pomo_count') || '0');
    if (cur !== lastPomoCount) {
      const today = new Date();
      const key = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const data = JSON.parse(localStorage.getItem('fs_study_hours') || '{}');
      
      data[key] = (data[key] || 0) + focusDur;
      localStorage.setItem('fs_study_hours', JSON.stringify(data));

      const total = parseInt(localStorage.getItem('fs_pomo_total') || '0') + 1;
      localStorage.setItem('fs_pomo_total', total);

      lastPomoCount = cur;
    }
  }, 2000);

});