    /* ── OTP: navegação entre inputs ── */
    const inputs = Array.from(document.querySelectorAll('.otp-input'));
    const submitBtn = document.getElementById('btn-submit');
    const hiddenInput = document.getElementById('codigo-hidden');
 
    function updateState() {
      inputs.forEach(inp => {
        inp.classList.toggle('filled', inp.value !== '');
      });
      const code = inputs.map(i => i.value).join('');
      hiddenInput.value = code;
      submitBtn.disabled = code.length < 6;
    }
 
    inputs.forEach((inp, idx) => {
      inp.addEventListener('input', e => {
        // só números
        inp.value = inp.value.replace(/\D/g, '').slice(-1);
        if (inp.value && idx < inputs.length - 1) inputs[idx + 1].focus();
        updateState();
      });
 
      inp.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !inp.value && idx > 0) {
          inputs[idx - 1].focus();
          inputs[idx - 1].value = '';
          updateState();
        }
        if (e.key === 'ArrowLeft'  && idx > 0) inputs[idx - 1].focus();
        if (e.key === 'ArrowRight' && idx < inputs.length - 1) inputs[idx + 1].focus();
      });
 
      // Suporte a colar o código inteiro
      inp.addEventListener('paste', e => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData)
          .getData('text').replace(/\D/g, '').slice(0, 6);
        pasted.split('').forEach((ch, i) => {
          if (inputs[i]) inputs[i].value = ch;
        });
        const last = Math.min(pasted.length, inputs.length) - 1;
        inputs[last].focus();
        updateState();
      });
    });
 
    // Foco inicial
    inputs[0].focus();
 
    /* ── Submit ── */
    function handleSubmit(e) {
      e.preventDefault();
      const code = inputs.map(i => i.value).join('');
      submitBtn.textContent = 'Verificando…';
      submitBtn.disabled = true;
 
      // Simulação — substitua pelo seu backend
      setTimeout(() => {
        const isValid = true; // altere para validação real
        if (isValid) {
          document.getElementById('feedback-error').style.display = 'none';
          document.getElementById('feedback-success').style.display = 'flex';
          submitBtn.textContent = '✓ Verificado';
          // window.location.href = 'dashboard.html';
        } else {
          document.getElementById('feedback-error').style.display = 'flex';
          submitBtn.textContent = 'Validar Código';
          submitBtn.disabled = false;
          inputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
          inputs[0].focus();
          updateState();
        }
      }, 1200);
    }
 
    /* ── Reenviar com contador ── */
    let countdown = 30;
    const resendBtn  = document.getElementById('resend-btn');
    const timerSpan  = document.getElementById('resend-timer');
 
    const timer = setInterval(() => {
      countdown--;
      timerSpan.textContent = countdown + 's';
      if (countdown <= 0) {
        clearInterval(timer);
        resendBtn.disabled = false;
        resendBtn.innerHTML = 'Reenviar código';
      }
    }, 1000);
 
    function resendCode() {
      resendBtn.disabled = true;
      resendBtn.textContent = 'Reenviado ✓';
      setTimeout(() => {
        resendBtn.innerHTML = 'Reenviar novamente';
        resendBtn.disabled = false;
      }, 3000);
    }