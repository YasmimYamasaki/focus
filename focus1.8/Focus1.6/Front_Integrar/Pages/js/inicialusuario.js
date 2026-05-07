document.addEventListener('DOMContentLoaded', () => { //a corrigir junto com o php de tarefas
    // ============================================================
    // 1. GERENCIAMENTO DE ESTADO E SESSÃO 
    // ============================================================
    async function carregarDadosIniciais() {
        try {
            const response = await fetch('php/inicialusuario.php');
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                if (data.logado) {
                    document.getElementById('welcome-name').textContent = data.nome;
                    if (data.foto) document.getElementById('nav-avatar').src = data.foto;
                    carregarMissoes();
                } else {
                    window.location.href = 'login.html';
                }
            } catch (e) { console.error("Erro no JSON do PHP:", text); }
        } catch (e) { console.error("Falha no Fetch perfil:", e); }
    }

    // ══════════════════════════════════════════
    //  PLAYER DE MÚSICA
    // ══════════════════════════════════════════
    const trackItems = document.querySelectorAll('.track-item');
    const playerPlay = document.getElementById('player-play');
    const playerPrev = document.getElementById('player-prev');
    const playerNext = document.getElementById('player-next');
    const playerLoop = document.getElementById('player-loop');
    const playerSeek = document.getElementById('player-seek');
    const playerCurrent = document.getElementById('player-current');
    const playerDur = document.getElementById('player-duration');
    const playerName = document.getElementById('player-track-name');
    const playerGenre = document.getElementById('player-track-genre');
    const playerIcon = document.getElementById('player-track-icon');
    const playerBadge = document.getElementById('player-badge');
    const volumeSlider = document.getElementById('ambient-volume');

    let audio = new Audio();
    let currentIndex = -1;
    let isLooping = false;
    let seekDragging = false;
    const tracks = Array.from(trackItems);

    audio.volume = parseFloat(volumeSlider?.value || 0.5);
    audio.loop = false;

    function fmtTime(s) {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    function setPlayingUI(playing) {
        const iconPlay = playerPlay?.querySelector('.icon-play');
        const iconPause = playerPlay?.querySelector('.icon-pause');
        if (iconPlay) iconPlay.style.display = playing ? 'none' : 'inline';
        if (iconPause) iconPause.style.display = playing ? 'inline' : 'none';
        if (playerBadge) playerBadge.style.display = playing ? 'inline-flex' : 'none';
    }

    function loadTrack(index, autoplay = true) {
        if (index < 0 || index >= tracks.length) return;
        currentIndex = index;

        // Atualiza UI das faixas
        tracks.forEach((t, i) => t.classList.toggle('active', i === index));

        const item = tracks[index];
        const src = item.dataset.src;
        const name = item.dataset.track;
        const icon = item.querySelector('.track-icon')?.textContent || '🎵';
        const genre = item.querySelector('.track-genre')?.textContent || '';

        audio.pause();
        audio.src = src;
        audio.load();

        if (playerName) playerName.textContent = name;
        if (playerGenre) playerGenre.textContent = genre;
        if (playerIcon) playerIcon.textContent = icon;
        if (playerSeek) playerSeek.value = 0;
        if (playerCurrent) playerCurrent.textContent = '0:00';
        if (playerDur) playerDur.textContent = '0:00';

        if (autoplay) {
            audio.play().catch(() => { });
            setPlayingUI(true);
        } else {
            setPlayingUI(false);
        }
    }

    // Click na faixa
    tracks.forEach((item, i) => {
        item.addEventListener('click', () => {
            if (currentIndex === i && !audio.paused) {
                audio.pause();
                setPlayingUI(false);
            } else if (currentIndex === i && audio.paused) {
                audio.play().catch(() => { });
                setPlayingUI(true);
            } else {
                loadTrack(i, true);
            }
        });
    });

    // Play/Pause
    playerPlay?.addEventListener('click', () => {
        if (currentIndex === -1) { loadTrack(0, true); return; }
        if (audio.paused) {
            audio.play().catch(() => { });
            setPlayingUI(true);
        } else {
            audio.pause();
            setPlayingUI(false);
        }
    });

    // Anterior
    playerPrev?.addEventListener('click', () => {
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
        } else {
            const prev = (currentIndex - 1 + tracks.length) % tracks.length;
            loadTrack(prev, !audio.paused);
        }
    });

    // Próxima
    playerNext?.addEventListener('click', () => {
        const next = (currentIndex + 1) % tracks.length;
        loadTrack(next, !audio.paused);
    });

    // Loop
    playerLoop?.addEventListener('click', () => {
        isLooping = !isLooping;
        audio.loop = isLooping;
        playerLoop?.classList.toggle('active', isLooping);
    });

    // Ao terminar a faixa
    audio.addEventListener('ended', () => {
        if (!isLooping) {
            const next = (currentIndex + 1) % tracks.length;
            loadTrack(next, true);
        }
    });

    // Progress bar
    audio.addEventListener('timeupdate', () => {
        if (seekDragging || !audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        if (playerSeek) playerSeek.value = pct;
        if (playerCurrent) playerCurrent.textContent = fmtTime(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
        if (playerDur) playerDur.textContent = fmtTime(audio.duration);
    });

    // Seek drag
    playerSeek?.addEventListener('mousedown', () => { seekDragging = true; });
    playerSeek?.addEventListener('touchstart', () => { seekDragging = true; });
    playerSeek?.addEventListener('input', () => {
        if (!audio.duration) return;
        const t = (parseFloat(playerSeek.value) / 100) * audio.duration;
        if (playerCurrent) playerCurrent.textContent = fmtTime(t);
    });
    playerSeek?.addEventListener('change', () => {
        seekDragging = false;
        if (!audio.duration) return;
        audio.currentTime = (parseFloat(playerSeek.value) / 100) * audio.duration;
    });

    // Volume
    volumeSlider?.addEventListener('input', () => {
        audio.volume = parseFloat(volumeSlider.value);
    });

    // ══════════════════════════════════════════
    //  TIMER POMODORO
    // ══════════════════════════════════════════
    let timer, timeLeft = 25 * 60, running = false;
    let pomodoroCount = parseInt(localStorage.getItem('fs_pomo_count') || '0');
    let currentLabel = 'Foco';

    const minEl = document.getElementById('minutes');
    const secEl = document.getElementById('seconds');
    const playBtn = document.querySelector('.js-play');
    const resetBtn = document.querySelector('.js-reset');
    const statusEl = document.querySelector('.js-timer-status');
    const dotsEl = document.getElementById('pomo-dots');

    function updateTimerDisplay() {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        minEl.innerText = m.toString().padStart(2, '0');
        secEl.innerText = s.toString().padStart(2, '0');
        document.title = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} — Focus Study`;
    }

    function renderDots() {
        if (!dotsEl) return;
        dotsEl.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const d = document.createElement('span');
            d.className = 'pomo-dot' + (i < pomodoroCount ? ' done' : '');
            dotsEl.appendChild(d);
        }
    }

    function finishSession() {
        clearInterval(timer);
        running = false;
        playBtn.innerHTML = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Iniciar`;
        statusEl.innerText = '✅ Sessão concluída!';

        if (currentLabel === 'Foco') {
            pomodoroCount = Math.min(pomodoroCount + 1, 4);
            if (pomodoroCount >= 4) pomodoroCount = 0;
            localStorage.setItem('fs_pomo_count', pomodoroCount);
            renderDots();
        }

        // Notificação do browser
        if (Notification.permission === 'granted') {
            new Notification('Focus Study ⏱️', {
                body: `Sessão de ${currentLabel} concluída! Hora de ${currentLabel === 'Foco' ? 'descansar' : 'focar'}.`,
                icon: '/Pages/images/poppy.png'
            });
        }
    }

    playBtn?.addEventListener('click', () => {
        if (running) {
            clearInterval(timer);
            playBtn.innerHTML = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Retomar`;
            statusEl.innerText = '⏸ Pausado';
        } else {
            if (Notification.permission === 'default') Notification.requestPermission();
            statusEl.innerText = currentLabel === 'Foco' ? '🎯 Foco total!' : '☕ Descansando...';
            playBtn.innerHTML = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausar`;
            timer = setInterval(() => {
                if (timeLeft <= 0) { finishSession(); }
                else { timeLeft--; updateTimerDisplay(); }
            }, 1000);
        }
        running = !running;
    });

    resetBtn?.addEventListener('click', () => {
        clearInterval(timer);
        running = false;
        const activeMode = document.querySelector('.mode-btn.active');
        timeLeft = (parseInt(activeMode?.dataset.minutes) || 25) * 60;
        updateTimerDisplay();
        playBtn.innerHTML = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Iniciar`;
        statusEl.innerText = 'Pronto para começar';
        document.title = 'Focus Study';
    });

    // Botões de modo
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            clearInterval(timer);
            running = false;
            currentLabel = btn.dataset.label;
            timeLeft = parseInt(btn.dataset.minutes) * 60;
            updateTimerDisplay();
            playBtn.innerHTML = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Iniciar`;
            statusEl.innerText = 'Pronto para começar';
        });
    });

    renderDots();
    updateTimerDisplay();

    // ══════════════════════════════════════════
    //  MISSÕES
    // ══════════════════════════════════════════
    const taskList = document.querySelector('.js-task-list');
    const addTaskBtn = document.querySelector('.js-add-task');
    const tasksEmpty = document.getElementById('tasks-empty');
    const tasksDone = document.getElementById('tasks-done-count');
    const tasksFill = document.getElementById('tasks-progress-fill');

    let pendingDeleteItem = null;
    let tasksGlobal = [];

    // CARREGAR DADOS DO BANCO
    async function carregarMissoes() {
        try {
            const res = await fetch('php/tarefas.php');
            const tarefas = await res.json();
            tasksGlobal = tarefas;
            renderTasks(tarefas);
        } catch (e) { console.error("Erro ao carregar tarefas"); }
    }

    // RENDERIZAR TAREFAS
    function renderTasks(tarefas) {
        taskList.innerHTML = '';
        const total = tarefas.length;

        if (total === 0) {
            if (tasksEmpty) tasksEmpty.style.display = 'flex';
        } else {
            if (tasksEmpty) tasksEmpty.style.display = 'none';
        }

        tarefas.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            const isChecked = task.done == 1;

            li.innerHTML = `
            <label class="custom-checkbox">
                <input type="checkbox" ${isChecked ? 'checked' : ''}>
                <span class="checkmark"></span>
                <span class="task-text" style="${isChecked ? 'text-decoration:line-through;opacity:0.6' : ''}">${task.title}</span>
            </label>
            <button class="btn-delete-task" title="Remover missão">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
            </button>
        `;

            // EVENTO: TOGGLE 
            li.querySelector('input').addEventListener('change', async (e) => {
                const checked = e.target.checked;

                // Atualização visual instantânea
                const txt = li.querySelector('.task-text');
                txt.style.textDecoration = checked ? 'line-through' : 'none';
                txt.style.opacity = checked ? '0.6' : '1';
                const fd = new FormData();
                fd.append('acao', 'toggle');
                fd.append('task_id', task.task_id);

                try {
                    const res = await fetch('php/tarefas.php', { method: 'POST', body: fd });
                    const dados = await res.json();
                    if (dados.sucesso) {
                        task.done = checked ? 1 : 0;
                        updateTasksFooter();
                    }
                } catch (err) {
                    e.target.checked = !checked;
                    console.error("Erro ao atualizar status");
                }
            });

            // EVENTO: ABRIR MODAL EXCLUIR
            li.querySelector('.btn-delete-task').addEventListener('click', () => {
                pendingDeleteItem = task.task_id;
                const delName = document.getElementById('delete-task-name');
                if (delName) delName.textContent = `"${task.title}"`;
                document.getElementById('modal-delete-task')?.classList.add('open');
            });

            taskList.appendChild(li);
        });

        updateTasksFooter();
    }

    // ATUALIZAR RODAPÉ
    function updateTasksFooter() {
        const total = tasksGlobal.length;
        const done = tasksGlobal.filter(t => t.done == 1).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        if (tasksDone) {
            tasksDone.textContent = `${done} de ${total} concluída${total !== 1 ? 's' : ''}`;
        }
        if (tasksFill) {
            tasksFill.style.width = `${pct}%`;
        }
    }

    // CONFIRMAR EXCLUSÃO
    document.getElementById('confirm-delete-task')?.addEventListener('click', async () => {
        if (!pendingDeleteItem) return;

        const fd = new FormData();
        fd.append('acao', 'deletar');
        fd.append('task_id', pendingDeleteItem);

        try {
            const res = await fetch('php/tarefas.php', { method: 'POST', body: fd });
            const dados = await res.json();
            if (dados.sucesso) {
                document.getElementById('modal-delete-task').classList.remove('open');
                carregarMissoes();
            }
        } catch (e) { console.error("Erro ao deletar"); }
    });

    // 5. ADICIONAR TAREFA
    let isAddingTask = false;
    const btnConfirm = document.getElementById('confirm-add-task');
    const inputTask = document.getElementById('task-input');

    if (btnConfirm) {
        btnConfirm.onclick = async (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();

            if (isAddingTask) return;

            const titulo = inputTask.value.trim();
            if (!titulo) {
                inputTask.focus();
                return;
            }

            isAddingTask = true;
            btnConfirm.disabled = true;

            const fd = new FormData();
            fd.append('acao', 'inserir');
            fd.append('titulo', titulo);

            try {
                const res = await fetch('php/tarefas.php', { method: 'POST', body: fd });
                const dados = await res.json();

                if (dados.sucesso) {
                    inputTask.value = '';
                    document.getElementById('modal-add-task')?.classList.remove('open');
                    taskList.innerHTML = '';
                    await carregarMissoes();
                }
            } catch (err) {
                console.error("Erro ao inserir:", err);
            } finally {
                isAddingTask = false;
                btnConfirm.disabled = false;
            }
        };
    }

    // 6. TRATAMENTO DO ENTER
    inputTask?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnConfirm?.click();
        }
    });

    // Inicialização
    carregarMissoes();

    // ============================================================
    // NOTAS RÁPIDAS
    // ============================================================
    const noteArea = document.getElementById('quick-note');
    const charCount = document.getElementById('note-chars');
    const noteSaved = document.getElementById('note-saved');

    if (noteArea) {
        noteArea.value = localStorage.getItem('fs_current_note') || '';
        charCount.innerText = `${noteArea.value.length}/1000`;

        noteArea.addEventListener('input', () => {
            localStorage.setItem('fs_current_note', noteArea.value);
            charCount.innerText = `${noteArea.value.length}/1000`;
            noteSaved.style.opacity = '1';
            setTimeout(() => noteSaved.style.opacity = '0', 2000);
        });
    }

    document.getElementById('btn-save-note')?.addEventListener('click', () => {
        const text = noteArea.value.trim();
        if (!text) return;
        const history = JSON.parse(localStorage.getItem('fs_note_history') || '[]');
        history.unshift({ text, date: new Date().toLocaleString('pt-BR') });
        localStorage.setItem('fs_note_history', JSON.stringify(history.slice(0, 10)));
        noteArea.value = '';
        localStorage.setItem('fs_current_note', '');
        charCount.innerText = `0/1000`;
        renderHistory();
    });
    document.getElementById('btn-clear-note')?.addEventListener('click', () => {
        if (confirm("Deseja apagar o rascunho da nota?")) {
            noteArea.value = '';
            localStorage.setItem('fs_current_note', '');
            charCount.innerText = `0/1000`;
        }
    });

    function renderHistory() {
        const historyList = document.getElementById('note-history-list');
        const emptyMsg = document.getElementById('note-history-empty');
        const history = JSON.parse(localStorage.getItem('fs_note_history') || '[]');
        if (!historyList) return;
        historyList.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = history.length === 0 ? 'flex' : 'none';
        document.getElementById('note-history-count').innerText = `${history.length} notas`;
        history.forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `<small>${item.date}</small><p>${item.text}</p>`;
            historyList.appendChild(li);
        });
    }

    // ============================================================
    // INICIALIZAÇÃO E MODAIS
    // ============================================================
    const modalAdd = document.getElementById('modal-add-task');
    const modalDelete = document.getElementById('modal-delete-task');
    const inputAdd = document.getElementById('task-input');
    document.querySelector('.js-add-task')?.addEventListener('click', () => {
        modalAdd.classList.add('open');
        inputAdd.focus();
    });
    document.getElementById('cancel-add-task')?.addEventListener('click', () => modalAdd.classList.remove('open'));
    document.getElementById('cancel-delete-task')?.addEventListener('click', () => modalDelete.classList.remove('open'));
    document.getElementById('confirm-add-task')?.addEventListener('click', async () => {
        const titulo = inputAdd.value.trim();
        if (!titulo) return;
        const fd = new FormData();
        fd.append('acao', 'inserir');
        fd.append('titulo', titulo);
        await fetch('php/tarefas.php', { method: 'POST', body: fd });
        inputAdd.value = '';
        modalAdd.classList.remove('open');
        carregarMissoes();
    });
    let idParaExcluir = null;
    window.abrirModalExcluir = (id, titulo) => {
        idParaExcluir = id;
        document.getElementById('delete-task-name').textContent = `"${titulo}"`;
        modalDelete.classList.add('open');
    };

    document.getElementById('confirm-delete-task')?.addEventListener('click', async () => {
        if (!idParaExcluir) return;
        const fd = new FormData();
        fd.append('acao', 'deletar');
        fd.append('task_id', idParaExcluir);
        await fetch('php/tarefas.php', { method: 'POST', body: fd });
        modalDelete.classList.remove('open');
        carregarMissoes();
    });
    document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
        document.getElementById('fullscreen-timer').classList.add('open');
    });
    document.getElementById('fs-exit-btn')?.addEventListener('click', () => {
        document.getElementById('fullscreen-timer').classList.remove('open');
    });
    const QUOTES = ["O foco de hoje é o sucesso de amanhã.", "A disciplina é a mãe do êxito.", "Comece onde você está."];
    document.querySelector('.quote-text').textContent = QUOTES[new Date().getDate() % QUOTES.length];
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    function atualizarProgresso(tarefas) {
        const listaTarefas = tarefas || [];

        const total = listaTarefas.length;
        const done = listaTarefas.filter(t => t.done == 1).length;
        const pct = total > 0 ? (done / total) * 100 : 0;

        const countEl = document.getElementById('tasks-done-count');
        const fillEl = document.getElementById('tasks-progress-fill');

        if (countEl) {
            countEl.textContent = `${done} de ${total} concluídas`;
        }

        if (fillEl) {
            fillEl.style.width = `${pct}%`;
        }
    }

    carregarDadosIniciais();
    renderHistory();
    renderDots();
    updateTimerDisplay();
    atualizarProgresso();
});