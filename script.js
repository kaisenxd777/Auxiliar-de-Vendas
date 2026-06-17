/**
 * ============================================================
 * TELA DE LOGIN — Assistente de Vendas (v2 — melhorias)
 * ============================================================
 * Credenciais fixas:
 *   usuário: poatan
 *   senha:   007
 *
 * NOVIDADES desta versão:
 *  - Aviso de Caps Lock ativo enquanto digita a senha
 *  - "Manter conectado" grava o usuário no localStorage
 *  - Bloqueio progressivo após tentativas erradas (anti brute-force básico)
 *  - Spinner real no botão + texto dinâmico
 *  - Efeito de "shake" no card inteiro a cada erro
 *  - Sessão expira automaticamente após 8 horas (mesmo com "manter conectado")
 *
 * IMPORTANTE: continua sendo proteção apenas de front-end.
 * Não substitui autenticação real de servidor.
 * ============================================================
 */
'use strict';

const VALID_USERNAME = 'poatan';
const VALID_PASSWORD = '007';
const REDIRECT_URL   = 'gerenciador/index.html';

const SESSION_KEY      = 'av-logged-in';
const SESSION_TIME_KEY = 'av-login-time';
const REMEMBER_KEY     = 'av-remember-user';
const ATTEMPTS_KEY     = 'av-login-attempts';
const LOCK_UNTIL_KEY   = 'av-lock-until';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas
const MAX_ATTEMPTS        = 5;
const LOCK_DURATION_MS    = 30 * 1000; // 30s de bloqueio após exceder tentativas

document.addEventListener('DOMContentLoaded', () => {
  const card         = document.querySelector('.login-card');
  const form          = document.getElementById('login-form');
  const userInput     = document.getElementById('username');
  const passInput     = document.getElementById('password');
  const errorMsg      = document.getElementById('error-msg');
  const capsWarning   = document.getElementById('caps-warning');
  const attemptsHint  = document.getElementById('attempts-hint');
  const rememberBox   = document.getElementById('remember-me');
  const btnToggle     = document.getElementById('btn-toggle-pass');
  const btnLogin      = form.querySelector('.btn-login');
  const btnText       = btnLogin.querySelector('.btn-text');
  const btnSpinner    = btnLogin.querySelector('.btn-spinner');

  /* ── Sessão já ativa e ainda válida (8h)? Pula direto ── */
  const loggedIn  = sessionStorage.getItem(SESSION_KEY) === 'true';
  const loginTime = Number(localStorage.getItem(SESSION_TIME_KEY) || 0);
  const sessionStillValid = (Date.now() - loginTime) < SESSION_DURATION_MS;

  if (loggedIn && sessionStillValid) {
    window.location.href = REDIRECT_URL;
    return;
  }

  /* ── Preenche usuário lembrado ── */
  const remembered = localStorage.getItem(REMEMBER_KEY);
  if (remembered) {
    userInput.value = remembered;
    rememberBox.checked = true;
    passInput.focus();
  } else {
    userInput.focus();
  }

  /* ── Verifica se já está bloqueado de tentativas anteriores ── */
  checkLockState();

  /* ── Mostrar/ocultar senha ── */
  btnToggle.addEventListener('click', () => {
    const isPassword = passInput.type === 'password';
    passInput.type = isPassword ? 'text' : 'password';
    btnToggle.textContent = isPassword ? '🙈' : '👁️';
  });

  /* ── Aviso de Caps Lock ── */
  passInput.addEventListener('keyup', (e) => {
    if (typeof e.getModifierState === 'function') {
      const isCaps = e.getModifierState('CapsLock');
      capsWarning.classList.toggle('hidden', !isCaps);
    }
  });
  passInput.addEventListener('blur', () => capsWarning.classList.add('hidden'));

  /* ── Submissão do formulário ── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (isLocked()) { shakeCard(); return; }

    const user = userInput.value.trim();
    const pass = passInput.value.trim();

    errorMsg.classList.add('hidden');

    if (!user || !pass) {
      showError('Preencha usuário e senha.');
      shakeCard();
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (user === VALID_USERNAME && pass === VALID_PASSWORD) {
        // Login correto — limpa tentativas e grava sessão
        localStorage.removeItem(ATTEMPTS_KEY);
        localStorage.removeItem(LOCK_UNTIL_KEY);

        if (rememberBox.checked) {
          localStorage.setItem(REMEMBER_KEY, user);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }

        sessionStorage.setItem(SESSION_KEY, 'true');
        localStorage.setItem(SESSION_TIME_KEY, String(Date.now()));

        btnText.textContent = 'Sucesso!';
        setTimeout(() => { window.location.href = REDIRECT_URL; }, 250);
      } else {
        setLoading(false);
        registerFailedAttempt();
        showError('Usuário ou senha incorretos.');
        shakeCard();
        passInput.value = '';
        passInput.focus();
      }
    }, 500);
  });

  /* Enter no campo de senha envia o formulário */
  passInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') form.requestSubmit();
  });

  /* ================= Helpers ================= */

  function setLoading(isLoading) {
    btnLogin.classList.toggle('loading', isLoading);
    btnLogin.disabled = isLoading;
    btnText.textContent = isLoading ? 'Entrando...' : 'Entrar';
    btnSpinner.classList.toggle('hidden', !isLoading);
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  }

  function shakeCard() {
    card.classList.remove('shake');
    void card.offsetWidth; // força reflow para repetir a animação
    card.classList.add('shake');
  }

  function registerFailedAttempt() {
    let attempts = Number(localStorage.getItem(ATTEMPTS_KEY) || 0) + 1;
    localStorage.setItem(ATTEMPTS_KEY, String(attempts));

    const remaining = MAX_ATTEMPTS - attempts;

    if (attempts >= MAX_ATTEMPTS) {
      const lockUntil = Date.now() + LOCK_DURATION_MS;
      localStorage.setItem(LOCK_UNTIL_KEY, String(lockUntil));
      lockForm(LOCK_DURATION_MS);
    } else if (remaining <= 2) {
      attemptsHint.textContent = `Atenção: ${remaining} tentativa${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''} antes do bloqueio temporário.`;
      attemptsHint.classList.remove('hidden');
    }
  }

  function isLocked() {
    const lockUntil = Number(localStorage.getItem(LOCK_UNTIL_KEY) || 0);
    return Date.now() < lockUntil;
  }

  function checkLockState() {
    const lockUntil = Number(localStorage.getItem(LOCK_UNTIL_KEY) || 0);
    const remainingMs = lockUntil - Date.now();
    if (remainingMs > 0) lockForm(remainingMs);
  }

  function lockForm(durationMs) {
    card.classList.add('locked');
    btnLogin.disabled = true;
    userInput.disabled = true;
    passInput.disabled = true;

    let secondsLeft = Math.ceil(durationMs / 1000);
    showLockCountdown(secondsLeft);

    const interval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(interval);
        unlockForm();
      } else {
        showLockCountdown(secondsLeft);
      }
    }, 1000);
  }

  function showLockCountdown(seconds) {
    attemptsHint.textContent = `Muitas tentativas incorretas. Tente novamente em ${seconds}s.`;
    attemptsHint.classList.remove('hidden');
    errorMsg.classList.add('hidden');
  }

  function unlockForm() {
    card.classList.remove('locked');
    btnLogin.disabled = false;
    userInput.disabled = false;
    passInput.disabled = false;
    attemptsHint.classList.add('hidden');
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCK_UNTIL_KEY);
    passInput.focus();
  }
});
