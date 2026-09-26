import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const md = readFileSync(join(root, 'content', 'roteiros.md'), 'utf8')
  .replace(/\\\[/g, '[')
  .replace(/\\\]/g, ']')
  .replace(/\\~/g, '~');

const MODULES = {
  1: { id: 1, slug: 'mentalidade', title: 'Mentalidade investigativa', blurb: 'Pauta, hipótese e ética. Ao final você escolhe a investigação do curso.' },
  2: { id: 2, slug: 'fontes', title: 'Fontes e documentos', blurb: 'On, off, background, sigilo da fonte e autenticidade.' },
  3: { id: 3, slug: 'lai', title: 'Lei de Acesso à Informação', blurb: 'Pedido no Fala.BR, prazos, recursos e sigilo.' },
  4: { id: 4, slug: 'dados', title: 'Dados públicos e cruzamento', blurb: 'Diários, CNPJ, TSE, processos e grafos.' },
  5: { id: 5, slug: 'checagem', title: 'Checagem e padrão de prova', blurb: 'Indício, status processual e redação proporcional.' },
  6: { id: 6, slug: 'risco', title: 'Risco jurídico', blurb: 'Honra, STF, assédio judicial e eleições 2026.' },
  7: { id: 7, slug: 'materia', title: 'Construção da matéria', blurb: 'Roteiro de vídeo, documento na tela e outro lado.' },
  8: { id: 8, slug: 'caso', title: 'Estudo de caso', blurb: 'Template da pauta até a publicação.' }
};

const TOOLS_BY_LESSON = {
  '1.1': ['unesco', 'fenaj'],
  '1.2': ['fenaj'],
  '1.3': ['unesco'],
  '1.4': ['fenaj'],
  '2.1': ['abraji-etica'],
  '2.2': ['stf-adpf601', 'planalto-cf'],
  '2.3': ['exif'],
  '2.4': ['signal', 'proton'],
  '3.1': ['lai-texto', 'falabr', 'informabr'],
  '3.2': ['falabr', 'informabr'],
  '3.3': ['falabr', 'informabr', 'cmri'],
  '3.4': ['lai-texto', 'lgpd'],
  '3.5': ['falabr', 'esic-local'],
  '4.1': ['in-gov', 'querido-diario'],
  '4.2': ['transparencia', 'pncp', 'ceis'],
  '4.3': ['minha-receita', 'brasil-api', 'brasil-io', 'cnpj'],
  '4.4': ['tse-divulga', 'camara', 'senado', 'tcu'],
  '4.5': ['datajud', 'onr', 'anac'],
  '4.6': ['procx', 'cruzagrafos'],
  '4.7': ['osint'],
  '5.1': ['fenaj'],
  '5.2': ['datajud'],
  '5.3': ['datajud'],
  '5.4': ['fenaj'],
  '6.1': ['planalto-cp'],
  '6.2': ['stf'],
  '6.3': ['abraji-assedio'],
  '6.4': ['tse-res', 'checklist'],
  '7.1': ['checklist'],
  '7.2': ['checklist'],
  '8.1': ['checklist', 'discord-agora']
};

