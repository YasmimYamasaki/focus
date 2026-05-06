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
    if (empty($email)) throw new Exception('E-mail é obrigatório.');

    $db = new MySQLClass();

    $db = new MySQLClass();

    $resultados = $db->searchSafe(
        "SELECT u.user_id, p.username 
         FROM users u 
         LEFT JOIN profiles p ON u.user_id = p.user_id 
         WHERE u.email = ? LIMIT 1",
        [$email]
    );
    error_log(print_r($resultados, true));

    if (!$resultados || count($resultados) === 0) {
        echo json_encode(['sucesso' => true, 'mensagem' => 'Se o e-mail existir, você receberá o link.']);
        exit;
    }

    $usuario = $resultados[0];

    $userId = $usuario['user_id']; // Pegando do array associativo
    $nomeExibicao = $usuario['username'] ?? "Usuário";

    if (empty($userId)) {
        throw new Exception("Erro interno: ID do usuário não encontrado nos dados recuperados.");
    }

    $token = bin2hex(random_bytes(32));

    $db->execSafe("DELETE FROM tokens WHERE user_id = ?", [$userId]);

    $db->execSafe(
        "INSERT INTO tokens (user_id, content, sent_at) VALUES (?, ?, NOW())",
        [$userId, $token]
    );

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
    //quando lançar no web, derrubar esse SMTOptions, ele vai mandar o email no spam
    $mail->setFrom(USER, 'Focus Study');
    $nomeExibicao = htmlspecialchars($usuario['username'] ?? "Usuario");
    $mail->addAddress($email, $nomeExibicao);
    $mail->isHTML(true);
    $mail->Subject = "Recuperacao de Senha - Focus Study";
    //quando mudar para server Web, alterar esse link
    $link = "http://localhost/focus1.8/Focus1.6/Front_Integrar/Pages/nova-senha.html?token=" . $token;

    // BOTÃO NO E-MAIL
    $mail->Body = "
    <div style='font-family: sans-serif; text-align: center; padding: 20px; border: 1px solid #ddd;'>
        <h2>Olá, {$nomeExibicao}</h2>
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
