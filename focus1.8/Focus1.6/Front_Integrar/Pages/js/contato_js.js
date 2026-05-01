const prioButtons = document.querySelectorAll('.priority-btn');
const prioInput = document.getElementById('prioridade');//corrigir modal

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
async function enviarComPersistencia(formData, tentativas = 3) {
    for (let i = 0; i < tentativas; i++) {
        try {
            const res = await fetch('php/contato.php', { method: 'POST', body: formData });
            const data = await res.json();

            if (!data.sucesso && data.mensagem.includes("conexão")) {
                throw new Error("Timeout de rede");
            }

            return data; // Sucesso total
        } catch (err) {
            console.warn(`Tentativa ${i + 1} falhou. Tentando novamente...`);
            if (i === tentativas - 1) throw err;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

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

document.getElementById('formContato')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = document.getElementById('btnEnviar');
    btn.disabled = true;

    try {
        const formData = new FormData(this);
        const data = await enviarComPersistencia(formData);

        if (data.sucesso) {
            mostrarAlerta(data.mensagem, "sucesso");
            this.reset();
            carregarTickets(); // Atualiza a lista automaticamente
        } else {
            mostrarAlerta(data.mensagem, "erro");
        }
    } catch (err) {
        mostrarAlerta("Falha na comunicação com o servidor.", "erro");
    } finally {
        btn.disabled = false;
    }
});

async function carregarTickets() {
    const wrap = document.getElementById('tabelaTickets');
    if (!wrap) return;

    try {
        const res = await fetch('php/contato.php?listar=1');
        const rawText = await res.text();
        const data = JSON.parse(rawText);

        if (!data.tickets || data.tickets.length === 0) {
            wrap.innerHTML = `<div class="tickets-empty">Nenhum chamado registrado.</div>`;
            return;
        }

        const rows = data.tickets.map(t => {
            const traduzirPrio = { 'low': 'baixa', 'medium': 'media', 'high': 'alta' };
            const prioPT = traduzirPrio[t.priority] || 'baixa';

            const traduzirStatus = { 'pending': 'aberto', 'replied': 'respondido', 'closed': 'fechado' };
            const statusPT = traduzirStatus[t.status] || 'aberto';

            return `
                <tr>
                    <td><span class="ticket-id">#${t.code}</span></td>
                    <td class="ticket-assunto">${t.subject}</td>
                    <td><span class="badge-status badge-${statusPT}">${statusPT.toUpperCase()}</span></td>
                    <td><span class="badge-prioridade prio-${prioPT}">${prioPT.toUpperCase()}</span></td>
                    <td style="color:var(--text-muted);font-size:12px;">${new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>`;
        }).join('');

        wrap.innerHTML = `<table><thead><tr><th>Protocolo</th><th>Assunto</th><th>Status</th><th>Prio</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table>`;

    } catch (err) {
        console.error("Erro ao carregar tickets:", err);
        wrap.innerHTML = `<div class="tickets-empty">Erro ao carregar lista de chamados.</div>`;
    }
}

// verifica status de user logado
async function verificarStatusUsuario() {
    try {
    
        const res = await fetch('adm/verificar_adm.php');
        const status = await res.json();

        if (!status.logado) {
            console.log("Acesso administrativo não detectado.");
        } else {
            console.log("Admin logado com sucesso.");
        }
    } catch (err) {
        console.error("Erro na comunicação de sessão:", err);
    }
}

// Inicialização correta
document.addEventListener('DOMContentLoaded', () => {
    carregarTickets();
});