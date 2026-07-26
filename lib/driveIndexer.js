/**
 * driveIndexer.js
 * Indexa arquivos dos Google Drives configurados.
 * Suporta API Key (pastas públicas) ou Service Account (pastas privadas).
 * Cache em memória com TTL configurável.
 */

import { google } from 'googleapis';

// ─── IDs das pastas ───────────────────────────────────────────────────────────
export const DRIVE_FOLDERS = [
  {
    id: process.env.DRIVE_FOLDER_1 || '1EEi7bB3L2TIshhTOI-HJzQ4mgQ8F2k5i',
    name: 'Biblioteca Esotérica',
    slug: 'esoterica',
    color: '#9b59b6',
    icon: '🔮'
  },
  {
    id: process.env.DRIVE_FOLDER_2 || '18bq6fy8-n8IP8rhYRjXLNdvn7rrhR27Q',
    name: 'Tradições Místicas',
    slug: 'mystica',
    color: '#2ecc71',
    icon: '🌙'
  },
  {
    id: process.env.DRIVE_FOLDER_3 || '1zG4yx8B2S1mh7WiFcquCdMGJH_5y6f52',
    name: 'Sociedades Secretas',
    slug: 'sociedades',
    color: '#e74c3c',
    icon: '🏛️'
  }
];

// ─── Mapeamento de temas ──────────────────────────────────────────────────────
const THEME_RULES = [
  {
    tema: 'Maçonaria',
    subtemas: ['Rituais', 'História', 'Graus', 'Símbolos'],
    keywords: ['maçon', 'mason', 'loja', 'grão-mestre', 'aprendiz', 'companheiro', 'mestre', 'rito', 'ritual', 'escocês', 'york', 'templo', 'acácia', 'compasso', 'esquadro', 'hiram', 'tiler']
  },
  {
    tema: 'Rosacruzes',
    subtemas: ['Alquimia', 'Manifestos', 'Filosofia'],
    keywords: ['rosacruz', 'rosicrucian', 'amorc', 'fama fraternitatis', 'confessio', 'alquimia', 'alchemist', 'pedra filosofal', 'elixir', 'hermético', 'hermes']
  },
  {
    tema: 'Iluminati & Ordens',
    subtemas: ['Bavária', 'Templários', 'Outras Ordens'],
    keywords: ['iluminati', 'illuminati', 'templário', 'templar', 'cavaleiro', 'ordem', 'skull', 'bones', 'bilderberg', 'opus dei', 'jesuíta', 'jesuit']
  },
  {
    tema: 'Wicca & Bruxaria',
    subtemas: ['Feitiços', 'Sabás', 'Deidades', 'Herbologia'],
    keywords: ['wicca', 'wiccan', 'bruxaria', 'witch', 'coven', 'sabá', 'sabbat', 'feitiço', 'spell', 'hex', 'poção', 'potion', 'cauldron', 'caldeirão', 'bruxo', 'feiticeiro', 'pagão', 'pagan']
  },
  {
    tema: 'Ocultismo & Magia',
    subtemas: ['Kabbalah', 'Thelema', 'Enochiano', 'Goetia'],
    keywords: ['ocult', 'kabbalah', 'qabalah', 'cabala', 'thelema', 'crowley', 'golden dawn', 'enochian', 'enoque', 'goetia', 'grimoire', 'grimorium', 'necronomicon', 'grimório', 'sigil', 'sigilo', 'lemegeton', 'ars goetia', 'demônio', 'demon', 'evocação']
  },
  {
    tema: 'Astrologia & Tarô',
    subtemas: ['Tarô', 'Astrologia', 'Numerologia', 'Runas'],
    keywords: ['tarô', 'tarot', 'astrolog', 'zodiac', 'zodíaco', 'planet', 'planeta', 'numerolog', 'runa', 'rune', 'signo', 'horóscopo', 'arcano', 'arcana', 'cartomancia']
  },
  {
    tema: 'Filosofia Esotérica',
    subtemas: ['Teosofia', 'Gnose', 'Espiritualismo'],
    keywords: ['teosofia', 'theosoph', 'blavatsky', 'gnose', 'gnosis', 'gnostic', 'espiritismo', 'spiritism', 'kardec', 'ántropo', 'steiner', 'antroposof', 'neoplatonism', 'plotino', 'pitagoras']
  },
  {
    tema: 'Conspirações & Poder',
    subtemas: ['Globalismo', 'Elites', 'Brasil', 'NWO'],
    keywords: ['conspiraç', 'conspiracy', 'nova ordem mundial', 'new world order', 'nwo', 'elite', 'globalismo', 'shadow', 'deep state', 'governo sombra', 'oligarquia', 'poder oculto']
  },
  {
    tema: 'Política Brasileira',
    subtemas: ['Dynastias', 'Corrupção', 'Câmara', 'Partidos'],
    keywords: ['brasil', 'lula', 'bolsonaro', 'congresso', 'senado', 'câmara', 'partido', 'sarney', 'barbalho', 'calheiros', 'maluf', 'temer', 'dilma', 'petista', 'política', 'politico', 'corrupção', 'coronelismo', 'oligarquia', 'dinastia']
  },
  {
    tema: 'Urbex & Mistérios',
    subtemas: ['São Paulo', 'Arqueologia', 'Lugares Ocultos'],
    keywords: ['urbex', 'exploração urbana', 'underground', 'subterrâneo', 'rio enterrado', 'tamanduateí', 'anhangabaú', 'são paulo', 'túnel', 'bunker', 'lugar abandonado', 'lugar oculto', 'arqueolog']
  },
  {
    tema: 'História & Religiões',
    subtemas: ['Egito', 'Grécia', 'Mesopotâmia', 'Religiões Comparadas'],
    keywords: ['egipto', 'egypt', 'faraó', 'pharaoh', 'hieroglif', 'piramid', 'osiris', 'isis', 'horus', 'anubis', 'grécia', 'greece', 'mitologia', 'mythology', 'mesopotamia', 'suméria', 'sumerian', 'babilônia', 'babylon', 'história', 'history', 'religião', 'religion']
  }
];

