<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/MySQLClass.php';
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$profile_id = $_SESSION['profile_id'] ?? null;

if (!$profile_id) {
    echo json_encode(['success' => false, 'error' => 'Sessão expirada']);
    exit;
}

$db = new MySQLClass();
$metodo = $_SERVER['REQUEST_METHOD'];
$acao = $_GET['acao'] ?? '';

try {
    // LOGIN ADMINISTRATIVO
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
        } else if (!password_verify($senha, $usuario['password'])) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Senha incorreta.']);
        } else {
            $_SESSION['user_id'] = $usuario['user_id'];
            $_SESSION['role'] = 'admin';
            echo json_encode(['sucesso' => true]);
        }
        exit;
    }


    // CRIAR CHAMADO
    if ($metodo === 'POST' && empty($acao)) {
        if (!isset($_SESSION['profile_id'])) {
            throw new Exception("Sessão expirada. Faça login novamente.");
        }

        $profileId = $_SESSION['profile_id'];
        $assunto = trim($_POST['assunto'] ?? '');
        $mensagem = trim($_POST['mensagem'] ?? '');

        // Tradução para o ENUM do banco
        $mapPrio = ['baixa' => 'low', 'media' => 'medium', 'alta' => 'high'];
        $prioBanco = $mapPrio[$_POST['prioridade'] ?? 'baixa'] ?? 'low';

        $codigo = "CALL-" . strtoupper(substr(md5(uniqid()), 0, 6));

        $sql = "INSERT INTO calls (code, profile_id, subject, message, priority, status) 
                VALUES (?, ?, ?, ?, ?, 'pending')";

        $db->execSafe($sql, [$codigo, $profileId, $assunto, $mensagem, $prioBanco]);

        echo json_encode(['sucesso' => true, 'mensagem' => "Protocolo $codigo gerado!"]);
        exit;
    }

    // LISTAR MEUS CHAMADOS
    if ($metodo === 'GET' && isset($_GET['listar'])) {
        $profile_id = (int)($_SESSION['profile_id'] ?? null);

        if ($profile_id <= 0) {
            http_response_code(401);
            echo json_encode(["Sessão expirada. Faça login novamente."]);
        }

        $sql = "SELECT code, subject, priority, status, created_at 
                FROM calls WHERE profile_id = ? ORDER BY created_at DESC";

        $tickets = $db->searchSafe($sql, [$profile_id]);
        echo json_encode(['sucesso' => true, 'tickets' => $tickets]);
        exit;
    }
} catch (Exception $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => $e->getMessage()]);
}
