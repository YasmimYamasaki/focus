<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);

require_once __DIR__ . '/MySQLClass.php';
$db = new MySQLClass();

$metodo = $_SERVER['REQUEST_METHOD'];
$acao = $_GET['acao'] ?? '';

// LOGIN ADMINISTRATIVO 
if ($metodo === 'POST' && $acao === 'login') {
    $email = trim($_POST['email'] ?? '');
    $senha = $_POST['senha'] ?? '';

    $sql = "SELECT u.user_id, u.user_password, a.adm_id 
            FROM tb_users u 
            INNER JOIN tb_admins a ON u.user_id = a.user_id 
            WHERE u.user_email = ? LIMIT 1";

    $usuario = $db->search($sql, [$email], true);

    if ($usuario && password_verify($senha, $usuario->user_password)) {
        if (session_status() === PHP_SESSION_NONE)
            session_start();
        $_SESSION['admin_id'] = $usuario->adm_id;
        $_SESSION['role'] = 'admin';

        echo json_encode(['sucesso' => true, 'mensagem' => 'Acesso autorizado! Redirecionando...']);
    } else {
        echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail/Senha incorretos ou privilégio insuficiente.']);
    }
    exit;
}

// LISTAGEM DE CHAMADOS 
if ($metodo === 'GET' && isset($_GET['listar'])) {
    $sql = "SELECT call_id, call_code, call_subject, call_priority, call_status, created_at 
            FROM tb_calls ORDER BY created_at DESC LIMIT 20";
    $tickets = $db->search($sql);
    echo json_encode(['sucesso' => true, 'tickets' => $tickets ?: []]);
    exit;
}

//  CRIAR NOVO CHAMADO 
if ($metodo === 'POST' && empty($acao)) {
    $assunto = trim($_POST['assunto'] ?? '');
    $mensagem = trim($_POST['mensagem'] ?? '');
    $prioridade = $_POST['prioridade'] ?? 'low';

    $call_code = "CALL-" . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));

    try {
        $sql = "INSERT INTO tb_calls (call_code, profile_id, call_subject, call_message, call_priority, call_status) 
                VALUES (?, NULL, ?, ?, ?, 'pending')";

        $db->exec($sql, [$call_code, $assunto, $mensagem, $prioridade]);

        echo json_encode(['sucesso' => true, 'mensagem' => "Chamado #$call_code enviado!"]);
    } catch (Exception $e) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao salvar: ' . $e->getMessage()]);
    }
    exit;
}
