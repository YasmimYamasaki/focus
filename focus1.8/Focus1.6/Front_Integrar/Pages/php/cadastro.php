<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . "/MySQLClass.php";
//corrigido
try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST")
        throw new Exception("Método inválido.");

    $nome = trim($_POST["nome"] ?? "");
    $sobrenome = trim($_POST["sobrenome"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $senha = $_POST["senha"] ?? "";

    if (empty($nome) || empty($email) || strlen($senha) < 6) {
        throw new Exception("Dados insuficientes para cadastro.");
    }

    /* LÓGICA DE UPLOAD */
    $avatar = null;
    if (isset($_FILES["foto"]) && $_FILES["foto"]["error"] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($_FILES["foto"]["name"], PATHINFO_EXTENSION));
        $pasta_destino = __DIR__ . "/../uploads/fotos/";
        if (!is_dir($pasta_destino))
            mkdir($pasta_destino, 0755, true);

        $avatar = "user_" . uniqid() . "." . $ext;
        move_uploaded_file($_FILES["foto"]["tmp_name"], $pasta_destino . $avatar);
    }

    $conn = getConexao();
    $conn->beginTransaction();

    // 1. Insert tb_users
    $sqlUser = "INSERT INTO tb_users (user_name, user_email, user_password, created_at, updated_at) 
                VALUES (:name, :email, :pass, NOW(), NOW())";
    $stmt = $conn->prepare($sqlUser);
    $stmt->execute([
        ":name" => $nome,
        ":email" => $email,
        ":pass" => password_hash($senha, PASSWORD_DEFAULT)
    ]);

    $userId = $conn->lastInsertId();

    // 2. Insert tb_profiles 
    $sqlProfile = "INSERT INTO tb_profiles (user_id, profile_name, profile_photo, created_at, updated_at) 
                   VALUES (:uid, :pname, :photo, NOW(), NOW())";
    $stmtP = $conn->prepare($sqlProfile);
    $stmtP->execute([
        ":uid" => $userId,
        ":pname" => $nome . " " . $sobrenome,
        ":photo" => $avatar
    ]);

    $conn->commit();
    echo json_encode(["sucesso" => true, "mensagem" => "Cadastro realizado com sucesso!"]);
} catch (Exception $e) {
    if (isset($conn))
        $conn->rollBack();
    echo json_encode(["sucesso" => false, "mensagem" => $e->getMessage()]);
}
