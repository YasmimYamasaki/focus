<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Painel de Suporte — Focus Study</title>
  <link rel="stylesheet" href="css/styles.css" />
  <link rel="stylesheet" href="css/suporteAdmin.css" />

</head>
<body>

  <header class="header">
    <div class="container header-inner">
      <a href="index.html" class="logo">
        <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>Focus Study</span>
      </a>
      <nav class="nav">
        <a href="index.html"   class="nav-link">Início</a>
        <a href="contato.html" class="nav-link">Suporte</a>
        <a href="suporte-admin.php" class="nav-link active">Admin</a>
      </nav>
      <div class="header-actions">
        <button class="nav-toggle" aria-label="Menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <?php
require_once 'PostgreSQLClass.php';

$db = new PostgreSQLClass();

/*CRIAR TABELA (PostgreSQL)*/

$db->exec("
CREATE TABLE IF NOT EXISTS chamados_suporte (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    email VARCHAR(120) NOT NULL,
    categoria VARCHAR(40) NOT NULL,
    assunto VARCHAR(120) NOT NULL,
    mensagem TEXT NOT NULL,
    prioridade VARCHAR(10) NOT NULL DEFAULT 'baixa',
    status VARCHAR(15) NOT NULL DEFAULT 'aberto',
    ip VARCHAR(45),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
");

/*FILTROS*/

$filtroStatus    = $_GET['status']      ?? '';
$filtroPrio      = $_GET['prioridade']  ?? '';
$filtroCategoria = $_GET['categoria']   ?? '';
$busca           = trim($_GET['busca'] ?? '');
$pagina          = max(1, intval($_GET['pagina'] ?? 1));
$porPagina       = 15;
$offset          = ($pagina - 1) * $porPagina;

$where  = [];
$params = [];

$statusValidos = ['aberto','andamento','resolvido'];
$prioValidas   = ['baixa','media','alta'];
$catValidas    = ['conta','pagamento','tecnico','funcionalidade','sugestao','outro'];

if (in_array($filtroStatus, $statusValidos)) {
    $where[]  = "status = ?";
    $params[] = $filtroStatus;
}

if (in_array($filtroPrio, $prioValidas)) {
    $where[]  = "prioridade = ?";
    $params[] = $filtroPrio;
}

if (in_array($filtroCategoria, $catValidas)) {
    $where[]  = "categoria = ?";
    $params[] = $filtroCategoria;
}

if ($busca !== '') {
    $where[] = "(nome ILIKE ? OR email ILIKE ? OR assunto ILIKE ?)";
    $like = "%{$busca}%";
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
}

$sqlWhere = $where ? 'WHERE ' . implode(' AND ', $where) : '';

/*TOTALs*/

$totalRow = $db->search(
    "SELECT COUNT(*) as total FROM chamados_suporte $sqlWhere",
    $params,
    true
);

$total = $totalRow['total'] ?? 0;

$totalPaginas = max(1, ceil($total / $porPagina));
if ($pagina > $totalPaginas) $pagina = $totalPaginas;

/*KPIs*/

$kpis = [];

$kpis['total'] = $db->search(
    "SELECT COUNT(*) as total FROM chamados_suporte",
    [],
    true
)['total'] ?? 0;

foreach (['aberto','andamento','resolvido'] as $st) {
    $kpis[$st] = $db->search(
        "SELECT COUNT(*) as total FROM chamados_suporte WHERE status = ?",
        [$st],
        true
    )['total'] ?? 0;
}

/*PAGINAÇÃO*/

$paramsPagina = $params;
$paramsPagina[] = $porPagina;
$paramsPagina[] = $offset;

$tickets = $db->search(
    "SELECT * FROM chamados_suporte
     $sqlWhere
     ORDER BY criado_em DESC
     LIMIT ? OFFSET ?",
    $paramsPagina
);

/*HELPERS (INALTERADOS)*/

function escH($v) { return htmlspecialchars($v ?? '', ENT_QUOTES, 'UTF-8'); }
function statusBadge($s) {
    $labels = ['aberto'=>'Aberto','andamento'=>'Em andamento','resolvido'=>'Resolvido'];
    return '<span class="badge-status badge-' . escH($s) . '">' . escH($labels[$s] ?? $s) . '</span>';
}
function prioBadge($p) {
    $labels = ['baixa'=>'Baixa','media'=>'Média','alta'=>'Alta'];
    return '<span class="badge-prioridade prio-' . escH($p) . '">' . escH($labels[$p] ?? $p) . '</span>';
}
function catLabel($c) {
    $labels = ['conta'=>'Conta','pagamento'=>'Pagamento','tecnico'=>'Técnico','funcionalidade'=>'Funcionalidade','sugestao'=>'Sugestão','outro'=>'Outro'];
    return $labels[$c] ?? ucfirst($c);
}
function formatDt($dt) {
    $d = new DateTime($dt);
    return $d->format('d/m/Y H:i');
}
?>

  <main class="admin-page">
    <div class="container">

      <!-- Top bar -->
      <div class="admin-topbar">
        <div>
          <h1 class="admin-title">Painel de Suporte</h1>
          <p class="admin-subtitle">Gerencie todos os chamados da Focus Study</p>
        </div>
        <a href="contato.html" class="btn btn-secondary" style="padding:10px 20px;font-size:14px;text-decoration:none">
          ← Página de Suporte
        </a>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Total de chamados</div>
          <div class="kpi-value" style="<?= $kpiColors['total'] ?>"><?= $kpis['total'] ?></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Abertos</div>
          <div class="kpi-value" style="<?= $kpiColors['aberto'] ?>"><?= $kpis['aberto'] ?></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Em andamento</div>
          <div class="kpi-value" style="<?= $kpiColors['andamento'] ?>"><?= $kpis['andamento'] ?></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Resolvidos</div>
          <div class="kpi-value" style="<?= $kpiColors['resolvido'] ?>"><?= $kpis['resolvido'] ?></div>
        </div>
      </div>

      <!-- Filtros -->
      <form method="GET" class="filters-bar">
        <input type="text" name="busca" class="search-input"
               placeholder="Buscar por nome, e-mail ou assunto…"
               value="<?= escH($busca) ?>" />

        <div class="filter-group">
          <label>Status</label>
          <select name="status" class="filter-select">
            <option value="">Todos</option>
            <option value="aberto"    <?= $filtroStatus==='aberto'    ? 'selected' : '' ?>>Aberto</option>
            <option value="andamento" <?= $filtroStatus==='andamento' ? 'selected' : '' ?>>Em andamento</option>
            <option value="resolvido" <?= $filtroStatus==='resolvido' ? 'selected' : '' ?>>Resolvido</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Prioridade</label>
          <select name="prioridade" class="filter-select">
            <option value="">Todas</option>
            <option value="alta"  <?= $filtroPrio==='alta'  ? 'selected' : '' ?>>Alta</option>
            <option value="media" <?= $filtroPrio==='media' ? 'selected' : '' ?>>Média</option>
            <option value="baixa" <?= $filtroPrio==='baixa' ? 'selected' : '' ?>>Baixa</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Categoria</label>
          <select name="categoria" class="filter-select">
            <option value="">Todas</option>
            <option value="conta"          <?= $filtroCategoria==='conta'          ? 'selected' : '' ?>>Conta</option>
            <option value="pagamento"      <?= $filtroCategoria==='pagamento'      ? 'selected' : '' ?>>Pagamento</option>
            <option value="tecnico"        <?= $filtroCategoria==='tecnico'        ? 'selected' : '' ?>>Técnico</option>
            <option value="funcionalidade" <?= $filtroCategoria==='funcionalidade' ? 'selected' : '' ?>>Funcionalidade</option>
            <option value="sugestao"       <?= $filtroCategoria==='sugestao'       ? 'selected' : '' ?>>Sugestão</option>
            <option value="outro"          <?= $filtroCategoria==='outro'          ? 'selected' : '' ?>>Outro</option>
          </select>
        </div>

        <button type="submit" class="btn-filtrar">Filtrar</button>
        <a href="suporte-admin.php" class="btn-limpar">Limpar</a>
      </form>

      <!-- Tabela -->
      <div class="admin-table-wrap">
        <div class="table-header">
          <h3>Chamados</h3>
          <span><?= $total ?> resultado<?= $total !== 1 ? 's' : '' ?></span>
        </div>

        <?php if (empty($tickets)): ?>
          <div class="empty-state">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3"></rect>
              <path d="M9 9h6M9 12h6M9 15h4"></path>
            </svg>
            <h4>Nenhum chamado encontrado</h4>
            <p>Tente ajustar os filtros ou aguarde novos chamados.</p>
          </div>
        <?php else: ?>
          <table class="admin-table">
            <thead>
              <tr>
                <th>#ID</th>
                <th>Solicitante</th>
                <th>Assunto</th>
                <th>Categoria</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($tickets as $t): ?>
              <tr>
                <td class="ticket-id-cell">#<?= str_pad($t['id'], 4, '0', STR_PAD_LEFT) ?></td>
                <td>
                  <div style="font-weight:600;font-size:13px"><?= escH($t['nome']) ?></div>
                  <div class="ticket-email-cell"><?= escH($t['email']) ?></div>
                </td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="<?= escH($t['assunto']) ?>">
                  <?= escH($t['assunto']) ?>
                </td>
                <td style="font-size:12px;color:var(--text-muted)"><?= escH(catLabel($t['categoria'])) ?></td>
                <td><?= prioBadge($t['prioridade']) ?></td>
                <td>
                  <select class="status-select"
                          data-id="<?= $t['id'] ?>"
                          onchange="atualizarStatus(this)">
                    <option value="aberto"    <?= $t['status']==='aberto'    ? 'selected' : '' ?>>Aberto</option>
                    <option value="andamento" <?= $t['status']==='andamento' ? 'selected' : '' ?>>Em andamento</option>
                    <option value="resolvido" <?= $t['status']==='resolvido' ? 'selected' : '' ?>>Resolvido</option>
                  </select>
                </td>
                <td style="font-size:12px;color:var(--text-muted);white-space:nowrap">
                  <?= escH(formatDt($t['criado_em'])) ?>
                </td>
                <td>
                  <button class="btn-limpar"
                          style="font-size:12px;padding:5px 10px"
                          onclick='verDetalhes(<?= json_encode($t) ?>)'>
                    Ver
                  </button>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>

          <!-- Paginação -->
          <?php if ($totalPaginas > 1): ?>
          <div class="pagination">
            <span>Página <strong><?= $pagina ?></strong> de <strong><?= $totalPaginas ?></strong></span>
            <div class="pag-buttons">
              <?php
              $baseUrl = '?' . http_build_query(array_filter([
                  'status'    => $filtroStatus,
                  'prioridade'=> $filtroPrio,
                  'categoria' => $filtroCategoria,
                  'busca'     => $busca,
              ]));

              echo '<button class="pag-btn" onclick="location.href=\'' . $baseUrl . '&pagina=1\'" ' . ($pagina<=1?'disabled':'') . '>«</button>';
              echo '<button class="pag-btn" onclick="location.href=\'' . $baseUrl . '&pagina=' . ($pagina-1) . '\'" ' . ($pagina<=1?'disabled':'') . '>‹</button>';

              for ($p = max(1,$pagina-2); $p <= min($totalPaginas,$pagina+2); $p++) {
                  $ativo = $p===$pagina ? 'active' : '';
                  echo '<button class="pag-btn ' . $ativo . '" onclick="location.href=\'' . $baseUrl . '&pagina=' . $p . '\'">' . $p . '</button>';
              }

              echo '<button class="pag-btn" onclick="location.href=\'' . $baseUrl . '&pagina=' . ($pagina+1) . '\'" ' . ($pagina>=$totalPaginas?'disabled':'') . '>›</button>';
              echo '<button class="pag-btn" onclick="location.href=\'' . $baseUrl . '&pagina=' . $totalPaginas . '\'" ' . ($pagina>=$totalPaginas?'disabled':'') . '>»</button>';
              ?>
            </div>
          </div>
          <?php endif; ?>

        <?php endif; ?>
      </div>

    </div><!-- /container -->
  </main>

  <!-- Modal detalhes -->
  <div class="modal-overlay" id="modalOverlay" onclick="fecharModal(event)">
    <div class="modal" id="modalContent">
      <div class="modal-header">
        <div>
          <div class="modal-id" id="modalId"></div>
          <h3 class="modal-title" id="modalAssunto"></h3>
        </div>
        <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('open')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div id="modalBody"></div>
    </div>
  </div>

  <!-- Toast -->
  <div id="toast"></div>

  <script src="script.js"></script>
  <script>
  /* ATUALIZAR STATUS */
  async function atualizarStatus(sel) {
    const id     = sel.dataset.id;
    const status = sel.value;
    const fd     = new FormData();
    fd.append('id', id);
    fd.append('status', status);

    try {
      const res  = await fetch('contato.php?acao=status', { method: 'POST', body: fd });
      const data = await res.json();
      showToast(data.mensagem, data.sucesso ? 'sucesso' : 'erro');
    } catch {
      showToast('Erro ao atualizar status.', 'erro');
    }
  }

  /*MODAL DETALHES */
  const catLabels  = {conta:'Conta',pagamento:'Pagamento',tecnico:'Técnico',funcionalidade:'Funcionalidade',sugestao:'Sugestão',outro:'Outro'};
  const prioLabels = {baixa:'Baixa',media:'Média',alta:'Alta'};
  const statLabels = {aberto:'Aberto',andamento:'Em andamento',resolvido:'Resolvido'};

  function verDetalhes(t) {
    document.getElementById('modalId').textContent     = '#' + String(t.id).padStart(4,'0');
    document.getElementById('modalAssunto').textContent = t.assunto;

    const d = new Date(t.criado_em);
    const dt = isNaN(d) ? t.criado_em : d.toLocaleString('pt-BR');

    document.getElementById('modalBody').innerHTML = `
      <div class="modal-row"><strong>Nome</strong>${escHtml(t.nome)}</div>
      <div class="modal-row"><strong>E-mail</strong><a href="mailto:${escHtml(t.email)}" style="color:var(--cyan)">${escHtml(t.email)}</a></div>
      <div class="modal-row"><strong>Categoria</strong>${catLabels[t.categoria] || t.categoria}</div>
      <div class="modal-row"><strong>Prioridade</strong>${prioLabels[t.prioridade] || t.prioridade}</div>
      <div class="modal-row"><strong>Status</strong>${statLabels[t.status] || t.status}</div>
      <div class="modal-row"><strong>Data</strong>${dt}</div>
      <div style="margin-top:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:8px">Mensagem</div>
      <div class="modal-mensagem">${escHtml(t.mensagem)}</div>`;

    document.getElementById('modalOverlay').classList.add('open');
  }

  function fecharModal(e) {
    if (e.target === document.getElementById('modalOverlay')) {
      document.getElementById('modalOverlay').classList.remove('open');
    }
  }

  function escHtml(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* TOAST */
  let toastTimer;
  function showToast(msg, tipo) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'show ' + (tipo || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.className = '', 3000);
  }
  </script>
</body>
</html>
