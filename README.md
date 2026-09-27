# Academic System

Sistema de gestão acadêmica desenvolvido como projeto de estudo, cobrindo autenticação, gestão de alunos, professores, turmas, notas, frequência, avisos, calendário e atividades. Backend em FastAPI com arquitetura em camadas, frontend em React com TypeScript e Tailwind CSS.

## Stack

**Backend:** Python, FastAPI, SQLAlchemy, MySQL, JWT (PyJWT), pwdlib para hash de senha, slowapi para rate limiting, Jinja2 para templates de e-mail.

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router.

**Infraestrutura:** Docker e Docker Compose para desenvolvimento e implantação.

## Arquitetura

O backend segue arquitetura em camadas, separando responsabilidades em:

- `controllers` — recebem a requisição HTTP, validam o corpo via schemas Pydantic e delegam para a camada de serviço
- `services` — concentram a regra de negócio, validações de domínio e checagens de permissão
- `repositories` — isolam o acesso ao banco de dados via SQLAlchemy
- `models` — definem as tabelas e relacionamentos
- `schemas` — definem os formatos de entrada e saída da API

Todo identificador exposto pela API é um UUID público (`public_id`), nunca o id sequencial interno do banco, para não vazar contagem de registros nem permitir enumeração de recursos pela URL.

## Funcionalidades

O sistema cobre os seguintes módulos:

**Autenticação** — cadastro, login, logout, controle de acesso por papel (aluno, professor, administrador).

**Estrutura acadêmica** — disciplinas, professores, alunos, turmas e matrículas, com visibilidade restrita por papel (aluno só vê as turmas em que está matriculado, professor só as que leciona).

**Acompanhamento acadêmico** — lançamento e consulta de notas e frequência, cada turma tem uma média mínima configurável para dispensa de exame, com alerta automático quando a média do aluno fica abaixo dela.

**Comunicação** — avisos gerais ou por turma, notificações em tempo real via SSE (Server-Sent Events), com indicador de não lida por tipo.

**Calendário acadêmico** — eventos, provas e prazos de atividades, visíveis conforme a mesma regra de vínculo por turma.

**Atividades e entregas** — cadastro de trabalhos com prazo, e envio de entregas pelos alunos quando habilitado.

**Administração** — gestão de usuários, papéis e dados gerais do sistema, exclusiva de administradores.

**Pesquisa e dashboard** — busca unificada por alunos, professores, turmas e disciplinas, e uma tela inicial com informações relevantes conforme o papel do usuário logado.

## Segurança

- Rate limiting em login e registro, para mitigar força bruta
- Proteção contra SQL injection via consultas parametrizadas do SQLAlchemy, incluindo escape de curingas em buscas com LIKE
- Autenticação híbrida, cookie httpOnly para o navegador ou cabeçalho Bearer para outros clientes
- Proteção CSRF via padrão double-submit cookie, aplicada quando a autenticação por cookie está em uso
- CORS restrito a origens explícitas, nunca curinga
- Cabeçalhos de segurança (X-Content-Type-Options, X-Frame-Options, Content-Security-Policy)
- Sanitização de texto livre contra XSS armazenado em avisos, eventos e atividades
- Checagens de posse (IDOR) em notas, frequência, avisos, eventos e atividades, garantindo que um usuário só acesse dados vinculados a ele
- Tratamento de condição de corrida em matrícula, frequência e entrega via constraint de unicidade no banco

## Rodando localmente

### Pré-requisitos

Python 3.11, Node 20+, MySQL 8, ou Docker e Docker Compose para não precisar instalar nada disso manualmente.

### Com Docker (recomendado)

Crie um arquivo `.env` na raiz do projeto com:

```
MYSQL_ROOT_PASSWORD=escolha_uma_senha_forte
JWT_SECRET_KEY=gere_com_secrets.token_urlsafe
```

Suba os serviços:

```
docker compose up -d --build
```

Crie as tabelas na primeira execução:

```
docker compose exec backend python create_tables.py
```

O backend fica disponível em `http://localhost:8000` e o frontend em `http://localhost:5173`.

### Sem Docker

**Backend**, dentro da pasta `backend`:

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Crie um `.env` dentro de `backend` com:

```
DATABASE_URL=mysql+pymysql://root:sua_senha@localhost:3306/project
JWT_SECRET_KEY=gere_com_secrets.token_urlsafe
CORS_ORIGINS=http://localhost:5173
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

Crie o banco `project` no seu MySQL local, depois rode:

```
python create_tables.py
uvicorn app.main:app --reload
```

**Frontend**, dentro da pasta `frontend`:

```
npm install
```

Crie um `.env` com:

```
VITE_API_BASE_URL=http://localhost:8000
```

```
npm run dev
```

## Criando o primeiro administrador

O registro público sempre cria um usuário com papel de aluno, e promover alguém a administrador exige que outro administrador já exista. Para o primeiro admin, insira o registro diretamente no banco, ou rode um script de seed equivalente antes do primeiro uso real do sistema.

## Testes

```
pytest -v
```

A suíte roda contra um banco SQLite em memória, isolado por teste, e cobre os fluxos principais de cada módulo, checagens de permissão por papel, os casos de controle de acesso indevido corrigidos em avisos, eventos, notas e frequência, o mecanismo de CSRF, e o rate limiting de login e registro.

## Limitações conhecidas

- Recuperação de senha (RF21) ainda não foi implementada
- Notificações em tempo real via SSE guardam as conexões em memória, funcionam apenas com um único processo de backend; escalar para múltiplos workers ou servidores exige trocar por um barramento como Redis pub/sub
- Não há ferramenta de migration configurada (Alembic), alterações de esquema hoje exigem recriar o banco do zero
- Listagens sem paginação em endpoints como usuários, alunos e disciplinas
- Escrita de notas, frequência, avisos, eventos e atividades é hoje exclusiva de administradores; abrir para professores exige adicionar checagem de vínculo com a turma nessas rotas

## Estrutura de pastas

```
.
├── backend/
│   ├── app/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── core/
│   │   ├── config/
│   │   └── database/
│   ├── tests/
│   ├── create_tables.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── types/
│   └── Dockerfile
├── docker-compose.yml
└── .gitignore
```
