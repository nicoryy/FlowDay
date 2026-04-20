# CLAUDE.md — Guia de Desenvolvimento para Claude Code

> Este arquivo instrui o Claude Code sobre como desenvolver o FlowDay.
> **Ler este arquivo inteiro antes de escrever qualquer código.**

---

## 🎯 Missão

Construir o **FlowDay**, um organizador de tarefas local-first com auto-scheduling por prioridade. Escopo completo e arquitetura estão em `CONTEXT.md`. Ideia original (não editar) em `RAW_IDEA.md`. Backlog ativo em `TODO.md`.

---

## 🧭 Regras de ouro

1. **Sempre ler antes de escrever.** Antes de tocar em qualquer arquivo, ler `CONTEXT.md` e `TODO.md`. Se o arquivo existe, ler antes de editar.
2. **Um commit = uma unidade lógica.** Não misturar refactor, feature e fix no mesmo commit.
3. **Testes acompanham features.** Nenhuma feature entra sem pelo menos teste de happy path.
4. **Tipos end-to-end.** Toda resposta de API tem schema Pydantic. Toda chamada no frontend usa tipos gerados do OpenAPI.
5. **Sem atalhos em migrations.** Alembic sempre. Nunca `create_all()` em produção.
6. **Logs são feature, não afterthought.** Toda ação que muda estado vai em `audit_log`.
7. **Perguntar antes de inventar.** Se uma decisão de produto não está em `CONTEXT.md`, perguntar ao usuário antes de assumir.

---

## 🗣️ Idioma e convenções

- **Código, nomes de variáveis, comentários técnicos, docstrings**: inglês
- **Mensagens de commit**: inglês, conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)
- **Textos de UI voltados ao usuário**: português brasileiro
- **Conversas com o dev no chat**: português brasileiro
- **Documentação em `/docs`**: português brasileiro
- **README**: bilíngue (PT-BR principal, EN abaixo)

---

## 🛠️ Stack (referência rápida)

**Backend:**
- Python 3.12+, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2
- Gerenciador: `uv` (preferência; fallback `poetry`)
- Testes: `pytest` + `httpx`
- Lint/format: `ruff` + `ruff format` (substitui black+flake8+isort)
- Type check: `mypy` (strict em services e models)

**Frontend:**
- Vite + React 18+ + TypeScript 5+ (strict)
- Tailwind CSS + shadcn/ui
- React Router v7
- TanStack Query + Zustand
- D3 (só scales/axis) + SVG puro para timeline
- Lint/format: `eslint` + `prettier`
- Testes: `vitest` + `@testing-library/react`

**Infra:**
- Docker multi-stage
- GitHub Actions CI/CD (seguir padrão já dominado pelo dev)
- Nginx reverse proxy

---

## 📐 Arquitetura (resumo — detalhes em CONTEXT.md)

- **Backend em camadas**: routers → services → repositories → models
- **Entidades separadas**: `Task` (intenção) ≠ `ScheduledBlock` (plano) ≠ `ExecutionLog` (execução)
- **DB flexível**: `DATABASE_URL` env var decide SQLite (default) ou Postgres
- **Sem auth no MVP**: `user_config` é singleton (`id=1`)
- **Timeline no frontend**: calculada localmente a partir do plano estático do backend (sem WebSocket)

---

## 🔨 Ordem de implementação obrigatória

Seguir `TODO.md` em ordem. Não pular fases. Cada fase tem critérios de "feito" — não marcar como concluída sem atender todos.

### Ordem resumida

1. **Setup inicial** — estrutura de pastas, ferramentas, git, CI básico
2. **Backend core** — FastAPI boot, DB connection, models, migrations iniciais
3. **Backend CRUD tarefas** — endpoints `/api/tasks` completos com testes
4. **Backend scheduler** — `SchedulerService` + endpoint `/api/schedule`
5. **Backend logs** — endpoints de execution_logs
6. **Frontend setup** — Vite + Tailwind + shadcn + roteamento
7. **Frontend API layer** — geração de tipos via OpenAPI, wrappers de fetch
8. **Frontend tela de tarefas** — CRUD visual
9. **Frontend timeline** — componente SVG + integração com backend
10. **Frontend settings** — janela de trabalho, pausas
11. **Integração e polish** — notificações, estados de loading, erros
12. **Docker + deploy** — containerização e CI/CD
13. **Testes de migração** — SQLite → Postgres sem perda de dados

---

## 🧪 Padrões de teste

**Backend:**
- Cada endpoint → pelo menos 1 teste de sucesso + 1 teste de erro
- Cada service → testes unitários do algoritmo/regra
- `SchedulerService` especificamente → bateria de casos:
  - Todas cabem no dia
  - Uma estoura e vira overflow
  - Pausa cai no meio de tarefa longa
  - Prioridades iguais, durações diferentes
  - Janela muito curta
  - Lista vazia

