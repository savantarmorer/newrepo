# Servidor Proxy para Base dos Dados

Este servidor resolve o problema de CORS ao acessar a API do Base dos Dados.

## 🚀 Como Usar

### 1. Instalar Dependências (já feito)
```bash
npm install
```

### 2. Iniciar o Servidor
```bash
npm start
# ou
npm run server
```

O servidor irá rodar em `http://localhost:3000`

### 3. Acessar o Mapa
Abra no navegador:
- `http://localhost:3000/mapa-dinastias.html`

O mapa agora conseguirá buscar dados reais do Base dos Dados através do proxy!

## 📋 O que o Servidor Faz

1. **Proxy CORS**: Faz requisições ao Base dos Dados no servidor (sem limitações de CORS)
2. **Servir Arquivos Estáticos**: Serve todos os arquivos HTML, CSS, JS do projeto
3. **Endpoint `/api/candidatos`**: Recebe queries SQL e retorna dados do Base dos Dados

## 🔧 Configuração

### Porta
A porta padrão é `3000`. Para mudar:
```bash
PORT=8080 npm start
```

### Variáveis de Ambiente
Crie um arquivo `.env` (opcional):
```
PORT=3000
```

## 🌐 Deploy em Produção

Para produção, você pode:

1. **Deploy no Heroku/Vercel/Railway:**
   - Configure o `server.js` como entry point
   - Adicione `"start": "node server.js"` no package.json (já está)

2. **Atualizar URL no código:**
   - Se o proxy estiver em outro domínio, atualize `mapa-dinastias.html`:
   ```javascript
   // Em produção, descomente e ajuste:
   `https://seu-dominio.com/api/candidatos?sql=${encodeURIComponent(sqlQuery)}`
   ```

## ✅ Testando

1. Inicie o servidor: `npm start`
2. Abra `http://localhost:3000/mapa-dinastias.html`
3. Abra o Console do navegador (F12)
4. Você deve ver: "Dados recebidos do Base dos Dados"
5. Clique em um estado para ver as dinastias reais!

## 🐛 Troubleshooting

**Erro: "Cannot find module 'express'"**
- Execute: `npm install`

**Porta já em uso:**
- Mude a porta: `PORT=8080 npm start`
- Ou mate o processo usando a porta 3000

**Dados não carregam:**
- Verifique o console do servidor (terminal)
- Verifique o console do navegador (F12)
- Certifique-se de que o servidor está rodando
