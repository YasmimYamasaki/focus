// ══════════════════════════════════════
//  PERFIL — Focus Study
//  perfil.js //corrigido
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('current-date').innerText = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── Função Única para Carregar o Perfil ──
  async function refreshProfile() {
    try {
      const response = await fetch('php/api_perfil.php');
      const result = await response.json();

      if (result.success) {
        const p = result.data;

        // Atualiza UI lateral e textos
        document.getElementById('display-name').textContent = p.username;
        document.getElementById('display-tag').textContent = '@' + (p.tag || p.username.toLowerCase().replace(/\s/g, ''));
        document.getElementById('display-bio').textContent = p.bio || 'Focado em crescer todos os dias.';

        // Atualiza Inputs
        document.getElementById('inp-name').value = p.username;
        document.getElementById('inp-tag').value = p.tag || p.username.toLowerCase().replace(/\s/g, '');
        document.getElementById('inp-bio').value = p.bio || '';
        document.getElementById('inp-email').value = p.email;

        // Stats vindas do Banco (conforme SQL)
        document.getElementById('pstat-sessions').textContent = p.total_concluido || '0';
        document.getElementById('pstat-streak').textContent = p.streak || '0';
        document.getElementById('pstat-habits').textContent = p.xp || '0';

        // Atualização sincronizada de Avatares
        const avatarImg = document.getElementById('profile-avatar-img');
        const navAv = document.getElementById('nav-avatar'); // Avatar da sidebar/nav
        
        const imgSrc = p.photo 
          ? 'php/uploads/' + p.photo 
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.username)}&background=06b6d4&color=fff`;
        
        avatarImg.src = imgSrc;
        if (navAv) navAv.src = imgSrc;
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    }
  }

  // --- FUNÇÕES DE FEEDBACK ---
  function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    if (!t) {
      alert(msg);
      return;
    }
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  function showFeedback(id, msg, isError = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? '#ff4b91' : '#4ade80'; 
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
  }

  // Executa ao carregar a página
  refreshProfile();

  // ── Lógica de clique na foto para upload ──
  const avatarWrapper = document.getElementById('avatar-wrapper');
  const avatarInput = document.getElementById('avatar-input');
  const editBtn = document.getElementById('avatar-edit-btn');

  if (avatarWrapper) {
    avatarWrapper.addEventListener('click', () => avatarInput.click());
  }
  
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Evita clique duplo com o wrapper
      avatarInput.click();
    });
  }

  avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('acao', 'update_photo');
    formData.append('photo', file);

    try {
      const res = await fetch('php/api_perfil.php', { method: 'POST', body: formData });
      const result = await res.json();

      if (result.success) {
        refreshProfile();
        showToast('Foto atualizada com sucesso!');
      }
    } catch (err) {
      showToast('Erro ao enviar foto', 'error');
    }
  });

  // ── Toggle password ──
  const togglePwd = document.getElementById('toggle-pwd');
  if (togglePwd) {
    togglePwd.addEventListener('click', () => {
      const inp = document.getElementById('inp-pwd');
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });
  }

  // ── Save personal (Nome, Tag, Bio) ──
  document.getElementById('save-personal').addEventListener('click', async () => {
    const username = document.getElementById('inp-name').value.trim();
    const tag = document.getElementById('inp-tag').value.trim();
    const bio = document.getElementById('inp-bio').value.trim();

    const formData = new FormData();
    formData.append('acao', 'update_personal');
    formData.append('username', username);
    formData.append('tag', tag);
    formData.append('bio', bio);

    try {
      const res = await fetch('php/api_perfil.php', { method: 'POST', body: formData });
      const result = await res.json();

      if (result.success) {
        showToast('Perfil salvo com sucesso!', 'success');
        showFeedback('personal-feedback', '✓ Salvo!');
        refreshProfile();
      }
    } catch (err) {
      showToast('Erro ao salvar dados pessoais', 'error');
    }
  });

  // ── SAVE SECURITY (E-mail e Senha) ──
  document.getElementById('save-security').addEventListener('click', async () => {
    const email = document.getElementById('inp-email').value.trim();
    const pwd = document.getElementById('inp-pwd').value;
    const pwdC = document.getElementById('inp-pwd-confirm').value;

    if (pwd && pwd !== pwdC) {
      showFeedback('security-feedback', '✗ Senhas não conferem', true);
      showToast('As senhas não conferem!', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('acao', 'update_security');
    formData.append('email', email);
    if (pwd) formData.append('password', pwd);

    try {
      const res = await fetch('php/api_perfil.php', { method: 'POST', body: formData });
      const result = await res.json();

      if (result.success) {
        document.getElementById('inp-pwd').value = '';
        document.getElementById('inp-pwd-confirm').value = '';
        showFeedback('security-feedback', '✓ Atualizado!');
        showToast('Credenciais atualizadas!', 'success');
        refreshProfile();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      showFeedback('security-feedback', '✗ Erro ao salvar', true);
      showToast('Erro: ' + err.message, 'error');
    }
  });
});