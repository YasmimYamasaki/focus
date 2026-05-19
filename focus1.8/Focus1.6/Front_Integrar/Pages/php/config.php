<?php
error_reporting(0);
ini_set('display_errors', 0);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

loadEnv('C:/wamp64/www/.env');

$GOOGLE_API_KEY = $_ENV["GOOGLE_API_KEY"] ?? ''; 


$profile_id = $_SESSION['profile_id'] ?? null;

if (!$profile_id) {
    die("Erro: Usuário não identificado. Por favor, faça login.");
}

function loadEnv($path) {
    if (!file_exists($path)) {
        throw new Exception("Nenhum arquivo .env Detectado!");
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(trim($name) . "=" . trim($value));
    }
}

$conn = new mysqli($_ENV['DB_HOST1'], $_ENV['DB_USER1'], $_ENV['DB_PASS1'], $_ENV['DB_NAME1']);

if ($conn->connect_error) {
    die("Erro DB: " . $conn->connect_error);
}

$stmt = $conn->prepare("SELECT Task, Completed, Total_Tasks FROM tasks_view WHERE Profile_id = ?");
$stmt->bind_param("i", $profile_id);
$stmt->execute();
$result = $stmt->get_result();

$data_summary = "";
$total_done = 0;
$total_all = 0;

while ($row = $result->fetch_assoc()) {
    $data_summary .= "{$row['Task']}:{$row['Completed']}/{$row['Total_Tasks']}; ";
    $total_done += (int)$row['Completed'];
    $total_all += (int)$row['Total_Tasks'];
}

$percentage = ($total_all > 0) ? round(($total_done / $total_all) * 100) : 0;

$USER_INPUT = "Como posso melhorar hoje?"; 


$PROMPT = "
Você é um Coach de Produtividade direto e humano.

CONTEXTO:
Dados (Tarefa:Feito/Total): $data_summary
Produtividade Atual: $percentage%

MENSAGEM:
{USER_INPUT}

DIRETRIZES:
- Parágrafo único, sem listas ou emojis.
- Tom natural de conversa; evite ser robótico.
- OBRIGATÓRIO incluir: a porcentagem, análise de hábitos, um insight técnico, sugestão de melhoria e motivação.
- FOCO: Ações futuras (ignore o passado).

BLOQUEIO:
Se o input fugir de tarefas ou foco, responda EXATAMENTE: 'Não posso falar sobre outros assuntos aqui, o foco é sua produtividade. Vamos voltar pras suas tarefas e melhorar seu desempenho.'
";

// Aqui seguiria a sua chamada de CURL para a API enviando o $PROMPT
?>