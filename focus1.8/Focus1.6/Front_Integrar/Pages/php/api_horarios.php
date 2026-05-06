<?php
//corrigido
header('Content-Type: application/json');
require_once __DIR__ . '/MySQLClass.php';
session_start();

$mysql = new MySQLClass();
$db = $mysql->getConnection();

$profile_id = $_SESSION['profile_id'] ?? null;

if (!$profile_id) {
    echo json_encode(['error' => 'Sessão expirada']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? $input['action'] ?? null;

// --- 1. LISTAR ATIVIDADES ---
if ($method === 'GET' && $action === 'list') {
    $inicio = $_GET['inicio'] . ' 00:00:00';
    $fim = $_GET['fim'] . ' 23:59:59';

    $sql = "SELECT 
        v.*, 
        sch.scheduling_id, 
        t.tag,          
        t.notes       
        FROM schedulings_view v
        INNER JOIN tasks t ON t.title = v.Task AND t.profile_id = v.Profile_id
        INNER JOIN schedules s ON s.start_time = v.Scheduled_for AND s.profile_id = v.Profile_id
        INNER JOIN schedulings sch ON sch.schedule_id = s.schedule_id AND sch.task_id = t.task_id
        WHERE v.Profile_id = ? 
        AND v.Scheduled_for BETWEEN ? AND ?
        ORDER BY v.Scheduled_for ASC";

    $result = $mysql->searchSafe($sql, [$profile_id, $inicio, $fim]);

    $output = [];
    foreach ($result as $row) {
        $output[date('Y-m-d', strtotime($row['Scheduled_for']))][] = [
            'scheduling_id' => $row['scheduling_id'],
            'done'          => (bool)$row['Done'],
            'title'         => $row['Task'],
            'tag'           => $row['tag'],
            'start'         => date('H:i', strtotime($row['Scheduled_for'])),
            'end'           => $row['Repeats_until'] ? date('H:i', strtotime($row['Repeats_until'])) : '',
            'priority'      => $row['Priority']
        ];
    }
    echo json_encode($output);
    exit;
}

// --- CRIAR ATIVIDADE ---
if ($method === 'POST' && $action === 'create') {
    try {
        $db->begin_transaction();

        $sqlTask = "INSERT INTO tasks (profile_id, title, tag, notes, priority, created_at, updated_at) VALUES (?, ?, ?, ?, 'low', NOW(), NOW())";
        $mysql->execSafe(
            $sqlTask,
            [
                $profile_id,
                $input['title'],
                $input['tag'],
                $input['notes']
            ]
        );
        $task_id = $mysql->lastInsertId();

        $full_start = $input['date'] . ' ' . $input['start'] . ':00';
        $full_end = !empty($input['end']) ? ($input['date'] . ' ' . $input['end'] . ':00') : null;

        $sqlSched = "INSERT INTO schedules (profile_id, start_time, end_time, frequency) VALUES (?, ?, ?, 'once')";
        $mysql->execSafe(
            $sqlSched,
            [$profile_id, $full_start, $full_end]
        );
        $schedule_id = $mysql->lastInsertId();

        $sqlLink = "INSERT INTO schedulings (schedule_id, task_id, done) VALUES (?, ?, 0)";
        $mysql->execSafe(
            $sqlLink,
            [$schedule_id, $task_id]
        );

        $db->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $db->rollback();
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- ALTERAR STATUS (TOGGLE DONE) ---
if ($method === 'POST' && $action === 'toggle_done') {
    $sql = "SELECT done FROM schedulings WHERE scheduling_id = ?";
    $res = $mysql->searchSafe($sql, [$input['id']]);

    if ($res) {
        $newStatus = $res[0]['done'] ? 0 : 1;
        $sqlUp = "UPDATE schedulings SET done = NOT done WHERE scheduling_id = ?";
        $mysql->execSafe($sqlUp, [$input['id']]);
        echo json_encode(['success' => true]);
    }
    exit;
}

// --- DELETAR ATIVIDADE ---
if ($method === 'POST' && $action === 'delete') {
    try {
        $db->begin_transaction();

        $sqlInfo = "SELECT schedule_id, task_id FROM schedulings WHERE scheduling_id = ?";
        $res = $mysql->searchSafe($sqlInfo, [$input['id']]);

        if ($res) {
            $sid = $res[0]['schedule_id'];
            $tid = $res[0]['task_id'];

            $mysql->execSafe("DELETE FROM schedules WHERE schedule_id = ?", [$sid]);
            $mysql->execSafe("DELETE FROM tasks WHERE task_id = ?", [$tid]);
        }

        $db->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $db->rollback();
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// --- LIMPAR SEMANA ---
if ($method === 'POST' && $action === 'clear_week') {
    try {
        $db->begin_transaction();
        $sqlTasks = "DELETE t FROM tasks t
                     INNER JOIN schedulings sch ON t.task_id = sch.task_id
                     INNER JOIN schedules s ON sch.schedule_id = s.schedule_id
                     WHERE s.profile_id = ? 
                     AND DATE(s.start_time) BETWEEN ? AND ?";

        $mysql->execSafe($sqlTasks, [$profile_id, $input['inicio'], $input['fim']]);

        $sqlSchedules = "DELETE FROM schedules 
                         WHERE profile_id = ? 
                         AND DATE(start_time) BETWEEN ? AND ?";

        $mysql->execSafe($sqlSchedules, [$profile_id, $input['inicio'], $input['fim']]);

        $db->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $db->rollback();
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}
