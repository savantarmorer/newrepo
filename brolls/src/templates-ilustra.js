/* Templates ilustrados (cenas específicas do roteiro). */

function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function boxText(parent, x, y, w, h, lines, o = {}) {
  const gg = g(parent);
  const r = el('rect', { x, y, width: w, height: h, fill: o.fill || 'none', stroke: o.stroke || C.dim, 'stroke-width': o.sw || 3, rx: o.rx || 0 }, gg);
  const size = o.size || 36, lh = o.lh || size * 1.05;
  const y0 = y + h / 2 - ((lines.length - 1) * lh) / 2 + size * 0.34;
  const te = txLines(gg, x + w / 2, y0, lines, { f: o.f || 'disp', size, anchor: 'middle', lh, fill: o.color || C.cream, upper: o.upper !== false && !o.f });
  fitText(te, w - 36);
  return { gg, r, te };
}

/* ---------- abertura: chalé, 2h30 ---------- */
TEMPLATES.chale230 = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const R = rng(3);
  const stars = [];
  for (let i = 0; i < 46; i++) stars.push(el('circle', { cx: 120 + R() * 1680, cy: 120 + R() * 300, r: R() * 1.8 + 0.6, fill: C.cream }, c));
  el('line', { x1: 80, y1: 820, x2: 1840, y2: 820, stroke: C.faint, 'stroke-width': 3 }, c);
  const house = g(c);
  el('path', { d: 'M520,560 L760,392 L1000,560', fill: 'none', stroke: C.cream, 'stroke-width': 6, 'stroke-linejoin': 'round' }, house);
  el('rect', { x: 560, y: 560, width: 400, height: 260, fill: '#15130F', stroke: C.cream, 'stroke-width': 6 }, house);
  el('rect', { x: 725, y: 690, width: 70, height: 130, fill: '#0B0A08', stroke: C.cream, 'stroke-width': 5 }, house);
  const win = el('rect', { x: 600, y: 600, width: 86, height: 66, fill: '#0B0A08', stroke: C.cream, 'stroke-width': 5 }, house);
  const glow = el('rect', { x: 560, y: 820, width: 0, height: 0, fill: C.amber, opacity: 0 }, c);
  const people = ['conselheiro', 'secretária', 'segurança'].map((nm, i) => {
    const gg = g(c);
    const x = 860 + i * 92;
    el('circle', { cx: x, cy: 700, r: 22, fill: C.dim }, gg);
    el('rect', { x: x - 26, y: 728, width: 52, height: 92, rx: 16, fill: C.dim }, gg);
    const lab = tx(gg, x, 860 + (i % 2) * 34, nm, { f: 'mono', size: 22, fill: C.dim, anchor: 'middle' });
    return { gg, lab };
  });
  const clock = tx(c, 1620, 470, '02:30', { f: 'mono', size: 130, w: 500, fill: C.red, anchor: 'middle' });
  const date = tx(c, 1620, 540, p.data || '10.10.1992', { f: 'mono', size: 34, fill: C.dim, anchor: 'middle', ls: '0.12em' });
  const toc = tx(c, 760, 360, '', { f: 'mono', size: 40, w: 500, fill: C.cream, anchor: 'middle', ls: '0.2em' });
  const cap = tx(c, 160, FY(clip, 970), '', { f: 'mono', size: 30, fill: C.cream });
  const capS = p.legenda || 'Não é um assalto. É uma entrevista.';
  return t => {
    stars.forEach((s, i) => op(s, 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.3 + i))));
    op(house, P(t, 0, 0.8));
    op(clock, P(t, 0.6, 1.0) * ((Math.floor(t * 1.4) % 2 === 0) ? 1 : 0.35));
    op(date, P(t, 0.9, 1.4));
    const L = P(t, 2.0, 2.3);
    win.setAttribute('fill', L > 0.5 ? C.amber : '#0B0A08');
    glow.setAttribute('opacity', 0);
    people.forEach((o, i) => { rise(o.gg, t, 3.0 + i * 0.5, 0.5, 10); });
    typeIn(toc, 'TOC.  TOC.  TOC.', P(t, 4.8, 5.8));
    typeIn(cap, capS, P(t, 6.4, 6.4 + capS.length * 0.04));
  };
};

/* ---------- fita cassete: versão editada x fita inteira ---------- */
TEMPLATES.cassete = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const cas = g(c, { transform: 'translate(610,150)' });
  el('rect', { x: 0, y: 0, width: 700, height: 430, rx: 26, fill: '#191713', stroke: C.cream, 'stroke-width': 5 }, cas);
  el('rect', { x: 50, y: 40, width: 600, height: 120, rx: 8, fill: C.paper }, cas);
  tx(cas, 80, 90, p.rotulo || 'FITA 1  ·  1992', { f: 'mono', size: 30, w: 500, fill: C.ink });
  tx(cas, 80, 130, 'ilustração', { f: 'mono', size: 20, fill: '#6b655a' });
  el('rect', { x: 150, y: 200, width: 400, height: 140, rx: 70, fill: '#0B0A08', stroke: C.dim, 'stroke-width': 3 }, cas);
  const reels = [220, 480].map(cx => {
    const rg = g(cas, { transform: `translate(${cx},270)` });
    el('circle', { cx: 0, cy: 0, r: 58, fill: '#2a2620' }, rg);
    el('circle', { cx: 0, cy: 0, r: 26, fill: C.cream }, rg);
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;
      el('rect', { x: -4, y: -24, width: 8, height: 12, fill: '#191713', transform: `rotate(${k * 60})` }, rg);
      void a;
    }
    return rg;
  });
  el('path', { d: 'M120,430 L170,370 L530,370 L580,430', fill: 'none', stroke: C.cream, 'stroke-width': 4 }, cas);
  // barras comparativas
  const x0 = 360, x1 = 1560, len = x1 - x0;
  const lab1 = tx(c, x0, 700, 'FITA INTEIRA', { f: 'mono', size: 26, w: 500, fill: C.cream, ls: '0.1em' });
  const bar1 = el('rect', { x: x0, y: 720, width: 0, height: 40, fill: C.cream }, c);
  const lab2 = tx(c, x0, 840, 'VERSÃO APRESENTADA NOS JÚRIS', { f: 'mono', size: 26, w: 500, fill: C.cream, ls: '0.1em' });
  const cuts = p.cortes || [[0.12, 0.2], [0.41, 0.47], [0.63, 0.74], [0.86, 0.9]];
  const segs = [];
  let prev = 0;
  cuts.concat([[1, 1]]).forEach(([a, b]) => { segs.push([prev, a]); prev = b; });
  const segEls = segs.map(([a, b]) => el('rect', { x: x0 + a * len, y: 860, width: 0, height: 40, fill: C.dim }, c));
  const holes = cuts.map(([a, b]) => el('rect', { x: x0 + a * len, y: 856, width: (b - a) * len, height: 48, fill: 'none', stroke: C.red, 'stroke-width': 3, 'stroke-dasharray': '8 6', opacity: 0 }, c));
  const lab3 = tx(c, x0 + cuts[2][0] * len, 950, 'trechos que não estavam nas versões usadas para condenar', { f: 'mono', size: 24, fill: C.red, opacity: 0 });
  return t => {
    op(cas, P(t, 0, 0.8));
    const spin = t * 90;
    reels.forEach((r, i) => r.setAttribute('transform', `translate(${i ? 480 : 220},270) rotate(${spin})`));
    rise(lab1, t, 3.2, 0.5, 8);
    bar1.setAttribute('width', len * Ez.io(P(t, 3.4, 5.0)));
    rise(lab2, t, 5.4, 0.5, 8);
    const pw = Ez.io(P(t, 5.6, 7.2));
    segEls.forEach((e, i) => { const [a, b] = segs[i]; e.setAttribute('width', Math.max(0, Math.min(b, pw) - a) * len); });
    holes.forEach((h, i) => op(h, P(t, 7.6 + i * 0.25, 7.9 + i * 0.25)));
    lab3.setAttribute('x', x0 + 0.02 * len);
    op(lab3, P(t, 8.8, 9.4));
  };
};

