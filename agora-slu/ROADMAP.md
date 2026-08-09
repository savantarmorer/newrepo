# Roadmap — Ágora (SLU)

Para arquitetura/modelo de dados, ver [SISTEMAS.md](SISTEMAS.md). Para credenciais pendentes, ver [SETUP_INTEGRACOES.md](SETUP_INTEGRACOES.md).

---

## ✅ Concluído (funcional, não-mock)

- Design System Cultus completo (tokens, 6 selos SVG dos Daemons, 10 interfaces do wireframe original)
- Autenticação real (Discord + Google via Supabase Auth)
- Sistema de graus/XP real (4 graus, RPCs seguras, sem forjamento client-side)
- Streak diário de login
- Sincronização real de cargos/apelido/entrada do Discord (API Node dedicada)
- Widget ao vivo do servidor Discord embutido
- Governança com decretos e votos reais (um voto por pessoa, apuração agregada) + **painel administrativo** para abrir/encerrar decretos (`is_admin`)
- Investigação Coletiva de Arquivos (`investigacoes.html`, antes "Cofre de Evidências ARG") com diário de bordo colaborativo real e cadastro aberto a qualquer membro
- **Ficha de Análise Pró-Vida** (`provida.html`): formulário estruturado completo, submissão concede XP real
- **Página de Perfil** (`perfil.html`): primeira tela após o login — dados de conta, provedores vinculados e sincronização com o Discord (antes só existia dentro do Dashboard)
- **Painel Administrativo real** (`admin.html`): login próprio (e-mail/senha, fora do fluxo social), CRUD completo sobre Missões, Eventos, Calendário, Hall das Lendas, Códice, Investigações, Tarefas e Associações, sem precisar do Supabase Table Editor — controle de permissão via RLS (`is_admin_user()`), não por RPC individual
- **Poda de páginas de baixo valor**: removidas `mobile.html` (protótipo estático), `grafo.html` (decorativo, sem ação real) e `clube-do-livro.html` — menos superfície pra manter, menos gente se perdendo em página vazia
- Códice Caelestis dinâmico (verbetes + notas de margem reais)
- Missões auto-reportadas com XP real
- Hall das Lendas com fluxo de aprovação (pendente → aprovado)
- Eventos e Calendário com RSVP real (Clube do Livro removido junto com `clube-do-livro.html` — ver poda de páginas)
- Exportação `.ics` real (sem backend) no Calendário
- Registro real de pedidos de associação (Ritual de Iniciação)
- **Canais reais do servidor** na barra lateral de `discord.html` (categorias e nomes de verdade, com deep-link para abrir cada canal no Discord)
- **Prévia real de mensagens** de um canal público, via polling a cada 20s (API do bot lê `GET /channels/{id}/messages`)
- **Sincronização automática de eventos do Discord** (Scheduled Events → tabela `agora_discord_events`, sem ação manual — roda ao subir o server e a cada N minutos)
- **Estatísticas reais na landing page**: análises registradas (Investigações + Fichas Pró-Vida) e membros online (widget público do Discord) substituíram números fictícios
- **API em produção via Netlify Functions**: mesma API do server/ Express reescrita como funções Netlify, no mesmo domínio do site — zero hospedagem separada, zero conta nova
- **Quadro de Tarefas dos Voluntários** (`tarefas.html`): espelha o `#quadro-de-tarefas` real do Discord — reivindicar, entregar e ganhar XP real, com trava atômica contra dois iniciados pegando a mesma tarefa
- **Anúncios automáticos site → Discord**: quando alguém sobe de grau via sincronização, o bot posta um anúncio cerimonial no canal configurado (fecha o ciclo que antes só ia Discord → site)
- **Menu de perfil com logout** acessível em qualquer página (antes só existia no Dashboard)
- **Bot interativo real (slash commands)**: `/perfil`, `/tarefas`, `/enigma` (com resposta) e `/oraculo`, respondendo direto no Discord via Interactions Endpoint verificado por assinatura Ed25519 — sem precisar de conexão de Gateway persistente
- **Cargo do Discord sobe sozinho quando o XP sobe pelo site**: webhook do Supabase (`agora_profiles` UPDATE) → Netlify Function atribui o cargo real via `PUT /guilds/{id}/members/{id}/roles/{id}` — fecha de vez o ciclo bidirecional site ↔ Discord
- **XP em Eventos, Calendário e Códice**: RSVP e notas de margem passam a conceder XP real via gatilho (idempotente por `agora_xp_ledger`), com concessão retroativa pra quem já tinha RSVP/notas antes da migração
- **Pró-Vida ↔ Investigações unificados**: enviar uma Ficha Pró-Vida cria/vincula automaticamente o item correspondente em Investigações pelo mesmo código — deixaram de ser listas paralelas
- **Onboarding guiado no Perfil**: checklist de primeiros passos (sincronizar Discord, votar, investigar, reivindicar tarefa) que some sozinho quando o membro já completou tudo
- **Atividade Recente da Egrégora**: feed no Painel alimentado pelo mesmo ledger de XP — mostra quem fez o quê, em tempo real
- **Busca global** (`busca.html`): Investigações + Fichas Pró-Vida + Códice numa busca só, com deep link pro item exato
- **Notificações in-app**: sino no menu — decreto novo aberto (broadcast) e ficha Pró-Vida removida pela moderação (direcionada)
- **Mensagens de erro amigáveis**: páginas voltadas a membros comuns não mostram mais erro cru do Postgres; painel admin continua com erro técnico (público certo pra isso)
- **Novo Æon** (`novo-aeon.html`): braço de ensino da Ágora, acessível por botão dedicado no Painel — texto de abertura + formulário de ingresso, moderado no `admin.html`
- **PWA instalável**: `manifest.json` + `sw.js` (cache do app shell, nunca intercepta chamadas de API) em todas as páginas

