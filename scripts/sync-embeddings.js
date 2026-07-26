import 'dotenv/config';
import { google } from 'googleapis';
import fetch from 'node-fetch';
import { indexarDrives } from '../lib/driveIndexer.js';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!GOOGLE_API_KEY || !GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Erro: Chaves de API não configuradas no .env (requer GOOGLE_API_KEY, GEMINI_API_KEY, SUPABASE_URL e SUPABASE_KEY)');
  process.exit(1);
}

// Inicializa o cliente do Google Drive
const drive = google.drive({ version: 'v3', auth: GOOGLE_API_KEY });

// Tenta carregar o extrator de PDF opcional
let pdfParse = null;
try {
  pdfParse = (await import('pdf-parse')).default;
  console.log('[sync] Extrator de PDF carregado com sucesso.');
} catch (e) {
  console.log('[sync] Extrator de PDF não encontrado. Arquivos PDF usarão apenas o nome para indexação semântica.');
}

// Helper para chamadas ao Supabase
async function supabaseCall(endpoint, method = 'GET', body = null) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  };
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Supabase Error ${res.status}: ${err.message || res.statusText}`);
  }
  return (res.status === 204 || res.status === 201) ? null : res.json();
}

// Gera embedding usando o Gemini gemini-embedding-2 (com retry em caso de Rate Limit / 429)
async function generateEmbedding(text, retries = 5, delay = 2000) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${GEMINI_API_KEY}`;
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-2',
          content: { parts: [{ text }] },
          outputDimensionality: 768
        })
      });

      if (res.status === 429) {
        console.warn(`[sync] Limite de cota atingido (429). Aguardando ${delay / 1000}s antes de tentar novamente (Tentativa ${i + 1}/${retries})...`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2; // backoff exponencial
        continue;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Gemini Error ${res.status}: ${err.error?.message || res.statusText}`);
      }

      const data = await res.json();
      return data.embedding?.values || null;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.warn(`[sync] Erro ao obter embedding (Tentativa ${i + 1}/${retries}): ${e.message}. Retentando em ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
  return null;
}

// Extrai texto de um arquivo do Drive
async function extractText(fileId, mimeType, filename) {
  try {
    // 1. Google Docs nativo: exporta como text/plain
    if (mimeType === 'application/vnd.google-apps.document') {
      const res = await drive.files.export({ fileId, mimeType: 'text/plain' });
      return res.data.substring(0, 3000); // limita a 3000 caracteres
    }

    // 2. Arquivos de texto comuns
    if (mimeType === 'text/plain') {
      const res = await drive.files.get({ fileId, alt: 'media' });
      return typeof res.data === 'string' ? res.data.substring(0, 3000) : '';
    }

    // 3. PDFs (se o pdf-parse estiver disponível)
    if (mimeType === 'application/pdf' && pdfParse) {
      const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(res.data);
      const data = await pdfParse(buffer);
      return data.text.substring(0, 3000);
    }
  } catch (e) {
    console.warn(`[sync] Falha ao extrair texto de "${filename}": ${e.message}`);
  }
  return ''; // Fallback para texto vazio (será embutido o título)
}

async function sync() {
  console.log('[sync] Iniciando varredura e sincronização com Supabase...');

  // 1. Obter o índice completo de arquivos estruturados do backend
  let index;
  try {
    index = await indexarDrives(true); // força reindexação das pastas
    console.log(`[sync] Total de arquivos mapeados no Drive: ${index.arquivos.length}`);
  } catch (e) {
    console.error('[sync] Falha ao indexar pastas do Google Drive:', e.message);
    return;
  }

  // 2. Obter IDs já indexados no Supabase para pular arquivos não modificados
  let existingMap = new Map();
  try {
    const dbFiles = await supabaseCall('documents?select=id,modified_time', 'GET');
    dbFiles.forEach(f => {
      existingMap.set(f.id, new Date(f.modified_time).getTime());
    });
    console.log(`[sync] Supabase possui ${existingMap.size} registros.`);
  } catch (e) {
    console.warn('[sync] Aviso ao obter registros existentes. Prosseguindo com indexação total:', e.message);
  }

  // 3. Iterar e indexar
  let processed = 0, skipped = 0, errors = 0;
  for (const f of index.arquivos) {
    const modifiedTimeMs = new Date(f.modificado).getTime();
    
    // Se o arquivo já existe no Supabase e não foi modificado, pula
    if (existingMap.has(f.id) && existingMap.get(f.id) === modifiedTimeMs) {
      skipped++;
      continue;
    }

    console.log(`[sync] Processando [${processed + 1}]: "${f.nome}" (${f.tipoLabel})`);
    try {
      // Extrai o texto interno do arquivo
      const contentText = await extractText(f.id, f.mimeType, f.nome);
      
      // Cria a string para gerar o embedding (Título + Pasta + Tema + Trecho de Conteúdo)
      const textToEmbed = `Título: ${f.nome}\n` +
                          `Pasta: ${f.pasta}\n` +
                          `Tema: ${f.tema || 'Nenhum'}\n` +
                          (contentText ? `Conteúdo:\n${contentText}` : '');

      // Gera o vetor de embedding
      const embedding = await generateEmbedding(textToEmbed);

      if (!embedding) {
        throw new Error('Vetor de embedding retornado nulo.');
      }

      // Prepara o registro para gravação
      const record = {
        id: f.id,
        name: f.nome,
        mime_type: f.mimeType,
        size: f.tamanhoBytes || 0,
        modified_time: f.modificado,
        pasta_slug: f.pastaSlug,
        tema: f.tema || 'Outros',
        subtema: f.subtema || null,
        thumbnail_link: f.thumbnail || null,
        web_view_link: f.driveUrl,
        embedding: embedding,
        text_excerpt: contentText ? contentText.substring(0, 500) : null,
        indexed_at: new Date().toISOString()
      };

      // Grava no Supabase (upsert)
      await supabaseCall('documents', 'POST', record);
      processed++;

      // Aguarda 100ms para evitar estouro de limite de cota da API Gemini
      await new Promise(r => setTimeout(r, 100));

    } catch (e) {
      console.error(`[sync] Erro ao processar "${f.nome}":`, e.message);
      errors++;
    }
  }

  console.log(`[sync] Sincronização concluída!`);
  console.log(`[sync] → Processados/Atualizados: ${processed}`);
  console.log(`[sync] → Pulados (sem modificações): ${skipped}`);
  console.log(`[sync] → Erros: ${errors}`);
}

import { fileURLToPath } from 'url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  sync().catch(e => console.error('[sync] Falha crítica no sincronizador:', e));
}

export { sync };