/* ---------- portas: entrada (café) e saída (cadeado) ---------- */
TEMPLATES.portas = (root, p, D, clip) => {
  const S = stage(root, clip, { bare: true });
  const c = S.content;
  el('line', { x1: 160, y1: 860, x2: 1760, y2: 860, stroke: C.faint, 'stroke-width': 3 }, c);
  // entrada aberta
  const ent = g(c);
  el('rect', { x: 400, y: 250, width: 360, height: 610, fill: '#2a2116', stroke: C.cream, 'stroke-width': 6 }, ent);
  el('rect', { x: 406, y: 256, width: 348, height: 598, fill: C.amber, opacity: 0.18 }, ent);
  el('path', { d: 'M400,250 L300,300 L300,830 L400,860 Z', fill: '#1b1915', stroke: C.cream, 'stroke-width': 5 }, ent);
  el('path', { d: 'M400,860 L760,860 L860,960 L300,960 Z', fill: C.amber, opacity: 0.12 }, ent);
  const labE = tx(c, 580, 210, 'ENTRADA', { f: 'mono', size: 34, w: 500, fill: C.amber, anchor: 'middle', ls: '0.24em' });
  // xícara
  const cup = g(c, { transform: 'translate(580,790)' });
  el('path', { d: 'M-48,-40 L48,-40 L40,30 Q38,44 24,44 L-24,44 Q-38,44 -40,30 Z', fill: C.cream }, cup);
  el('path', { d: 'M46,-24 Q78,-22 74,4 Q70,26 40,22', fill: 'none', stroke: C.cream, 'stroke-width': 9 }, cup);
  el('ellipse', { cx: 0, cy: 50, rx: 74, ry: 10, fill: C.cream, opacity: 0.6 }, cup);
  const steam = [-22, 0, 22].map(dx => el('path', { fill: 'none', stroke: C.cream, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.6 }, cup));
  // saída fechada
  const sai = g(c);
  el('rect', { x: 1160, y: 250, width: 360, height: 610, fill: '#15130F', stroke: C.cream, 'stroke-width': 6 }, sai);
  el('rect', { x: 1190, y: 290, width: 300, height: 240, fill: 'none', stroke: C.faint, 'stroke-width': 4 }, sai);
  el('rect', { x: 1190, y: 580, width: 300, height: 240, fill: 'none', stroke: C.faint, 'stroke-width': 4 }, sai);
  el('circle', { cx: 1480, cy: 560, r: 10, fill: C.dim }, sai);
  const labS = tx(c, 1340, 210, 'SAÍDA', { f: 'mono', size: 34, w: 500, fill: C.red, anchor: 'middle', ls: '0.24em' });
  const lockG = g(c);
  iconLock(lockG, 0, 0, 120, C.red);
  const texto = tx(c, W / 2, FY(clip, 1010), p.texto || 'A de entrada tem café.', { f: 'disp', size: 58, anchor: 'middle' });
  return t => {
    op(ent, P(t, 0.2, 1.0)); op(labE, P(t, 0.6, 1.1));
    op(cup, P(t, 1.0, 1.6));
    steam.forEach((s, i) => {
      const ph = (t * 0.6 + i * 0.33) % 1;
      const y0 = -60 - ph * 90, dx = [-22, 0, 22][i];
      s.setAttribute('d', `M${dx},${y0} q12,-18 0,-36 q-12,-18 0,-36`);
      s.setAttribute('opacity', 0.6 * Math.sin(Math.PI * ph) * P(t, 1.2, 1.8));
    });
    op(sai, P(t, 0.8, 1.6)); op(labS, P(t, 1.2, 1.7));
    const pl = P(t, 2.6, 2.95);
    lockG.setAttribute('transform', `translate(1340,${lerp(420, 560, Ez.out(pl))}) scale(${pl > 0 ? 1 + 0.12 * Math.sin(P(t, 2.95, 3.2) * Math.PI) : 1})`);
    op(lockG, pl);
    rise(texto, t, p.tTexto || 4.2, 0.8, 16);
  };
};

/* ---------- folha pautada com frase repetida (reconstituição) ---------- */
TEMPLATES.folha = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const sheet = g(c, { transform: 'translate(960,520) rotate(-1.4) translate(-440,-380)' });
  el('rect', { x: 0, y: 0, width: 880, height: 760, fill: C.paper }, sheet);
  for (let i = 0; i < 13; i++) el('line', { x1: 0, y1: 100 + i * 50, x2: 880, y2: 100 + i * 50, stroke: '#9fb4c9', 'stroke-width': 1.5, opacity: 0.7 }, sheet);
  el('line', { x1: 90, y1: 0, x2: 90, y2: 760, stroke: '#c9796f', 'stroke-width': 2 }, sheet);
  const frase = p.frase;
  const n = p.linhas || 14;
  const lines = Array.from({ length: n }, (_, i) => tx(sheet, 110, 90 + (i + 1) * 50 - 12, '', { f: 'serif', size: 34, italic: true, fill: '#2b2a3a' }));
  const nota = txLines(c, 120, FY(clip, 1000), p.nota || ['Reconstituição gráfica. Frase relatada pela imprensa local.'], { f: 'mono', size: 22, fill: C.dim, lh: 30 });
  return t => {
    op(sheet, P(t, 0, 0.8));
    let t0 = 1.0;
    lines.forEach((e, i) => {
      const dur = Math.max(0.5, 1.4 - i * 0.12);
      typeIn(e, frase, P(t, t0, t0 + dur));
      t0 += dur + 0.12;
    });
    nota.forEach(e => op(e, P(t, 1.5, 2.2)));
  };
};

/* ---------- recibo (Japão) ---------- */
TEMPLATES.recibo = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const left = tx(c, 160, 360, p.kicker || 'O ARGUMENTO MAIS TEDIOSO DO DIREITO', { f: 'mono', size: 26, fill: C.dim, ls: '0.14em' });
  const big = txLines(c, 156, 530, p.titulo || ['O RECIBO'], { f: 'disp', size: 150, lh: 140 });
  el('rect', { x: 990, y: 130, width: 680, height: 26, rx: 8, fill: '#26231d' }, c);
  const clipId = 'rc' + clip.id.replace(/\W/g, '');
  const cp = el('clipPath', { id: clipId }, S.defs);
  const cpr = el('rect', { x: 1000, y: 150, width: 660, height: 0 }, cp);
  const paper = g(c, { 'clip-path': `url(#${clipId})` });
  const lines = p.linhas;
  const h = 70 + lines.length * 46 + 40;
  let zig = `M1020,150 L1640,150 L1640,${150 + h}`;
  for (let x = 1640; x > 1020; x -= 20) zig += ` L${x - 10},${150 + h + 10} L${x - 20},${150 + h}`;
  zig += ' Z';
  el('path', { d: zig, fill: '#F1EDE3' }, paper);
  lines.forEach((ln, i) => {
    const bold = ln.startsWith('!');
    tx(paper, 1056, 222 + i * 46, bold ? ln.slice(1) : ln, { f: 'mono', size: 28, w: bold ? 600 : 400, fill: C.ink });
  });
  const st = g(c);
  const stT = tx(st, 0, 0, p.carimbo || 'DISSOLVIDA', { f: 'disp', size: 96, fill: C.red, anchor: 'middle', ls: '0.08em' });
  const stB = el('rect', { x: -230, y: -88, width: 460, height: 116, fill: 'none', stroke: C.red, 'stroke-width': 8 }, st);
  const foot = tx(c, 160, FY(clip, 980), p.nota || '', { f: 'mono', size: 22, fill: C.dim });
  const tPrint = 1.0, dPrint = 3.4;
  const tSt = tPrint + dPrint + 0.6;
  return t => {
    rise(left, t, 0.2, 0.5, 8);
    big.forEach((e, i) => rise(e, t, 0.4 + i * 0.15, 0.7, 24));
    const pr = Ez.io(P(t, tPrint, tPrint + dPrint));
    cpr.setAttribute('height', (h + 20) * pr);
    paper.setAttribute('transform', `translate(0,${-(h + 20) * (1 - pr) * 0.0})`);
    const ps = P(t, tSt, tSt + 0.22);
    op(st, 0.9 * Ez.out(ps));
    st.setAttribute('transform', `translate(1330,${150 + h + 40}) rotate(-8) scale(${ps > 0 ? lerp(1.8, 1, Ez.out(ps)) : 1.8})`);
    void stT; void stB;
    op(foot, P(t, tSt + 0.6, tSt + 1.2));
  };
};

/* ---------- Schein: descongelar, mudar, recongelar ---------- */
TEMPLATES.schein = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const xs = [380, 960, 1540], y = 540;
  const titles = ['DESCONGELAR', 'MUDAR', 'RECONGELAR'];
  const labs = titles.map((s, i) => tx(c, xs[i], 760, s, { f: 'disp', size: 64, anchor: 'middle' }));
  const subs = ['a identidade antiga', 'para a forma do grupo', 'a identidade nova'].map((s, i) => tx(c, xs[i], 810, s, { f: 'mono', size: 26, fill: C.dim, anchor: 'middle' }));
  const arrows = [0, 1].map(i => arrowR(c, xs[i] + 170, y, xs[i + 1] - 170, C.faint, 4));
  const cube = el('rect', { fill: C.blue, opacity: 0.9, rx: 14 }, c);
  const puddle = el('ellipse', { cx: xs[0], fill: C.blue, opacity: 0.6 }, c);
  const blob = el('path', { fill: C.blue, opacity: 0.75 }, c);
  const crystal = el('path', { d: `M${xs[2]},${y - 120} L${xs[2] + 110},${y + 80} L${xs[2] - 110},${y + 80} Z`, fill: C.amber }, c);
  const foot = txLines(c, 160, FY(clip, 960), p.nota ? (Array.isArray(p.nota) ? p.nota : [p.nota]) : [], { f: 'mono', size: 26, fill: C.cream, lh: 38 });
  return t => {
    labs.forEach((e, i) => rise(e, t, 0.4 + i * 1.6, 0.5, 12));
    subs.forEach((e, i) => rise(e, t, 0.6 + i * 1.6, 0.5, 8));
    arrows.forEach((a, i) => op(a, P(t, 1.6 + i * 1.6, 2.0 + i * 1.6)));
    // cubo derretendo
    const m = Ez.io(P(t, 0.8, 2.0));
    const hh = lerp(200, 40, m), ww = lerp(200, 240, m);
    cube.setAttribute('x', xs[0] - ww / 2); cube.setAttribute('width', ww);
    cube.setAttribute('y', y + 100 - hh); cube.setAttribute('height', hh);
    puddle.setAttribute('cy', y + 100); puddle.setAttribute('rx', lerp(0, 170, m)); puddle.setAttribute('ry', lerp(0, 20, m));
    op(cube, P(t, 0.2, 0.6)); op(puddle, P(t, 0.6, 1.0));
    // bolha mudando de forma
    const ph = t * 2.2, pb = P(t, 2.0, 2.4);
    let d = '';
    for (let k = 0; k <= 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const r = 110 + 22 * Math.sin(3 * a + ph) + 14 * Math.cos(5 * a - ph * 0.7);
      d += (k ? 'L' : 'M') + (xs[1] + r * Math.cos(a)).toFixed(1) + ',' + (y + r * Math.sin(a) * 0.8).toFixed(1);
    }
    blob.setAttribute('d', d + 'Z'); op(blob, pb * 0.8);
    const pc = Ez.back(P(t, 3.6, 4.2));
    crystal.setAttribute('transform', `translate(${xs[2]},${y}) scale(${pc}) translate(${-xs[2]},${-y})`);
    op(crystal, P(t, 3.6, 3.8));
    foot.forEach((e, i) => rise(e, t, 4.8 + i * 0.3, 0.6, 8));
  };
};