const TOOLBOX = {
  unesco: { name: 'UNESCO — investigação a partir de histórias', url: 'https://unesdoc.unesco.org/ark:/48223/pf0000232359_por', kind: 'leitura' },
  fenaj: { name: 'Código de Ética FENAJ', url: 'https://fenaj.org.br/codigo-de-etica-dos-jornalistas-brasileiros/', kind: 'leitura' },
  'abraji-etica': { name: 'Abraji — ética e segurança', url: 'https://www.abraji.org.br/', kind: 'leitura' },
  'stf-adpf601': { name: 'STF — ADPF 601', url: 'https://portal.stf.jus.br/processos/detalhe.asp?incidente=5540238', kind: 'consulta' },
  'planalto-cf': { name: 'Constituição — art. 5º XIV', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', kind: 'leitura' },
  exif: { name: 'ExifTool (metadados)', url: 'https://exiftool.org/', kind: 'ferramenta' },
  signal: { name: 'Signal', url: 'https://signal.org/pt_BR/', kind: 'segurança' },
  proton: { name: 'Proton Mail', url: 'https://proton.me/mail', kind: 'segurança' },
  'lai-texto': { name: 'Lei 12.527/2011 (LAI)', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm', kind: 'leitura' },
  falabr: { name: 'Fala.BR — pedido LAI', url: 'https://falabr.cgu.gov.br/', kind: 'prática' },
  informabr: { name: 'InformaBR — prazos LAI', url: 'https://informabr.cgu.gov.br/entenda-os-prazos', kind: 'consulta' },
  cmri: { name: 'CMRI — recursos', url: 'https://www.gov.br/acessoainformacao/pt-br/lai-para-sic/cmri', kind: 'consulta' },
  lgpd: { name: 'LGPD — Lei 13.709/2018', url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm', kind: 'leitura' },
  'esic-local': { name: 'e-SIC do seu município', url: 'https://www.gov.br/acessoainformacao/pt-br', kind: 'prática' },
  'in-gov': { name: 'DOU / Imprensa Nacional', url: 'https://www.in.gov.br/', kind: 'prática' },
  'querido-diario': { name: 'Querido Diário', url: 'https://queridodiario.ok.org.br/', kind: 'prática' },
  transparencia: { name: 'Portal da Transparência', url: 'https://portaldatransparencia.gov.br/', kind: 'prática' },
  pncp: { name: 'PNCP — compras públicas', url: 'https://pncp.gov.br/', kind: 'prática' },
  ceis: { name: 'CEIS / CNEP (sanções)', url: 'https://portaldatransparencia.gov.br/sancoes', kind: 'prática' },
  'minha-receita': { name: 'Minha Receita', url: 'https://minhareceita.org/', kind: 'prática' },
  'brasil-api': { name: 'BrasilAPI — CNPJ', url: 'https://brasilapi.com.br/docs#tag/CNPJ', kind: 'prática' },
  'brasil-io': { name: 'Brasil.IO', url: 'https://brasil.io/', kind: 'prática' },
  cnpj: { name: 'Consulta CNPJ Receita', url: 'https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Solicitacao.asp', kind: 'prática' },
  'tse-divulga': { name: 'DivulgaCand / TSE', url: 'https://divulgacandcontas.tse.jus.br/', kind: 'prática' },
  camara: { name: 'Dados Abertos Câmara', url: 'https://dadosabertos.camara.leg.br/', kind: 'prática' },
  senado: { name: 'Dados Abertos Senado', url: 'https://www12.senado.leg.br/dados-abertos', kind: 'prática' },
  tcu: { name: 'TCU — pesquisas', url: 'https://pesquisa.apps.tcu.gov.br/', kind: 'prática' },
  datajud: { name: 'DataJud / CNJ', url: 'https://www.cnj.jus.br/sistemas/datajud/', kind: 'prática' },
  onr: { name: 'ONR — registro de imóveis', url: 'https://www.registrodeimoveis.org.br/', kind: 'prática' },
  anac: { name: 'ANAC — aeronaves', url: 'https://sistemas.anac.gov.br/aeronaves/cons_rab.asp', kind: 'prática' },
  procx: { name: 'PROCX', url: 'https://procx.com.br/', kind: 'prática' },
  cruzagrafos: { name: 'CruzaGrafos (Abraji)', url: 'https://www.abraji.org.br/projetos/cruzagrafos', kind: 'prática' },
  osint: { name: 'Bellingcat Online Investigation Toolkit', url: 'https://docs.google.com/spreadsheets/d/18rtqh8EG2q1xBo2cLNyhIDuK9jrPGwYr9DI2UncoqJQ/edit', kind: 'leitura' },
  'planalto-cp': { name: 'Código Penal — calúnia, difamação, injúria', url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848.htm', kind: 'leitura' },
  stf: { name: 'Portal STF — jurisprudência', url: 'https://portal.stf.jus.br/', kind: 'consulta' },
  'abraji-assedio': { name: 'Monitor de assédio judicial — Abraji', url: 'https://www.abraji.org.br/noticias/abraji-lanca-novo-relatorio-do-monitor-de-assedio-judicial-contra-jornalistas', kind: 'leitura' },
  'tse-res': { name: 'Resolução TSE 23.610/2019', url: 'https://www.tse.jus.br/legislacao/compilada/res/2019/resolucao-no-23-610-de-18-de-dezembro-de-2019', kind: 'leitura' },
  checklist: { name: 'Checklist pré-publicação (bônus)', url: '/jornalismo/app.html#/bonus', kind: 'bônus', sameOrigin: true },
  'discord-agora': { name: 'Discord Ágora — correção de pauta', url: 'https://discord.com/servers/d-e-s-urbex-brasil-1439091029973405891', kind: 'comunidade' }
};

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(s) {
  let t = escapeHtml(s);
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return t;
}

function toHtml(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  const flush = () => {
    if (!para.length) return;
    const joined = para.join(' ').trim();
    if (joined) out.push(`<p>${inline(joined)}</p>`);
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = line.match(/^\*\*\[([^\]]+)\]\*\*$/);
    if (heading) {
      flush();
      out.push(`<h3 class="jip-block">${escapeHtml(heading[1])}</h3>`);
      continue;
    }
    const callout = line.match(/^\*?\[(TELA|LETTERING|DEMONSTRAÇÃO|⚠️ CONFERIR ANTES DE GRAVAR|CASO DE APOIO|PREENCHER)[:\]][\s\S]*$/);
    if (callout || /^\*?\[/.test(line) && /\]\*?$/.test(line)) {
      flush();
      const inner = line.replace(/^\*/, '').replace(/\*$/, '').replace(/^\[/, '').replace(/\]$/, '').trim();
      let cls = 'jip-note';
      if (inner.startsWith('TELA:')) cls = 'jip-tela';
      else if (inner.startsWith('LETTERING:')) cls = 'jip-lettering';
      else if (inner.startsWith('DEMONSTRAÇÃO:')) cls = 'jip-demo';
      else if (inner.includes('CONFERIR')) cls = 'jip-warn';
      else if (inner.startsWith('CASO DE APOIO:')) cls = 'jip-caso';
      else if (inner.startsWith('PREENCHER')) cls = 'jip-fill';
      out.push(`<aside class="${cls}">${inline(inner)}</aside>`);
      continue;
    }
    if (line.startsWith('- ')) {
      flush();
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }
    para.push(line);
  }
  flush();
  let html = out.join('\n');
  html = html.replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  return html;
}

const lessonRe = /^### Aula (\d+\.\d+) — (.+)$/gm;
const matches = [...md.matchAll(lessonRe)];
const aulas = [];

for (let i = 0; i < matches.length; i++) {
  const m = matches[i];
  const id = m[1];
  const title = m[2].trim();
  const start = m.index + m[0].length;
  const end = i + 1 < matches.length ? matches[i + 1].index : md.search(/^## Fontes principais/m);
  let chunk = md.slice(start, end);
  const cut = chunk.search(/\n## /);
  if (cut > 0) chunk = chunk.slice(0, cut);
  chunk = chunk.trim();
  const metaMatch = chunk.match(/^\*([^*]+)\*/);
  const meta = metaMatch ? metaMatch[1].replace(/^~/, '').trim() : '';
  const parts = meta.split('·').map((p) => p.trim());
  const duration = parts[0] || '';
  const objective = (parts.find((p) => p.toLowerCase().startsWith('objetivo')) || '').replace(/^objetivo:\s*/i, '');
  const screen = (parts.find((p) => p.toLowerCase().startsWith('na tela')) || '').replace(/^na tela:\s*/i, '');
  const body = metaMatch ? chunk.slice(metaMatch[0].length).trim() : chunk;
  const exSplit = body.split(/\*\*\[EXERCÍCIO(?: FINAL)?\]\*\*/);
  const content = exSplit[0] || body;
  let exercise = '';
  let closing = '';
  if (exSplit.length > 1) {
    const rest = exSplit[1];
    const closeSplit = rest.split(/\*\*\[(?:FECHAMENTO|ENCERRAMENTO DO CURSO)\]\*\*/);
    exercise = closeSplit[0].trim();
    closing = closeSplit.slice(1).join('\n').trim();
  }
  const module = Number(id.split('.')[0]);
  aulas.push({
    id,
    module,
    title,
    duration,
    objective,
    screen,
    open: id === '3.2' || id === '3.3',
    tools: TOOLS_BY_LESSON[id] || [],
    contentHtml: toHtml(content),
    exerciseHtml: toHtml(exercise),
    closingHtml: toHtml(closing)
  });
}

const payload = {
  title: 'Jornalismo Investigativo na Prática',
  minutes: 340,
  lessons: 31,
  slogan: 'Sem documento, é lenda.',
  modules: Object.values(MODULES),
  toolbox: TOOLBOX,
  aulas
};

writeFileSync(join(root, 'content', 'aulas.json'), JSON.stringify(payload, null, 2), 'utf8');
const abertoIds = new Set(['3.2', '3.3']);
const abertoAulas = aulas.filter((a) => abertoIds.has(a.id));
const abertoTools = {};
for (const a of abertoAulas) {
  for (const id of a.tools) {
    if (payload.toolbox[id]) abertoTools[id] = payload.toolbox[id];
  }
}
writeFileSync(join(root, 'content', 'aberto.json'), JSON.stringify({
  title: payload.title,
  slogan: payload.slogan,
  toolbox: abertoTools,
  aulas: abertoAulas
}, null, 2), 'utf8');
console.log(`Wrote ${aulas.length} lessons + open class`);
