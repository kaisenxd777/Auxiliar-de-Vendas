/* ============================================================
   CLOUD SYNC — sincronização em background com o backend
   ============================================================
   Responsabilidade ÚNICA: mandar para o backend (Supabase) o
   que o Store já salvou no localStorage. Nunca bloqueia a UI:
   toda chamada é "fire-and-forget" — se falhar, o dado já está
   seguro localmente e entra numa fila de pendências para
   tentar de novo mais tarde (ex: ao recarregar a página, ou
   quando a conexão voltar).

   Para ativar: defina CloudSync.BACKEND_URL abaixo, apontando
   para o seu backend (ex: 'http://localhost:3001/api' em dev,
   ou a URL pública depois de hospedar).

   Para desativar (voltar a usar só localStorage, sem nenhuma
   tentativa de rede): defina CloudSync.ATIVADO = false.
   ============================================================ */
const CloudSync = (() => {

  const ATIVADO = false; // ← troque para true quando o backend estiver no ar
  const BACKEND_URL = 'http://localhost:3001/api';

  const PK = 'av-sync-pendentes-v1'; // fila de operações que falharam

  function getPendentes() {
    try { return JSON.parse(localStorage.getItem(PK)) || []; } catch { return []; }
  }
  function savePendentes(lista) {
    try { localStorage.setItem(PK, JSON.stringify(lista)); } catch (e) {}
  }
  function enfileirar(op) {
    const lista = getPendentes();
    lista.push(op);
    savePendentes(lista);
  }

  async function chamar(metodo, caminho, corpo) {
    const resp = await fetch(`${BACKEND_URL}${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    if (!resp.ok) throw new Error(`Backend respondeu ${resp.status} em ${metodo} ${caminho}`);
    if (resp.status === 204) return null;
    return resp.json();
  }

  // ── Operações espelhando o Store (todas fire-and-forget) ──

  function syncAdd(sale) {
    if (!ATIVADO) return;
    chamar('POST', '/vendas', sale).catch(() => {
      enfileirar({ tipo: 'add', dados: sale, tentativaEm: Date.now() });
    });
  }

  function syncUpdate(sale) {
    if (!ATIVADO) return;
    chamar('PUT', `/vendas/${sale.id}`, sale).catch(() => {
      enfileirar({ tipo: 'update', dados: sale, tentativaEm: Date.now() });
    });
  }

  function syncDelete(id) {
    if (!ATIVADO) return;
    chamar('DELETE', `/vendas/${id}`).catch(() => {
      enfileirar({ tipo: 'delete', dados: { id }, tentativaEm: Date.now() });
    });
  }

  function syncResetAll() {
    if (!ATIVADO) return;
    chamar('DELETE', '/vendas').catch(() => {
      enfileirar({ tipo: 'resetAll', dados: {}, tentativaEm: Date.now() });
    });
  }

  // ── Reprocessa a fila de pendências (chamado no boot e a cada X minutos) ──
  async function reprocessarFila() {
    if (!ATIVADO) return;
    const pendentes = getPendentes();
    if (!pendentes.length) return;

    const restantes = [];
    for (const op of pendentes) {
      try {
        if (op.tipo === 'add')      await chamar('POST', '/vendas', op.dados);
        if (op.tipo === 'update')   await chamar('PUT', `/vendas/${op.dados.id}`, op.dados);
        if (op.tipo === 'delete')   await chamar('DELETE', `/vendas/${op.dados.id}`);
        if (op.tipo === 'resetAll') await chamar('DELETE', '/vendas');
      } catch {
        restantes.push(op); // continua pendente, tenta de novo na próxima
      }
    }
    savePendentes(restantes);
  }

  // ── Busca o estado completo do servidor (usado só para importação manual) ──
  async function buscarTudo() {
    if (!ATIVADO) return null;
    try { return await chamar('GET', '/vendas'); }
    catch { return null; }
  }

  function init() {
    if (!ATIVADO) {
      console.log('☁️ CloudSync desativado — usando apenas localStorage.');
      return;
    }
    reprocessarFila();
    setInterval(reprocessarFila, 5 * 60 * 1000); // tenta de novo a cada 5min
    window.addEventListener('online', reprocessarFila); // tenta assim que a internet voltar
  }

  return { init, syncAdd, syncUpdate, syncDelete, syncResetAll, buscarTudo, ATIVADO };
})();
