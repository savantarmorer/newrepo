# Como Carregar Dados Reais do Base dos Dados

O mapa das dinastias políticas está configurado para buscar dados reais do Base dos Dados, mas devido a limitações de CORS (Cross-Origin Resource Sharing), a API não pode ser acessada diretamente do navegador.

## Soluções Disponíveis

### Opção 1: Arquivo JSON Local (Recomendado)

1. **Gerar o arquivo JSON offline:**
   - Use o BigQuery do Base dos Dados para executar a query SQL
   - Exporte os resultados como JSON
   - Processe os dados para identificar dinastias
   - Salve como `candidatos-dinastias.json` na raiz do projeto

2. **Estrutura do arquivo JSON:**
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
  ],
  "AL": [
    {
      "nome": "Família Calheiros",
      "cargos": "Senador, Deputado Federal",
      "decadas": "2014-2024",
      "membros": [
        "Renan Calheiros - Senador (2014) - MDB",
        "Renan Filho - Deputado Federal (2018) - MDB"
      ]
    }
  ]
}
```

3. **O mapa carregará automaticamente** o arquivo `candidatos-dinastias.json` se ele existir.

### Opção 2: Proxy Server-Side

Configure um proxy no seu servidor para fazer as requisições ao Base dos Dados:

**Exemplo Node.js/Express:**
```javascript
const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());

app.get('/api/candidatos', async (req, res) => {
  try {
    const sqlQuery = req.query.sql;
    const apiUrl = `https://api.basedosdados.org/api/v1/query?sql=${encodeURIComponent(sqlQuery)}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

Depois, atualize a função `buscarDadosCandidatos()` para usar seu proxy:
```javascript
const apiUrl = `https://seu-dominio.com/api/candidatos?sql=${encodeURIComponent(sqlQuery)}`;
```

### Opção 3: Dados Estáticos Expandidos

O código já inclui dados estáticos de dinastias conhecidas como fallback. Esses dados são carregados automaticamente se a API não estiver disponível.

## Query SQL para Base dos Dados

```sql
SELECT
    sigla_uf,
    nome,
    nome_urna,
    sigla_partido,
    cargo,
    situacao,
    ano
FROM `basedosdados.br_tse_eleicoes.candidatos`
WHERE cargo IN ('SENADOR', 'DEPUTADO FEDERAL', 'DEPUTADO ESTADUAL')
    AND ano >= 2014
    AND sigla_uf IS NOT NULL
ORDER BY ano DESC, sigla_uf, nome
LIMIT 5000
```

## Processamento dos Dados

O código identifica dinastias automaticamente agrupando candidatos por:
- **Estado** (sigla_uf)
- **Sobrenome** (último nome do candidato)
- **Famílias com 2+ membros** no mesmo estado

As dinastias são exibidas no mapa quando você clica em um estado.
