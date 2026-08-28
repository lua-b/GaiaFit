# GaiaFit

App de treino de academia para uso familiar. Veja `HANDOFF.md` para o contexto completo do projeto
(o que é, decisões de design, e o histórico do problema de persistência de dados).

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Os dados ficam salvos no `localStorage` do navegador.

## Build de produção

```bash
npm run build
npm run preview   # serve o build em http://localhost:4173, pra conferir antes de publicar
```

## Deploy

Ainda não há deploy público configurado. Este é um projeto Vite/React comum — pode ser publicado em
qualquer serviço de hospedagem estática (Vercel, Netlify, Cloudflare Pages, etc.) apontando para o
comando de build (`npm run build`) e a pasta de saída (`dist/`).
