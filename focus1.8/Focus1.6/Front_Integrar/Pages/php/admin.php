<?php
// Inicia ou retoma a sessão do usuário
session_start();

// Redireciona se o usuário não estiver logado
if (!isset($_SESSION['id_usuario'])) {
    header("Location: login.html");
    exit;
}

// Bloqueia acesso se usuário não for administrador
if ($_SESSION['perfil_usuario'] !== 'admin') {
    header("Location: dashboard.php");
    exit;
}
