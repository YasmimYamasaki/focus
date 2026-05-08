<?php
//corrigir IA por inteiro!!!!
$API_KEY = "AIzaSyCjXUyCntTxAnBBQADDGNytZLhyIDMOCzQ";


// CONEXÃO COM BANCO
require_once __DIR__ . "/MySQLClass.php";

$conn = getConnection();

if ($conn->connect_error) {
    die("Erro DB: " . $conn->connect_error);
}

// QUERY DOS HÁBITOS
$sql = "
SELECT * FROM tasks_view WHERE Profile_id = 3;
";

$result = $conn->query($sql);

$habits = [];

while ($row = $result->fetch_assoc()) {
    $habits[] = $row;
}

// PROMPT 
$PROMPT = "
Você é um assistente de produtividade humano e direto.

Dados:
" . json_encode($habits, JSON_UNESCAPED_UNICODE) . "

Mensagem:
{USER_INPUT}

REGRAS:
- Responda em UM único parágrafo (sem tópicos, listas ou emojis)
- Linguagem natural, como conversa (não robótico)
- Inclua de forma fluida: produtividade (%), hábitos, insight, melhoria e motivação
- Foque apenas em ações futuras (não altera passado)

FORA DO TEMA:
Se o usuário fugir de produtividade/tarefas, responda apenas:
'Não posso falar sobre outros assuntos aqui, o foco é sua produtividade. Vamos voltar pras suas tarefas e melhorar seu desempenho.'
";