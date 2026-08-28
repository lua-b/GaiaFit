# GaiaFit — Handoff para Claude Code

Documento de contexto para continuar o desenvolvimento do GaiaFit fora do chat do claude.ai. Escrito depois de várias sessões de desenvolvimento e depuração direto em um artifact do Claude.

## 1. O que é o app

App de treino de academia para uso familiar. Dois perfis hoje: **Luara** e **Guilherme**, cada um com seu próprio ciclo de dias de treino (Luara: 6 dias: Superior A, Inferior A, Core+Mobilidade, Superior B, Inferior B, Pump+Core opcional. Guilherme: 5 dias: Força Superior, Força Inferior, Condicionamento+Core, Hipertrofia Superior, Hipertrofia Inferior).

Funcionalidades centrais:
- Cadastro de treinos e exercícios (nome, grupo muscular, séries, reps, RIR, carga de referência, descanso, nota).
- "Modo treino": percorre os exercícios um a um, permite registrar a carga usada naquele dia, atualiza a carga de referência do exercício ao final.
- Detecção de recorde pessoal (PR) quando a carga registrada supera o histórico.
- Histórico por treino: quantas vezes foi feito, gráfico de evolução de carga por exercício (SVG desenhado à mão, sem lib externa).
- Indicação de bi-sets/circuitos (exercícios feitos em sequência, sem descanso, ex.: 5A/5B).
- Sugestão discreta "Para hoje" no próximo treino do ciclo, baseada na data do último treino concluído.
- Exportar/Importar dados de um perfil como arquivo `.json` (mecanismo independente do armazenamento da plataforma — ver seção 4).
- Múltiplos perfis (família), com troca rápida entre eles.

## 2. Stack técnica atual

Single-file React (`App.jsx`, ~1180 linhas), pensado originalmente para rodar como **artifact do claude.ai** (não é um app hospedado tradicional):

- React com hooks (`useState`, `useEffect`, `useCallback`, `useRef`). Sem roteador — tudo é estado local (`view`).
- Ícones: `lucide-react`.
- Estilo: utilitários do Tailwind (flex, grid, padding, etc.) combinados com CSS custom via uma tag `<style>` injetada no componente, usando variáveis CSS (`--purple`, `--purple-deep`, `--blue`, `--bg`, `--surface`, `--ink`, etc.). Não usa o compilador JIT do Tailwind, então nada de `bg-[#hex]`.
- Gráfico de evolução de carga: SVG feito à mão (`MiniLineChart`), sem Recharts. **Isso foi uma escolha deliberada**: Recharts foi removido numa fase inicial como suspeito de travar o carregamento do artifact (ver seção 4).
- Mascote: foto real da gata da usuária, com fundo removido via `rembg` (modelo `u2netp`) e embutida como base64 (`CAT_AVATAR`) direto no código. O arquivo fonte também está em `src/assets/cat_avatar_source.png`.
- Persistência: **migrado para `localStorage` do navegador** em 2026-08-26 (Claude Code), abandonando o modelo de artifact do claude.ai. Ver seção 4 (atualizada) para o histórico do problema original e por que essa troca foi feita.

## 3. Modelo de dados

Chaves de armazenamento usadas (prefixo `gaiafit:`):
- `gaiafit:profiles` → `[{ id, name }]`
- `gaiafit:workouts:{profileId}` → `[{ id, name, exercises: [...], createdAt }]`
- `gaiafit:sessions:{profileId}` → `[{ id, workoutId, workoutName, date, entries: [{exerciseId, name, loadUsed, repsUsed}] }]`

Exercício:
```js
{
  id, name, category, // categoria define o ícone (peito, costas, ombro, biceps, triceps, perna, gluteo, abdomen, lombar, cardio, geral)
  sets, repsMin, repsMax, rir, load, rest, refNote,
  supersetGroup, // opcional: string compartilhada entre exercícios do mesmo bi-set/circuito
  supersetLabel, // opcional: "Bi-set" ou "Circuito"
}
```

