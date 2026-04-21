# FlowDay — TODO / Backlog de Desenvolvimento

> Backlog ativo do projeto. Trabalhar **em ordem**. Marcar itens com `[x]` ao concluir.
> Decisões arquiteturais estão em `CONTEXT.md`. Diretrizes de código em `CLAUDE.md`.

**Status geral:** ✅ MVP concluído — Fases 0–14 implementadas. Fases 15–17 planejadas (produto). Infra (18–19) e Auth (20) adiados por decisão do dev.

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
- [x] `ScheduleRepository` — create/read de work_sessions e blocks
- [x] `LogRepository` — CRUD de execution_logs + `get_last_for_task()` + `revert()`
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

- [x] Schemas: `ExecutionLogCreate`, `ExecutionLogUpdate`, `ExecutionLogRead`
- [x] Router `/api/logs`:
  - [x] `POST /api/logs` — iniciar execução (`actual_start`)
  - [x] `PATCH /api/logs/{id}` — atualizar (`actual_end`, `completed`, `notes`)
  - [x] `GET /api/logs` — listar (filtros: date, task_id)
  - [x] `GET /api/logs/active/{task_id}` — log ativo de uma tarefa
- [x] Ao marcar log como `completed=true` → atualizar `task.status = done`
- [x] Ao iniciar → atualizar `task.status = in_progress`
- [x] Registrar em `audit_log`
- [x] Testes de integração
- [x] `POST /api/logs/revert/{task_id}` — reverte tarefa para pending, marca log como `abandoned=true`
- [x] Coluna `abandoned: bool` em `execution_logs` (migration `a3f8c2e91b47`)

**DoD:** fluxo completo testado: criar tarefa → agendar → iniciar → concluir → verificar status e log.

---

## ⚙️ Fase 6 — Backend: configurações

Meta: usuário consegue ajustar janela de trabalho e pausas.

- [x] Schemas: `UserConfigRead`, `UserConfigUpdate`
- [x] Router `/api/config`:
  - [x] `GET /api/config` — obter config atual
  - [x] `PATCH /api/config` — atualizar
- [x] Validações: `work_end > work_start`, intervalos razoáveis
- [x] Testes

**DoD:** alterar config pelo Swagger e ver mudança refletida em novo scheduling.

---

## ⚛️ Fase 7 — Frontend: setup

Meta: Vite rodando, Tailwind + shadcn configurados, roteamento base.

- [x] `pnpm create vite` com template `react-ts` em `/frontend`
- [x] Instalar: `tailwindcss`, `postcss`, `autoprefixer`, `react-router-dom@7`, `@tanstack/react-query`, `zustand`, `lucide-react`
- [x] Configurar Tailwind com paleta custom (dark + roxo)
- [x] Adicionar fontes JetBrains Mono + Outfit (via `@fontsource`)
- [x] Estrutura de rotas: `/`, `/tasks`, `/history`, `/settings`
- [x] Layout base com sidebar minimalista
- [x] Configurar ESLint + TypeScript strict
- [x] Configurar proxy no `vite.config.ts` para `/api` → `http://localhost:8000`

**DoD:** `pnpm dev` abre em localhost:5173 com layout básico navegável.

---

## 🔌 Fase 8 — Frontend: camada de API

Meta: tipos do backend disponíveis no frontend, wrappers de fetch prontos.

- [x] Criar `src/api/client.ts` — wrapper fino em fetch com tratamento de erros + `ApiError`
- [x] Criar `src/api/types.ts` — tipos manuais alinhados ao OpenAPI do backend
- [x] Criar módulos: `src/api/tasks.ts`, `src/api/schedule.ts`, `src/api/logs.ts`, `src/api/config.ts`
- [x] Setup TanStack Query — `QueryClientProvider`, devtools em dev

**DoD:** tela simples lista tarefas do backend usando tipos gerados, sem `any`.

---

## 📋 Fase 9 — Frontend: tela de tarefas

Meta: CRUD de tarefas visual e fluido.

