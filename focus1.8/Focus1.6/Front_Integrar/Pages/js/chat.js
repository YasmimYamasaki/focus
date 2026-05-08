//corrigir IA por inteiro
const chatBody  = document.getElementById('chatBody');
const userInput = document.getElementById('userInput');
const sendBtn   = document.getElementById('sendBtn');

// Horário da mensagem inicial
document.getElementById('initTime').textContent = getTime();

function getTime() {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function addMsg(text, who) {
    const div = document.createElement('div');
    div.className = 'msg ' + who;
    div.innerHTML = escapeHtml(text) + `<div class="msg-time">${getTime()}</div>`;
    chatBody.appendChild(div);
    scrollBottom();
}

function showTyping() {
    const t = document.createElement('div');
    t.className = 'typing';
    t.id = 'typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(t);
    scrollBottom();
}

function removeTyping() {
    const t = document.getElementById('typing');
    if (t) t.remove();
}

function scrollBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Escapa HTML para evitar XSS na exibição
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || sendBtn.disabled) return;

    // Mostra mensagem do usuário
    addMsg(text, 'user');
    userInput.value = '';
    userInput.style.height = 'auto';

    // Bloqueia enquanto aguarda
    sendBtn.disabled = true;
    showTyping();

    try {
        const formData = new FormData();
        formData.append('message', text);

        // POST para o próprio index.php (mesma página)
        const res = await fetch('php/index.php', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('HTTP ' + res.status);

        const reply = await res.text();
        removeTyping();
        addMsg(reply, 'bot');

    } catch (err) {
        removeTyping();
        addMsg('🐰 Lag detectado! Tente novamente. GG! 🚀', 'bot');
        console.error('Erro:', err);
    }

    sendBtn.disabled = false;
    userInput.focus();
}

// Enviar com Enter (Shift+Enter = nova linha)
userInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Botão enviar
sendBtn.addEventListener('click', sendMessage);

// Auto-resize do textarea
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});
