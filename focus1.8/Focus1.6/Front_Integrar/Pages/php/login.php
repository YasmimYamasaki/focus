<?php
ob_start();
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/MySQLClass.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

$email = trim($_POST['email'] ?? '');
$senha = trim($_POST['password'] ?? '');

if (empty($email) || empty($senha)) {
    http_response_code(422);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha e-mail e senha.']);
    exit;
}

try {
    $db = new MySQLClass();

    $sql = "SELECT 
                u.user_id, 
                u.user_name, 
                u.user_password, 
                p.profile_name, 
                p.profile_photo,
                a.adm_id
            FROM tb_users u
            LEFT JOIN tb_profiles p ON u.user_id = p.user_id
            LEFT JOIN tb_admins a ON u.user_id = a.user_id
            WHERE u.user_email = :email LIMIT 1";

    $usuario = $db->search($sql, [":email" => $email], true);

    // Validação de senha
    if (!$usuario || !password_verify($senha, $usuario->user_password)) {
        http_response_code(401);
        echo json_encode(["sucesso" => false, "mensagem" => "E-mail ou senha incorretos."]);
        exit;
    }

    session_regenerate_id(true);

    // Salva na sessão
    $_SESSION["user_id"] = $usuario->user_id;
    $_SESSION["user_nome"] = $usuario->profile_name ?? $usuario->user_name;
    $_SESSION["user_foto"] = $usuario->profile_photo;

    if (!empty($usuario->adm_id)) {
        // Administrador
        $_SESSION["nivel"] = "admin";
        $redirect = "/focus1.8/Focus1.6/Front_Integrar/Pages/adm/dashboard.php";
    } else {
        // Usuário 
        $_SESSION["nivel"] = "usuario";
        $redirect = "/focus1.8/Focus1.6/Front_Integrar/Pages/Dashboard/Dashboard.php";
    }

    echo json_encode([
        "sucesso" => true,
        "nome" => $_SESSION["user_nome"],
        "redirect" => $redirect
    ]);
    exit;

} catch (Exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(["sucesso" => false, "mensagem" => "Erro interno no servidor."]);
}