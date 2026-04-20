# FlowDay — Contextualização do Projeto

> Documento de referência central. Contém visão, escopo, arquitetura e decisões.
> **Atualizar sempre que houver decisão arquitetural significativa.**

---

## 1. Visão do produto

**FlowDay** é um organizador de tarefas local-first que transforma uma lista priorizada em uma timeline automática do dia. O usuário informa o que precisa fazer, quanto tempo cada coisa leva e qual sua janela de trabalho — o sistema monta o cronograma respeitando prioridades, durações e pausas. Toda execução é registrada para virar estatística de produtividade ao longo do tempo.

### Proposta de valor

- **Tira da cabeça do usuário a pergunta "o que faço agora?"**
- **Dados ficam na máquina do usuário** (privacy-first, local-first)
- **Aprende com o histórico** — estimativas melhoram com o uso
- **Sem lock-in** — SQLite default, Postgres opcional, sem vendor cloud

### Posicionamento

Diferente de Todoist, Motion, Reclaim.ai, Sunsama:
- 100% local-first no modo default
- Open-source, auto-hospedável
- Separação clara entre **planejado** e **executado** → estatísticas honestas
- Estética minimalista dark/purple

---

## 2. Público-alvo

- **Primário**: devs, estudantes, freelancers com dias desestruturados
- **Secundário**: qualquer knowledge worker que queira auto-scheduling sem SaaS cloud
- **Pessoal**: o próprio desenvolvedor (dogfooding desde o dia 1)

---

## 3. Escopo

### MVP (foco inicial)

1. CRUD de tarefas (título, descrição, duração estimada em minutos, prioridade 1-3)
2. Configuração de janela de trabalho (hora início + hora fim + config de pausas)
3. Algoritmo de scheduling que distribui tarefas na timeline
4. Visualização em **timeline horizontal** (única view no MVP)
5. Pausas automáticas configuráveis (ex: 5min a cada 50min)
6. Notificações in-browser (Notification API) de transição entre tarefas
7. Log de execução (início real, fim real, se concluiu, se atrasou)
8. Persistência SQLite
9. Configuração de DB via env var — troca SQLite ↔ Postgres sem tocar código
10. Sem autenticação (local-first)

### Pós-MVP (fases posteriores)

- Visualização Kanban
- Dashboard de estatísticas (taxa de conclusão, desvio estimado vs real, picos de produtividade)
- Ajuste automático de estimativas baseado em histórico
- Auth (multi-usuário) — para deploy compartilhado
- Tags/categorias
- Tarefas recorrentes
- Import/export (Google Calendar, CSV, JSON)
- Histórico reagendável ("não terminei hoje, joga pra amanhã")
- Deploy Docker + VPS
- PWA (instalável, offline-first via service worker)

### Fora de escopo (explicitamente)

- Colaboração multi-usuário em tempo real
- Integração nativa com Slack/Teams/Email
- Mobile app nativo (pode ser PWA, mas não nativo)
- IA para sugestão de tarefas (pode virar ideia futura mas não é core)

---

## 4. Stack técnica

### Backend

| Camada | Escolha | Justificativa |
|---|---|---|
| Runtime | Python 3.12+ | Domínio do dev, ecossistema robusto |
| Framework | FastAPI | Async, OpenAPI auto, Pydantic nativo, velocidade |
| ORM | SQLAlchemy 2.0 | Abstração SQLite ↔ Postgres sem dor |
| Migrations | Alembic | Padrão do ecossistema SQLAlchemy |
| Validação | Pydantic v2 | Nativo do FastAPI, performance |
| DB default | SQLite | Local-first, zero config |
| DB opcional | PostgreSQL 15+ | Produção, concorrência, recursos avançados |
| Dep manager | uv ou poetry | Preferência: **uv** (mais rápido, moderno) |
| Testes | pytest + httpx | Padrão FastAPI |

### Frontend

| Camada | Escolha | Justificativa |
|---|---|---|
| Build tool | **Vite** | Leve, HMR instantâneo, build estático — não precisa de SSR |
| Framework | React 18+ | Ecossistema maduro |
| Linguagem | TypeScript 5+ | Type safety end-to-end |
| Styling | Tailwind CSS | Velocidade, alinha com shadcn/ui |
| Componentes | shadcn/ui | Customizável, dark mode nativo, combina com estética |
| Router | React Router v7 | Maduro, sem cerimônia |
| Server state | TanStack Query | Cache, refetch, estado assíncrono |
| Client state | Zustand | Leve, sem boilerplate (Redux é overkill) |
| Timeline | SVG + D3 (scales/axis) | Controle total, sem libs Gantt pesadas |
| HTTP client | axios ou fetch nativo | Preferência: fetch nativo + wrapper fino |
| Types do backend | openapi-typescript | Gera tipos TS a partir do OpenAPI do FastAPI |

### Decisão sobre Vite vs Next.js

Vite foi escolhido porque:
- Backend é separado (FastAPI) — não se aproveita nada do SSR/ISR/Server Components do Next
- App é autenticada/local-first — SEO é irrelevante
- Dev experience: Vite cold start ~300ms vs Next 3-8s
- Bundle final menor
- Deploy estático trivial: Nginx serve `/dist`, sem Node em produção

