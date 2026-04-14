    <?php
    ob_start();
    session_start(); //corrigido
    header('Content-Type: application/json; charset=utf-8');

    // Carrega classe do banco MySQL
    require_once __DIR__ . "/MySQLClass.php";

    // Rejeita requisições que não sejam do tipo POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
        exit;
    }

    // Captura e limpa dados de login enviados
    $email = trim($_POST['email'] ?? '');
    $senha = trim($_POST['password'] ?? '');

    // Verifica se os campos obrigatórios foram preenchidos
    if (empty($email) || empty($senha)) {
        http_response_code(422);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha e-mail e senha.']);
        exit;
    }

    try {
        $db = new MySQLClass();

        $sql = "SELECT id, name, email, password, role FROM users WHERE email = :email LIMIT 1";
        $usuario = $db->search($sql, [":email" => $email], true);

        // 1. VALIDAÇÃO DE SENHA
        if (!$usuario || !password_verify($senha, $usuario->password)) {
            http_response_code(401);
            echo json_encode([
                "sucesso" => false,
                "mensagem" => "Usuário ou senha inválidos"
            ]);
            exit;
        }

        session_regenerate_id(true);

        // SESSÃO
        $_SESSION["id"]   = $usuario->id;
        $_SESSION["nome"] = $usuario->name;
        $_SESSION["role"] = $usuario->role;

        // REDIRECIONAMENTO
        $redirect = ($usuario->role === "admin")
            ? "/focus1.8/Focus1.6/Front_Integrar/Pages/adm/dashboard.php"
            : "/focus1.8/Focus1.6/Front_Integrar/Pages/Dashboard/Dashboard.php";

        echo json_encode([
            "sucesso" => true,
            "nome" => $usuario->name,
            "redirect" => $redirect
        ]);
        exit;
    } catch (PDOException $e) {
        // Log do erro para Dev, resposta genérica para o usuário
        error_log($e->getMessage());
        http_response_code(500);
        echo json_encode([
            "sucesso" => false,
            "mensagem" => "Erro interno no servidor."
        ]);
    }
