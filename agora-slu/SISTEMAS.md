# Sistemas — Ágora (SLU)

Documentação técnica de arquitetura e modelo de dados. Para o runbook de credenciais, ver [SETUP_INTEGRACOES.md](SETUP_INTEGRACOES.md). Para visão geral, ver [README.md](README.md).

---

## 1. Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────────┐
│  NAVEGADOR (HTML estático, sem build/framework)                     │
│                                                                       │
│  index.html, login.html, dashboard.html, terminal.html,             │
│  governanca.html, evidencias.html, codex.html, clube-do-livro.html, │
│  eventos.html, calendario.html, grafo.html, discord.html,           │
│  mobile.html, checkout.html                                         │
│                                                                       │
│  js/agoraAuth.js  ──►  @supabase/supabase-js (CDN)                 │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ HTTPS (anon key — seguro expor)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SUPABASE (projeto compartilhado com o AMOQ)                        │
│  • Auth (Discord + Google OAuth)                                    │
│  • Postgres (tabelas agora_*)                                       │
│  • Row Level Security em toda tabela                                │
│  • Funções RPC SECURITY DEFINER (lógica sensível: puzzles, votos)   │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ REST (service role key — nunca no navegador)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  server/ (Node/Express — único componente que precisa rodar)        │
│  • POST /api/discord/sync                                           │
│  • Segura: DISCORD_BOT_TOKEN, SUPABASE_SERVICE_KEY                  │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ Bot API (Authorization: Bot <token>)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DISCORD (servidor real da Ágora)                                   │
│  • Guild Members API (cargos, apelido, data de entrada)             │
│  • Server Widget (embutido em discord.html)                         │
│  • OAuth2 (login social, gerenciado pelo Supabase)                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Princípio de segurança:** qualquer segredo (token de bot, service role key, futura chave de gateway de pagamento) fica exclusivamente em `server/.env`, nunca em HTML/JS servido ao navegador. O navegador só conhece a `anon key` do Supabase, que é pública por design (protegida por Row Level Security).

---

## 2. Autenticação (`js/agoraAuth.js`)

- Login via Supabase Auth, provedores **Discord** e **Google** (OAuth redirect flow padrão do Supabase — `signInWithOAuth`).
- Sessão mantida pelo `supabase-js` (localStorage), lida em toda página via `getSession()`.
- `requireAuth()` redireciona para `login.html?next=<pagina>` quando não há sessão.
- `montarNavAuth()` preenche o slot `#navAuthSlot` da barra de navegação com "Entrar" ou "Grau · XP" dependendo do estado — chamado em todas as 14 páginas.

## 3. Gamificação — XP e Graus

Escala fixa (mesma no client `GRAUS` e no Postgres `calcular_grau_agora`):

| Grau | Nome | XP mínimo |
|---|---|---|
| 0 | Neófito | 0 |
| 1 | Adepto | 100 |
| 2 | Mestre da Obra | 500 |
| 3 | Conselheiro | 2000 |

XP é concedido **exclusivamente** por funções `SECURITY DEFINER` no Postgres (nunca calculado/gravado direto pelo cliente):
- `resolver_puzzle_arg` — Terminal ARG, idempotente (não paga XP duas vezes pelo mesmo puzzle).
- `concluir_missao` — Missões do Dashboard, idempotente.

Isso impede que um usuário forje XP manipulando chamadas REST diretamente — a tabela `agora_profiles` não tem policy de `UPDATE` para `xp`/`grau` vinda do cliente; só as RPCs (que rodam como dono da tabela) escrevem ali.

Streak diário: `registrar_login_agora(uid)`, chamada em `login.html` e no `dashboard.html` a cada sessão — incrementa se o último login foi ontem, reseta se houve lacuna.

## 4. Sincronização com o Discord

1. Usuário faz login via Discord no Supabase → a identidade OAuth (incluindo `provider_id` = ID do Discord) fica em `auth.users.identities`.
2. No Dashboard, o botão "Sincronizar Agora" chama `POST /api/discord/sync` (em `server/`) com o token de sessão do Supabase.
3. O servidor:
   - valida o token contra `/auth/v1/user`;
   - extrai o `discord_id` da identidade vinculada;
   - consulta a **Guild Members API** do Discord com o token do bot (`GET /guilds/{guild}/members/{id}`);
   - resolve nomes de cargos via `GET /guilds/{guild}/roles` (cache de 5 min em memória);
   - grava em `agora_discord_sync` (upsert, service role — ignora RLS);
   - se os cargos do Discord mapeiam para um grau maior que o atual (`DISCORD_ROLE_GRAU_MAP`), eleva `agora_profiles.grau`.
4. O Dashboard exibe apelido, avatar, data de entrada e cargos reais.

**Por que precisa de um servidor:** a Guild Members API exige o token do bot, que nunca pode chegar ao navegador. É o único ponto do sistema que não pode ser 100% estático.

### 4.1 Canais reais (`GET /api/discord/channels`)

Rota pública (sem autenticação — só nomes de canais, não é dado sensível). Busca `GET /guilds/{id}/channels` e `GET /guilds/{id}/roles`, filtra canais onde o cargo `@everyone` tem `VIEW_CHANNEL` negado (não expõe canais privados), agrupa por categoria e devolve para `discord.html` montar a barra lateral de verdade. Cada canal linka para `https://discord.com/channels/{guild}/{canal}` (abre no Discord real).

### 4.2 Prévia de mensagens (`GET /api/discord/messages`)

