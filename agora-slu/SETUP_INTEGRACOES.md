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
3b. Aba **Bot** (continuação) — ative também **Message Content Intent** se quiser a prévia de mensagens em `discord.html` (canal configurável em `DISCORD_PREVIEW_CHANNEL_ID` no `server/.env`; sem isso, o widget de membros online continua funcionando normalmente).
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
   - Redirect URLs: adicione a URL de `perfil.html` do domínio real (primeira tela após o login) e `http://localhost:...` se for testar local.

### Diagnosticando erro "Unable to exchange external code"

Se o login com Discord voltar pra tela de login com essa mensagem (visível em `login.html` desde a correção que passa a repassar erros de OAuth, ou nos **Logs → Auth Logs** do Supabase Dashboard), olhe o campo `error` do log:

- **`oauth2: "invalid_client"`** → o Client ID/Secret do Discord salvos em Authentication → Providers → Discord **não batem** com o app no Discord Developer Portal (secret foi resetado, copiado errado, etc.). Corrija: gere um novo Client Secret em OAuth2 → General no Discord Developer Portal e cole os dois valores de novo no Supabase.
- Qualquer outro erro de troca de código costuma ser o **Redirect URI** em OAuth2 → Redirects (no Discord Developer Portal) não sendo exatamente `https://fveslvzjjixzpwiqcydz.supabase.co/auth/v1/callback`.

Esse provedor Discord é compartilhado com o projeto AMOQ (mesmo Supabase) — corrigir aqui conserta o login nos dois sites.

---

## 4. Rodar a migração SQL

No **SQL Editor** do Supabase, nesta ordem:

1. `supabase/agora-migration.sql`
2. `supabase/agora-migration-v2.sql`
3. `supabase/agora-migration-v3.sql`
4. `supabase/agora-migration-v4.sql`
5. `supabase/agora-migration-v5.sql`
6. `supabase/agora-migration-v6.sql`

Todas usam `CREATE TABLE IF NOT EXISTS` (ou `ADD COLUMN IF NOT EXISTS` / `DROP POLICY IF EXISTS` + recriação) — seguro rodar mais de uma vez.

---

## 4b. Criar a conta de Administrador (`admin.html`)

O Painel Administrativo (`admin.html`) usa uma conta comum do Supabase Auth (e-mail/senha, sem passar pelo Discord/Google), só que com `agora_profiles.is_admin = true`. Não existe um jeito de criar isso via API sem a service key, então é manual:

1. **Supabase Dashboard → Authentication → Users → Add user.**
   - E-mail: o que você quiser usar para administrar o site.
   - Senha: defina uma senha forte (ou gere uma, ex: `openssl rand -base64 18`).
   - Marque **Auto Confirm User** (senão o Supabase espera confirmação por e-mail, que não vai chegar porque não configuramos SMTP customizado).
2. Copie o **UUID** do usuário recém-criado (aparece na lista de Users).
3. No **SQL Editor**, rode (depois de já ter rodado `agora-migration-v5.sql`, que cria a coluna):
   ```sql
   UPDATE public.agora_profiles SET is_admin = true WHERE id = '<uuid do usuário>';
   ```
   Se a linha em `agora_profiles` ainda não existir (o trigger só cria no primeiro login), faça login uma vez em `admin.html` com essas credenciais primeiro, e só depois rode o `UPDATE`.
4. Acesse `https://<seu-domínio>/agora-slu/admin.html` e entre com esse e-mail/senha.

Qualquer conta com `is_admin = true` também ganha o link "Painel Admin" no menu de perfil (`montarNavAuth`) em qualquer página do site, e o painel de criação de decretos em `governanca.html`.

---

## 5. Preencher config.js (obrigatório — sem isso o site não liga a nada real)

Abra `config.js` na raiz do site e edite:

```js
window.AGORA_DISCORD_GUILD_ID = '1234567890123456789'; // seu Guild ID real, entre aspas
window.AGORA_API_URL = '';                              // vazio = mesmo domínio (produção via Netlify)
```

Sem o Guild ID, `discord.html` mostra a mensagem "widget não configurado" mesmo com tudo certo no Discord/Supabase.

**Importante:** abra o site por um servidor local, não por duplo-clique no arquivo (`file://`). Navegadores bloqueiam `import` de módulos JavaScript quando a página é aberta como arquivo local, então login, dashboard e todas as páginas com dados dinâmicos ficam com a tela em branco/parcial nesse modo. Rode, na pasta `site/`:

```bash
npx http-server . -p 5500
```

e abra `http://localhost:5500/index.html`.

## 6. Ligar a API de sincronização com o Discord

### Em produção: Netlify Functions (recomendado — mesmo domínio, sem conta nova)

Se o site já é publicado via `iuripiragibe.net` (que roda no Netlify — confirmado, é o mesmo host das funções de pagamento Mercado Pago), a API da Ágora já está pronta como Netlify Functions em `netlify/functions/agora-discord-*.js`, na raiz do repositório (fora de `agora-slu/`, ao lado das outras funções existentes).

**Importante:** o Netlify já tem variáveis genéricas `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` (criadas automaticamente por uma integração Netlify↔Supabase — "Created by Supabase" no painel). Isso é de **outro projeto Supabase**, não o da Ágora. Por isso a Ágora usa nomes próprios (`AGORA_SUPABASE_URL` / `AGORA_SUPABASE_SERVICE_KEY`) — **não edite as variáveis `SUPABASE_*` existentes**, crie as novas abaixo do zero.

