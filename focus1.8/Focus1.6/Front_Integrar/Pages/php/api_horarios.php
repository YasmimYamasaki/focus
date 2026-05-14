<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/MySQLClass.php';
session_start();

$mysql = new MySQLClass();
$db = $mysql->getConnection();

$profile_id = $_SESSION['profile_id'] ?? null;

if (!$profile_id) {
    echo json_encode(['success' => false, 'error' => 'Sessão expirada']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $input['action'] ?? $_POST['acao'] ?? null;

try {
    // --- LISTAR ---
    if ($method === 'GET' && $action === 'list') {
        $inicio = $_GET['inicio'] . ' 00:00:00';
        $fim = $_GET['fim'] . ' 23:59:59';

        $sql = "SELECT 
            sch.scheduling_id, 
            sch.done as Done, 
            t.title as Task, 
            t.tag, 
            t.note, 
            t.priority as Priority,
            s.start_time as Scheduled_for, 
            s.end_time as Repeats_until
        FROM schedulings sch
        INNER JOIN tasks t ON sch.task_id = t.task_id
        INNER JOIN schedules s ON sch.schedule_id = s.schedule_id
        WHERE t.profile_id = ? 
          AND s.frequency != 'missao'
          AND s.start_time BETWEEN ? AND ?
        ORDER BY s.start_time ASC";

        $result = $mysql->searchSafe($sql, [$profile_id, $inicio, $fim]);

        $output = [];
        foreach ($result as $row) {
            $dataChave = date('Y-m-d', strtotime($row['Scheduled_for']));
            $output[$dataChave][] = [
                'scheduling_id' => $row['scheduling_id'],
                'done'          => (bool)$row['Done'],
                'title'         => $row['Task'],
                'tag'           => $row['tag'],
                'note'          => $row['note'],
                'start'         => date('H:i', strtotime($row['Scheduled_for'])),
                'end'           => $row['Repeats_until'] ? date('H:i', strtotime($row['Repeats_until'])) : '',
                'priority'      => $row['Priority']
            ];
        }
        echo json_encode($output);
        exit;
    }

    // --- CRIAR ---
    if ($method === 'POST' && ($action === 'create' || $action === 'inserir')) {
        $db->begin_transaction();

        $titulo = $input['title'] ?? $_POST['titulo'] ?? '';
        $tag    = $input['tag'] ?? $_POST['tag'] ?? 'Outro';
        $notes  = $input['note'] ?? $_POST['note'] ?? '';
        $data   = $input['date'] ?? $_POST['date'] ?? date('Y-m-d');
        $inicio = $input['start'] ?? $_POST['start'] ?? '08:00';
        $fim    = $input['end'] ?? $_POST['end'] ?? null;

        if (empty($titulo)) throw new Exception("O título é obrigatório.");

        $sqlTask = "INSERT INTO tasks (profile_id, title, tag, note, priority, created_at) VALUES (?, ?, ?, ?, 'low', NOW())";
        $mysql->execSafe($sqlTask, [$profile_id, $titulo, $tag, $notes]);
        $task_id = $mysql->lastInsertId();

        $full_start = $data . ' ' . $inicio . ':00';
        $full_end   = !empty($fim) ? ($data . ' ' . $fim . ':00') : null;

        $sqlSched = "INSERT INTO schedules (profile_id, start_time, end_time, frequency) VALUES (?, ?, ?, 'once')";
        $mysql->execSafe($sqlSched, [$profile_id, $full_start, $full_end]);
        $schedule_id = $mysql->lastInsertId();

        $mysql->execSafe("INSERT INTO schedulings (schedule_id, task_id, done) VALUES (?, ?, 0)", [$schedule_id, $task_id]);

        $db->commit();
        echo json_encode(['success' => true]);
        exit;
    }

    // --- DELETAR (UNITÁRIO) ---
    if ($method === 'POST' && $action === 'delete') {
        $db->begin_transaction();
        $sqlInfo = "SELECT schedule_id, task_id FROM schedulings WHERE scheduling_id = ?";
        $res = $mysql->searchSafe($sqlInfo, [$input['id']]);

        if ($res) {
            $sid = $res[0]['schedule_id'];
            $tid = $res[0]['task_id'];
            $mysql->execSafe("DELETE FROM schedulings WHERE scheduling_id = ?", [$input['id']]);
            $mysql->execSafe("DELETE FROM schedules WHERE schedule_id = ?", [$sid]);
            $checkUsage = $mysql->searchSafe("SELECT COUNT(*) as total FROM schedulings WHERE task_id = ?", [$tid]);
            if ($checkUsage[0]['total'] == 0) {
                $mysql->execSafe("DELETE FROM tasks WHERE task_id = ?", [$tid]);
            }
        }
        $db->commit();
        echo json_encode(['success' => true]);
        exit;
    }

    // --- LIMPAR SEMANA TODA ---
    if ($method === 'POST' && $action === 'clear_week') {
        $db->begin_transaction();

        $sqlDelete = "DELETE FROM schedulings 
                      WHERE scheduling_id IN (
                          SELECT temp.id FROM (
                              SELECT sch.scheduling_id as id 
                              FROM schedulings sch
                              INNER JOIN schedules s ON sch.schedule_id = s.schedule_id
                              WHERE s.profile_id = ? 
                                AND s.start_time BETWEEN ? AND ?
                          ) AS temp
                      )";
        
        $mysql->execSafe($sqlDelete, [
            $profile_id, 
            $input['inicio'] . ' 00:00:00', 
            $input['fim'] . ' 23:59:59'
        ]);

        $mysql->execSafe("DELETE FROM schedules WHERE profile_id = ? AND schedule_id NOT IN (SELECT schedule_id FROM schedulings)", [$profile_id]);
        $mysql->execSafe("DELETE FROM tasks WHERE profile_id = ? AND task_id NOT IN (SELECT task_id FROM schedulings)", [$profile_id]);

        $db->commit();
        echo json_encode(['success' => true]);
        exit;
    }

    // --- ALTERAR STATUS (DONE) ---
    if ($method === 'POST' && $action === 'toggle_done') {
        $id = $input['id'] ?? null;
        $mysql->execSafe("UPDATE schedulings SET done = NOT done WHERE scheduling_id = ?", [$id]);
        echo json_encode(['success' => true]);
        exit;
    }

} catch (Exception $e) {
    if (isset($db) && $db->connect_errno == 0) @$db->rollback();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}


//
/* codigo com modal novo a ser implementado



if ($method === 'POST' && $action === 'create') {

    try {

        $db->begin_transaction();

        $sqlTask = "INSERT INTO tasks (profile_id, title, tag, notes, priority, created_at) VALUES (?, ?, ?, ?, 'low', NOW())";

        $mysql->execSafe($sqlTask, [$profile_id, $input['title'], $input['tag'], $input['notes']]);

        $task_id = $mysql->lastInsertId();



        $full_start = $input['date'] . ' ' . $input['start'] . ':00';

        $full_end = !empty($input['end']) ? ($input['date'] . ' ' . $input['end'] . ':00') : null;



        $sqlSched = "INSERT INTO schedules (profile_id, start_time, end_time, frequency) VALUES (?, ?, ?, ?)";

        $mysql->execSafe($sqlSched, [$profile_id, $full_start, $full_end, $input['frequency'] ?? 'once']);

        $schedule_id = $mysql->lastInsertId();



        $mysql->execSafe("INSERT INTO schedulings (schedule_id, task_id, done) VALUES (?, ?, 0)", [$schedule_id, $task_id]);

        $db->commit();

        echo json_encode(['success' => true]);

    } catch (Exception $e) {

        $db->rollback();

        echo json_encode(['error' => $e->getMessage()]);

    }

    exit;

}
*/