Rota pública, com cache de 20s. Lê as últimas mensagens de **um único canal público configurado** via `DISCORD_PREVIEW_CHANNEL_ID` (`GET /channels/{id}/messages`). Requer a **Message Content Intent** ativada no bot (Discord Developer Portal → Bot). `discord.html` faz polling desta rota a cada 20s — não é um WebSocket em tempo real (ver Roadmap), mas é dado real, não simulado. Se `DISCORD_PREVIEW_CHANNEL_ID` não estiver definido, a rota responde `{configured: false}` e a UI explica isso claramente em vez de mostrar uma área vazia.

### 4.3 Sincronização automática de eventos (Scheduled Events)

`syncDiscordEvents()` roda **ao subir o server** e depois a cada `DISCORD_EVENTS_SYNC_MINUTES` (padrão 10min) via `setInterval` — sem precisar de ação do usuário. Busca `GET /guilds/{id}/scheduled-events` e faz upsert em `agora_discord_events` (chave única `discord_event_id`). `eventos.html` e `mobile.html` mesclam esses eventos com os cadastrados manualmente em `agora_events`, ordenando tudo por data.

## 5. Terminal ARG

- Puzzles ficam em `agora_arg_puzzles` (pergunta pública).
- A resposta correta fica em `agora_arg_answers`, tabela com RLS **sem nenhuma policy** — inacessível via API REST para qualquer role exceto o dono (a função RPC).
- `resolver_puzzle_arg(uid, puzzle_id, resposta)` compara `sha256(upper(trim(resposta)))` contra o hash guardado; se bater, registra a resolução em `agora_arg_solves` (única por usuário+puzzle) e credita XP.
- Progresso coletivo (`obter_progresso_arg`) retorna contagem agregada de resoluções por bloco — sem expor quem resolveu.

## 6. Governança

- `agora_decrees`: decretos com prazo (`fecha_em`) e status.
- `agora_decree_votes`: um voto por usuário por decreto (`UNIQUE(decree_id, user_id)`), editável enquanto o decreto estiver aberto.
- `votar_decreto(uid, decree_id, escolha)`: valida prazo/status, faz upsert do voto.
- `obter_tally_decreto(decree_id)`: apuração agregada (sim/não/abster), sem expor votos individuais a outros membros.

## 7. Cofre de Evidências

- `agora_arg_evidence`: evidências cadastradas (status: decifrado/em_analise/confirmado).
- `agora_evidence_notes`: diário de bordo colaborativo — qualquer membro autenticado registra uma análise (insert-only, leitura pública entre membros).

## 8. Códice Caelestis

- `agora_codex_entries`: capítulos e verbetes (conteúdo real, curado).
- `agora_codex_notes`: notas de margem — qualquer membro pode anotar; leitura pública.
- Busca client-side simples (filtro por texto no título da lista lateral).

## 9. Hall das Lendas & Missões

- `agora_hall_entries`: contribuições da comunidade. Insert cria com `status='pendente'`; só aparece publicamente após um Curador aprovar (via Supabase Dashboard ou um futuro painel admin — ver Roadmap).
- `agora_missions` / `agora_mission_completions`: lista fixa de missões com XP; conclusão é **auto-reportada** (`concluir_missao`), consistente com a economia de confiança descrita nos documentos de marca (Éter Alquímico).

## 10. Clube do Livro, Eventos, Calendário

- Todas as três seguem o mesmo padrão: tabela de itens (leitura pública para autenticados) + tabela de RSVP (`UNIQUE(item_id, user_id)`, cada membro só vê/gerencia o próprio RSVP).
- `calendario.html` adicionalmente gera arquivos `.ics` **100% client-side** (sem backend) — compatível com Google Calendar, Apple Calendar, Outlook.

## 11. Checkout / Ritual de Iniciação

- Grava um registro real em `agora_membership_requests` (nome, e-mail, tier, método de pagamento, status `pendente`).
- **Não captura pagamento.** Nenhuma automação move dinheiro em nome do usuário. Integração com um gateway real (Mercado Pago/Stripe) é um passo futuro que exige conta comercial do usuário — ver `SETUP_INTEGRACOES.md` §6 e `ROADMAP.md`.

---

## 12. Modelo de Dados (tabelas `agora_*`)

| Tabela | Papel |
|---|---|
| `agora_profiles` | XP, grau, streak — 1:1 com `auth.users` |
| `agora_discord_sync` | Cópia local dos dados do Discord (cargos, apelido, entrada) |
| `agora_arg_puzzles` / `agora_arg_answers` / `agora_arg_solves` | Terminal ARG |
| `agora_decrees` / `agora_decree_votes` | Governança |
| `agora_arg_evidence` / `agora_evidence_notes` | Cofre de Evidências |
| `agora_missions` / `agora_mission_completions` | Missões do Dashboard |
| `agora_hall_entries` | Hall das Lendas |
| `agora_codex_entries` / `agora_codex_notes` | Códice Caelestis |
| `agora_book_club_sessions` / `agora_book_club_rsvps` | Clube do Livro |
| `agora_events` / `agora_event_rsvps` | Eventos |
| `agora_calls` / `agora_call_rsvps` | Calendário de Chamadas |
| `agora_membership_requests` | Pedidos de associação (Ritual de Iniciação) |
| `agora_discord_events` / `agora_discord_event_rsvps` | Eventos sincronizados automaticamente do Discord (Scheduled Events) |

Todas com Row Level Security ativado; políticas específicas documentadas nos comentários de `supabase/agora-migration.sql` e `supabase/agora-migration-v2.sql`.

## 13. Convenção de nomes

O universo narrativo da Ágora usa **Æon** (não "AMOQ") para a ordem/sociedade fictícia dentro do site e do banco de dados — "AMOQ" nos comentários de código refere-se exclusivamente ao projeto irmão real (`C:\Users\iuri\Discord`), que compartilha o mesmo projeto Supabase.
