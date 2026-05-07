<?php 
ob_start();
if (session_status() === PHP_SESSION_NONE) { //corrigido
    session_start();
}

require_once 'MySQLClass.php';
$db = new MySQLClass();

header('Content-Type: application/json; charset=utf-8');

// Verifica se a sessão existe
if (isset($_SESSION['profile_id'])) {
    $profileId = $_SESSION['profile_id'];
 
    try {
        $perfil = $db->searchSafe("SELECT username, streak, xp FROM profiles WHERE profile_id = ? LIMIT 1", [$profileId]);
        
        if (!empty($perfil)) {
            ob_clean();
            echo json_encode([
                'logado'     => true,
                'nome'       => $perfil[0]['username'] ?? $_SESSION['user_nome'] ?? 'Utilizador',
                'foto'       => $_SESSION['user_foto'] ?? null,
                'streak'     => (int)$perfil[0]['streak'],
                'xp'         => (int)$perfil[0]['xp']
            ]);
        } else {
            ob_clean();
            echo json_encode(['logado' => false, 'erro' => 'Perfil nao encontrado no banco']);
        }
    } catch (Exception $e) {
        ob_clean();
        echo json_encode(['logado' => false, 'erro' => 'Erro interno']);
    }
} else {
    ob_clean();
    echo json_encode(['logado' => false, 'erro' => 'Sessao nao encontrada']);
}
exit;