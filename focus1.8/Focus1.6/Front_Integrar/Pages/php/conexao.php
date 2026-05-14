<?php
loadEnv('C:/wamp64/www/.env'); //mudar sempre que abrir nova connection

//Bloco referente ao .env do arquivo
function loadEnv($path)
{
    if (!file_exists($path)) {
        throw new Exception("Nenhum arquivo .env Detectado!" . mysqli_connect_error());
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;

        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(trim($name) . "=" . trim($value));
    }
}
function getConexao() //corrigido
{ 

    $host = getenv('DB_HOST');
    $user = getenv('DB_USER');
    $pass = getenv('DB_PASS');
    $db   = getenv('DB_NAME');

    $conn = mysqli_init();

    // Define 30 segundos de espera antes de dar erro
    mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 30);

    // Tenta conectar
    if (!@mysqli_real_connect($conn, $host, $user, $pass, $db)) {
        throw new Exception("Falha na conexão remota: " . mysqli_connect_error());
    }

    return $conn;
}