IDs de treino/exercício dos perfis padrão (Luara e Guilherme) são **determinísticos**, não aleatórios: `${profileId}-w${dayIndex}` e `${profileId}-w${dayIndex}-e${exIndex}` (função `buildWorkouts`). Isso foi uma correção importante: antes, IDs aleatórios (`uid()`) eram gerados toda vez que os dados padrão precisavam ser recriados (nas falhas de leitura), desconectando sessões já registradas do treino atual e fazendo o contador "feito Nx" voltar a zero incorretamente.

## 4. Problema de persistência entre sessões — histórico e resolução

### Status: resolvido (parcialmente) em 2026-08-26, pelo Claude Code

Depois de discutir as duas direções descritas no fim desta seção, a usuária escolheu a **direção B**
(sair do modelo de artifact do claude.ai) em duas etapas: primeiro `localStorage`, depois avaliar um
backend real se fizer sentido. A primeira etapa foi feita:

- `window.storage` (API do artifact) foi completamente removido do código.
- `sGet`/`sSet` agora leem/gravam direto em `localStorage`, de forma síncrona.
- Toda a complexidade defensiva que existia por causa da instabilidade do `window.storage` foi
  removida: os 3 retries, a heurística de mensagem de erro "unexpected response type", o timeout de
  segurança de 8s no boot, a leitura de confirmação 450ms depois de cada gravação, e o listener de
  `pageshow` que forçava recarregar dados ao voltar do cache do Safari. Nada disso faz sentido para um
  storage local e síncrono — se `localStorage.setItem` não lançar erro, a gravação já aconteceu.
