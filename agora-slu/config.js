// Configuração local do site Ágora — edite os valores abaixo com suas credenciais reais.
// Este arquivo é carregado por TODAS as páginas antes de js/agoraAuth.js.
// Ver SETUP_INTEGRACOES.md para como obter cada valor.

// ID do servidor (Guild) Discord da Ágora.
// Como pegar: ative o Modo Desenvolvedor (Discord > Configurações > Avançado),
// clique com o botão direito no servidor > "Copiar ID do Servidor".
// Também é preciso ativar "Widget do Servidor" em Configurações do Servidor > Widget.
window.AGORA_DISCORD_GUILD_ID = '';

// URL pública onde a API de sincronização (server/server.js) está rodando.
// Em desenvolvimento local, deixe como está. Em produção, troque para o host real
// (Railway/Render/Fly.io/VPS) onde você publicou a pasta server/.
window.AGORA_API_URL = 'http://localhost:4000';
