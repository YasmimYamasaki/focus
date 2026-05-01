<?php
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
                sch.scheduling_id, 
                sch.done, 
                t.title, 
                t.tag, 
                t.end_time as end, 
                t.notes,
                DATE(s.time) as data_dia,
                TIME_FORMAT(s.time, '%H:%i') as start
            FROM schedulings sch
            JOIN tasks t ON sch.task_id = t.task_id
            JOIN schedules s ON sch.schedule_id = s.schedule_id
            WHERE s.profile_id = ? 
            AND s.time BETWEEN ? AND ?
            ORDER BY s.time ASC";

    $result = $mysql->searchSafe($sql, [$profile_id, $inicio, $fim]);

    $output = [];
    foreach ($result as $row) {
        $output[$row['data_dia']][] = [
            'scheduling_id' => $row['scheduling_id'],
            'done' => (bool)$row['done'],
            'title' => $row['title'],
            'tag' => $row['tag'],
            'start' => $row['start'],
            'end' => $row['end'] ? substr($row['end'], 0, 5) : '',
            'notes' => $row['notes']
        ];
    }
    echo json_encode($output);
    exit;
}

// --- CRIAR ATIVIDADE ---
if ($method === 'POST' && $action === 'create') {
    try {
        $db->begin_transaction();

        $sqlTask = "INSERT INTO tasks (profile_id, title, tag, end_time, notes) VALUES (?, ?, ?, ?, ?)";
        $mysql->execSafe($sqlTask, [$profile_id, $input['title'], $input['tag'], $input['end'], $input['notes']]);
        $task_id = $mysql->lastInsertId();

        $full_time = $input['date'] . ' ' . $input['start'] . ':00';
        $sqlSched = "INSERT INTO schedules (profile_id, time) VALUES (?, ?)";
        $mysql->execSafe($sqlSched, [$profile_id, $full_time]);
        $schedule_id = $mysql->lastInsertId();

        $sqlLink = "INSERT INTO schedulings (schedule_id, task_id, done) VALUES (?, ?, 0)";
        $mysql->execSafe($sqlLink, [$schedule_id, $task_id]);

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
        $sqlUp = "UPDATE schedulings SET done = ? WHERE scheduling_id = ?";
        $mysql->execSafe($sqlUp, [$newStatus, $input['id']]);
        echo json_encode(['success' => true]);
    }
    exit;
}

// --- DELETAR ATIVIDADE ---
if ($method === 'POST' && $action === 'delete') {
    $sql = "DELETE FROM schedulings WHERE scheduling_id = ?";
    $mysql->execSafe($sql, [$input['id']]);
    echo json_encode(['success' => true]);
    exit;
}

// --- LIMPAR SEMANA ---
if ($method === 'POST' && $action === 'clear_week') {
    $sql = "DELETE sch FROM schedulings sch
            JOIN schedules s ON sch.schedule_id = s.schedule_id
            WHERE s.profile_id = ? AND DATE(s.time) BETWEEN ? AND ?";

    $mysql->execSafe($sql, [$profile_id, $input['inicio'], $input['fim']]);
    
    echo json_encode(['success' => true]);
    exit;
}