---

## 🔜 Curto Prazo — depende só de credenciais (sem código novo)

1. **Ativar o login de verdade**: criar app Discord + OAuth client Google, colar no Supabase (`SETUP_INTEGRACOES.md` §1-3).
2. **Subir a API do bot**: `server/` rodando em algum host Node (Railway/Render/Fly.io/VPS).
3. **Rodar as migrações** no Supabase (`agora-migration.sql` + `agora-migration-v2.sql`).

## 🛠️ Curto Prazo — pequenas features

- **Painel de curadoria**: tela simples (ou uso direto do Supabase Table Editor) para aprovar `agora_hall_entries` pendentes e cadastrar novos `agora_events`/`agora_calls`/`agora_arg_puzzles` sem editar SQL manualmente.
- **Notificação de novo decreto/evento**: e-mail transacional (Supabase tem integração com Resend/Postmark) quando um novo decreto abre.
- **Avatar upload / perfil editável**: hoje o avatar vem só do provedor OAuth.
- **Paginação** nas listas (Eventos, Códice, Hall) quando o volume crescer além de uma tela.

## 📈 Médio Prazo — funcionalidades sugeridas

- **Sistema de convites/referral**: cada membro gera um link; quem entra por ele credita Éter Alquímico (§) ao padrinho — mecânica já descrita no `PLANO_GROWTH_365D_SLU.md`, ainda não implementada.
- **Leaderboard semanal**: ranking de XP ganho na semana (não XP total, para não cristalizar hierarquia permanente) — incentiva engajamento contínuo.
- **Busca global**: um único campo que pesquisa Códice + Hall das Lendas + Evidências ao mesmo tempo (hoje cada um tem busca própria isolada).
- **Central de notificações in-app**: sino no header, com histórico (novo decreto, resposta na sua nota do Códice, etc.) — hoje o usuário só descobre novidades visitando cada página.
- **Sincronização bidirecional com o Discord**: quando o grau sobe no site, o bot atribui automaticamente o cargo correspondente no servidor (hoje a sincronização só lê do Discord; escrever cargos exige permissão adicional do bot — `MANAGE_ROLES` — e cuidado para não sobrepor cargos manuais).
- **Badge Wall dedicada**: página própria de conquistas (hoje os selos aparecem só no Dashboard) com selos extras por marcos (primeira nota no Códice, primeira evidência, etc.).
- **Chat em tempo real de verdade**: o feed de mensagens de `discord.html` hoje faz polling a cada 20s via REST. Migrar para o bot manter uma conexão de Gateway persistente e empurrar mensagens novas via WebSocket/SSE elimina o atraso e o custo de polling — exige o server rodar como processo de longa duração com `discord.js` (hoje ele só faz chamadas REST pontuais).
- **Presença em canais de voz**: mostrar quem está em call agora (a Guild Members API + Gateway `VOICE_STATE_UPDATE` permite isso) — reforça a sensação de comunidade viva em `discord.html`.
- **Mais anúncios automáticos**: hoje só a subida de grau posta no Discord; estender para Ritual de Iniciação concluído, Decreto aprovado e tarefa do Quadro concluída.
- **Aprovação com curadoria no Quadro de Tarefas**: hoje a entrega já credita XP imediatamente (confiança, igual às Missões). Uma versão com revisão de um Curador antes do XP cair é o próximo passo natural se o volume de tarefas crescer.
- **Auto-criação de perfil ao entrar no servidor**: hoje o `agora_profiles` só existe depois do primeiro login no site. Um bot com conexão de Gateway pode escutar `GUILD_MEMBER_ADD` e criar o registro no instante em que a pessoa entra no Discord, mesmo antes de visitar o site.
- **Aproveitar o restante das permissões do bot** (já concedidas: Criar enquetes, Criar eventos, Fixar mensagens, Ver análises do servidor):
  - `/decreto` como enquete nativa do Discord ao abrir uma votação (`POST /channels/{id}/polls`), além da votação no site.
  - Criar automaticamente o Scheduled Event do Discord quando um Curador cadastra um evento no site pelo `admin.html` (hoje a sincronização só vai Discord → site).
  - Fixar a mensagem de anúncio de decreto/grau no canal configurado.
  - **Moderação (Moderar membros) foi propositalmente deixada de fora**: kick/ban/timeout são ações consequentes sobre pessoas reais — nenhuma automação deste sistema deve executá-las sem um humano decidindo caso a caso.

