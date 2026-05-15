/* ══════════════════════════════════════
   PAINEL ADMINISTRATIVO — Focus Study
   adm.js  v2
══════════════════════════════════════ */

const API = 'adm_api.php';
let ticketFilter = 'all';
let toastTimer;

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    initDate();
    initSidebarNav();
    initModalClose();
    loadSection('dashboard');
});

/* ── Auth check via sessão PHP ── */
async function checkAuth() {
    try {
        const res  = await fetch('verificar_adm.php');
        const data = await res.json();
        if (!data.logado) {
            window.location.href = '../login.html';
            return;
        }
        await loadAdminInfo();
    } catch {
        window.location.href = '../login.html';
    } finally {
        const screen = document.getElementById('adm-auth-screen');
        if (screen) screen.classList.add('hidden');
        setTimeout(() => screen?.remove(), 500);
    }
}

async function loadAdminInfo() {
    try {
        const res  = await fetch(`${API}?action=me`);
        const data = await res.json();
        if (data.success) {
            const el = document.getElementById('sidebar-name');
            const av = document.getElementById('sidebar-avatar');
            if (el) el.textContent = data.nome || 'Admin';
            if (av && data.foto) av.src = data.foto;
        }
    } catch { /* silencioso */ }
}

/* ── Data no topbar ── */
function initDate() {
    const el = document.getElementById('adm-date');
    if (!el) return;
    el.textContent = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
}

