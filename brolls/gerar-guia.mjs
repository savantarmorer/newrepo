#!/usr/bin/env node
/* Gera brolls/README.md (guia de uso + planilha de entrada de cada clipe) a partir de src/clips.mjs. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const { default: CLIPS } = await import(pathToFileURL(path.join(ROOT, 'src/clips.mjs')).href);

const TITULOS = { 1: 'Parte 1 — O curso introdutório', 2: 'Parte 2 — Os andares de cima', 3: 'Parte 3 — A segunda águia' };
const base = c => `${c.id}_${c.tipo}_${c.slug}`;
const arquivo = c => c.tipo === 'SOBRE' ? `mp4/parte-${c.ep}/${base(c)}_verde.mp4` : `mp4/parte-${c.ep}/${base(c)}.mp4`;
const esc = s => String(s || '').replace(/\|/g, '\\|');

let tabela = '';
for (const ep of [1, 2, 3]) {
  const cs = CLIPS.filter(c => c.ep === ep);
  const dur = cs.reduce((a, c) => a + c.d, 0);
  tabela += `\n### ${TITULOS[ep]}\n\n${cs.length} clipes · ${Math.round(dur)} s de material\n\n`;
  tabela += '| ID | Tipo | Dur. | Arquivo | Entra em (fala) |\n|---|---|---|---|---|\n';
  for (const c of cs) {
    const tipo = c.tipo === 'SOBRE' ? 'sobreposição' : (c.somber ? 'tela cheia · sóbrio' : 'tela cheia');
    tabela += `| ${c.id} | ${tipo} | ${c.d}s | [${base(c)}](${arquivo(c)}) | ${esc(c.cue)} |\n`;
  }
}

const total = CLIPS.length, sobre = CLIPS.filter(c => c.tipo === 'SOBRE').length;
const md = `# B-rolls · Ninguém entra numa seita

Pacote de ${total} B-rolls animados (${total - sobre} de tela cheia e ${sobre} sobreposições) para os três episódios.
Cada clipe existe em **SVG animado** (fonte editável, abre e anima no navegador) e em **MP4 1920×1080, 30 fps**.

## Como baixar

- **Tudo de uma vez:** no GitHub, abra o branch deste trabalho, clique em **Code → Download ZIP**. As pastas \`brolls/mp4\` e \`brolls/mov-alfa\` trazem os vídeos.
- **Um arquivo só:** clique no arquivo na lista abaixo e use o botão de download (ícone de seta) do GitHub.
- \`previa/\` tem um vídeo curto de amostra e folhas de contato de cada parte, para escolher sem abrir arquivo por arquivo.

## Pastas

| Pasta | O que tem |
|---|---|
| \`mp4/parte-N/\` | Todos os clipes em MP4 (H.264). Tela cheia: \`*_TELA_*.mp4\`. Sobreposições: \`*_SOBRE_*_verde.mp4\`, com fundo verde #00FF00 para chroma key. |
| \`mov-alfa/parte-N/\` | As mesmas sobreposições em MOV com canal alfa (codec PNG). Premiere, DaVinci Resolve e Final Cut aceitam direto, sem chroma key. |
| \`svg/parte-N/\` | Os SVGs animados. Abra no Chrome ou Firefox para ver a animação; edite o texto no fim do arquivo (objeto \`window.CLIP\`). |
| \`src/\` | Motor de animação (\`runtime.js\`, \`templates.js\`, \`templates-ilustra.js\`), lista de clipes (\`clips.mjs\`) e fontes. |
| \`previa/\` | Amostra e folhas de contato. |

## Como usar na edição

- **Tela cheia (TELA):** corte do talking head para o B-roll no momento indicado na coluna "Entra em". A animação de entrada leva de 0,5 a 2 s e depois o quadro fica parado; corte de volta quando quiser. Se precisar de mais tempo, congele o último quadro.
- **Sobreposição (SOBRE):** fica por cima do talking head. Use o MOV com alfa, ou o MP4 verde com chroma key (no CapCut: *Recorte → Chroma key*, cor verde). Já vêm com entrada e saída animadas.
- **Selos de evidência:** as sobreposições \`selo-*\` repetem a regra do roteiro: toda afirmação sobre pessoa ou organização nomeada aparece com a categoria da fonte. Cores: vermelho = decisão judicial · azul = documento oficial · âmbar = reportagem · violeta = testemunho · branco = academia · cinza = versão da organização. Os B-rolls de tela cheia que citam fonte já trazem o mesmo selo no rodapé.
- **Clipes sóbrios:** os marcados como "sóbrio" (Abadiânia, Maranhão, Shakahola, Jonestown, Guaratuba) têm animação mais lenta e sem cor de destaque, seguindo a regra de tom do roteiro. Não acrescente trilha cômica neles.
- **Motivos recorrentes:** contador de águias (E1, E2, E3), marcadores de pergunta em aberto/respondida (loops 00, 01 e 02) e a expressão "magia negra" (E1 e E3) amarram os três episódios.

## Antes de publicar

- **Grupo Águia (E3, contador e "duas águias"):** o nome e o papel do grupo nas prisões de 1992 ainda precisam ser confirmados no Projeto Humanos e no acórdão da revisão criminal. Se não se confirmar, não use \`contador-aguias-2\` nem \`duas-aguias\`.
- **Trecho opcional:** \`nome-lucia-helena-galvao\` e \`selo-mangue-jornalismo\` (Parte 1) acompanham o parágrafo marcado como opcional no roteiro.
- **Ilustrações:** a folha pautada (E2), a fita cassete (E3), o recibo (E3), o jornal (E1) e as fichas são reconstituições gráficas e dizem isso na tela. Não as apresente como documento real.
- **Datas e números:** seguem o roteiro e a lista de checagem da conversa. Se a checagem mudar algum dado, edite \`src/clips.mjs\` e renderize de novo.

## Como editar e renderizar de novo

Requer Node 18+, Playwright com Chromium e ffmpeg.

\`\`\`bash
node brolls/build.mjs                    # gera os SVGs e renderiza tudo
node brolls/build.mjs --only E1-05,E3-12  # só alguns clipes
node brolls/build.mjs --svg-only          # só os SVGs
node brolls/gerar-guia.mjs                # atualiza este README
\`\`\`

Para mudar um texto, altere o clipe em \`src/clips.mjs\` (os IDs são atribuídos pela ordem da lista) e rode o build daquele ID.

## Planilha de entrada
${tabela}
`;

fs.writeFileSync(path.join(ROOT, 'README.md'), md);
console.log('README.md gerado:', total, 'clipes');