/* ---------- escolha limitada: cada saída fica mais cara ---------- */
TEMPLATES.escolha = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const kick = tx(c, 164, 210, 'ESCOLHA LIMITADA  ·  JANJA LALICH', { f: 'mono', size: 26, fill: C.amber, ls: '0.16em', w: 500 });
  const nodes = p.passos;
  const n = nodes.length, y = 470, x0 = 200, x1 = 1720;
  const xs = nodes.map((_, i) => x0 + (x1 - x0) * i / (n - 1));
  el('line', { x1: x0, y1: y, x2: x1, y2: y, stroke: C.faint, 'stroke-width': 4 }, c);
  const prog = el('line', { x1: x0, y1: y, x2: x0, y2: y, stroke: C.cream, 'stroke-width': 5 }, c);
  const step = (D - 3.5) / n;
  const els = nodes.map((nd, i) => {
    const gg = g(c);
    const dot = el('circle', { cx: xs[i], cy: y, r: 14, fill: C.cream }, gg);
    const lab = txLines(gg, xs[i], y - 70 - (nd.t.length - 1) * 40, nd.t, { f: 'disp', size: 40, anchor: 'middle', upper: true, lh: 40 });
    const heat = i / (n - 1);
    const col = heat < 0.25 ? C.dim : heat < 0.6 ? C.amber : C.red;
    const ex = el('line', { x1: xs[i], y1: y + 18, x2: xs[i], y2: y + 18, stroke: col, 'stroke-width': 3 + heat * 9, 'stroke-dasharray': '10 8' }, gg);
    const sair = tx(gg, xs[i], 700, 'SAIR', { f: 'mono', size: 24, w: 500, fill: col, anchor: 'middle', ls: '0.2em' });
    const custo = txLines(gg, xs[i], 744, nd.custo, { f: 'mono', size: 23, fill: col, anchor: 'middle', lh: 30 });
    return { gg, dot, lab, ex, sair, custo, t0: 1.0 + i * step };
  });
  const runner = el('circle', { cx: x0, cy: y, r: 20, fill: C.amber }, c);
  const foot = tx(c, 160, FY(clip, 990), p.nota || 'Cada escolha é razoável. A saída é que vai ficando cara.', { f: 'mono', size: 28, fill: C.cream });
  return t => {
    rise(kick, t, 0.1, 0.5, 8);
    let xx = x0;
    els.forEach((o, i) => {
      if (t >= o.t0) xx = xs[i];
      else if (i > 0 && t > els[i - 1].t0 + 0.6) xx = lerp(xs[i - 1], xs[i], Ez.io(P(t, els[i - 1].t0 + 0.6, o.t0)));
      o.lab.forEach(e => rise(e, t, o.t0 - 0.2, 0.5, 10));
      op(o.dot, P(t, o.t0 - 0.2, o.t0));
      const pe = Ez.out(P(t, o.t0 + 0.1, o.t0 + 0.6));
      o.ex.setAttribute('y2', y + 18 + 160 * pe);
      op(o.ex, pe > 0 ? 1 : 0);
      op(o.sair, P(t, o.t0 + 0.4, o.t0 + 0.7));
      o.custo.forEach((e, k) => op(e, P(t, o.t0 + 0.5 + k * 0.1, o.t0 + 0.8 + k * 0.1)));
    });
    prog.setAttribute('x2', xx);
    runner.setAttribute('cx', xx);
    op(runner, P(t, 0.8, 1.0));
    rise(foot, t, els[n - 1].t0 + 1.2, 0.6, 8);
  };
};

/* ---------- janela aberta que se fecha de madrugada ---------- */
TEMPLATES.janela = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const house = g(c);
  el('path', { d: 'M420,420 L800,200 L1180,420', fill: 'none', stroke: C.cream, 'stroke-width': 6 }, house);
  el('rect', { x: 460, y: 420, width: 680, height: 460, fill: '#15130F', stroke: C.cream, 'stroke-width': 6 }, house);
  [[520, 480], [520, 680], [740, 480], [740, 680]].forEach(([x, y]) => el('rect', { x, y, width: 140, height: 140, fill: '#0B0A08', stroke: C.dim, 'stroke-width': 4 }, house));
  const fx = 960, fy = 560, fw = 140, fh = 140;
  el('rect', { x: fx, y: fy, width: fw, height: fh, fill: '#0B0A08', stroke: C.cream, 'stroke-width': 5 }, house);
  const light = el('rect', { x: fx, y: fy, width: fw, height: fh, fill: C.amber, opacity: 0 }, c);
  const rays = [];
  for (let i = 0; i < 6; i++) rays.push(el('line', { x1: 1700, y1: 380 + i * 50, x2: fx + fw, y2: fy + 20 + i * 20, stroke: C.amber, 'stroke-width': 3, opacity: 0 }, c));
  const pane = el('rect', { x: fx, y: fy, width: fw, height: fh, fill: '#2a2620', stroke: C.cream, 'stroke-width': 5 }, c);
  const lab = tx(c, fx + fw / 2, fy + fh + 50, 'dissidente', { f: 'mono', size: 28, fill: C.amber, anchor: 'middle' });
  const out = tx(c, 1700, 340, 'informação de fora', { f: 'mono', size: 26, fill: C.amber, anchor: 'end' });
  const clock = tx(c, 1560, 820, '02:30', { f: 'mono', size: 100, w: 500, fill: C.red, anchor: 'middle' });
  const foot = tx(c, 160, FY(clip, 990), p.nota || 'Controle do meio: o primeiro critério de Lifton.', { f: 'mono', size: 28, fill: C.cream });
  return t => {
    op(house, P(t, 0, 0.7));
    const o = Ez.io(P(t, 1.2, 2.0));
    const shut = Ez.in(P(t, 5.2, 5.5));
    const open = o * (1 - shut);
    pane.setAttribute('width', fw * (1 - open));
    op(light, 0.85 * open);
    rays.forEach((r, i) => op(r, open * P(t, 1.8 + i * 0.1, 2.3 + i * 0.1) * 0.8));
    op(lab, P(t, 1.6, 2.1));
    op(out, open * P(t, 2.4, 2.9));
    op(clock, P(t, 4.4, 4.8) * (t > 5.6 ? 1 : (Math.floor(t * 3) % 2 ? 1 : 0.4)));
    rise(foot, t, 6.2, 0.6, 8);
  };
};

/* ---------- crachá e bombardeio de amor ---------- */
TEMPLATES.cracha = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const tag = g(c, { transform: 'translate(220,330) rotate(-4)' });
  el('rect', { x: 0, y: 0, width: 560, height: 380, rx: 22, fill: C.white }, tag);
  el('path', { d: 'M0,22 Q0,0 22,0 L538,0 Q560,0 560,22 L560,130 L0,130 Z', fill: C.red }, tag);
  tx(tag, 280, 80, 'OLÁ', { f: 'disp', size: 76, anchor: 'middle', fill: C.white });
  tx(tag, 280, 118, 'MEU NOME É', { f: 'mono', size: 24, w: 500, anchor: 'middle', fill: C.white, ls: '0.2em' });
  const nome = tx(tag, 280, 290, '', { f: 'serif', size: 110, italic: true, anchor: 'middle', fill: C.ink });
  const frases = p.frases;
  const pos = [[900, 260], [1320, 380], [960, 520], [1380, 640], [920, 780], [1300, 880]];
  const bubbles = frases.map((s, i) => {
    const gg = g(c);
    const te = tx(gg, 0, 0, s, { f: 'mono', size: 27, fill: C.ink });
    const r = el('rect', { rx: 30, fill: C.cream }, gg);
    gg.insertBefore(r, te);
    return { gg, te, r, x: pos[i % pos.length][0], y: pos[i % pos.length][1], laid: false };
  });
  const foot = tx(c, 160, FY(clip, 1000), 'LOVE BOMBING  ·  bombardeio de amor', { f: 'mono', size: 28, w: 500, fill: C.amber, ls: '0.1em' });
  return t => {
    op(tag, P(t, 0, 0.6));
    typeIn(nome, p.nome || 'você', P(t, 0.8, 1.4));
    bubbles.forEach((b, i) => {
      if (!b.laid) {
        const w = b.te.getComputedTextLength();
        b.r.setAttribute('x', -26); b.r.setAttribute('y', -44); b.r.setAttribute('width', w + 52); b.r.setAttribute('height', 64);
        b.laid = true;
      }
      const t0 = 1.6 + i * 0.75;
      const s = Ez.back(P(t, t0, t0 + 0.35));
      b.gg.setAttribute('transform', `translate(${b.x},${b.y}) scale(${s})`);
      op(b.gg, P(t, t0, t0 + 0.15));
    });
    rise(foot, t, 1.6 + bubbles.length * 0.75 + 0.3, 0.6, 8);
  };
};

