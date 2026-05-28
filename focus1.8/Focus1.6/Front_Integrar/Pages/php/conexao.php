<?php

// Bloco de carregamento do arquivo .env
function loadEnv($path)
{
    if (!file_exists($path)) {
        throw new Exception("Nenhum arquivo .env Detectado!");
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $_ENV[trim($name)] = trim($value);
            putenv(trim($name) . "=" . trim($value));
        }
    }
} 

// Função de conexão
function getConexao() 
{ 
    try {
        loadEnv('C:/wamp64/www/.env');
    } catch (Exception $e) {
    }

    $host = getenv('DB_HOST');
    $user = getenv('DB_USER');
    $pass = getenv('DB_PASS');
    $db   = getenv('DB_NAME');

    if (!$host || !$user) {
        throw new Exception("Erro: Variáveis de ambiente do banco de dados não foram definidas no .env.");
    }

    $conn = mysqli_init();

    // Define 30 segundos de espera antes de dar erro de timeout
    mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 30);

    if (!@mysqli_real_connect($conn, $host, $user, $pass, $db)) {
        throw new Exception("Falha na conexão com o banco de dados: " . mysqli_connect_error());
    }

    mysqli_set_charset($conn, "utf8mb4");

    return $conn;
}