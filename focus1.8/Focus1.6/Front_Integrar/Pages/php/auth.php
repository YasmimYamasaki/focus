<?php
// Inicia ou retoma a sessão ativa
session_start();

// Função para validar login e nível de acesso
function proteger($perfilNecessario = null)
{
    // Redireciona usuário deslogado para tela de login
    if (!isset($_SESSION['id_usuario'])) {
        header("Location: login.html");
        exit;
    }

    // Restringe acesso por perfil de usuário específico
    if (
        $perfilNecessario &&
        $_SESSION['perfil_usuario'] !== $perfilNecessario
    ) {
        header("Location: dashboard.php");
        exit;
    }
}