/* ---------- escada (pé na porta) ---------- */
TEMPLATES.escada = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const kick = tx(c, 164, 220, p.kicker || 'PÉ NA PORTA', { f: 'mono', size: 30, w: 500, fill: C.amber, ls: '0.2em' });
  const steps = p.degraus;
  const n = steps.length, sw = 300, sh = 110, x0 = 200, yb = 900;
  const els = steps.map((s, i) => {
    const gg = g(c);
    const x = x0 + i * sw, y = yb - (i + 1) * sh;
    el('rect', { x, y, width: sw, height: (i + 1) * sh, fill: i === n - 1 ? '#2a2116' : '#1a1814', stroke: C.dim, 'stroke-width': 3 }, gg);
    fitText(txLines(gg, x + 20, y + 48, Array.isArray(s) ? s : [s], { f: 'disp', size: 36, upper: true, lh: 38, fill: i === n - 1 ? C.amber : C.cream }), sw - 36);
    return gg;
  });
  const man = g(c);
  el('circle', { cx: 0, cy: -100, r: 20, fill: C.amber }, man);
  el('rect', { x: -20, y: -76, width: 40, height: 76, rx: 14, fill: C.amber }, man);
  const foot = tx(c, 160, FY(clip, 1000), p.nota || '', { f: 'mono', size: 24, fill: C.dim });
  const step = (D - 2.5) / n;
  return t => {
    rise(kick, t, 0.1, 0.5, 8);
    els.forEach((e, i) => rise(e, t, 0.5 + i * step, 0.5, 20));
    let k = clamp(Math.floor((t - 0.9) / step), 0, n - 1);
    const local = P(t, 0.9 + k * step, 0.9 + k * step + 0.4);
    const prevX = x0 + Math.max(0, k - 1) * sw + sw / 2, prevY = yb - Math.max(0, k) * sh;
    const nx = x0 + k * sw + sw / 2, ny = yb - (k + 1) * sh;
    const xx = k === 0 ? nx : lerp(prevX, nx, Ez.io(local));
    const yy = k === 0 ? ny : lerp(prevY, ny, Ez.io(local)) - Math.sin(Math.PI * local) * 40;
    man.setAttribute('transform', `translate(${xx},${yy})`);
    op(man, P(t, 0.9, 1.2));
    op(foot, P(t, D - 1.6, D - 1.0));
  };
};

/* ---------- placar 1 x 1 ---------- */
TEMPLATES.placar = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const kick = tx(c, W / 2, 230, p.titulo, { f: 'mono', size: 28, w: 500, fill: C.dim, anchor: 'middle', ls: '0.16em' });
  el('rect', { x: 360, y: 300, width: 1200, height: 380, rx: 10, fill: '#121110', stroke: C.faint, 'stroke-width': 3 }, c);
  const sides = [p.esq, p.dir].map((s, i) => {
    const gg = g(c);
    const cx = i ? 1260 : 660;
    tx(gg, cx, 370, s.ano, { f: 'disp', size: 60, anchor: 'middle', fill: C.cream });
    txLines(gg, cx, 420, s.caso, { f: 'mono', size: 22, anchor: 'middle', fill: C.dim, lh: 30 });
    const res = tx(gg, cx, 600, s.resultado, { f: 'disp', size: 84, anchor: 'middle', fill: s.cor ? C[s.cor] : C.cream });
    return { gg, res };
  });
  const score = tx(c, W / 2, 610, '0 × 0', { f: 'disp', size: 150, anchor: 'middle', fill: C.amber });
  const foot = tx(c, W / 2, 820, p.nota || '', { f: 'mono', size: 30, anchor: 'middle', fill: C.cream });
  return t => {
    rise(kick, t, 0.1, 0.5, 8);
    sides.forEach((s, i) => { op(s.gg, P(t, 0.6 + i * 1.6, 1.0 + i * 1.6)); });
    const a = t > 1.3 ? 1 : 0, b = t > 2.9 ? 1 : 0;
    score.textContent = `${a} × ${b}`;
    op(score, P(t, 0.3, 0.7));
    rise(foot, t, 3.8, 0.6, 8);
  };
};

/* ---------- balança ---------- */
TEMPLATES.balanca = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const cx = 960, cy = 330;
  el('path', { d: `M${cx},${cy} L${cx - 70},860 L${cx + 70},860 Z`, fill: '#1c1a16', stroke: C.dim, 'stroke-width': 3 }, c);
  const beam = g(c);
  el('rect', { x: -560, y: -8, width: 1120, height: 16, rx: 8, fill: C.cream }, beam);
  el('circle', { cx: 0, cy: 0, r: 18, fill: C.amber }, beam);
  const pans = [-1, 1].map(sd => {
    const pg = g(c);
    el('line', { x1: 0, y1: 0, x2: -150, y2: 220, stroke: C.dim, 'stroke-width': 2 }, pg);
    el('line', { x1: 0, y1: 0, x2: 150, y2: 220, stroke: C.dim, 'stroke-width': 2 }, pg);
    el('path', { d: 'M-190,220 L190,220 L160,250 L-160,250 Z', fill: C.cream }, pg);
    return pg;
  });
  const heads = [p.esq.titulo, p.dir.titulo].map((s, i) => tx(c, i ? 1520 : 400, 240, s, { f: 'mono', size: 28, w: 500, anchor: 'middle', fill: i ? C.cream : C.amber, ls: '0.14em' }));
  const items = [p.esq.itens, p.dir.itens].map((arr, sd) => arr.map(s => {
    const gg = g(c);
    const te = tx(gg, 0, 0, s, { f: 'mono', size: 22, fill: C.ink, anchor: 'middle' });
    const r = el('rect', { fill: sd ? C.cream : C.amber, rx: 4 }, gg);
    gg.insertBefore(r, te);
    return { gg, te, r, laid: false };
  }));
  const foot = tx(c, W / 2, FY(clip, 990), p.nota || '', { f: 'mono', size: 30, anchor: 'middle', fill: C.cream });
  const nL = items[0].length, nR = items[1].length;
  return t => {
    let wl = 0, wr = 0;
    const tl = i => 0.8 + i * 0.6, trr = i => 0.8 + nL * 0.6 + 0.4 + i * 0.6;
    items[0].forEach((o, i) => { if (t > tl(i)) wl += Ez.out(P(t, tl(i), tl(i) + 0.4)); });
    items[1].forEach((o, i) => { if (t > trr(i)) wr += Ez.out(P(t, trr(i), trr(i) + 0.4)) * (nL / nR); });
    const ang = clamp((wr - wl) * 4, -9, 9);
    beam.setAttribute('transform', `translate(${cx},${cy}) rotate(${ang})`);
    const rad = ang * Math.PI / 180;
    const pts = [-1, 1].map(sd => [cx + sd * 540 * Math.cos(rad), cy + sd * 540 * Math.sin(rad)]);
    pans.forEach((pg, i) => pg.setAttribute('transform', `translate(${pts[i][0]},${pts[i][1]})`));
    heads.forEach((h, i) => op(h, P(t, 0.3 + i * (nL * 0.6 + 0.4), 0.7 + i * (nL * 0.6 + 0.4))));
    [0, 1].forEach(sd => items[sd].forEach((o, i) => {
      if (!o.laid) { const w = o.te.getComputedTextLength(); o.r.setAttribute('x', -w / 2 - 12); o.r.setAttribute('y', -26); o.r.setAttribute('width', w + 24); o.r.setAttribute('height', 36); o.laid = true; }
      const t0 = sd ? trr(i) : tl(i);
      const pe = Ez.out(P(t, t0, t0 + 0.4));
      const [px, py] = pts[sd];
      o.gg.setAttribute('transform', `translate(${px},${lerp(py + 120, py + 210 - i * 40, pe)})`);
      op(o.gg, pe);
    }));
    rise(foot, t, trr(nR - 1) + 1.0, 0.6, 8);
  };
};

/* ---------- celular: o curso introdutório de hoje ---------- */
TEMPLATES.celular = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const left = txLines(c, 156, 380, p.titulo || ['O CURSO', 'INTRODUTÓRIO', 'NÃO PRECISA', 'MAIS DE SALA.'], { f: 'disp', size: 100, lh: 100 });
  const ph = g(c, { transform: 'translate(1180,150)' });
  el('rect', { x: 0, y: 0, width: 440, height: 820, rx: 52, fill: '#0B0A08', stroke: C.cream, 'stroke-width': 6 }, ph);
  el('rect', { x: 170, y: 22, width: 100, height: 22, rx: 11, fill: '#24211c' }, ph);
  el('circle', { cx: 90, cy: 140, r: 46, fill: C.dim }, ph);
  tx(ph, 152, 132, p.perfil || '@seu.mentor', { f: 'mono', size: 26, w: 500, fill: C.cream });
  tx(ph, 152, 166, 'mentoria  ·  despertar', { f: 'mono', size: 20, fill: C.dim });
  const btn = g(ph);
  el('rect', { x: 40, y: 230, width: 360, height: 76, rx: 38, fill: C.amber }, btn);
  tx(btn, 220, 279, 'LINK NA BIO', { f: 'disp', size: 40, anchor: 'middle', fill: C.ink });
  tx(ph, 220, 380, 'a turma fecha em', { f: 'mono', size: 22, fill: C.dim, anchor: 'middle' });
  const cd = tx(ph, 220, 450, '00:59:59', { f: 'mono', size: 64, w: 500, fill: C.red, anchor: 'middle' });
  const vip = g(ph);
  el('rect', { x: 40, y: 520, width: 360, height: 120, rx: 14, fill: '#1c1a16', stroke: C.dim, 'stroke-width': 2 }, vip);
  tx(vip, 220, 572, 'GRUPO VIP', { f: 'disp', size: 44, anchor: 'middle' });
  tx(vip, 220, 612, 'últimas 3 vagas', { f: 'mono', size: 22, fill: C.amber, anchor: 'middle' });
  const notif = g(ph);
  el('rect', { x: 30, y: 680, width: 380, height: 90, rx: 18, fill: C.cream }, notif);
  tx(notif, 60, 718, 'Fulano entrou no grupo', { f: 'mono', size: 21, fill: C.ink });
  tx(notif, 60, 748, 'agora mesmo', { f: 'mono', size: 18, fill: '#6b655a' });
  const foot = tx(c, 160, FY(clip, 1000), p.nota || 'O café e o biscoito agora são por sua conta.', { f: 'mono', size: 28, fill: C.cream });
  return t => {
    left.forEach((e, i) => rise(e, t, 0.2 + i * 0.15, 0.7, 24));
    rise(ph, t, 0.6, 0.8, 40);
    const secs = Math.max(0, 3599 - Math.floor(t * 1));
    const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
    cd.textContent = `00:${mm}:${ss}`;
    const pulse = 1 + 0.04 * Math.sin(t * 6);
    btn.setAttribute('transform', `translate(220,268) scale(${pulse}) translate(-220,-268)`);
    const pn = Ez.out(P(t, 3.2, 3.6)) * (1 - Ez.in(P(t, 6.0, 6.4)));
    notif.setAttribute('transform', `translate(0,${(1 - pn) * 30})`); op(notif, pn);
    rise(foot, t, 4.0, 0.6, 8);
  };
};

