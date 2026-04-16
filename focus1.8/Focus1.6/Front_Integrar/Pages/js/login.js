/* Toggle Senha */
//corrigido
function toggleSenha(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    if (!input || !icon) return;

    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

document.getElementById('formLogin').addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = document.getElementById('btnLogin');
    const alerta = document.getElementById('alerta');

    btn.disabled = true;
    btn.textContent = 'Verificando...';
    alerta.style.display = 'none';

    try {
        const formData = new FormData(this);
        const response = await fetch('php/login.php', {
            method: 'POST',
            body: formData
        });

        const rawText = await response.text();

        try {
            const data = JSON.parse(rawText);

            if (data.sucesso) {
                mostrarAlerta(`Bem-vindo, ${data.nome}!`, 'sucesso');
                setTimeout(() => { window.location.href = data.redirect; }, 1000);
            } else {
                mostrarAlerta(data.mensagem, 'erro');
                resetarBotao();
            }
        } catch (jsonError) {
            console.error("Resposta inválida do servidor:", rawText);
            mostrarAlerta("Erro ao processar resposta do servidor.", "erro");
            resetarBotao();
        }

    } catch (error) {
        mostrarAlerta("Falha na comunicação com o servidor.", "erro");
        resetarBotao();
    }

    function resetarBotao() {
        btn.disabled = false;
        btn.textContent = 'Entrar';
    }
});

function mostrarAlerta(msg, tipo) {
    const alerta = document.getElementById('alerta');
    if (!alerta) return;

    alerta.textContent = msg;
    alerta.className = `alerta ${tipo}`;
    alerta.style.display = 'block';
}