### Infra (futuro)

- Docker multi-stage (frontend build → Nginx; backend → uvicorn)
- docker-compose para dev (Postgres + backend + frontend)
- VPS com Nginx reverse proxy, UFW, Fail2ban, SSL via Certbot
- CI/CD via GitHub Actions (pipeline similar ao já estabelecido pelo dev)

---

## 5. Arquitetura

### Visão alto nível

```
┌──────────────────────────────────────┐
│  Frontend (Vite + React + TS)        │
│  ├─ /dashboard  (timeline do dia)    │
│  ├─ /tasks      (gestão de tarefas)  │
│  ├─ /history    (logs, estatísticas) │
│  └─ /settings   (config, DB URL)     │
└─────────────┬────────────────────────┘
              │ HTTP/JSON (REST)
┌─────────────▼────────────────────────┐
│  Backend (FastAPI)                    │
│  ├─ /api/tasks      CRUD              │
│  ├─ /api/schedule   gera timeline     │
│  ├─ /api/logs       registra execução │
│  ├─ /api/stats      agregações        │
│  └─ /api/config     settings do user  │
├───────────────────────────────────────┤
│  Service Layer                        │
│  ├─ SchedulerService (algoritmo)      │
│  ├─ StatsService (agregações)         │
│  └─ ConfigService                     │
├───────────────────────────────────────┤
│  Repository Layer (SQLAlchemy)        │
└─────────────┬─────────────────────────┘
              │
     ┌────────┴────────┐
     ▼                 ▼
  SQLite            Postgres
  (default)         (via DATABASE_URL)
```

### Modelagem de dados

**Decisão-chave:** separar `Task` (intenção), `ScheduledBlock` (alocação planejada), `ExecutionLog` (execução real). Sem essa separação, estatísticas futuras ficam inviáveis.

#### Entidades

**`tasks`**
- `id` (UUID, PK)
- `title` (str, not null)
- `description` (text, nullable)
- `estimated_minutes` (int, not null)
- `priority` (int 1-3, default 2)
- `status` (enum: pending, scheduled, in_progress, done, skipped, overflow)
- `created_at`, `updated_at` (timestamps)

**`scheduled_blocks`** (o plano do dia)
- `id` (UUID, PK)
- `task_id` (FK → tasks.id)
- `work_session_id` (FK → work_sessions.id)
- `planned_start` (timestamp)
- `planned_end` (timestamp)
- `position` (int — ordem dentro da sessão)

**`execution_logs`** (o que aconteceu de verdade)
- `id` (UUID, PK)
- `task_id` (FK → tasks.id)
- `work_session_id` (FK, nullable — pode logar execução fora de sessão)
- `actual_start` (timestamp, nullable)
- `actual_end` (timestamp, nullable)
- `completed` (bool)
- `notes` (text, nullable)
- `created_at` (timestamp)

**`work_sessions`** (um "dia planejado")
- `id` (UUID, PK)
- `date` (date)
- `work_start` (time)
- `work_end` (time)
- `config_snapshot` (JSON — congela a config do momento do plano)
- `created_at` (timestamp)

**`user_config`** (singleton por enquanto; vira multi-user com auth)
- `id` (int, PK, default 1)
- `default_work_start` (time)
- `default_work_end` (time)
- `break_duration_min` (int, default 5)
- `break_interval_min` (int, default 50)
- `timezone` (str, default "America/Fortaleza")
- `notifications_enabled` (bool, default true)

**`audit_log`** (trilha de auditoria — toda ação relevante)
- `id` (UUID, PK)
- `action` (str — "task.created", "task.rescheduled", "schedule.generated", etc.)
- `payload` (JSON)
- `created_at` (timestamp)

### Fluxo principal: gerar o dia

```
1. Usuário cria tarefas (POST /api/tasks) ──► tasks.status = pending
2. Usuário clica "Planejar dia" ──► POST /api/schedule
   ├─ SchedulerService lê tarefas pending
   ├─ Lê user_config (janela, pausas)
   ├─ Aloca tarefas em scheduled_blocks
   ├─ Tarefas que não couberem → status = overflow
   └─ Cria work_session
3. Frontend renderiza timeline a partir de scheduled_blocks
4. Usuário inicia tarefa ──► POST /api/logs (actual_start)
5. Usuário conclui tarefa ──► PATCH /api/logs (actual_end, completed)
6. Fim do dia: stats consolidadas no background
```

### Algoritmo de scheduling (MVP)

**Abordagem: greedy com priority-weighted shortest-job-first**

```
inputs:
  - tasks: lista de tarefas pending
  - work_start, work_end
  - break_duration, break_interval

passos:
  1. ordena tasks por (priority desc, estimated_minutes asc)
  2. calcula available_minutes = (work_end - work_start) em min
  3. cursor = work_start
  4. minutes_since_break = 0
  5. para cada task em tasks_ordenadas:
       se (estimated_minutes + cursor) > work_end:
         marca task.status = overflow
         continue
       se minutes_since_break >= break_interval:
         cursor += break_duration
         minutes_since_break = 0
       cria ScheduledBlock(task, start=cursor, end=cursor+duration)
       cursor += estimated_minutes
       minutes_since_break += estimated_minutes
       task.status = scheduled
  6. persiste work_session + scheduled_blocks
```