/* ---------- jornal (palavra destacada, sem texto inventado) ---------- */
TEMPLATES.jornal = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const pg = g(c, { transform: 'translate(960,540) rotate(-2) translate(-560,-380)' });
  el('rect', { x: 0, y: 0, width: 1120, height: 760, fill: C.paper }, pg);
  tx(pg, 560, 70, p.cabecalho || 'JORNAL AMERICANO  ·  SETEMBRO DE 1950', { f: 'mono', size: 24, w: 500, fill: '#5d574c', anchor: 'middle', ls: '0.2em' });
  el('line', { x1: 40, y1: 96, x2: 1080, y2: 96, stroke: C.ink, 'stroke-width': 3 }, pg);
  el('line', { x1: 40, y1: 104, x2: 1080, y2: 104, stroke: C.ink, 'stroke-width': 1 }, pg);
  const hl = el('rect', { x: 150, y: 170, width: 0, height: 120, fill: C.amber, opacity: 0.8 }, pg);
  const word = tx(pg, 560, 270, p.palavra || 'BRAIN-WASHING', { f: 'disp', size: 130, anchor: 'middle', fill: C.ink });
  const R = rng(11);
  const bars = [];
  for (let col = 0; col < 3; col++) for (let i = 0; i < 9; i++) {
    const w = 290 - R() * (i === 8 ? 140 : 30);
    bars.push(el('rect', { x: 50 + col * 345, y: 360 + i * 40, width: w, height: 14, fill: '#b9b09e' }, pg));
  }
  const foot = txLines(c, 160, FY(clip, 1000), [p.nota || 'Ilustração.'], { f: 'mono', size: 24, fill: C.dim });
  return t => {
    rise(pg, t, 0.1, 0.8, 30);
    op(word, P(t, 0.6, 1.0));
    hl.setAttribute('width', 820 * Ez.io(P(t, 1.4, 2.2)));
    bars.forEach((b, i) => op(b, P(t, 0.8 + i * 0.01, 1.0 + i * 0.01)));
    foot.forEach(e => op(e, P(t, 2.4, 3.0)));
  };
};

/* ---------- esotérico x exotérico ---------- */
TEMPLATES.esoterico = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const cx = 760, cy = 560;
  const outer = el('circle', { cx, cy, r: 380, fill: 'none', stroke: C.dim, 'stroke-width': 3, 'stroke-dasharray': '10 10' }, c);
  const inner = el('circle', { cx, cy, r: 150, fill: C.amber, 'fill-opacity': 0.15, stroke: C.amber, 'stroke-width': 4 }, c);
  const R = rng(5);
  const dots = [];
  for (let i = 0; i < 60; i++) {
    const a = R() * Math.PI * 2, r0 = 420 + R() * 120;
    const goes = i % 8 === 0;
    dots.push({ e: el('circle', { r: 7, fill: goes ? C.amber : C.cream }, c), a, r0, r1: goes ? 40 + R() * 90 : 230 + R() * 140, goes, d: R() });
  }
  const l1 = tx(c, 1240, 380, 'EXOTÉRICO', { f: 'disp', size: 76 });
  const l1b = tx(c, 1244, 430, 'o ensino para quem está de fora', { f: 'mono', size: 26, fill: C.dim });
  const l2 = tx(c, 1240, 620, 'ESOTÉRICO', { f: 'disp', size: 76, fill: C.amber });
  const l2b = tx(c, 1244, 670, 'do grego esōterikós: de dentro', { f: 'mono', size: 26, fill: C.dim });
  const foot = tx(c, 1244, 760, p.nota || 'Guarde essa diferença.', { f: 'mono', size: 28, fill: C.cream });
  return t => {
    op(outer, P(t, 0.1, 0.6)); op(inner, P(t, 0.4, 0.9));
    dots.forEach(d => {
      const pr = Ez.io(P(t, 1.2 + d.d * 1.2, 3.2 + d.d * 1.4));
      const r = lerp(d.r0, d.r1, pr);
      d.e.setAttribute('cx', cx + r * Math.cos(d.a)); d.e.setAttribute('cy', cy + r * Math.sin(d.a));
      op(d.e, P(t, 0.6, 1.2) * (r > 470 ? 0.4 : 1));
    });
    rise(l1, t, 1.0, 0.5, 10); rise(l1b, t, 1.2, 0.5, 8);
    rise(l2, t, 2.4, 0.5, 10); rise(l2b, t, 2.6, 0.5, 8);
    rise(foot, t, 4.2, 0.6, 8);
  };
};

/* ---------- leilão (Cult Awareness Network) ---------- */
TEMPLATES.leilao = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const kick = tx(c, 164, 220, p.kicker, { f: 'mono', size: 28, w: 500, fill: C.dim, ls: '0.14em' });
  const ttl = txLines(c, 158, 320, p.titulo, { f: 'disp', size: 80, lh: 84, upper: true });
  const lots = p.lotes.map((s, i) => {
    const gg = g(c);
    const x = 160 + i * 540, y = 470;
    el('rect', { x, y, width: 480, height: 340, fill: '#16140F', stroke: C.dim, 'stroke-width': 3 }, gg);
    tx(gg, x + 30, y + 60, `LOTE ${i + 1}`, { f: 'mono', size: 26, fill: C.dim, ls: '0.2em' });
    txLines(gg, x + 30, y + 140, Array.isArray(s) ? s : [s], { f: 'disp', size: 60, upper: true, lh: 60 });
    const st = g(gg);
    tx(st, 0, 0, 'ARREMATADO', { f: 'disp', size: 52, anchor: 'middle', fill: C.red, ls: '0.1em' });
    el('rect', { x: -170, y: -50, width: 340, height: 68, fill: 'none', stroke: C.red, 'stroke-width': 5 }, st);
    return { gg, st, x, y };
  });
  const gav = g(c);
  el('rect', { x: -14, y: 0, width: 28, height: 190, rx: 10, fill: C.dim }, gav);
  el('rect', { x: -70, y: -40, width: 140, height: 70, rx: 12, fill: C.cream }, gav);
  const foot = tx(c, 160, FY(clip, 960), p.nota || '', { f: 'mono', size: 30, fill: C.cream });
  return t => {
    rise(kick, t, 0.1, 0.5, 8);
    ttl.forEach((e, i) => rise(e, t, 0.3 + i * 0.15, 0.6, 20));
    lots.forEach((o, i) => {
      const t0 = 1.2 + i * 1.1;
      rise(o.gg, t, t0, 0.5, 20);
      const ps = P(t, t0 + 0.6, t0 + 0.8);
      op(o.st, ps);
      o.st.setAttribute('transform', `translate(${o.x + 240},${o.y + 296}) rotate(-6) scale(${lerp(1.6, 1, Ez.out(ps))})`);
    });
    // martelo bate em cada lote
    let ang = -40, gx = 1680;
    lots.forEach((o, i) => { const t0 = 1.2 + i * 1.1 + 0.6; const k = P(t, t0 - 0.25, t0); const back = P(t, t0, t0 + 0.3); if (t > t0 - 0.25) ang = lerp(-40, 10, Ez.in(k)) - 50 * Ez.out(back) * (t > t0 ? 1 : 0); });
    gav.setAttribute('transform', `translate(${gx},300) rotate(${ang})`);
    op(gav, P(t, 1.0, 1.3));
    void gx;
    rise(foot, t, 1.2 + lots.length * 1.1 + 0.6, 0.6, 8);
  };
};

/* ---------- lista tarjada (Esquire, 1962) ---------- */
TEMPLATES.tarjada = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const kick = tx(c, 164, 210, p.kicker, { f: 'mono', size: 26, w: 500, fill: C.dim, ls: '0.16em' });
  const ttl = txLines(c, 158, 300, p.titulo, { f: 'disp', size: 72, lh: 76, upper: true });
  const y0 = 300 + p.titulo.length * 76 + 40;
  const rows = Array.from({ length: p.total }, (_, i) => {
    const gg = g(c);
    const y = y0 + i * 44;
    el('rect', { x: 166, y: y - 18, width: 16, height: 4, fill: C.dim }, gg);
    if (i === p.revela) {
      const hl = el('rect', { x: 200, y: y - 34, width: 0, height: 40, fill: C.amber }, gg);
      const te = tx(gg, 212, y, p.nome, { f: 'disp', size: 38, fill: C.ink, upper: true });
      return { gg, hl, te, rev: true };
    }
    const R = rng(i + 3);
    el('rect', { x: 200, y: y - 30, width: 300 + R() * 300, height: 32, fill: '#000' }, gg);
    return { gg };
  });
  const foot = tx(c, 160, FY(clip, 990), p.nota || '', { f: 'mono', size: 26, fill: C.cream });
  return t => {
    rise(kick, t, 0.1, 0.5, 8);
    ttl.forEach((e, i) => rise(e, t, 0.3 + i * 0.12, 0.6, 18));
    rows.forEach((r, i) => {
      op(r.gg, P(t, 1.0 + i * 0.12, 1.2 + i * 0.12));
      if (r.rev) { const pr = Ez.io(P(t, 2.6, 3.2)); r.hl.setAttribute('width', 620 * pr); op(r.te, P(t, 2.9, 3.2)); }
    });
    rise(foot, t, 4.0, 0.6, 8);
  };
};

