<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once __DIR__ . '/MySQLClass.php';

if (!isset($_SESSION['profile_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Não autenticado']);
    exit;
}

$profile_id = (int)$_SESSION['profile_id'];
$action = $_GET['action'] ?? 'stats';
$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = new MySQLClass();
    $conn = $db->getConnection();
    $mysql = $db;
    

    /* ── estatísticas ── */
    if ($action === 'stats' && $method === 'GET') {
        $period = $_GET['period'] ?? 'weekly'; // daily, weekly, monthly, semester, annual
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0; // Nova variável para deslocamento
        $inicio = $_GET['inicio'] ?? date('Y-m-d');
        $fim = $_GET['fim'] ?? date('Y-m-d');

        // Define período (mesmo padrão que horários, agora com suporte a offset)
        switch ($period) {
            case 'daily':
                $inicio = date('Y-m-d', strtotime("$offset days"));
                $fim = date('Y-m-d', strtotime("$offset days"));
                break;
            case 'weekly':
                // Retrocede 6 dias a partir do offset
                $base = strtotime("$offset weeks");
                $inicio = date('Y-m-d', strtotime('-6 days', $base));
                $fim = date('Y-m-d', $base);
                break;
            case 'monthly':
                // Calcula o mês baseado no offset
                $inicio = date('Y-m-01', strtotime("$offset months"));
                $fim = date('Y-m-t', strtotime("$offset months"));
                break;
            case 'semester':
                $base_time = strtotime(($offset * 6) . " months");
                $month = intval(date('m', $base_time));
                $year = intval(date('Y', $base_time));
                $inicio = $month <= 6 ? "$year-01-01" : "$year-07-01";
                $fim = $month <= 6 ? "$year-06-30" : "$year-12-31";
                break;
            case 'annual':
                $year = intval(date('Y')) + $offset;
                $inicio = $year . '-01-01';
                $fim = $year . '-12-31';
                break;
        }

        $inicio_full = $inicio . ' 00:00:00';
        $fim_full = $fim . ' 23:59:59';

        // Busca tarefas 
        $sql = "SELECT
                    DATE(s.start_time) as data,
                    COUNT(DISTINCT sch.scheduling_id) as total_tarefas,
                    SUM(CASE WHEN sch.done = 1 THEN 1 ELSE 0 END) as completas,
                    SUM(CASE WHEN sch.done = 0 THEN 1 ELSE 0 END) as incompletas
                FROM schedulings sch
                INNER JOIN schedules s ON sch.schedule_id = s.schedule_id
                INNER JOIN tasks t ON sch.task_id = t.task_id
                WHERE t.profile_id = ?
                  AND s.start_time BETWEEN ? AND ?
                GROUP BY DATE(s.start_time)
                ORDER BY data ASC";

        $result = $mysql->searchSafe($sql, [$profile_id, $inicio_full, $fim_full]);

        // Preenche dias vazios
        $allDays = [];
        $current = new DateTime($inicio);
        $endDate = new DateTime($fim);
        while ($current <= $endDate) {
            $dateStr = $current->format('Y-m-d');
            $allDays[$dateStr] = [
                'data' => $dateStr,
                'total_tarefas' => 0,
                'completas' => 0,
                'incompletas' => 0,
                'percentual' => 0
            ];
            $current->modify('+1 day');
        }

        // Preenche com dados 
        foreach ($result as $row) {
            $row['completas'] = (int)$row['completas'];
            $row['incompletas'] = (int)$row['incompletas'];
            $row['total_tarefas'] = (int)$row['total_tarefas'];
            $row['percentual'] = $row['total_tarefas'] > 0 ? round(($row['completas'] / $row['total_tarefas']) * 100) : 0;
            $allDays[$row['data']] = $row;
        }

        // Formata para gráfico
        $chartData = [];
        $chartLabels = [];
        foreach ($allDays as $day) {
            $chartLabels[] = substr($day['data'], 5); // MM-DD
            $chartData[] = $day['percentual'];
        }

        $totalTarefas = array_sum(array_column($allDays, 'total_tarefas'));
        $totalCompletas = array_sum(array_column($allDays, 'completas'));
        $completionRate = $totalTarefas > 0 ? round(($totalCompletas / $totalTarefas) * 100, 1) : 0;

        echo json_encode([
            'success' => true,
            'period' => $period,
            'start_date' => $inicio,
            'end_date' => $fim,
            'daily_stats' => array_values($allDays),
            'chart_labels' => $chartLabels,
            'chart_data' => $chartData,
            'summary' => [
                'total_tarefas' => $totalTarefas,
                'total_completas' => $totalCompletas,
                'completion_rate' => $completionRate
            ]
        ]);
        exit;
    }

    /* ── GET resumo geral ── */
    if ($action === 'summary' && $method === 'GET') {
        $thisMonth = date('Y-m-d', strtotime('first day of this month'));
        $thisMonthEnd = date('Y-m-t');
        $thisMonth_full = $thisMonth . ' 00:00:00';
        $thisMonthEnd_full = $thisMonthEnd . ' 23:59:59';

        // Total de tarefas únicas 
        $sql = "SELECT COUNT(DISTINCT t.task_id) as total
                FROM tasks t
                INNER JOIN schedulings sch ON t.task_id = sch.task_id
                WHERE t.profile_id = ?";
        $res = $mysql->searchSafe($sql, [$profile_id]);
        $totalTasks = (int)($res[0]['total'] ?? 0);

        // Completadas no mês
        $sql = "SELECT COUNT(sch.scheduling_id) as total
                FROM schedulings sch
                INNER JOIN schedules s ON sch.schedule_id = s.schedule_id
                INNER JOIN tasks t ON sch.task_id = t.task_id
                WHERE t.profile_id = ?
                  AND sch.done = 1
                  AND s.start_time BETWEEN ? AND ?";
        $res = $mysql->searchSafe($sql, [$profile_id, $thisMonth_full, $thisMonthEnd_full]);
        $doneThisMonth = (int)($res[0]['total'] ?? 0);

        // Taxa geral
        $sql = "SELECT
                    SUM(CASE WHEN sch.done = 1 THEN 1 ELSE 0 END) as completas,
                    COUNT(DISTINCT sch.scheduling_id) as total
                FROM schedulings sch
                INNER JOIN tasks t ON sch.task_id = t.task_id
                WHERE t.profile_id = ?";
        $res = $mysql->searchSafe($sql, [$profile_id]);
        $overallProgress = 0;
        if ((int)($res[0]['total'] ?? 0) > 0) {
            $overallProgress = round(((int)($res[0]['completas'] ?? 0) / (int)($res[0]['total'] ?? 1)) * 100);
        }

        echo json_encode([
            'success' => true,
            'total_habits' => $totalTasks,
            'done_this_month' => $doneThisMonth,
            'overall_progress' => $overallProgress
        ]);
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Ação não encontrada']);

    

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno: ' . $e->getMessage()]);
}