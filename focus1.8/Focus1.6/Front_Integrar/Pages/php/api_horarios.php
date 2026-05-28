<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/MySQLClass.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    $mysql = new MySQLClass();
    $db = $mysql->getConnection();

    $profile_id = $_SESSION['profile_id'] ?? null;

    if (!$profile_id) {
        echo json_encode(['success' => false, 'error' => 'Sessão expirada ou usuário não logado.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? $input['action'] ?? $_POST['acao'] ?? null;

    // --- LISTAR ---
    if ($method === 'GET' && $action === 'list') {
        $dataInicio = !empty($_GET['inicio']) && $_GET['inicio'] !== 'undefined' ? $_GET['inicio'] : date('Y-m-d');
        $dataFim = !empty($_GET['fim']) && $_GET['fim'] !== 'undefined' ? $_GET['fim'] : date('Y-m-d');

        $inicio = $dataInicio . ' 00:00:00';
        $fim = $dataFim . ' 23:59:59';

        $sql = "SELECT 
            sch.scheduling_id, 
            sch.done AS Done, 
            t.title AS Task, 
            t.tag, 
            t.note, 
            t.priority AS Priority,
            s.start_time AS Scheduled_for, 
            s.end_time AS Repeats_until
        FROM schedulings sch
        INNER JOIN tasks t ON sch.task_id = t.task_id
        INNER JOIN schedules s ON sch.schedule_id = s.schedule_id
        WHERE t.profile_id = ? 
          AND s.frequency != 'missao'
          AND s.start_time BETWEEN ? AND ?
        ORDER BY s.start_time ASC";

        $result = $mysql->searchSafe($sql, [$profile_id, $inicio, $fim]);
        $output = [];

        if ($result && is_array($result)) {
            foreach ($result as $row) {
                $scheduledFor = !empty($row['Scheduled_for']) ? $row['Scheduled_for'] : date('Y-m-d H:i:s');
                $dataChave = date('Y-m-d', strtotime($scheduledFor));
                
                $output[$dataChave][] = [
                    'scheduling_id' => $row['scheduling_id'],
                    'done'          => (bool)($row['Done'] ?? false),
                    'title'         => $row['Task'] ?? '',
                    'tag'           => $row['tag'] ?? 'other',
                    'note'          => !empty($row['note']) ? $row['note'] : '',
                    'start'         => date('H:i', strtotime($scheduledFor)),
                    'end'           => !empty($row['Repeats_until']) ? date('H:i', strtotime($row['Repeats_until'])) : '',
                    'priority'      => $row['Priority'] ?? 'low'
                ];
            }
        }

        echo json_encode($output);
        exit;
    }

    // --- CRIAR ---
    if ($method === 'POST' && ($action === 'create' || $action === 'inserir')) {
        if (!isset($db) || !$db) {
            throw new Exception("Conexão com o banco de dados não disponível.");
        }
        
        $db->begin_transaction();

        $titulo = $input['title'] ?? $_POST['titulo'] ?? '';
        $tag    = $input['tag'] ?? $_POST['tag'] ?? 'Outro';
        $notes  = $input['note'] ?? $_POST['note'] ?? ''; 
        $data   = $input['date'] ?? $_POST['date'] ?? date('Y-m-d');
        $inicio = $input['start'] ?? $_POST['start'] ?? '08:00';
        $fim    = $input['end'] ?? $_POST['end'] ?? null;

        if (empty($titulo)) {
            throw new Exception("O título é obrigatório.");
        }

        $sqlTask = "INSERT INTO tasks (profile_id, title, tag, note, priority, created_at) VALUES (?, ?, ?, ?, 'low', NOW())";
        $mysql->execSafe($sqlTask, [$profile_id, $titulo, $tag, $notes]);

        $task_id = $db->insert_id ?? (method_exists($mysql, 'lastInsertId') ? $mysql->lastInsertId() : null);

        if (!$task_id) {
            throw new Exception("Falha ao capturar o ID da tarefa inserida.");
        }

        $frequency = ($input['frequency'] ?? '') === 'weekly' ? 'weekly' : 'once';

        if ($frequency === 'weekly') {
            // Cria um schedule+scheduling para cada ocorrência do mesmo dia da semana no mês
            $selectedDate = new DateTime($data);
            $dayOfWeek    = (int)$selectedDate->format('N'); // 1=Segunda … 7=Domingo

            $cursor = new DateTime($data);
            $cursor->modify('first day of this month');
            while ((int)$cursor->format('N') !== $dayOfWeek) {
                $cursor->modify('+1 day');
            }

            $lastOfMonth = new DateTime($data);
            $lastOfMonth->modify('last day of this month');

            $sqlSched = "INSERT INTO schedules (profile_id, start_time, end_time, frequency, created_at) VALUES (?, ?, ?, 'weekly', NOW())";

            while ($cursor <= $lastOfMonth) {
                $dateStr    = $cursor->format('Y-m-d');
                $full_start = $dateStr . ' ' . $inicio . ':00';
                $full_end   = !empty($fim) ? ($dateStr . ' ' . $fim . ':00') : null;

                $mysql->execSafe($sqlSched, [$profile_id, $full_start, $full_end]);
                $schedule_id = $db->insert_id ?? null;

                if (!$schedule_id) {
                    throw new Exception("Falha ao capturar o ID do cronograma (semanal).");
                }

                $mysql->execSafe(
                    "INSERT INTO schedulings (schedule_id, task_id, done, created_at) VALUES (?, ?, 0, NOW())",
                    [$schedule_id, $task_id]
                );

                $cursor->modify('+1 week');
            }
        } else {
            $full_start = $data . ' ' . $inicio . ':00';
            $full_end   = !empty($fim) ? ($data . ' ' . $fim . ':00') : null;

            $mysql->execSafe(
                "INSERT INTO schedules (profile_id, start_time, end_time, frequency, created_at) VALUES (?, ?, ?, 'once', NOW())",
                [$profile_id, $full_start, $full_end]
            );

            $schedule_id = $db->insert_id ?? (method_exists($mysql, 'lastInsertId') ? $mysql->lastInsertId() : null);

            if (!$schedule_id) {
                throw new Exception("Falha ao capturar o ID do cronograma inserido.");
            }

            $mysql->execSafe(
                "INSERT INTO schedulings (schedule_id, task_id, done, created_at) VALUES (?, ?, 0, NOW())",
                [$schedule_id, $task_id]
            );
        }

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
            if ($checkUsage && $checkUsage[0]['total'] == 0) {
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

    throw new Exception("Ação inválida ou não informada.");

} catch (Throwable $e) {
    if (isset($db) && method_exists($db, 'rollback')) {
        @$db->rollback();
    }
    http_response_code(200); 
    echo json_encode([
        'success' => false,
        'error' => "Erro Interno no PHP: " . $e->getMessage() . " na linha " . $e->getLine() . " do arquivo " . $e->getFile()
    ]);
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