- [x] Tela `/tasks` com lista + botão "Nova tarefa"
- [x] Modal de criação com campos: título, descrição, duração (quick-pick + input), prioridade
- [x] Edição via modal
- [x] Confirmação de delete (via `TaskCard`)
- [x] Filtros: status
- [x] Empty state bonito
- [x] Loading states e error handling com toast
- [x] Invalidação de cache ao mutar

**DoD:** dev consegue gerenciar tarefas inteiramente pela UI sem abrir o Swagger.

---

## 📅 Fase 10 — Frontend: timeline (a joia da coroa)

Meta: visualização do dia planejado em SVG, bonita e informativa.

- [x] Componente `<Timeline />` em `/`
- [x] Botão "Planejar dia" → chama `POST /api/schedule`
- [x] Eixo temporal horizontal (work_start → work_end) com ticks de hora
- [x] Blocos de tarefa posicionados por hora com barra de prioridade colorida
- [x] Indicador do "agora" (linha tracejada vertical + círculo)
- [x] Tarefas em overflow listadas abaixo com aviso laranja
- [x] Clicar bloco → iniciar/concluir execução (cria/atualiza log)
- [x] Estado visual de bloco: planejado, em andamento, concluído
- [x] Responsivo via ResizeObserver + scroll horizontal em telas pequenas
- [x] `<TimelineLegend />` com instruções de uso
- [x] Barra de progresso (concluídas/total) + stats bar
- [x] Correção de timezone: timestamps sem tzinfo tratados como fake-UTC; `parseISO()` + `field_serializer` no backend
- [x] Filtro de ticks do eixo próximos ao start/end (guard de 25min) — evita sobreposição de labels
- [x] Indicador "Agora" com fórmula correta: `Date.now() - getTimezoneOffset()*60000`
- [x] Hover com expansão inline (HTML overlay sobre SVG) — `ease-in-out` 200ms abertura e fechamento simétrico
- [x] Largura do hover calculada via `scrollWidth` do conteúdo real (+10px)
- [x] Anti-flicker: `pointerEvents: none` no bloco SVG quando hover ativo; estados `hoveredId`/`overlayInfo` separados

**DoD:** fluxo completo: criar tarefas → planejar dia → ver timeline → iniciar tarefa → timeline atualiza → concluir → próxima.

---

## 🔔 Fase 11 — Frontend: notificações e polish

Meta: experiência completa com alertas.

- [x] Toast feedback em todas as ações (criar, salvar, erro, iniciar, concluir)
- [x] Estados de loading refinados (skeleton animate-pulse)
- [x] Error boundary global (`<ErrorBoundary />` wraps App)
- [ ] Notificações Web Push (pós-MVP — requer permissão + worker)

**DoD:** app se comporta como produto, não como protótipo.

---

## 🎛️ Fase 12 — Frontend: settings

Meta: config editável pela UI.

- [x] Tela `/settings`
- [x] Formulário: work_start, work_end, break_duration, break_interval
- [x] Toggle de notificações
- [x] Preview: "Com essa config, você tem X minutos úteis por dia" (calculado client-side)

**DoD:** config pode ser totalmente ajustada via UI.

---

## 📊 Fase 13 — Estatísticas (pós-MVP inicial) ✅ 2026-04-21

Meta: dashboard básico de histórico.

- [x] Backend: `StatsService` e `/api/stats?period=week|day&date=YYYY-MM-DD`
  - [x] Taxa de conclusão por período
  - [x] Desvio médio (estimado vs real)
  - [x] Tarefas por prioridade executadas + abandonadas
  - [x] Tempo total registrado por dia
- [x] Frontend: tela `/history`
  - [x] Toggle "Hoje" / "Semana"
  - [x] Cards de métricas: concluídas, abandonadas (vermelho), tempo, desvio
  - [x] Gráficos SVG puros: `CompletionChart` (barras) + `LoggedMinutesChart` (polilinha)
  - [x] `PriorityBreakdown` com barras por prioridade
