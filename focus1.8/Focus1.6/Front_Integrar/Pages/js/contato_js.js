/* PRIORIDADE */
const prioButtons = document.querySelectorAll('.priority-btn');
const prioInput = document.getElementById('prioridade');

prioButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    prioButtons.forEach(b => b.classList.remove('active-baixa', 'active-media', 'active-alta'));
    const p = btn.dataset.prio;
    btn.classList.add(`active-${p}`);
    prioInput.value = p;
  });
});

/* CONTADOR DE CARACTERES */
const textarea = document.getElementById('mensagem');
const charCount = document.getElementById('charCount');

textarea.addEventListener('input', () => {
  const len = textarea.value.length;
  charCount.textContent = `${len} / 2000`;
  charCount.className = 'char-count' + (len > 1800 ? ' warn' : '') + (len >= 2000 ? ' over' : '');
});

/* FAQ ACCORDION */
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

/* ENVIO DO FORMULÁRIO */
document.getElementById('formContato').addEventListener('submit', async function (e) {
  e.preventDefault();

  const btn = document.getElementById('btnEnviar');
  btn.disabled = true;
  btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .8s linear infinite">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
      </svg>
      Enviando...`;

  try {
    const res = await fetch('contato.php', { method: 'POST', body: new FormData(this) });
    const data = await res.json();

    mostrarAlerta(data.mensagem, data.sucesso ? 'sucesso' : 'erro');

    if (data.sucesso) {
      this.reset();
      prioButtons.forEach(b => b.classList.remove('active-baixa', 'active-media', 'active-alta'));
      prioButtons[0].classList.add('active-baixa');
      prioInput.value = 'baixa';
      charCount.textContent = '0 / 2000';
      charCount.className = 'char-count';
      carregarTickets();
    }
  } catch {
    mostrarAlerta('Erro de conexão com o servidor. Tente novamente.', 'erro');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        Enviar chamado`;
  }
});

function mostrarAlerta(msg, tipo) {
  const el = document.getElementById('alerta');
  el.textContent = msg;
  el.className = tipo;
  el.style.display = 'block';
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  setTimeout(() => { el.style.display = 'none'; }, 8000);
}

/* CARREGAR TICKETS DA API */
const statusLabel = { aberto: 'Aberto', andamento: 'Em andamento', resolvido: 'Resolvido' };
const prioLabel = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };

async function carregarTickets() {
  const wrap = document.getElementById('tabelaTickets');
  wrap.innerHTML = `<div class="tickets-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>Carregando...</div>`;

  try {
    const res = await fetch('contato.php?listar=1');
    const data = await res.json();

    if (!data.sucesso || !data.tickets.length) {
      wrap.innerHTML = `<div class="tickets-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3"></rect>
            <path d="M9 9h6M9 12h6M9 15h4"></path>
          </svg>
          Nenhum chamado registrado ainda.
        </div>`;
      return;
    }

    const rows = data.tickets.map(t => `
        <tr>
          <td><span class="ticket-id">#${String(t.id).padStart(4, '0')}</span></td>
          <td class="ticket-assunto" title="${escHtml(t.assunto)}">${escHtml(t.assunto)}</td>
          <td><span class="badge-status badge-${t.status}">${statusLabel[t.status] || t.status}</span></td>
          <td><span class="badge-prioridade prio-${t.prioridade}">${prioLabel[t.prioridade] || t.prioridade}</span></td>
          <td style="color:var(--text-muted);font-size:12px;">${formatarData(t.criado_em)}</td>
        </tr>`).join('');

    wrap.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>#ID</th>
              <th>Assunto</th>
              <th>Status</th>
              <th>Prioridade</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;

    document.getElementById('ticketCount').textContent = data.tickets.length;
    document.getElementById('ticketsFooter').style.display = 'flex';

  } catch {
    wrap.innerHTML = `<div class="tickets-empty">Erro ao carregar chamados.</div>`;
  }
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatarData(str) {
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* Animação spin inline */
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);

carregarTickets();