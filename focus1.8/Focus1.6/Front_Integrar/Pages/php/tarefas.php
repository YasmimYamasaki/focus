<?php
session_start();
require_once 'MySQLClass.php';
$db = new MySQLClass();

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION["profile_id"])) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Sessão Inválida']);
    exit;
}

$profileId = $_SESSION["profile_id"];
$metodo = $_SERVER['REQUEST_METHOD'];

try {
    // --- LÓGICA DE BUSCA (GET) ---
    if ($metodo === "GET") {
        // SQL robusto que traz o status da tabela de agendamentos
        $sql = "SELECT t.task_id, t.title, COALESCE(s.done, 0) as done 
                FROM tasks t
                LEFT JOIN schedulings s ON t.task_id = s.task_id
                WHERE t.profile_id = ? 
                ORDER BY t.created_at DESC";

        $resultado = $db->searchSafe($sql, [$profileId]);
        echo json_encode($resultado ?: []);
        exit;
    }

    // --- LÓGICA DE AÇÃO (POST) ---
    else if ($metodo === "POST" && isset($_POST['acao'])) {
        $acao = $_POST['acao'];

        // AÇÃO: INSERIR (Sua lógica de Insert Duplo com Schedule automático)
        if ($acao === 'inserir') {
            $titulo = trim($_POST['titulo'] ?? '');
            if (!empty($titulo)) {
                $conn = $db->getConnection();
                try {
                    $conn->begin_transaction();

                    // 1. Garante que existe um Schedule mestre para o perfil
                    $sqlCheckSched = "SELECT schedule_id FROM schedules WHERE profile_id = ? LIMIT 1";
                    $resSched = $db->searchSafe($sqlCheckSched, [$profileId]);

                    if (empty($resSched)) {
                        $db->execSafe("INSERT INTO schedules (profile_id, time) VALUES (?, NOW())", [$profileId]);
                        $sid = $db->lastInsertId();
                    } else {
                        $sid = $resSched[0]['schedule_id'];
                    }

                    // 2. Insere a Task
                    $db->execSafe("INSERT INTO tasks (profile_id, title, priority) VALUES (?, ?, 'low')", [$profileId, $titulo]);
                    $taskId = $db->lastInsertId();

                    // 3. Vínculo obrigatório na schedulings (O Insert Duplo)
                    $db->execSafe("INSERT INTO schedulings (schedule_id, task_id, done) VALUES (?, ?, 0)", [$sid, $taskId]);

                    $conn->commit();
                    echo json_encode(['sucesso' => true]);
                } catch (Exception $e) {
                    $conn->rollback();
                    echo json_encode(['sucesso' => false, 'erro' => $e->getMessage()]);
                }
            }
            exit;
        }

        // AÇÃO: TOGGLE (Correção para garantir a inversão do Done)
        else if ($acao === 'toggle') {
            $task_id = $_POST['task_id'] ?? null;

            if ($task_id) {
                // Usamos IF(done=1, 0, 1) para ser à prova de falhas em qualquer versão de SQL
                $sql = "UPDATE schedulings SET done = IF(done = 1, 0, 1) WHERE task_id = ?";
                $db->execSafe($sql, [$task_id]);
                $db->execSafe("UPDATE profiles SET xp = xp + 5 WHERE profile_id = ?", [$profileId]);

                echo json_encode(['sucesso' => true]);
                exit;
            }
        }

        // AÇÃO: DELETAR (Garante que apaga a task e o agendamento por cascata ou manual)
        else if ($acao === 'deletar') {
            $task_id = $_POST['task_id'] ?? null;
            if ($task_id) {
                // Se o seu banco não tiver ON DELETE CASCADE, delete da schedulings primeiro
                $db->execSafe("DELETE FROM schedulings WHERE task_id = ?", [$task_id]);
                $db->execSafe("DELETE FROM tasks WHERE task_id = ? AND profile_id = ?", [$task_id, $profileId]);
                
                echo json_encode(['sucesso' => true]);
                exit;
            }
        }
    }
} catch (Exception $e) {
    echo json_encode(['sucesso' => false, 'erro' => $e->getMessage()]);
}
exit;