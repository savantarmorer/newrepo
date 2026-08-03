# Setup de Integrações — Ágora (SLU)

Runbook operacional para ligar as integrações reais do site. Sem estes passos, login com Discord/Google, a sincronização de cargos e o widget do servidor **não funcionam** — o front-end está pronto, mas depende de credenciais que só você pode gerar nos consoles abaixo.

---

## 1. Discord Developer Portal — Aplicação + Bot

1. Acesse https://discord.com/developers/applications → **New Application** → nomeie "Ágora".
2. Aba **OAuth2 → General**:
   - Copie **Client ID** e **Client Secret** (vão para o Supabase, passo 3).
   - Em **Redirects**, adicione:
     ```
     https://fveslvzjjixzpwiqcydz.supabase.co/auth/v1/callback
     ```
3. Aba **Bot**:
   - **Add Bot**.
   - Em **Privileged Gateway Intents**, ative **Server Members Intent** (obrigatório — é o que permite ler cargos/data de entrada dos membros).
   - Copie o **Token do Bot** (aparece uma vez só — se perder, "Reset Token").
4. Aba **OAuth2 → URL Generator**:
   - Scopes: `bot`.
   - Bot Permissions: `View Channels`, `Read Message History` (mínimo necessário para o bot existir no servidor; a leitura de membros usa a Intent, não permissões de canal).
   - Copie a URL gerada, abra-a e convide o bot para o servidor **Ágora**.
5. Pegue o **Guild ID** (ID do servidor):
   - No Discord, ative o Modo Desenvolvedor (Configurações → Avançado → Modo Desenvolvedor).
   - Clique com o botão direito no servidor Ágora → **Copiar ID do Servidor**.
6. Ative o **Widget do Servidor** (usado em `discord.html`):
   - Configurações do Servidor → Widget → **Ativar Widget do Servidor**.

Guarde: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`.

---

## 2. Google Cloud Console — OAuth Client

1. https://console.cloud.google.com/apis/credentials → **Create Credentials → OAuth client ID**.
2. Tipo: **Web application**.
3. **Authorized redirect URIs**:
   ```
   https://fveslvzjjixzpwiqcydz.supabase.co/auth/v1/callback
   ```
4. Copie **Client ID** e **Client Secret**.

---

## 3. Supabase Dashboard — Providers de Auth

Projeto: `fveslvzjjixzpwiqcydz` (mesmo projeto usado pelo AMOQ).

1. **Authentication → Providers → Discord**: ative, cole Client ID/Secret do passo 1.
2. **Authentication → Providers → Google**: ative, cole Client ID/Secret do passo 2.
3. **Authentication → URL Configuration**:
   - Site URL: o domínio real onde o site da Ágora vai ficar publicado.
   - Redirect URLs: adicione a URL de `dashboard.html` do domínio real (e `http://localhost:...` se for testar local).

---

## 4. Rodar a migração SQL

No **SQL Editor** do Supabase, nesta ordem:

1. `supabase/agora-migration.sql`
2. `supabase/agora-migration-v2.sql`

Ambas usam `CREATE TABLE IF NOT EXISTS` — seguro rodar mais de uma vez.

---

## 5. Preencher config.js (obrigatório — sem isso o site não liga a nada real)

Abra `config.js` na raiz do site e edite:

```js
window.AGORA_DISCORD_GUILD_ID = '1234567890123456789'; // seu Guild ID real, entre aspas
window.AGORA_API_URL = 'http://localhost:4000';        // ou a URL pública da API em produção
```

Sem isso, `discord.html` mostra a mensagem "widget não configurado" mesmo com tudo certo no Discord/Supabase — é o arquivo que liga a configuração externa ao front-end estático.

**Importante:** abra o site por um servidor local, não por duplo-clique no arquivo (`file://`). Navegadores bloqueiam `import` de módulos JavaScript quando a página é aberta como arquivo local, então login, dashboard e todas as páginas com dados dinâmicos ficam com a tela em branco/parcial nesse modo. Rode, na pasta `site/`:

```bash
npx http-server . -p 5500
```

e abra `http://localhost:5500/index.html`.

## 6. Subir a API de sincronização com o Discord

```bash
cd server
npm install
cp .env.example .env
# edite .env com: SUPABASE_SERVICE_KEY, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID
npm start
```

A API sobe em `http://localhost:4000` (ajustável via `PORT`). Ela é a **única** peça que precisa rodar em um servidor (Node) — o resto do site é HTML estático que fala direto com o Supabase.

Em produção, hospede este `server/` em qualquer runtime Node (Railway, Render, Fly.io, VPS) e atualize `window.AGORA_API_URL` em `config.js` (passo 5) para essa URL pública.

---

## 7. Pagamento real do Ritual de Iniciação (pendente)

O `checkout.html` hoje grava o **pedido de associação** de verdade no Supabase (tabela `agora_membership_requests`), mas **não processa pagamento** — nenhum agente automatizado deve mover dinheiro em seu nome. Para captura real de PIX/cartão, escolha um gateway (Mercado Pago, Stripe, PagSeguro) e crie a conta comercial; a partir daí eu integro o checkout com a API do gateway. Sem essa conta, o fluxo permanece "pedido registrado → Curador cobra manualmente", que é funcional e real, só não é automático.

---

## Checklist rápido

- [ ] Aplicação Discord criada, Client ID/Secret anotados
- [ ] Bot criado, Server Members Intent ativada, token anotado
- [ ] Bot convidado ao servidor Ágora
- [ ] Guild ID copiado
- [ ] Widget do servidor ativado
- [ ] OAuth Client do Google criado
- [ ] Discord + Google ativados no Supabase Auth
- [ ] `agora-migration.sql` e `agora-migration-v2.sql` executados
- [ ] `config.js` preenchido com `AGORA_DISCORD_GUILD_ID` real
- [ ] Site aberto via servidor local/produção (nunca por duplo-clique/`file://`)
- [ ] `server/.env` preenchido e `npm start` rodando
- [ ] `AGORA_API_URL` (em `config.js`) apontando para a API em produção