// ─── Tipos de arquivo ─────────────────────────────────────────────────────────
const MIME_LABELS = {
  'application/pdf': { label: 'PDF', icon: '📄', color: '#e74c3c', viewable: true },
  'application/vnd.google-apps.document': { label: 'Google Doc', icon: '📝', color: '#4285f4', viewable: true },
  'application/vnd.google-apps.presentation': { label: 'Apresentação', icon: '📊', color: '#f4b400', viewable: true },
  'application/vnd.google-apps.spreadsheet': { label: 'Planilha', icon: '📈', color: '#0f9d58', viewable: true },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { label: 'Word', icon: '📃', color: '#2b579a', viewable: true },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { label: 'PowerPoint', icon: '📋', color: '#d04423', viewable: true },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { label: 'Excel', icon: '📊', color: '#217346', viewable: true },
  'image/jpeg': { label: 'Imagem', icon: '🖼️', color: '#9b59b6', viewable: true },
  'image/png': { label: 'Imagem', icon: '🖼️', color: '#9b59b6', viewable: true },
  'image/gif': { label: 'GIF', icon: '🖼️', color: '#9b59b6', viewable: true },
  'video/mp4': { label: 'Vídeo', icon: '🎬', color: '#e74c3c', viewable: true },
  'audio/mpeg': { label: 'Áudio', icon: '🎵', color: '#1db954', viewable: false },
  'text/plain': { label: 'Texto', icon: '📝', color: '#7f8c8d', viewable: true },
  'application/vnd.google-apps.folder': { label: 'Pasta', icon: '📁', color: '#f39c12', viewable: false }
};

// ─── Detectar tema e subtema por nome do arquivo ──────────────────────────────
function detectTheme(filename) {
  const lower = filename.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const rule of THEME_RULES) {
    for (const kw of rule.keywords) {
      const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(kwNorm)) {
        // Detectar subtema
        for (const subtema of rule.subtemas) {
          const subNorm = subtema.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (lower.includes(subNorm)) {
            return { tema: rule.tema, subtema };
          }
        }
        return { tema: rule.tema, subtema: null };
      }
    }
  }
  return { tema: 'Outros', subtema: null };
}

