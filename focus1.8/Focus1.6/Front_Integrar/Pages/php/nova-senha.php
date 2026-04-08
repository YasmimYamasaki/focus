<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . 'PostgreSQLClass.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Método não permitido.'
    ]);
    exit;
}

$token = trim($_POST['token'] ?? '');
$senha = trim($_POST['senha'] ?? '');

if (empty($token) || strlen($senha) < 6) {
    http_response_code(422);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Dados inválidos.'
    ]);
    exit;
}

try {

    $db = new PostgreSQLClass();

    // Verificar token válido

    $cliente = $db->search(
        "SELECT id 
         FROM usuario
         WHERE reset_token = ?
         AND reset_token_exp > NOW()
         LIMIT 1",
        [$token],
        true
    );

    if (!$usuario) {
        http_response_code(400);
        echo json_encode([
            'sucesso'  => false,
            'mensagem' => 'Link inválido ou expirado. Solicite um novo.'
        ]);
        exit;
    }

    $id = $usuario['id'];

    // Atualizar senha

    $senhaHash = password_hash($senha, PASSWORD_BCRYPT);

    $db->exec(
    "UPDATE usuario
     SET reset_token = ?,
         reset_token_exp = CURRENT_TIMESTAMP + INTERVAL '1 hour'
     WHERE id_usuario = ?",
    [$token, $id]
    );

    echo json_encode([
        'sucesso'  => true,
        'mensagem' => 'Senha alterada com sucesso! Redirecionando para o login...'
    ]);

} catch (Exception $e) {

    http_response_code(500);
    echo json_encode([
        'sucesso'  => false,
        'mensagem' => 'Erro interno no servidor.'
    ]);
}