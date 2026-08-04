// Registra (ou atualiza) os slash commands da Ágora no seu servidor Discord.
// Rode uma vez (e de novo sempre que mudar a lista de comandos):
//
//   DISCORD_BOT_TOKEN=... DISCORD_CLIENT_ID=... DISCORD_GUILD_ID=... node scripts/register-agora-commands.mjs
//
// DISCORD_CLIENT_ID é o "Application ID" (Discord Developer Portal → General Information).

const { DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_BOT_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) {
  console.error('Defina DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID e DISCORD_GUILD_ID antes de rodar.');
  process.exit(1);
}

const commands = [
  { name: 'perfil', description: 'Mostra seu grau, XP e streak na Ágora' },
  { name: 'tarefas', description: 'Lista as tarefas abertas do Quadro de Voluntários' },
  {
    name: 'enigma',
    description: 'Mostra (ou responde) o bloco ativo do Terminal ARG',
    options: [{ name: 'resposta', description: 'Sua chave de decifragem', type: 3, required: false }],
  },
  { name: 'oraculo', description: 'Consulta um oráculo da Egrégora' },
];

const res = await fetch(`https://discord.com/api/v10/applications/${DISCORD_CLIENT_ID}/guilds/${DISCORD_GUILD_ID}/commands`, {
  method: 'PUT',
  headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(commands),
});

if (!res.ok) {
  console.error(`Falha ao registrar comandos: HTTP ${res.status}`, await res.text());
  process.exit(1);
}

console.log(`✔ ${commands.length} comando(s) registrado(s): ${commands.map(c => '/' + c.name).join(', ')}`);
