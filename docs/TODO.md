# FlowDay — TODO / Backlog de Desenvolvimento

> Backlog ativo do projeto. Trabalhar **em ordem**. Marcar itens com `[x]` ao concluir.
> Decisões arquiteturais estão em `CONTEXT.md`. Diretrizes de código em `CLAUDE.md`.

**Status geral:** 🚧 Fase 4 — Backend: scheduler

---

## 🏗️ Fase 0 — Setup inicial

Meta: repositório funcional, ferramentas configuradas, CI básico rodando.

- [x] Inicializar repositório Git
- [x] Criar estrutura de pastas do monorepo conforme `CONTEXT.md` §7
- [x] Adicionar `.gitignore` apropriado (Python, Node, IDEs, envs, DBs)
- [x] Criar `README.md` inicial bilíngue (PT-BR principal, EN abaixo)
- [x] Adicionar `LICENSE` (sugestão: MIT)
- [x] Mover `CONTEXT.md`, `CLAUDE.md`, `RAW_IDEA.md`, `TODO.md` para `/docs`
- [ ] Configurar `pre-commit` hooks (ruff, eslint, prettier)
- [x] GitHub Actions — workflow básico de CI (lint + test) rodando em PRs

**DoD:** `git clone` + instruções do README = ambiente funcional em < 10 min.

---

## 🐍 Fase 1 — Backend: fundação

Meta: FastAPI rodando, DB conectado, migrations funcionando.

- [x] Instalar `uv` e inicializar `pyproject.toml` no `/backend`
- [x] Configurar Python 3.12+ e lock de dependências
- [x] Adicionar deps: `fastapi`, `uvicorn[standard]`, `sqlalchemy>=2.0`, `alembic`, `pydantic>=2`, `pydantic-settings`, `python-dotenv`
- [x] Adicionar deps dev: `pytest`, `pytest-asyncio`, `httpx`, `ruff`, `mypy`
- [x] Criar `app/config.py` com `Settings` (Pydantic) lendo `.env`
- [x] Criar `app/database.py` (engine, session, Base)
- [x] Criar `app/main.py` com FastAPI app + rota `/health`
- [x] Configurar CORS para localhost:5173 (Vite default)
- [x] Inicializar Alembic + gerar migration inicial (vazia)
- [x] Testar boot: `uvicorn app.main:app --reload` → 200 em `/health`
- [x] Configurar `ruff` (lint + format) e `mypy` (strict em `services/` e `models/`)

**DoD:** `uv run uvicorn app.main:app` sobe sem erro; `/health` retorna 200; migrations rodam com SQLite e com Postgres (testar os dois).

---

## 🗄️ Fase 2 — Backend: modelos e repositórios

Meta: todas as tabelas definidas, migrations aplicadas, repositórios com testes.

- [x] Modelo `UserConfig` (singleton)
- [x] Modelo `Task`
- [x] Modelo `WorkSession`
- [x] Modelo `ScheduledBlock`
- [x] Modelo `ExecutionLog`
- [x] Modelo `AuditLog`
- [x] Tipo custom para UUID (compatível SQLite + Postgres)
- [x] Gerar migration com todas as tabelas + aplicar
- [x] Criar seed inicial (config default do usuário)
- [x] `TaskRepository` — CRUD básico
- [ ] `ScheduleRepository` — create/read de work_sessions e blocks
- [ ] `LogRepository` — CRUD de execution_logs
- [x] `ConfigRepository` — get/update do singleton
- [x] Testes unitários de cada repositório (usando SQLite em memória)

**DoD:** todas as tabelas criadas nos dois bancos; repositórios com 100% de cobertura no happy path.

---

## 🎯 Fase 3 — Backend: CRUD de tarefas

Meta: endpoints de tarefas prontos e testados.

- [x] Schemas Pydantic: `TaskCreate`, `TaskUpdate`, `TaskRead`
- [x] Router `/api/tasks` com endpoints:
  - [x] `POST /api/tasks` — criar
  - [x] `GET /api/tasks` — listar (filtros: status, priority)
  - [x] `GET /api/tasks/{id}` — obter
  - [x] `PATCH /api/tasks/{id}` — atualizar
  - [x] `DELETE /api/tasks/{id}` — remover