## 🌐 Longo Prazo — infraestrutura maior

- **Gateway de pagamento real** (Mercado Pago ou Stripe) para automatizar a cobrança do Ritual de Iniciação — exige conta comercial do usuário; ver `SETUP_INTEGRACOES.md` §6.
- **Push notifications de verdade no PWA**: `manifest.json`/`sw.js` já cobrem instalação e app shell; falta a API de Push (exige um servidor de push + permissão do usuário) para notificar fora do navegador aberto.
- **Painel administrativo — próxima camada**: `admin.html` já cobre CRUD de conteúdo (missões, eventos, hall, códice, investigações, tarefas, associações, Novo Æon); falta controle de layout/CSS/blocos visuais, que é um projeto à parte (motor de templates data-driven, não HTML estático).
- **Testes automatizados — próxima camada**: `tests/agora-slu-smoke.spec.ts` cobre carregamento/gate de autenticação/estrutura; falta cobrir fluxos que exigem sessão real (login social não dá pra automatizar sem credenciais de teste dedicadas — RSVP, votação, envio de ficha logado).
- **Internacionalização**: se a Ágora expandir para o mundo lusófono internacional (Lei das Fronteiras do Manual de Marca já autoriza), preparar strings para PT-PT além de PT-BR.
- **Rate limiting e observabilidade na API**: `server/` hoje não tem limite de requisições nem logging estruturado — importante antes de expor a API publicamente em produção com tráfego real.

---

## Decisões deliberadamente adiadas

- **Login com Instagram**: tecnicamente inviável sem conta Meta Business + app review (semanas de processo). Recomendação vigente: Discord + Google cobrem o público-alvo.
- **Captura automática de pagamento**: por política de segurança, nenhuma automação deste sistema movimenta dinheiro sem um humano confirmando cada cobrança — mesmo depois de integrar um gateway, a recomendação é manter confirmação manual do Curador antes de qualquer captura.
