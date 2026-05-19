<?php
error_reporting(0); // Desativa a exibição de erros na resposta do chat
session_start(); // Adicionado para pegar o nome do usuário
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Certifique-se que o config.php existe e tem o loadEnv e o $PROMPT
    include __DIR__ . "/config.php"; 

    header("Content-Type: text/plain; charset=UTF-8");

    $user = trim($_POST["message"] ?? "");

    if (!$user) {
        echo "Missão vazia detectada. GG! 🚀";
        exit;
    }

    $prompt = str_replace("{USER_INPUT}", $user, $PROMPT);

    // Modelo correto e estável
    $model = "gemini-1.5-flash"; 
    $url = "https://generativelanguage.googleapis.com/v1beta/models/" . $model . ":generateContent?key=" . $GOOGLE_API_KEY;

    $data = [
        "contents" => [[
            "parts" => [["text" => $prompt]]
        ]]
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
        CURLOPT_POSTFIELDS     => json_encode($data),
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT        => 20,
    ]);

    $response = curl_exec($ch);
    $result = json_decode($response, true);
    curl_close($ch);

    if (isset($result["candidates"][0]["content"]["parts"][0]["text"])) {
        $text = $result["candidates"][0]["content"]["parts"][0]["text"];
        echo trim(preg_replace('/\s+/', ' ', $text));
    } elseif (isset($result["error"])) {
        echo "Erro API: " . $result["error"]["message"];
    } else {
        echo "🐰 Poppy está offline por um momento. Tente de novo!";
    }
    exit;
}
// Pega o nome do usuário para a saudação inicial
$nomeUsuario = $_SESSION['user_name'] ?? 'estudante';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Focus Assistant</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

<div class="chat-wrapper">
    <div class="chat-header">
        <div class="avatar">.-.</div>
        <div class="header-info">
            <div class="name">Focus Assistant</div>
            <div class="status"><span class="online-dot"></span>online</div>
        </div>
    </div>

    <div class="chat-body" id="chatBody">
        <div class="msg bot">
                Fala, (user)! Pronto para melhorar sua produtividade? Me manda sua missão!
            <div class="msg-time" id="initTime"></div>
        </div>
    </div>

    <div class="chat-footer">
        <textarea
            class="input-box"
            id="userInput"
            placeholder="Digite sua mensagem..."
            rows="1"
        ></textarea>
        <button class="send-btn" id="sendBtn" title="Enviar">
            <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
        </button>
    </div>
</div>

<script src="../js/chat.js" ></script>
</body>
</html>