/* ---------- E = mc² ---------- */
TEMPLATES.emc2 = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const eq = tx(c, 700, 560, 'E = mc²', { f: 'serif', size: 250, italic: true, anchor: 'middle' });
  const tag = g(c);
  el('rect', { x: 1280, y: 640, width: 420, height: 110, fill: 'none', stroke: C.amber, 'stroke-width': 4 }, tag);
  tx(tag, 1490, 715, 'TELA MENTAL', { f: 'disp', size: 64, anchor: 'middle', fill: C.amber });
  const ln = el('path', { d: 'M1280,695 C1200,695 1190,640 1170,600', fill: 'none', stroke: C.amber, 'stroke-width': 3 }, c);
  const foot = txLines(c, 160, 900, p.nota || ['Albert Einstein (1879–1955)', 'não chegou a ver a Tela Mental.'], { f: 'mono', size: 32, fill: C.cream, lh: 46 });
  return t => {
    rise(eq, t, 0.2, 0.8, 30);
    op(tag, P(t, 1.4, 1.8)); op(ln, P(t, 1.6, 2.0));
    foot.forEach((e, i) => rise(e, t, 2.8 + i * 0.4, 0.6, 8));
  };
};

/* ---------- troca de palavra (Pró-Mente → Pró-Vida) ---------- */
TEMPLATES.troca = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const pre = tx(c, 0, 600, p.prefixo, { f: 'disp', size: 230 });
  const a = tx(c, 0, 600, p.de, { f: 'disp', size: 230, fill: C.cream });
  const b = tx(c, 0, 600, p.para, { f: 'disp', size: 230, fill: C.amber });
  const y1 = tx(c, 0, 720, p.anoDe, { f: 'mono', size: 40, fill: C.dim });
  const y2 = tx(c, 0, 720, p.anoPara, { f: 'mono', size: 40, fill: C.amber });
  const foot = tx(c, W / 2, 900, p.nota || '', { f: 'mono', size: 32, fill: C.cream, anchor: 'middle' });
  let laid = false;
  return t => {
    if (!laid) {
      const wp = pre.getComputedTextLength(), wa = a.getComputedTextLength(), wb = b.getComputedTextLength();
      const tot = wp + Math.max(wa, wb), x0 = W / 2 - tot / 2;
      pre.setAttribute('x', x0); a.setAttribute('x', x0 + wp); b.setAttribute('x', x0 + wp);
      y1.setAttribute('x', x0 + wp + 6); y2.setAttribute('x', x0 + wp + 6);
      laid = true;
    }
    rise(pre, t, 0.2, 0.6, 20);
    const k = Ez.io(P(t, 2.0, 2.6));
    op(a, P(t, 0.2, 0.8) * (1 - k)); a.setAttribute('transform', `translate(0,${-40 * k})`);
    op(b, k); b.setAttribute('transform', `translate(0,${40 * (1 - k)})`);
    op(y1, P(t, 0.6, 1.0) * (1 - k)); op(y2, k);
    rise(foot, t, 3.4, 0.6, 8);
  };
};

/* ---------- sequência de caixas com uma fora de ordem ---------- */
TEMPLATES.sequencia = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const kick = tx(c, 164, 260, p.kicker || '', { f: 'mono', size: 26, fill: C.dim, ls: '0.16em', w: 500 });
  const n = p.etapas.length, bw = 330, gap = 70;
  const x0 = W / 2 - (n * bw + (n - 1) * gap) / 2;
  const boxes = p.etapas.map((s, i) => {
    const hl = i === p.alvo;
    const b = boxText(c, x0 + i * (bw + gap), 440, bw, 180, Array.isArray(s) ? s : [s], { size: 52, stroke: C.dim });
    return { ...b, hl };
  });
  const arrows = p.etapas.slice(1).map((_, i) => arrowR(c, x0 + (i + 1) * (bw + gap) - gap + 10, 530, x0 + (i + 1) * (bw + gap) - 10, C.dim, 3));
  const q = tx(c, 0, 410, '?', { f: 'disp', size: 120, anchor: 'middle', fill: C.red });
  const foot = txLines(c, W / 2, 800, p.nota ? (Array.isArray(p.nota) ? p.nota : [p.nota]) : [], { f: 'mono', size: 32, anchor: 'middle', fill: C.cream, lh: 46 });
  return t => {
    rise(kick, t, 0.1, 0.5, 8);
    boxes.forEach((b, i) => rise(b.gg, t, 0.4 + i * 0.4, 0.5, 16));
    arrows.forEach((a, i) => op(a, P(t, 0.7 + i * 0.4, 0.9 + i * 0.4)));
    const tA = 0.6 + n * 0.4 + 0.6;
    const k = P(t, tA, tA + 0.3);
    const tgt = boxes[p.alvo];
    tgt.r.setAttribute('stroke', k > 0.5 ? C.red : C.dim);
    tgt.r.setAttribute('stroke-width', k > 0.5 ? 6 : 3);
    tgt.te.forEach(e => e.setAttribute('fill', k > 0.5 ? C.red : C.cream));
    // tremida de "espera aí"
    const sh = P(t, tA + 0.3, tA + 0.9);
    tgt.gg.setAttribute('transform', `translate(${Math.sin(sh * Math.PI * 8) * (1 - sh) * 10},0)`);
    q.setAttribute('x', x0 + p.alvo * (bw + gap) + bw / 2);
    op(q, P(t, tA + 0.2, tA + 0.5));
    foot.forEach((e, i) => rise(e, t, tA + 1.2 + i * 0.4, 0.6, 8));
  };
};

/* ---------- etiqueta de museu trocada ---------- */
TEMPLATES.etiqueta = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const tag = (x, y, lines, sub, col) => {
    const gg = g(c);
    const th = 190 + lines.length * 72 + sub.length * 30;
    el('path', { d: `M${x + 40},${y - 140} L${x + 40},${y}`, stroke: C.dim, 'stroke-width': 3 }, gg);
    el('path', { d: `M${x},${y} L${x + 560},${y} L${x + 560},${y + th} L${x},${y + th} Z`, fill: C.paper }, gg);
    el('circle', { cx: x + 40, cy: y + 30, r: 12, fill: C.bg }, gg);
    tx(gg, x + 80, y + 70, 'COLEÇÃO', { f: 'mono', size: 24, w: 500, fill: '#5d574c', ls: '0.2em' });
    txLines(gg, x + 76, y + 150, lines, { f: 'disp', size: 76, fill: col, lh: 72 });
    txLines(gg, x + 80, y + 150 + lines.length * 72 + 4, sub, { f: 'mono', size: 22, fill: '#5d574c', lh: 30 });
    return gg;
  };
  const a = tag(220, 360, p.antes.titulo, p.antes.sub, C.ink);
  const strikes = p.antes.titulo.map((_, i) => el('line', { x1: 286, y1: 360 + 150 + i * 72 - 24, x2: 286, y2: 360 + 150 + i * 72 - 24, stroke: C.red, 'stroke-width': 9 }, a));
  const b = tag(1100, 360, p.depois.titulo, p.depois.sub, C.ink);
  const arr = arrowR(c, 820, 510, 1080, C.amber, 4);
  const foot = tx(c, 160, FY(clip, 960), p.nota || '', { f: 'mono', size: 28, fill: C.cream });
  return t => {
    const sw = Math.sin(t * 1.6) * 1.2;
    const pa = Ez.out(P(t, 0.2, 0.9));
    a.setAttribute('transform', `translate(0,${(1 - pa) * -60}) rotate(${sw} 260 220)`); op(a, pa);
    strikes.forEach((st, i) => st.setAttribute('x2', 286 + 440 * Ez.io(P(t, 1.8 + i * 0.25, 2.2 + i * 0.25))));
    op(arr, P(t, 2.6, 3.0));
    const pb = Ez.back(P(t, 3.0, 3.7));
    b.setAttribute('transform', `translate(0,${(1 - pb) * -60}) rotate(${-sw} 1140 220)`); op(b, P(t, 3.0, 3.3));
    rise(foot, t, 4.4, 0.6, 8);
  };
};

/* ---------- cartões de contato (canais de ajuda) ---------- */
TEMPLATES.contatos = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const kick = tx(c, 164, 230, p.kicker || 'CANAIS QUE NÃO COBRAM CURSO INTRODUTÓRIO', { f: 'mono', size: 28, w: 500, fill: C.amber, ls: '0.12em' });
  const cards = p.itens.map((o, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 160 + col * 540, y = 300 + row * 330;
    const gg = g(c);
    el('rect', { x, y, width: 500, height: 290, fill: '#16140F', stroke: C.faint, 'stroke-width': 3 }, gg);
    txLines(gg, x + 34, y + 110, o.t, { f: 'disp', size: o.t.length > 1 ? 64 : 92, lh: 64 });
    txLines(gg, x + 36, y + 210, o.s, { f: 'mono', size: 24, fill: C.dim, lh: 32 });
    return gg;
  });
  return t => {
    rise(kick, t, 0.1, 0.5, 8);
    cards.forEach((e, i) => rise(e, t, 0.4 + i * 0.25, 0.6, 16));
  };
};

/* ---------- duas águias ---------- */
TEMPLATES.duasaguias = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const cols = [p.esq, p.dir].map((s, i) => {
    const x = i ? 1010 : 170;
    const gg = g(c);
    iconEagle(gg, x + 90, 330, 150, i ? C.red : C.cream);
    tx(gg, x + 200, 320, s.titulo, { f: 'disp', size: 80, fill: i ? C.red : C.cream });
    tx(gg, x + 204, 366, s.sub, { f: 'mono', size: 24, fill: C.dim });
    const its = s.itens.map((ln, k) => txLines(gg, x + 4, 500 + k * 110, Array.isArray(ln) ? ln : [ln], { f: 'mono', size: 30, fill: C.cream, lh: 40 }));
    return { gg, its };
  });
  el('line', { x1: 960, y1: 260, x2: 960, y2: 900, stroke: C.faint, 'stroke-width': 2 }, c);
  return t => {
    cols.forEach((o, i) => {
      const t0 = 0.3 + i * 2.4;
      op(o.gg, P(t, t0, t0 + 0.4));
      o.its.forEach((arr, k) => arr.forEach(e => rise(e, t, t0 + 0.6 + k * 0.5, 0.5, 10)));
    });
  };
};

