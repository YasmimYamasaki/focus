<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado']);
    exit;
}

require_once __DIR__ . '/../php/MySQLClass.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    $db   = new MySQLClass();
    $conn = $db->getConnection();

    if ($action === 'me' && $method === 'GET') {
        $uid  = (int)($_SESSION['user_id'] ?? 0);
        if ($uid <= 0) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Sessão inválida']);
            exit;
        }
        $stmt = $conn->prepare("SELECT username, photo FROM profiles WHERE user_id = ?");
        $stmt->bind_param("i", $uid);
        $stmt->execute();
        $resultado = $stmt->get_result()->fetch_object();
        $nomeReal = $resultado->username ?? 'Administrador';
        $fotoReal = $resultado->photo ?? null;
        echo json_encode([
            'success' => true,
            'nome' => $nomeReal,
            'foto' => $fotoReal
        ]);
        exit;
    }

    if ($action === 'stats' && $method === 'GET') {
        $totalUsers = (int)($conn->query("SELECT COUNT(*) AS c FROM users")->fetch_object()->c ?? 0);

        /* created_at pode não existir — trata silenciosamente */
        $newToday = 0;
        try {
            $r = $conn->query("SELECT COUNT(*) AS c FROM users WHERE DATE(created_at) = CURDATE()");
            $newToday = (int)($r->fetch_object()->c ?? 0);
        } catch (Throwable $e) {
        }

        $openTickets  = 0;
        $totalTickets = 0;
        try {
            $openTickets  = (int)($conn->query("SELECT COUNT(*) AS c FROM calls WHERE status = 'pending'")->fetch_object()->c ?? 0);
            $totalTickets = (int)($conn->query("SELECT COUNT(*) AS c FROM calls")->fetch_object()->c ?? 0);
        } catch (Throwable $e) {
        }

        echo json_encode([
            'success' => true,
            'stats'   => [
                'total_users'   => $totalUsers,
                'new_today'     => $newToday,
                'open_tickets'  => $openTickets,
                'total_tickets' => $totalTickets,
            ],
        ]);
        exit;
    }

    if ($action === 'recent' && $method === 'GET') {
        $recentUsers = $conn->query("
            SELECT c.call_id AS id, c.code, p.username AS name, u.email, c.subject, c.status, c.priority, c.created_at
                FROM calls c
                LEFT JOIN profiles p ON c.profile_id = p.profile_id
                LEFT JOIN users u ON p.user_id = u.user_id
                ORDER BY c.created_at DESC
                LIMIT 5
        ")->fetch_all(MYSQLI_ASSOC);

        $recentTickets = [];
        try {
            $recentTickets = $conn->query("
                SELECT c.call_id AS id, c.code, p.username AS name, u.email, c.subject, c.status, c.priority, c.created_at
                FROM calls c
                LEFT JOIN profiles p ON c.profile_id = p.profile_id
                LEFT JOIN users u ON p.user_id = u.user_id
                ORDER BY c.created_at DESC
                LIMIT 5
            ")->fetch_all(MYSQLI_ASSOC);
        } catch (Throwable $e) {
        }

        echo json_encode([
            'success'        => true,
            'recent_users'   => $recentUsers,
            'recent_tickets' => $recentTickets,
        ]);
        exit;
    }

    if ($action === 'users' && $method === 'GET') {
        $search = trim($_GET['q'] ?? '');

        if ($search !== '') {
            $stmt = $conn->prepare("
                SELECT u.user_id, u.email, p.username, p.photo, p.xp, p.streak,
                       IF(a.adm_id IS NOT NULL, 1, 0) AS is_admin
                FROM users u
                LEFT JOIN profiles p ON u.user_id = p.user_id
                LEFT JOIN admins   a ON u.user_id = a.user_id
                WHERE p.username LIKE ? OR u.email LIKE ?
                ORDER BY u.user_id DESC
                LIMIT 80
            ");
            $like = "%{$search}%";
            $stmt->bind_param('ss', $like, $like);
        } else {
            $stmt = $conn->prepare("
                SELECT u.user_id, u.email, p.username, p.photo, p.xp, p.streak,
                       IF(a.adm_id IS NOT NULL, 1, 0) AS is_admin
                FROM users u
                LEFT JOIN profiles p ON u.user_id = p.user_id
                LEFT JOIN admins   a ON u.user_id = a.user_id
                ORDER BY u.user_id DESC
                LIMIT 80
            ");
        }

        $stmt->execute();
        $users = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        echo json_encode(['success' => true, 'users' => $users]);
        exit;
    }

    if ($action === 'tickets' && $method === 'GET') {
        $status = $_GET['status'] ?? '';
        $valid  = ['pending', 'replied', 'closed']; // Corresponde aos data-status do HTML

        if ($status && in_array($status, $valid, true)) {
            $stmt = $conn->prepare("
            SELECT c.call_id AS id, c.code, p.username AS name, u.email, c.subject, c.message,
                   c.reply, c.status, c.priority, c.created_at, c.updated_at
            FROM calls c
            LEFT JOIN profiles p ON c.profile_id = p.profile_id
            LEFT JOIN users u ON p.user_id = u.user_id
            WHERE c.status = ?
            ORDER BY c.created_at DESC
            LIMIT 120
        ");
            $stmt->bind_param('s', $status);
        } else {
            // Se for 'all' ou vazio, traz tudo
            $stmt = $conn->prepare("
            SELECT c.call_id AS id, c.code, p.username AS name, u.email, c.subject, c.message,
                   c.reply, c.status, c.priority, c.created_at, c.updated_at
            FROM calls c
            LEFT JOIN profiles p ON c.profile_id = p.profile_id
            LEFT JOIN users u ON p.user_id = u.user_id
            ORDER BY c.created_at DESC
            LIMIT 120
        ");
        }

        $stmt->execute();
        $tickets = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        echo json_encode(['success' => true, 'tickets' => $tickets]);
        exit;
    }

    if ($action === 'update_ticket' && $method === 'POST') {
        $id     = intval($_POST['id']    ?? 0);
        $status = trim($_POST['status'] ?? '');
        $valid  = ['pending', 'replied', 'closed'];

        if ($id <= 0 || !in_array($status, $valid, true)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            exit;
        }

        $stmt = $conn->prepare("UPDATE calls SET status = ?, updated_at = NOW() WHERE call_id = ?");
        $stmt->bind_param('si', $status, $id);
        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Status atualizado com sucesso']);
        exit;
    }

    if ($action === 'delete_user' && $method === 'POST') {
        $userId = intval($_POST['user_id'] ?? 0);
        if ($userId <= 0) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'ID inválido']);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM users WHERE user_id = ?");
        $stmt->bind_param('i', $userId);
        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Usuário deletado com sucesso']);
        exit;
    }

    if ($action === 'reply_ticket' && $method === 'POST') {
        $id    = intval($_POST['id']    ?? 0);
        $reply = trim($_POST['reply']   ?? '');

        if ($id <= 0 || empty($reply)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            exit;
        }

        $stmt = $conn->prepare("UPDATE calls SET reply = ?, replied_at = NOW(), status = 'replied', updated_at = NOW() WHERE call_id = ?");
        $stmt->bind_param('si', $reply, $id);
        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Resposta enviada com sucesso']);
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Ação não encontrada']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno: ' . $e->getMessage()]);
}
