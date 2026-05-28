<?php
// Impede que erros crus quebrem a estrutura do JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/MySQLClass.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$metodo = $_SERVER['REQUEST_METHOD'];
$acao = $_GET['acao'] ?? '';

try {
    $db = new MySQLClass();

    // 1. LOGIN ADMINISTRATIVO (Não exige session profile_id ativa para rodar)
    if ($metodo === 'POST' && $acao === 'login') {
        $email = trim($_POST['email'] ?? '');
        $senha = $_POST['senha'] ?? '';

        $sql = "SELECT u.user_id, u.password, a.adm_id 
                FROM users u 
                INNER JOIN admins a ON u.user_id = a.user_id 
                WHERE u.email = ? LIMIT 1";

        $res = $db->searchSafe($sql, [$email]);
        $usuario = $res[0] ?? null;

        if (!$usuario) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Utilizador não encontrado ou não é Admin.']);
            exit;
        } 
        
        if (!password_verify($senha, $usuario['password'])) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Senha incorreta.']);
            exit;
        } 
        
        $_SESSION['user_id'] = $usuario['user_id'];
        $_SESSION['role'] = 'admin';
        echo json_encode(['sucesso' => true]);
        exit;
    }

    // 2. VALIDAÇÃO DE SESSÃO DO USUÁRIO (Apenas para as demais ações abaixo)
    $profile_id = $_SESSION['profile_id'] ?? null;
    if (!$profile_id) {
        // Retorna HTTP 200 estruturado para o Javascript identificar o objeto 'error' de forma amigável
        echo json_encode(['sucesso' => false, 'error' => 'Sessão expirada', 'tickets' => []]);
        exit;
    }

    // 3. CRIAR CHAMADO
    if ($metodo === 'POST' && empty($acao)) {
        $assunto = trim($_POST['assunto'] ?? '');
        $mensagem = trim($_POST['mensagem'] ?? '');

        if (empty($assunto) || empty($mensagem)) {
            throw new Exception("Assunto e Mensagem são obrigatórios.");
        }

        // Tradução para o ENUM do banco
        $mapPrio = ['baixa' => 'low', 'media' => 'medium', 'alta' => 'high'];
        $prioBanco = $mapPrio[$_POST['prioridade'] ?? 'baixa'] ?? 'low';

        $codigo = "CALL-" . strtoupper(substr(md5(uniqid()), 0, 6));

        $sql = "INSERT INTO calls (code, profile_id, subject, message, priority, status) 
                VALUES (?, ?, ?, ?, ?, 'pending')";

        $db->execSafe($sql, [$codigo, $profile_id, $assunto, $mensagem, $prioBanco]);

        echo json_encode(['sucesso' => true, 'mensagem' => "Protocolo $codigo gerado!"]);
        exit;
    }

    // 4. LISTAR MEUS CHAMADOS
    if ($metodo === 'GET' && isset($_GET['listar'])) {
        $sql = "SELECT code, subject, priority, status, created_at 
                FROM calls WHERE profile_id = ? ORDER BY created_at DESC";

        $tickets = $db->searchSafe($sql, [$profile_id]);
        
        // Garante que se não houver registros, retorne um array vazio válido
        $tickets = is_array($tickets) ? $tickets : [];

        echo json_encode(['sucesso' => true, 'tickets' => $tickets]);
        exit;
    }

    throw new Exception("Ação ou método requisição inválido.");

} catch (Throwable $e) {
    // Captura Erros e Exceptions sem quebrar o JSON com tags HTML
    echo json_encode([
        'sucesso' => false, 
        'error' => 'Erro interno',
        'mensagem' => $e->getMessage() . " na linha " . $e->getLine()
    ]);
    exit;
}