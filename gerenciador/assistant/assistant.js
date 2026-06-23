/**
 * ============================================================
 * ASSISTENTE COMERCIAL — assistant.js
 * ============================================================
 * Controlador principal: injeta HTML/CSS, gerencia abrir/fechar,
 * histórico (localStorage, máx. 50 msgs), envio de mensagens e
 * sugestões rápidas. Totalmente isolado do restante do sistema.
 *
 * Melhorias de produtividade:
 *  - Atalho de teclado Alt+A abre/fecha o assistente de qualquer
 *    lugar do Gerenciador (sem precisar clicar no botão flutuante)
 *  - Esc fecha o painel quando estiver aberto
 *  - Badge de notificação na primeira visita do dia, sinalizando
 *    que o assistente está disponível
 * ============================================================
 */

const Assistant = (() => {

  const HISTORY_KEY  = 'av-assistant-history';
  const LAST_SEEN_KEY = 'av-assistant-last-seen';
  const MAX_MESSAGES = 50;

  let elPanel, elFab, elBody, elInput, elSend, elBadge;
  let isOpen = false;
  let isMinimized = false;
  let history = [];

  function mount() {
    if (!document.getElementById('av-assist-style')) {
      const link = document.createElement('link');
      link.id = 'av-assist-style';
      link.rel = 'stylesheet';
      link.href = 'assistant/assistant.css';
      document.head.appendChild(link);
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'av-assist-root';
    wrapper.innerHTML = window.ASSISTANT_TEMPLATE;
    document.body.appendChild(wrapper);

    cacheElements();
    bindEvents();
    loadHistory();
    renderHistory();
    checkFirstVisitToday();

    if (!history.length) {
      pushMessage('bot', 'Olá! Sou o Assistente Comercial. Posso falar sobre módulos, simular descontos, ajudar com objeções de clientes, indicar vídeos/manuais ou regras de comissão. Escolha um tópico abaixo ou digite sua dúvida.', false);
    }
  }

  function cacheElements() {
    elFab   = document.getElementById('av-assist-fab');
    elPanel = document.getElementById('av-assist-panel');
    elBody  = document.getElementById('av-assist-body');
    elInput = document.getElementById('av-assist-input');
    elSend  = document.getElementById('av-assist-send');
    elBadge = document.getElementById('av-assist-badge');
  }

  function bindEvents() {
    elFab.addEventListener('click', toggle);
    document.getElementById('av-assist-close').addEventListener('click', close);
    document.getElementById('av-assist-minimize').addEventListener('click', toggleMinimize);
    document.getElementById('av-assist-clear').addEventListener('click', clearHistory);

    elSend.addEventListener('click', handleSend);
    elInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });

    document.querySelectorAll('.av-assist-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        elInput.value = chip.getAttribute('data-q');
        handleSend();
      });
    });

    // Atalho global Alt+A e Esc para fechar
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) close();
    });
  }

  /** Mostra badge se for a primeira abertura do dia (sinaliza disponibilidade) */
  function checkFirstVisitToday() {
    const today = new Date().toDateString();
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
    if (lastSeen !== today) {
      elBadge.classList.remove('av-hidden');
      localStorage.setItem(LAST_SEEN_KEY, today);
    }
  }

  function toggle() { isOpen ? close() : open(); }

  function open() {
    isOpen = true;
    elPanel.classList.add('open');
    elBadge.classList.add('av-hidden');
    elInput.focus();
    scrollToBottom();
  }

  function close() {
    isOpen = false;
    elPanel.classList.remove('open');
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
    elPanel.classList.toggle('minimized', isMinimized);
    document.getElementById('av-assist-minimize').textContent = isMinimized ? '▢' : '─';
  }

  function loadHistory() {
    try { const raw = localStorage.getItem(HISTORY_KEY); if (raw) history = JSON.parse(raw); }
    catch(e) { history = []; }
  }

  function saveHistory() {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_MESSAGES))); }
    catch(e) {}
  }

  function renderHistory() {
    elBody.innerHTML = '';
    history.forEach(msg => appendMessageToDOM(msg.role, msg.text));
    scrollToBottom();
  }

  function clearHistory() {
    if (!confirm('Limpar toda a conversa com o assistente?')) return;
    history = [];
    saveHistory();
    elBody.innerHTML = '';
    pushMessage('bot', 'Conversa limpa. Como posso ajudar agora?', false);
  }

  function pushMessage(role, text, persist = true) {
    appendMessageToDOM(role, text);
    if (persist) { history.push({ role, text, ts: Date.now() }); saveHistory(); }
    scrollToBottom();
  }

  function appendMessageToDOM(role, text) {
    const div = document.createElement('div');
    div.className = `av-assist-msg ${role}`;
    div.innerHTML = formatText(text);
    elBody.appendChild(div);
  }

  function formatText(text) {
    const escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'av-assist-typing';
    div.id = 'av-assist-typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    elBody.appendChild(div);
    scrollToBottom();
  }

  function hideTyping() {
    const el = document.getElementById('av-assist-typing-indicator');
    if (el) el.remove();
  }

  function scrollToBottom() { elBody.scrollTop = elBody.scrollHeight; }

  async function handleSend() {
    const text = elInput.value.trim();
    if (!text) return;

    pushMessage('user', text);
    elInput.value = '';
    elSend.disabled = true;
    showTyping();

    try {
      const resposta = await window.AssistantEngine.responder(text);
      hideTyping();
      pushMessage('bot', resposta);
    } catch (err) {
      hideTyping();
      pushMessage('bot', 'Não consegui processar sua pergunta agora. Tente novamente em alguns instantes.');
      console.error('[Assistente Comercial] erro ao responder:', err);
    } finally {
      elSend.disabled = false;
      elInput.focus();
    }
  }

  function init() {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
  }

  return { init, open, close };
})();

Assistant.init();
