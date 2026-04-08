function toggleSenha(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

document.addEventListener("DOMContentLoaded", function () {

    // Data de nascimento 
    const inputData = document.getElementById('data-nascimento');
    const aviso = document.getElementById('aviso');
    const hoje = new Date();

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    const limiteMin = new Date();
    limiteMin.setFullYear(limiteMin.getFullYear() - 120);
    inputData.min = formatDate(limiteMin);
    inputData.max = formatDate(hoje);

    inputData.addEventListener('change', function () {
        const dataSelecionada = new Date(this.value);
        if (!this.value) {
            aviso.textContent = '';
            return;
        }

        let idade = hoje.getFullYear() - dataSelecionada.getFullYear();
        const mesDiff = hoje.getMonth() - dataSelecionada.getMonth();
        const diaDiff = hoje.getDate() - dataSelecionada.getDate();

        if (mesDiff < 0 || (mesDiff === 0 && diaDiff < 0)) {
            idade--;
        }

        if (idade < 18) {
            aviso.textContent = 'Você precisa ter pelo menos 18 anos.';
            this.value = '';
        } else {
            aviso.textContent = '';
        }
    });

    // Validação de confirmação de senha
    const inputSenha = document.getElementById('senha');
    const inputConfirma = document.getElementById('confirma-senha');
    const avisoSenha = document.getElementById('aviso-senha');

    function verificarSenhas() {
        if (inputConfirma.value === '') {
            avisoSenha.textContent = '';
            return;
        }
        if (inputSenha.value !== inputConfirma.value) {
            avisoSenha.textContent = 'As senhas não coincidem.';
        } else {
            avisoSenha.textContent = '';
        }
    }

    inputSenha.addEventListener('input', verificarSenhas);
    inputConfirma.addEventListener('input', verificarSenhas);

    // Prévia da foto ao selecionar
    const inputFoto = document.getElementById('foto');
    const fotoWrapper = document.getElementById('fotoWrapper');
    const fotoPreview = document.getElementById('fotoPreview');
    const fotoPlaceholder = document.getElementById('fotoPlaceholder');

    fotoWrapper.addEventListener('click', () => inputFoto.click());

    inputFoto.addEventListener('change', function () {
        const arquivo = this.files[0];
        if (!arquivo) return;

        if (arquivo.size > 5 * 1024 * 1024) {
            mostrarAlerta('A imagem deve ter no máximo 5 MB.', 'erro');
            this.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            fotoPreview.src = e.target.result;
            fotoPreview.style.display = 'block';
            fotoPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(arquivo);
    });

    // Máscara de telefone
    document.getElementById('telefone').addEventListener('input', function () {
        let v = this.value.replace(/\D/g, '').slice(0, 11);
        v = v.replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
        this.value = v;
    });

    // Envio via fetch (AJAX)
    document.getElementById('formCadastro').addEventListener('submit', async function (e) {
        e.preventDefault();

        if (inputSenha.value !== inputConfirma.value) {
            mostrarAlerta('As senhas não coincidem.', 'erro');
            return;
        }

        const btn = document.getElementById('btnEnviar');
        btn.disabled = true;
        btn.textContent = 'Enviando...';

        const formData = new FormData(this);

        try {
            const resposta = await fetch('cadastro.php', {
                method: 'POST',
                body: formData
            });

            const dados = await resposta.json();

            if (dados.sucesso) {
                mostrarAlerta(dados.mensagem, 'sucesso');
                this.reset();
                fotoPreview.style.display = 'none';
                fotoPreview.src = '';
                fotoPlaceholder.style.display = 'flex';
                setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                mostrarAlerta(dados.mensagem, 'erro');
            }

        } catch (err) {
            mostrarAlerta('Erro de conexão com o servidor. Verifique se o PHP está ativo.', 'erro');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Enviar';
        }
    });

    // Função de alerta 
    function mostrarAlerta(msg, tipo) {
        const alerta = document.getElementById('alerta');
        alerta.textContent = msg;
        alerta.className = tipo;
        alerta.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

});