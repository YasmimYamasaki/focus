<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Verifica apenas se a role de admin está ativa na sessão
$isAdmin = (isset($_SESSION['role']) && $_SESSION['role'] === 'admin');

echo json_encode([
    'logado' => $isAdmin
]);
exit;