// Configuração local do site Ágora — edite os valores abaixo com suas credenciais reais.
// Este arquivo é carregado por TODAS as páginas antes de js/agoraAuth.js.
// Ver SETUP_INTEGRACOES.md para como obter cada valor.

// ID do servidor (Guild) Discord da Ágora.
// Como pegar: ative o Modo Desenvolvedor (Discord > Configurações > Avançado),
// clique com o botão direito no servidor > "Copiar ID do Servidor".
// Também é preciso ativar "Widget do Servidor" em Configurações do Servidor > Widget.
window.AGORA_DISCORD_GUILD_ID = '1439091029973405891';

// URL da API de sincronização com o Discord.
// Em produção (Netlify, mesmo domínio do site) deixe em branco — as rotas
// /api/agora/discord/* já respondem no mesmo domínio via Netlify Functions.
// Para testar localmente com server/server.js (Express), troque para
// 'http://localhost:4000'.
window.AGORA_API_URL = '';