/* ---------- organograma (relatos de ex-integrantes) ---------- */
TEMPLATES.organograma = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const wm = tx(c, 960, 620, 'TESTEMUNHO', { f: 'disp', size: 300, anchor: 'middle', fill: C.violet, op: 0.06, ls: '0.1em' });
  wm.setAttribute('transform', 'rotate(-8 960 560)');
  const lv = [
    { y: 220, items: [['COMANDANTE MUNDIAL']] },
    { y: 400, items: [['COMANDANTES NACIONAIS']] },
    { y: 580, items: [['FORÇAS VIVAS']] },
    { y: 780, items: [['CORPO DE', 'SEGURANÇA'], ['BRIGADA DE', 'TRABALHO'], ['BRIGADA', 'FEMININA']] }
  ];
  const nodes = [];
  lv.forEach((L, li) => {
    const n = L.items.length, bw = n > 1 ? 330 : 520, bh = n > 1 ? 130 : 96, gap = 60;
    const x0 = 960 - (n * bw + (n - 1) * gap) / 2;
    L.items.forEach((s, i) => {
      const b = boxText(c, x0 + i * (bw + gap), L.y - bh / 2, bw, bh, s, { size: 44, stroke: li === 2 ? C.violet : C.dim, color: li === 2 ? C.violet : C.cream });
      nodes.push({ ...b, li, cx: x0 + i * (bw + gap) + bw / 2, top: L.y - bh / 2, bot: L.y + bh / 2 });
    });
  });
  const links = [];
  const byLv = li => nodes.filter(n => n.li === li);
  for (let li = 1; li < lv.length; li++) byLv(li).forEach(n => {
    const par = byLv(li - 1)[0];
    links.push({ e: el('path', { d: `M${par.cx},${par.bot} V${(par.bot + n.top) / 2} H${n.cx} V${n.top}`, fill: 'none', stroke: C.faint, 'stroke-width': 3 }, c), li });
  });
  const sw = g(c);
  tx(sw, 1480, 330, 'UNIFORMES', { f: 'mono', size: 22, fill: C.dim, ls: '0.16em' });
  [['#0a0a0a', 'preto'], ['#5a3b22', 'marrom'], ['#1d2a44', 'azul-escuro']].forEach(([col, nm], i) => {
    el('rect', { x: 1480, y: 350 + i * 56, width: 40, height: 40, fill: col, stroke: C.dim, 'stroke-width': 2 }, sw);
    tx(sw, 1536, 380 + i * 56, nm, { f: 'mono', size: 24, fill: C.cream });
  });
  const man = g(c);
  el('rect', { x: 140, y: 300, width: 380, height: 200, fill: '#16140F', stroke: C.red, 'stroke-width': 3, 'stroke-dasharray': '10 6' }, man);
  tx(man, 170, 360, 'MANUAL DO DIRIGENTE', { f: 'disp', size: 42, fill: C.red });
  txLines(man, 172, 410, ['secreto até para os', 'membros comuns'], { f: 'mono', size: 24, fill: C.cream, lh: 32 });
  return t => {
    op(wm, 0.06 * P(t, 0, 1));
    nodes.forEach(n => rise(n.gg, t, 0.3 + n.li * 0.7, 0.5, 14));
    links.forEach(l => op(l.e, P(t, 0.2 + l.li * 0.7, 0.5 + l.li * 0.7)));
    op(sw, P(t, 3.4, 3.9));
    op(man, P(t, 4.2, 4.7));
  };
};

/* ---------- funil de alta demanda (6 andares) ---------- */
TEMPLATES.funil = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const andares = p.andares, n = andares.length, k = p.ativo || 0;
  const cx = 560, top = 230, bh = 110, wTop = 760, wBot = 180;
  const bands = andares.map((s, i) => {
    const w1 = lerp(wTop, wBot, i / n), w2 = lerp(wTop, wBot, (i + 1) / n);
    const y1 = top + i * bh, y2 = y1 + bh - 8;
    const act = k === i + 1;
    const col = act ? C.amber : (k && i + 1 < k ? '#2a2620' : '#1e1c18');
    const band = el('path', { d: `M${cx - w1 / 2},${y1} L${cx + w1 / 2},${y1} L${cx + w2 / 2},${y2} L${cx - w2 / 2},${y2} Z`, fill: col, stroke: act ? C.amber : C.faint, 'stroke-width': 2 }, c);
    const num = tx(c, cx, y1 + 68, String(i + 1), { f: 'disp', size: 56, anchor: 'middle', fill: act ? C.ink : C.dim });
    const lab = tx(c, 1060, y1 + 66, s, { f: k ? 'mono' : 'disp', size: k ? (act ? 40 : 28) : 50, w: act ? 500 : 400, fill: act ? C.amber : (k ? C.dim : C.cream), upper: !k });
    return { band, num, lab, y1 };
  });
  const R = rng(9);
  const parts = [];
  for (let i = 0; i < 70; i++) {
    const exitAt = Math.min(n, Math.floor(Math.pow(R(), 0.55) * (n + 0.999)));
    parts.push({ e: el('circle', { r: 6, fill: C.cream }, c), x: (R() - 0.5) * wTop * 0.8, delay: R() * 4, exitAt, side: R() < 0.5 ? -1 : 1 });
  }
  const kick = tx(c, 1060, 190, p.kicker || 'QUASE TODO GRUPO DE ALTA DEMANDA FUNCIONA COMO UM FUNIL', { f: 'mono', size: 22, fill: C.dim, ls: '0.1em' });
  const foot = p.nota ? txLines(c, 1060, FY(clip, 980), Array.isArray(p.nota) ? p.nota : [p.nota], { f: 'mono', size: 26, fill: C.cream, lh: 36 }) : [];
  const dur = 3.2;
  return t => {
    op(kick, P(t, 0.1, 0.6));
    bands.forEach((b, i) => { op(b.band, P(t, 0.2 + i * 0.12, 0.5 + i * 0.12)); op(b.num, P(t, 0.3 + i * 0.12, 0.6 + i * 0.12)); rise(b.lab, t, 0.4 + i * 0.15, 0.5, 10); });
    parts.forEach(pt => {
      const life = ((t - 0.8 - pt.delay) / dur);
      if (life < 0) { op(pt.e, 0); return; }
      const cyc = life % 1;
      const yy = top - 40 + cyc * (n * bh + 80);
      const floor = Math.floor((yy - top) / bh);
      const w = lerp(wTop, wBot, clamp((yy - top) / (n * bh)));
      let xx = cx + pt.x * (w / wTop);
      let a = 1;
      if (floor >= pt.exitAt && pt.exitAt < n) {
        const out = clamp((yy - (top + pt.exitAt * bh)) / bh);
        xx += pt.side * out * 260; a = 1 - out;
      }
      pt.e.setAttribute('cx', xx); pt.e.setAttribute('cy', yy);
      op(pt.e, a * 0.9 * P(t, 0.8, 1.4));
    });
    foot.forEach((e, i) => rise(e, t, 2.2 + i * 0.25, 0.6, 8));
  };
};

/* ---------- BITE, com mordida ---------- */
TEMPLATES.bite = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const letters = [['B', 'COMPORTAMENTO', 'behavior'], ['I', 'INFORMAÇÃO', 'information'], ['T', 'PENSAMENTO', 'thought'], ['E', 'EMOÇÃO', 'emotion']];
  const mid = 'bm' + clip.id.replace(/\W/g, '');
  const mask = el('mask', { id: mid }, S.defs);
  el('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }, mask);
  // mordida: um círculo grande na borda direita do E, com marcas de dente no contorno
  const bites = [{ e: el('circle', { cx: 1700, cy: 380, r: 0, fill: '#000' }, mask), r: 74 }];
  for (let i = 0; i < 6; i++) {
    const a = (120 + i * 24) * Math.PI / 180;
    bites.push({ e: el('circle', { cx: 1700 + 74 * Math.cos(a), cy: 380 + 74 * Math.sin(a), r: 0, fill: '#000' }, mask), r: 16 });
  }
  const cols = letters.map(([L, pt, en], i) => {
    const x = 330 + i * 420;
    const gg = g(c);
    const big = tx(gg, x, 560, L, { f: 'disp', size: 380, anchor: 'middle', fill: i === 3 ? C.amber : C.cream });
    if (i === 3) big.setAttribute('mask', `url(#${mid})`);
    tx(gg, x, 660, pt, { f: 'disp', size: 50, anchor: 'middle' });
    tx(gg, x, 705, en, { f: 'mono', size: 24, anchor: 'middle', fill: C.dim, italic: false });
    return gg;
  });
  const kick = tx(c, 164, 220, 'MODELO BITE  ·  STEVEN HASSAN', { f: 'mono', size: 26, w: 500, fill: C.amber, ls: '0.16em' });
  const foot = tx(c, 160, FY(clip, 960), p.nota || 'Em inglês, bite quer dizer mordida.', { f: 'mono', size: 30, fill: C.cream });
  return t => {
    rise(kick, t, 0.1, 0.5, 8);
    cols.forEach((e, i) => rise(e, t, 0.4 + i * 0.5, 0.6, 30));
    bites.forEach(b => b.e.setAttribute('r', b.r * Ez.back(P(t, 3.3, 3.55))));
    rise(foot, t, 3.9, 0.6, 8);
  };
};

