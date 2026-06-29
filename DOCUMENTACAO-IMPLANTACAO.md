# Documentação de Implantação — Auxiliar de Vendas
## Sincronização em nuvem (Supabase) + Backend (Node/Express) + Novos módulos comerciais

Versão: 1.0
Data: 2026-06-29

Esta documentação cobre **todos os arquivos alterados ou criados** nesta etapa do
projeto. Foi escrita para que um desenvolvedor sem contexto prévio consiga
implantar tudo sozinho, sem precisar interpretar decisões ou perguntar nada.

> ⚠ **Aviso sobre este pacote:** a pasta `gerenciador/assistant/` (com
> `knowledge-base.js`, `assistant-engine.js`, `assistant-template.js` e
> `assistant.js`) **não está incluída neste zip** — esses arquivos já existem
> no repositório original e não foram alterados nesta etapa, mas nunca foram
> enviados a mim, então não tenho o conteúdo para reempacotar. Ao substituir
> `gerenciador.html`, mantenha a pasta `assistant/` que já existe no seu
> repositório — ela não precisa de nenhuma mudança.

---

## 1. Resumo das alterações e motivo de cada uma

### 1.1 `gerenciador/script1.js` (ALTERADO)

| Alteração | Motivo |
|---|---|
| Adicionado `Utils.generateId()` | O sistema gerava IDs de venda com `Date.now() + i`. Duas vendas registradas no mesmo milissegundo (ex: clique duplo, ou `qty > 1`) podiam colidir e se sobrescrever silenciosamente. O novo gerador usa `crypto.randomUUID()` (ou um fallback com contador, se o navegador não suportar) — elimina o risco de colisão. |
| `addSale` e `importSale` agora usam `Utils.generateId()` em vez de `Date.now()` | Consequência direta do item acima — são os dois únicos pontos do sistema que criavam IDs de venda. |
| Adicionados 4 novos produtos em `Config.ANOTACAO`: **Android** (R$ 50,00), **Migração de plano** (R$ 100,00), **SPED Avulso** (R$ 350,00), **Sintegra Avulso** (R$ 150,00) | Solicitação direta de negócio — novos módulos comerciais vendidos pela equipe. |
| Nova regra de comissão `fixo20` em `calcCommission()` | **SPED Avulso** e **Sintegra Avulso** têm comissão fixa de R$ 20,00, independente do valor cobrado do cliente — regra que não existia antes (só havia `fixo10`). |
| `addSale`, `importSale`, `updateSale`, `deleteSale`, `reset` agora chamam `CloudSync.sync*()` | Ponto de integração com a sincronização em nuvem (ver `cloud-sync.js` abaixo). Cada operação de escrita no `localStorage` agora também tenta replicar a mudança no backend, **sem bloquear a interface**. |
| Boot alterado de `App.init` para `() => { CloudSync.init(); App.init(); }` | Garante que a fila de sincronização pendente seja reprocessada assim que o sistema abre, antes de qualquer outra coisa. |

> **Nenhuma função teve sua assinatura alterada.** Todo o código que já chamava
> `Store.addSale(...)`, `Store.deleteSale(...)` etc. continua funcionando
> exatamente igual, sem precisar de `await` ou qualquer mudança no chamador.

### 1.2 `gerenciador/cloud-sync.js` (NOVO ARQIVO)

Módulo isolado responsável por sincronizar os dados do `localStorage` com o
backend, em segundo plano. Características:

- **Desativado por padrão** (`ATIVADO = false`). Enquanto estiver assim, **nenhuma chamada de rede é feita** — o sistema funciona 100% como antes, só com localStorage.
- Quando ativado, cada operação de escrita (criar, editar, excluir, resetar) é enviada ao backend de forma assíncrona. Se a chamada falhar (sem internet, backend fora do ar), a operação entra numa fila local e é reprocessada automaticamente:
  - a cada 5 minutos;
  - sempre que o navegador detectar que a internet voltou (evento `online`).
- Não depende de nenhuma outra parte do sistema além do `fetch` nativo do navegador.

### 1.3 `gerenciador/gerenciador.html` (ALTERADO)

| Alteração | Motivo |
|---|---|
| Adicionada a linha `<script src="cloud-sync.js"></script>` imediatamente antes de `<script src="script1.js"></script>` | O `script1.js` referencia o objeto global `CloudSync`, então o arquivo que o define precisa ser carregado primeiro. Nenhuma outra linha do HTML foi tocada. |

### 1.4 `backend/server.js` (NOVO)

Servidor Express principal. Define CORS (restrito às origens do `.env`),
expõe `/api/health` (teste de vida) e registra as rotas `/api/vendas` e
`/api/chat`.

