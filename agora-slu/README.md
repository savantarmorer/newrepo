# Ágora (SLU) — Site & Plataforma da Egrégora

Site funcional da comunidade Ágora: landing page, autenticação real (Discord/Google via Supabase), gamificação com XP e graus, sincronização de cargos do Discord, Terminal ARG com puzzles reais, governança com votação real, Clube do Livro, Eventos, Calendário com exportação `.ics`, Cofre de Evidências colaborativo, Códice vivo e Hall das Lendas.

Não é um mock. Cada tela lê e escreve em tabelas reais no Supabase (mesmo projeto usado pelo AMOQ, `fveslvzjjixzpwiqcydz`) e, onde é preciso um segredo (token de bot do Discord, chave de serviço), a operação passa pela API Node em `server/` — nunca pelo navegador.

---

## Como rodar

1. **Front-end**: é HTML estático. Basta abrir `index.html` num servidor local (ex: `npx http-server .` ou a extensão Live Server) — não precisa de build.
2. **Banco de dados**: rode `supabase/agora-migration.sql` e depois `supabase/agora-migration-v2.sql` no SQL Editor do Supabase.
3. **Login social (Discord/Google) e sincronização de cargos**: exigem credenciais externas — siga [SETUP_INTEGRACOES.md](SETUP_INTEGRACOES.md) do início ao fim.
4. **API de sincronização com o Discord**: `cd server && npm install && npm start` (ver `server/.env.example`).

Sem os passos 2-4, a navegação funciona mas login/gamificação ficam bloqueados — é intencional: nenhuma credencial de terceiros foi inventada.

---

## Mapa do site

| Página | O que faz de verdade |
|---|---|
| `index.html` | Landing page, hero, prova viva (estática — copy institucional) |
| `login.html` | Login real via Supabase Auth (Discord + Google OAuth) |
| `perfil.html` | Primeira tela após o login — dados de conta, provedores vinculados, sync de cargos do Discord |
| `dashboard.html` | XP, grau, streak, missões com XP real, Hall das Lendas real |
| `governanca.html` | Decretos reais, um voto por usuário (RPC `votar_decreto`), apuração agregada real; painel para admins abrirem/encerrarem decretos |
| `investigacoes.html` | Investigação coletiva de arquivos/documentos + diário de bordo colaborativo (qualquer membro pode adicionar um item ou registrar uma análise) |
| `provida.html` | Ficha de Análise — Material Pró-Vida (formulário estruturado completo); envio concede XP real |
| `codex.html` | Verbetes reais + notas de margem escritas pelos membros |
| `eventos.html` | Eventos reais por fase + RSVP |
| `calendario.html` | Chamadas reais + exportação `.ics` para qualquer calendário |
| `discord.html` | Widget oficial + canais reais (categorias/nomes) + prévia real de mensagens de um canal público (polling 20s) |
| `tarefas.html` | Quadro de tarefas dos voluntários — reivindicar/concluir com XP real |
| `admin.html` | Painel administrativo (login e-mail/senha próprio) — CRUD real sobre Missões, Eventos, Calendário, Hall, Códice, Investigações, Tarefas e Associações |
| `checkout.html` | Registra o pedido de associação de verdade no banco — não processa pagamento (ver limitação abaixo) |

## O que é genuinamente ilustrativo (e por quê)

- **`index.html`** (copy institucional, números de "prova viva"): página de marketing — números de vaidade são normais aqui, como em qualquer landing page.
- **`discord.html`**: canais, membros online e mensagens agora vêm todos de dados reais via `server/`. A única limitação é que a prévia de mensagens usa polling a cada 20s (REST), não um WebSocket em tempo real — ver `ROADMAP.md`.
- **Pagamento no `checkout.html`**: nenhum agente automatizado deve mover dinheiro em nome do usuário. O pedido é gravado de verdade; a cobrança (PIX/cartão) é manual até que um gateway de pagamento seja integrado (ver `SETUP_INTEGRACOES.md` §6).

---

## Documentos relacionados

- [SISTEMAS.md](SISTEMAS.md) — arquitetura técnica, modelo de dados, cada sistema em detalhe.
- [ROADMAP.md](ROADMAP.md) — o que existe, o que falta, funcionalidades sugeridas.
- [SETUP_INTEGRACOES.md](SETUP_INTEGRACOES.md) — runbook de credenciais (Discord, Google, Supabase).
