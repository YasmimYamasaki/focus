<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/PostgreSQLClass.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Método não permitido.'
    ]);
    exit;
}

$email = trim($_POST['email'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'E-mail inválido.'
    ]);
    exit;
}

try {

    $db = new PostgreSQLClass();

    // Buscar usuário

    $usuario = $db->search(
    "SELECT id_usuario 
     FROM usuario
     WHERE reset_token = ?
       AND reset_token_exp > CURRENT_TIMESTAMP
     LIMIT 1",
    [$token],
    true
    );

    // Sempre retorna mensagem genérica
    if (!$cliente) {
        echo json_encode([
            'sucesso'  => true,
            'mensagem' => 'Se este e-mail estiver cadastrado, você receberá um link em breve.'
        ]);
        exit;
    }

    $id   = $cliente['id'];
    $nome = $cliente['nome'];

    // Gerar token

    $token = bin2hex(random_bytes(32)); // 64 chars
    $expiracao = date('Y-m-d H:i:s', strtotime('+1 hour'));

    $db->exec(
    "UPDATE public.usuario
     SET senha_usuario = ?,
         reset_token = NULL,
         reset_token_exp = NULL
     WHERE id_usuario = ?",
    [$senhaHash, $id]
);

    // Enviar e-mail

    $link = "https://tccarandu.free.nf/nova-senha.html?token=" . urlencode($token);

    $assunto = "Recuperação de senha — Arandu";

    $corpo  = "Olá, {$nome}!\n\n";
    $corpo .= "Recebemos uma solicitação para redefinir sua senha.\n";
    $corpo .= "Clique no link abaixo (válido por 1 hora):\n\n";
    $corpo .= $link . "\n\n";
    $corpo .= "Se não foi você, ignore este e-mail.\n\n";
    $corpo .= "Equipe Arandu";

    $headers  = "From: noreply@tccarandu.free.nf\r\n";
    $headers .= "Reply-To: noreply@tccarandu.free.nf\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8";

    mail($email, $assunto, $corpo, $headers);

    echo json_encode([
        'sucesso'  => true,
        'mensagem' => 'Se este e-mail estiver cadastrado, você receberá um link em breve.'
    ]);

} catch (Exception $e) {

    http_response_code(500);
    echo json_encode([
        'sucesso'  => false,
        'mensagem' => 'Erro interno no servidor.'
    ]);
}