- [x] `TaskService` — regras: validações, status transitions
- [x] Logging em `audit_log` para create/update/delete
- [x] Testes de integração dos endpoints
- [x] Atualizar OpenAPI com exemplos em cada endpoint

**DoD:** CRUD completo funcional via Swagger UI; todos os testes verdes.

---

## 🧮 Fase 4 — Backend: scheduler (coração do sistema)

Meta: algoritmo de alocação funcionando, com suite de testes robusta.

- [x] `SchedulerService` — implementação do greedy
- [x] Schema `ScheduleRequest` (data, work_start opcional, work_end opcional — senão usa config)
- [x] Schema `ScheduleResponse` (work_session + blocks + overflow list)
- [x] Router `/api/schedule`:
  - [x] `POST /api/schedule` — gera plano do dia
  - [x] `GET /api/schedule/{date}` — recupera plano existente
  - [x] `DELETE /api/schedule/{date}` — limpa plano (volta tarefas para pending)
- [x] Suite de testes do scheduler:
  - [x] Todas as tarefas cabem
  - [x] Uma tarefa estoura → overflow
  - [x] Múltiplas tarefas estouram
  - [x] Pausas respeitadas no intervalo correto
  - [x] Lista vazia
  - [x] Janela de trabalho muito curta (< 1 tarefa)
  - [x] Prioridades iguais → ordena por duração asc
  - [x] Prioridades diferentes → prioridade manda
  - [x] Config snapshot persistido na work_session
- [x] Documentar algoritmo no docstring com exemplo

**DoD:** suite de testes do scheduler 100% verde; executar manualmente via Swagger e verificar output.

---

## 📝 Fase 5 — Backend: logs e execução

Meta: rastreamento do que é executado de verdade.

- [ ] Schemas: `ExecutionLogCreate`, `ExecutionLogUpdate`, `ExecutionLogRead`
- [ ] Router `/api/logs`:
  - [ ] `POST /api/logs` — iniciar execução (`actual_start`)
  - [ ] `PATCH /api/logs/{id}` — atualizar (`actual_end`, `completed`, `notes`)
  - [ ] `GET /api/logs` — listar (filtros: date, task_id)
- [ ] Ao marcar log como `completed=true` → atualizar `task.status = done`
- [ ] Ao iniciar → atualizar `task.status = in_progress`
- [ ] Registrar em `audit_log`
- [ ] Testes de integração

**DoD:** fluxo completo testado: criar tarefa → agendar → iniciar → concluir → verificar status e log.

---

## ⚙️ Fase 6 — Backend: configurações

Meta: usuário consegue ajustar janela de trabalho e pausas.

- [ ] Schemas: `UserConfigRead`, `UserConfigUpdate`
- [ ] Router `/api/config`:
  - [ ] `GET /api/config` — obter config atual
  - [ ] `PATCH /api/config` — atualizar
- [ ] Validações: `work_end > work_start`, intervalos razoáveis
- [ ] Testes

**DoD:** alterar config pelo Swagger e ver mudança refletida em novo scheduling.

---

## ⚛️ Fase 7 — Frontend: setup

Meta: Vite rodando, Tailwind + shadcn configurados, roteamento base.

- [ ] `pnpm create vite` com template `react-ts` em `/frontend`
- [ ] Instalar: `tailwindcss`, `postcss`, `autoprefixer`, `react-router-dom@7`, `@tanstack/react-query`, `zustand`, `lucide-react`
- [ ] Configurar Tailwind com paleta custom (dark + roxo)
- [ ] Adicionar fontes JetBrains Mono + Outfit (via `@fontsource` ou link)
- [ ] Instalar shadcn/ui CLI e componentes base: `button`, `input`, `label`, `card`, `dialog`, `select`, `toast`, `skeleton`
- [ ] Estrutura de rotas: `/`, `/tasks`, `/history`, `/settings`
- [ ] Layout base com sidebar ou top-nav minimalista
- [ ] Configurar ESLint + Prettier + TypeScript strict
- [ ] Configurar proxy no `vite.config.ts` para `/api` → `http://localhost:8000`

