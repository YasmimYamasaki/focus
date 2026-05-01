/* Toggle Senha */
//corrigido
function toggleSenha(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    if (!input) return;

    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

// Extrai o token da URL
const token = new URLSearchParams(window.location.search).get('token');
const form = document.getElementById('formNovaSenha');
const btnSalvar = document.getElementById('btnSalvar');

if (!token) {
    mostrarAlerta('Token de recuperação ausente. Solicite o e-mail novamente.', 'erro');
    if (btnSalvar) btnSalvar.disabled = true;
}

const inputSenha = document.getElementById('senha');
const inputConfirma = document.getElementById('confirma');
const avisoSenha = document.getElementById('aviso-senha');

//Função de verificação de senha
function verificarSenhas() {
    const senha = inputSenha.value;
    const confirma = inputConfirma.value;

    if (confirma.length == 0) {
        avisoSenha.textContent = '';
        return;
    }
    if (senha !== confirma) {
        avisoSenha.textContent = 'As senhas não coincidem. ';
        avisoSenha.style.color = 'red';
    }
    else {
        avisoSenha.textContent = 'As senhas coincidem!'
        avisoSenha.style.color = 'green'
    }
}
inputSenha.addEventListener('input', verificarSenhas);
inputConfirma.addEventListener('input', verificarSenhas);
//evento do btn de submit
form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (inputSenha.value.length < 6) {
        mostrarAlerta('A senha deve ter pelo menos 6 caracteres.', 'erro');
        return;
    }

    if (inputSenha.value !== inputConfirma.value) {
        mostrarAlerta('As senhas digitadas não são iguais.', 'erro');
        return;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    const fd = new FormData(this);
    fd.append('token', token);
//fetch de direcionamento
    try {
        const res = await fetch('php/nova-senha.php', {
            method: 'POST',
            body: fd
        });

        const text = await res.text();
        console.log("Debug BackEnd:", text);
        const data = JSON.parse(text);

        mostrarAlerta(data.mensagem, data.sucesso ? 'sucesso' : 'erro');

        if (data.sucesso) {
            form.reset();
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        }
    } catch (err) {
        mostrarAlerta('Falha na comunicação com o servidor.', 'erro');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = 'Salvar nova senha';
    }
});

function mostrarAlerta(msg, tipo) {
    const a = document.getElementById('alerta');
    if (!a) return;
    a.textContent = msg;
    a.className = `alerta ${tipo}`;
    a.style.display = 'block';
}