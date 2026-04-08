<?php
include "config.php";

header("Content-Type: text/plain; charset=UTF-8");

$user = $_POST["message"] ?? "";

if (!$user) {
    echo "🐰 Missão vazia detectada. GG! 🚀";
    exit;
}

// Substitui placeholder "STRING" pelo input do usuário
$prompt = str_replace("STRING", $user, $PROMPT);

// Modelo Free Tier confiável
$model = "gemini-flash-lite-latest";

// URL da API
$url = "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=" . $API_KEY;

// Corpo da requisição
$data = [
    "contents" => [
        [
            "parts" => [
                ["text" => $prompt]
            ]
        ]
    ]
];

// cURL
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_SSL_VERIFYPEER => false, // WAMP local
    CURLOPT_SSL_VERIFYHOST => false
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo "🐰 Erro CURL: " . curl_error($ch) . " GG! 🚀";
    exit;
}

curl_close($ch);

// Decodifica JSON
$result = json_decode($response, true);

// Se a API retornou texto
if (isset($result["candidates"][0]["content"]["parts"][0]["text"])) {
    $text = $result["candidates"][0]["content"]["parts"][0]["text"];
    // Limpa quebras de linha extras
    $text = trim(preg_replace('/\s+/', ' ', $text));
    echo $text; // Só o texto final
} else {
    echo "🐰 A API não retornou texto ou a cota foi excedida. GG! 🚀";
}
