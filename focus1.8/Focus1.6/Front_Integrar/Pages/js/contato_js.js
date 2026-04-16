const prioButtons = document.querySelectorAll('.priority-btn');
const prioInput = document.getElementById('prioridade');

prioButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        prioButtons.forEach(b => b.classList.remove('active-baixa', 'active-media', 'active-alta'));
        const p = btn.dataset.prio;
        btn.classList.add(`active-${p}`);
        if (prioInput) prioInput.value = p;
    });
});

// Contador de caracteres com cores de aviso
const textarea = document.getElementById('mensagem');
const charCount = document.getElementById('charCount');

if (textarea) {
    textarea.addEventListener('input', () => {
        const len = textarea.value.length;
        charCount.textContent = `${len} / 2000`;
        charCount.className = 'char-count' + (len > 1800 ? ' warn' : '') + (len >= 2000 ? ' over' : '');
    });
}

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const wasOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
    });
});

// Modal Admin
function abrirModalLogin() { document.getElementById('modalSuporte').style.display = 'flex'; }
function fecharModal() {
    document.getElementById('modalSuporte').style.display = 'none';
    const erroDiv = document.getElementById('erroLogin');
    if (erroDiv) erroDiv.style.display = 'none';
}

/* LÓGICA DE COMUNICAÇÃO */

function mostrarAlerta(msg, tipo) {
    const el = document.getElementById('alerta');
    if (!el) return;
    el.textContent = msg;
    el.className = `alerta ${tipo}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 8000);
}

// Envio de Chamado
document.getElementById('formContato')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = document.getElementById('btnEnviar');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Enviando...';

    try {
        const res = await fetch('php/contato.php', { method: 'POST', body: new FormData(this) });
        const data = await res.json();
        mostrarAlerta(data.mensagem, data.sucesso ? 'sucesso' : 'erro');
        if (data.sucesso) {
            this.reset();
            carregarTickets();
        }
    } catch (err) {
        mostrarAlerta('Erro de conexão.', 'erro');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// Login Administrativo
document.getElementById('formLoginAdmin')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = e.submitter;
    const erroDiv = document.getElementById('erroLogin');

    btn.disabled = true;
    const textOriginal = btn.innerHTML;
    btn.innerHTML = 'Verificando...';

    try {
        const res = await fetch('php/contato.php?acao=login', { method: 'POST', body: new FormData(this) });
        const data = await res.json();

        if (data.sucesso) {
            window.location.href = 'admin_painel.html';
        } else {
            erroDiv.textContent = data.mensagem;
            erroDiv.style.display = 'block';
        }
    } catch (err) {
        erroDiv.textContent = 'Erro no servidor.';
        erroDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerHTML = textOriginal;
    }
});

// Tabela de Chamados
async function carregarTickets() {
    const wrap = document.getElementById('tabelaTickets');
    if (!wrap) return;

    try {
        const res = await fetch('php/contato.php?listar=1');
        const data = await res.json();

        if (!data.tickets || data.tickets.length === 0) {
            wrap.innerHTML = `<div class="tickets-empty">Nenhum chamado registrado.</div>`;
            return;
        }

        const rows = data.tickets.map(t => `
            <tr>
                <td><span class="ticket-id">#${t.call_code}</span></td>
                <td class="ticket-assunto">${t.call_subject}</td>
                <td><span class="badge-status badge-${t.call_status}">${t.call_status.toUpperCase()}</span></td>
                <td><span class="badge-prioridade prio-${t.call_priority}">${t.call_priority.toUpperCase()}</span></td>
                <td style="color:var(--text-muted);font-size:12px;">${new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
            </tr>`).join('');

        wrap.innerHTML = `<table><thead><tr><th>Protocolo</th><th>Assunto</th><th>Status</th><th>Prio</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table>`;
    } catch (err) {
        wrap.innerHTML = `<div class="tickets-empty">Erro ao carregar lista.</div>`;
    }
}

// Inicializa a lista
carregarTickets();