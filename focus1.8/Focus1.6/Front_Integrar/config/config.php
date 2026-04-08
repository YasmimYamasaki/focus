<?php
$credenciais = [
    "host" => "localhost",
    "port" => 5432,
    "db" => "dbfocus",
    "user" => "postgres",
    "password" => "123" 
];

try {
    $conn = new PDO("pgsql:host=" . $credenciais['host'] . ";port=" . $credenciais['port'] . ";dbname=" . $credenciais['db'],
     $credenciais['user'], $credenciais['password']);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);
    $conn->exec("set client_encoding to 'utf8'");
}
catch (PDOException $erro) {
    die($erro->getMessage());
}
?>