### 1.5 `backend/supabaseClient.js` (NOVO)

Cliente único do Supabase, usando a **service role key** (acesso total ao
banco). Por isso este arquivo só pode existir no backend — nunca no frontend.

### 1.6 `backend/routes/vendas.js` (NOVO)

CRUD completo de vendas, espelhando as operações do `Store` do frontend:

| Rota | Equivalente no frontend |
|---|---|
| `GET /api/vendas` | `Store.getAll()` |
| `POST /api/vendas` | `Store.addSale()` / `Store.importSale()` |
| `PUT /api/vendas/:id` | `Store.updateSale()` |
| `DELETE /api/vendas/:id` | `Store.deleteSale()` |
| `DELETE /api/vendas` | `Store.reset()` |

### 1.7 `backend/routes/chat.js` (NOVO)

Rota que recebe uma pergunta do Assistente Comercial GPT e consulta a OpenAI
(`gpt-4o-mini`), mantendo a chave da API exclusivamente no servidor. Esta é a
**única** funcionalidade do projeto que de fato requer um backend — todo o
resto (CRUD de vendas) poderia, em tese, falar direto com o Supabase, mas foi
centralizado no backend por padronização e para permitir regras de negócio
futuras (ex: validação extra antes de gravar).

### 1.8 `backend/package.json` (NOVO)

Declara as dependências: `express`, `@supabase/supabase-js`, `openai`, `cors`,
`dotenv`, e `nodemon` como dependência de desenvolvimento.

### 1.9 `backend/.env.example` (NOVO)

Modelo das variáveis de ambiente necessárias. **Não contém nenhuma chave
real** — é só o molde a ser copiado para `.env` e preenchido.

### 1.10 `backend/.gitignore` (NOVO)

Garante que `.env` (com chaves reais) e `node_modules/` nunca sejam
versionados no Git.

### 1.11 `backend/supabase-schema.sql` (NOVO)

Script SQL que cria a tabela `vendas` no Supabase, com índice por data e Row
Level Security habilitado.

---

## 2. Estrutura final do projeto no GitHub

```
Auxiliar-de-Vendas/                     (raiz do repositório)
│
├── index.html                          (já existe — não alterado nesta etapa)
├── login-bg.jpg                        (já existe — não alterado nesta etapa)
│
├── gerenciador/
│   ├── gerenciador.html                ⚠ SUBSTITUIR
│   ├── script1.js                      ⚠ SUBSTITUIR
│   ├── style1.css                      (já existe — não alterado nesta etapa)
│   ├── cloud-sync.js                   ✅ NOVO ARQUIVO
│   └── assistant/                      (já existe — não alterado nesta etapa)
│       ├── knowledge-base.js
│       ├── assistant-engine.js
│       ├── assistant-template.js
│       └── assistant.js
│
└── backend/                            ✅ PASTA NOVA (não existia no repositório)
    ├── server.js                       ✅ NOVO
    ├── supabaseClient.js               ✅ NOVO
    ├── package.json                    ✅ NOVO
    ├── .env.example                    ✅ NOVO
    ├── .gitignore                      ✅ NOVO
    ├── supabase-schema.sql             ✅ NOVO
    └── routes/
        ├── vendas.js                   ✅ NOVO
        └── chat.js                     ✅ NOVO
```

> **Importante:** o backend roda separado do frontend — não é hospedado pelo
> GitHub Pages (que só serve arquivos estáticos). Ele precisa de um serviço
> com Node.js ativo (ver seção 4.3).

---

## 3. Classificação de arquivos: novos vs. substituições

### Substituir (já existem no repositório, sobrescrever o conteúdo):
- `gerenciador/gerenciador.html`
- `gerenciador/script1.js`

### Novos (não existem, criar exatamente nesse caminho):
- `gerenciador/cloud-sync.js`
- `backend/server.js`
- `backend/supabaseClient.js`
- `backend/package.json`
- `backend/.env.example`
- `backend/.gitignore`
- `backend/supabase-schema.sql`
- `backend/routes/vendas.js`
- `backend/routes/chat.js`

### Não tocar (sem alteração nesta etapa):
- `index.html`
- `login-bg.jpg`
- `gerenciador/style1.css`
- `gerenciador/assistant/*`

---

## 4. Dependências, variáveis de ambiente e configurações

### 4.1 Dependências do backend (instaladas via `npm install`)

| Pacote | Função |
|---|---|
| `express` | Servidor HTTP e rotas |
| `@supabase/supabase-js` | Cliente do banco de dados Supabase |
| `openai` | Cliente da API da OpenAI |
| `cors` | Libera o frontend a chamar o backend de outra origem |
| `dotenv` | Carrega variáveis do arquivo `.env` |
| `nodemon` (dev) | Reinicia o servidor automaticamente a cada alteração, durante o desenvolvimento |