/* ══════════════════════════════════════
   NAVEGAÇÃO SIDEBAR
══════════════════════════════════════ */
function initSidebarNav() {
    document.querySelectorAll('[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.section;
            setActiveNav(target);
            loadSection(target);
            document.getElementById('adm-sidebar')?.classList.remove('open');
        });
    });

    document.getElementById('adm-menu-toggle')?.addEventListener('click', () => {
        document.getElementById('adm-sidebar')?.classList.toggle('open');
    });

    document.addEventListener('click', e => {
        const sidebar = document.getElementById('adm-sidebar');
        const toggle  = document.getElementById('adm-menu-toggle');
        if (sidebar?.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            !toggle?.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

const SECTION_META = {
    dashboard: ['Dashboard',          'Visão geral do sistema'],
    usuarios:  ['Usuários',           'Gerencie todos os usuários'],
    chamados:  ['Chamados de Suporte','Gerencie os tickets de suporte'],
};

function setActiveNav(section) {
    document.querySelectorAll('[data-section]').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

    const [title, sub] = SECTION_META[section] ?? ['Painel ADM', ''];
    document.getElementById('adm-topbar-title').textContent = title;
    document.getElementById('adm-topbar-sub').textContent   = sub;
}

function loadSection(section) {
    document.querySelectorAll('.adm-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`)?.classList.add('active');

    if (section === 'dashboard') loadDashboard();
    if (section === 'usuarios')  loadUsuarios();
    if (section === 'chamados')  loadChamados('all');
}

/* ══════════════════════════════════════
   DASHBOARD
══════════════════════════════════════ */
async function loadDashboard() {
    try {
        const [rStats, rRecent] = await Promise.all([
            fetch(`${API}?action=stats`).then(r => r.json()),
            fetch(`${API}?action=recent`).then(r => r.json()),
        ]);

        if (rStats.success)  renderKPIs(rStats.stats);
        if (rRecent.success) {
            renderRecentUsers(rRecent.recent_users);
            renderRecentTickets(rRecent.recent_tickets);
            const open = rStats.stats?.open_tickets ?? '';
            const badge = document.getElementById('sidebar-open-count');
            if (badge) badge.textContent = open > 0 ? open : '';
        }
    } catch {
        showToast('Erro ao carregar dashboard.', 'erro');
    }
}

function renderKPIs({ total_users, new_today, open_tickets, total_tickets }) {
    setText('kpi-total-users',   total_users   ?? '—');
    setText('kpi-new-today',     new_today     ?? '—');
    setText('kpi-open-tickets',  open_tickets  ?? '—');
    setText('kpi-total-tickets', total_tickets ?? '—');
}

function renderRecentUsers(users) {
    const tbody = document.getElementById('recent-users-tbody');
    if (!tbody) return;
    if (!users?.length) { tbody.innerHTML = emptyRow(3, 'Nenhum usuário'); return; }

    tbody.innerHTML = users.map(u => `
        <tr>
            <td>
                <div class="adm-user-cell">
                    <img class="adm-user-avatar" src="${avatarSrc(u)}" alt="">
                    <div>
                        <div class="adm-user-name">${esc(u.username || '—')}</div>
                        <div class="adm-user-email">${esc(u.email)}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge ${u.is_admin == 1 ? 'badge-admin' : 'badge-user'}">${u.is_admin == 1 ? 'Admin' : 'Usuário'}</span></td>
            <td>${xpBar(u.xp)}</td>
        </tr>`).join('');
}

function renderRecentTickets(tickets) {
    const tbody = document.getElementById('recent-tickets-tbody');
    if (!tbody) return;
    if (!tickets?.length) { tbody.innerHTML = emptyRow(4, 'Nenhum chamado'); return; }

    tbody.innerHTML = tickets.map(t => `
        <tr>
            <td style="font-size:12px;color:var(--cyan);font-weight:600">#${pad(t.id)}</td>
            <td style="font-size:13px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.subject || t.assunto || '—')}</td>
            <td><span class="badge badge-${esc(t.status)}">${statusLabel(t.status)}</span></td>
            <td style="font-size:12px;color:var(--text-muted)">${formatDate(t.created_at || t.criado_em)}</td>
        </tr>`).join('');
}

/* ══════════════════════════════════════
   USUÁRIOS
══════════════════════════════════════ */
async function loadUsuarios(query = '') {
    const tbody = document.getElementById('usuarios-tbody');
    if (!tbody) return;
    tbody.innerHTML = loadingRow(7);

    try {
        const url = `${API}?action=users${query ? '&q=' + encodeURIComponent(query) : ''}`;
        const { success, users } = await fetch(url).then(r => r.json());
        if (!success) throw new Error();
        renderUsuarios(users);
        setText('usuarios-count-label', `${users?.length ?? 0} usuário(s) encontrado(s)`);
    } catch {
        showToast('Erro ao carregar usuários.', 'erro');
        const tbody = document.getElementById('usuarios-tbody');
        if (tbody) tbody.innerHTML = emptyRow(7, 'Erro ao carregar');
    }
}

function renderUsuarios(users) {
    const tbody = document.getElementById('usuarios-tbody');
    if (!tbody) return;
    if (!users?.length) { tbody.innerHTML = emptyRow(7, 'Nenhum usuário encontrado'); return; }

    tbody.innerHTML = users.map(u => `
        <tr>
            <td style="font-size:12px;color:var(--text-muted);font-weight:500">#${esc(u.user_id)}</td>
            <td>
                <div class="adm-user-cell">
                    <img class="adm-user-avatar" src="${avatarSrc(u)}" alt="">
                    <div class="adm-user-name">${esc(u.username || '—')}</div>
                </div>
            </td>
            <td style="font-size:12px;color:var(--text-muted)">${esc(u.email)}</td>
            <td>${xpBar(u.xp)}</td>
            <td style="font-size:13px;color:#f97316;font-weight:600">
                <i class="fa-solid fa-fire" style="font-size:11px;margin-right:4px"></i>${esc(u.streak ?? '0')}d
            </td>
            <td><span class="badge ${u.is_admin == 1 ? 'badge-admin' : 'badge-user'}">${u.is_admin == 1 ? 'Admin' : 'Usuário'}</span></td>
            <td>
                <button class="adm-btn adm-btn-outline" data-user='${JSON.stringify(u)}'>
                    <i class="fa-solid fa-eye"></i> Ver
                </button>
            </td>
        </tr>`).join('');

    /* event delegation — evita onclick inline com JSON */
    tbody.querySelectorAll('[data-user]').forEach(btn => {
        btn.addEventListener('click', () => openUserModal(JSON.parse(btn.dataset.user)));
    });
}

/* Busca com debounce */
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('user-search');
    if (!input) return;
    let debounce;
    input.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => loadUsuarios(input.value.trim()), 350);
    });
});

function openUserModal(u) {
    document.getElementById('modal-user-avatar').src      = avatarSrc(u);
    document.getElementById('modal-user-name').textContent  = u.username || '—';
    document.getElementById('modal-user-name2').textContent = u.username || '—';
    document.getElementById('modal-user-id').textContent    = '#' + String(u.user_id).padStart(4, '0');
    document.getElementById('modal-user-email').textContent  = u.email   || '—';
    document.getElementById('modal-user-xp').textContent     = (u.xp     ?? '0') + ' XP';
    document.getElementById('modal-user-streak').textContent = (u.streak  ?? '0') + ' dias';

    const badge = document.getElementById('modal-user-role-badge');
    badge.innerHTML = `<span class="badge ${u.is_admin == 1 ? 'badge-admin' : 'badge-user'}" style="margin-top:4px">${u.is_admin == 1 ? 'Administrador' : 'Usuário'}</span>`;

    document.getElementById('modal-user-delete-btn').dataset.userId = u.user_id;

    openModal('modal-user');
}

