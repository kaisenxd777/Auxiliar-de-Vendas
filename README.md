# Auxiliar de Vendas

Sistema de gestão de vendas e comissões, com Assistente Comercial integrado.

## Estrutura do repositório

```
Auxiliar-de-Vendas/
└── gerenciador/
    ├── index.html              ← página principal (Gerenciador de Vendas)
    ├── style1.css               ← estilos do Gerenciador
    ├── script1.js                ← lógica do Gerenciador (vendas, metas, relatórios)
    └── assistant/                ← Assistente Comercial (módulo isolado)
        ├── knowledge-base.js      ← módulos, preços e regras de comissão
        ├── assistant-engine.js    ← motor de respostas (local, sem custo)
        ├── assistant-template.js  ← HTML do componente
        ├── assistant.css          ← estilo isolado (namespace av-assist-*)
        └── assistant.js           ← controlador (abrir/fechar, histórico)
```

## Publicar no GitHub Pages

1. Em **Settings → Pages**, selecione a branch `main` e a pasta `/gerenciador` como source (ou `/root` se preferir mover os arquivos para a raiz).
2. O sistema abre automaticamente em `index.html`.

## Assistente Comercial

Funciona 100% no navegador, sem custo de API. Atalho **Alt+A** abre/fecha de qualquer lugar da tela. Sugestões rápidas, histórico salvo localmente (máx. 50 mensagens) e respostas baseadas na base de conhecimento em `assistant/knowledge-base.js`.

Para conectar a uma IA real (OpenAI, Anthropic, etc.) no futuro, veja o comentário no topo de `assistant/assistant-engine.js` — a chave de API deve sempre ficar em um backend, nunca no frontend.

## Dados do usuário

Todas as vendas, metas e preferências de tema ficam salvas no `localStorage` do navegador. Use o botão 💾 no cabeçalho para fazer backup em JSON periodicamente.
