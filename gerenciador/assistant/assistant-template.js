/**
 * ============================================================
 * TEMPLATE HTML — Assistente Comercial
 * ============================================================
 * Injetado dinamicamente no final do <body> pelo assistant.js,
 * para não exigir nenhuma edição manual do gerenciador.html
 * além da tag <script> que carrega este módulo.
 * ============================================================
 */

const ASSISTANT_TEMPLATE = `
  <button class="av-assist-fab" id="av-assist-fab" title="Assistente Comercial" aria-label="Abrir assistente comercial">
    💬
    <span class="av-assist-fab-badge av-hidden" id="av-assist-badge">1</span>
  </button>

  <div class="av-assist-panel" id="av-assist-panel" role="dialog" aria-label="Assistente Comercial">

    <div class="av-assist-header">
      <div class="av-assist-header-info">
        <div class="av-assist-avatar">🤖</div>
        <div>
          <div class="av-assist-title">Assistente Comercial</div>
          <div class="av-assist-status"><span class="av-assist-status-dot"></span> Online</div>
        </div>
      </div>
      <div class="av-assist-header-actions">
        <button class="av-assist-icon-btn" id="av-assist-clear" title="Limpar conversa">🗑</button>
        <button class="av-assist-icon-btn" id="av-assist-minimize" title="Minimizar">─</button>
        <button class="av-assist-icon-btn" id="av-assist-close" title="Fechar">✕</button>
      </div>
    </div>

    <div class="av-assist-suggestions" id="av-assist-suggestions">
      <button class="av-assist-chip" data-q="Fale sobre o comercial">Comercial</button>
      <button class="av-assist-chip" data-q="Como funciona o financeiro">Financeiro</button>
      <button class="av-assist-chip" data-q="Me explique o estoque">Estoque</button>
      <button class="av-assist-chip" data-q="Fale sobre a NFe">NFe</button>
      <button class="av-assist-chip" data-q="Como funciona o CIOT">CIOT</button>
      <button class="av-assist-chip" data-q="Fale sobre o certificado">Certificado</button>
      <button class="av-assist-chip" data-q="Quais as regras de comissão?">Regras de comissão</button>
      <button class="av-assist-chip" data-q="Quanto fica o comercial com 20% de desconto?">Simular desconto</button>
      <button class="av-assist-chip" data-q="Cliente disse que está caro">Objeções</button>
    </div>

    <div class="av-assist-body" id="av-assist-body"></div>

    <div class="av-assist-footer">
      <input type="text" class="av-assist-input" id="av-assist-input" placeholder="Digite sua dúvida comercial..." autocomplete="off"/>
      <button class="av-assist-send" id="av-assist-send" aria-label="Enviar">➤</button>
    </div>

  </div>
`;

if (typeof window !== 'undefined') window.ASSISTANT_TEMPLATE = ASSISTANT_TEMPLATE;