- `src/devStorageMock.js` foi removido (não existe mais distinção entre "storage real" e "mock de
  dev": `localStorage` já é o mecanismo real, tanto em dev quanto em produção).
- Testado via Playwright (carregar → fazer um treino completo → fechar de verdade a página → reabrir):
  os dados de sessão sobreviveram corretamente. Sem erros de console/página em todo o fluxo.

**O que isso resolve**: a persistência agora é confiável dentro do mesmo navegador/dispositivo — sem
mais o comportamento não-determinístico do storage do claude.ai.

**O que isso NÃO resolve ainda**: `localStorage` é local a cada combinação navegador+dispositivo. Não
há sincronização entre o celular da Luara e o celular do Guilherme, por exemplo — cada um teria seus
próprios dados isolados, e limpar dados do navegador (ou usar aba anônima) apaga tudo. O export/import
`.json` manual continua sendo o único jeito de mover dados entre aparelhos por enquanto. Se a família
quiser dados compartilhados entre aparelhos de verdade, o próximo passo é um backend real (Supabase/
Firebase/API própria) — avaliar quando/se isso for necessário.

O restante desta seção documenta o problema original (na plataforma claude.ai) como registro histórico
de depuração — não se aplica mais ao código atual, mas fica registrado caso o projeto volte a rodar
como artifact no futuro.

### O que o app fazia (dentro do artifact do claude.ai, antes da migração)

`window.storage` é chamado com retry (3 tentativas) e uma heurística que trata a mensagem de erro `"Unexpected response type"` como "chave não existe ainda" (não como falha real) — essa mensagem específica apareceu em testes reais e parece ser como esse backend sinaliza ausência de chave, mas isso é uma inferência, não está documentado oficialmente.

Depois de qualquer gravação (`persistWorkouts`/`persistSessions`), o app espera ~450ms e faz uma leitura de conferência (compara o tamanho do array salvo com o lido de volta) antes de considerar a gravação confirmada. Se a confirmação falhar, mostra um aviso não-bloqueante ("Salvamento automático não confirmado") com botões de exportar backup e tentar de novo — mas **nunca bloqueia o uso do app**, mesmo em falha total (cai para os dados padrão em memória).

### Linha do tempo do que foi tentado (mais recente por último)

1. **Armazenamento compartilhado (`shared: true`), artifact não publicado.** Falha total, sempre. Causa raiz identificada depois: a documentação oficial do claude.ai diz que armazenamento persistente só funciona em artifacts **publicados** — durante desenvolvimento/teste as operações não têm sucesso. Isso não estava claro até pesquisarmos a documentação depois de várias rodadas de depuração.
2. **Troca para `shared: false` (pessoal), ainda não publicado.** Mesma falha (esperado, dado o ponto 1).
3. **Publicação do artifact, mantendo `shared: false`.** Funcionou dentro da mesma sessão (editar, trocar de perfil, voltar — sem perda). Fechar e reabrir era inconsistente: às vezes persistia (especialmente no desktop), às vezes não (especialmente no celular via link recebido pelo WhatsApp, aberto no navegador in-app).
4. **Hipótese: navegador in-app do WhatsApp não mantém cookies de sessão entre aberturas**, então "armazenamento pessoal" (ligado ao usuário logado) ficaria preso a uma identidade anônima diferente a cada abertura. Trocamos para `shared: true` (o artifact já estava publicado neste ponto), já que armazenamento compartilhado depende da identidade do artifact, não do usuário.
5. Depois de `shared: true` + publicado: funcionou em alguns testes (inclusive abrindo pelo app nativo do Claude no celular), falhou em outros (Safari direto). Um teste mais rigoroso, comparando edição → fechar de verdade → reabrir, mostrou que **mesmo pelo app do Claude no celular, que parecia confiável, os dados às vezes não sobreviviam**.
6. **Conclusão atual (não 100% confirmada, mas é a mais consistente com os dados coletados): o mecanismo de armazenamento persistente do claude.ai é instável/nao-determinístico neste momento** — funciona em parte dos casos, falha em outra parte, sem um padrão limpo de causa (não é claramente por navegador, nem por dispositivo, nem por modo pessoal vs. compartilhado isoladamente).

### Um bug real que inflava a impressão de instabilidade (corrigido)

O estado `storageOk` (que controla o aviso na tela) só era setado para `false` nas falhas, nunca de volta para `true` depois de uma leitura bem-sucedida — só um `set` com verificação positiva resetava. Ou seja, uma falha isolada logo no carregamento inicial deixava o aviso "preso" ligado pelo resto da sessão mesmo que tudo funcionasse depois. Isso foi corrigido (agora `setStorageOk(ok)` reflete sempre a checagem mais recente, nos dois sentidos). Vale confirmar se essa correção não introduziu nenhuma regressão.

### Também foi observado (e é relevante pro Code investigar)

- **Publicar uma atualização de código em um artifact já publicado às vezes não reflete a versão mais nova** — o link publicado continua servindo código antigo mesmo depois de clicar em "Publish" de novo a partir da versão correta. Isso aconteceu pelo menos duas vezes (com a feature de RIR e depois com o redesign do cabeçalho). A solução que funcionou nas duas vezes foi criar um **artifact novo do zero** (nome de arquivo diferente) e publicar esse. Isso tem um custo: um artifact novo tem armazenamento novo e vazio, então há perda de continuidade de dados a cada vez que isso acontece.
- Removemos a biblioteca Recharts e a importação de fonte do Google Fonts (`@import` no CSS) numa fase inicial, suspeitando que uma delas travava o carregamento do artifact indefinidamente. Depois disso o carregamento parou de travar, mas não temos certeza absoluta de que a causa era uma dessas duas coisas — pode ter sido coincidência com outras correções feitas ao mesmo tempo. **Vale re-testar deliberadamente com Recharts de volta, isoladamente, se for do interesse.**

### O que NÃO foi testado (ferramentas que este ambiente de chat não tem)

- Inspecionar as chamadas de rede reais (aba Network do DevTools) durante um `window.storage.get`/`set` que falha, pra ver o payload/resposta reais.
- Testar se `window.storage.list()` continua travando indefinidamente (foi removido do código por esse motivo numa fase inicial, sem confirmação definitiva da causa).
- Testar de forma controlada e isolada: mesmo artifact publicado, mesmo dispositivo, múltiplas repetições consecutivas do ciclo grava→fecha de verdade→reabre, pra tentar achar uma taxa de falha (ex.: falha 1 em cada N tentativas) em vez de um "às vezes sim, às vezes não" qualitativo.

### Decisão estratégica em aberto

Duas direções possíveis, vale discutir com a usuária antes de escolher:

**A) Continuar dentro do modelo de artifact do claude.ai.** Vantagem: distribuição simples (um link, sem custo de hospedagem, sem ela precisar gerenciar infraestrutura). Desvantagem: a persistência depende de um recurso da plataforma que, no momento, não é confiável, e não há ferramenta de depuração real disponível de dentro do chat.

