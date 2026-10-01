// Módulo 8 — Estudo de caso
import {
  C, W, H, X0, X1, BW, anim, rich, layout, heading, statement, list, columns, compare, flow, timeline, paperCard,
  stamp, table, box, icon, badge, arrowH, arrowV, arrowPath, pill, checklist, calendar, label
} from '../kit.mjs';

const MODELO = 'Modelo: trocar os campos [PREENCHER] pelos dados do caso antes de exportar.';
const dow = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();

const ETAPAS = [
  { t: 'A suspeita', q: 'Como chegou. E a pergunta da aula 1.2: {a|quem ganha com isso?}', ref: 'aula 1.2' },
  { t: 'A hipótese', q: 'A hipótese inicial, {a|quando ela mudou} e a versão final.', ref: 'aula 1.3' },
  { t: 'As fontes', q: 'Os tipos de fonte e o combinado: on, off ou background. {r|Nada que identifique ninguém.}', ref: 'aulas 2.1 e 2.2' },
  { t: 'Os pedidos via LAI', q: 'Quantos pedidos, o que veio, o que foi negado, {a|quantos recursos}.', ref: 'módulo 3' },
  { t: 'Os dados', q: 'As bases usadas. {a|A que mais rendeu} e a que menos rendeu.', ref: 'módulo 4' },
  { t: 'Os cruzamentos e o erro', q: 'O cruzamento que abriu a história. {r|E o que quase derrubou.}', ref: 'aula 4.6' },
  { t: 'A checagem', q: 'Quantas afirmações numeradas. {a|Quantas caíram.}', ref: 'aula 5.4' },
  { t: 'A revisão jurídica', q: 'Cada frase de imputação revisada. {a|O que foi cortado e reescrito.}', ref: 'módulo 6' },
  { t: 'O pedido de posicionamento', q: 'Data, prazo, resposta e {a|como ela entrou no vídeo}.', ref: 'aula 6.4' },
  { t: 'A publicação', q: 'O gancho, o título e {a|o que foi descartado}.', ref: 'aulas 5.4 e 7.1' },
  { t: 'A repercussão', q: 'O que aconteceu {a|depois de publicado}.', ref: 'aula 6.3' },
  { t: 'Erros e aprendizados', q: 'O que eu faria {r|diferente}. E o que eu faria {g|igual}.', ref: 'o curso inteiro' }
];

// Trilha de progresso das 12 etapas
function track(cur, { y = 870, d = 0.2 } = {}) {
  const n = 12; const gap = 10; const sw = (BW - gap * (n - 1)) / n;
  let svg = '';
  for (let i = 0; i < n; i++) {
    const x = X0 + i * (sw + gap);
    const on = i < cur; const now = i === cur;
    const col = now ? C.amber : on ? '#7A5A12' : C.s3;
    const hh = now ? 26 : 14;
    const g = `<rect x="${x}" y="${y - hh / 2}" width="${sw}" height="${hh}" fill="${col}"/>` + rich(String(i + 1).padStart(2, '0'), { x: x + sw / 2, y: y + 48, size: 20, font: 'mono', weight: 700, fill: now ? C.amber : C.ink3, anchor: 'middle', w: sw }).svg;
    svg += now ? anim('pop', d + 0.6, g) : anim('fade', d + i * 0.03, g);
  }
  return svg;
}

function etapa(n, id, cue, extra = {}) {
  const e = ETAPAS[n - 1];
  return {
    id, aula: '8.1', title: `Etapa ${n}, ${e.t.toLowerCase()}`, cue, ...extra,
    render() {
      let body = anim('fade', 0.2, label(`Etapa ${String(n).padStart(2, '0')} de 12`, { x: X0, y: 360, size: 30 }));
      let ts = 120;
      while (layout(e.t, { size: ts, font: 'display', w: BW }).lines.length > 1 && ts > 84) ts -= 4;
      body += anim('up', 0.4, rich(e.t, { x: X0, y: 500, size: ts, font: 'display', w: BW, lh: 1 }).svg);
      body += anim('up', 1.0, rich(e.q, { x: X0, y: 620, size: 44, weight: 500, fill: C.ink, w: BW - 100 }).svg);
      body += pill(`Revisão: ${e.ref}`, { x: X0, y: 740, size: 26, color: C.ink2, d: 1.6 }).svg;
      body += track(n - 1, { d: 0.3 });
      return { body };
    }
  };
}