- [ ] Sugestão automática: "Você estima tarefas com -20% de precisão"

**DoD:** dev consegue responder "como foi minha semana?" em 1 clique.

---

## 🎨 Fase 14 — Visualização Kanban (pós-MVP) ✅ 2026-04-21

Meta: segunda view, mesma data.

- [x] Toggle timeline/kanban na tela principal (ícones lucide)
- [x] Colunas: A Fazer, Em Andamento, Concluído, Overflow
- [x] Drag-and-drop via `@dnd-kit/core` (PointerSensor + distância 8px)
- [x] Transições forward (todo→in_progress→done) e backward (qualquer→todo com revert)
- [x] Backward drag = abandono registrado como estatística negativa
- [x] Cards com barra de prioridade colorida + estado visual

**DoD:** as duas views compartilham dados e ações, sem duplicação de estado.

---

## 🔁 Fase 15 — Tarefas Recorrentes

Meta: usuário pode criar tarefas que repetem automaticamente (diário, semanal, dias específicos).

- [ ] Backend: adicionar campo `recurrence_rule` em `Task` (RRULE simplificado: `daily` / `weekly` / `weekdays` + `interval`)
- [ ] Migration Alembic para o novo campo `recurrence_rule`
- [ ] `RecurrenceService` — expande regras em instâncias concretas para a data requisitada
- [ ] `SchedulerService` integra instâncias recorrentes junto às tarefas únicas ao gerar o plano
- [ ] Schemas Pydantic atualizados: `TaskCreate`, `TaskRead` com campo opcional `recurrence_rule`
- [ ] Testes de `RecurrenceService`: diária, semanal, weekdays, interval > 1, sem recorrência
- [ ] Frontend: toggle de recorrência no modal de criação/edição de tarefa
- [ ] Frontend: seleção de tipo (diário / semanal / dias da semana) com opções condicionais
- [ ] Frontend: indicador visual nas task cards para tarefas recorrentes (ícone `lucide-react`)
- [ ] Frontend: indicador visual na timeline nos blocos recorrentes

**DoD:** criar uma tarefa recorrente diária → planejar o dia → instância aparece na timeline; editar a regra → plano regenerado reflete a mudança.

---

## 📦 Fase 16 — Histórico Reagendável

Meta: tarefas não concluídas do dia anterior podem ser transferidas para o próximo dia com 1 clique.

- [ ] Backend: `POST /api/schedule/rollover?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD`
- [ ] Lógica de rollover: só move tarefas com status `pending` ou `overflow` e sem log de conclusão; cria novo `ScheduledBlock` na data destino
- [ ] Schemas: `RolloverRequest`, `RolloverResponse` (lista de tarefas movidas + ignoradas)
- [ ] Registrar operação em `audit_log`
- [ ] Testes: rollover com tarefas mistas (pendentes + concluídas + recorrentes), data destino sem plano, data destino com plano existente
- [ ] Frontend: banner no Dashboard quando há tarefas não concluídas do dia anterior
- [ ] Frontend: botão "Reagendar para hoje" no banner com modal de confirmação listando as tarefas afetadas
- [ ] Frontend: tela `/history` exibe tarefas reagendadas com badge visual diferenciado
- [ ] Frontend: invalidar cache do schedule após rollover

**DoD:** ao abrir o app com tarefas de ontem não concluídas → banner aparece → confirmar → tarefas aparecem no plano de hoje.

---

## 📈 Fase 17 — Ajuste Automático de Estimativas

Meta: o sistema sugere correções nas durações estimadas com base no histórico real de execução.

