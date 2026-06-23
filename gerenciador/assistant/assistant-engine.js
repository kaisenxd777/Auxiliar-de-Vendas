/**
 * ============================================================
 * MOTOR DE RESPOSTAS — Assistente Comercial (modo local)
 * ============================================================
 * Responde com base em regras e na base de conhecimento, sem
 * custo de API e sem chamadas de rede.
 *
 * 🔌 PONTO DE CONEXÃO COM IA REAL (backend)
 * --------------------------------------------
 * Quando houver um backend (Vercel/Netlify Function, servidor
 * próprio), troque o corpo de `responder()` para chamar esse
 * backend em vez de `responderLocalmente()`. O restante do
 * assistente (interface, histórico, sugestões) não muda nada.
 *
 *   async function responder(mensagem) {
 *     const resp = await fetch('/api/assistente-comercial', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ mensagem })
 *     });
 *     return (await resp.json()).resposta;
 *   }
 *
 * A chave de qualquer provedor de IA NUNCA deve aparecer em
 * arquivos de frontend — deve existir apenas no servidor.
 * ============================================================
 */

const AssistantEngine = (() => {

  function normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function encontrarModulo(textoNormalizado) {
    return KNOWLEDGE_BASE.modulos.find(m =>
      m.apelidos.some(ap => textoNormalizado.includes(normalizar(ap)))
    );
  }

  function fmtBRL(v) { return 'R$ ' + v.toFixed(2).replace('.', ','); }

  function responderConsultaModulo(modulo) {
    return [
      `📦 **${modulo.nome}**`,
      '',
      modulo.descricao,
      '',
      '**Funcionalidades:**',
      ...modulo.funcionalidades.map(f => `• ${f}`),
      '',
      '**Benefícios:**',
      ...modulo.beneficios.map(b => `• ${b}`),
      '',
      `**Valor:** ${fmtBRL(modulo.valor)}`,
      `**Comissão:** ${modulo.regraComissao}`,
    ].join('\n');
  }

  function responderSimulacaoDesconto(modulo, textoNormalizado) {
    const pctMatch   = textoNormalizado.match(/(\d{1,3})\s*(%|por cento)/);
    const valorMatch = textoNormalizado.match(/(?:por|em)\s*(\d{1,4}(?:[.,]\d{1,2})?)/);

    if (pctMatch) {
      const pct = parseFloat(pctMatch[1]);
      const valorComDesconto = modulo.valor * (1 - pct / 100);
      return `Com ${pct}% de desconto, **${modulo.nome}** fica em ${fmtBRL(valorComDesconto)} (valor cheio: ${fmtBRL(modulo.valor)}). Consulte a supervisão se o desconto ultrapassar a política comercial vigente.`;
    }

    if (valorMatch) {
      const valorAlvo = parseFloat(valorMatch[1].replace(',', '.'));
      const pctNecessario = ((modulo.valor - valorAlvo) / modulo.valor) * 100;
      if (pctNecessario < 0) {
        return `${fmtBRL(valorAlvo)} é maior que o valor cheio de **${modulo.nome}** (${fmtBRL(modulo.valor)}). Quer simular um desconto em vez disso?`;
      }
      return `Para vender **${modulo.nome}** por ${fmtBRL(valorAlvo)}, é necessário aplicar ${pctNecessario.toFixed(1)}% de desconto. Confirme com a supervisão se esse percentual está dentro da política comercial.`;
    }

    return `Para simular um desconto em **${modulo.nome}**, me diga o percentual (ex: "20%") ou o valor final desejado (ex: "por R$35").`;
  }

  function responderObjecao(textoNormalizado) {
    const objecao = KNOWLEDGE_BASE.objecoes.find(o =>
      o.gatilhos.some(g => textoNormalizado.includes(normalizar(g)))
    );
    return objecao ? objecao.resposta : null;
  }

  function responderMaterial(modulo, textoNormalizado) {
    if (textoNormalizado.includes('video') || textoNormalizado.includes('vídeo')) {
      return `🎬 Vídeo demonstrativo de **${modulo.nome}**: ${modulo.video}`;
    }
    if (textoNormalizado.includes('manual') || textoNormalizado.includes('passo a passo')) {
      return `📘 Manual / passo a passo de **${modulo.nome}**: ${modulo.manual}`;
    }
    return null;
  }

  function responderRegrasGerais() {
    const linhas = ['📋 **Regras de comissão do sistema:**', ''];
    KNOWLEDGE_BASE.regrasComissao.forEach(r => linhas.push(`• ${r.produto}: ${r.rule}`));
    return linhas.join('\n');
  }

  function responderLocalmente(mensagemOriginal) {
    const texto = normalizar(mensagemOriginal);

    if (/^(oi|ol[áa]|bom dia|boa tarde|boa noite)[\s!.]*$/.test(texto)) {
      return 'Olá! Sou o Assistente Comercial. Posso falar sobre módulos, simular descontos, ajudar com objeções de clientes, indicar vídeos/manuais ou listar as regras de comissão. Como posso ajudar?';
    }

    if (texto.includes('regra') && texto.includes('comiss')) {
      return responderRegrasGerais();
    }

    const modulo = encontrarModulo(texto);

    // Se a frase menciona "cliente", é claramente relato de uma fala/objeção
    // do cliente — objeção tem prioridade absoluta sobre qualquer módulo
    // que porventura compartilhe uma palavra com o apelido do módulo.
    if (texto.includes('cliente')) {
      const respostaObjecaoCliente = responderObjecao(texto);
      if (respostaObjecaoCliente) return respostaObjecaoCliente;
    }

    if (modulo) {
      const material = responderMaterial(modulo, texto);
      if (material) return material;
    }

    if (modulo && (texto.includes('desconto') || texto.includes('%') || /\bpor\s*\d/.test(texto) || /\bchegar\s*em\s*\d/.test(texto) || /\bposso vender/.test(texto))) {
      return responderSimulacaoDesconto(modulo, texto);
    }

    const respostaObjecao = responderObjecao(texto);
    if (respostaObjecao) return respostaObjecao;

    if (modulo) return responderConsultaModulo(modulo);

    return 'Não encontrei essa informação na base de conhecimento. Recomendo consultar a supervisão para esse caso específico. Posso ajudar com módulos, descontos, vídeos/manuais, objeções ou regras de comissão.';
  }

  async function responder(mensagem) {
    await new Promise(r => setTimeout(r, 350 + Math.random() * 350));
    return responderLocalmente(mensagem);
  }

  return { responder };
})();

if (typeof window !== 'undefined') window.AssistantEngine = AssistantEngine;
