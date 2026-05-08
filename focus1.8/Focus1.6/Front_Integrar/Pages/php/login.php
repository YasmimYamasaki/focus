<?php
set_time_limit(60);
ob_start();
session_start();
header('Content-Type: application/json; charset=utf-8');
//corrigido
require_once __DIR__ . "/MySQLClass.php";

try {
    $mysql = new MySQLClass();
    $conn = $mysql->getConnection(); // Pega a conexão MySQLi

    $email = trim($_POST['email'] ?? '');
    $senha = trim($_POST['password'] ?? ''); 

    if (empty($email) || empty($senha)) {
        throw new Exception("PREENCHA_CAMPOS");
    }

    // Usando Prepare Statement do MySQLi
    $sql = "SELECT 
                u.user_id, 
                u.password,
                p.profile_id, 
                p.username, 
                p.photo, 
                p.xp, 
                p.streak, 
                a.adm_id
            FROM users u
            LEFT JOIN profiles p ON u.user_id = p.user_id
            LEFT JOIN admins a ON u.user_id = a.user_id
            WHERE u.email = ? 
            LIMIT 1";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $usuario = $resultado->fetch_object();

    if ($usuario && password_verify($senha, $usuario->password)) {
        session_regenerate_id(true);

        // Ajuste dos nomes vindos do objeto $usuario
        $_SESSION["user_id"]     = $usuario->user_id;
        $_SESSION["profile_id"]     = $usuario->profile_id;
        $_SESSION["user_nome"]   = $usuario->username;
        $_SESSION["user_foto"]   = $usuario->photo;
        $_SESSION["user_xp"]     = (int)$usuario->xp;
        $_SESSION["user_streak"] = (int)$usuario->streak;

        // Verificação de Admin usando o nome correto da coluna
        if (!empty($usuario->adm_id)) {
            $_SESSION['role'] = 'admin';
            $_SESSION['adm_id'] = $usuario->adm_id;
            $redirect = "adm/painelAdm.php";
        } else {
            $_SESSION['role'] = 'user';
            $redirect = "inicialusuario.html";
        }

        ob_clean();
        echo json_encode([
            "sucesso" => true, 
            "nome" => $usuario->username, 
            "redirect" => $redirect
        ]);
    } else {
        throw new Exception("CREDENCIAIS_INCORRETAS");
    }

} catch (Exception $e) {
    ob_clean();
    echo json_encode(["sucesso" => false, "mensagem" => $e->getMessage()]);
}
exit;