Cadastre em **Netlify → Site settings → Environment variables** (mesmo site das funções de pagamento):

```
AGORA_SUPABASE_URL=https://fveslvzjjixzpwiqcydz.supabase.co
AGORA_SUPABASE_SERVICE_KEY=<service role key do projeto Supabase do AMOQ/Ágora>
DISCORD_BOT_TOKEN=<token do bot>
DISCORD_GUILD_ID=<guild id>
DISCORD_ROLE_GRAU_MAP={"Conselheiro":3,"Mestre da Obra":2,"Adepto":1,"Neófito":0}
DISCORD_PREVIEW_CHANNEL_ID=<opcional>
DISCORD_ANNOUNCE_CHANNEL_ID=<opcional>
```

`AGORA_SUPABASE_SERVICE_KEY` é a **service role key** (não a anon key) do projeto `fveslvzjjixzpwiqcydz` — pegue em Supabase Dashboard → Settings → API.

**Depois de cadastrar (ou de editar) qualquer variável, um deploy novo é obrigatório** — o Netlify não aplica variáveis de ambiente em funções já publicadas até rodar um deploy depois da mudança. Use "Trigger deploy" no painel do Netlify (Deploys → Trigger deploy → Deploy site), ou faça qualquer `git push`.

Com `AGORA_API_URL` vazio em `config.js` (passo 5), tudo passa a funcionar automaticamente no mesmo domínio — sem hospedar nada separado.

### Alternativa local: `server/` (Express)

Só necessário se você quiser rodar/testar a API fora do Netlify:

```bash
cd server
npm install
cp .env.example .env
# edite .env com: SUPABASE_SERVICE_KEY, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID
npm start
```

Sobe em `http://localhost:4000`. Para usá-la, troque `window.AGORA_API_URL` em `config.js` para `'http://localhost:4000'`.

---

## 7. Bot interativo: slash commands + cargo bidirecional

Isso usa as permissões amplas que você já concedeu ao bot (Administrador). Três peças:

### 7a. Pegar a Public Key

Discord Developer Portal → sua aplicação → **General Information → Public Key** → copie.

### 7b. Cadastrar mais variáveis no Netlify

Além das do passo 6, adicione:

```
DISCORD_PUBLIC_KEY=<public key do passo 7a>
DISCORD_GRAU_ROLE_IDS={"0":"<id do cargo Neófito>","1":"<id do cargo Adepto>","2":"<id do cargo Mestre da Obra>","3":"<id do cargo Conselheiro>"}
SUPABASE_WEBHOOK_SECRET=<uma senha aleatória qualquer, só sua>
```

Para pegar o ID de um cargo: Configurações do Servidor → Cargos → clique nos "···" do cargo → Copiar ID (com Modo Desenvolvedor ativo). Se algum grau ainda não tem cargo correspondente, deixe de fora do JSON — ele simplesmente não recebe atribuição automática.

### 7c. Configurar o Interactions Endpoint URL (slash commands)

1. No Developer Portal → **General Information → Interactions Endpoint URL**, cole:
   ```
   https://iuripiragibe.net/.netlify/functions/agora-discord-interactions
   ```
2. O Discord testa a URL na hora salvando — só funciona depois que `DISCORD_PUBLIC_KEY` já estiver salvo no Netlify e um deploy novo já tiver rodado.
3. Registre os comandos (uma vez, e de novo sempre que a lista mudar):
   ```bash
   DISCORD_BOT_TOKEN=... DISCORD_CLIENT_ID=... DISCORD_GUILD_ID=... node scripts/register-agora-commands.mjs
   ```
   `DISCORD_CLIENT_ID` é o "Application ID", também em General Information.
4. Comandos disponíveis no servidor: `/perfil`, `/tarefas`, `/enigma` (com ou sem `resposta:`), `/oraculo`.

### 7d. Configurar o Webhook do Supabase (cargo sobe quando o XP sobe pelo site)

Supabase Dashboard → **Database → Webhooks → Create a new hook**:
- Table: `agora_profiles`
- Events: `UPDATE`
- Type: HTTP Request → URL: `https://iuripiragibe.net/.netlify/functions/agora-discord-role-webhook`
- HTTP Headers: `Authorization: Bearer <o mesmo SUPABASE_WEBHOOK_SECRET do passo 7b>`

A partir daí, sempre que alguém sobe de grau resolvendo um enigma, entregando uma tarefa ou concluindo uma missão, o cargo real no Discord é atualizado sozinho.

---

## 8. Pagamento real do Ritual de Iniciação (pendente)

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
- [ ] `agora-migration.sql`, `v2`, `v3`, `v4`, `v5` e `v6` executadas no Supabase
- [ ] Conta de administrador criada em Authentication → Users + `is_admin = true` (ver §4b)
- [ ] `config.js` preenchido com `AGORA_DISCORD_GUILD_ID` real
- [ ] Site aberto via servidor local/produção (nunca por duplo-clique/`file://`)
- [ ] Variáveis de ambiente cadastradas no Netlify (Site settings → Environment variables)
- [ ] Novo deploy disparado no Netlify após cadastrar as variáveis
- [ ] `DISCORD_PUBLIC_KEY` cadastrada e Interactions Endpoint URL salva com sucesso
- [ ] Slash commands registrados (`node scripts/register-agora-commands.mjs`)
- [ ] `DISCORD_GRAU_ROLE_IDS` preenchido com os IDs reais dos cargos
- [ ] Webhook do Supabase (`agora_profiles` → UPDATE) configurado com o `SUPABASE_WEBHOOK_SECRET`
