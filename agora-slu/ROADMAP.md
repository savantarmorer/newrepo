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
- Terminal ARG com puzzles reais (resposta protegida por hash, nunca exposta ao cliente)
- Governança com decretos e votos reais (um voto por pessoa, apuração agregada)
- Cofre de Evidências com diário de bordo colaborativo real
- Códice Caelestis dinâmico (verbetes + notas de margem reais)
- Missões auto-reportadas com XP real
- Hall das Lendas com fluxo de aprovação (pendente → aprovado)
- Clube do Livro, Eventos e Calendário com RSVP real
- Exportação `.ics` real (sem backend) no Calendário
- Grafo de Conhecimento com estatísticas agregadas reais do banco
- Feed mobile com dados reais (próximo decreto/evento/sessão)
- Registro real de pedidos de associação (Ritual de Iniciação)

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

## 🌐 Longo Prazo — infraestrutura maior

- **Gateway de pagamento real** (Mercado Pago ou Stripe) para automatizar a cobrança do Ritual de Iniciação — exige conta comercial do usuário; ver `SETUP_INTEGRACOES.md` §6.
- **App mobile nativo ou PWA instalável**: `mobile.html` hoje é uma prévia num frame de navegador; virar PWA de verdade dá push notifications e ícone na tela inicial.
- **Painel administrativo completo**: dashboard para Curadores/Guardiões gerenciarem missões, puzzles ARG, decretos e moderação sem tocar em SQL.
- **Testes automatizados**: hoje a verificação é manual no navegador; vale Playwright cobrindo os fluxos críticos (login, RSVP, votação, terminal ARG).
- **Internacionalização**: se a Ágora expandir para o mundo lusófono internacional (Lei das Fronteiras do Manual de Marca já autoriza), preparar strings para PT-PT além de PT-BR.

---

## Decisões deliberadamente adiadas

- **Login com Instagram**: tecnicamente inviável sem conta Meta Business + app review (semanas de processo). Recomendação vigente: Discord + Google cobrem o público-alvo.
- **Captura automática de pagamento**: por política de segurança, nenhuma automação deste sistema movimenta dinheiro sem um humano confirmando cada cobrança — mesmo depois de integrar um gateway, a recomendação é manter confirmação manual do Curador antes de qualquer captura.
