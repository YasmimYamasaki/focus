<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/MySQLClass.php'; 
session_start();

$mysql = new MySQLClass();
$profile_id = $_SESSION['profile_id'] ?? null;

if (!$profile_id) {
    echo json_encode(['success' => false, 'error' => 'Sessão expirada']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    // --- BUSCAR DADOS DO PERFIL (GET) ---
    if ($method === 'GET') {
        $sql = "SELECT p.*, u.email,
                (SELECT COUNT(*) FROM schedulings sch 
                 INNER JOIN schedules s ON sch.schedule_id = s.schedule_id 
                 WHERE s.profile_id = p.profile_id AND sch.done = 1) as total_concluido
                FROM profiles p 
                INNER JOIN users u ON p.user_id = u.user_id 
                WHERE p.profile_id = ?";

        $res = $mysql->searchSafe($sql, [$profile_id]);
        if (!$res) throw new Exception("Perfil não encontrado");

        echo json_encode(['success' => true, 'data' => $res[0]]);
        exit;
    }

    // --- AÇÕES DE ATUALIZAÇÃO (POST) ---
    if ($method === 'POST') {
        $acao = $_POST['acao'] ?? '';

        //  SALVAR SEGURANÇA (Email e Senha)
        if ($acao === 'update_security') {
            $email = $_POST['email'] ?? '';
            $password = $_POST['password'] ?? '';

            $conn = $mysql->getConnection();
            $conn->begin_transaction();

            $mysql->execSafe("UPDATE users u 
                              INNER JOIN profiles p ON p.user_id = u.user_id 
                              SET u.email = ? WHERE p.profile_id = ?", [$email, $profile_id]);

            if (!empty($password)) {
                $hash = password_hash($password, PASSWORD_DEFAULT);
                $mysql->execSafe("UPDATE users u 
                                  INNER JOIN profiles p ON p.user_id = u.user_id 
                                  SET u.password = ? WHERE p.profile_id = ?", [$hash, $profile_id]);
            }

            $conn->commit();
            echo json_encode(['success' => true]);
            exit;
        }

        //  ATUALIZAR DADOS PESSOAIS
        if ($acao === 'update_personal') {
            $username = $_POST['username'] ?? '';

            $sql = "UPDATE profiles SET username = ?, updated_at = NOW() WHERE profile_id = ?";
            $mysql->execSafe($sql, [$username, $profile_id]);

            echo json_encode(['success' => true]);
            exit;
        }

        //  ATUALIZAR FOTO
        if ($acao === 'update_photo') {
            if (!isset($_FILES['photo'])) throw new Exception("Arquivo não enviado");

            $file = $_FILES['photo'];
            $file = $_FILES['photo'];
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

            if (!in_array($ext, $allowed)) {
                throw new Exception("Formato de imagem inválido. Use JPG, PNG, WebP ou GIF.");
            }
            if (!getimagesize($file['tmp_name'])) {
                throw new Exception("O arquivo enviado não é uma imagem válida.");
            }

            $newName = "user_" . uniqid() . "." . $ext;
            $newName = "user_" . uniqid() . "." . $ext;
            $path = "uploads/" . $newName;

            if (move_uploaded_file($file['tmp_name'], __DIR__ . "/" . $path)) {
                $mysql->execSafe("UPDATE profiles SET photo = ? WHERE profile_id = ?", [$newName, $profile_id]);
                echo json_encode(['success' => true, 'photo' => $path]);
            } else {
                throw new Exception("Falha ao mover arquivo. Verifique permissões da pasta uploads.");
            }
            exit;
        }
    }
} catch (Exception $e) {
    if (isset($conn) && $method === 'POST') {
        $conn->rollback();
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
