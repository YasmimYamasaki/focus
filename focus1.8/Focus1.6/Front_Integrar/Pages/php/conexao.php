<?php
function getConexao() { //corrigido
   /* $host = "tcc_bd7.mysql.dbaas.com.br"; // Use o IP direto para ser mais rápido
    $user = "tcc_bd7";
    $pass = "ROSA123456a#";
    $db   = "tcc_bd7"; */

    //banco local (cred acima ser referente ao servidor)
    $host = "localhost"; // Use o IP direto para ser mais rápido
    $user = "root";
    $pass = "";
    $db   = "focuslocal1"; //substituir com o nome local atual

    $conn = mysqli_init();
    
    // Define 30 segundos de espera antes de dar erro
    mysqli_options($conn, MYSQLI_OPT_CONNECT_TIMEOUT, 30);

    // Tenta conectar
    if (!@mysqli_real_connect($conn, $host, $user, $pass, $db)) {
        throw new Exception("Falha na conexão remota: " . mysqli_connect_error());
    }

    return $conn;
}