/**
 * ============================================================
 * BASE DE CONHECIMENTO — Assistente Comercial
 * ============================================================
 * Fonte única de verdade comercial: módulos, preços, regras de
 * comissão (sincronizadas com Config em script1.js), materiais
 * de apoio e objeções de vendas.
 *
 * Para atualizar preços ou textos comerciais, edite apenas aqui.
 * ============================================================
 */

const KNOWLEDGE_BASE = {

  empresa: 'Assistente de Vendas',

  /* Espelha as regras reais de comissão do sistema (Config em
     script1.js), para o assistente nunca informar algo divergente
     do que o Gerenciador realmente calcula. */
  regrasComissao: [
    { produto: 'Reinstalação',                rule: '5% do valor vendido' },
    { produto: 'Certificado',                 rule: 'Fixo R$10,00 por venda' },
    { produto: 'NF-e Importação Avulsa',      rule: 'Fixo R$20,00 por venda' },
    { produto: 'Integração CIOT - NDD',       rule: 'Fixo R$10,00 por venda' },
    { produto: 'Usuário adicional cloud',     rule: 'Valor vendido − R$68,00' },
    { produto: 'Demais módulos e serviços',   rule: '100% do valor vendido' },
  ],

  modulos: [
    {
      id: 'comercial',
      nome: 'Comercial',
      apelidos: ['comercial', 'vendas', 'pedido', 'orçamento', 'orcamento'],
      descricao: 'Módulo central de vendas, com emissão de pedidos, orçamentos e ordens de serviço.',
      funcionalidades: ['Pedido de venda', 'Orçamento', 'Ordem de serviço', 'Cadastro de clientes', 'Relatórios comerciais'],
      beneficios: ['Agiliza o fechamento de vendas', 'Centraliza histórico de clientes', 'Reduz erros de digitação em pedidos'],
      valor: 50.00,
      regraComissao: '100% do valor vendido',
      video: 'https://exemplo.com/videos/comercial',
      manual: 'https://exemplo.com/manuais/comercial',
    },
    {
      id: 'financeiro',
      nome: 'Financeiro',
      apelidos: ['financeiro', 'contas a pagar', 'contas a receber', 'fluxo de caixa'],
      descricao: 'Controle financeiro completo: contas a pagar, a receber e fluxo de caixa.',
      funcionalidades: ['Contas a pagar e a receber', 'Fluxo de caixa', 'Conciliação bancária', 'Relatórios financeiros'],
      beneficios: ['Visão clara da saúde financeira da empresa', 'Evita atrasos em pagamentos e recebimentos'],
      valor: 50.00,
      regraComissao: '100% do valor vendido',
      video: 'https://exemplo.com/videos/financeiro',
      manual: 'https://exemplo.com/manuais/financeiro',
    },
    {
      id: 'estoque',
      nome: 'Estoque',
      apelidos: ['estoque', 'inventário', 'inventario', 'produtos'],
      descricao: 'Controle de estoque com entradas, saídas e inventário.',
      funcionalidades: ['Controle de entradas e saídas', 'Inventário', 'Alertas de estoque mínimo', 'Múltiplos depósitos'],
      beneficios: ['Evita ruptura e excesso de estoque', 'Dá visibilidade em tempo real do inventário'],
      valor: 40.00,
      regraComissao: '100% do valor vendido',
      video: 'https://exemplo.com/videos/estoque',
      manual: 'https://exemplo.com/manuais/estoque',
    },
    {
      id: 'nfe',
      nome: 'NFe',
      apelidos: ['nfe', 'nota fiscal eletrônica', 'nota fiscal'],
      descricao: 'Emissão de Nota Fiscal Eletrônica integrada à SEFAZ.',
      funcionalidades: ['Emissão de NFe', 'Cancelamento e carta de correção', 'Consulta de status na SEFAZ'],
      beneficios: ['Conformidade fiscal automática', 'Reduz risco de erros na emissão'],
      valor: 30.00,
      regraComissao: '100% do valor vendido',
      video: 'https://exemplo.com/videos/nfe',
      manual: 'https://exemplo.com/manuais/nfe',
    },
    {
      id: 'nfe-importacao-avulsa',
      nome: 'NF-e Importação Avulsa',
      apelidos: ['nfe importação avulsa', 'nfe avulsa', 'nota avulsa'],
      descricao: 'Importação avulsa (pontual) de Nota Fiscal Eletrônica de terceiros.',
      funcionalidades: ['Importação individual de NF-e'],
      beneficios: ['Praticidade para casos isolados, sem precisar do módulo completo'],
      valor: 20.00,
      regraComissao: 'Fixo R$20,00 por venda',
      video: 'https://exemplo.com/videos/nfe-avulsa',
      manual: 'https://exemplo.com/manuais/nfe-avulsa',
    },
    {
      id: 'cte',
      nome: 'CT-e',
      apelidos: ['cte', 'ct-e', 'conhecimento de transporte'],
      descricao: 'Emissão de Conhecimento de Transporte Eletrônico.',
      funcionalidades: ['Emissão de CT-e', 'Cancelamento', 'Integração com NFe vinculada'],
      beneficios: ['Conformidade no transporte de cargas'],
      valor: 30.00,
      regraComissao: '100% do valor vendido',
      video: 'https://exemplo.com/videos/cte',
      manual: 'https://exemplo.com/manuais/cte',
    },
    {
      id: 'mdfe',
      nome: 'MDF-e',
      apelidos: ['mdfe', 'mdf-e', 'manifesto de transporte'],
      descricao: 'Emissão de Manifesto Eletrônico de Documentos Fiscais.',
      funcionalidades: ['Emissão de MDF-e', 'Encerramento de manifesto'],
      beneficios: ['Obrigatório para transporte interestadual de cargas'],
      valor: 30.00,
      regraComissao: '100% do valor vendido',
      video: 'https://exemplo.com/videos/mdfe',
      manual: 'https://exemplo.com/manuais/mdfe',
    },
    {
      id: 'ciot',
      nome: 'Integração CIOT - NDD',
      apelidos: ['ciot', 'ciot ndd', 'operação de transporte', 'operacao de transporte'],
      descricao: 'Código Identificador da Operação de Transporte, integrado à NDD/ANTT.',
      funcionalidades: ['Geração de CIOT', 'Vínculo com motoristas e veículos'],
      beneficios: ['Obrigatório para contratação de transporte autônomo'],
      valor: 28.57,
      regraComissao: 'Fixo R$10,00 por venda',
      video: 'https://exemplo.com/videos/ciot',
      manual: 'https://exemplo.com/manuais/ciot',
    },
    {
      id: 'ciot-truckpad',
      nome: 'Integração CIOT - Truckpad',
      apelidos: ['truckpad', 'ciot truckpad'],
      descricao: 'Integração de CIOT via plataforma Truckpad.',
      funcionalidades: ['Geração de CIOT via Truckpad'],
      beneficios: ['Alternativa de integração para quem já usa o Truckpad'],
      valor: 35.00,
      regraComissao: '100% do valor vendido',
      video: 'https://exemplo.com/videos/ciot-truckpad',
      manual: 'https://exemplo.com/manuais/ciot-truckpad',
    },
    {
      id: 'certificado',
      nome: 'Certificado',
      apelidos: ['certificado', 'certificado digital'],
      descricao: 'Emissão e gestão de certificado digital para assinatura de documentos fiscais.',
      funcionalidades: ['Emissão de certificado', 'Renovação', 'Instalação assistida'],
      beneficios: ['Necessário para emissão de notas fiscais eletrônicas'],
      valor: 150.00,
      regraComissao: 'Fixo R$10,00 por venda',
      video: 'https://exemplo.com/videos/certificado',
      manual: 'https://exemplo.com/manuais/certificado',
    },
    {
      id: 'reinstalacao',
      nome: 'Reinstalação',
      apelidos: ['reinstalação', 'reinstalacao', 'reinstalar'],
      descricao: 'Serviço de reinstalação do sistema em nova máquina ou após falha.',
      funcionalidades: ['Reinstalação completa', 'Migração de dados'],
      beneficios: ['Recupera o acesso do cliente rapidamente'],
      valor: 150.00,
      regraComissao: '5% do valor vendido',
      video: 'https://exemplo.com/videos/reinstalacao',
      manual: 'https://exemplo.com/manuais/reinstalacao',
    },
    {
      id: 'usuario-adicional',
      nome: 'Usuário adicional',
      apelidos: ['usuário adicional', 'usuario adicional', 'licença adicional', 'licenca adicional', 'novo usuário'],
      descricao: 'Licenças extras para novos usuários acessarem o sistema simultaneamente.',
      funcionalidades: ['Acesso simultâneo', 'Permissões individuais por usuário'],
      beneficios: ['Escala o sistema conforme o crescimento da equipe'],
      valor: 50.00,
      regraComissao: '100% do valor vendido',
      video: 'https://exemplo.com/videos/usuario-adicional',
      manual: 'https://exemplo.com/manuais/usuario-adicional',
    },
    {
      id: 'usuario-adicional-cloud',
      nome: 'Usuário adicional cloud',
      apelidos: ['usuário adicional cloud', 'usuario cloud', 'licença cloud'],
      descricao: 'Licença extra para usuários na versão em nuvem do sistema.',
      funcionalidades: ['Acesso simultâneo via nuvem', 'Sincronização automática'],
      beneficios: ['Ideal para equipes que trabalham remotamente'],
      valor: 150.00,
      regraComissao: 'Valor vendido − R$68,00',
      video: 'https://exemplo.com/videos/usuario-cloud',
      manual: 'https://exemplo.com/manuais/usuario-cloud',
    },
  ],

  objecoes: [
    {
      gatilhos: ['caro', 'preço alto', 'preco alto', 'muito caro', 'tá caro', 'ta caro'],
      resposta: 'Entendo a preocupação com o investimento. Vale mostrar o retorno: quanto tempo a equipe economiza por mês usando o módulo? Muitas vezes o custo do sistema é menor que uma hora de trabalho manual evitada por mês.',
    },
    {
      gatilhos: ['pensar', 'vou pensar', 'preciso pensar', 'depois eu vejo'],
      resposta: 'Tranquilo, decisão importante merece reflexão. Pergunte o que especificamente ele quer avaliar — preço, funcionalidade ou timing — e ofereça enviar um vídeo ou manual para essa análise. Combine um retorno em data definida, não deixe aberto.',
    },
    {
      gatilhos: ['já tenho sistema', 'ja tenho sistema', 'já possui sistema', 'já uso outro sistema', 'tenho outro sistema'],
      resposta: 'Pergunte o que falta no sistema atual dele — geralmente há uma dor não resolvida. Destaque os diferenciais dos nossos módulos nesse ponto específico e ofereça um período de teste para comparação direta.',
    },
    {
      gatilhos: ['sem orçamento', 'sem orcamento', 'não tenho verba', 'nao tenho verba', 'sem dinheiro', 'não tem orçamento', 'nao tem orcamento', 'não tem verba', 'nao tem verba'],
      resposta: 'Pergunte qual seria o orçamento disponível hoje. Muitas vezes é possível começar com um módulo essencial e expandir depois — mostre o módulo que resolve a dor mais urgente primeiro.',
    },
  ],
};

if (typeof window !== 'undefined') window.KNOWLEDGE_BASE = KNOWLEDGE_BASE;