/* ---------- fluxo de etapas com setas ---------- */
TEMPLATES.fluxo = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const kick = p.kicker ? tx(c, 164, 230, p.kicker, { f: 'mono', size: 26, w: 500, fill: clip.somber ? C.dim : C.amber, ls: '0.14em' }) : null;
  const ttl = p.titulo ? txLines(c, 158, 330, Array.isArray(p.titulo) ? p.titulo : [p.titulo], { f: 'disp', size: 80, lh: 84, upper: true }) : [];
  const n = p.etapas.length, gap = 56;
  const bw = Math.min(n <= 2 ? 600 : 380, (1600 - (n - 1) * gap) / n), bh = p.bh || 220;
  const x0 = W / 2 - (n * bw + (n - 1) * gap) / 2, y = p.y || 480;
  const boxes = p.etapas.map((s, i) => {
    const o = typeof s === 'string' ? { t: [s] } : s;
    const gg = g(c);
    el('rect', { x: x0 + i * (bw + gap), y, width: bw, height: bh, fill: o.destaque ? '#2a2116' : '#16140F', stroke: o.destaque ? C.amber : C.dim, 'stroke-width': 3 }, gg);
    const tl = txLines(gg, x0 + i * (bw + gap) + 24, y + 70, o.t, { f: 'disp', size: o.size || 44, upper: true, lh: (o.size || 44) * 1.05, fill: o.destaque ? C.amber : C.cream });
    fitText(tl, bw - 48);
    if (o.s) fitText(txLines(gg, x0 + i * (bw + gap) + 26, y + bh - 24 - (o.s.length - 1) * 30, o.s, { f: 'mono', size: 22, fill: C.dim, lh: 30 }), bw - 48);
    return gg;
  });
  const arrows = p.etapas.slice(1).map((_, i) => arrowR(c, x0 + (i + 1) * (bw + gap) - gap + 8, y + bh / 2, x0 + (i + 1) * (bw + gap) - 8, C.dim, 3));
  const foot = p.nota ? txLines(c, 164, FY(clip, p.notaY || 900), Array.isArray(p.nota) ? p.nota : [p.nota], { f: 'mono', size: 30, fill: C.cream, lh: 44 }) : [];
  const step = p.passo || 0.8;
  return t => {
    if (kick) rise(kick, t, 0.1, 0.5, 8);
    ttl.forEach((e, i) => rise(e, t, 0.25 + i * 0.12, 0.6, 18));
    boxes.forEach((b, i) => rise(b, t, 0.6 + i * step, 0.5, 16));
    arrows.forEach((a, i) => op(a, P(t, 0.9 + i * step, 1.2 + i * step)));
    foot.forEach((e, i) => rise(e, t, 0.8 + n * step + i * 0.3, 0.6, 8));
  };
};

/* ---------- ficha (matrícula, contrato, catálogo) com carimbos ---------- */
TEMPLATES.ficha = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const fw = p.w || 900, fh = 740, fy = 170;
  const fx = p.x !== undefined ? p.x : (p.cafe ? 260 : (W - fw) / 2);
  const card = g(c, { transform: `rotate(${p.rot !== undefined ? p.rot : -1.5} ${fx + fw / 2} ${fy + fh / 2})` });
  el('rect', { x: fx, y: fy, width: fw, height: fh, fill: C.paper }, card);
  el('rect', { x: fx, y: fy, width: fw, height: 16, fill: p.corFaixa ? C[p.corFaixa] : C.red }, card);
  tx(card, fx + 50, fy + 90, p.cabecalho, { f: 'mono', size: 24, w: 500, fill: '#5d574c', ls: '0.18em' });
  txLines(card, fx + 46, fy + 170, Array.isArray(p.titulo) ? p.titulo : [p.titulo], { f: 'disp', size: 72, fill: C.ink, lh: 72 });
  const tl = (Array.isArray(p.titulo) ? p.titulo.length : 1);
  const y0 = fy + 170 + tl * 72 + 30;
  const fields = p.campos.map((f, i) => {
    const y = y0 + i * 86;
    tx(card, fx + 50, y, f.l, { f: 'mono', size: 22, fill: '#6b655a', ls: '0.12em' });
    el('line', { x1: fx + 50, y1: y + 48, x2: fx + fw - 50, y2: y + 48, stroke: '#bdb3a0', 'stroke-width': 2 }, card);
    const v = tx(card, fx + 52, y + 40, '', { f: f.f || 'serif', size: f.size || 38, italic: f.f ? false : true, fill: f.cor ? C[f.cor] : '#2b2a3a', w: f.f === 'disp' ? 700 : 400 });
    return { v, s: f.v };
  });
  const stamps = (p.carimbos || []).map((s, i) => {
    const st = g(c);
    const col = C[s.cor || 'red'];
    const te = tx(st, 0, 0, s.t, { f: 'disp', size: s.size || 72, anchor: 'middle', fill: col, ls: '0.06em', upper: true });
    const r = el('rect', { fill: 'none', stroke: col, 'stroke-width': 7 }, st);
    return { st, te, r, s, laid: false };
  });
  const cup = p.cafe ? (() => {
    const cg = g(c, { transform: `translate(${fx + fw + 160},760)` });
    el('ellipse', { cx: 0, cy: 70, rx: 150, ry: 26, fill: C.cream, opacity: 0.85 }, cg);
    el('path', { d: 'M-80,-60 L80,-60 L68,50 Q64,70 40,70 L-40,70 Q-64,70 -68,50 Z', fill: C.cream }, cg);
    el('path', { d: 'M78,-36 Q132,-34 124,8 Q118,42 66,36', fill: 'none', stroke: C.cream, 'stroke-width': 14 }, cg);
    el('ellipse', { cx: 0, cy: -60, rx: 80, ry: 14, fill: '#3b2a1c' }, cg);
    const bis = g(cg, { transform: 'translate(-40,150)' });
    el('rect', { x: -70, y: -20, width: 150, height: 54, rx: 10, fill: '#c9964f' }, bis);
    for (let i = 0; i < 5; i++) el('circle', { cx: -44 + i * 26, cy: 6, r: 4, fill: '#8a5f2a' }, bis);
    const steam = [-30, 0, 30].map(() => el('path', { fill: 'none', stroke: C.cream, 'stroke-width': 6, 'stroke-linecap': 'round' }, cg));
    return { cg, steam };
  })() : null;
  const foot = p.nota ? txLines(c, 160, FY(clip, 1000), Array.isArray(p.nota) ? p.nota : [p.nota], { f: 'mono', size: 24, fill: C.dim, lh: 32 }) : [];
  const tF = 0.9;
  return t => {
    rise(card, t, 0.1, 0.7, 30);
    let tt = tF;
    fields.forEach(f => { const d = 0.25 + f.s.length * 0.03; typeIn(f.v, f.s, P(t, tt, tt + d)); tt += d + 0.2; });
    stamps.forEach((o, i) => {
      if (!o.laid) {
        const bb = o.te.getBBox();
        o.r.setAttribute('x', bb.x - 26); o.r.setAttribute('y', bb.y - 8); o.r.setAttribute('width', bb.width + 52); o.r.setAttribute('height', bb.height + 16);
        o.laid = true;
      }
      const t0 = tt + 0.3 + i * 0.9;
      const ps = P(t, t0, t0 + 0.2);
      op(o.st, 0.9 * Ez.out(ps));
      o.st.setAttribute('transform', `translate(${fx + o.s.x},${fy + o.s.y}) rotate(${o.s.r || -10}) scale(${ps > 0 ? lerp(1.8, 1, Ez.out(ps)) : 1.8})`);
    });
    if (cup) {
      op(cup.cg, P(t, 0.6, 1.2));
      cup.steam.forEach((s, i) => {
        const ph = (t * 0.5 + i * 0.33) % 1;
        const y0 = -90 - ph * 110, dx = [-30, 0, 30][i];
        s.setAttribute('d', `M${dx},${y0} q14,-22 0,-44 q-14,-22 0,-44`);
        s.setAttribute('opacity', 0.55 * Math.sin(Math.PI * ph));
      });
    }
    const tn = tt + 0.4 + stamps.length * 0.9;
    foot.forEach((e, i) => rise(e, t, tn + i * 0.2, 0.6, 8));
  };
};

/* ---------- dissonância cognitiva ---------- */
TEMPLATES.dissonancia = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const kick = tx(c, 164, 220, 'DISSONÂNCIA COGNITIVA', { f: 'mono', size: 28, w: 500, fill: C.amber, ls: '0.16em' });
  const mk = (s, col) => { const b = boxText(c, 0, 0, 640, 200, s, { size: 58, stroke: col, color: col }); return b; };
  const A = mk(['EU SOU', 'INTELIGENTE'], C.cream);
  const B = mk(['EU ENTREGUEI', 'TUDO A UM ERRO'], C.red);
  const res = tx(c, W / 2, 840, '', { f: 'disp', size: 76, anchor: 'middle', fill: C.amber });
  const resS = p.resultado || '“AGORA QUE EU JÁ PEGUEI O CHALÉ.”';
  const lab = tx(c, W / 2, 920, 'nome popular', { f: 'mono', size: 26, fill: C.dim, anchor: 'middle' });
  return t => {
    rise(kick, t, 0.1, 0.5, 8);
    const pin = Ez.out(P(t, 0.3, 1.0));
    const meet = Ez.in(P(t, 1.8, 2.6));
    const xa = lerp(-700, lerp(240, 600, meet), pin), xb = lerp(W + 60, lerp(1040, 680, meet), pin);
    const k = P(t, 2.6, 3.4);
    const sh = k > 0 && k < 1 ? Math.sin(k * Math.PI * 10) * (1 - k) * 14 : 0;
    const back = Ez.out(P(t, 3.2, 3.8));
    A.gg.setAttribute('transform', `translate(${xa - back * 360 + sh},360)`);
    B.gg.setAttribute('transform', `translate(${xb + back * 360 - sh},360)`);
    typeIn(res, resS, P(t, 3.8, 3.8 + resS.length * 0.04));
    op(lab, P(t, 4.8, 5.3));
  };
};