/* ══════════════════════════════════════
   CHAMADOS
══════════════════════════════════════ */
async function loadChamados(status) {
    ticketFilter = status;
    const tbody = document.getElementById('chamados-tbody');
    if (!tbody) return;
    tbody.innerHTML = loadingRow(8);

    try {
        const url = `${API}?action=tickets${status && status !== 'all' ? '&status=' + status : ''}`;
        const { success, tickets } = await fetch(url).then(r => r.json());
        if (!success) throw new Error();
        renderChamados(tickets);
        setText('chamados-count-label', `${tickets?.length ?? 0} chamado(s)`);
    } catch {
        showToast('Erro ao carregar chamados.', 'erro');
        const tbody = document.getElementById('chamados-tbody');
        if (tbody) tbody.innerHTML = emptyRow(8, 'Erro ao carregar');
    }
}

function renderChamados(tickets) {
    const tbody = document.getElementById('chamados-tbody');
    if (!tbody) return;
    if (!tickets?.length) { tbody.innerHTML = emptyRow(8, 'Nenhum chamado encontrado'); return; }

    tbody.innerHTML = tickets.map(t => `
        <tr>
            <td style="font-size:12px;color:var(--cyan);font-weight:600">#${pad(t.id)}</td>
            <td>
                <div style="font-weight:600;font-size:13px">${esc(t.name || t.nome || '—')}</div>
                <div style="font-size:11px;color:var(--text-muted)">${esc(t.email || '—')}</div>
            </td>
            <td style="max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px"
                title="${esc(t.subject || t.assunto || '')}">${esc(t.subject || t.assunto || '—')}</td>
            <td style="font-size:12px;color:var(--text-muted)">${esc(catLabel(t.category || t.categoria))}</td>
            <td><span class="badge badge-${(t.priority || t.prioridade || 'low').toLowerCase()}">${prioLabel(t.priority || t.prioridade)}</span></td>
            <td>
                <select class="adm-status-select" data-id="${t.id}">
                    <option value="pending" ${t.status === 'pending' ? 'selected':''}>Aberto</option>
                    <option value="replied" ${t.status === 'replied' ? 'selected':''}>Respondido</option>
                    <option value="closed"  ${t.status === 'closed'  ? 'selected':''}>Fechado</option>
                </select>
            </td>
            <td style="font-size:12px;color:var(--text-muted);white-space:nowrap">${formatDate(t.created_at || t.criado_em)}</td>
            <td>
                <button class="adm-btn adm-btn-outline" data-ticket='${JSON.stringify(t)}'>
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>`).join('');

    /* event delegation */
    tbody.querySelectorAll('[data-ticket]').forEach(btn => {
        btn.addEventListener('click', () => openTicketModal(JSON.parse(btn.dataset.ticket)));
    });
    tbody.querySelectorAll('.adm-status-select').forEach(sel => {
        sel.addEventListener('change', () => updateTicketStatus(sel));
    });
}

/* Tabs de filtro */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-ticket-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-ticket-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadChamados(btn.dataset.ticketFilter);
        });
    });
});

async function updateTicketStatus(select) {
    const id = select.dataset.id;
    const fd = new FormData();
    fd.append('id', id);
    fd.append('status', select.value);

    try {
        const data = await fetch(`${API}?action=update_ticket`, { method: 'POST', body: fd }).then(r => r.json());
        showToast(data.message || 'Status atualizado', data.success ? 'sucesso' : 'erro');
    } catch {
        showToast('Erro ao atualizar status.', 'erro');
    }
}

function openTicketModal(t) {
    document.getElementById('modal-ticket-id').textContent      = '#' + pad(t.id);
    document.getElementById('modal-ticket-subject').textContent  = t.subject || t.assunto || '—';
    document.getElementById('modal-ticket-name').textContent     = t.name    || t.nome    || '—';
    const emailEl = document.getElementById('modal-ticket-email');
    emailEl.textContent = t.email || '—';
    emailEl.href = t.email ? `mailto:${t.email}` : '#';
    document.getElementById('modal-ticket-cat').textContent     = catLabel(t.category || t.categoria);
    document.getElementById('modal-ticket-prio').textContent    = prioLabel(t.priority || t.prioridade);
    document.getElementById('modal-ticket-status').textContent  = statusLabel(t.status);
    document.getElementById('modal-ticket-date').textContent    = formatDate(t.created_at || t.criado_em);
    document.getElementById('modal-ticket-msg').textContent     = t.message  || t.mensagem || '—';

    /* Resposta anterior */
    const prevLabel = document.getElementById('modal-reply-prev-label');
    const prevMsg   = document.getElementById('modal-ticket-reply-prev');
    if (t.reply) {
        prevLabel.style.display = '';
        prevMsg.style.display   = '';
        prevMsg.textContent     = t.reply;
    } else {
        prevLabel.style.display = 'none';
        prevMsg.style.display   = 'none';
    }

    document.getElementById('modal-ticket-reply-input').value = '';
    document.getElementById('modal-ticket-reply-btn').dataset.id = t.id;

    openModal('modal-ticket');
}

