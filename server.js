// Usar CommonJS para compatibilidade
const express = require('express');
const cors = require('cors');
const path = require('path');

// node-fetch para Node.js < 18, ou usar fetch nativo no Node.js 18+
let fetch;
try {
    // Tentar usar fetch nativo (Node.js 18+)
    fetch = globalThis.fetch || require('node-fetch');
} catch (e) {
    fetch = require('node-fetch');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS para todas as origens
app.use(cors());

// Servir arquivos estáticos
app.use(express.static('.'));

// Rota proxy para Base dos Dados
app.get('/api/candidatos', async (req, res) => {
    try {
        const sqlQuery = req.query.sql;
        
        if (!sqlQuery) {
            return res.status(400).json({ 
                error: 'Parâmetro sql é obrigatório' 
            });
        }

        // Tentar diferentes endpoints da API do Base dos Dados
        const apiUrls = [
            `https://api.basedosdados.org/api/v1/query?sql=${encodeURIComponent(sqlQuery)}`,
            `https://basedosdados.org/api/1/query?sql=${encodeURIComponent(sqlQuery)}`
        ];
        
        let lastError = null;
        
        for (const apiUrl of apiUrls) {
            try {
                console.log(`Tentando: ${apiUrl.substring(0, 60)}...`);
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0'
                    },
                    timeout: 30000
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Dados recebidos com sucesso do Base dos Dados');
                    
                    // Retornar com headers CORS
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                    res.json(data);
                    return;
                } else {
                    console.warn(`Resposta não OK: ${response.status}`);
                    lastError = new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                console.warn(`Erro ao acessar ${apiUrl.substring(0, 40)}:`, error.message);
                lastError = error;
                continue;
            }
        }
        
        // Se todas as tentativas falharam
        throw lastError || new Error('Todas as tentativas falharam');
        
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(500).json({ 
            error: 'Erro ao buscar dados do Base dos Dados',
            message: error.message 
        });
    }
});

// Handler para OPTIONS (preflight CORS)
app.options('/api/candidatos', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(200);
});

// Rota para servir o HTML
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, req.path === '/' ? 'index.html' : req.path));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Acesse o mapa em http://localhost:${PORT}/mapa-dinastias.html`);
});
