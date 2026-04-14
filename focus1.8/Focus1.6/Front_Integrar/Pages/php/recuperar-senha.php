<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require __DIR__ . '/../PHPMailer/Exception.php';
require __DIR__ . '/../PHPMailer/PHPMailer.php';
require __DIR__ . '/../PHPMailer/SMTP.php';
require_once __DIR__ . '/senha_email.php'; 
require_once __DIR__ . "/MySQLClass.php";

header('Content-Type: application/json; charset=utf-8');


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

$email = trim($_POST['email'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail inválido.']);
    exit;
}

try {
    $db = new MySQLClass();

    /* BUSCAR USUÁRIO PELO EMAIL */
    $usuario = $db->search(
        "SELECT id, name FROM users WHERE email = ? LIMIT 1",
        [$email],
        true
    );

    // Resposta genérica por segurança
    if (!$usuario) {
        echo json_encode([
            'sucesso'  => true,
            'mensagem' => 'Se este e-mail estiver cadastrado, você receberá um link em breve.'
        ]);
        exit;
    }

    /* GERAR TOKEN SEGURO */
    $token = bin2hex(random_bytes(32));
    $expiracao = date('Y-m-d H:i:s', strtotime('+1 hour'));

    /* SALVAR TOKEN NO BANCO */
    $db->exec(
        "UPDATE users SET reset_token = ?, reset_token_exp = ? WHERE id = ?",
        [$token, $expiracao, $usuario->id]
    );

    /* CONFIGURAÇÃO DE ENVIO COM PHPMAILER */
    $mail = new PHPMailer(true);

    // Configurações do Servidor
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = USER; // Definido em SENHAEMAIL.php
    $mail->Password   = PWD;  // Definido em SENHAEMAIL.php
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->CharSet    = 'UTF-8';

    // Destinatário
    $mail->setFrom(USER, 'Equipe Focus');
    $mail->addAddress($email, $usuario->name);

    // Conteúdo em HTML
    $link = "http://localhost/focus1.8/Focus1.6/Front_Integrar/Pages/nova-senha.html?token=" . urlencode($token);
    $mail->isHTML(true);
    $mail->Subject = "Recuperação de senha — Focus";
    
    $mail->Body = "
        <div style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>
            <h2>Olá, {$usuario->name}!</h2>
            <p>Recebemos uma solicitação para redefinir sua senha.</p>
            <p>Clique no link abaixo (válido por 1 hora) para criar uma nova senha:</p>
            <p><a href='{$link}' style='display:inline-block; padding:10px 20px; background-color:#6a11cb; color:white; text-decoration:none; border-radius:5px;'>Redefinir Senha</a></p>
            <p>Se não foi você, ignore este e-mail.</p>
            <hr>
            <p style='font-size: 12px;'>Equipe Focus</p>
        </div>";

    $mail->AltBody = "Olá, {$usuario->name}! Copie e cole o link no navegador para redefinir sua senha: {$link}";

    $mail->send();

    echo json_encode([
        'sucesso'  => true,
        'mensagem' => 'Se este e-mail estiver cadastrado, você receberá um link em breve.'
    ]);

} catch (Exception $e) {
    // Log interno do erro para depuração
    error_log("Erro no envio: " . $mail->ErrorInfo);

    http_response_code(500);
    echo json_encode([
        'sucesso'  => false,
        'mensagem' => 'Erro interno no servidor.'
    ]);
}