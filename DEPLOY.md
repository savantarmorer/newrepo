# Guia de Deploy - Resolver CORS

## 🚨 Problema Atual

O site está em produção (`https://iuripiragibe.net`) mas o servidor proxy não está rodando, então o CORS bloqueia as requisições.

## ✅ Solução: Deploy do Servidor Proxy

### Opção 1: Deploy no Vercel (Recomendado - Mais Fácil)

1. **Instalar Vercel CLI:**
```bash
npm install -g vercel
```

2. **Criar arquivo `vercel.json`:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/candidatos",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

3. **Deploy:**
```bash
vercel
```

4. **Configurar domínio:**
- No painel da Vercel, adicione `iuripiragibe.net` como domínio
- Ou use o domínio fornecido pela Vercel e atualize o código

### Opção 2: Deploy no Railway/Render (Alternativa)

1. **Railway:**
   - Conecte seu repositório GitHub
   - Configure `server.js` como start command
   - Railway detecta automaticamente Node.js

2. **Render:**
   - Crie novo Web Service
   - Conecte repositório
   - Start Command: `node server.js`
   - Build Command: `npm install`

### Opção 3: Servidor Próprio (VPS/Cloud)

1. **SSH no servidor:**
```bash
ssh usuario@iuripiragibe.net
```

2. **Instalar Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Clonar repositório:**
```bash
cd /var/www
git clone https://github.com/savantarmorer/newrepo.git
cd newrepo
npm install
```

4. **Configurar PM2 (gerenciador de processos):**
```bash
npm install -g pm2
pm2 start server.js --name "iuri-piragibe"
pm2 save
pm2 startup
```

5. **Configurar Nginx como reverse proxy:**
```nginx
server {
    listen 80;
    server_name iuripiragibe.net;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

6. **Configurar SSL (Let's Encrypt):**
```bash
sudo certbot --nginx -d iuripiragibe.net
```

## 🔧 Solução Temporária: Usar Arquivo JSON

Enquanto o servidor não está em produção, você pode:

1. **Gerar dados offline:**
   - Use BigQuery do Base dos Dados
   - Execute a query SQL
   - Exporte como JSON
   - Processe e salve como `candidatos-dinastias.json`

2. **Fazer upload do arquivo:**
   - Coloque `candidatos-dinastias.json` na raiz do projeto
   - Faça commit e push
   - O mapa carregará automaticamente

## 📝 Estrutura do candidatos-dinastias.json

```json
{
  "MA": [
    {
      "nome": "Família Sarney",
      "cargos": "Senador, Deputado Federal",
      "decadas": "2014-2024",
      "membros": [
        "José Sarney - Senador (2014) - PMDB",
        "José Sarney Filho - Deputado Federal (2018) - MDB"
      ]
    }
  ]
}
```

## ✅ Verificação

Após deploy, teste:
1. Acesse: `https://iuripiragibe.net/mapa-dinastias.html`
2. Abra Console (F12)
3. Deve ver: "Dados recebidos do Base dos Dados"
4. Clique em um estado - deve mostrar dinastias reais!