**DoD:** `pnpm dev` abre em localhost:5173 com layout básico navegável.

---

## 🔌 Fase 8 — Frontend: camada de API

Meta: tipos do backend disponíveis no frontend, wrappers de fetch prontos.

- [ ] Instalar `openapi-typescript` como dev dep
- [ ] Script `pnpm generate:api` → lê OpenAPI do backend → gera `src/api/types.ts`
- [ ] Criar `src/api/client.ts` — wrapper fino em fetch com tratamento de erros
- [ ] Criar módulos: `src/api/tasks.ts`, `src/api/schedule.ts`, `src/api/logs.ts`, `src/api/config.ts`
- [ ] Setup TanStack Query — `QueryClientProvider`, devtools em dev
- [ ] Hooks base: `useTasks`, `useSchedule`, `useConfig`

**DoD:** tela simples lista tarefas do backend usando tipos gerados, sem `any`.

---

## 📋 Fase 9 — Frontend: tela de tarefas

Meta: CRUD de tarefas visual e fluido.

- [ ] Tela `/tasks` com lista + botão "Nova tarefa"
- [ ] Modal/sheet de criação com campos: título, descrição, duração (minutos), prioridade
- [ ] Edição inline ou via modal
- [ ] Confirmação de delete
- [ ] Filtros: status, prioridade
- [ ] Empty state bonito ("Nenhuma tarefa. Crie a primeira.")
- [ ] Loading states e error handling
- [ ] Invalidação de cache ao mutar

**DoD:** dev consegue gerenciar tarefas inteiramente pela UI sem abrir o Swagger.

---

## 📅 Fase 10 — Frontend: timeline (a joia da coroa)

Meta: visualização do dia planejado em SVG, bonita e informativa.

- [ ] Componente `<Timeline />` em `/`
- [ ] Botão "Planejar dia" → chama `POST /api/schedule`
- [ ] Eixo temporal horizontal (work_start → work_end)
- [ ] Blocos de tarefa posicionados por hora
- [ ] Blocos de pausa diferenciados visualmente
- [ ] Indicador do "agora" (linha vertical animada)
- [ ] Tooltip em cada bloco com detalhes
- [ ] Tarefas em overflow listadas abaixo com aviso
- [ ] Clicar bloco → iniciar/concluir execução (cria/atualiza log)
- [ ] Estado visual de bloco: planejado, em andamento, concluído, atrasado
- [ ] Responsivo para telas < 768px (considerar scroll horizontal)

**DoD:** fluxo completo: criar tarefas → planejar dia → ver timeline → iniciar tarefa → timeline atualiza → concluir → próxima.

---

## 🔔 Fase 11 — Frontend: notificações e polish

Meta: experiência completa com alertas.

- [ ] Pedir permissão de notificação ao carregar (com toggle no settings)
- [ ] Notificação ao atingir `planned_end` de uma tarefa em andamento
- [ ] Notificação "hora da pausa" quando cruza bloco de pausa
- [ ] Toast feedback em todas as ações (criar, salvar, erro)
- [ ] Animações sutis de transição (framer-motion apenas onde agrega)
- [ ] Estados de loading refinados (skeleton, não spinner genérico)
- [ ] Error boundary global

**DoD:** app se comporta como produto, não como protótipo.

---

## 🎛️ Fase 12 — Frontend: settings

Meta: config editável pela UI.

- [ ] Tela `/settings`
- [ ] Formulário: work_start, work_end, break_duration, break_interval, timezone
- [ ] Toggle de notificações
- [ ] Preview: "Com essa config, você tem X minutos úteis por dia"
- [ ] Avisos sobre `DATABASE_URL` (atual em uso, instruções para trocar)

**DoD:** config pode ser totalmente ajustada via UI.

---

## 📊 Fase 13 — Estatísticas (pós-MVP inicial)

Meta: dashboard básico de histórico.

