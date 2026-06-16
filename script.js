/**
 * ============================================================
 * ASSISTENTE DE VENDAS & COMISSÕES — script.js v5
 * ============================================================
 * BUGS CORRIGIDOS (v4 → v5):
 *  [1] Importer: variável `if(!results.length)` entrava no
 *      bloco format-2 com `cur` nunca resetado (escopo viciado).
 *  [2] toggleMenu: o menu ficava aberto ao rolar a página.
 *  [3] setBar: referenciava Config.META fixo em vez de metas
 *      editáveis pelo usuário.
 *  [4] renderChart: destruía chartInstance mas não aguardava
 *      o ciclo de repaint, causando canvas corrompido no Safari.
 *  [5] exportPDF: `doc.internal.getNumberOfPages()` chamado
 *      no `didDrawPage` retornava count incorreto (era 0).
 *  [6] IDs duplicados `grp-anotacao` no select principal e no
 *      modal de edição — corrigido com IDs distintos.
 *  [7] addSale com qty>1 registrava apenas 1 venda.
 *  [8] Search não limpava destaques ao sair do modo busca.
 *  [9] Paginação não reiniciava ao trocar período/busca.
 * ============================================================
 * NOVAS FUNCIONALIDADES v5:
 *  ✨ Campo quantidade — registra N vendas de uma vez
 *  ✨ Preview de comissão em tempo real no formulário
 *  ✨ Busca por produto no histórico (com destaque)
 *  ✨ Ordenação do histórico (recente, valor, A→Z)
 *  ✨ Paginação do histórico (20 itens/página)
 *  ✨ Ticker médio exibido no painel e no resumo do dia
 *  ✨ Meta editável pelo usuário (botão ✎ nas barras)
 *  ✨ Banner de conquista ao bater meta
 *  ✨ Backup completo (exportar/importar JSON)
 *  ✨ Gráfico pizza movido ao final da página
 *  ✨ Sort e busca preservados ao editar/excluir venda
 * ============================================================
 */
'use strict';

/* ============================================================
   CONFIG
   ============================================================ */
const Config = (() => {
  const ANOTACAO = [
    {name:'API Boleto Fácil',           default:50.00,  rule:'modulo'},
    {name:'API SMS',                    default:28.57,  rule:'modulo'},
    {name:'Averbador de Seguro',        default:28.57,  rule:'modulo'},
    {name:'Backup Nuvem',               default:37.00,  rule:'modulo'},
    {name:'Comercial',                  default:50.00,  rule:'modulo'},
    {name:'CTe / MDFe',                 default:30.00,  rule:'modulo'},
    {name:'DRE',                        default:10.00,  rule:'modulo'},
    {name:'Estoque',                    default:40.00,  rule:'modulo'},
    {name:'Financeiro',                 default:50.00,  rule:'modulo'},
    {name:'Gerencie Vendas',            default:50.00,  rule:'modulo'},
    {name:'Integração CIOT - NDD',      default:28.57,  rule:'fixo10'},
    {name:'Integração CIOT - Truckpad', default:35.00,  rule:'modulo'},
    {name:'Licença adicional',          default:50.00,  rule:'modulo'},
    {name:'Loja Virtual',               default:100.00, rule:'modulo'},
    {name:'Marketplace',                default:71.42,  rule:'modulo'},
    {name:'NFCe',                       default:50.00,  rule:'modulo'},
    {name:'NFe',                        default:30.00,  rule:'modulo'},
    {name:'NFe Importação',             default:150.00, rule:'modulo'},
    {name:'NFSe',                       default:30.00,  rule:'modulo'},
    {name:'NF-e Importação Mensal',     default:null,   rule:'modulo'},
    {name:'SPED',                       default:300.00, rule:'modulo'},
    {name:'Sintegra',                   default:140.00, rule:'modulo'},
    {name:'Usuário adicional',          default:50.00,  rule:'modulo'},
    {name:'Usuário adicional cloud',    default:150.00, rule:'cloud'},
  ];
  const MERCADORIA = [
    {name:'Certificado',            default:150.00, rule:'certificado'},
    {name:'NF-e Importação Avulsa', default:null,   rule:'nfe-avulsa'},
    {name:'Reinstalação',           default:150.00, rule:'reinstalacao'},
  ];
  const ALL = {};
  [...ANOTACAO,...MERCADORIA].forEach(p => { ALL[p.name] = p; });
  return { ANOTACAO, MERCADORIA, ALL };
})();

/* ============================================================
   UTILS
   ============================================================ */
