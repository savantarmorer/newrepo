// Letterings: sobreposições com fundo transparente, para usar em cima da câmera
import { C, W, X0, BW, anim, rich, layout, label } from '../kit.mjs';

// Faixa inferior discreta (lettering fixo de módulo ou de bloco)
function strip(text, { y = 960, size = 28, d = 0.3, tag } = {}) {
  const tagW = tag ? layout(tag, { size: size * 0.78, font: 'mono', weight: 700, ls: 0.1, upper: true }).w + 40 : 0;
  const L = layout(text, { size, weight: 700, w: BW - tagW - 60 });
  const h = L.h + size * 0.9;
  const w = L.w + tagW + 70;
  let svg = anim('grow', d, `<rect x="${X0}" y="${y - h}" width="${w}" height="${h}" fill="${C.bg}" opacity=".84"/>`, { t: 0.5 });
  svg += anim('fade', d, `<rect x="${X0}" y="${y - h}" width="10" height="${h}" fill="${C.amber}"/>`, { t: 0.3 });
  if (tag) svg += anim('fade', d + 0.25, label(tag, { x: X0 + 34, y: y - h + size * 0.45 + size * 0.78, size: size * 0.78 }));
  svg += anim('left', d + 0.3, rich(text, { x: X0 + 34 + tagW, y: y - h + size * 0.45 + size * 0.8, size, weight: 700, w: BW - tagW - 60 }).svg);
  return svg;
}

const lt = (id, title, cue, text, o = {}) => ({
  id, aula: 'L', title, cue, overlay: true, hold: o.hold ?? 5,
  render() { return { body: strip(text, o), kicker: null }; }
});

export default [
  lt('L-01', 'Conteúdo educativo, não substitui advogado',
    'Aula 1.1 (apresentação) e lettering fixo do módulo 5',
    'Conteúdo educativo. Não substitui advogado no caso concreto.'),
  lt('L-02', 'Conteúdo educativo, regras de setembro de 2026',
    'Lettering fixo de todas as aulas do módulo 3',
    'Conteúdo educativo. Regras válidas em setembro de 2026.'),
  lt('L-03', 'Lettering fixo do módulo 6',
    'Lettering fixo de todas as aulas do módulo 6',
    'Conteúdo educativo. Não substitui advogado no caso concreto. Regras válidas em setembro de 2026.'),
  lt('L-04', 'Regras do período eleitoral de 2026',
    'Aula 6.4, blocos 1 a 3',
    'Regras do período eleitoral de 2026.'),
  {
    id: 'L-05', aula: 'L', title: 'Sem documento, é lenda',
    cue: 'Aula 1.1 — “Tem uma regra que eu uso em todo roteiro meu. Sem documento, é lenda.” (volta ao longo do curso)',
    overlay: true, hold: 4,
    render() {
      const t = 'Sem documento, é lenda.';
      const size = 88;
      const L = layout(t, { size, font: 'display', w: 4000 });
      const y = 900;
      let body = anim('grow', 0.2, `<rect x="${X0 - 30}" y="${y - size * 1.05}" width="${L.w + 60}" height="${size * 1.4}" fill="${C.amber}"/>`, { t: 0.5 });
      body += anim('up', 0.45, rich(t, { x: X0, y, size, font: 'display', fill: C.bg, w: 4000 }).svg);
      return { body, kicker: null };
    }
  },
  {
    id: 'L-06', aula: 'L', title: 'Nome do apresentador',
    cue: 'Aula 1.1 [APRESENTAÇÃO] — “Eu sou o Iuri Piragibe.”',
    overlay: true, hold: 4,
    render() {
      const y = 860;
      const nw = Math.max(layout('Iuri Piragibe', { size: 60, font: 'display', w: 4000 }).w, layout('Jornalista investigativo e formado em direito', { size: 32, weight: 500, w: 4000 }).w);
      let body = anim('grow', 0.2, `<rect x="${X0}" y="${y}" width="${nw + 80}" height="130" fill="${C.bg}" opacity=".84"/>`, { t: 0.5 });
      body += anim('fade', 0.2, `<rect x="${X0}" y="${y}" width="12" height="130" fill="${C.amber}"/>`, { t: 0.3 });
      body += anim('left', 0.35, rich('Iuri Piragibe', { x: X0 + 40, y: y + 62, size: 60, font: 'display', w: 1200 }).svg);
      body += anim('left', 0.6, rich('Jornalista investigativo e formado em direito', { x: X0 + 40, y: y + 112, size: 32, weight: 500, fill: C.ink, w: 1200 }).svg);
      return { body, kicker: null };
    }
  },
  lt('L-07', 'Exemplo fictício',
    'Sobre qualquer tela com exemplo inventado (Cidade Exemplo, Alimentos Modelo)',
    'Os nomes e números desta tela são fictícios.', { tag: 'Exemplo' }),
  lt('L-08', 'Dados pessoais tarjados',
    'Aula 8.1, etapa 4 [TELA: protocolos e respostas, com dados pessoais tarjados] e qualquer documento real na tela',
    'Dados pessoais tarjados.', { tag: 'Documento' }),
  lt('L-09', 'Caso de apoio (modelo)',
    'Aula 8.1 — entrada de cada [CASO DE APOIO]',
    '[Nome do caso] · [veículo ou organização], [ano]', { tag: 'Caso de apoio' })
];
