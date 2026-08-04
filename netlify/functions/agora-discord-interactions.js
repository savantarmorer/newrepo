// Endpoint de Interações do Discord (slash commands). Configure a URL desta
// função em Discord Developer Portal → General Information → Interactions
// Endpoint URL. Ver scripts/register-agora-commands.mjs para registrar os
// comandos e SETUP_INTEGRACOES.md para o passo a passo completo.
import crypto from 'node:crypto';
import { ENV, supaFetch, discordGet, resolverPuzzleServerSide } from './_agoraShared.js';

const InteractionType = { PING: 1, APPLICATION_COMMAND: 2 };
const InteractionResponseType = { PONG: 1, CHANNEL_MESSAGE_WITH_SOURCE: 4 };
const EPHEMERAL = 64;

function verifySignature(rawBody, signature, timestamp) {
  if (!ENV.DISCORD_PUBLIC_KEY || !signature || !timestamp) return false;
  try {
    const derPrefix = Buffer.from('302a300506032b6570032100', 'hex');
    const rawKey = Buffer.from(ENV.DISCORD_PUBLIC_KEY, 'hex');
    const publicKey = crypto.createPublicKey({ key: Buffer.concat([derPrefix, rawKey]), format: 'der', type: 'spki' });
    const message = Buffer.from(timestamp + rawBody, 'utf8');
    return crypto.verify(null, message, publicKey, Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

function reply(content, ephemeral = true) {
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { content, flags: ephemeral ? EPHEMERAL : 0 } }) };
}

export async function handler(event) {
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : (event.body || '');
  const signature = event.headers['x-signature-ed25519'];
  const timestamp = event.headers['x-signature-timestamp'];

  if (!verifySignature(rawBody, signature, timestamp)) {
    return { statusCode: 401, body: 'invalid request signature' };
  }

  const interaction = JSON.parse(rawBody);

  if (interaction.type === InteractionType.PING) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: InteractionResponseType.PONG }) };
  }

  if (interaction.type !== InteractionType.APPLICATION_COMMAND) {
    return reply('Tipo de interação não suportado ainda.');
  }

  const discordId = interaction.member?.user?.id || interaction.user?.id;
  const options = Object.fromEntries((interaction.data.options || []).map(o => [o.name, o.value]));

  try {
    switch (interaction.data.name) {
      case 'perfil':  return await cmdPerfil(discordId);
      case 'tarefas': return await cmdTarefas();
      case 'enigma':  return await cmdEnigma(discordId, options.resposta);
      case 'oraculo': return cmdOraculo();
      default:        return reply('Comando desconhecido — a Egrégora ainda não o reconhece.');
    }
  } catch (err) {
    console.error('[agora-discord-interactions]', err);
    return reply('Um Daemon interferiu na resposta. Tente novamente em instantes.');
  }
}

const NOME_GRAU = ['Neófito', 'Adepto', 'Mestre da Obra', 'Conselheiro'];

async function getLinkedUser(discordId) {
  const res = await supaFetch(`/rest/v1/agora_discord_sync?discord_id=eq.${discordId}&select=user_id`);
  const [row] = await res.json();
  return row?.user_id || null;
}

async function cmdPerfil(discordId) {
  const userId = await getLinkedUser(discordId);
  if (!userId) return reply('Sua conta ainda não está vinculada. Entre em https://iuripiragibe.net/agora-slu/login.html com Discord primeiro.');

  const res = await supaFetch(`/rest/v1/agora_profiles?id=eq.${userId}&select=xp,grau,streak_atual`);
  const [p] = await res.json();
  if (!p) return reply('Perfil não encontrado — visite o site para inicializá-lo.');

  return reply(`**${NOME_GRAU[p.grau] || 'Neófito'}** · ${p.xp} XP · 🔥 streak de ${p.streak_atual} dia(s)`, false);
}

async function cmdTarefas() {
  const res = await supaFetch(`/rest/v1/agora_tasks?status=eq.aberta&select=titulo,categoria,xp_reward&order=created_at.desc&limit=5`);
  const tasks = await res.json();
  if (!tasks.length) return reply('Nenhuma tarefa aberta no momento. A Egrégora está em dia.', false);
  const linhas = tasks.map(t => `• **${t.titulo}** _(${t.categoria}, ${t.xp_reward} XP)_`).join('\n');
  return reply(`**Tarefas Abertas:**\n${linhas}\n\nReivindique em https://iuripiragibe.net/agora-slu/tarefas.html`, false);
}

async function cmdEnigma(discordId, resposta) {
  const res = await supaFetch(`/rest/v1/agora_arg_puzzles?ativo=eq.true&select=id,titulo,pergunta&order=ordem&limit=1`);
  const [puzzle] = await res.json();
  if (!puzzle) return reply('Nenhum bloco ativo no Terminal ARG no momento.');

  if (!resposta) {
    return reply(`**${puzzle.titulo}**\n${puzzle.pergunta}\n\nResponda com \`/enigma resposta:<sua chave>\`.`, false);
  }

  const userId = await getLinkedUser(discordId);
  if (!userId) return reply('Vincule sua conta primeiro em https://iuripiragibe.net/agora-slu/login.html.');

  const result = await resolverPuzzleServerSide(userId, puzzle.id, resposta);
  if (!result.correto) return reply(result.mensagem);
  return reply(result.ja_resolvido_antes ? 'Você já havia decifrado este bloco.' : `${result.mensagem} +${result.xp_ganho} XP!`, false);
}

const ORACULOS = [
  'A Grande Obra não se apressa; ela se revela a quem persiste.',
  'O véu se afina para os que decifram, não para os que apenas observam.',
  'Um Daemon sussurra: nem todo enigma foi feito para ser resolvido sozinho.',
  'O Rubro Caelestis acende onde a superficialidade se instala. Vigie.',
  'A Egrégora lembra de cada nome gravado no Hall — e do silêncio dos que se calaram.',
  'Chronos-Phanes gira sua espiral: toda Fase que termina inicia outra maior.',
  'O ouro alquímico não se forja no chumbo apressado.',
  'Aether-Sophia guarda o que foi escrito com rigor — e descarta o que foi escrito com pressa.',
];

function cmdOraculo() {
  const linha = ORACULOS[Math.floor(Math.random() * ORACULOS.length)];
  return reply(`🔮 _${linha}_`, false);
}