**B) Migrar para um app web hospedado de verdade** (ex.: Vite + React, deploy em Vercel/Netlify, com um backend de persistência real — desde um `localStorage` simples de primeira etapa, até uma base de dados de verdade tipo Supabase/Firebase/uma API própria). Vantagem: controle total, dá pra depurar e testar de verdade, não depende de um recurso experimental da plataforma. Desvantagem: exige hospedagem própria (mesmo que gratuita) e mais trabalho de configuração.

Este projeto (pasta `gaiafit-handoff/`) já está montado como um projeto Vite/React independente, rodável localmente, como primeiro passo pra qualquer uma das duas direções.

## 5. Guia de marca / estilo

- Paleta: roxo (`--purple: #6C4FD1`, `--purple-deep: #4B2FAE`), azul (`--blue: #3E63D9`) como accent secundário, fundo cinza claro (`--bg: #E6E5EA`), superfícies brancas (`--surface: #FFFFFF`), textos em `--ink`/`--ink-dim`. Paleta pedida explicitamente pela usuária: "roxo/lilás, branco, cinza, azul", elegante e sóbria, não infantil.
- Cabeçalho: barra roxo-escuro sólida (não mais branca), com o nome "GaiaFit" (assim, não em caixa alta) em branco, fonte grande. A gata (foto real recortada, silhueta completa, sem fundo) "atravessa" visualmente a barra, com a parte de baixo do corpo sobrepondo a área cinza da página abaixo — efeito pedido explicitamente pela usuária ("como se a gata estivesse andando pelo app"), cuidando pra nunca cobrir texto ou botões (existe um espaçador reservado logo abaixo do cabeçalho pra isso).
- Esse cabeçalho (componente `AppHeader`) deve aparecer em **todas** as telas, inclusive no modo treino em tela cheia — isso foi um pedido explícito depois de uma versão que escondia o cabeçalho lá.
- Ícones de exercício: círculos com sigla de 2 letras por grupo muscular (não fotos individuais por exercício — decisão consciente, já que não há upload de imagem disponível nesse ambiente).
- Bi-sets/circuitos: agrupados visualmente numa caixa com borda roxa e um rótulo no topo ("Bi-set"/"Circuito"), em vez de cards soltos.

## 6. Como rodar localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Desde a migração de 2026-08-26, o app usa `localStorage` do navegador diretamente — o que roda em `npm run dev` **é o mesmo mecanismo de persistência de produção**, não um mock. Não existe mais `src/devStorageMock.js`.

## 7. Link publicado atual

Nenhum. O projeto **saiu do modelo de artifact do claude.ai** em 2026-08-26 (ver seção 4). O link antigo
(`https://claude.ai/public/artifacts/c345bf30-89f2-4b1f-a3c2-0c92431c71e2`, artifact **gaiafit2**) fica
registrado aqui só como referência histórica — não é mais o app em uso.

O código agora vive no repositório GitHub `lua-b/gaiafit`. Ainda não há deploy público (ex.: Vercel/
Netlify) — rodar localmente com `npm run dev` (seção 6) até que o deploy seja feito.

## 8. Pendências / próximos pedidos conhecidos

- [x] Resolver a instabilidade de persistência — resolvido em 2026-08-26 via migração para `localStorage` (ver seção 4). Continua sem sincronizar entre aparelhos diferentes.
- [ ] Decidir se/quando vale investir num backend real (Supabase/Firebase/API própria) para sincronizar dados entre os aparelhos da família, em vez de cada um ter seus dados isolados no próprio navegador.
- [ ] Fazer o deploy público do app (ex.: Vercel ou Netlify) — hoje só roda localmente via `npm run dev`.
- [ ] Considerar reordenar/expandir as categorias de grupo muscular se a usuária pedir mais granularidade nos ícones.

## 9. Arquivos deste pacote

- `HANDOFF.md` — este documento.
- `src/App.jsx` — código-fonte completo do app.
- `src/main.jsx`, `src/index.css` — infraestrutura mínima pra rodar localmente.
- `src/assets/cat_avatar_source.png` — foto da gata já recortada (sem fundo), fonte da imagem embutida em base64 no `App.jsx`.
- `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html` — configuração do projeto.
