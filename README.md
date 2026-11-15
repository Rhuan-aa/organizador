# Organizador de Vida Acadêmica

Aplicação web para o aluno gerenciar aulas, atividades e provas, ver tudo em um calendário e receber avisos de prazos por e-mail.
API em Node 22 (Express + `node:sqlite`) e interface em React (Vite). Os documentos de gestão (D1–D14) ficam em `docs/gestao/`, fora do repositório porque contêm dados pessoais dos integrantes.

## Como rodar

Requer Node 22.

```
npm install
npm run dev:server   # API em http://localhost:3000 (banco: organizador.db, ou DB_FILE)
npm run dev:web      # interface em http://localhost:5173 (proxy /api -> :3000)
npm test             # testes da API
npm run build        # build da interface (web/dist)
```

Variáveis opcionais: `PORT`, `DB_FILE`, `SECRET` (assinatura do token de login; defina em produção — sem ela, uma chave aleatória é gerada a cada execução e os logins expiram quando o servidor reinicia), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
Sem `SMTP_HOST` os e-mails são apenas escritos no console. O cadastro pela tela sempre cria um aluno; para tornar alguém administrador, rode no servidor: `npm run admin -- email@exemplo.com`.

## EAP (D8) -> código

| Pacote | Servidor | Interface |
|---|---|---|
| 1 Aulas (1.1-1.3) | `server/src/crud.js`, config `aulas` em `app.js`, tabela `aulas` | `web/src/CrudPage.jsx` + `CAMPOS.aulas` (1.4) |
| 2 Atividades (2.1-2.3) | config `atividades` em `app.js` | `CAMPOS.atividades` (2.4) |
| 3 Provas (3.1-3.3) | config `provas` em `app.js` (índice único = sem conflito de horário) | `CAMPOS.provas` (3.4) |
| 4 Usuários (4.1-4.2) | `server/src/auth.js`, rotas `/api/auth` e `/api/usuarios` em `app.js` | `Login`, `Perfil`, `Usuarios` em `web/src/App.jsx` (4.3) |
| 5 Calendário (5.1, 5.3) | `/api/calendario` em `app.js`; `server/src/notificacoes.js` | `web/src/Calendario.jsx` (5.2) |

## Requisitos (D6) -> código

| Requisito | Onde |
|---|---|
| RF01 disciplinas | aulas (`/api/aulas`, página Aulas) |
| RF02 atividades e provas | `/api/atividades`, `/api/provas`, páginas correspondentes |
| RF03 calendário | `/api/calendario`, `Calendario.jsx` |
| RF04 prazos destacados | `classePrazo` em `App.jsx` (vermelho = vencida, amarelo = dentro da antecedência) |
| RF05 notificações | `verificarPrazos` em `notificacoes.js` (no início e a cada 24 h) |
| RF06 blocos de estudo | não implementado |
| RF07 personalização visual | não implementado |
| RNF01 interface simples | navegação por menu e formulários únicos (`CrudPage.jsx`) |
| RNF02 resposta ágil | SQLite local, consultas indexadas por usuário |

Exclusões são lógicas (`excluido_em`), preservando o histórico (D8 1.3).
Contribuições seguem [CONTRIBUTING.md](CONTRIBUTING.md).
