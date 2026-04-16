<?php
//corrigido
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

try {
    require_once __DIR__ . '/../PHPMailer/Exception.php';
    require_once __DIR__ . '/../PHPMailer/PHPMailer.php';
    require_once __DIR__ . '/../PHPMailer/SMTP.php';
    require_once __DIR__ . '/senha_email.php';
    require_once __DIR__ . '/MySQLClass.php';
    if ($_SERVER['REQUEST_METHOD'] !== 'POST')
        throw new Exception('Método inválido.');

    $email = trim($_POST['email'] ?? '');
    $db = new MySQLClass();
    $usuario = $db->search("SELECT user_id, user_name FROM tb_users WHERE user_email = ? LIMIT 1", [$email], true);

    if (!$usuario) {
        echo json_encode(['sucesso' => true, 'mensagem' => 'Se o e-mail existir, você receberá o link.']);
        exit;
    }

    $token = bin2hex(random_bytes(32));
    $db->exec("INSERT INTO tb_tokens (user_id, token_content, sent_at) VALUES (?, ?, NOW())", [$usuario->user_id, $token]);

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = USER;
    $mail->Password = PWD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;
    $mail->CharSet = 'UTF-8';
    $mail->SMTPOptions = ['ssl' => ['verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true]];

    $mail->setFrom(USER, 'Focus Study');
    $mail->addAddress($email, $usuario->user_name);
    $mail->isHTML(true);
    $mail->Subject = "Recuperacao de Senha - Focus Study";

    $link = "http://localhost/focus1.8/Focus1.6/Front_Integrar/Pages/nova-senha.html?token=" . $token;

    // BOTÃO NO E-MAIL
    $mail->Body = "
    <div style='font-family: sans-serif; text-align: center; padding: 20px; border: 1px solid #ddd;'>
        <h2>Olá, {$usuario->user_name}</h2>
        <p>Clique no botão abaixo para recuperar sua senha:</p>
        <div style='margin: 30px 0;'>
            <a href='{$link}' style='background: #6a11cb; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;'>
                REDEFINIR SENHA
            </a>
        </div>
        <p style='font-size: 11px; color: #777;'>Se não solicitou, ignore este e-mail.</p>
    </div>";

    $mail->send();
    echo json_encode(['sucesso' => true, 'mensagem' => 'E-mail enviado com sucesso, verifique sua caixa de E-mail!']);
} catch (PHPMailerException $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => "Erro de Conexão SMTP: " . $mail->ErrorInfo]);
} catch (Throwable $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => "Erro: " . $e->getMessage()]);
}
