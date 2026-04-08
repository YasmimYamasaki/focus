<?php
// contato.php — Gerencia chamados de suporte via PostgreSQLClass
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/PostgreSQLClass.php';

// Instancia a classe de conexão
$pgsql = new PostgreSQLClass();

$metodo = $_SERVER['REQUEST_METHOD'];
$acao   = $_GET['acao']   ?? '';
$listar = $_GET['listar'] ?? '';

// GET ?listar=1 — Retorna tickets recentes
if ($metodo === 'GET' && $listar === '1') {
    // Busca os últimos 20 chamados de forma simplificada
    $tickets = $pgsql->search("
        SELECT id, assunto, categoria, prioridade, status, criado_em
        FROM chamados_suporte
        ORDER BY criado_em DESC
        LIMIT 20
    ");

    echo json_encode(['sucesso' => true, 'tickets' => $tickets]);
    exit;
}

// POST ?acao=status — Atualiza status (Admin)
if ($metodo === 'POST' && $acao === 'status') {
    $id     = intval($_POST['id'] ?? 0);
    $status = trim($_POST['status'] ?? '');
    $validos = ['aberto', 'andamento', 'resolvido'];

    if ($id <= 0 || !in_array($status, $validos)) {
        http_response_code(422);
        exit(json_encode(['sucesso' => false, 'mensagem' => 'Dados inválidos.']));
    }

    // Executa o update usando a lógica da classe
    $linhasAfetadas = $pgsql->exec(
        "UPDATE chamados_suporte SET status = :status WHERE id = :id",
        [":status" => $status, ":id" => $id]
    );

    echo json_encode([
        'sucesso'  => $linhasAfetadas > 0,
        'mensagem' => $linhasAfetadas > 0 ? 'Status atualizado.' : 'Chamado não encontrado.'
    ]);
    exit;
}

// POST (sem acao) — Recebe novo chamado
if ($metodo !== 'POST') {
    http_response_code(405);
    exit(json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']));
}

// Sanitização dos dados de entrada
$nome       = trim($_POST['nome'] ?? '');
$email      = trim($_POST['email'] ?? '');
$categoria  = trim($_POST['categoria'] ?? '');
$assunto    = trim($_POST['assunto'] ?? '');
$mensagem   = trim($_POST['mensagem'] ?? '');
$prioridade = trim($_POST['prioridade'] ?? 'baixa');
$ip         = $_SERVER['REMOTE_ADDR'] ?? null;

// Validações básicas
$erros = [];
if (strlen($nome) < 2) $erros[] = 'Nome muito curto.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $erros[] = 'E-mail inválido.';
if (strlen($assunto) < 5) $erros[] = 'Assunto muito curto.';
if (strlen($mensagem) < 10) $erros[] = 'Mensagem muito curta.';

if (!empty($erros)) {
    http_response_code(422);
    exit(json_encode(['sucesso' => false, 'mensagem' => implode(' ', $erros)]));
}

// Rate limiting: Máximo 5 chamados por hora por IP
if ($ip) {
    $check = $pgsql->search("
        SELECT COUNT(*) as total FROM chamados_suporte
        WHERE ip = :ip AND criado_em > NOW() - INTERVAL '1 hour'",
        [":ip" => $ip],
        true // Retorna apenas uma linha (objeto)
    );

    if ($check && $check->total >= 5) {
        http_response_code(429);
        exit(json_encode(['sucesso' => false, 'mensagem' => 'Muitos pedidos. Aguarde 1 hora.']));
    }
}

// Inserção no banco de dados
try {
    $sql = "INSERT INTO chamados_suporte 
            (nome, email, categoria, assunto, mensagem, prioridade, ip, criado_em)
            VALUES 
            (:nome, :email, :cat, :ass, :msg, :prio, :ip, NOW())";

    $pgsql->exec($sql, [
        ":nome"  => $nome,
        ":email" => $email,
        ":cat"   => $categoria,
        ":ass"   => $assunto,
        ":msg"   => $mensagem,
        ":prio"  => $prioridade,
        ":ip"    => $ip
    ]);

    echo json_encode(['sucesso' => true, 'mensagem' => 'Chamado aberto com sucesso!']);
} catch (PDOException $e) {
    error_log("Erro no suporte: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro interno ao salvar chamado.']);
}