// ─── Gerar URL de visualização inline ─────────────────────────────────────────
function getViewerUrl(file) {
  const mime = file.mimeType || '';
  if (mime.startsWith('application/vnd.google-apps.')) {
    // Google Docs nativos: usar embed do próprio Drive
    return `https://drive.google.com/file/d/${file.id}/preview`;
  }
  if (mime === 'application/pdf' || mime.startsWith('image/') || mime === 'text/plain') {
    return `https://drive.google.com/file/d/${file.id}/preview`;
  }
  // Office / outros: Google Docs Viewer
  const driveUrl = encodeURIComponent(`https://drive.google.com/open?id=${file.id}`);
  return `https://docs.google.com/viewer?url=${driveUrl}&embedded=true`;
}

// ─── Cache em memória ─────────────────────────────────────────────────────────
const CACHE_TTL_MS = (parseInt(process.env.DRIVE_CACHE_MINUTES) || 10) * 60 * 1000;
let cache = null;
let cacheTimestamp = 0;

// ─── Construir cliente da API Google ─────────────────────────────────────────
function buildDriveClient() {
  // Opção 1: Service Account (JSON completo ou variáveis individuais)
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const saEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const saKey = process.env.GOOGLE_PRIVATE_KEY;

  if (saJson || (saEmail && saKey)) {
    let credentials;
    if (saJson) {
      try {
        credentials = typeof saJson === 'string' && saJson.trim().startsWith('{')
          ? JSON.parse(saJson)
          : JSON.parse(require('fs').readFileSync(saJson, 'utf8'));
      } catch (e) {
        console.warn('[driveIndexer] Falha ao ler GOOGLE_SERVICE_ACCOUNT_JSON:', e.message);
      }
    }
    if (!credentials && saEmail && saKey) {
      credentials = {
        client_email: saEmail,
        private_key: saKey.replace(/\\n/g, '\n')
      };
    }
    if (credentials) {
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });
      return google.drive({ version: 'v3', auth });
    }
  }

  // Opção 2: API Key (pastas públicas)
  const apiKey = process.env.GOOGLE_API_KEY;
  if (apiKey) {
    return google.drive({ version: 'v3', auth: apiKey });
  }

  return null;
}

// ─── Listar arquivos de uma pasta recursivamente ──────────────────────────────
async function listFilesInFolder(drive, folderId, folderMeta, visited = new Set(), depth = 0) {
  if (depth > 8) return []; // Limite de profundidade
  const files = [];
  const subFolderPromises = [];
  let pageToken = null;

  do {
    const params = {
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, iconLink, webViewLink, webContentLink, parents, shortcutDetails)',
      pageSize: 200,
      orderBy: 'name',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    };
    if (pageToken) params.pageToken = pageToken;

    let resp;
    try {
      resp = await drive.files.list(params);
    } catch (e) {
      console.warn(`[driveIndexer] Falha ao listar pasta ${folderId}: ${e.message}`);
      break;
    }

    const items = resp.data.files || [];
    for (const item of items) {
      let resolvedItem = item;
      let isFolder = item.mimeType === 'application/vnd.google-apps.folder';

      if (item.mimeType === 'application/vnd.google-apps.shortcut' && item.shortcutDetails) {
        if (item.shortcutDetails.targetMimeType === 'application/vnd.google-apps.folder') {
          isFolder = true;
          resolvedItem = { id: item.shortcutDetails.targetId };
        } else {
          resolvedItem = {
            id: item.shortcutDetails.targetId,
            name: item.name,
            mimeType: item.shortcutDetails.targetMimeType,
            size: item.size,
            modifiedTime: item.modifiedTime,
            webViewLink: item.webViewLink,
            thumbnailLink: item.thumbnailLink
          };
        }
      }

      if (isFolder) {
        if (resolvedItem.id && !visited.has(resolvedItem.id)) {
          visited.add(resolvedItem.id);
          // Recursão em subpastas em paralelo
          subFolderPromises.push(listFilesInFolder(drive, resolvedItem.id, folderMeta, visited, depth + 1));
        }
      } else {
        if (visited.has(resolvedItem.id)) continue;
        visited.add(resolvedItem.id);

        const { tema, subtema } = detectTheme(resolvedItem.name || '');
        const mimeInfo = MIME_LABELS[resolvedItem.mimeType] || { label: 'Arquivo', icon: '📎', color: '#7f8c8d', viewable: false };

        files.push({
          id: resolvedItem.id,
          nome: resolvedItem.name,
          mimeType: resolvedItem.mimeType,
          tipoLabel: mimeInfo.label,
          tipoIcon: mimeInfo.icon,
          tipoCor: mimeInfo.color,
          viewable: mimeInfo.viewable,
          tamanho: resolvedItem.size ? formatBytes(parseInt(resolvedItem.size)) : null,
          tamanhoBytes: parseInt(resolvedItem.size) || 0,
          modificado: resolvedItem.modifiedTime,
          pasta: folderMeta.name,
          pastaCor: folderMeta.color,
          pastaIcon: folderMeta.icon,
          pastaSlug: folderMeta.slug,
          tema,
          subtema,
          viewerUrl: getViewerUrl(resolvedItem),
          driveUrl: resolvedItem.webViewLink || `https://drive.google.com/file/d/${resolvedItem.id}/view`,
          thumbnail: resolvedItem.thumbnailLink || null
        });
      }
    }

    pageToken = resp.data.nextPageToken;
  } while (pageToken);

  if (subFolderPromises.length > 0) {
    const subResults = await Promise.all(subFolderPromises);
    for (const subFiles of subResults) {
      files.push(...subFiles);
    }
  }

  return files;
}

