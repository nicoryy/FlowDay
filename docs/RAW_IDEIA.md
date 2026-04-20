# FlowDay — Ideia Bruta Original

> Este documento preserva a ideia original do projeto, como descrita inicialmente.
> **Não editar.** Serve como fonte de verdade histórica para decisões de escopo.

---

## Descrição original

O projeto será uma página web — um organizador de tempo e tarefas com base em prioridades. A organização pode ser tanto em quadros (kanban) quanto em timeline, mas a funcionalidade mais importante é:

O usuário irá listar tarefas, listar prioridades dessas tarefas, e com base nisso o sistema irá reorganizar todas essas tarefas de acordo com o tempo restante do dia e o horário de trabalho do usuário. Assim, organiza as prioridades, as ordens e o tempo que cada tarefa irá levar.

**Exemplo prático:**
Usuário entra no sistema e diz: "preciso fazer tarefa 1, tarefa 2, tarefa 3, tarefa 4 e vou iniciar às 12h". O usuário configura também até que horário tem para trabalhar — suponha até às 18h. Às 12h ele organiza essas 4 tarefas, coloca as prioridades, e o sistema mostra um quadro/timeline com o tempo desde o início até o final do dia, organizando cada tarefa com seu horário, prioridade e duração estimada. Dessa forma o usuário tem noção e organização de suas tarefas ao longo do dia.

## Requisitos funcionais explícitos

- Levar em consideração **tempos de descanso** (pausas)
- Respeitar **ordens de prioridades**
- Mostrar **avisos e notificações**
- Manter **logs organizados** de tudo
- Todas as informações devem ser salvas — virarão **estatísticas futuras** para o usuário

## Requisitos de arquitetura explícitos

- Estrutura de banco de dados deve caber tanto em **SQLite quanto Postgres**
- Enquanto a aplicação não subir para produção: roda com **SQLite local**
- Quando o usuário quiser migrar: muda nas **configurações do sistema, sem alterar código**
- Se não configurar nada → usa SQLite
- Se houver `DATABASE_URL` nas configurações → puxa do Postgres direto
- O sistema precisa ter essa flexibilidade desde o dia 1

## Autenticação

- **MVP não terá autenticação** (é local-first, não produção)
- Autenticação entra depois, pensando em portfólio e possível comercialização

## Design

- Modelos de organização: **timeline** e **kanban**
- Estética: **minimalista, escura, roxa** (alinhada à marca pessoal do desenvolvedor)

## Foco do MVP

- Rodar **localmente com SQLite**
- Otimizado para **futuramente subir para VPS**
- **Sem autenticação** no MVP
- Local-first, não produção ainda

---

## Contexto do desenvolvedor (relevante para decisões)

- Dev: Pedro Nicory (nicoryy)
- Stack preferida: Python, FastAPI, TypeScript, PostgreSQL, SQLite
- Marca pessoal: dark/purple aesthetic — consistente em nicoryy.com, GitHub, documentos
- Experiência prévia: CI/CD Next.js → VPS, hardening VPS, FastAPI + Graph API, n8n, QGIS
- Projeto destinado a: portfólio pessoal + uso próprio + potencial comercialização futura