import 'dotenv/config';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';

const USERNAME     = (process.env.TIKTOK_USER || 'iuripiragibe').replace(/^@/, '');
const PORT         = parseInt(process.env.PORT || '8787', 10);
const META         = parseInt(process.env.META  || '2000', 10);
const SIGN_API_KEY = process.env.SIGN_API_KEY   || undefined;

let state = { total: 0, count: 0, level: 1, levelBase: 0, goal: META };

function applyLevels() {
  while (state.total >= state.goal) {
    state.level++;
    state.levelBase = state.goal;
    state.goal += META;
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.url === '/reset') {
    state = { total: 0, count: 0, level: 1, levelBase: 0, goal: META };
    io.emit('reset');
    io.emit('state', state);
    res.end('Jarro zerado OK');
  } else if (req.url === '/status') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, state, username: USERNAME }));
  } else {
    res.end('Jarro de Presentes — servidor ativo');
  }
});

const io = new SocketServer(server, { cors: { origin: '*' } });

io.on('connection', socket => {
  socket.emit('state', state);
});

server.listen(PORT, () =>
  console.log(`Jarro de Presentes — porta ${PORT} — @${USERNAME}`));

const connOptions = { enableExtendedGiftInfo: true };
if (SIGN_API_KEY) connOptions.signApiKey = SIGN_API_KEY;

const tiktok = new TikTokLiveConnection(USERNAME, connOptions);

function pickImage(data, ext) {
  return (
    ext?.image?.url_list?.[0] ||
    ext?.icon?.url_list?.[0]  ||
    data?.giftDetails?.giftImage?.giftPictureUrl ||
    data?.giftPictureUrl || ''
  );
}

tiktok.on(WebcastEvent.GIFT, (data) => {
  const giftType = data?.giftDetails?.giftType ?? data?.giftType;
  if (giftType === 1 && !data.repeatEnd) return;

  const ext      = data.extendedGiftInfo || {};
  const count    = data.repeatCount || 1;
  const diamonds = ext.diamond_count ?? data?.giftDetails?.diamondCount ?? 0;
  const value    = diamonds * count;

  state.total += value;
  state.count += count;
  applyLevels();

  const payload = {
    user:     data?.user?.nickname || data?.user?.uniqueId || 'Alguem',
    avatar:   data?.user?.profilePictureUrl || data?.user?.profilePicture?.url_list?.[0] || '',
    giftName: ext.name || data?.giftDetails?.giftName || 'Presente',
    image:    pickImage(data, ext),
    coins:    diamonds,
    count,
    value,
  };

  io.emit('gift', payload);
  io.emit('state', state);
  console.log(`GIFT ${payload.user} -> ${payload.giftName} x${count} (+${value}D) | total: ${state.total}D`);
});

tiktok.on(ControlEvent.CONNECTED, s =>
  console.log(`Conectado LIVE @${USERNAME} sala ${s.roomId}`));

tiktok.on(ControlEvent.DISCONNECTED, () => {
  console.log('Desconectado. Reconectando em 30s...');
  setTimeout(waitAndConnect, 30000);
});

tiktok.on(ControlEvent.ERROR, e =>
  console.error('Erro TikTok:', e?.info || e?.exception?.message || e));

tiktok.on(WebcastEvent.STREAM_END, () =>
  console.log('LIVE terminou.'));

async function waitAndConnect() {
  try {
    console.log(`Verificando se @${USERNAME} esta ao vivo...`);
    await tiktok.waitUntilLive(30);
    await tiktok.connect();
  } catch (err) {
    console.error('Falha ao conectar:', err?.message || err);
    setTimeout(waitAndConnect, 30000);
  }
}

waitAndConnect();
