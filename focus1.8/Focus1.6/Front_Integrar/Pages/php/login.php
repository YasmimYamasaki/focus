<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Carrega classe de manipulação do banco PostgreSQL
require_once __DIR__ . '/PostgreSQLClass.php';

// Rejeita requisições que não sejam do tipo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

// Captura e limpa dados de login enviados
$email = trim($_POST['username'] ?? '');
$senha = trim($_POST['password'] ?? '');

// Verifica se os campos obrigatórios foram preenchidos
if (empty($email) || empty($senha)) {
    http_response_code(422);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha e-mail e senha.']);
    exit;
}

try {

    $pgsql = new PostgreSQLClass();

    // Busca dados do usuário pelo e-mail fornecido
    $usuario = $pgsql->search(
    "SELECT id_usuario, nome_usuario, senha_usuario
     FROM usuario
     WHERE email_usuario = :email
     LIMIT 1",
    [":email" => $email],
    true
);

    // Retorna erro caso e-mail não seja encontrado
    if (!$usuario) {
        http_response_code(401);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário ou senha inválidos.']);
        exit;
    }

    // Compara senha enviada com o hash criptografado
    $senhaValida = $pgsql->search(
    "SELECT senha_usuario = crypt(:senha, senha_usuario) AS valido
     FROM usuario
     WHERE id_usuario = :id",
    [
        ":senha" => $senha,
        ":id"    => $usuario->id_usuario
    ],
    true
);

    // Valida se a senha está correta
    if (!$senhaValida->valido) {
        http_response_code(401);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário ou senha inválidos.']);
        exit;
    }

    // Gera novo ID de sessão por segurança
    session_regenerate_id(true);

    // Salva dados essenciais do usuário na sessão
    $_SESSION['id_usuario']   = $usuario->id_usuario;
    $_SESSION['email_usuario'] = $usuario->nome_usuario; //email = nome (corrigir assim que o banco de dados estiver pronto)
    $_SESSION['perfil_usuario'] = $usuario->perfil_usuario;

    // Define destino baseado no nível de acesso
    $redirect = $usuario->perfil_usuario === 'admin'
    ? '../admin.php'
    : '../dashboard.php';

    // Retorna sucesso e URL de redirecionamento
    echo json_encode([
        'sucesso'  => true,
        'nome'     => $usuario->nome_usuario,
        'redirect' => $redirect
    ]);

} catch (PDOException $e) {
    // Trata falhas de conexão ou erros SQL
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro interno.']);
}