### 4.2 Variáveis de ambiente obrigatórias (`backend/.env`)

| Variável | Onde obter | Exemplo |
|---|---|---|
| `SUPABASE_URL` | Painel do Supabase → Settings → API → Project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Painel do Supabase → Settings → API → `service_role` (secreta) | `eyJhbGciOi...` |
| `OPENAI_API_KEY` | platform.openai.com/api-keys | `sk-...` |
| `PORT` | Porta local do servidor | `3001` |
| `FRONTEND_ORIGIN` | Origem(ns) autorizada(s) a chamar o backend, separadas por vírgula | `http://localhost:5500` |

**Nunca commitar o arquivo `.env` com valores reais.** O `.gitignore` já
bloqueia isso, mas confirme antes do primeiro `git push`.

### 4.3 Hospedagem do backend

O backend precisa rodar em um serviço com suporte a Node.js — **não** pode
ser hospedado no GitHub Pages. Opções gratuitas/simples: Render, Railway, ou
Vercel (usando Serverless Functions, com pequena adaptação das rotas).

### 4.4 Migração de banco de dados

Executar uma única vez, no Supabase, antes de o backend tentar gravar
qualquer venda — ver passo 3 do checklist de implantação (seção 5).

### 4.5 Ativação da sincronização no frontend

Por padrão, `cloud-sync.js` está com `ATIVADO = false` — o frontend continua
funcionando só com `localStorage`. Para ativar a sincronização com o backend:

1. Abra `gerenciador/cloud-sync.js`.
2. Altere `const ATIVADO = false;` para `const ATIVADO = true;`.
3. Altere `const BACKEND_URL = 'http://localhost:3001/api';` para a URL real
   do backend já hospedado (ex: `https://seu-backend.onrender.com/api`).

---

## 5. Checklist de implantação

Siga nesta ordem exata. Não pule etapas.

- [ ] **1.** Fazer backup do repositório atual (branch ou cópia local) antes de qualquer substituição.
- [ ] **2.** No repositório, substituir `gerenciador/gerenciador.html` pelo arquivo fornecido nesta entrega.
- [ ] **3.** No repositório, substituir `gerenciador/script1.js` pelo arquivo fornecido nesta entrega.
- [ ] **4.** No repositório, criar o arquivo novo `gerenciador/cloud-sync.js` com o conteúdo fornecido.
- [ ] **5.** Criar a pasta `backend/` na raiz do repositório (fora de `gerenciador/`).
- [ ] **6.** Dentro de `backend/`, criar a subpasta `routes/`.
- [ ] **7.** Criar todos os arquivos novos do backend, exatamente nos caminhos indicados na seção 2: `server.js`, `supabaseClient.js`, `package.json`, `.env.example`, `.gitignore`, `supabase-schema.sql`, `routes/vendas.js`, `routes/chat.js`.
- [ ] **8.** Criar uma conta/projeto no Supabase (caso ainda não exista).
- [ ] **9.** No Supabase, abrir **SQL Editor → New query**, colar o conteúdo de `backend/supabase-schema.sql` e executar (**Run**). Confirmar que a tabela `vendas` foi criada em **Table Editor**.
- [ ] **10.** No Supabase, copiar `Project URL` e a chave `service_role` (Settings → API).
- [ ] **11.** Criar uma chave de API na OpenAI (platform.openai.com/api-keys), caso ainda não exista.
- [ ] **12.** Dentro de `backend/`, copiar `.env.example` para um novo arquivo `.env`.
- [ ] **13.** Preencher o `.env` com os valores reais: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `PORT`, `FRONTEND_ORIGIN`.
- [ ] **14.** Abrir um terminal dentro da pasta `backend/` e executar `npm install`.
- [ ] **15.** Executar `npm start` e confirmar a mensagem `✅ Backend rodando em http://localhost:3001` (ou a porta configurada).
- [ ] **16.** Acessar `http://localhost:3001/api/health` no navegador e confirmar o retorno `{"status":"ok", ...}`.
- [ ] **17.** Decidir se a sincronização com a nuvem será ativada agora ou depois (ver seção 4.5). Se for agora, editar `cloud-sync.js` conforme descrito.
- [ ] **18.** Caso o backend já vá para produção, hospedá-lo em um serviço com suporte a Node (Render/Railway/Vercel) e repetir os passos 12–13 com as variáveis de ambiente cadastradas na plataforma de hospedagem (não em arquivo `.env` local).
- [ ] **19.** Atualizar `BACKEND_URL` em `cloud-sync.js` para a URL pública do backend hospedado (não usar `localhost` em produção).
- [ ] **20.** Fazer commit e push de todas as alterações para o repositório no GitHub.

