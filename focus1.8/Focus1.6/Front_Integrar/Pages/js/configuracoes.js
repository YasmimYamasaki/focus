// ══════════════════════════════════════
//  CONFIGURAÇÕES — Focus Study
//  configuracoes.js
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('current-date').innerText = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    // ── Variáveis de Estado e Padrões ──
    const defaults = {
        focusDuration: 25, shortBreak: 5, longBreak: 15, sessionsLong: 4,
        autoBreak: false, autoFocus: false,
        notifBrowser: true, notifSound: true, notifAchievements: true, reminderTime: '08:00',
        accentColor: 'cyan', compact: false, animations: true, blur: true,
        alertVol: 70, musicVol: 40, defaultSound: 'none'
    };

    let settings = { ...defaults, ...JSON.parse(localStorage.getItem('fs_settings') || '{}') };
    let dirty = false;

    // ── Lógica Visual Dinâmica ──
    function aplicarConfiguracoesVisuais(s) {
        if (!s) return;

        // A. Cores de Destaque
        const cores = {
            'cyan': '#06b6d4',
            'pink': '#ec4899',
            'violet': '#8b5cf6',
            'green': '#10b981',
            'orange': '#f59e0b'
        };
        const hex = cores[s.accentColor] || cores['cyan'];
        document.documentElement.style.setProperty('--cyan', hex); // Atualiza a variável principal
        document.documentElement.style.setProperty('--accent-glow', hex + '80');

        // B. Modo Compacto
        document.body.classList.toggle('compact-mode', s.compact);

        // C. Animações e Blur (Classes de controle)
        document.body.classList.toggle('no-animations', !s.animations);
        document.body.classList.toggle('no-blur', !s.blur);
    }

    // ── Load avatar (Sincronizado com Perfil) ──
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

    // ── Sincronizar UI com Estado ──
    function loadUI() {

        // Aparência
        document.getElementById('cfg-compact').checked = settings.compact;
        document.getElementById('cfg-animations').checked = settings.animations;
        document.getElementById('cfg-blur').checked = settings.blur;

        // Sons
        document.getElementById('cfg-alert-vol').value = settings.alertVol;
        document.getElementById('alert-vol-val').textContent = settings.alertVol + '%';
        document.getElementById('cfg-music-vol').value = settings.musicVol;
        document.getElementById('music-vol-val').textContent = settings.musicVol + '%';
        document.getElementById('cfg-default-sound').value = settings.defaultSound;

        // Swatches
        document.querySelectorAll('.swatch').forEach(s => {
            s.classList.toggle('active', s.dataset.color === settings.accentColor);
        });

        // Aplicar visual imediatamente ao carregar
        aplicarConfiguracoesVisuais(settings);
    }

    // ── Mark dirty & Preview ──
    function markDirty() {
        if (!dirty) {
            dirty = true;
            document.getElementById('save-bar').classList.add('visible');
        }
        // Ao marcar como dirty, já coletamos o estado para dar "preview" visual
        collectSettings();
        aplicarConfiguracoesVisuais(settings);
    }

    function collectSettings() {
        settings.compact = document.getElementById('cfg-compact')?.checked ?? settings.compact;
        settings.animations = document.getElementById('cfg-animations')?.checked ?? settings.animations;
        settings.blur = document.getElementById('cfg-blur')?.checked ?? settings.blur;

        // Sons
        const alertVolEl = document.getElementById('cfg-alert-vol');
        if (alertVolEl) settings.alertVol = parseInt(alertVolEl.value);

        const musicVolEl = document.getElementById('cfg-music-vol');
        if (musicVolEl) settings.musicVol = parseInt(musicVolEl.value);

        const soundEl = document.getElementById('cfg-default-sound');
        if (soundEl) settings.defaultSound = soundEl.value;
        
        const activeSwatch = document.querySelector('.swatch.active');
        if (activeSwatch) settings.accentColor = activeSwatch.dataset.color;
    }

    // Listeners para mudanças (Inputs e Selects)
    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', markDirty);
    });

    // Update real-time dos labels de volume
    document.getElementById('cfg-alert-vol').addEventListener('input', e => {
        document.getElementById('alert-vol-val').textContent = e.target.value + '%';
        markDirty();
    });
    document.getElementById('cfg-music-vol').addEventListener('input', e => {
        document.getElementById('music-vol-val').textContent = e.target.value + '%';
        markDirty();
    });

    // Color swatches logic
    document.querySelectorAll('.swatch').forEach(s => {
        s.addEventListener('click', () => {
            document.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
            s.classList.add('active');
            markDirty();
        });
    });

    // ── Salvar e Descartar ──
    document.getElementById('save-all-settings').addEventListener('click', () => {
        collectSettings();
        localStorage.setItem('fs_settings', JSON.stringify(settings));
        dirty = false;
        document.getElementById('save-bar').classList.remove('visible');
        showToast('Configurações salvas com sucesso!');
        
        // Notifica outras abas ou componentes que as configurações mudaram
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
    });

    document.getElementById('discard-changes').addEventListener('click', () => {
        settings = { ...defaults, ...JSON.parse(localStorage.getItem('fs_settings') || '{}') };
        loadUI();
        dirty = false;
        document.getElementById('save-bar').classList.remove('visible');
    });

    // ── Exportação e Gerenciamento de Dados ──
    document.getElementById('btn-export').addEventListener('click', () => {
        const data = {
            profile: JSON.parse(localStorage.getItem('fs_profile') || '{}'),
            habits: JSON.parse(localStorage.getItem('fs_habits') || '[]'),
            schedule: JSON.parse(localStorage.getItem('fs_schedule') || '{}'),
            tasks: JSON.parse(localStorage.getItem('fs_tasks') || '[]'),
            settings: settings,
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `focusstudy-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Backup gerado e baixado!');
    });

    document.getElementById('btn-clear-habits').addEventListener('click', () => {
        if (confirm('Atenção: Isso removerá permanentemente todos os seus hábitos. Continuar?')) {
            localStorage.removeItem('fs_habits');
            showToast('Dados de hábitos removidos.');
        }
    });

    document.getElementById('btn-clear-tasks').addEventListener('click', () => {
        if (confirm('Atenção: Isso removerá permanentemente todas as suas missões. Continuar?')) {
            localStorage.removeItem('fs_tasks');
            showToast('Dados de missões removidos.');
        }
    });

    // ── Reset Total ──
    document.getElementById('btn-reset-all').addEventListener('click', () => {
        document.getElementById('modal-reset').classList.add('open');
    });

    document.getElementById('reset-cancel').addEventListener('click', () => {
        document.getElementById('modal-reset').classList.remove('open');
    });

    document.getElementById('reset-confirm').addEventListener('click', () => {
        const keys = ['fs_habits', 'fs_schedule', 'fs_tasks', 'fs_notes', 'fs_settings', 'fs_pomo_count', 'fs_pomo_total', 'fs_streak', 'fs_profile'];
        keys.forEach(k => localStorage.removeItem(k));
        
        document.getElementById('modal-reset').classList.remove('open');
        showToast('Todos os dados foram resetados!');
        setTimeout(() => location.reload(), 1200);
    });

    function showToast(msg) {
        const t = document.getElementById('toast');
        if (t) {
            t.textContent = msg;
            t.className = 'toast success show';
            setTimeout(() => t.classList.remove('show'), 3000);
        }
    }

    // Inicialização
    loadUI();
});