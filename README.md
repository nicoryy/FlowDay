# FlowDay

Organizador de tarefas local-first com auto-scheduling por prioridade.

## O que é

FlowDay transforma uma lista de tarefas em uma timeline automática do seu dia. Informe o que precisa fazer, quanto tempo cada coisa leva e sua janela de trabalho — o sistema monta o cronograma respeitando prioridades, durações e pausas.

## Funcionalidades (MVP)

- CRUD de tarefas com prioridade e duração estimada
- Configuração de janela de trabalho e pausas
- Timeline automática por algoritmo greedy (priority + shortest-job-first)
- Log de execução (real vs planejado)
- Dados 100% locais (SQLite por padrão, Postgres opcional)

## Stack

**Backend:** Python 3.12+, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2  
**Frontend:** Vite, React 18+, TypeScript 5+, Tailwind CSS, shadcn/ui

## Como rodar (desenvolvimento)

### Pré-requisitos

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (gerenciador de pacotes Python)
- Node.js 20+
- pnpm

### Backend

```bash
cd backend
uv sync
cp .env.example .env
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

API disponível em `http://localhost:8000` | Swagger em `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

App disponível em `http://localhost:5173`

### Testes

```bash
# Backend
cd backend && uv run pytest tests/ -v

# Frontend
cd frontend && pnpm test
```

---

# FlowDay (EN)

Local-first task organizer with priority-based auto-scheduling.

Transforms a prioritized task list into an automatic daily timeline respecting work windows, breaks, and priorities.

**Backend:** Python 3.12+, FastAPI, SQLAlchemy 2.0  
**Frontend:** Vite, React 18+, TypeScript 5+, Tailwind CSS

## Quick start

```bash
# Backend
cd backend && uv sync && uv run alembic upgrade head && uv run uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend && pnpm install && pnpm dev
```