---

## 6. Checklist de validação pós-implantação

Execute todos os itens abaixo após a implantação, na ordem indicada.

### 6.1 Validação do frontend (sem depender do backend)

- [ ] Abrir `index.html`, fazer login, confirmar que o sistema carrega normalmente.
- [ ] No formulário de registro de venda, abrir o seletor de produto e confirmar que aparecem: **Android**, **Migração de plano**, **SPED Avulso**, **Sintegra Avulso** (além dos produtos já existentes).
- [ ] Registrar uma venda de **Android** com valor R$ 50,00 e confirmar que a comissão calculada é R$ 50,00 (regra `modulo`, 100%).
- [ ] Registrar uma venda de **SPED Avulso** com valor R$ 350,00 e confirmar que a comissão calculada é **R$ 20,00 fixo** (não 100% do valor).
- [ ] Registrar uma venda de **Sintegra Avulso** com valor R$ 150,00 e confirmar a mesma comissão fixa de **R$ 20,00**.
- [ ] Abrir o console do navegador (F12) e confirmar que não aparece nenhum erro relacionado a `CloudSync` ou `Utils.generateId`.
- [ ] Editar uma venda existente e confirmar que a edição é salva normalmente.
- [ ] Excluir uma venda e confirmar que pede confirmação antes de remover.
- [ ] Recarregar a página e confirmar que todas as vendas registradas continuam aparecendo (persistência local intacta).

### 6.2 Validação do backend (isolado, antes de ativar a sincronização)

- [ ] Com o backend rodando, acessar `http://localhost:3001/api/health` (ou a URL hospedada) e confirmar `{"status":"ok"}`.
- [ ] Testar `GET /api/vendas` (via navegador ou Postman/Thunder Client) e confirmar retorno `[]` (lista vazia, banco novo) sem erro 500.
- [ ] Testar `POST /api/vendas` enviando um corpo de exemplo:
  ```json
  { "product": "Teste", "value": 10, "commission": 10, "rate": "100%", "type": "modulo", "date": "2026-06-29" }
  ```
  e confirmar resposta `201` com o registro criado, incluindo um `id` gerado pelo Supabase.
- [ ] No painel do Supabase → Table Editor → `vendas`, confirmar visualmente que o registro de teste apareceu.
- [ ] Testar `DELETE /api/vendas/:id` com o `id` do registro de teste e confirmar resposta `204`.
- [ ] Confirmar no Supabase que o registro de teste foi removido.
- [ ] Testar `POST /api/chat` com o corpo `{ "mensagem": "Fale sobre o módulo comercial" }` e confirmar que retorna uma resposta da OpenAI sem erro 500 (erro 500 aqui geralmente indica `OPENAI_API_KEY` ausente ou inválida).

### 6.3 Validação da sincronização integrada (somente após ativar `CloudSync`)

- [ ] Com `ATIVADO = true` e `BACKEND_URL` apontando para o backend correto, registrar uma venda no frontend.
- [ ] Confirmar no Supabase (Table Editor) que a venda apareceu na tabela em poucos segundos.
- [ ] Desligar o backend de propósito (ou desconectar a internet) e registrar uma nova venda no frontend — confirmar que a venda continua aparecendo normalmente na tela (gravação local não foi afetada).
- [ ] Religar o backend (ou reconectar a internet) e aguardar até 5 minutos (ou recarregar a página, que reprocessa a fila no boot) — confirmar que a venda pendente aparece no Supabase.
- [ ] Verificar no `localStorage` do navegador (DevTools → Application → Local Storage) a chave `av-sync-pendentes-v1` — deve estar vazia (`[]`) após a sincronização ser concluída com sucesso.

---

## 7. Observações finais

- Toda a arquitetura é **local-first**: o `localStorage` continua sendo a fonte de verdade imediata. O backend/Supabase é uma camada de sincronização adicional, não uma substituição — isso significa que, mesmo se o backend cair em produção, o vendedor consegue continuar trabalhando offline sem perceber.
- Nenhuma chave secreta (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`) deve, em nenhuma hipótese, ser inserida em qualquer arquivo dentro de `gerenciador/` — esses arquivos são servidos publicamente pelo navegador e ficam visíveis a qualquer pessoa.
- Caso a sincronização precise ser desativada rapidamente em produção (ex: instabilidade do backend), basta alterar `ATIVADO` para `false` em `cloud-sync.js` — o frontend volta a operar 100% local imediatamente, sem necessidade de reverter nenhum outro arquivo.