**Frontend:**
- Componentes críticos (timeline, form de tarefa) → testes de render + interação
- Hooks custom → testes isolados

---

## 📦 Padrões de código

### Backend

```python
# Estrutura de router típica
from fastapi import APIRouter, Depends, status
from app.schemas.task import TaskCreate, TaskRead
from app.services.task_service import TaskService
from app.deps import get_task_service

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.post("", status_code=status.HTTP_201_CREATED, response_model=TaskRead)
async def create_task(
    payload: TaskCreate,
    service: TaskService = Depends(get_task_service),
) -> TaskRead:
    return await service.create(payload)
```

**Nunca:**
- Lógica de negócio dentro de router
- Query SQLAlchemy dentro de router
- `print()` — usar `logging` configurado
- Except genérico sem re-raise ou log

### Frontend

```tsx
// Componente típico
import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "@/api/tasks";

export function TaskList() {
  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  if (isLoading) return <Skeleton />;
  return <ul>{data?.map(t => <TaskItem key={t.id} task={t} />)}</ul>;
}
```

**Nunca:**
- `any` em TypeScript (usar `unknown` se realmente necessário)
- Fetch solto em `useEffect` (usar TanStack Query)
- Estilização inline sem motivo forte
- Componentes > 200 linhas sem quebrar

---

## 🎨 Identidade visual (obrigatório seguir)

- Paleta base: dark `#0a0a0a` / `#111111`
- Roxo acento: `#7c3aed` (primary), `#a78bfa` (hover/accent)
- Tipografia: **JetBrains Mono** (código, números, timeline ticks) + **Outfit** (UI geral)
- Ícones: `lucide-react` sempre
- Radius padrão: `rounded-lg` (8px)
- Animações: sutis, via Tailwind ou `framer-motion` pontual

---

## 🚫 Não fazer

- ❌ Adicionar features que não estão no MVP do `TODO.md` sem perguntar
- ❌ Escolher libs pesadas sem justificar (bundle size importa)
- ❌ Gerar código que quebra tipagem (`any`, `# type: ignore` sem comentário)
- ❌ Copiar código de exemplo sem adaptar ao padrão do projeto
- ❌ Criar abstrações prematuras ("isso pode ser útil no futuro") — YAGNI
- ❌ Escrever testes que só validam mock (testar comportamento, não implementação)
- ❌ Commit com "WIP" ou "fix stuff" — mensagens sempre descritivas
- ❌ Tocar em migrations já aplicadas — sempre criar nova migration

---

## ✅ Ao terminar uma tarefa

1. Rodar testes: `pytest` (backend) e `vitest` (frontend) — tudo verde
2. Rodar lint/format: `ruff check . && ruff format .` + `pnpm lint && pnpm format`
3. Atualizar `TODO.md` marcando item como concluído (`[x]`)
4. Se decisão arquitetural nova → atualizar tabela de ADRs em `CONTEXT.md`
5. Commit com mensagem convencional + descrição clara
6. Se for feature completa → sugerir ao dev rodar smoke test manual

---

## 🧩 Perguntas frequentes ao dev (pergunte se incerto)

- "Essa feature entra no MVP ou vai para pós-MVP?"
- "Prefere X ou Y? (com trade-offs listados)"
- "Posso adicionar a dependência Z? (motivo + tamanho)"
- "Essa decisão muda o contrato da API — aceita?"

**Nunca assuma silenciosamente em decisões de produto.** Em decisões técnicas menores (nomeação interna, organização de pastas dentro do padrão), pode decidir e justificar no commit.

---

## 🔗 Referências ao ecossistema do dev

- Estética e padrão visual: coerente com **nicoryy.com** (dark/roxo, JetBrains Mono + Outfit)
- CI/CD: aproveitar padrão já dominado (GitHub Actions → VPS com PM2/Nginx) — adaptar para stack FastAPI+Vite
- VPS alvo (futuro): llassessoria, IP `167.88.33.217`
- Hardening: SSH key-only, UFW, Fail2ban, Certbot — já é padrão do dev

---

## 🏁 Definition of Done (checklist por feature)

- [ ] Código implementado conforme padrão
- [ ] Testes escritos e passando (backend + frontend quando aplicável)
- [ ] Lint + format + type check sem erro
- [ ] `TODO.md` atualizado
- [ ] Commit message descritiva no padrão convencional
- [ ] Sem TODO/FIXME órfão no código (ou com issue vinculada)
- [ ] Funciona local (smoke test manual)
- [ ] Documentação atualizada se contrato de API mudou