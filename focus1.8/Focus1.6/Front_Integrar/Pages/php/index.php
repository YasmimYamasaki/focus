<?php
//corrigir IA por completo!!!!
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    include "config.php";

    header("Content-Type: text/plain; charset=UTF-8");

    $user = trim($_POST["message"] ?? "");

    if (!$user) {
        echo "Missão vazia detectada. GG! 🚀";
        exit;
    }

    $prompt = str_replace("{USER_INPUT}", $user, $PROMPT);

    // ✅ Modelo corrigido — gemini-flash-lite-latest foi descontinuado
    $model = "gemini-2.5-flash";
    $url   = "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=" . $API_KEY;

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
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_TIMEOUT        => 20,
    ]);

    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        echo "Erro CURL: " . curl_error($ch) . " GG! 🚀";
        exit;
    }
    curl_close($ch);

    $result = json_decode($response, true);

    // Resposta OK
    if (isset($result["candidates"][0]["content"]["parts"][0]["text"])) {
        $text = $result["candidates"][0]["content"]["parts"][0]["text"];
        echo trim(preg_replace('/\s+/', ' ', $text));
        exit;
    }

    // Mostra o erro real da API para facilitar debug
    if (isset($result["error"])) {
        echo "Erro API [" . $result["error"]["code"] . "]: " . $result["error"]["message"];
        exit;
    }

    echo "Resposta inesperada.";
    exit;
}
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

<script src="chat.js"></script>
</body>
</html>