- [ ] Backend: `StatsService` e `/api/stats`
  - [ ] Taxa de conclusão por período
  - [ ] Desvio médio (estimado vs real)
  - [ ] Tarefas por prioridade executadas
  - [ ] Tempo total registrado por dia
- [ ] Frontend: tela `/history`
  - [ ] Lista cronológica de work_sessions
  - [ ] Cards de métricas principais
  - [ ] Gráfico simples (linha ou barras) — considerar `recharts`
- [ ] Sugestão automática: "Você estima tarefas com -20% de precisão"

**DoD:** dev consegue responder "como foi minha semana?" em 1 clique.

---

## 🎨 Fase 14 — Visualização Kanban (pós-MVP)

Meta: segunda view, mesma data.

- [ ] Toggle timeline/kanban na tela principal
- [ ] Colunas: A Fazer, Em Andamento, Concluído, Overflow
- [ ] Drag-and-drop entre colunas (considerar `dnd-kit`)
- [ ] Ações coerentes com backend

**DoD:** as duas views compartilham dados e ações, sem duplicação de estado.

---

## 🐋 Fase 15 — Containerização

Meta: `docker-compose up` sobe tudo.

- [ ] `Dockerfile.backend` multi-stage (builder com uv, runtime slim)
- [ ] `Dockerfile.frontend` multi-stage (build Vite → Nginx serve)
- [ ] `nginx.conf` com proxy reverso para backend + serve SPA
- [ ] `docker-compose.yml` (prod: frontend + backend + postgres)
- [ ] `docker-compose.dev.yml` (dev: só postgres — app roda no host)
- [ ] `.env.example` completo e comentado
- [ ] Testar migração SQLite → Postgres (dados reais)

**DoD:** do zero: `docker-compose up` → app acessível em `localhost:80`.

---

## 🚀 Fase 16 — Deploy VPS

Meta: versão pública no VPS do dev.

- [ ] Adaptar CI/CD existente (padrão Next.js) para FastAPI + Vite
- [ ] GitHub Actions: build + test + deploy
- [ ] Nginx no VPS: SSL via Certbot (subdomínio, ex: flowday.nicoryy.com)
- [ ] Systemd unit ou PM2 para o backend
- [ ] Backup automático do DB (cron + rsync para local seguro)
- [ ] Monitoramento básico (uptime + erro rate via logs)

**DoD:** acessar publicamente, usar sem crash por 1 semana.

---

## 🔐 Fase 17 — Autenticação (quando decidir comercializar)

Meta: multi-usuário, login seguro.

- [ ] Escolher estratégia: NextAuth não (sem Next) → **Auth.js backend** ou **Authlib** ou **custom JWT**
- [ ] Adicionar `users` table + FK em todas as entidades
- [ ] Migrar dados existentes para user padrão
- [ ] Middleware de auth em todos os endpoints
- [ ] Login/logout/signup no frontend
- [ ] Proteção de rotas no frontend

**DoD:** dois usuários distintos veem dados isolados.

---

## 🧊 Ideias geladas (parking lot)

- Integração Google Calendar (import/export)
- Tarefas recorrentes
- PWA / modo offline completo com sync
- Atalhos de teclado globais
- Tema claro (por enquanto só dark)
- Export CSV/JSON
- API pública para integrações (n8n, Zapier)
- CLI companion (`flowday task add "..."`)
- Ajuste automático de estimativas com ML simples (regressão linear no histórico)
- Modo "foco" — tela cheia com só a tarefa atual e timer
- Integração com MCP para Claude trabalhar com seu próprio scheduler

---

## 🔥 Bugs conhecidos

_(vazio — adicionar conforme surgirem)_

---

## 📌 Convenções de manutenção deste arquivo

- Item feito: `[x]`
- Item em andamento: adicionar `🚧` na frente
- Item bloqueado: adicionar `⛔ motivo` na frente
- Ao concluir uma fase inteira: adicionar data ao lado do cabeçalho
- Descoberta de nova tarefa necessária: adicionar na fase correspondente ou em "ideias geladas"