/* Abre e fecha a janela do chat e gerencia animações */
function toggleChat() {
    let chat = document.getElementById("chatBox");
    // Alterna visibilidade usando o modelo de layout Flexbox
    if (chat.style.display === "flex") {
        chat.style.display = "none";
    } else {
        chat.style.display = "flex";
        // Truque de Reinicialização de Animação (Reflow)
        chat.style.animation = "none";
        chat.offsetHeight;
        chat.style.animation = "";
        // Foca automaticamente no campo de texto para o usuário começar a digitar
        document.getElementById("input").focus();
    }
}
/* Cria e renderiza uma nova bolha de mensagem no histórico */
function addMessage(role, text, options = {}) {
    let box = document.getElementById("messages");
    const p = document.createElement('p');
    if (role === "assistant") {
        p.className = options.typing ? "msg-assistant typing" : "msg-assistant";
    } else {
        p.className = "msg-user";
    }
    if (options.typing) {
        p.dataset.typing = "true";
    }

    p.innerHTML = text;
    box.appendChild(p);
    box.scrollTop = box.scrollHeight;
    return p;
}
/* Função de Segurança: Converte caracteres especiais em entidades HTML */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}
/* Processa o envio da mensagem, chama a API e trata a resposta */
function sendMessage() {
    let input = document.getElementById("input");
    let msg = input.value.trim();
    if (msg === "") return;
    addMessage("user", escapeHtml(msg));
    input.value = "";
    const typingEl = addMessage("assistant", "Digitando...", { typing: true });
    // Envia a mensagem para o servidor via POST
    fetch(window.location.origin + "/Focus1.2/Front_Integrar/Pages/php/chat.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "message=" + encodeURIComponent(msg)
    })
        .then(r => r.text())
        .then(res => {
            if (typingEl && typingEl.parentNode) typingEl.remove();
            addMessage("assistant", res);
        })
        .catch(() => {
            if (typingEl && typingEl.parentNode) typingEl.remove();
            addMessage("assistant", "🐰 Erro ao enviar a mensagem. GG! 🚀");
        });
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("input");
    /* Atalho de teclado: Envia a mensagem ao pressionar "Enter" */
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }
});