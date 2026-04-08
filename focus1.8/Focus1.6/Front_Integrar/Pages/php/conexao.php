<?php

//Configuração e conexão com PostgreSQL

define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'dbfocus');
define('DB_USER', 'postgres');
define('DB_PASS', '123');
define('DB_CHARSET', 'utf8');

function getConexao(): PDO
{
    $dsn = "pgsql:host=" . DB_HOST .
        ";port=" . DB_PORT .
        ";dbname=" . DB_NAME;


    try {
        $conn = new PDO($dsn, DB_USER, DB_PASS);

        // Tratamento robusto de erros
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Retorno como objeto (mais limpo para APIs)
        $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);

        // Encoding
        $conn->exec("SET client_encoding TO '" . DB_CHARSET . "'");

        return $conn;
    } catch (PDOException $e) {

        error_log("Erro de conexão: " . $e->getMessage());
        http_response_code(500);

        die(json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro interno no servidor. Tente novamente mais tarde.'
        ]));
    }
}