const Utils = (() => {
  function fmtBRL(v) {
    if (isNaN(v) || v === null || v === undefined) return 'R$0,00';
    return 'R$' + Number(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function todayStr() {
    const d = new Date();
    return [String(d.getDate()).padStart(2,'0'), String(d.getMonth()+1).padStart(2,'0'), d.getFullYear()].join('/');
  }
  function dateExtended() {
    const d = new Date();
    const days = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const mons = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    return `${days[d.getDay()]}, ${d.getDate()} de ${mons[d.getMonth()]} de ${d.getFullYear()}`;
  }
  function currentMonthSuffix() {
    const d = new Date();
    return `/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }
  function weekStart() {
    const d = new Date(); d.setDate(d.getDate()-d.getDay()); d.setHours(0,0,0,0); return d;
  }
  function parseDate(str) {
    if (!str || !str.includes('/')) return new Date(0);
    const [dd, mm, yy] = str.split('/');
    return new Date(`${yy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`);
  }
  function toInputDate(str) {
    if (!str || !str.includes('/')) return '';
    const [dd, mm, yy] = str.split('/');
    return `${yy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
  }
  function fromInputDate(str) {
    if (!str || !str.includes('-')) return todayStr();
    const [yy, mm, dd] = str.split('-');
    return `${dd}/${mm}/${yy}`;
  }
  function round2(v) { return Math.round(v * 100) / 100; }
  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  return { fmtBRL, todayStr, dateExtended, currentMonthSuffix, weekStart, parseDate, toInputDate, fromInputDate, round2, escapeHtml, escapeRegex };
})();

/* ============================================================
   STORE — estado central + localStorage
   ============================================================ */
const Store = (() => {
  const SK = 'av-sales-v5';
  const TK = 'av-theme-v5';
  const MK = 'av-metas-v5';
  let sales = [];
  let metas = { sales: 2000, comm: 2000 };

  /* ── Comissão ── */
  function calcCommission(name, value) {
    const p = Config.ALL[name] || { rule: 'modulo' };
    const v = Number(value) || 0;
    if (p.rule === 'reinstalacao') return { rate:'5%',          amount: Utils.round2(v * 0.05),        type:'reinstalacao' };
    if (p.rule === 'certificado')  return { rate:'Fixo R$10',   amount: 10,                             type:'certificado'  };
    if (p.rule === 'nfe-avulsa')   return { rate:'Fixo R$20',   amount: 20,                             type:'nfe-avulsa'   };
    if (p.rule === 'fixo10')       return { rate:'Fixo R$10',   amount: 10,                             type:'fixo'         };
    if (p.rule === 'cloud')        return { rate:'Valor − R$68',amount: Utils.round2(Math.max(0,v-68)), type:'cloud'        };
    return                                { rate:'100%',         amount: Utils.round2(v),               type:'modulo'       };
  }

  /* ── CRUD ── */
  function addSale(name, value, qty) {
    qty = Math.max(1, parseInt(qty) || 1);
    const c = calcCommission(name, value);
    const added = [];
    for (let i = 0; i < qty; i++) {
      const s = {
        id: Date.now() + i,
        product: name,
        value:   Utils.round2(value),
        commission: c.amount,
        rate: c.rate,
        type: c.type,
        date: Utils.todayStr(),
        qty: qty > 1 ? qty : undefined, // armazena qty como referência visual
      };
      sales.push(s);
      added.push(s);
    }
    persist();
    checkAchievements();
    return added;
  }

  function importSale(data) {
    sales.push({
      id: Date.now() + Math.random(),
      product:    data.product,
      value:      Utils.round2(data.value),
      commission: Utils.round2(data.commission),
      rate:       data.rate,
      type:       data.type,
      date:       data.date || Utils.todayStr(),
    });
    persist();
  }

  function updateSale(id, newProduct, newValue, newDate) {
    const idx = sales.findIndex(s => String(s.id) === String(id));
    if (idx === -1) return false;
    const c = calcCommission(newProduct, newValue);
    sales[idx] = { ...sales[idx], product: newProduct, value: Utils.round2(newValue), commission: c.amount, rate: c.rate, type: c.type, date: newDate || sales[idx].date };
    persist();
    return true;
  }

  function deleteSale(id) {
    sales = sales.filter(s => String(s.id) !== String(id));
    persist();
  }

  function reset() { sales = []; persist(); }

  /* ── Queries ── */
  function getFiltered(period) {
    if (period === 'today') return sales.filter(s => s.date === Utils.todayStr());
    if (period === 'week')  { const ws = Utils.weekStart(); return sales.filter(s => Utils.parseDate(s.date) >= ws); }
    if (period === 'month') { const sf = Utils.currentMonthSuffix(); return sales.filter(s => s.date.endsWith(sf)); }
    return [...sales];
  }
  function getThisMonth() { return sales.filter(s => s.date.endsWith(Utils.currentMonthSuffix())); }
  function getToday()     { return sales.filter(s => s.date === Utils.todayStr()); }
  function getAll()       { return [...sales]; }
  function getSaleById(id){ return sales.find(s => String(s.id) === String(id)); }

  function buildGroups(src) {
    const list = src || sales, g = {};
    list.forEach(s => {
      if (!g[s.product]) g[s.product] = { product: s.product, type: s.type, count: 0, tv: 0, tc: 0, items: [] };
      g[s.product].count++;
      g[s.product].tv = Utils.round2(g[s.product].tv + s.value);
      g[s.product].tc = Utils.round2(g[s.product].tc + s.commission);
      g[s.product].items.push(s);
    });
    return Object.values(g);
  }

  function sum(list, key) { return Utils.round2(list.reduce((a, x) => a + (x[key] || 0), 0)); }

  /* ── Metas ── */
  function getMetas() { return { ...metas }; }
  function setMeta(type, value) {
    metas[type] = Math.max(100, Number(value) || 2000);
    try { localStorage.setItem(MK, JSON.stringify(metas)); } catch(e) {}
  }

  /* ── Conquistas ── */
  let _metaWasHit = { sales: false, comm: false };
  function checkAchievements() {
    const m = getThisMonth();
    const tv = sum(m, 'value'), tc = sum(m, 'commission');
    if (tv >= metas.sales && !_metaWasHit.sales) {
      _metaWasHit.sales = true;
      showAchievement(`🎯 Meta de vendas atingida! ${Utils.fmtBRL(tv)} vendidos este mês!`);
    }
    if (tc >= metas.comm && !_metaWasHit.comm) {
      _metaWasHit.comm = true;
      showAchievement(`🏆 Meta de comissão atingida! ${Utils.fmtBRL(tc)} de comissão este mês!`);
    }
  }
  function resetAchievementFlags() { _metaWasHit = { sales: false, comm: false }; }

  function showAchievement(msg) {
    const el = document.getElementById('achievement-banner');
    const txt = document.getElementById('achievement-text');
    if (!el || !txt) return;
    txt.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 8000);
  }

  /* ── Persistência ── */
  function persist() { try { localStorage.setItem(SK, JSON.stringify(sales)); } catch(e) {} }
  function load() {
    try { const r = localStorage.getItem(SK); if (r) sales = JSON.parse(r); } catch(e) { sales = []; }
    try { const m = localStorage.getItem(MK); if (m) metas = { ...metas, ...JSON.parse(m) }; } catch(e) {}
    resetAchievementFlags();
  }
  function saveTheme(t) { try { localStorage.setItem(TK, t); } catch(e) {} }
  function loadTheme()  { try { return localStorage.getItem(TK) || 'dark'; } catch(e) { return 'dark'; } }

  /* ── Backup ── */
  function exportBackup() {
    return JSON.stringify({ version: 5, exportedAt: new Date().toISOString(), sales, metas }, null, 2);
  }
  function importBackup(json) {
    const data = JSON.parse(json);
    if (!data.sales || !Array.isArray(data.sales)) throw new Error('Formato inválido');
    sales = data.sales;
    if (data.metas) metas = { ...metas, ...data.metas };
    persist();
    try { localStorage.setItem(MK, JSON.stringify(metas)); } catch(e) {}
    resetAchievementFlags();
  }

  return {
    calcCommission, addSale, importSale, updateSale, deleteSale, reset,
    getFiltered, getThisMonth, getToday, getAll, getSaleById, buildGroups, sum,
    getMetas, setMeta, load, saveTheme, loadTheme, exportBackup, importBackup
  };
})();

/* ============================================================
   UI — renderização
   ============================================================ */
const UI = (() => {
  let currentPeriod = 'all';
  let currentSort   = 'date-desc';
  let currentSearch = '';
  let currentPage   = 1;
  const PAGE_SIZE   = 20;
  let chartInstance = null;

  const BADGE_LABELS = {
    reinstalacao:'Reinstalação', certificado:'Certificado',
    'nfe-avulsa':'NF-e Avulsa', cloud:'Cloud', fixo:'Fixo R$10', modulo:'Módulo'
  };
  const CHART_COLORS = ['#6366f1','#22c55e','#f59e0b','#e15759','#4e79a7'];

  function badgeLabel(t) { return BADGE_LABELS[t] || 'Módulo'; }

  function refresh() {
    updateMetrics();
    updateDaily();
    updateMetas();
    renderList();
    renderChart();
  }

  function updateMetrics() {
    const all = Store.getFiltered('all');
    const tv = Store.sum(all,'value'), tc = Store.sum(all,'commission');
    const ticket = all.length ? Utils.round2(tv / all.length) : 0;
    document.getElementById('m-count').textContent      = all.length;
    document.getElementById('m-revenue').textContent    = Utils.fmtBRL(tv);
    document.getElementById('m-commission').textContent = Utils.fmtBRL(tc);
    document.getElementById('m-ticket').textContent     = Utils.fmtBRL(ticket);
  }

  function updateDaily() {
    const t = Store.getToday();
    const tv = Store.sum(t,'value'), tc = Store.sum(t,'commission');
    const ticket = t.length ? Utils.round2(tv / t.length) : 0;
    const best = t.length ? t.reduce((a,b) => b.value > a.value ? b : a, t[0]) : null;
    document.getElementById('d-count').textContent   = t.length;
    document.getElementById('d-revenue').textContent = Utils.fmtBRL(tv);
    document.getElementById('d-comm').textContent    = Utils.fmtBRL(tc);
    document.getElementById('d-ticket').textContent  = Utils.fmtBRL(ticket);
    document.getElementById('d-best').textContent    = best ? `${best.product} (${Utils.fmtBRL(best.value)})` : '—';
  }

  function updateMetas() {
    const m = Store.getThisMonth();
    const metas = Store.getMetas();
    setBar('bar-sales','pct-sales','sub-sales', Store.sum(m,'value'),      metas.sales, 'bar-sales');
    setBar('bar-comm', 'pct-comm', 'sub-comm',  Store.sum(m,'commission'), metas.comm,  'bar-comm');
  }

  function setBar(barId, pctId, subId, val, meta, cls) {
    const pct = Math.min(100, Math.round((val / meta) * 100));
    const bar = document.getElementById(barId);
    if (!bar) return;
    bar.style.width = pct + '%';
    bar.className = 'progress-bar ' + (pct >= 100 ? 'bar-done' : cls);
    document.getElementById(pctId).textContent = pct + '%';
    document.getElementById(subId).textContent = `${Utils.fmtBRL(val)} de ${Utils.fmtBRL(meta)} • faltam ${Utils.fmtBRL(Math.max(0, meta - val))}`;
    bar.parentElement.setAttribute('aria-valuenow', pct);
  }

  /* Aplica sort */
  function sortSales(list) {
    const arr = [...list];
    switch (currentSort) {
      case 'date-desc':    return arr.sort((a,b) => Utils.parseDate(b.date) - Utils.parseDate(a.date) || b.id - a.id);
      case 'date-asc':     return arr.sort((a,b) => Utils.parseDate(a.date) - Utils.parseDate(b.date) || a.id - b.id);
      case 'value-desc':   return arr.sort((a,b) => b.value - a.value);
      case 'value-asc':    return arr.sort((a,b) => a.value - b.value);
      case 'product-asc':  return arr.sort((a,b) => a.product.localeCompare(b.product,'pt'));
      default:             return arr;
    }
  }

  /* Aplica busca */
  function filterBySearch(list) {
    if (!currentSearch) return list;
    const q = currentSearch.toLowerCase();
    return list.filter(s => s.product.toLowerCase().includes(q) || s.date.includes(q));
  }

  function renderList() {
    const list   = document.getElementById('sales-list');
    const raw    = Store.getFiltered(currentPeriod);
    const searched = filterBySearch(raw);
    const sorted  = sortSales(searched);

    // Paginação
    const total   = sorted.length;
    const pages   = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > pages) currentPage = pages;
    const start   = (currentPage - 1) * PAGE_SIZE;
    const paged   = sorted.slice(start, start + PAGE_SIZE);

    document.getElementById('list-count').textContent = total + ' venda' + (total !== 1 ? 's' : '');

    if (!total) {
      list.innerHTML = currentSearch
        ? `<div class="search-empty">🔍 Nenhuma venda encontrada para "<strong>${Utils.escapeHtml(currentSearch)}</strong>"</div>`
        : '<div class="empty-state">Nenhuma venda neste período.<br/>Use o formulário acima ou o microfone para começar.</div>';
      renderPagination(0, 1);
      return;
    }

    const qReg = currentSearch ? new RegExp(`(${Utils.escapeRegex(currentSearch)})`, 'gi') : null;

    list.innerHTML = paged.map(s => {
      const productHtml = qReg
        ? Utils.escapeHtml(s.product).replace(qReg, '<mark style="background:rgba(124,124,248,.35);border-radius:3px;padding:0 2px">$1</mark>')
        : Utils.escapeHtml(s.product);
      const isHighlight = qReg && s.product.toLowerCase().includes(currentSearch.toLowerCase());
      return `
        <div class="sale-item${isHighlight?' highlight':''}" data-id="${s.id}">
          <div class="item-dropdown" id="dd-${s.id}">
            <button class="btn-dots" onclick="UI.toggleMenu('${s.id}',event)" title="Opções">⋮</button>
            <div class="item-menu">
              <button class="item-menu-btn" onclick="Editor.open('${s.id}')">✏️ Editar</button>
              <button class="item-menu-btn delete" onclick="Editor.deleteSale('${s.id}')">🗑️ Excluir</button>
            </div>
          </div>
          <div class="sale-info">
            <div class="sale-product">${productHtml}${s.qty > 1 ? `<span class="sale-qty-badge">×${s.qty}</span>` : ''}</div>
            <div class="sale-date">${s.date}</div>
          </div>
          <span class="badge b-${s.type}">${badgeLabel(s.type)}</span>
          <div class="sale-values">
            <div class="sale-value">${Utils.fmtBRL(s.value)}</div>
            <div class="sale-comm">Comissão: ${Utils.fmtBRL(s.commission)} (${s.rate})</div>
          </div>
        </div>`;
    }).join('');

    renderPagination(total, pages);
  }

  function renderPagination(total, pages) {
    const el = document.getElementById('pagination');
    if (!el) return;
    if (pages <= 1) { el.innerHTML = ''; return; }
    let html = '';
    html += `<button class="page-btn" onclick="UI.goPage(${currentPage-1})" ${currentPage===1?'disabled':''}>‹</button>`;
    for (let i = 1; i <= pages; i++) {
      if (pages > 7 && Math.abs(i - currentPage) > 2 && i !== 1 && i !== pages) {
        if (i === currentPage - 3 || i === currentPage + 3) html += '<span style="color:var(--text-muted);padding:0 4px">…</span>';
        continue;
      }
      html += `<button class="page-btn${i===currentPage?' active':''}" onclick="UI.goPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" onclick="UI.goPage(${currentPage+1})" ${currentPage===pages?'disabled':''}>›</button>`;
    el.innerHTML = html;
  }

  function goPage(p) {
    currentPage = p;
    renderList();
    document.getElementById('sales-list').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ── FIX [2]: fecha menus ao scroll ou click fora ── */
  function closeAllMenus() {
    document.querySelectorAll('.item-dropdown.open').forEach(d => d.classList.remove('open'));
  }

  function toggleMenu(id, e) {
    e.stopPropagation();
    const dd = document.getElementById('dd-' + id);
    const wasOpen = dd && dd.classList.contains('open');
    closeAllMenus();
    if (dd && !wasOpen) dd.classList.add('open');
  }

  document.addEventListener('click', closeAllMenus);
  document.addEventListener('scroll', closeAllMenus, true);

  /* ── Gráfico Pizza FIX [4] ── */
  function renderChart() {
    const canvasEl = document.getElementById('top5Chart');
    const legendEl = document.getElementById('top5Legend');
    if (!canvasEl || !legendEl) return;

    const all = Store.getAll();

    if (!all.length) {
      if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
      legendEl.innerHTML = '<p class="chart-empty">Nenhuma venda registrada ainda.</p>';
      return;
    }

    if (typeof Chart === 'undefined') return;

    const counts = {};
    all.forEach(s => counts[s.product] = (counts[s.product] || 0) + 1);
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    const top5   = sorted.slice(0, 5);
    const total  = top5.reduce((a,b) => a + b[1], 0) || 1;
    const labels = top5.map(i => i[0]);
    const data   = top5.map(i => i[1]);
    const colors = CHART_COLORS.slice(0, top5.length);

    /* FIX [4]: destruir e aguardar próximo frame antes de recriar */
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    requestAnimationFrame(() => {
      chartInstance = new Chart(canvasEl, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderColor: 'transparent',
            borderWidth: 0,
            hoverOffset: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.label}: ${ctx.parsed} venda${ctx.parsed!==1?'s':''} (${((ctx.parsed/total)*100).toFixed(1)}%)`
              }
            }
          }
        }
      });

      legendEl.innerHTML = top5.map((item, i) => `
        <div class="chart-legend-item">
          <span class="legend-dot" style="background:${colors[i]}"></span>
          <span class="legend-name">${Utils.escapeHtml(item[0])}</span>
          <span class="legend-pct">${((item[1]/total)*100).toFixed(1)}%</span>
        </div>`).join('');
    });
  }

  function setPeriod(p)   { currentPeriod = p; currentPage = 1; renderList(); } /* FIX [9] */
  function setSort(s)     { currentSort = s;   currentPage = 1; renderList(); } /* FIX [9] */
  function setSearch(q)   { currentSearch = q; currentPage = 1; renderList(); } /* FIX [8] */
  function getPeriod()    { return currentPeriod; }

  return { refresh, renderList, renderChart, setPeriod, setSort, setSearch, goPage, badgeLabel, toggleMenu, closeAllMenus };
})();

/* ============================================================
   SEARCH — busca no histórico
   ============================================================ */
const Search = (() => {
  let timer = null;
  function run(q) {
    const btn = document.getElementById('btn-clear-search');
    if (btn) btn.classList.toggle('hidden', !q);
    clearTimeout(timer);
    timer = setTimeout(() => UI.setSearch(q.trim()), 220); // debounce
  }
  function clear() {
    const inp = document.getElementById('search-input');
    if (inp) { inp.value = ''; inp.focus(); }
    const btn = document.getElementById('btn-clear-search');
    if (btn) btn.classList.add('hidden');
    UI.setSearch('');
  }
  return { run, clear };
})();

/* ============================================================
   EDITOR — editar / excluir vendas
   ============================================================ */
const Editor = (() => {
  let currentId = null;

  function open(id) {
    const sale = Store.getSaleById(id);
    if (!sale) { Toast.show('Venda não encontrada.', 'warn'); return; }
    currentId = String(id);

    const sel = document.getElementById('edit-product');
    const opt = sel ? [...sel.options].find(o => o.value === sale.product) : null;
    if (opt) {
      sel.value = sale.product;
      document.getElementById('edit-custom-row').classList.add('hidden');
    } else {
      sel.value = 'outro';
      document.getElementById('edit-custom-row').classList.remove('hidden');
      document.getElementById('edit-custom').value = sale.product;
    }
    document.getElementById('edit-date').value  = Utils.toInputDate(sale.date);
    document.getElementById('edit-value').value = sale.value.toFixed(2);
    updatePreview();
    document.getElementById('modal-edit').classList.remove('hidden');
  }

  function onProductChange() {
    const sel = document.getElementById('edit-product');
    const isOther = sel.value === 'outro';
    document.getElementById('edit-custom-row').classList.toggle('hidden', !isOther);
    if (!isOther) {
      const cfg = Config.ALL[sel.value];
      if (cfg && cfg.default != null) document.getElementById('edit-value').value = cfg.default.toFixed(2);
    }
    updatePreview();
  }

  function updatePreview() {
    const sel  = document.getElementById('edit-product');
    const name = sel.value === 'outro' ? (document.getElementById('edit-custom').value || '').trim() : sel.value;
    const val  = parseFloat(document.getElementById('edit-value').value) || 0;
    const el   = document.getElementById('edit-comm-preview');
    if (!name || !val) { if (el) el.textContent = ''; return; }
    const c = Store.calcCommission(name, val);
    if (el) el.textContent = `Comissão calculada: ${Utils.fmtBRL(c.amount)} (${c.rate})`;
  }

  function save() {
    const sel     = document.getElementById('edit-product');
    const product = sel.value === 'outro' ? (document.getElementById('edit-custom').value || '').trim() : sel.value;
    const value   = parseFloat(document.getElementById('edit-value').value);
    const date    = Utils.fromInputDate(document.getElementById('edit-date').value);
    if (!product) { Toast.show('Informe o produto.', 'warn'); return; }
    if (!value || value <= 0 || isNaN(value)) { Toast.show('Informe um valor válido.', 'warn'); return; }
    const ok = Store.updateSale(currentId, product, value, date);
    if (!ok) { Toast.show('Erro ao atualizar. Venda não encontrada.', 'error'); return; }
    document.getElementById('modal-edit').classList.add('hidden');
    UI.refresh();
    Toast.show('Venda atualizada com sucesso!', 'success-green');
  }

  function deleteSale(id) {
    if (!confirm('Excluir esta venda do histórico? Esta ação não pode ser desfeita.')) return;
    Store.deleteSale(id);
    UI.refresh();
    Toast.show('Venda excluída.', 'warn');
  }

  function closeModal(e) {
    if (!e || e.target.id === 'modal-edit') {
      document.getElementById('modal-edit').classList.add('hidden');
    }
  }

  return { open, onProductChange, updatePreview, save, deleteSale, closeModal };
})();

/* ============================================================
   META EDITOR — editar metas pelo painel
   ============================================================ */
const MetaEditor = (() => {
  let currentType = 'sales';

  function open(type) {
    currentType = type;
    const metas = Store.getMetas();
    const titles = { sales: '✎ Meta de Vendas', comm: '✎ Meta de Comissão' };
    const labels = { sales: 'Meta de vendas mensais (R$)', comm: 'Meta de comissão mensal (R$)' };
    document.getElementById('meta-modal-title').textContent = titles[type] || '✎ Editar Meta';
    document.getElementById('meta-modal-label').textContent = labels[type] || 'Valor da meta (R$)';
    document.getElementById('meta-value-input').value = metas[type];
    document.getElementById('modal-meta').classList.remove('hidden');
    setTimeout(() => document.getElementById('meta-value-input').select(), 80);
  }

  function save() {
    const val = parseFloat(document.getElementById('meta-value-input').value);
    if (!val || val < 100) { Toast.show('Informe um valor mínimo de R$100.', 'warn'); return; }
    Store.setMeta(currentType, val);
    document.getElementById('modal-meta').classList.add('hidden');
    UI.updateMetas();
    Toast.show('Meta atualizada!', 'success');
  }

  function closeModal(e) {
    if (!e || e.target.id === 'modal-meta') document.getElementById('modal-meta').classList.add('hidden');
  }

  return { open, save, closeModal };
})();

/* ============================================================
   FORM — cadastro de venda
   ============================================================ */
const Form = (() => {
  function onProductChange() {
    const sel = document.getElementById('inp-product');
    document.getElementById('custom-row').classList.toggle('hidden', sel.value !== 'outro');
    const cfg = Config.ALL[sel.value];
    const valEl = document.getElementById('inp-value');
    valEl.value = (cfg && cfg.default != null) ? cfg.default.toFixed(2) : '';
    updateCommPreview();
  }

  function updateCommPreview() {
    const sel     = document.getElementById('inp-product');
    const name    = sel.value === 'outro' ? (document.getElementById('inp-custom').value || '').trim() : sel.value;
    const val     = parseFloat(document.getElementById('inp-value').value) || 0;
    const qty     = parseInt(document.getElementById('inp-qty').value) || 1;
    const preview = document.getElementById('commission-preview');
    if (!preview) return;
    if (!name || !val) { preview.textContent = ''; return; }
    const c = Store.calcCommission(name, val);
    const totalComm = Utils.round2(c.amount * qty);
    preview.textContent = qty > 1
      ? `Comissão por item: ${Utils.fmtBRL(c.amount)} (${c.rate}) — Total (${qty}×): ${Utils.fmtBRL(totalComm)}`
      : `Comissão: ${Utils.fmtBRL(c.amount)} (${c.rate})`;
  }

  function addSale(productOverride, valueOverride) {
    const sel     = document.getElementById('inp-product');
    const product = productOverride || (sel.value === 'outro'
      ? (document.getElementById('inp-custom').value || '').trim()
      : sel.value);
    const value = valueOverride != null ? valueOverride : parseFloat(document.getElementById('inp-value').value);
    const qty   = productOverride ? 1 : (parseInt(document.getElementById('inp-qty').value) || 1);

    if (!product) { Toast.show('Informe o produto.', 'warn'); return false; }
    if (!value || value <= 0 || isNaN(value)) { Toast.show('Informe um valor válido.', 'warn'); return false; }

    const added = Store.addSale(product, value, qty);
    if (!productOverride) {
      sel.value = '';
      document.getElementById('inp-value').value  = '';
      document.getElementById('inp-qty').value    = '1';
      document.getElementById('custom-row').classList.add('hidden');
      document.getElementById('commission-preview').textContent = '';
    }
    UI.refresh();
    const totalComm = Utils.round2(added.reduce((a,s) => a + s.commission, 0));
    const msg = qty > 1
      ? `${qty}× ${product} — comissão total ${Utils.fmtBRL(totalComm)}`
      : `${product} — comissão ${Utils.fmtBRL(added[0].commission)}`;
    Toast.show(msg, 'success');
    Speech.say(`Venda registrada. ${product}. Comissão de ${added[0].commission.toFixed(2).replace('.', ' vírgula ')} reais.`);
    return true;
  }

  function prefill(name) {
    const sel = document.getElementById('inp-product');
    const opt = [...sel.options].find(o => o.value === name);
    if (opt) sel.value = name;
    onProductChange();
    document.getElementById('inp-value').focus();
  }

  return { onProductChange, updateCommPreview, addSale, prefill };
})();

/* ============================================================
   SPEECH
   ============================================================ */
const Speech = (() => {
  let voices = [];
  function loadVoices() { if (window.speechSynthesis) voices = window.speechSynthesis.getVoices(); }
  function say(text) {
    if (localStorage.getItem('voiceEnabled') === 'false') return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR'; u.rate = 1.05; u.pitch = 1;
    const v = voices.find(x => x.lang && x.lang.startsWith('pt'));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }
  if (window.speechSynthesis) { loadVoices(); window.speechSynthesis.addEventListener('voiceschanged', loadVoices); }
  return { say };
})();

/* ============================================================
   VOICE
   ============================================================ */
const Voice = (() => {
  let rec = null, listening = false;
  const SUPPORTED = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  function toggle() {
    if (!SUPPORTED) { Toast.show('Use o Chrome para voz.', 'warn'); return; }
    listening ? stop() : start();
  }

  function start() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    rec = new SR(); rec.lang = 'pt-BR'; rec.continuous = false; rec.interimResults = true;
    rec.onstart = () => {
      listening = true;
      document.getElementById('btn-mic').classList.add('listening');
      document.getElementById('btn-mic').textContent = '🔴';
      document.getElementById('voice-status').innerHTML = '<span class="voice-label">Ouvindo...</span> — fale o produto e o valor';
    };
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      document.getElementById('voice-transcript').textContent = '🗣 "' + t + '"';
      if (e.results[e.results.length-1].isFinal) parse(t);
    };
    rec.onerror = () => { stop(); Toast.show('Não entendi. Tente novamente.', 'warn'); };
    rec.onend   = () => stop();
    rec.start();
  }

  function stop() {
    listening = false;
    if (rec) try { rec.stop(); } catch(e) {}
    document.getElementById('btn-mic').classList.remove('listening');
    document.getElementById('btn-mic').textContent = '🎙️';
    document.getElementById('voice-status').innerHTML = '<span class="voice-label">Microfone</span> — diga ex: <em>"Estoque quarenta reais"</em>';
  }

  function parse(text) {
    const n = text.toLowerCase().replace(/reais?/g,'').replace('r$','').replace(',','.');
    const numMatch = n.match(/(\d+(?:\.\d+)?)/);
    const value    = numMatch ? parseFloat(numMatch[1]) : null;
    let bestMatch  = null, bestScore = 0;
    Object.keys(Config.ALL).forEach(name => {
      const nLow = name.toLowerCase();
      let score  = 0;
      nLow.split(/\s+/).forEach(w => { if (w.length > 2 && n.includes(w)) score++; });
      if (nLow.includes('ciot') && n.includes('ciot')) score += 3;
      if (nLow.includes('ndd')  && n.includes('ndd'))  score += 3;
      if (nLow.includes('nfe')  && n.includes('nfe'))  score += 2;
      if (score > bestScore) { bestScore = score; bestMatch = name; }
    });
    if (!bestMatch || bestScore === 0) {
      Toast.show('Produto não reconhecido.', 'warn');
      document.getElementById('voice-transcript').textContent = '';
      return;
    }
    const cfg = Config.ALL[bestMatch];
    const fv  = value ?? (cfg.default != null ? cfg.default : null);
    if (!fv) { Form.prefill(bestMatch); Toast.show(`"${bestMatch}" reconhecido. Informe o valor.`, 'warn'); return; }
    const ok = Form.addSale(bestMatch, fv);
    if (ok) document.getElementById('voice-transcript').textContent = `✅ "${bestMatch}" — ${Utils.fmtBRL(fv)}`;
  }

  return { toggle };
})();

/* ============================================================
   TOAST
   ============================================================ */
const Toast = (() => {
  let timer = null;
  function show(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const icon  = document.getElementById('toast-icon');
    const msgEl = document.getElementById('toast-msg');
    if (!toast || !icon || !msgEl) return;
    msgEl.textContent = msg;
    toast.classList.remove('toast-green', 'hiding', 'hidden');
    icon.className  = 'toast-icon' + (type !== 'success' && type !== 'success-green' ? ` ${type}` : '');
    icon.textContent = (type === 'success' || type === 'success-green') ? '✓' : (type === 'error' ? '✕' : '!');
    if (type === 'success-green') toast.classList.add('toast-green');
    clearTimeout(timer);
    timer = setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.classList.add('hidden'), 220);
    }, 3400);
  }
  return { show };
})();

/* ============================================================
   REPORT — texto, PDF (jsPDF multipáginas), Excel
   ============================================================ */
const Report = (() => {

  function generateText() {
    const all = Store.getFiltered('all');
    if (!all.length) { Toast.show('Nenhuma venda para gerar relatório.', 'warn'); return; }
    const groups = Store.buildGroups(all);
    const tv = Store.sum(all,'value'), tc = Store.sum(all,'commission');
    const ticket = all.length ? Utils.round2(tv / all.length) : 0;
    const lines = ['📊 RELATÓRIO DETALHADO DE VENDAS\n'];
    groups.forEach(g => {
      lines.push(`\n${g.product.toUpperCase()} — ${g.count} venda${g.count!==1?'s':''}`);
      g.items.forEach((s,i) => lines.push(`  ${i+1}. ${s.date}  |  Valor: ${Utils.fmtBRL(s.value)}  |  Comissão: ${Utils.fmtBRL(s.commission)} (${s.rate})`));
      lines.push(`  ↳ Subtotal: ${Utils.fmtBRL(g.tv)} vendido  |  ${Utils.fmtBRL(g.tc)} comissão`);
    });
    lines.push('\n' + '─'.repeat(52));
    lines.push('RESUMO GERAL');
    lines.push(`Total de vendas:  ${all.length}`);
    lines.push(`Receita total:    ${Utils.fmtBRL(tv)}`);
    lines.push(`Ticket médio:     ${Utils.fmtBRL(ticket)}`);
    lines.push(`Comissão total:   ${Utils.fmtBRL(tc)}`);
    document.getElementById('modal-content').textContent = lines.join('\n');
    document.getElementById('modal-report').classList.remove('hidden');
  }

  function closeModal(e) {
    if (!e || e.target.id === 'modal-report') document.getElementById('modal-report').classList.add('hidden');
  }

  function copyToClipboard() {
    const text = document.getElementById('modal-content').textContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => Toast.show('Copiado!', 'success'));
    } else {
      const ta = document.createElement('textarea'); ta.value = text;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      Toast.show('Copiado!', 'success');
    }
  }

  /* PDF multipáginas com jsPDF */
  function exportPDF() {
    const all = Store.getFiltered('all');
    if (!all.length) { Toast.show('Nenhuma venda para exportar.', 'warn'); return; }

    const jspdfLib = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jspdfLib) { Toast.show('Biblioteca jsPDF não carregada. Verifique a conexão.', 'error'); return; }

    const doc    = new jspdfLib({ orientation:'portrait', unit:'mm', format:'a4' });
    const groups = Store.buildGroups(all);
    const tv     = Store.sum(all,'value'), tc = Store.sum(all,'commission');
    const today  = Utils.todayStr();
    const fname  = `relatorio-vendas-${today.replace(/\//g,'-')}.pdf`;

    const C = {
      dark:   [30,30,46],   purple: [99,102,241],
      green:  [34,197,94],  white:  [255,255,255],
      gray:   [100,100,130],light:  [210,210,235],
      bg:     [245,245,252],gold:   [245,158,11],
    };

    /* Cabeçalho */
    doc.setFillColor(...C.dark);
    doc.rect(0, 0, 210, 36, 'F');
    doc.setTextColor(...C.white);
    doc.setFont('helvetica','bold'); doc.setFontSize(17);
    doc.text('Relatório de Vendas & Comissões', 14, 16);
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.setTextColor(...C.light);
    doc.text(`Gerado em ${today}  •  ${all.length} vendas registradas`, 14, 26);

    /* Cards resumo */
    const cY=42, cW=55, cH=20, gap=6, cx=14;
    [
      ['Total de vendas', String(all.length), C.purple],
      ['Receita total',   Utils.fmtBRL(tv),   C.green],
      ['Comissão total',  Utils.fmtBRL(tc),   C.gold],
    ].forEach((c,i) => {
      const x = cx + (cW+gap)*i;
      doc.setFillColor(...c[2]); doc.roundedRect(x, cY, cW, cH, 3, 3, 'F');
      doc.setTextColor(...C.white); doc.setFont('helvetica','normal'); doc.setFontSize(8);
      doc.text(c[0], x+4, cY+7);
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      doc.text(c[1], x+4, cY+16);
    });

    /* Tabela — AutoTable com multipáginas automático */
    const tableRows = [];
    groups.forEach(g => {
      tableRows.push([{
        content: `${g.product.toUpperCase()}  —  ${g.count} venda${g.count!==1?'s':''}`,
        colSpan: 4,
        styles: { fillColor: C.dark, textColor: C.white, fontStyle:'bold', fontSize:9 }
      }]);
      g.items.forEach((s,i) => tableRows.push([`${i+1}. ${s.date}`, Utils.fmtBRL(s.value), Utils.fmtBRL(s.commission), s.rate]));
      tableRows.push([
        { content:'Subtotal', styles:{ fontStyle:'italic', textColor:C.gray } },
        { content:Utils.fmtBRL(g.tv), styles:{ fontStyle:'bold', halign:'right' } },
        { content:Utils.fmtBRL(g.tc), styles:{ fontStyle:'bold', halign:'right', textColor:[34,197,94] } },
        '',
      ]);
    });

    doc.autoTable({
      head: [[
        { content:'Produto / Data',  styles:{ halign:'left'   } },
        { content:'Valor vendido',   styles:{ halign:'right'  } },
        { content:'Comissão',        styles:{ halign:'right'  } },
        { content:'Regra',           styles:{ halign:'center' } },
      ]],
      body: tableRows,
      foot: [[
        { content:'TOTAL GERAL', styles:{ fontStyle:'bold', fillColor:C.dark, textColor:C.white } },
        { content:Utils.fmtBRL(tv), styles:{ fontStyle:'bold', halign:'right', fillColor:C.dark, textColor:C.white } },
        { content:Utils.fmtBRL(tc), styles:{ fontStyle:'bold', halign:'right', fillColor:C.dark, textColor:[134,239,172] } },
        '',
      ]],
      showFoot: 'lastPage',
      startY: cY + cH + 8,
      margin: { left:14, right:14 },
      styles: { fontSize:9, cellPadding:3, overflow:'linebreak' },
      headStyles: { fillColor:C.purple, textColor:C.white, fontStyle:'bold', fontSize:9 },
      alternateRowStyles: { fillColor:C.bg },
      footStyles: { fillColor:C.dark, textColor:C.white, fontStyle:'bold' },
      columnStyles: { 0:{cellWidth:82}, 1:{cellWidth:34,halign:'right'}, 2:{cellWidth:34,halign:'right'}, 3:{cellWidth:28,halign:'center'} },
      /* FIX [5]: usa doc.internal.pages.length no didDrawPage */
      didDrawPage: () => {
        const pg    = doc.internal.getCurrentPageInfo().pageNumber;
        const total = doc.internal.pages.length - 1; // pages[0] é placeholder
        doc.setFontSize(8); doc.setTextColor(...C.gray);
        doc.text(`Assistente de Vendas & Comissões  •  Página ${pg} de ${total}`, 14, 291);
        doc.text(today, 196, 291, { align:'right' });
      }
    });

    doc.save(fname);
    Toast.show('PDF gerado e baixado com sucesso!', 'success');
  }

  /* Excel .xlsx com SheetJS */
  function exportExcel() {
    const all = Store.getFiltered('all');
    if (!all.length) { Toast.show('Nenhuma venda para exportar.', 'warn'); return; }
    if (typeof XLSX === 'undefined') { Toast.show('Biblioteca XLSX não carregada.', 'error'); return; }

    const groups = Store.buildGroups(all);
    const tv     = Store.sum(all,'value'), tc = Store.sum(all,'commission');
    const ticket = all.length ? Utils.round2(tv / all.length) : 0;
    const today  = Utils.todayStr();
    const wb     = XLSX.utils.book_new();

    /* Aba 1 — Resumo */
    const wsRes = XLSX.utils.aoa_to_sheet([
      ['VENDAS E COMISSÕES — RESUMO EXECUTIVO'],
      [''],
      ['Gerado em:', today],
      [''],
      ['INDICADORES GERAIS'],
      ['Total de vendas',        all.length],
      ['Receita total (R$)',     tv],
      ['Comissão total (R$)',    tc],
      ['Ticket médio (R$)',      ticket],
      [''],
      ['RESUMO POR PRODUTO'],
      ['Produto','Qtd.','Total Vendido (R$)','Total Comissão (R$)','% Comissão','Ticket Médio (R$)'],
      ...groups.map(g => [
        g.product, g.count, g.tv, g.tc,
        g.tv > 0 ? Utils.round2((g.tc/g.tv)*100) : 0,
        g.count > 0 ? Utils.round2(g.tv/g.count) : 0,
      ]),
      ['TOTAL', all.length, tv, tc, tv > 0 ? Utils.round2((tc/tv)*100) : 0, ticket],
    ]);
    wsRes['!cols'] = [{wch:30},{wch:8},{wch:20},{wch:20},{wch:14},{wch:18}];
    XLSX.utils.book_append_sheet(wb, wsRes, 'Resumo');

    /* Aba 2 — Detalhamento */
    const wsDet = XLSX.utils.aoa_to_sheet([
      ['DETALHAMENTO COMPLETO'],
      ['Gerado em:', today],
      [''],
      ['Produto','Data','Valor Vendido (R$)','Comissão (R$)','Regra','Tipo'],
      ...all.map(s => [s.product, s.date, s.value, s.commission, s.rate, UI.badgeLabel(s.type)]),
      [''],
      ['TOTAL','', tv, tc, '',''],
    ]);
    wsDet['!cols'] = [{wch:28},{wch:13},{wch:18},{wch:16},{wch:22},{wch:14}];
    XLSX.utils.book_append_sheet(wb, wsDet, 'Detalhamento');

    /* Aba 3 — Regras */
    const wsReg = XLSX.utils.aoa_to_sheet([
      ['REGRAS DE COMISSÃO'],
      [''],
      ['Produto / Categoria','Regra de Comissão'],
      ['Reinstalação',              '5% do valor vendido'],
      ['Certificado',               'Fixo R$10,00 por venda'],
      ['NF-e Importação Avulsa',    'Fixo R$20,00 por venda'],
      ['Integração CIOT - NDD',     'Fixo R$10,00 por venda'],
      ['Usuário adicional cloud',   'Valor vendido − R$68,00'],
      ['Demais módulos e serviços', '100% do valor vendido'],
      [''],
      ['Meta mensal de vendas (R$)',     Store.getMetas().sales],
      ['Meta mensal de comissão (R$)',   Store.getMetas().comm],
    ]);
    wsReg['!cols'] = [{wch:30},{wch:30}];
    XLSX.utils.book_append_sheet(wb, wsReg, 'Regras');

    XLSX.writeFile(wb, `relatorio-vendas-${today.replace(/\//g,'-')}.xlsx`);
    Toast.show('Planilha Excel exportada com sucesso!', 'success');
  }

  return { generateText, closeModal, copyToClipboard, exportPDF, exportExcel };
})();

/* ============================================================
   IMPORTER — importação de relatório em texto
   FIX [1]: parser refatorado sem reutilização de variáveis
   ============================================================ */
const Importer = (() => {
  let pendingSales = [];

  function openModal() {
    pendingSales = [];
    const ta = document.getElementById('import-textarea');
    if (ta) ta.value = '';
    ['import-preview','import-error','btn-confirm-import'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    document.getElementById('modal-import').classList.remove('hidden');
    setTimeout(() => { if (ta) ta.focus(); }, 100);
  }

  function closeModal(e) {
    if (!e || e.target.id === 'modal-import') document.getElementById('modal-import').classList.add('hidden');
  }

  function preview() {
    const text = (document.getElementById('import-textarea').value || '').trim();
    document.getElementById('import-error').classList.add('hidden');
    document.getElementById('import-preview').classList.add('hidden');
    document.getElementById('btn-confirm-import').classList.add('hidden');
    if (!text) { showError('Cole um relatório no campo acima.'); return; }
    const parsed = parse(text);
    if (!parsed.length) {
      showError('Nenhuma venda identificada.\n\nFormatos aceitos:\n• PRODUTO — N vendas\n  1. DD/MM/AAAA  |  Valor: R$X  |  ...\n\n• PRODUTO\n  Quantidade vendida: N\n  Total de vendas: R$X');
      return;
    }
    pendingSales = parsed;
    renderPreview(parsed);
  }

  /* FIX [1]: cada tentativa usa escopo próprio e variáveis isoladas */
  function parse(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // ── Formato 1: detalhado ──
    const results1 = [];
    let curProd1   = null;
    for (const line of lines) {
      const hm = line.match(/^(.+?)\s*[—–-]\s*\d+\s*vendas?$/i)
              || line.match(/^(.+?)\s*\(\d+\s*vendas?\)$/i);
      if (hm) { curProd1 = normProduct(hm[1].trim()); continue; }
      const sm = line.match(/^\d+\.\s+(\d{2}\/\d{2}\/\d{4})\s*\|?\s*valor:\s*R?\$?\s*([\d.,]+)/i);
      if (sm && curProd1) {
        const v = parseBRL(sm[2]);
        if (v > 0) results1.push({ product: curProd1, value: v, date: sm[1] });
      }
    }
    if (results1.length) return results1;

    // ── Formato 2: resumido ──
    const results2  = [];
    let curProd2    = null;
    let qty2 = 0, total2 = 0;
    const flush2 = () => {
      if (curProd2 && qty2 > 0 && total2 > 0) {
        const perSale = Utils.round2(total2 / qty2);
        for (let j = 0; j < qty2; j++) results2.push({ product: curProd2, value: perSale, date: Utils.todayStr() });
      }
    };
    for (const line of lines) {
      const isProductLine = line === line.toUpperCase()
        && /^[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ\/\s\-\.&0-9]+$/.test(line)
        && line.length > 2
        && !['QUANTIDADE','TOTAL','RECEITA','COMISSÃO','RESUMO'].some(k => line.startsWith(k))
        && !line.includes(':');
      if (isProductLine) { flush2(); curProd2 = normProduct(line); qty2 = 0; total2 = 0; continue; }
      const qm = line.match(/quantidade\s+vendida:\s*(\d+)/i);
      const tm = line.match(/total\s+de\s+vendas?:\s*R?\$?\s*([\d.,]+)/i);
      if (qm) qty2   = parseInt(qm[1], 10);
      if (tm) total2 = parseBRL(tm[1]);
    }
    flush2();
    if (results2.length) return results2;

    // ── Formato 3: avulso ──
    const results3 = [];
    for (const line of lines) {
      const m = line.match(/produto:\s*(.+?)\s+valor:\s*R?\$?\s*([\d.,]+)/i);
      if (m) { const v = parseBRL(m[2]); if (v > 0) results3.push({ product: normProduct(m[1].trim()), value: v, date: Utils.todayStr() }); }
    }
    return results3;
  }

  function normProduct(raw) {
    const lower   = raw.toLowerCase().trim();
    const exact   = Object.keys(Config.ALL).find(n => n.toLowerCase() === lower);
    if (exact) return exact;
    const partial = Object.keys(Config.ALL).find(n => { const nl = n.toLowerCase(); return nl.includes(lower) || lower.includes(nl); });
    return partial || raw.replace(/\b\w/g, c => c.toUpperCase());
  }

  function parseBRL(str) {
    if (!str) return 0;
    return parseFloat(String(str).replace(/\./g,'').replace(',','.')) || 0;
  }

  function renderPreview(sales) {
    const listEl = document.getElementById('import-preview-list');
    if (!listEl) return;
    listEl.innerHTML = sales.map(s => {
      const c = Store.calcCommission(s.product, s.value);
      return `<div class="import-preview-item">
        <div><div class="ip-product">${Utils.escapeHtml(s.product)}</div><div class="ip-date">${s.date}</div></div>
        <div class="ip-value">${Utils.fmtBRL(s.value)}</div>
        <div class="ip-comm">Comissão: ${Utils.fmtBRL(c.amount)}</div>
      </div>`;
    }).join('');
    const tv = Utils.round2(sales.reduce((a,s) => a + s.value, 0));
    const tc = Utils.round2(sales.map(s => Store.calcCommission(s.product,s.value).amount).reduce((a,v)=>a+v,0));
    listEl.innerHTML += `<div class="import-preview-item" style="border-top:1px solid var(--border-strong);margin-top:4px;padding-top:10px">
      <div><div class="ip-product">TOTAL — ${sales.length} venda${sales.length!==1?'s':''}</div></div>
      <div class="ip-value">${Utils.fmtBRL(tv)}</div>
      <div class="ip-comm">${Utils.fmtBRL(tc)}</div>
    </div>`;
    document.getElementById('import-preview').classList.remove('hidden');
    document.getElementById('btn-confirm-import').classList.remove('hidden');
  }

  function confirm() {
    if (!pendingSales.length) return;
    pendingSales.forEach(s => {
      const c = Store.calcCommission(s.product, s.value);
      Store.importSale({ product:s.product, value:s.value, commission:c.amount, rate:c.rate, type:c.type, date:s.date });
    });
    UI.refresh();
    document.getElementById('modal-import').classList.add('hidden');
    Toast.show(`${pendingSales.length} venda${pendingSales.length!==1?'s':''} importada${pendingSales.length!==1?'s':''} com sucesso!`, 'success');
    pendingSales = [];
  }

  function showError(msg) {
    const el = document.getElementById('import-error');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
  }

  return { openModal, closeModal, preview, confirm };
})();

/* ============================================================
   BACKUP — exportar/importar JSON completo
   ============================================================ */
const Backup = (() => {
  function exportBackup() {
    const json  = Store.exportBackup();
    const today = Utils.todayStr().replace(/\//g,'-');
    const blob  = new Blob([json], { type:'application/json' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url; a.download = `backup-vendas-${today}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Toast.show('Backup exportado com sucesso!', 'success');
  }

  function importBackup() {
    document.getElementById('backup-file-input').click();
  }

  function importFile(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        Store.importBackup(e.target.result);
        UI.refresh();
        Toast.show('Backup restaurado com sucesso!', 'success-green');
      } catch(err) {
        Toast.show('Arquivo inválido. Verifique o backup.', 'error');
      }
      input.value = ''; // reset para permitir reimportar o mesmo arquivo
    };
    reader.readAsText(file);
  }

  return { export: exportBackup, import: importBackup, importFile };
})();

/* ============================================================
   APP — inicialização e controles globais
   ============================================================ */
const App = (() => {
  function buildSelects(grpAId, grpMId) {
    const srt = (a,b) => a.name.localeCompare(b.name,'pt');
    const gA  = document.getElementById(grpAId);
    const gM  = document.getElementById(grpMId);
    if (!gA || !gM) return;
    [...Config.ANOTACAO].sort(srt).forEach(p => {
      const o = document.createElement('option'); o.value = p.name; o.textContent = p.name; gA.appendChild(o);
    });
    [...Config.MERCADORIA].sort(srt).forEach(p => {
      const o = document.createElement('option'); o.value = p.name; o.textContent = p.name; gM.appendChild(o);
    });
  }

  function toggleTheme() {
    const isLight = document.body.classList.toggle('light');
    Store.saveTheme(isLight ? 'light' : 'dark');
    document.getElementById('btn-theme').textContent = isLight ? '🌕' : '🌙';
  }

  function setPeriod(period, btn) {
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    UI.setPeriod(period);
  }

  function setSort(val) { UI.setSort(val); }

  function resetSales() {
    if (!confirm('Apagar TODAS as vendas? Esta ação não pode ser desfeita.\n\nDica: faça um backup antes!')) return;
    Store.reset(); UI.refresh(); Toast.show('Histórico resetado.', 'warn');
  }

  function handleKeyboard(e) {
    if (e.key === 'Escape') {
      ['modal-report','modal-edit','modal-import','modal-meta'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });
      UI.closeAllMenus();
    }
    if (e.key === 'Enter' && document.activeElement.id === 'inp-value')    Form.addSale();
    if (e.key === 'Enter' && document.activeElement.id === 'edit-value')   Editor.save();
    if (e.key === 'Enter' && document.activeElement.id === 'meta-value-input') MetaEditor.save();
  }

  function init() {
    Store.load();

    // Tema
    if (Store.loadTheme() === 'light') {
      document.body.classList.add('light');
      document.getElementById('btn-theme').textContent = '🌕';
    }

    // Data
    const hd = document.getElementById('header-date');
    if (hd) hd.textContent = Utils.dateExtended();

    // Selects — formulário principal
    buildSelects('grp-anotacao', 'grp-mercadoria');
    // Selects — modal edição (IDs distintos — FIX [6])
    buildSelects('edit-grp-anotacao', 'edit-grp-mercadoria');

    // Narração
    const cb = document.getElementById('voice-enabled');
    if (cb) {
      cb.checked = localStorage.getItem('voiceEnabled') !== 'false';
      cb.addEventListener('change', () => localStorage.setItem('voiceEnabled', cb.checked));
    }

    // Preview comissão em tempo real
    ['inp-product','inp-value','inp-qty'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(id === 'inp-product' ? 'change' : 'input', Form.updateCommPreview);
    });

    // Listeners modal edição
    const ep = document.getElementById('edit-product');
    if (ep) ep.addEventListener('change', () => { Editor.onProductChange(); Editor.updatePreview(); });

    // Teclado
    document.addEventListener('keydown', handleKeyboard);

    // Renderiza
    UI.refresh();
    console.log('✅ Assistente de Vendas v5 iniciado.');
  }

  return { init, toggleTheme, setPeriod, setSort, resetSales };
})();

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', App.init);