/* ══════════════════════════════════════
   MODAL
══════════════════════════════════════ */
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function initModalClose() {
    document.querySelectorAll('.adm-modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.remove('open');
        });
    });
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });
}

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? '—';
}
function pad(n) { return String(n ?? 0).padStart(4, '0'); }

function avatarSrc(u) {
    if (u.photo && u.photo.startsWith('http')) return u.photo;
    if (u.photo) return '../' + u.photo;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || 'U')}&background=06b6d4&color=fff`;
}

function xpBar(xp) {
    const v   = Math.min(parseInt(xp) || 0, 10000);
    const pct = Math.round(v / 100);
    return `<div class="adm-xp-wrap">
        <div class="adm-xp-bar"><div class="adm-xp-fill" style="width:${pct}%"></div></div>
        <span class="adm-xp-label">${v} XP</span>
    </div>`;
}

function formatDate(dt) {
    if (!dt) return '—';
    const d = new Date(dt);
    return isNaN(d) ? dt : d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function statusLabel(s) {
    return { open:'Aberto', in_progress:'Em andamento', resolved:'Resolvido',
             pending:'Aberto', replied:'Respondido', closed:'Fechado',
             aberto:'Aberto', andamento:'Em andamento', resolvido:'Resolvido' }[s] ?? (s || '—');
}
function catLabel(c) {
    return { conta:'Conta', pagamento:'Pagamento', tecnico:'Técnico',
             funcionalidade:'Funcionalidade', sugestao:'Sugestão', outro:'Outro' }[c] ?? (c || '—');
}
function prioLabel(p) {
    const m = { high:'Alta', medium:'Média', low:'Baixa', alta:'Alta', media:'Média', baixa:'Baixa' };
    return m[(p || '').toLowerCase()] ?? (p || '—');
}

function emptyRow(cols, msg) {
    return `<tr><td colspan="${cols}">
        <div class="adm-empty">
            <div class="adm-empty-icon"><i class="fa-regular fa-folder-open"></i></div>
            <h4>${msg}</h4>
        </div>
    </td></tr>`;
}
function loadingRow(cols) {
    return `<tr><td colspan="${cols}"><div class="adm-loading"><div class="adm-spinner"></div></div></td></tr>`;
}

/* ── Deletar Usuário ── */
document.addEventListener('DOMContentLoaded', () => {
    const deleteBtn = document.getElementById('modal-user-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const userId = deleteBtn.dataset.userId;
            if (!userId) return;
            if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;

            const fd = new FormData();
            fd.append('user_id', userId);

            try {
                const data = await fetch(`${API}?action=delete_user`, { method: 'POST', body: fd }).then(r => r.json());
                if (data.success) {
                    closeModal('modal-user');
                    showToast('Usuário deletado com sucesso', 'sucesso');
                    loadUsuarios();
                } else {
                    showToast(data.message || 'Erro ao deletar usuário', 'erro');
                }
            } catch (err) {
                showToast('Erro ao deletar usuário: ' + err.message, 'erro');
            }
        });
    }
});

/* ── Responder Chamado ── */
document.addEventListener('DOMContentLoaded', () => {
    const replyBtn = document.getElementById('modal-ticket-reply-btn');
    if (replyBtn) {
        replyBtn.addEventListener('click', async () => {
            const id = replyBtn.dataset.id;
            const reply = document.getElementById('modal-ticket-reply-input').value.trim();

            if (!id) return;
            if (!reply) {
                showToast('Digite uma resposta.', 'erro');
                return;
            }

            const fd = new FormData();
            fd.append('id', id);
            fd.append('reply', reply);

            try {
                const data = await fetch(`${API}?action=reply_ticket`, { method: 'POST', body: fd }).then(r => r.json());
                if (data.success) {
                    closeModal('modal-ticket');
                    showToast('Resposta enviada com sucesso', 'sucesso');
                    loadChamados(ticketFilter);
                } else {
                    showToast(data.message || 'Erro ao enviar resposta', 'erro');
                }
            } catch (err) {
                showToast('Erro ao enviar resposta: ' + err.message, 'erro');
            }
        });
    }
});

/* ── Toast ── */
function showToast(msg, tipo = '') {
    const t = document.getElementById('adm-toast');
    if (!t) return;
    t.textContent = msg;
    t.className   = `show ${tipo}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = ''; }, 3200);
}