- [ ] Backend: `StatsService.get_estimation_bias(task_id: UUID | None)` — calcula desvio médio por tarefa e global
- [ ] Algoritmo: média ponderada recente sobre `(estimated_duration - actual_duration)` dos `ExecutionLog` com `completed=true`; peso maior para execuções mais recentes
- [ ] Backend: `GET /api/stats/estimation-report` — retorna `{ global_bias_min, tasks: [{ task_id, title, bias_min, sample_count }] }`
- [ ] Testes de `StatsService`: bias positivo, negativo, zero, tarefa com 1 amostra (sem sugestão), sem dados
- [ ] Frontend: card "Precisão de Estimativas" na tela `/history` com bias global formatado (ex: `+12min em média`)
- [ ] Frontend: lista de tarefas sub/superestimadas com mais de 3 amostras, ordenadas por bias absoluto
- [ ] Frontend: no modal de edição de tarefa, exibir linha "Histórico sugere Xmin" quando `sample_count >= 3`
- [ ] Frontend: sugestão clicável — ao clicar, preenche o campo de duração com o valor sugerido

**DoD:** executar a mesma tarefa 3+ vezes com duração real diferente da estimada → abrir modal de edição → sugestão aparece com valor correto.

---

## 🐋 Fase 18 — Containerização ⛔ adiada (infra não é prioridade no momento)

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

## 🚀 Fase 19 — Deploy VPS

Meta: versão pública no VPS do dev.

- [ ] Adaptar CI/CD existente (padrão Next.js) para FastAPI + Vite
- [ ] GitHub Actions: build + test + deploy
- [ ] Nginx no VPS: SSL via Certbot (subdomínio, ex: flowday.nicoryy.com)
- [ ] Systemd unit ou PM2 para o backend
- [ ] Backup automático do DB (cron + rsync para local seguro)
- [ ] Monitoramento básico (uptime + erro rate via logs)

**DoD:** acessar publicamente, usar sem crash por 1 semana.

---

## 🔐 Fase 20 — Autenticação (quando decidir comercializar)

Meta: multi-usuário, login seguro.

- [ ] Escolher estratégia: NextAuth não (sem Next) → **Auth.js backend** ou **Authlib** ou **custom JWT**
- [ ] Adicionar `users` table + FK em todas as entidades
- [ ] Migrar dados existentes para user padrão
- [ ] Middleware de auth em todos os endpoints
- [ ] Login/logout/signup no frontend
- [ ] Proteção de rotas no frontend

**DoD:** dois usuários distintos veem dados isolados.

---

## 🏗️ Bloco: Infraestrutura (quando decidir subir para produção)

- Fase 18 — Containerização (Docker)
- Fase 19 — Deploy VPS

---

## 🔐 Bloco: Produto Comercial

- Fase 20 — Autenticação multi-usuário

---

## 🧊 Parking lot (sem prazo)

- Integração Google Calendar (import/export)
- PWA / modo offline completo com sync
- Atalhos de teclado globais
- Tema claro (por enquanto só dark)
- Export CSV/JSON
- API pública para integrações (n8n, Zapier)
- CLI companion (`flowday task add "..."`)
- Modo "foco" — tela cheia com só a tarefa atual e timer
- Integração com MCP para Claude trabalhar com seu próprio scheduler

---

## 🔥 Bugs conhecidos

_(vazio — todos os bugs conhecidos foram resolvidos até 2026-04-21)_

**Resolvidos recentemente:**
- ✅ Timeline: blocos aparecendo ~3h tarde (SQLite strips tzinfo → parseISO sem Z)
- ✅ Timeline: labels de hora sobrepostos ao start/end da jornada
- ✅ Timeline: indicador "Agora" com offset +6h (sinal errado na fórmula de timezone)
- ✅ Timeline hover: flicker (SVG onMouseLeave conflitando com overlay HTML)
- ✅ Timeline hover: animação de fechamento instantânea (agora simétrica com onTransitionEnd)

---

## 📌 Convenções de manutenção deste arquivo

- Item feito: `[x]`
- Item em andamento: adicionar `🚧` na frente
- Item bloqueado: adicionar `⛔ motivo` na frente
- Ao concluir uma fase inteira: adicionar data ao lado do cabeçalho
- Descoberta de nova tarefa necessária: adicionar na fase correspondente ou em "ideias geladas"