**Por que greedy e não constraint solver:**
- Complexidade NP-hard só aparece com dependências entre tarefas, janelas múltiplas, ou deadlines rígidos — nenhum disso está no MVP
- Greedy roda em O(n log n) e produz resultado "bom o suficiente"
- Se virar produto, trocar por OR-Tools ou algoritmo genético — mas só com dados reais provando necessidade

### Flexibilidade SQLite ↔ Postgres

**Mecanismo:**
```python
# config.py
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./flowday.db")
```

- Default: SQLite local
- Env var setada → Postgres
- Alembic migrations rodam nos dois igual (SQLAlchemy abstrai)
- UI de settings escreve no `.env` (pós-MVP) — no MVP basta editar manualmente

**Cuidados específicos:**
- SQLite não tem `UUID` nativo → usa `String(36)` com tipo custom
- SQLite não tem `JSON` query avançada → usar JSON só para snapshots, não para buscas
- Datas/timestamps: sempre UTC no banco, converte para timezone na UI

---

## 6. Princípios de engenharia

1. **Local-first é decisão de arquitetura, não feature.** Tudo funciona offline, DB embutido no MVP.
2. **Separar intenção, plano e execução.** Essa trinca é o que permite estatística honesta.
3. **Logs desde o dia zero.** Mesmo sem dashboard, grava tudo — dados perdidos não voltam.
4. **Tipos end-to-end.** FastAPI gera OpenAPI → gera tipos TS → frontend tipado.
5. **Zero lock-in.** Exportável, auto-hospedável, DB trocável.
6. **Dogfooding.** O dev usa o app todo dia desde a primeira versão funcional.
7. **Simplicidade > completude.** MVP pequeno e funcional é melhor que grandioso e inacabado.

---

## 7. Estrutura do repositório (monorepo)

```
flowday/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI entry
│   │   ├── config.py            # Env, DB URL, settings
│   │   ├── database.py          # SQLAlchemy engine, session
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── repositories/        # Data access layer
│   │   ├── services/            # Business logic (scheduler, stats)
│   │   ├── routers/             # FastAPI routers (tasks, schedule, logs, config)
│   │   └── utils/
│   ├── alembic/                 # Migrations
│   ├── tests/
│   ├── pyproject.toml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/              # React Router routes
│   │   ├── components/
│   │   │   ├── timeline/        # Timeline SVG components
│   │   │   ├── kanban/          # (pós-MVP)
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   └── layout/
│   │   ├── hooks/
│   │   ├── stores/              # Zustand stores
│   │   ├── api/                 # Fetch wrappers, types gerados
│   │   ├── lib/
│   │   └── styles/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.dev.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── docs/
│   ├── CONTEXT.md               # este arquivo
│   ├── CLAUDE.md                # handoff para Claude Code
│   ├── RAW_IDEA.md              # ideia bruta original
│   ├── TODO.md                  # backlog de desenvolvimento
│   └── ARCHITECTURE.md          # (futuro) decisões detalhadas
├── README.md
├── .gitignore
└── LICENSE
```

---

## 8. Identidade visual

- **Paleta:** dark base (`#0a0a0a` / `#111111`) + roxo acento (`#7c3aed`, `#a78bfa`)
- **Tipografia:** JetBrains Mono (mono) + Outfit (sans) — alinhado à marca nicoryy
- **Densidade:** média — não muito apertado, não muito espaçoso
- **Animações:** sutis (framer-motion só onde agregar), respeitar `prefers-reduced-motion`
- **Ícones:** lucide-react

---

## 9. Métricas de sucesso (MVP)

- Dev usa o app todos os dias úteis por 2 semanas consecutivas
- Tempo entre criar tarefas e ver a timeline < 10 segundos
- Bundle do frontend < 300KB gzipped
- Backend responde p95 < 100ms em operações CRUD
- Migração SQLite → Postgres funciona sem perda de dados
- Zero dados perdidos após crash/reboot

---

## 10. Histórico de decisões (ADRs resumidos)

| # | Data | Decisão | Motivo |
|---|---|---|---|
| 1 | Init | Vite em vez de Next.js | Backend separado, sem SSR, dev experience |
| 2 | Init | FastAPI + SQLAlchemy 2.0 | Domínio do dev, abstração SQLite↔Postgres |
| 3 | Init | Monorepo único | Deploy unificado, tipos compartilhados via OpenAPI |
| 4 | Init | Timeline como única view MVP | Diferencial vs concorrentes que só têm Kanban |
| 5 | Init | Sem auth no MVP | Local-first, reduz superfície, acelera MVP |
| 6 | Init | Separar Task/ScheduledBlock/ExecutionLog | Possibilita estatísticas honestas |
| 7 | Init | Scheduler greedy | Suficiente para MVP, evita overengineering |