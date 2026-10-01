// Módulo 7 — Construção da matéria
import {
  C, W, H, X0, X1, BW, anim, rich, layout, heading, statement, list, columns, compare, flow, timeline, paperCard,
  stamp, table, box, icon, badge, arrowH, arrowV, arrowPath, edge, node, pill, redact, checklist, docSheet, label
} from '../kit.mjs';

const FIC = 'Exemplo fictício.';

// Folha de papel com cabeçalho e linhas cinza; devolve só o desenho
function paper(x, y, w, h, { head = true } = {}) {
  let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.paper}"/>`;
  if (head) {
    g += `<rect x="${x + 40}" y="${y + 34}" width="46" height="46" fill="none" stroke="${C.pInk2}" stroke-width="3"/>`;
    g += `<rect x="${x + 100}" y="${y + 40}" width="${w * 0.4}" height="12" fill="${C.pLine}"/><rect x="${x + 100}" y="${y + 62}" width="${w * 0.26}" height="10" fill="${C.pLine}"/>`;
  }
  return g;
}
const greyLine = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="12" fill="${C.pLine}"/>`;

// Barra de vídeo segmentada
function videoBar(segs, { x = X0, y = 480, w = BW, h = 90, d0 = 0.5, step = 0.35, gap = 6 } = {}) {
  const total = segs.reduce((a, s) => a + s.w, 0);
  let svg = '';
  let xx = x;
  segs.forEach((s, i) => {
    const sw = (s.w / total) * w - gap;
    const dd = s.d ?? d0 + i * step;
    const fill = s.fill ?? C.s3;
    const ink = s.ink ?? (fill === C.s3 || fill === C.s2 || fill === C.s1 ? C.ink : C.bg);
    let inner = `<rect x="${xx}" y="${y}" width="${sw}" height="${h}" fill="${fill}"/>`;
    if (s.icon) inner += icon(s.icon, { x: xx + 14, y: y + h / 2 - 16, s: 32, color: ink, sw: 3 });
    if (s.t) inner += rich(s.t, { x: xx + sw / 2 + (s.icon ? 16 : 0), y: y + h / 2 + 9, size: s.size ?? 24, font: 'mono', weight: 700, fill: ink, anchor: 'middle', w: sw - 10, upper: true }).svg;
    svg += anim('grow', dd, inner);
    if (s.top) svg += anim('fade', dd + 0.3, rich(s.top, { x: xx + sw / 2, y: y - 22, size: 22, font: 'mono', weight: 700, fill: s.topColor ?? C.ink2, anchor: 'middle', w: sw + 40 }).svg);
    if (s.sub) svg += anim('up', dd + 0.4, rich(s.sub, { x: xx + sw / 2, y: y + h + 44, size: s.subSize ?? 24, fill: C.ink2, anchor: 'middle', w: sw - 8, lh: 1.22 }).svg);
    s.x0 = xx; s.x1 = xx + sw;
    xx += sw + gap;
  });
  return { svg, segs };
}

export default [
  // ---------------------------------------------------------------- 7.1
  {
    id: '7.1-01', aula: '7.1', title: 'Trinta segundos',
    cue: 'ABERTURA — “Em 30 segundos, o público decide se entendeu a acusação ou se só ficou com raiva.”',
    render() {
      const cx = 1480; const cy = 540; const r = 210;
      let body = anim('up', 0.3, rich('Em {a|30 segundos}, o público decide se entendeu a acusação ou se só ficou com raiva.', { x: X0, y: 400, size: 66, font: 'display', w: 1000, lh: 1.08 }).svg);
      body += anim('fade', 0.4, `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.s3}" stroke-width="30"/>`);
      body += anim('draw', 0.8, `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.amber}" stroke-width="30" pathLength="1" transform="rotate(-90 ${cx} ${cy})"/>`, { t: 4 });
      body += anim('pop', 0.6, rich('0:30', { x: cx, y: cy + 40, size: 120, font: 'display', anchor: 'middle', w: 500 }).svg);
      body += anim('fade', 1.2, label('o gancho', { x: cx, y: cy + 110, size: 24, anchor: 'middle' }));
      return { body };
    }
  },
  {
    id: '7.1-02', aula: '7.1', title: 'Raiva dá clique',
    cue: 'ABERTURA — “Raiva dá clique. Entendimento dá credibilidade. Só a segunda sobrevive a um processo.”',
    render() {
      let body = anim('dim', 3.4, anim('up', 0.3, rich('Raiva dá clique.', { x: W / 2, y: 450, size: 96, font: 'display', anchor: 'middle', fill: C.red, w: BW }).svg));
      body += anim('up', 1.3, rich('Entendimento dá credibilidade.', { x: W / 2, y: 590, size: 96, font: 'display', anchor: 'middle', fill: C.amber, w: BW }).svg);
      body += anim('up', 2.6, icon('gavel', { x: 600, y: 740, s: 64, color: C.ink2 }) + rich('Só a segunda sobrevive a um processo.', { x: 690, y: 790, size: 48, weight: 700, w: 1200 }).svg);
      return { body };
    }
  },
  {
    id: '7.1-03', aula: '7.1', title: 'Investigação é complexa por natureza',
    cue: 'BLOCO 1 — “Várias empresas, vários anos, várias pessoas, vários documentos.”',
    render() {
      const h = heading('Complexa por natureza');
      let body = h.svg;
      const cols = [['Várias empresas', 'building'], ['Vários anos', 'cal'], ['Várias pessoas', 'person'], ['Vários documentos', 'doc']];
      const cw = 390; const gap = (BW - cw * 4) / 3;
      cols.forEach(([t, ic], i) => {
        const x = X0 + i * (cw + gap);
        const d = 0.6 + i * 0.7;
        body += anim('up', d, rich(t, { x, y: 380, size: 36, font: 'display', w: cw }).svg);
        for (let k = 0; k < 9; k++) {
          const ix = x + (k % 3) * 110; const iy = 430 + Math.floor(k / 3) * 110;
          body += anim('pop', d + 0.2 + k * 0.07, icon(ic, { x: ix, y: iy, s: 72, color: k === 4 ? C.amber : C.ink3, sw: 3 }));
        }
      });
      body += anim('up', 4.0, rich('O erro mais comum: contar a apuração {r|na ordem em que você fez}.', { x: X0, y: 880, size: 40, weight: 700, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '7.1-04', aula: '7.1', title: 'A ordem da sua semana',
    cue: 'BLOCO 1 — “É a ordem da sua semana, não a da história.”',
    render() {
      const h = heading('A ordem da sua semana não é a da história', { size: 60 });
      let body = h.svg;
      const lx = X0; const rx = 1040; const cw = 760;
      body += anim('fade', 0.4, label('A ordem em que você apurou', { x: lx, y: 360, color: C.red }));
      const week = [['SEG', 'achei a dispensa no diário oficial'], ['TER', 'fui atrás do CNPJ da empresa'], ['QUA', 'liguei para a secretaria'], ['QUI', 'cruzei com a lista de sócios']];
      let left = '';
      week.forEach(([dname, t], i) => {
        const y = 390 + i * 120;
        left += anim('left', 0.6 + i * 0.4, box({ x: lx, y, w: cw, h: 100, fill: C.s1, stroke: C.line }) + rich(dname, { x: lx + 30, y: y + 61, size: 26, font: 'mono', weight: 700, fill: C.ink3, w: 100 }).svg + rich(t, { x: lx + 130, y: y + 61, size: 32, w: cw - 160 }).svg);
      });
      body += anim('dim', 3.2, left);
      body += anim('stamp', 3.0, `<g transform="rotate(-4 500 640)">` + rich('A SUA JORNADA', { x: 500, y: 652, size: 44, font: 'display', fill: C.red, anchor: 'middle', w: 800 }).svg + '</g>');
      body += anim('fade', 3.6, label('A ordem da história', { x: rx, y: 360, color: C.green }));
      const story = [['1', 'O fato'], ['2', 'Por que ele importa'], ['3', 'Como você sabe']];
      story.forEach(([n, t], i) => {
        const y = 390 + i * 160;
        body += anim('right', 3.8 + i * 0.5, box({ x: rx, y, w: cw, h: 140, fill: C.s1, stroke: C.green, sw: 3 }) + rich(n, { x: rx + 50, y: y + 95, size: 64, font: 'display', fill: C.green, anchor: 'middle', w: 100 }).svg + rich(t, { x: rx + 110, y: y + 86, size: 44, font: 'display', w: cw - 140 }).svg);
      });
      body += anim('up', 5.6, rich('O público não precisa da sua jornada.', { x: X0, y: 950, size: 34, weight: 700, fill: C.amber, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '7.1-05', aula: '7.1', title: 'Três estruturas para texto',
    cue: '[TELA: três estruturas lado a lado]',
    render() {
      const h = heading('Três estruturas para texto');
      const c = columns([
        { head: 'Lide investigativo', icon: 'bolt', body: 'Começa pelo {a|fato mais forte que você consegue provar} e por que ele importa. Depois, o detalhe.' },
        { head: 'Narrativa cronológica', icon: 'clock', body: 'Na ordem dos acontecimentos. Para histórias com {a|começo, meio e fim} claros.' },
        { head: 'Caso, sistema, caso', icon: 'search', body: 'Um caso concreto abre o {a|sistema} que ele revela e volta ao caso.' }
      ], { y: 330, h: 440, size: 32, headSize: 38, d0: 0.5, step: 0.8 });
      const b = anim('up', 3.4, rich('Em todas: o {a|parágrafo-núcleo}, que diz qual é a história e por que ela importa.', { x: X0, y: 880, size: 38, weight: 700, w: BW }).svg);
      return { body: h.svg + c.svg + b };
    }
  },
  {
    id: '7.1-06', aula: '7.1', title: 'Lide investigativo',
    cue: 'BLOCO 2 — “começa pelo fato mais forte que você consegue provar e por que ele importa. Depois vem o detalhe.”',
    render() {
      const h = heading('Lide investigativo', { sub: 'Do mais forte para o detalhe.' });
      let body = h.svg;
      const cx = W / 2; const top = 350; const lh = 130;
      const ws = [1560, 1240, 920, 600, 280];
      const layers = [
        { t: 'O fato mais forte que você consegue provar', fill: C.amber, ink: C.bg, size: 42 },
        { t: 'Por que ele importa', fill: C.s3, ink: C.amber, size: 40, stroke: C.amber },
        { t: 'O detalhe', fill: C.s2, ink: C.ink, size: 36 },
        { t: 'O resto', fill: C.s1, ink: C.ink2, size: 30 }
      ];
      layers.forEach((l, i) => {
        const y = top + i * (lh + 10);
        const pts = `${cx - ws[i] / 2},${y} ${cx + ws[i] / 2},${y} ${cx + ws[i + 1] / 2},${y + lh} ${cx - ws[i + 1] / 2},${y + lh}`;
        body += anim('down', 0.6 + i * 0.6, `<polygon points="${pts}" fill="${l.fill}"${l.stroke ? ` stroke="${l.stroke}" stroke-width="3"` : ''}/>` + rich(l.t, { x: cx, y: y + lh / 2 + l.size * 0.36, size: l.size, font: 'display', fill: l.ink, anchor: 'middle', w: ws[i + 1] - 40 }).svg);
      });
      return { body };
    }
  },
  {
    id: '7.1-07', aula: '7.1', title: 'Narrativa cronológica',
    cue: 'BLOCO 2 — “Um contrato que nasce, cresce e explode.”',
    render() {
      const h = heading('Narrativa cronológica', { sub: 'Funciona quando a história tem começo, meio e fim claros.' });
      let body = h.svg;
      const base = 860; const bx = [360, 860, 1360]; const bh = [120, 260, 420]; const bw = 200;
      const names = ['NASCE', 'CRESCE', 'EXPLODE'];
      const subs = ['o contrato', 'os aditivos', 'o problema aparece'];
      body += anim('fade', 0.3, `<path d="M${X0} ${base} H${X1}" stroke="${C.lineUi}" stroke-width="3"/>`);
      bx.forEach((x, i) => {
        const d = 0.7 + i * 0.9;
        const col = i === 2 ? C.red : C.amber;
        body += anim('growY', d, `<rect x="${x}" y="${base - bh[i]}" width="${bw}" height="${bh[i]}" fill="${col}"/>`);
        body += anim('up', d + 0.5, rich(names[i], { x: x + bw / 2, y: base - bh[i] - 84, size: 44, font: 'display', fill: col, anchor: 'middle', w: 400 }).svg + rich(subs[i], { x: x + bw / 2, y: base - bh[i] - 46, size: 26, fill: C.ink2, anchor: 'middle', w: 400 }).svg);
        if (i < 2) body += arrowPath(`M${x + bw + 30} ${base - bh[i] - 60} Q${x + bw + 150} ${base - bh[i + 1] - 160} ${bx[i + 1] - 40} ${base - bh[i + 1] - 100}`, { d: d + 0.6, end: [bx[i + 1] - 40, base - bh[i + 1] - 100, 30] });
      });
      const ey = base - bh[2];
      let burst = '';
      [[bx[2], [-170, -150, -130]], [bx[2] + bw, [-50, -30, -10]]].forEach(([cx0, angs]) => {
        angs.forEach((ag) => {
          const a = (ag * Math.PI) / 180;
          burst += `<path d="M${cx0 + Math.cos(a) * 16} ${ey + Math.sin(a) * 16} L${cx0 + Math.cos(a) * 58} ${ey + Math.sin(a) * 58}" stroke="${C.red}" stroke-width="6" stroke-linecap="round"/>`;
        });
      });
      body += anim('pop', 3.4, burst);
      return { body, source: 'Ilustração.' };
    }
  },
  {
    id: '7.1-08', aula: '7.1', title: 'Caso, sistema, caso',
    cue: 'BLOCO 2 — “A merenda da escola X mostra o padrão de dispensas da secretaria, que volta à escola X.”',
    render() {
      const h = heading('Caso, sistema, caso');
      let body = h.svg;
      const y = 380; const hh = 440;
      const card = (x, w, tag, t, col, d) => anim('up', d, box({ x, y, w, h: hh, fill: C.s1, stroke: col, sw: 3 }) + `<rect x="${x}" y="${y}" width="${w}" height="10" fill="${col}"/>` + label(tag, { x: x + 30, y: y + 60, color: col }) + rich(t, { x: x + 30, y: y + hh - 90, size: 34, font: 'display', w: w - 60, lh: 1.1 }).svg);
      body += card(X0, 440, 'Caso', 'A merenda da escola X', C.amber, 0.5);
      body += anim('pop', 0.8, icon('building', { x: X0 + 150, y: y + 110, s: 140, color: C.amber, sw: 3 }));
      body += arrowH(X0 + 460, y + hh / 2, 620, { d: 1.4 });
      body += card(640, 640, 'Sistema', 'O padrão de dispensas da secretaria', C.blue, 1.6);
      for (let k = 0; k < 12; k++) {
        const ix = 690 + (k % 6) * 92; const iy = y + 100 + Math.floor(k / 6) * 100;
        body += anim('pop', 2.0 + k * 0.1, icon('building', { x: ix, y: iy, s: 64, color: k === 0 ? C.amber : C.blue, sw: 3 }));
      }
      body += arrowH(1300, y + hh / 2, 1340, { d: 3.4 });
      body += card(1360, 440, 'De volta ao caso', 'A escola X, agora com o contexto', C.amber, 3.6);
      body += anim('pop', 3.9, icon('building', { x: 1360 + 150, y: y + 110, s: 140, color: C.amber, sw: 3 }));
      return { body, source: FIC };
    }
  },
  {
    id: '7.1-09', aula: '7.1', title: 'O parágrafo-núcleo',
    cue: 'BLOCO 2 — nut graf: “Se você não consegue escrever esse parágrafo, ainda não sabe qual é a sua matéria.”',
    render() {
      let body = '';
      const px = X0; const py = 150; const pw = 820; const ph = 830;
      let doc = paper(px, py, pw, ph);
      [0.92, 0.88, 0.95, 0.6].forEach((f, i) => { doc += greyLine(px + 40, py + 130 + i * 32, (pw - 80) * f); });
      const par = rich('{h|Em dois anos, a Secretaria de Educação de Cidade Exemplo dispensou licitação 14 vezes para a mesma fornecedora de merenda.} {h|O dinheiro saiu da verba da alimentação escolar.}', { x: px + 40, y: py + 300, size: 32, w: pw - 80, fill: C.pInk, lh: 1.36, paper: true, hlColor: C.amber, hlOpacity: 0.55, hlD: 1.4, hlStep: 0.6 });
      doc += par.svg;
      [0.9, 0.94, 0.86, 0.92, 0.7, 0.9, 0.95, 0.5].forEach((f, i) => { doc += greyLine(px + 40, py + 330 + par.h + i * 32, (pw - 80) * f); });
      body += anim('up', 0.3, doc);
      body += anim('draw', 2.4, `<path d="M${px + pw + 20} ${py + 260} H${px + pw + 50} V${py + 270 + par.h} H${px + pw + 20}" stroke="${C.amber}" stroke-width="5" fill="none" pathLength="1"/>`, { t: 0.6 });
      const rx = 1040;
      body += anim('up', 2.6, label('Nut graf · parágrafo-núcleo', { x: rx, y: 330 }) + rich('Diz, em poucas linhas, {a|qual é a história} e {a|por que ela importa}.', { x: rx, y: 420, size: 48, font: 'display', w: X1 - rx, lh: 1.1 }).svg);
      body += anim('up', 4.0, box({ x: rx, y: 700, w: X1 - rx, h: 170, fill: C.s1, stroke: C.red, sw: 3 }) + rich('Não consegue escrever esse parágrafo? {r|Ainda não sabe qual é a sua matéria.}', { x: rx + 30, y: 770, size: 34, weight: 700, w: X1 - rx - 60 }).svg);
      return { body, source: FIC };
    }
  },
  {
    id: '7.1-10', aula: '7.1', title: 'A linha do tempo do vídeo',
    cue: '[TELA: linha do tempo do vídeo, com os blocos]',
    render() {
      const h = heading('A estrutura do vídeo', { sub: 'Fora de escala: os blocos são o grosso do tempo.' });
      const vb = videoBar([
        { t: 'Gancho', w: 200, fill: C.amber, top: '0:00–0:30', sub: 'o fato mais forte que você prova' },
        { t: 'Promessa', w: 220, fill: C.amber, top: '0:30–1:00', sub: 'o que o espectador vai entender' },
        { t: 'Bloco', w: 250, icon: 'doc', top: '2–3 min', sub: 'um documento, uma ideia' },
        { t: 'Bloco', w: 250, icon: 'doc', top: '2–3 min', sub: 'um documento, uma ideia' },
        { t: 'Outro lado', w: 260, fill: C.blue, top: 'a virada', topColor: C.blue, sub: 'o que a pessoa acusada diz, com destaque' },
        { t: 'Bloco', w: 250, icon: 'doc', top: '2–3 min', sub: 'um documento, uma ideia' },
        { t: 'Fechamento', w: 250, fill: C.green, top: 'o fim', topColor: C.green, sub: 'o que falta, o que vem, o que você fará' }
      ], { y: 470, h: 100, d0: 0.6, step: 0.45 });
      const ph = anim('slideL', 4.2, anim('fade', 4.0, `<path d="M${X0} 430 V600" stroke="${C.red}" stroke-width="5"/><path d="M${X0 - 12} 424 H${X0 + 12} L${X0} 440 Z" fill="${C.red}"/>`, { t: 0.3 }), { t: 5, style: `--dx:${BW}px` });
      return { body: h.svg + vb.svg + ph };
    }
  },
  {
    id: '7.1-11', aula: '7.1', title: 'Gancho, o fato e não a acusação',
    cue: 'BLOCO 3 — “O fato mais forte que você consegue provar. Não a acusação mais forte que você ouviu.”',
    render() {
      const h = heading('De 0 a 30 segundos: o gancho');
      const c = compare(
        { head: 'A acusação mais forte que você ouviu', body: '“Dizem que o secretário leva propina da fornecedora.”', foot: 'fonte: ouvi dizer' },
        { head: 'O fato mais forte que você prova', body: '“A secretaria pagou R$ 1,2 milhão a uma empresa aberta 40 dias antes do contrato.”', foot: 'fonte: PNCP + Receita Federal' },
        { y: 330, h: 420, size: 40 }
      );
      const b = anim('up', 3.4, rich('Não a acusação. {a|O fato.}', { x: X0, y: 880, size: 48, font: 'display', w: BW }).svg);
      return { body: h.svg + c + b, source: FIC };
    }
  },
  {
    id: '7.1-12', aula: '7.1', title: 'A promessa',
    cue: 'BLOCO 3 — “Ao final deste vídeo, você vai saber quanto a prefeitura pagou, a quem, e o que a empresa respondeu.”',
    render() {
      const h = heading('De 30 a 60 segundos: a promessa', { sub: 'O que o espectador vai entender até o fim.' });
      let body = h.svg;
      const vx = X0; const vy = 340; const vw = 980; const vh = 551;
      let player = `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#16181C" stroke="${C.line}" stroke-width="2"/>`;
      player += `<rect x="${vx}" y="${vy + vh - 8}" width="${vw}" height="8" fill="${C.s3}"/><rect x="${vx}" y="${vy + vh - 8}" width="${vw * 0.07}" height="8" fill="${C.red}"/>`;
      player += rich('0:42 / 12:40', { x: vx + vw - 24, y: vy + vh - 26, size: 20, font: 'mono', fill: C.ink2, anchor: 'end', w: 300 }).svg;
      player += icon('person', { x: vx + vw / 2 - 90, y: vy + 80, s: 180, color: C.ink3, sw: 2.5 });
      body += anim('up', 0.4, player);
      const cap = layout('“Ao final deste vídeo, você vai saber quanto a prefeitura pagou, a quem, e o que a empresa respondeu.”', { size: 30, w: vw - 120, weight: 500 });
      body += anim('fade', 1.0, `<rect x="${vx + 40}" y="${vy + vh - 60 - cap.h - 30}" width="${vw - 80}" height="${cap.h + 30}" fill="#000" opacity=".82"/>` + rich('“Ao final deste vídeo, você vai saber {a|quanto} a prefeitura pagou, {a|a quem}, e {a|o que a empresa respondeu}.”', { x: vx + vw / 2, y: vy + vh - 60 - cap.h - 30 + 30 + 30 * 0.6, size: 30, weight: 500, anchor: 'middle', w: vw - 120 }).svg);
      const rx = 1180;
      body += anim('fade', 2.6, label('Até o fim, cumprido', { x: rx, y: 400, color: C.green }));
      body += checklist(['Quanto a prefeitura pagou', 'A quem', 'O que a empresa respondeu'], { x: rx, y: 450, w: X1 - rx, size: 36, gap: 40, d0: 3.0, step: 0.7 }).svg;
      return { body, source: FIC };
    }
  },
  {
    id: '7.1-13', aula: '7.1', title: 'Um documento, uma ideia',
    cue: 'BLOCO 3 — “Depois, blocos de 2 a 3 minutos. Cada bloco com um documento. Um documento, uma ideia.”',
    render() {
      const h = heading('Blocos de 2 a 3 minutos', { sub: 'Cada bloco com um documento. Um documento, uma ideia.' });
      let body = h.svg;
      const items = [['Contrato no PNCP', 'Quanto foi pago'], ['Cartão CNPJ', 'Quem recebeu'], ['Quadro de sócios', 'Quem está por trás'], ['Diário oficial', 'Quem assinou']];
      const cw = 390; const gap = (BW - cw * 4) / 3; const y = 360;
      items.forEach(([doc, idea], i) => {
        const x = X0 + i * (cw + gap); const d = 0.6 + i * 0.7;
        let g = box({ x, y, w: cw, h: 520, fill: C.s1, stroke: C.line });
        g += label(`Bloco ${i + 1}`, { x: x + 28, y: y + 50, color: C.ink3 });
        g += `<rect x="${x + cw / 2 - 80}" y="${y + 80}" width="160" height="200" fill="${C.paper}"/>`;
        for (let k = 0; k < 6; k++) g += `<rect x="${x + cw / 2 - 56}" y="${y + 120 + k * 24}" width="${k === 3 ? 112 : 80 + (k % 2) * 30}" height="9" fill="${k === 3 ? C.amber : C.pLine}"/>`;
        g += rich(doc, { x: x + cw / 2, y: y + 330, size: 30, weight: 700, anchor: 'middle', w: cw - 40 }).svg;
        body += anim('up', d, g);
        body += arrowV(x + cw / 2, y + 360, y + 420, { d: d + 0.4, color: C.amber });
        body += anim('up', d + 0.6, rich(idea, { x: x + cw / 2, y: y + 475, size: 36, font: 'display', fill: C.amber, anchor: 'middle', w: cw - 30 }).svg);
      });
      return { body, source: FIC };
    }
  },
  {
    id: '7.1-14', aula: '7.1', title: 'A virada e o fechamento',
    cue: 'BLOCO 3 — “a virada: o outro lado… E o fechamento: o que ainda não se sabe, o que acontece a seguir e o que você vai fazer a respeito.”',
    render() {
      const h = heading('A virada e o fechamento');
      const c = columns([
        { head: 'A virada: o outro lado', icon: 'chat', color: C.blue, body: 'O que a pessoa acusada diz. {a|Com destaque.}' },
        { head: 'O fechamento', icon: 'flag', color: C.green, items: ['O que ainda não se sabe', 'O que acontece a seguir', 'O que você vai fazer a respeito'] }
      ], { y: 330, h: 520, size: 36, headSize: 44, d0: 0.5, step: 1.4, itemStep: 0.5 });
      return { body: h.svg + c.svg };
    }
  },
  {
    id: '7.1-15', aula: '7.1', title: 'Retenção sem exagero',
    cue: 'BLOCO 4 — “Uma é prometer mais do que você tem. A outra é revelar algo novo a cada bloco.”',
    render() {
      const h = heading('Retenção sem exagero', { sub: 'Retenção é o tempo que as pessoas ficam assistindo. É o que a plataforma mede.' });
      let body = h.svg;
      body += compare(
        { head: 'Prometer mais do que você tem', body: 'Funciona até o {r|primeiro processo}.' },
        { head: 'Revelar algo novo a cada bloco', body: 'Funciona {g|sempre}.' },
        { y: 340, h: 300, size: 44, minH: 260 }
      );
      const segW = (BW - 4 * 16) / 5;
      for (let i = 0; i < 5; i++) {
        const x = X0 + i * (segW + 16); const d = 3.0 + i * 0.35;
        body += anim('grow', d, `<rect x="${x}" y="760" width="${segW}" height="70" fill="${C.s3}"/>` + rich(`Bloco ${i + 1}`, { x: x + 24, y: 805, size: 24, font: 'mono', weight: 700, fill: C.ink2, w: segW, upper: true }).svg);
        body += pill('+ novo', { x: x + segW - 20, y: 795, color: C.green, size: 22, d: d + 0.4, anchor: 'end' }).svg;
      }
      body += anim('fade', 5.0, rich('Um documento novo, uma revelação nova, a cada bloco.', { x: X0, y: 900, size: 30, fill: C.ink2, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '7.1-16', aula: '7.1', title: 'Pergunta aberta e honesta',
    cue: 'BLOCO 4 — “mas o contrato tinha uma cláusula que ninguém explicou. Já chego nela.” E chegue nela.',
    render() {
      const h = heading('Pergunta aberta, honesta');
      let body = h.svg;
      const y = 640; const x1 = 520; const x2 = 1420;
      body += anim('draw', 0.4, `<path d="M${X0} ${y} H${X1}" stroke="${C.s3}" stroke-width="12" fill="none" pathLength="1"/>`, { t: 0.8 });
      body += anim('pop', 1.0, `<circle cx="${x1}" cy="${y}" r="16" fill="${C.amber}"/>`) + anim('fade', 1.0, rich('1:20', { x: x1, y: y + 60, size: 26, font: 'mono', weight: 700, fill: C.amber, anchor: 'middle', w: 200 }).svg);
      const q = '“Mas o contrato tinha uma cláusula que ninguém explicou. {a|Já chego nela.}”';
      const L = layout(q, { size: 34, w: 640, weight: 500 });
      body += anim('up', 1.3, box({ x: x1 - 340, y: y - 90 - L.h - 40, w: 700, h: L.h + 50, fill: C.s2, stroke: C.amber, sw: 2 }) + rich(q, { x: x1 - 310, y: y - 90 - L.h - 40 + 25 + 34 * 0.82, size: 34, weight: 500, w: 640 }).svg + `<path d="M${x1 - 20} ${y - 90} L${x1} ${y - 50} L${x1 + 20} ${y - 90} Z" fill="${C.s2}"/>`);
      body += arrowPath(`M${x1 + 20} ${y + 100} Q${(x1 + x2) / 2} ${y + 330} ${x2 - 20} ${y + 100}`, { d: 2.6, t: 1.4, color: C.ink2, end: [x2 - 20, y + 100, -40] });
      body += anim('pop', 4.0, `<circle cx="${x2}" cy="${y}" r="16" fill="${C.green}"/>`) + anim('fade', 4.0, rich('4:10', { x: x2, y: y + 60, size: 26, font: 'mono', weight: 700, fill: C.green, anchor: 'middle', w: 200 }).svg);
      body += anim('up', 4.3, rich('A cláusula, na tela.', { x: x2, y: y - 150, size: 34, weight: 700, anchor: 'middle', w: 600 }).svg);
      body += anim('up', 5.0, rich('{g|E chegue nela.}', { x: x2, y: y - 70, size: 44, font: 'display', anchor: 'middle', w: 600 }).svg);
      return { body };
    }
  },
  {
    id: '7.1-17', aula: '7.1', title: 'O título é uma promessa',
    cue: 'BLOCO 4 — volta à aula 5.4: título e thumbnail são publicação; a promessa do título tem de ser cumprida pelos documentos do vídeo',
    render() {
      const h = heading('O título promete. Os documentos cumprem.');
      let body = h.svg;
      const tx = X0; const ty = 360; const tw = 760; const th = tw * 9 / 16;
      let th1 = `<rect x="${tx}" y="${ty}" width="${tw}" height="${th}" fill="#14202A"/>`;
      th1 += rich('R$ 1,2 MILHÃO SEM LICITAÇÃO: PARA QUEM?', { x: tx + 40, y: ty + 110, size: 56, font: 'display', w: tw - 80, lh: 1.05 }).svg;
      th1 += rich('Cidade Exemplo · documentos', { x: tx + 40, y: ty + th - 40, size: 24, font: 'mono', fill: C.amber, w: tw - 80 }).svg;
      body += anim('up', 0.5, th1);
      body += anim('fade', 0.9, label('Título e thumbnail', { x: tx, y: ty - 24, color: C.ink2 }));
      const docs = [['Dispensa no diário oficial', 'sem licitação'], ['Contrato no PNCP', 'R$ 1,2 milhão'], ['Cartão CNPJ e sócios', 'para quem']];
      docs.forEach(([d1, d2], i) => {
        const y = 370 + i * 150; const d = 1.8 + i * 0.7;
        body += arrowPath(`M${tx + tw + 20} ${ty + th / 2} C${tx + tw + 120} ${ty + th / 2} ${1000} ${y + 50} ${1080} ${y + 50}`, { d, t: 0.6, end: [1080, y + 50, 0] });
        body += anim('left', d + 0.4, box({ x: 1100, y, w: 700, h: 110, fill: C.s1, stroke: C.green, sw: 3 }) + icon('doc', { x: 1124, y: y + 31, s: 48, color: C.green }) + rich(d1, { x: 1196, y: y + 48, size: 30, weight: 700, w: 520 }).svg + rich(d2, { x: 1196, y: y + 86, size: 24, font: 'mono', fill: C.amber, w: 520 }).svg);
        body += badge('ok', { x: 1730, y: y + 33, s: 44, d: d + 0.8 });
      });
      body += anim('up', 4.4, rich('Cada palavra do título tem um documento no vídeo.', { x: X0, y: 900, size: 34, weight: 700, w: BW }).svg);
      return { body, source: 'Ver aula 5.4 · ' + FIC };
    }
  },
  {
    id: '7.1-18', aula: '7.1', title: 'O template de três colunas',
    cue: '[DEMONSTRAÇÃO: template de roteiro com três colunas — fala, tela, fonte]',
    render() {
      const h = heading('O roteiro em três colunas');
      const t = table({
        y: 320, rowH: 140, headH: 64, size: 27, d0: 1.0, step: 0.9,
        cols: [{ h: '1 · Fala', w: 680 }, { h: '2 · Tela', w: 470 }, { h: '3 · Fonte', w: 530, mono: true, size: 22 }],
        rows: [
          ['Em 2025, a prefeitura de Cidade Exemplo pagou R$ 1,2 milhão à Alimentos Modelo.', 'Contrato no PNCP, zoom no valor', 'PNCP, contrato nº 000/2025, acesso em 10/09/2026'],
          ['A empresa foi aberta 40 dias antes do contrato.', 'Cartão CNPJ, data de abertura marcada', 'Receita Federal, consulta em 10/09/2026'],
          ['A dispensa foi assinada pelo secretário de Educação.', 'Diário oficial, marca-texto na assinatura', 'DOM de Cidade Exemplo, 03/02/2025, p. 4']
        ]
      });
      let body = h.svg + t.svg;
      const cx3 = X0 + 680 + 470;
      body += anim('draw', 4.4, `<rect x="${cx3 - 6}" y="314" width="542" height="${t.h + 12}" fill="none" stroke="${C.amber}" stroke-width="6" pathLength="1"/>`, { t: 0.8 });
      body += anim('up', 5.0, rich('A terceira coluna é a {a|checagem embutida no roteiro}. Quando o roteiro fica pronto, a checagem também fica.', { x: X0, y: 900, size: 34, weight: 700, w: BW }).svg);
      return { body, source: FIC };
    }
  },
  {
    id: '7.1-19', aula: '7.1', title: 'Simplificar',
    cue: 'BLOCO 6 — “Um protagonista. Um caminho do dinheiro. Uma linha do tempo.”',
    render() {
      const h = heading('Simplificar');
      let body = h.svg;
      const items = [['person', 'Um protagonista'], ['money', 'Um caminho do dinheiro'], ['cal', 'Uma linha do tempo']];
      const cw = 520; const gap = (BW - cw * 3) / 2;
      items.forEach(([ic, t], i) => {
        const x = X0 + i * (cw + gap); const d = 0.5 + i * 0.8;
        body += anim('pop', d, `<rect x="${x}" y="340" width="${cw}" height="420" fill="${C.s1}" stroke="${C.amber}" stroke-width="3"/>` + rich('1', { x: x + cw - 40, y: 470, size: 140, font: 'display', fill: C.s3, anchor: 'end', w: 200 }).svg + icon(ic, { x: x + 50, y: 390, s: 140, color: C.amber, sw: 3 }) + rich(t, { x: x + 50, y: 640, size: 46, font: 'display', w: cw - 100, lh: 1.05 }).svg);
      });
      body += anim('up', 3.2, rich('O resto vira {a|continuação}.', { x: X0, y: 880, size: 44, font: 'display', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '7.1-20', aula: '7.1', title: 'Série em vez de 50 minutos',
    cue: 'BLOCO 6 — “Investigação boa quase sempre rende série. E série prende mais do que um vídeo de 50 minutos.”',
    render() {
      const h = heading('Rende série');
      let body = h.svg;
      body += anim('dim', 2.0, anim('grow', 0.5, `<rect x="${X0}" y="380" width="${BW}" height="100" fill="${C.s3}"/>` + rich('1 vídeo · 50 min', { x: X0 + 30, y: 442, size: 32, font: 'mono', weight: 700, fill: C.ink2, w: 800 }).svg, { t: 1 }));
      const n = 4; const gap = 30; const ew = (BW - gap * (n - 1)) / n;
      const eps = ['O contrato', 'A empresa', 'Os sócios', 'A resposta'];
      for (let i = 0; i < n; i++) {
        const x = X0 + i * (ew + gap); const d = 2.4 + i * 0.5;
        body += anim('up', d, `<rect x="${x}" y="560" width="${ew}" height="${ew * 9 / 16}" fill="#14202A" stroke="${C.amber}" stroke-width="3"/>` + rich(`EP. ${i + 1}`, { x: x + 24, y: 610, size: 26, font: 'mono', weight: 700, fill: C.amber, w: ew }).svg + rich(eps[i], { x: x + 24, y: 560 + ew * 9 / 16 - 30, size: 36, font: 'display', w: ew - 48 }).svg + icon('play', { x: x + ew - 70, y: 584, s: 40, color: C.ink, fill: C.ink, sw: 2 }));
      }
      body += anim('up', 4.8, rich('Série prende mais do que um vídeo de 50 minutos.', { x: X0, y: 940, size: 34, weight: 700, fill: C.amber, w: BW }).svg);
      return { body, source: FIC };
    }
  },
  {
    id: '7.1-21', aula: '7.1', title: 'Exercício, os primeiros 90 segundos',
    cue: 'EXERCÍCIO — os primeiros 90 segundos no template de três colunas',
    render() {
      const h = heading('Exercício: os primeiros 90 segundos', { sub: 'Gancho, promessa e o começo do primeiro bloco.' });
      const vb = videoBar([
        { t: 'Gancho', w: 1, fill: C.amber, top: '0:00' },
        { t: 'Promessa', w: 1, fill: C.amber, top: '0:30' },
        { t: 'Bloco 1', w: 1, icon: 'doc', top: '1:00' }
      ], { y: 380, h: 90, d0: 0.6, step: 0.5, gap: 10 });
      let body = h.svg + vb.svg + anim('fade', 2.0, rich('1:30', { x: X1, y: 358, size: 22, font: 'mono', weight: 700, fill: C.ink2, anchor: 'end', w: 200 }).svg);
      const t = table({
        y: 540, rowH: 80, headH: 60, size: 26, d0: 2.2, step: 0.3,
        cols: [{ h: 'Fala', w: 680 }, { h: 'Tela', w: 470 }, { h: 'Fonte', w: 530 }],
        rows: [['', '', ''], ['', '', ''], ['', '', '']]
      });
      body += t.svg;
      body += anim('up', 3.6, rich('{a|Cada frase com fonte.}', { x: X0, y: 920, size: 44, font: 'display', w: BW }).svg);
      return { body };
    }
  },

  // ---------------------------------------------------------------- 7.2
  {
    id: '7.2-01', aula: '7.2', title: 'Um documento vale por dez adjetivos',
    cue: 'ABERTURA — “Um documento na tela vale por dez adjetivos.”',
    render() {
      const h = heading('Um documento vale por dez adjetivos');
      let body = h.svg;
      const words = [
        ['escandaloso', 160, 400, 52], ['absurdo', 600, 380, 44], ['criminoso', 300, 500, 60], ['vergonhoso', 120, 610, 40],
        ['inacreditável', 520, 640, 46], ['chocante', 180, 740, 54], ['revoltante', 560, 760, 40], ['gravíssimo', 330, 860, 48],
        ['imoral', 760, 520, 42], ['bizarro', 760, 880, 38]
      ];
      let adj = '';
      words.forEach(([w0, x, y, s], i) => { adj += anim('pop', 0.5 + i * 0.12, rich(w0, { x, y, size: s, font: 'display', fill: i % 3 === 0 ? C.red : C.ink3, w: 600 }).svg); });
      body += anim('dim', 2.6, adj);
      const dx = 1120; const dy = 300; const dw = 640; const dh = 640;
      let doc = paper(dx, dy, dw, dh);
      [0.9, 0.7, 0.95].forEach((f, i) => { doc += greyLine(dx + 40, dy + 140 + i * 32, (dw - 80) * f); });
      doc += rich('CLÁUSULA 4ª — VALOR', { x: dx + 40, y: dy + 290, size: 22, font: 'mono', weight: 700, fill: C.pAccent, w: dw - 80 }).svg;
      doc += rich('O valor global do contrato é de {h|R$ 1.200.000,00}.', { x: dx + 40, y: dy + 340, size: 30, fill: C.pInk, w: dw - 80, paper: true, hlColor: C.amber, hlOpacity: 0.55, hlD: 3.8 }).svg;
      [0.92, 0.85, 0.9, 0.6, 0.8].forEach((f, i) => { doc += greyLine(dx + 40, dy + 410 + i * 32, (dw - 80) * f); });
      body += anim('up', 3.0, doc);
      return { body, source: FIC };
    }
  },
  {
    id: '7.2-02', aula: '7.2', title: 'CPF sem tarja vale um processo',
    cue: 'ABERTURA — “E um CPF sem tarja na tela vale um processo.”',
    render() {
      const h = heading('Um CPF sem tarja na tela vale um processo', { size: 60 });
      let body = h.svg;
      const dx = 360; const dy = 320; const dw = 1200; const dh = 560;
      let doc = paper(dx, dy, dw, dh);
      const rows = [['NOME', 'Servidor Exemplo'], ['CPF', '123.456.789-00'], ['CARGO', 'Assessor especial'], ['ADMISSÃO', '05/03/2024']];
      rows.forEach(([k, v], i) => {
        const y = dy + 170 + i * 90;
        doc += rich(k, { x: dx + 60, y, size: 24, font: 'mono', weight: 700, fill: C.pInk2, w: 300 }).svg + rich(v, { x: dx + 340, y, size: 38, fill: C.pInk, w: dw - 400 }).svg;
        doc += `<rect x="${dx + 60}" y="${y + 26}" width="${dw - 120}" height="2" fill="${C.pLine}"/>`;
      });
      body += anim('up', 0.4, doc);
      const cy = dy + 170 + 90;
      body += anim('gone', 3.4, anim('pop', 1.4, `<rect x="${dx + 320}" y="${cy - 50}" width="330" height="70" fill="none" stroke="${C.red}" stroke-width="6"/>` + label('na tela, sem tarja', { x: dx + 680, y: cy - 6, color: C.red })), { t: 0.4 });
      body += redact({ x: dx + 330, y: cy - 42, w: 310, h: 54, d: 3.6 });
      body += anim('pop', 4.2, label('tarjado', { x: dx + 680, y: cy - 6, color: C.green }));
      return { body, source: 'Dados fictícios.' };
    }
  },
  {
    id: '7.2-03', aula: '7.2', title: 'Zoom na linha que importa',
    cue: '[DEMONSTRAÇÃO: um contrato na tela — zoom na linha que importa, marca-texto, legenda de fonte]',
    hold: 3,
    render() {
      const px = 560; const py = 130; const pw = 800; const ph = 1000;
      let doc = paper(px, py, pw, ph);
      doc += rich('CONTRATO Nº 000/2025', { x: px + 40, y: py + 140, size: 26, font: 'mono', weight: 700, fill: C.pInk, w: pw - 80 }).svg;
      for (let i = 0; i < 7; i++) doc += greyLine(px + 40, py + 180 + i * 30, (pw - 80) * [0.95, 0.9, 0.97, 0.6, 0.92, 0.88, 0.94][i]);
      const ly = 600;
      doc += rich('CLÁUSULA 4ª', { x: px + 40, y: ly - 44, size: 18, font: 'mono', weight: 700, fill: C.pAccent, w: pw - 80 }).svg;
      doc += anim('grow', 3.6, `<rect x="${px + 34}" y="${ly - 22}" width="560" height="30" fill="${C.amber}" opacity=".55"/>`);
      doc += rich('O valor global do contrato é de R$ 1.200.000,00.', { x: px + 40, y: ly, size: 24, fill: C.pInk, w: pw - 80 }).svg;
      for (let i = 0; i < 10; i++) doc += greyLine(px + 40, ly + 40 + i * 30, (pw - 80) * [0.9, 0.95, 0.85, 0.92, 0.6, 0.94, 0.9, 0.88, 0.97, 0.5][i]);
      const s = 2.3; const fx = px + 40 + 290; const fy = ly - 6;
      const tx = 960 - s * fx; const ty = 520 - s * fy;
      let body = anim('fade', 0.2, rich('Ninguém lê uma página inteira em três segundos.', { x: W / 2, y: 90, size: 30, weight: 700, fill: C.ink2, anchor: 'middle', w: BW }).svg);
      body = anim('gone', 1.8, body, { t: 0.4 });
      body += anim('zoom', 2.0, anim('up', 0.3, doc), { t: 1.3, style: `--z:translate(${tx}px,${ty}px) scale(${s});transform-origin:0 0` });
      body += anim('up', 4.6, `<rect x="${X0}" y="880" width="1200" height="76" fill="${C.bg}" opacity=".92"/><rect x="${X0}" y="880" width="10" height="76" fill="${C.amber}"/>` + rich('Fonte: PNCP, contrato nº 000/2025, acesso em 10/09/2026', { x: X0 + 34, y: 930, size: 28, font: 'mono', weight: 700, w: 1160 }).svg);
      return { body, kicker: null, source: null };
    }
  },
  {
    id: '7.2-04', aula: '7.2', title: 'Legenda de fonte (modelo)',
    cue: 'BLOCO 1 — legenda de fonte na tela: “Fonte: PNCP, contrato nº tal, acesso em tal data” (sobreposição)',
    overlay: true,
    hold: 4,
    render() {
      let body = anim('grow', 0.2, `<rect x="${X0}" y="900" width="1240" height="84" fill="${C.bg}" opacity=".9"/>`, { t: 0.5 });
      body += anim('fade', 0.3, `<rect x="${X0}" y="900" width="12" height="84" fill="${C.amber}"/>`);
      body += anim('left', 0.5, rich('FONTE', { x: X0 + 38, y: 954, size: 26, font: 'mono', weight: 700, fill: C.amber, w: 200, ls: 0.1 }).svg + rich('PNCP, contrato nº [número], acesso em [data]', { x: X0 + 170, y: 954, size: 30, font: 'mono', weight: 700, w: 1060 }).svg);
      return { body, kicker: null };
    }
  },
  {
    id: '7.2-05', aula: '7.2', title: 'Diga o que está na tela',
    cue: 'BLOCO 1 — “diga em voz alta o que está sendo mostrado… Acessibilidade não é detalhe.”',
    render() {
      const h = heading('Diga o que está na tela');
      const c = columns([
        { head: 'Diga em voz alta', icon: 'mic', body: 'Nem todo mundo está olhando para a tela.' },
        { head: 'Descreva o documento', icon: 'doc', body: 'O que ele é e o que mostra.' },
        { head: 'Legenda no vídeo', icon: 'video', body: '{a|Acessibilidade não é detalhe.}' }
      ], { y: 320, h: 330, size: 32, headSize: 38, d0: 0.5, step: 0.6 });
      const cap = '“Este é o contrato, publicado no PNCP. Na cláusula quarta, o valor: um milhão e duzentos mil reais.”';
      const L = layout(cap, { size: 32, w: 1400, weight: 500 });
      const b = anim('up', 2.8, label('Narração', { x: X0, y: 760, color: C.ink2 }) + `<rect x="${W / 2 - 760}" y="790" width="1520" height="${L.h + 40}" fill="#000"/>` + rich(cap, { x: W / 2, y: 790 + 20 + 32 * 0.85, size: 32, weight: 500, anchor: 'middle', w: 1400 }).svg);
      return { body: h.svg + c.svg + b, source: FIC };
    }
  },
  {
    id: '7.2-06', aula: '7.2', title: 'O que tarjar, dados pessoais',
    cue: 'BLOCO 2 — CPF, endereço residencial, telefone, e-mail pessoal, assinatura de quem não é personagem, dados de saúde',
    render() {
      const h = heading('O que tarjar', { sub: 'Tarje antes de exportar, não depois.' });
      let body = h.svg;
      const dx = X0; const dy = 320; const dw = 900; const dh = 660;
      let doc = paper(dx, dy, dw, dh, { head: false });
      const rows = [
        ['NOME', 'Servidor Exemplo', false], ['CPF', '123.456.789-00', true], ['ENDEREÇO', 'Rua das Flores, 100, ap. 12', true],
        ['TELEFONE', '(11) 90000-0000', true], ['E-MAIL', 'nome.pessoal@email.com', true], ['SAÚDE', 'Afastamento médico · CID 00.0', true]
      ];
      let tarjas = '';
      rows.forEach(([k, v, red], i) => {
        const y = dy + 70 + i * 82;
        doc += rich(k, { x: dx + 40, y, size: 22, font: 'mono', weight: 700, fill: C.pInk2, w: 220 }).svg + rich(v, { x: dx + 260, y, size: 32, fill: C.pInk, w: dw - 300 }).svg;
        doc += `<rect x="${dx + 40}" y="${y + 24}" width="${dw - 80}" height="2" fill="${C.pLine}"/>`;
        if (red) tarjas += redact({ x: dx + 254, y: y - 32, w: layout(v, { size: 32 }).w + 14, h: 44, d: 1.4 + (i - 1) * 0.6 });
      });
      const sy = dy + 70 + 6 * 82 + 30;
      doc += rich('ASSINATURA', { x: dx + 40, y: sy, size: 22, font: 'mono', weight: 700, fill: C.pInk2, w: 220 }).svg;
      doc += `<path d="M${dx + 270} ${sy + 4} c30 -50 50 30 80 -10 s40 -40 60 10 s50 -30 80 0 s40 20 70 -10" stroke="${C.pInk}" stroke-width="3" fill="none"/>`;
      doc += rich('testemunha', { x: dx + 600, y: sy, size: 22, font: 'mono', fill: C.pInk2, w: 200 }).svg;
      tarjas += redact({ x: dx + 260, y: sy - 46, w: 330, h: 64, d: 1.4 + 5 * 0.6 });
      body += anim('up', 0.4, doc) + tarjas;
      const rx = 1100;
      body += list([
        { t: 'CPF', d: 1.4 }, { t: 'Endereço residencial', d: 2.0 }, { t: 'Telefone', d: 2.6 }, { t: 'E-mail pessoal', d: 3.2 },
        { t: 'Dados de saúde', d: 3.8 }, { t: 'Assinatura de quem não é personagem', d: 4.4 }
      ], { x: rx, y: 340, w: X1 - rx, size: 36, gap: 26, numbered: false, marker: 'dot', tone: C.red, cls: 'left' }).svg;
      return { body, source: 'Dados fictícios.' };
    }
  },
  {
    id: '7.2-07', aula: '7.2', title: 'O que pode identificar a fonte',
    cue: 'BLOCO 2 — protocolo interno, marca d’água, carimbo de setor, nome de arquivo',
    render() {
      const h = heading('Tarje também o que identifica a fonte', { size: 60 });
      let body = h.svg;
      const dx = X0 + 40; const dy = 360; const dw = 820; const dh = 600;
      let doc = `<rect x="${dx}" y="${dy - 50}" width="560" height="50" fill="${C.s3}"/>` + rich('scan_reuniao_setor_compras_v2.pdf', { x: dx + 20, y: dy - 16, size: 22, font: 'mono', fill: C.ink, w: 540 }).svg;
      doc += paper(dx, dy, dw, dh);
      doc += rich('Prot. interno 2025/0417-SECOMP', { x: dx + dw - 40, y: dy + 60, size: 20, font: 'mono', weight: 700, fill: C.pInk, anchor: 'end', w: 500 }).svg;
      for (let i = 0; i < 12; i++) doc += greyLine(dx + 40, dy + 140 + i * 32, (dw - 80) * [0.95, 0.9, 0.97, 0.6, 0.92, 0.88, 0.94, 0.7, 0.9, 0.85, 0.93, 0.5][i]);
      doc += `<text x="${dx + dw / 2}" y="${dy + dh / 2 + 40}" font-family="'Archivo Black',sans-serif" font-size="64" fill="${C.pInk}" opacity=".14" text-anchor="middle" transform="rotate(-24 ${dx + dw / 2} ${dy + dh / 2})">CÓPIA CONTROLADA</text>`;
      const wm = doc.slice(doc.lastIndexOf('<text'));
      doc = doc.slice(0, doc.lastIndexOf('<text'));
      const sx = dx + dw - 150; const sy = dy + dh - 110;
      doc += `<circle cx="${sx}" cy="${sy}" r="70" fill="none" stroke="#3B5BA8" stroke-width="5"/><circle cx="${sx}" cy="${sy}" r="54" fill="none" stroke="#3B5BA8" stroke-width="2"/>` + rich('SETOR DE COMPRAS', { x: sx, y: sy + 8, size: 15, font: 'mono', weight: 700, fill: '#3B5BA8', anchor: 'middle', w: 120 }).svg;
      body += anim('up', 0.4, doc) + anim('gone', 3.2, anim('up', 0.4, wm), { t: 0.6 });
      const tj = [
        { x: dx, y: dy - 50, w: 560, h: 50, d: 1.6 },
        { x: dx + dw - 400, y: dy + 36, w: 368, h: 34, d: 2.4 },
        { x: sx - 78, y: sy - 78, w: 156, h: 156, d: 4.0 }
      ];
      tj.forEach((t) => { body += redact(t); });
      const rx = 1100;
      body += list([
        { t: 'Nome de arquivo', d: 1.4 }, { t: 'Número de protocolo interno', d: 2.2 }, { t: 'Marca d’água', d: 3.0 }, { t: 'Carimbo de setor', d: 3.8 }
      ], { x: rx, y: 380, w: X1 - rx, size: 40, gap: 40, numbered: false, marker: 'dot', tone: C.red, cls: 'left' }).svg;
      body += anim('up', 4.8, rich('Detalhes que contam de onde o documento saiu.', { x: rx, y: 800, size: 30, fill: C.ink2, w: X1 - rx }).svg);
      return { body, source: 'Documento fictício.' };
    }
  },
  {
    id: '7.2-08', aula: '7.2', title: 'Tarje antes de exportar',
    cue: 'BLOCO 2 — “Tarje antes de exportar, não depois. E confira a tarja no arquivo final.”',
    render() {
      const h = heading('Tarje antes de exportar, não depois', { size: 60 });
      let body = h.svg;
      body += anim('fade', 0.4, label('Assim, não', { x: X0, y: 350, color: C.red }));
      body += flow([{ t: 'Exportar', color: C.red, n: false }, { t: 'Publicar', color: C.red, n: false }, { t: 'Tarjar', color: C.red, n: false }], { y: 380, h: 140, d0: 0.6, step: 0.4, size: 40 }).svg;
      body += badge('no', { x: X1 - 60, y: 330, s: 50, d: 1.8 });
      body += anim('fade', 2.4, label('Assim', { x: X0, y: 630, color: C.green }));
      body += flow([{ t: 'Tarjar', color: C.green, n: false }, { t: 'Conferir no arquivo final', color: C.green, n: false }, { t: 'Exportar', color: C.green, n: false }], { y: 660, h: 140, d0: 2.6, step: 0.5, size: 40 }).svg;
      body += badge('ok', { x: X1 - 60, y: 610, s: 50, d: 4.2 });
      return { body };
    }
  },
  {
    id: '7.2-09', aula: '7.2', title: 'Tarja em camada não é tarja',
    cue: 'BLOCO 2 — tarja feita como camada por cima de um PDF pode ser removida por quem baixar o arquivo',
    render() {
      const h = heading('Tarja em camada não é tarja');
      let body = h.svg;
      const dx = X0; const dy = 360; const dw = 760; const dh = 520;
      let doc = paper(dx, dy, dw, dh);
      for (let i = 0; i < 4; i++) doc += greyLine(dx + 40, dy + 140 + i * 32, (dw - 80) * [0.9, 0.95, 0.7, 0.85][i]);
      doc += rich('CPF', { x: dx + 40, y: dy + 320, size: 24, font: 'mono', weight: 700, fill: C.pInk2, w: 100 }).svg + rich('123.456.789-00', { x: dx + 140, y: dy + 320, size: 36, fill: C.pInk, w: 500 }).svg;
      for (let i = 0; i < 4; i++) doc += greyLine(dx + 40, dy + 380 + i * 32, (dw - 80) * [0.92, 0.6, 0.88, 0.5][i]);
      body += anim('up', 0.3, doc);
      body += anim('fade', 0.6, label('PDF com tarja em camada', { x: dx, y: dy - 24, color: C.ink2 }));
      const bar = `<rect x="${dx + 130}" y="${dy + 280}" width="300" height="56" fill="#000"/>`;
      body += anim('slideL', 2.8, anim('grow', 1.0, bar, { t: 0.45 }), { t: 0.9, style: '--dx:360px' });
      body += anim('fade', 2.4, rich('quem baixa o arquivo arrasta a camada', { x: dx + 40, y: dy + dh + 50, size: 26, font: 'mono', fill: C.red, w: dw }).svg);
      body += stamp('REMOVÍVEL', { x: dx + 560, y: dy + 220, size: 40, d: 3.6 });
      const rx = 1000;
      body += list([
        { t: 'No vídeo, a imagem é plana.', mark: 'ok', d: 4.2 },
        { t: 'PDF: publique uma versão convertida em imagem.', mark: 'ok', d: 4.8 },
        { t: 'Ou use uma ferramenta que apague o conteúdo embaixo da tarja.', mark: 'ok', d: 5.4 }
      ], { x: rx, y: 380, w: X1 - rx, size: 36, gap: 40, numbered: false, marker: 'ok' }).svg;
      return { body, source: 'Dados fictícios.' };
    }
  },
  {
    id: '7.2-10', aula: '7.2', title: 'A linha do tempo da pauta',
    cue: '[TELA: linha do tempo — abertura da empresa → nomeação do sócio → dispensa → contrato → aditivo]',
    render() {
      const h = heading('A linha do tempo');
      const t = timeline([
        { date: '10/01/2024', t: 'Abertura da empresa', sub: 'Cartão CNPJ · Receita Federal', anchor: 'start' },
        { date: '05/03/2024', t: 'Sócio é nomeado na prefeitura', sub: 'Diário oficial' },
        { date: '20/06/2024', t: 'Dispensa de licitação', sub: 'Diário oficial' },
        { date: '01/07/2024', t: 'Contrato', sub: 'PNCP' },
        { date: '15/12/2024', t: 'Aditivo', sub: 'PNCP', color: C.red, anchor: 'end' }
      ], { y: 620, d0: 0.8, step: 0.9, alt: true, labelW: 400 });
      return { body: h.svg + t.svg, source: FIC };
    }
  },
  {
    id: '7.2-11', aula: '7.2', title: 'A sequência diz por você',
    cue: 'BLOCO 3 — “Você não precisa dizer ‘armação’. A sequência diz por você.”',
    render() {
      const h = heading('O gráfico mais persuasivo e mais seguro', { size: 60 });
      const c = columns([
        { head: 'Mais persuasivo', icon: 'eye', body: 'O público vê a sequência.' },
        { head: 'Mais seguro', icon: 'shield', color: C.green, body: 'Datas são fatos.' }
      ], { y: 320, h: 300, size: 36, headSize: 44, d0: 0.5, step: 0.7 });
      const b = anim('up', 2.4, rich('Você não precisa dizer {s|“armação”}.', { x: X0, y: 790, size: 60, font: 'display', w: BW, hlD: 3.2 }).svg) + anim('up', 3.6, rich('{a|A sequência diz por você.}', { x: X0, y: 890, size: 60, font: 'display', w: BW }).svg);
      return { body: h.svg + c.svg + b };
    }
  },
  {
    id: '7.2-12', aula: '7.2', title: 'Cada ponto, data, documento e fonte',
    cue: 'BLOCO 3 — “Cada ponto da linha tem data, documento e fonte.”',
    render() {
      const h = heading('Cada ponto da linha');
      let body = h.svg;
      const y = 400;
      body += anim('draw', 0.4, `<path d="M${X0} ${y} H${X1}" stroke="${C.lineUi}" stroke-width="4" fill="none" pathLength="1"/>`);
      [320, 640, 1280, 1600].forEach((x, i) => { body += anim('pop', 0.6 + i * 0.1, `<rect x="${x - 10}" y="${y - 10}" width="20" height="20" fill="${C.ink3}" transform="rotate(45 ${x} ${y})"/>`); });
      const px = 960;
      body += anim('pop', 1.2, `<rect x="${px - 20}" y="${y - 20}" width="40" height="40" fill="${C.amber}" transform="rotate(45 ${px} ${y})"/>`);
      body += arrowV(px, y + 40, 500, { d: 1.6, color: C.amber });
      const cx = 420; const cw = 1080;
      body += anim('up', 1.9, box({ x: cx, y: 520, w: cw, h: 380, fill: C.s1, stroke: C.amber, sw: 3 }));
      const rows = [['Data', '20/06/2024', 2.4], ['Documento', 'Extrato de dispensa de licitação', 3.0], ['Fonte', 'Diário Oficial de Cidade Exemplo, edição 1.234, p. 7', 3.6]];
      rows.forEach(([k, v, d], i) => {
        const ry = 600 + i * 110;
        body += anim('left', d, label(k, { x: cx + 40, y: ry, color: C.amber }) + rich(v, { x: cx + 300, y: ry + 4, size: 34, weight: 700, w: cw - 340 }).svg);
        if (i < 2) body += anim('fade', d, `<rect x="${cx + 40}" y="${ry + 40}" width="${cw - 80}" height="2" fill="${C.line}"/>`);
      });
      return { body, source: FIC };
    }
  },
  {
    id: '7.2-13', aula: '7.2', title: 'Mapa de vínculos, poderoso e perigoso',
    cue: 'BLOCO 4 — rotule cada linha com a natureza do vínculo; nada de linha vermelha piscando; vínculo fraco não entra',
    render() {
      const h = heading('Mapa de vínculos: rotule cada linha', { size: 60 });
      let body = h.svg;
      const pw = 800; const py = 330; const ph = 600;
      const panel = (x, ok, d) => anim('up', d, box({ x, y: py, w: pw, h: ph, fill: C.s1, stroke: ok ? C.green : C.red, sw: 3 }) + `<rect x="${x}" y="${py}" width="${pw}" height="60" fill="${ok ? C.green : C.red}"/>` + rich(ok ? 'ASSIM' : 'ASSIM, NÃO', { x: x + 30, y: py + 42, size: 28, font: 'mono', weight: 700, fill: C.bg, w: 400 }).svg);
      const who = (x, y, t, d) => anim('pop', d, `<circle cx="${x}" cy="${y}" r="46" fill="${C.s3}" stroke="${C.ink2}" stroke-width="3"/>` + icon('person', { x: x - 26, y: y - 28, s: 52, color: C.ink2, sw: 3 }) + rich(t, { x, y: y + 84, size: 26, weight: 700, anchor: 'middle', w: 300 }).svg);
      const pos = (x0) => ({ a: [x0 + 160, py + 170], b: [x0 + 640, py + 170], c: [x0 + 160, py + 420], d: [x0 + 640, py + 420] });
      // esquerda
      const L = pos(X0);
      body += panel(X0, false, 0.4);
      body += edge(L.a[0] + 50, L.a[1], L.b[0] - 50, L.b[1], { color: C.red, sw: 8, d: 1.0 });
      body += edge(L.a[0], L.a[1] + 110, L.c[0], L.c[1] - 50, { color: C.red, sw: 8, d: 1.2 });
      body += edge(L.b[0] - 60, L.b[1] + 110, L.c[0] + 40, L.c[1] - 30, { color: C.red, sw: 8, d: 1.4 });
      body += edge(L.c[0] + 50, L.c[1], L.d[0] - 50, L.d[1], { color: C.red, sw: 8, d: 1.6 });
      body += edge(L.b[0], L.b[1] + 110, L.d[0], L.d[1] - 50, { color: C.red, sw: 8, d: 1.8 });
      [['a', 'Prefeito'], ['b', 'Empresa A'], ['c', 'Sócio'], ['d', 'Campanha']].forEach(([k, t], i) => { body += who(L[k][0], L[k][1], t, 0.6 + i * 0.1); });
      body += anim('fade', 2.0, rich('Linha sem rótulo parece culpa.', { x: X0 + 40, y: py + ph - 30, size: 26, weight: 700, fill: C.red, w: pw - 80 }).svg);
      // direita
      const x2 = X1 - pw; const R = pos(x2);
      body += panel(x2, true, 2.4);
      body += edge(R.a[0] + 50, R.a[1], R.b[0] - 50, R.b[1], { color: C.ink2, d: 3.0, lab: 'contratou' });
      body += edge(R.a[0], R.a[1] + 110, R.c[0], R.c[1] - 50, { color: C.ink2, d: 3.3, lab: 'nomeou' });
      body += edge(R.c[0] + 40, R.c[1] - 30, R.b[0] - 60, R.b[1] + 110, { color: C.ink2, d: 3.6, lab: 'sócio de' });
      body += edge(R.c[0] + 50, R.c[1], R.d[0] - 50, R.d[1], { color: C.ink2, d: 3.9, lab: 'doou para' });
      body += anim('gone', 5.4, edge(R.b[0], R.b[1] + 110, R.d[0], R.d[1] - 50, { color: C.ink3, d: 4.4, dash: true, lab: 'mesmo bairro', labColor: C.ink3 }), { t: 0.6 });
      [['a', 'Prefeito'], ['b', 'Empresa A'], ['c', 'Sócio'], ['d', 'Campanha']].forEach(([k, t], i) => { body += who(R[k][0], R[k][1], t, 2.6 + i * 0.1); });
      body += anim('fade', 5.6, rich('Vínculo fraco não entra no mapa.', { x: x2 + 40, y: py + ph - 30, size: 26, weight: 700, fill: C.green, w: pw - 80 }).svg);
      return { body, source: FIC };
    }
  },
  {
    id: '7.2-14', aula: '7.2', title: 'O outro lado é parte da história',
    cue: 'BLOCO 5 — “O outro lado não é um parágrafo protocolar no fim. É parte da história.”',
    render() {
      const h = heading('O outro lado é parte da história');
      let body = h.svg;
      body += anim('fade', 0.4, label('Protocolar', { x: X0, y: 380, color: C.red }));
      body += videoBar([
        { t: 'Gancho', w: 160, fill: C.amber }, { t: 'Bloco', w: 300 }, { t: 'Bloco', w: 300 }, { t: 'Bloco', w: 300 }, { t: 'Fecho', w: 200 },
        { t: '', w: 40, fill: C.red }
      ], { y: 400, h: 90, d0: 0.5, step: 0.15 }).svg;
      body += anim('up', 1.6, rich('“procurado, não respondeu”, nos últimos segundos', { x: X1, y: 540, size: 26, font: 'mono', fill: C.red, anchor: 'end', w: 900 }).svg);
      body += anim('fade', 2.6, label('Parte da história', { x: X0, y: 680, color: C.green }));
      body += videoBar([
        { t: 'Gancho', w: 160, fill: C.amber }, { t: 'Bloco', w: 260 }, { t: 'Bloco', w: 260 }, { t: 'Outro lado', w: 300, fill: C.blue }, { t: 'Bloco', w: 220 }, { t: 'Fecho', w: 200 }
      ], { y: 700, h: 90, d0: 2.8, step: 0.15 }).svg;
      body += anim('up', 4.0, rich('Com destaque, no meio da narrativa.', { x: X0 + 760, y: 840, size: 28, font: 'mono', fill: C.blue, w: 900 }).svg);
      return { body };
    }
  },
  {
    id: '7.2-15', aula: '7.2', title: 'A resposta por inteiro',
    cue: '[TELA: nota do outro lado exibida por inteiro]',
    render() {
      let body = paperCard({ x: X0, y: 220, w: 860, ref: 'Nota da Alimentos Modelo', text: '“A empresa venceu o processo de contratação dentro das regras. {h|Todos os pagamentos têm nota fiscal e entrega comprovada.} O contrato está disponível no portal da prefeitura.”', size: 34, d: 0.3, hlD: 1.6, foot: 'Recebida em 13/09/2026, às 16h10' }).svg;
      const rx = 1080;
      body += list([
        { t: 'Mostre a resposta de forma fiel.', d: 1.2 },
        { t: 'Não corte a parte que ajuda a pessoa acusada.', d: 2.0 },
        { t: 'Longa demais? Resuma com honestidade e ponha a íntegra na descrição.', d: 2.8 },
        { t: 'Diga quando perguntou e quanto tempo esperou.', d: 3.6 }
      ], { x: rx, y: 260, w: X1 - rx, size: 34, gap: 34, numbered: false, marker: 'ok' }).svg;
      return { body, source: FIC };
    }
  },
  {
    id: '7.2-16', aula: '7.2', title: 'Quando não há resposta',
    cue: 'BLOCO 5 — “Procurado por e-mail em 12 de setembro, com prazo de 72 horas, o prefeito não respondeu até a publicação. O espaço segue aberto.”',
    render() {
      const h = heading('Quando não há resposta');
      let body = h.svg;
      body += paperCard({ x: X0 + 80, y: 300, w: BW - 160, text: '“Procurado por e-mail {h|em 12 de setembro}, {h|com prazo de 72 horas}, o prefeito não respondeu até a publicação. {h|O espaço segue aberto.}”', size: 46, d: 0.4, hlD: 1.6 }).svg;
      const pills = [['Quando perguntou', C.amber], ['Quanto tempo esperou', C.amber], ['Espaço aberto', C.green]];
      let px = X0 + 80;
      pills.forEach(([t, col], i) => {
        const p = pill(t, { x: px, y: 820, color: col, size: 30, d: 3.4 + i * 0.4 });
        body += p.svg; px += p.w + 30;
      });
      return { body, source: 'Modelo do roteiro.' };
    }
  },
  {
    id: '7.2-17', aula: '7.2', title: 'Quando a resposta chega depois',
    cue: 'BLOCO 5 — “Se a resposta chegar depois: atualize, fixe um comentário e diga que atualizou.”',
    render() {
      const h = heading('A resposta chegou depois');
      let body = h.svg;
      body += flow([{ t: 'Atualize' }, { t: 'Fixe um comentário' }, { t: 'Diga que atualizou' }], { y: 320, h: 160, d0: 0.5, step: 0.6, size: 40 }).svg;
      const cx = X0 + 200; const cy = 580; const cw = BW - 400;
      let cm = box({ x: cx, y: cy, w: cw, h: 300, fill: C.s1, stroke: C.line });
      cm += icon('pin', { x: cx + 30, y: cy + 26, s: 32, color: C.amber, sw: 3 }) + rich('Fixado pelo canal', { x: cx + 76, y: cy + 52, size: 24, font: 'mono', fill: C.amber, w: 600 }).svg;
      cm += `<circle cx="${cx + 66}" cy="${cy + 130}" r="36" fill="${C.s3}"/>` + icon('person', { x: cx + 46, y: cy + 108, s: 40, color: C.ink2, sw: 3 });
      cm += rich('{a|ATUALIZAÇÃO (15/09):} a prefeitura respondeu depois da publicação. O trecho principal entrou no vídeo aos 6:12 e a íntegra está na descrição.', { x: cx + 130, y: cy + 128, size: 32, w: cw - 170, lh: 1.32 }).svg;
      body += anim('up', 2.6, cm);
      return { body, source: FIC };
    }
  },
  {
    id: '7.2-18', aula: '7.2', title: 'Dizer o que não se sabe',
    cue: 'BLOCO 6 — “Não encontramos documento que indique que o prefeito sabia do vínculo.” “A empresa não informou quem são os donos de fato.”',
    render() {
      const h = heading('Diga o que não se sabe');
      const c = columns([
        { head: 'O que a apuração mostrou', icon: 'check', color: C.green, items: ['O contrato e o valor pago', 'A data de abertura da empresa', 'A nomeação do sócio'] },
        { head: 'O que ela não conseguiu mostrar', icon: 'search', color: C.amber, items: ['“Não encontramos documento que indique que o prefeito sabia do vínculo.”', '“A empresa não informou quem são os donos de fato.”'] }
      ], { y: 320, h: 560, size: 34, headSize: 40, d0: 0.5, step: 1.8, itemStep: 0.5 });
      return { body: h.svg + c.svg, source: FIC };
    }
  },
  {
    id: '7.2-19', aula: '7.2', title: 'Jornalismo e acusação',
    cue: 'BLOCO 6 — “Isso não enfraquece a matéria. Fortalece… no tribunal, é a diferença entre jornalismo e acusação.”',
    render() {
      let body = statement('Isso não enfraquece a matéria.\n{a|Fortalece.}', { y: 400, size: 84, d: 0.3, step: 0.9 }).svg;
      body += anim('up', 2.4, rich('No tribunal, é a diferença entre', { x: W / 2, y: 720, size: 40, fill: C.ink2, anchor: 'middle', w: BW }).svg);
      body += anim('pop', 3.0, rich('{g|jornalismo}  e  {r|acusação}', { x: W / 2, y: 820, size: 64, font: 'display', anchor: 'middle', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '7.2-20', aula: '7.2', title: 'Exercício da aula 7.2',
    cue: 'EXERCÍCIO — linha do tempo com data, documento e fonte; trecho do outro lado com a data do pedido',
    render() {
      const h = heading('Exercício');
      let body = h.svg;
      body += list([
        { t: 'Monte a linha do tempo da sua pauta.', sub: 'Data, documento e fonte em cada ponto.' },
        { t: 'Escreva o trecho do roteiro com o outro lado.', sub: 'Incluindo a data do pedido de posicionamento.' }
      ], { y: 330, size: 46, subSize: 32, gap: 60, d0: 0.5, step: 1.2 }).svg;
      const y = 780;
      body += anim('draw', 2.8, `<path d="M${X0} ${y} H${X1}" stroke="${C.lineUi}" stroke-width="4" fill="none" pathLength="1"/>`);
      ['DATA', 'DOCUMENTO', 'FONTE'].forEach((t, i) => {
        const x = X0 + 280 + i * 560;
        body += anim('pop', 3.2 + i * 0.3, `<rect x="${x - 14}" y="${y - 14}" width="28" height="28" fill="${C.amber}" transform="rotate(45 ${x} ${y})"/>` + rich(t, { x, y: y + 70, size: 28, font: 'mono', weight: 700, fill: C.amber, anchor: 'middle', w: 400 }).svg);
      });
      return { body };
    }
  },
  {
    id: '7.2-21', aula: '7.2', title: 'Fecha o módulo 7',
    cue: 'FECHAMENTO — “Você tem pauta, apuração, proteção e roteiro.”',
    render() {
      const h = heading('Fecha o módulo 7');
      let body = h.svg;
      body += checklist(['Pauta', 'Apuração', 'Proteção', 'Roteiro'], { x: X0, y: 340, w: 900, size: 60, gap: 34, d0: 0.5, step: 0.5 }).svg;
      body += anim('up', 3.0, box({ x: 1080, y: 360, w: 720, h: 420, fill: C.s1, stroke: C.amber, sw: 3 }) + label('Módulo 8', { x: 1120, y: 420 }) + rich('Uma investigação do começo ao fim. {a|Com os acertos e com os erros.}', { x: 1120, y: 510, size: 48, font: 'display', w: 640, lh: 1.1 }).svg);
      return { body };
    }
  }
];
