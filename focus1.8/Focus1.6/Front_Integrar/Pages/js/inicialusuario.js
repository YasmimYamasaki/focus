document.addEventListener('DOMContentLoaded', () => {
    // DATA 
    const dateEl = document.getElementById('current-date');
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    dateEl.innerText = new Date().toLocaleDateString('pt-BR', options);

    // TIMER
    let timer;
    let timeLeft = 25 * 60;
    let running = false;
    const minEl = document.getElementById('minutes');
    const secEl = document.getElementById('seconds');
    const playBtn = document.querySelector('.js-play');
    const statusText = document.querySelector('.js-timer-status');

    function updateTimer() {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        minEl.innerText = m.toString().padStart(2, '0');
        secEl.innerText = s.toString().padStart(2, '0');
    }

    playBtn.addEventListener('click', () => {
        if (running) {
            clearInterval(timer);
            playBtn.innerText = 'Retomar';
            statusText.innerText = 'Pausado';
        } else {
            statusText.innerText = 'Foco total!';
            playBtn.innerText = 'Pausar';
            timer = setInterval(() => {
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    alert("Tempo esgotado!");
                } else {
                    timeLeft--;
                    updateTimer();
                }
            }, 1000);
        }
        running = !running;
    });

    document.querySelector('.js-reset').addEventListener('click', () => {
        clearInterval(timer);
        running = false;
        timeLeft = 25 * 60;
        updateTimer();
        playBtn.innerText = 'Iniciar';
        statusText.innerText = 'Pronto para começar';
    });

    //  TAREFAS 
    const taskList = document.querySelector('.js-task-list');
    const addBtn = document.querySelector('.js-add-task');

    addBtn.addEventListener('click', () => {
        const text = prompt("Qual a nova missão?");
        if (text) {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `
                <label class="custom-checkbox">
                    <input type="checkbox">
                    <span class="checkmark"></span>
                    <span class="task-text">${text}</span>
                </label>
            `;
            taskList.appendChild(li);
        }
    });
});