// ─── Formatar bytes ───────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(1)} ${units[i]}`;
}

// ─── Função principal: indexar tudo ──────────────────────────────────────────
export async function indexarDrives(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cache;
  }

  const drive = buildDriveClient();
  if (!drive) {
    console.warn('[driveIndexer] Nenhuma credencial Google configurada. Retornando cache vazio.');
    return buildEmptyIndex();
  }

  const allFiles = [];
  for (const folder of DRIVE_FOLDERS) {
    console.log(`[driveIndexer] Indexando: ${folder.name} (${folder.id})`);
    const visited = new Set();
    visited.add(folder.id);
    const files = await listFilesInFolder(drive, folder.id, folder, visited);
    allFiles.push(...files);
    console.log(`[driveIndexer] → ${files.length} arquivos encontrados`);
  }

  // Montar estrutura de navegação por tema
  const temaMap = {};
  for (const f of allFiles) {
    if (!temaMap[f.tema]) temaMap[f.tema] = { total: 0, subtemas: {} };
    temaMap[f.tema].total++;
    if (f.subtema) {
      temaMap[f.tema].subtemas[f.subtema] = (temaMap[f.tema].subtemas[f.subtema] || 0) + 1;
    }
  }

  // Montar lista de pastas com contadores
  const pastaMap = {};
  for (const f of allFiles) {
    pastaMap[f.pastaSlug] = pastaMap[f.pastaSlug] || {
      slug: f.pastaSlug, nome: f.pasta, cor: f.pastaCor, icon: f.pastaIcon, total: 0
    };
    pastaMap[f.pastaSlug].total++;
  }

  const result = {
    total: allFiles.length,
    indexadoEm: new Date().toISOString(),
    arquivos: allFiles,
    temas: temaMap,
    pastas: Object.values(pastaMap)
  };

  cache = result;
  cacheTimestamp = now;

  console.log(`[driveIndexer] ✅ Total indexado: ${allFiles.length} arquivos`);
  return result;
}

// ─── Busca e filtros ──────────────────────────────────────────────────────────
export function buscarArquivos(index, { q = '', tema = '', subtema = '', pasta = '', tipo = '', pagina = 1, porPagina = 24 } = {}) {
  let results = index.arquivos;

  if (q) {
    const termos = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
    results = results.filter(f => {
      const haystack = (f.nome + ' ' + f.tema + ' ' + (f.subtema || '') + ' ' + f.pasta)
        .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return termos.every(t => haystack.includes(t));
    });
  }
  if (tema) results = results.filter(f => f.tema === tema);
  if (subtema) results = results.filter(f => f.subtema === subtema);
  if (pasta) results = results.filter(f => f.pastaSlug === pasta);
  if (tipo) results = results.filter(f => f.tipoLabel === tipo);

  const total = results.length;
  const totalPaginas = Math.ceil(total / porPagina);
  const start = (pagina - 1) * porPagina;
  const items = results.slice(start, start + porPagina);

  return { total, totalPaginas, pagina, porPagina, items };
}

function buildEmptyIndex() {
  return {
    total: 0,
    indexadoEm: new Date().toISOString(),
    arquivos: [],
    temas: {},
    pastas: [],
    _semCredenciais: true
  };
}
