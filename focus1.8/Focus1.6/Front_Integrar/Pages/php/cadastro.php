<?php
// Inicia sessão para persistir dados do usuário
session_start();

// Importa classe de conexão com banco PostgreSQL
require_once __DIR__ . "PostgreSQLClass.php";

// Inicializa variáveis de feedback na sessão
$_SESSION["mensagem"] = "";
$_SESSION["tipo"] = "";

// Bloqueia acessos que não utilizam método POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: cadastro.php");
    exit();
}

// limpa e recebe dados enviados pelo formulário
$nome        = trim($_POST["nome"] ?? "");
$sobrenome   = trim($_POST["sobrenome"] ?? "");
$dataNasc    = trim($_POST["data_nascimento"] ?? "");
$genero      = trim($_POST["genero"] ?? "");
$telefone    = preg_replace('/\D/', '', $_POST["telefone"] ?? "");
$email       = trim($_POST["email"] ?? "");
$senha       = $_POST["senha"] ?? "";
$confirmar   = $_POST["confirmar"] ?? "";

/*VALIDAÇÕES*/
$erros = [];

// Valida preenchimento obrigatório de campos básicos
if ($nome === "")         $erros[] = "Nome é obrigatório.";
if ($sobrenome === "")    $erros[] = "Sobrenome é obrigatório.";
if ($dataNasc === "")     $erros[] = "Data de nascimento é obrigatória.";
if ($genero === "")       $erros[] = "Gênero é obrigatório.";
if ($telefone === "")     $erros[] = "Telefone é obrigatório.";

// Verifica se formato do e-mail é válido
if (!filter_var($email, FILTER_VALIDATE_EMAIL))
    $erros[] = "E-mail inválido.";

// Exige comprimento mínimo para a senha
if (strlen($senha) < 6)
    $erros[] = "A senha deve ter ao menos 6 caracteres.";

// Verifica se as senhas digitadas são iguais
if ($senha !== $confirmar)
    $erros[] = "As senhas não coincidem.";

/*Validação de idade*/
if ($dataNasc !== "") {
    // Converte string de data para objeto DateTime
    $nascimento = DateTime::createFromFormat('Y-m-d', $dataNasc);

    if (!$nascimento) {
        $erros[] = "Data de nascimento inválida.";
    } else {
        // Calcula idade e bloqueia menores de dezoito
        $hoje = new DateTime();
        $idade = $hoje->diff($nascimento)->y;

        if ($idade < 18)
            $erros[] = "O cliente deve ter ao menos 18 anos.";
    }
}

/*SE HOUVER ERRO, REDIRECIONA*/
if (!empty($erros)) {
    // Armazena erros e retorna para o formulário
    $_SESSION["mensagem"] = implode(" ", $erros);
    $_SESSION["tipo"] = "erro";

    header("Location: cadastro.php");
    exit();
}

/*UPLOAD DA FOTO*/
$nomeFoto = null;

if (isset($_FILES["foto"]) && $_FILES["foto"]["error"] === UPLOAD_ERR_OK) {

    // Define extensões e tipos MIME permitidos
    $tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $extPermitidas   = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    // Valida tipo real do arquivo enviado
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $tipoReal = finfo_file($finfo, $_FILES["foto"]["tmp_name"]);
    finfo_close($finfo);

    $ext = strtolower(pathinfo($_FILES["foto"]["name"], PATHINFO_EXTENSION));

    // Bloqueia formatos de imagem não autorizados
    if (!in_array($tipoReal, $tiposPermitidos) || !in_array($ext, $extPermitidas)) {
        $_SESSION["mensagem"] = "Tipo de imagem não permitido.";
        $_SESSION["tipo"] = "erro";
        header("Location: cadastro.php");
        exit();
    }

    // Limita tamanho do arquivo em 5 megabytes
    if ($_FILES["foto"]["size"] > 5 * 1024 * 1024) {
        $_SESSION["mensagem"] = "A imagem deve ter no máximo 5MB.";
        $_SESSION["tipo"] = "erro";
        header("Location: cadastro.php");
        exit();
    }

    // Define caminho e cria pasta de uploads
    $pasta = __DIR__ . "/uploads/fotos/";

    if (!is_dir($pasta)) {
        mkdir($pasta, 0755, true);
    }

    // Gera nome único para o arquivo salvo
    $nomeFoto = "cliente_" . uniqid() . "." . $ext;

    // Move arquivo temporário para a pasta final
    if (!move_uploaded_file($_FILES["foto"]["tmp_name"], $pasta . $nomeFoto)) {
        $_SESSION["mensagem"] = "Erro ao salvar a imagem.";
        $_SESSION["tipo"] = "erro";
        header("Location: cadastro.php");
        exit();
    }
}

/*INSERÇÃO NO BANCO*/
try {
    // Instancia conexão e executa inserção SQL
    $pgsql = new PostgreSQLClass();

    $pgsql->exec(
        "INSERT INTO usuario 
        (nome_usuario, email_usuario, senha_usuario, criado_em)
        VALUES 
        (:nome, :email, crypt(:senha, gen_salt('bf')), NOW())",
        [
            ":nome"  => $nome . " " . $sobrenome,
            ":email" => $email,
            ":senha" => $senha
        ]
    );

    // Sucesso no cadastro e redirecionamento final
    $_SESSION["mensagem"] = "Cadastro realizado com sucesso!";
    $_SESSION["tipo"] = "sucesso";

    header("Location: index.php");
    exit();
} catch (PDOException $e) {

    // Trata e-mail duplicado ou erros internos
    if ($e->getCode() == 23505) {
        $_SESSION["mensagem"] = "Este e-mail já está cadastrado.";
    } else {
        $_SESSION["mensagem"] = "Erro interno ao cadastrar usuário.";
        error_log($e->getMessage());
    }

    $_SESSION["tipo"] = "erro";
    header("Location: cadastro.php");
    exit();
}