export default [
  {
    id: '8.1-01', aula: '8.1', title: 'Agora eu mostro o que eu fiz',
    cue: 'ABERTURA — “Durante sete módulos, eu te disse o que fazer. Agora eu vou te mostrar o que eu fiz. Incluindo o que eu fiz errado.”',
    render() {
      let body = statement('Durante sete módulos, eu te disse o que fazer.\n{a|Agora eu vou te mostrar o que eu fiz.}', { y: 420, size: 72, d: 0.3, step: 1.2 }).svg;
      body += anim('up', 2.8, rich('{r|Incluindo o que eu fiz errado.}', { x: W / 2, y: 760, size: 60, font: 'display', anchor: 'middle', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '8.1-02', aula: '8.1', title: 'As 12 etapas da investigação',
    cue: 'ABERTURA — mapa do estudo de caso, etapa por etapa (serve de abertura e de volta ao mapa entre etapas)',
    render() {
      const h = heading('Uma investigação em 12 etapas');
      let body = h.svg;
      const cols = 4; const gap = 24; const cw = (BW - gap * (cols - 1)) / cols; const ch = 150;
      ETAPAS.forEach((e, i) => {
        const x = X0 + (i % cols) * (cw + gap); const y = 320 + Math.floor(i / cols) * (ch + gap);
        body += anim('pop', 0.5 + i * 0.18, box({ x, y, w: cw, h: ch, fill: C.s1, stroke: C.line }) + rich(String(i + 1).padStart(2, '0'), { x: x + 24, y: y + 50, size: 28, font: 'mono', weight: 700, fill: C.amber, w: 100 }).svg + rich(e.t, { x: x + 24, y: y + 104, size: 32, font: 'display', w: cw - 48, lh: 1.05 }).svg);
      });
      return { body };
    }
  },
  etapa(1, '8.1-03', 'ETAPA 1 — A suspeita: “quem ganha com isso?”'),
  {
    id: '8.1-04', aula: '8.1', title: 'Caso de apoio, a origem do orçamento secreto',
    cue: '[CASO DE APOIO: a série do Estadão sobre o orçamento secreto nasceu de relatos de bastidor, no fim de 2020]',
    render() {
      const h = heading('Caso de apoio: o orçamento secreto', { sub: 'Série do Estadão. Como começou.' });
      let body = h.svg;
      body += flow([
        { t: 'Relatos de bastidor', n: false, color: C.ink2 },
        { t: 'Fim de 2020', n: false },
        { t: 'Eleição para a presidência da Câmara', n: false, color: C.blue }
      ], { y: 400, h: 240, d0: 0.6, step: 0.8, size: 44 }).svg;
      body += anim('up', 3.2, rich('A suspeita chegou como conversa. {a|A matéria saiu dos documentos.}', { x: X0, y: 820, size: 40, weight: 700, w: BW }).svg);
      return { body, source: 'Estadão, série Orçamento secreto.' };
    }
  },
  etapa(2, '8.1-05', 'ETAPA 2 — A hipótese: inicial, quando mudou, versão final'),
  etapa(3, '8.1-06', 'ETAPA 3 — As fontes (⚠️ nada que permita identificar fontes, nem indiretamente)'),
  etapa(4, '8.1-07', 'ETAPA 4 — Os pedidos via LAI [TELA: protocolos e respostas, com dados pessoais tarjados]'),
  {
    id: '8.1-08', aula: '8.1', title: 'Caso de apoio, cartão corporativo',
    cue: '[CASO DE APOIO: a Fiquem Sabendo pediu os gastos do cartão corporativo em 18/12/2022 e recebeu a resposta em 11/01/2023]',
    render() {
      const h = heading('Caso de apoio: o cartão corporativo', { sub: 'Fiquem Sabendo. Gastos do cartão corporativo da Presidência.' });
      let body = h.svg;
      body += calendar({ x: X0 + 60, y: 400, cell: 76, days: 31, startDow: dow(2022, 12, 1), title: 'Dezembro de 2022', marks: { 18: { color: C.amber, d: 1.2 } }, d: 0.5 });
      body += calendar({ x: 760, y: 400, cell: 76, days: 31, startDow: dow(2023, 1, 1), title: 'Janeiro de 2023', marks: { 11: { color: C.green, d: 2.4 } }, d: 0.9 });
      const rx = 1380;
      body += anim('up', 1.6, label('18/12/2022', { x: rx, y: 440 }) + rich('O pedido, {a|antes de o sigilo vencer}.', { x: rx, y: 494, size: 34, weight: 700, w: X1 - rx }).svg);
      body += anim('up', 2.8, label('11/01/2023', { x: rx, y: 640, color: C.green }) + rich('A resposta.', { x: rx, y: 694, size: 34, weight: 700, w: X1 - rx }).svg);
      body += anim('pop', 3.6, rich('24 dias', { x: rx, y: 850, size: 72, font: 'display', fill: C.amber, w: X1 - rx }).svg);
      return { body, source: 'Fiquem Sabendo. O levantamento recebeu o Prêmio Cláudio Weber Abramo de Jornalismo de Dados de 2023.' };
    }
  },
  etapa(5, '8.1-09', 'ETAPA 5 — Os dados: a base que mais rendeu e a que menos rendeu'),
  {
    id: '8.1-10', aula: '8.1', title: 'Caso de apoio, os números do orçamento secreto',
    cue: '[CASO DE APOIO: 101 ofícios, R$ 3 bilhões em emendas de relator (RP-9), tratores até 259% acima da referência]',
    render() {
      const h = heading('Caso de apoio: a base eram ofícios');
      let body = h.svg;
      const items = [['101', 'ofícios'], ['R$ 3 bi', 'em emendas de relator, identificadas pelo código {a|RP-9}'], ['até 259%', 'acima da referência no preço de tratores']];
      const cw = 520; const gap = (BW - cw * 3) / 2;
      items.forEach(([n, t], i) => {
        const x = X0 + i * (cw + gap); const d = 0.6 + i * 0.9;
        body += anim('pop', d, rich(n, { x, y: 520, size: 100, font: 'display', fill: i === 2 ? C.red : C.amber, w: cw + 100 }).svg);
        body += anim('up', d + 0.4, `<rect x="${x}" y="560" width="${cw}" height="4" fill="${C.line}"/>` + rich(t, { x, y: 630, size: 36, weight: 500, w: cw }).svg);
      });
      body += anim('up', 3.6, rich('Documento oficial, número por número.', { x: X0, y: 880, size: 36, weight: 700, fill: C.ink2, w: BW }).svg);
      return { body, source: 'Estadão, série Orçamento secreto.' };
    }
  },
  etapa(6, '8.1-11', 'ETAPA 6 — Os cruzamentos e o erro'),
  {
    id: '8.1-12', aula: '8.1', title: 'O erro que quase derrubou',
    cue: 'ETAPA 6 — “o que quase me derrubou foi [um homônimo, uma data errada, um dado desatualizado]… vínculo não é culpa”',
    warn: MODELO,
    render() {
      const h = heading('O que quase derrubou');
      const c = columns([
        { head: 'Um homônimo', icon: 'users', color: C.red, body: 'Mesmo nome, outra pessoa.' },
        { head: 'Uma data errada', icon: 'cal', color: C.red, body: 'A sequência muda. A história também.' },
        { head: 'Um dado desatualizado', icon: 'clock', color: C.red, body: 'O sócio já tinha saído da empresa.' }
      ], { y: 320, h: 360, size: 32, headSize: 38, d0: 0.5, step: 0.6 });
      let body = h.svg + c.svg;
      body += anim('fade', 2.4, label('No caso: [PREENCHER] · descobri porque [PREENCHER]', { x: X0, y: 760, color: C.ink2, size: 24 }));
      body += anim('up', 3.0, rich('{a|Vínculo não é culpa.}', { x: X0, y: 880, size: 72, font: 'display', w: BW }).svg);
      return { body };
    }
  },
  etapa(7, '8.1-13', 'ETAPA 7 — A checagem [TELA: trecho do roteiro com a coluna de fontes]'),
  {
    id: '8.1-14', aula: '8.1', title: 'Afirmações que caíram na checagem',
    cue: 'ETAPA 7 — “O roteiro teve [N] afirmações numeradas. [N] caíram na checagem.”',
    warn: MODELO,
    render() {
      const h = heading('Afirmações numeradas', { sub: 'Cada uma com fonte. As sem fonte caem.' });
      let body = h.svg;
      const fall = [3, 7];
      for (let i = 0; i < 10; i++) {
        const col = i % 2; const row = Math.floor(i / 2);
        const x = X0 + col * 860; const y = 360 + row * 100; const d = 0.5 + i * 0.12;
        const wbar = [520, 600, 470, 560, 610, 500, 580, 440, 590, 530][i];
        let g = rich(String(i + 1).padStart(2, '0'), { x, y: y + 34, size: 28, font: 'mono', weight: 700, fill: C.amber, w: 80 }).svg + `<rect x="${x + 70}" y="${y + 14}" width="${wbar}" height="22" fill="${C.s3}"/>`;
        body += fall.includes(i) ? anim('dim', 3.0, anim('left', d, g)) : anim('left', d, g);
        if (fall.includes(i)) {
          body += anim('draw', 2.6, `<path d="M${x - 6} ${y + 25} H${x + 80 + wbar}" stroke="${C.red}" stroke-width="6" fill="none" pathLength="1"/>`, { t: 0.4 });
          body += pill('caiu', { x: x + 100 + wbar, y: y + 25, color: C.red, size: 22, d: 3.0 }).svg;
        } else {
          body += badge('ok', { x: x + 100 + wbar, y: y + 7, s: 36, d: 2.2 + i * 0.05 });
        }
      }
      body += anim('up', 3.6, rich('No caso: [PREENCHER] afirmações, [PREENCHER] caíram.', { x: X0, y: 900, size: 34, font: 'mono', weight: 700, fill: C.ink2, w: BW }).svg);
      return { body, source: 'Ilustração.' };
    }
  },
  etapa(8, '8.1-15', 'ETAPA 8 — A revisão jurídica'),
  {
    id: '8.1-16', aula: '8.1', title: 'Uma frase antes e depois da revisão',
    cue: '[TELA: uma frase antes e depois da revisão]',
    warn: MODELO,
    render() {
      const h = heading('Antes e depois da revisão');
      const c = compare(
        { head: 'Antes', body: '[PREENCHER: a frase original, como estava no roteiro]', foot: 'cortada ou reescrita' },
        { head: 'Depois', body: '[PREENCHER: a frase revisada, como foi ao ar]', foot: 'motivo: [artigo ou tese]' },
        { y: 330, h: 460, size: 44 }
      );
      return { body: h.svg + c };
    }
  },
  etapa(9, '8.1-17', 'ETAPA 9 — O pedido de posicionamento'),
  etapa(10, '8.1-18', 'ETAPA 10 — A publicação: gancho, título e o que foi descartado'),
  etapa(11, '8.1-19', 'ETAPA 11 — A repercussão'),
  {
    id: '8.1-20', aula: '8.1', title: 'Caso de apoio, a repercussão',
    cue: '[CASO DE APOIO: TCU e CGU; STF, 19/12/2022, ADPFs 850, 851, 854 e 1014, 6 a 5; Prêmio IREE 2021; Prêmio Cláudio Weber Abramo 2023]',
    render() {
      const h = heading('Caso de apoio: o que veio depois');
      const c = columns([
        { head: 'Controle', icon: 'search', color: C.blue, body: 'O orçamento secreto levou a apurações no {a|TCU} e na {a|CGU}.' },
        { head: 'STF', icon: 'gavel', color: C.amber, body: 'Em {a|19/12/2022}, práticas declaradas inconstitucionais nas ADPFs 850, 851, 854 e 1014, por {a|6 votos a 5}.' },
        { head: 'Prêmios', icon: 'seal', color: C.green, body: 'Orçamento secreto: Prêmio IREE de Jornalismo de 2021. Cartões corporativos: Prêmio Cláudio Weber Abramo de Jornalismo de Dados de 2023.' }
      ], { y: 320, h: 560, size: 32, headSize: 40, d0: 0.5, step: 0.9 });
      return { body: h.svg + c.svg, source: 'STF; IREE; Prêmio Cláudio Weber Abramo de Jornalismo de Dados.' };
    }
  },
  etapa(12, '8.1-21', 'ETAPA 12 — Erros e aprendizados'),
  {
    id: '8.1-22', aula: '8.1', title: 'Exercício final',
    cue: 'EXERCÍCIO FINAL — preencha o template etapa por etapa, com o checklist pré-publicação, e poste no Discord do Ágora',
    render() {
      const h = heading('Agora é a sua vez');
      let body = h.svg;
      body += list([
        { t: 'Pegue a pauta do curso.' },
        { t: 'Preencha este template, etapa por etapa.', sub: 'Junto com o checklist pré-publicação dos bônus.' },
        { t: 'Poste na sala do curso no Discord do Ágora.', sub: 'Você recebe a leitura de outros alunos. E a turma aprende com a sua pauta.' }
      ], { y: 330, w: 980, size: 42, subSize: 30, gap: 44, d0: 0.5, step: 1.0 }).svg;
      const gx = 1240; const cs = 120; const gap = 20;
      for (let i = 0; i < 12; i++) {
        const x = gx + (i % 4) * (cs + gap); const y = 340 + Math.floor(i / 4) * (cs + gap);
        body += anim('pop', 1.6 + i * 0.15, `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="${C.s1}" stroke="${C.amber}" stroke-width="3"/>` + rich(String(i + 1).padStart(2, '0'), { x: x + cs / 2, y: y + cs / 2 + 14, size: 40, font: 'mono', weight: 700, fill: C.amber, anchor: 'middle', w: cs }).svg);
      }
      body += anim('fade', 3.6, label('As 12 etapas', { x: gx, y: 340 + 3 * (cs + gap) + 20, color: C.ink2 }));
      return { body };
    }
  },
  {
    id: '8.1-23', aula: '8.1', title: 'Agora você tem uma pauta',
    cue: 'ENCERRAMENTO — “Oito módulos atrás, você tinha uma bomba no celular. Agora você tem uma pauta.”',
    render() {
      let body = anim('dim', 2.0, anim('up', 0.3, icon('phone', { x: X0, y: 300, s: 110, color: C.red, sw: 3 }) + rich('Oito módulos atrás, você tinha {r|uma bomba no celular}.', { x: X0 + 150, y: 370, size: 52, font: 'display', w: BW - 150 }).svg));
      body += anim('up', 2.2, rich('Agora você tem {a|uma pauta}.', { x: X0, y: 520, size: 72, font: 'display', w: BW }).svg);
      body += checklist(['Hipótese', 'Fontes protegidas', 'Pedidos protocolados', 'Dados cruzados', 'Checagem', 'Revisão jurídica', 'O outro lado'], { x: X0, y: 600, w: BW, size: 36, gap: 22, d0: 3.0, step: 0.35, cols: 3, maxH: 360 }).svg;
      return { body };
    }
  },
  {
    id: '8.1-24', aula: '8.1', title: 'Matéria ou funil, as duas são jornalismo',
    cue: 'ENCERRAMENTO — “Pode ser que ela vire matéria. Pode ser que ela morra no funil. As duas coisas são jornalismo.”',
    render() {
      let body = '';
      const cx = 700;
      body += anim('fade', 0.3, `<polygon points="${cx - 420},300 ${cx + 420},300 ${cx + 70},640 ${cx + 70},760 ${cx - 70},760 ${cx - 70},640" fill="${C.s1}" stroke="${C.ink2}" stroke-width="4"/>`);
      body += anim('fade', 0.5, rich('PAUTA', { x: cx, y: 270, size: 30, font: 'mono', weight: 700, fill: C.amber, anchor: 'middle', w: 400, ls: 0.1 }).svg);
      for (let k = 0; k < 7; k++) body += anim('down', 0.6 + k * 0.12, `<rect x="${cx - 300 + k * 90}" y="${330 + (k % 2) * 40}" width="54" height="68" fill="${C.paper}"/>`);
      body += arrowV(cx, 780, 900, { d: 1.8, color: C.green, sw: 6 });
      body += anim('up', 2.2, rich('Vira matéria', { x: cx, y: 960, size: 44, font: 'display', fill: C.green, anchor: 'middle', w: 600 }).svg);
      body += arrowPath(`M${cx + 260} 480 C${cx + 380} 480 ${cx + 420} 560 ${cx + 520} 560`, { d: 2.6, color: C.ink2, sw: 6, end: [cx + 520, 560, 0] });
      body += anim('up', 3.0, rich('Morre no funil', { x: cx + 560, y: 576, size: 44, font: 'display', fill: C.ink2, w: 600 }).svg);
      body += anim('pop', 3.8, box({ x: 1300, y: 760, w: 500, h: 200, fill: C.amber, stroke: C.amber }) + rich('As duas coisas são jornalismo.', { x: 1330, y: 840, size: 44, font: 'display', fill: C.bg, w: 440, lh: 1.05 }).svg);
      return { body };
    }
  },
  {
    id: '8.1-25', aula: '8.1', title: 'Sem documento, é lenda. Com documento, é notícia',
    cue: 'ENCERRAMENTO — “Sem documento, é lenda. Com documento, é notícia.”',
    hold: 3,
    render() {
      const body = statement('Sem documento, é lenda.\n{a|Com documento, é notícia.}', { size: 92, w: BW, d: 0.4, step: 1.4 }).svg;
      return { body, kicker: null };
    }
  },
  {
    id: '8.1-26', aula: '8.1', title: 'Até a próxima investigação',
    cue: 'ENCERRAMENTO — “Obrigado. Até a próxima investigação.”',
    hold: 3,
    render() {
      let body = statement('Obrigado.', { y: 500, size: 130, d: 0.3 }).svg;
      body += anim('up', 1.2, rich('Até a próxima investigação.', { x: W / 2, y: 640, size: 56, weight: 700, fill: C.amber, anchor: 'middle', w: BW }).svg);
      return { body, kicker: null };
    }
  }
];
