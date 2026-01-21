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

        const apiUrl = `https://api.basedosdados.org/api/v1/query?sql=${encodeURIComponent(sqlQuery)}`;
        
        console.log('Fazendo requisição ao Base dos Dados...');
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dados recebidos com sucesso');
        
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).json({ 
            error: 'Erro ao buscar dados do Base dos Dados',
            message: error.message 
        });
    }
});

// Rota para servir o HTML
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, req.path === '/' ? 'index.html' : req.path));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Acesse o mapa em http://localhost:${PORT}/mapa-dinastias.html`);
});
