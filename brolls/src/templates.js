/* Templates dos B-rolls. Cada um recebe (raiz, params, duração, clipe) e devolve frame(t). */
const TEMPLATES = {};

/* ============================================================
 * GENÉRICOS DE TELA CHEIA
 * ============================================================ */

/* Cartela de abertura da série */
TEMPLATES.titulo = (root, p, D, clip) => {
  const S = stage(root, clip, { bare: true });
  const c = S.content;
  const k = tx(c, W / 2, 330, 'UMA SÉRIE EM TRÊS PARTES', { f: 'mono', size: 24, fill: C.dim, anchor: 'middle', ls: '0.3em' });
  const l1 = tx(c, W / 2, 530, 'NINGUÉM ENTRA', { f: 'disp', size: 200, anchor: 'middle' });
  const l2 = tx(c, W / 2, 710, 'NUMA SEITA', { f: 'disp', size: 200, anchor: 'middle' });
  const rule = el('line', { x1: W / 2, y1: 778, x2: W / 2, y2: 778, stroke: C.red, 'stroke-width': 4 }, c);
  const sub = tx(c, W / 2, 860, '', { f: 'mono', size: 38, anchor: 'middle', w: 500, ls: '0.06em' });
  const subS = `${p.parte}  —  ${p.sub}`;
  return t => {
    op(k, P(t, 0.1, 0.7));
    rise(l1, t, 0.3, 0.9, 50); rise(l2, t, 0.6, 0.9, 50);
    const pr = Ez.io(P(t, 1.2, 1.9));
    rule.setAttribute('x1', W / 2 - 380 * pr); rule.setAttribute('x2', W / 2 + 380 * pr);
    typeIn(sub, subS, P(t, 1.8, 1.8 + subS.length * 0.035));
  };
};

/* Cartela de capítulo */
TEMPLATES.capitulo = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const acc = clip.somber ? C.dim : C.amber;
  const n = p.linhas.length, lh = 150;
  const y0 = 560 - (n - 1) * lh / 2;
  const kick = tx(c, 164, y0 - 150, `CAPÍTULO ${p.num}`, { f: 'mono', size: 30, fill: acc, ls: '0.25em', w: 500 });
  const lines = txLines(c, 154, y0, p.linhas, { f: 'disp', size: 150, lh, upper: true });
  const yR = y0 + (n - 1) * lh + 70;
  const rule = el('line', { x1: 164, y1: yR, x2: 164, y2: yR, stroke: acc, 'stroke-width': 4 }, c);
  return t => {
    rise(kick, t, 0.1, 0.5, 10);
    lines.forEach((e, i) => rise(e, t, 0.3 + i * 0.15, 0.8, 34));
    rule.setAttribute('x2', 164 + 560 * Ez.io(P(t, 0.9, 1.6)));
  };
};

/* Local e data, em máquina de escrever */
TEMPLATES.dateline = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const slow = clip.somber ? 1.6 : 1;
  const lugar = tx(c, 160, 400, '', { f: 'mono', size: 40, w: 500, ls: '0.14em', fill: clip.somber ? C.dim : C.amber });
  const cur = el('rect', { x: 160, y: 366, width: 22, height: 42, fill: C.cream }, c);
  const data = tx(c, 150, 640, p.data, { f: 'disp', size: 250, ls: '0.02em' });
  const hora = p.hora ? tx(c, 1760, 640, p.hora, { f: 'mono', size: 120, w: 500, anchor: 'end', fill: C.red }) : null;
  const subs = txLines(c, 164, 760, p.sub || [], { f: 'mono', size: 32, fill: C.dim, lh: 46 });
  const tLug = 0.3 * slow, dLug = p.lugar.length * 0.045 * slow;
  return t => {
    typeIn(lugar, p.lugar, P(t, tLug, tLug + dLug));
    const w = lugar.getComputedTextLength();
    cur.setAttribute('x', 164 + w + 6);
    op(cur, (Math.floor(t * 2.2) % 2 === 0 || t < tLug + dLug) ? 1 : 0);
    rise(data, t, tLug + dLug + 0.1, 0.9 * slow, 40);
    if (hora) {
      const ph = P(t, tLug + dLug + 0.7, tLug + dLug + 0.9);
      op(hora, ph * (t > tLug + dLug + 1.2 ? (Math.floor(t * 1.6) % 2 === 0 ? 1 : 0.25) : 1));
    }
    subs.forEach((e, i) => rise(e, t, tLug + dLug + 1.0 * slow + i * 0.25, 0.6, 14));
  };
};

/* Citação literal, palavra por palavra */
TEMPLATES.citacao = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const size = p.size || 76, lh = size * 1.28;
  const cat = p.cat ? CAT[p.cat] : null;
  const col = clip.somber ? C.dim : (cat ? cat.color : C.amber);
  const n = p.linhas.length;
  const y0 = 540 - (n * lh) / 2 + size * 0.75 - 30;
  const mark = tx(c, 150, y0 + 70, '“', { f: 'serif', size: 300, fill: col, italic: true });
  const words = [];
  p.linhas.forEach((ln, i) => {
    const te = el('text', { x: 260, y: y0 + i * lh, 'font-family': FONT.serif, 'font-size': size, 'font-style': p.reto ? 'normal' : 'italic', fill: C.cream }, c);
    ln.split(' ').forEach((wd, j, arr) => {
      const hl = p.destaque && p.destaque.some(h => wd.replace(/[.,;:"“”…]/g, '').toLowerCase() === h.toLowerCase());
      const ts = el('tspan', { fill: hl ? col : C.cream }, te);
      ts.textContent = wd + (j < arr.length - 1 ? ' ' : '');
      words.push(ts);
    });
  });
  const autor = txLines(c, 264, y0 + n * lh + 40, Array.isArray(p.autor) ? p.autor : [p.autor], { f: 'mono', size: 28, fill: C.dim, lh: 40 });
  const per = clip.somber ? 0.16 : 0.11;
  const tEnd = 0.5 + words.length * per;
  return t => {
    op(mark, P(t, 0.1, 0.6));
    words.forEach((w, i) => w.setAttribute('fill-opacity', Ez.out(P(t, 0.5 + i * per, 0.5 + i * per + 0.35))));
    autor.forEach((e, i) => rise(e, t, tEnd + 0.2 + i * 0.15, 0.6, 10));
  };
};

/* Etimologia: palavra, raiz e sentido, com ilustração opcional */
TEMPLATES.etimologia = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const word = tx(c, 160, 410, p.palavra, { f: 'disp', size: 180, upper: true });
  const de = tx(c, 166, 500, `do ${p.lingua || 'latim'}`, { f: 'mono', size: 30, fill: C.dim, ls: '0.1em' });
  const raizes = p.raizes || [{ raiz: p.raiz, sentido: p.sentido }];
  const cols = raizes.map((r, i) => {
    const x = 160 + i * 520;
    const gg = g(c);
    tx(gg, x, 630, r.raiz, { f: 'serif', size: 120, italic: true, fill: C.amber });
    tx(gg, x + 6, 710, `“${r.sentido}”`, { f: 'mono', size: 40, w: 500 });
    if (r.obs) tx(gg, x + 6, 760, r.obs, { f: 'mono', size: 24, fill: C.dim });
    return gg;
  });
  const nota = p.nota ? txLines(c, 166, 880, Array.isArray(p.nota) ? p.nota : [p.nota], { f: 'mono', size: 30, fill: C.cream, lh: 44 }) : [];
  const gag = p.gag ? GAGS[p.gag](c) : null;
  return t => {
    rise(word, t, 0.1, 0.7, 30);
    rise(de, t, 0.7, 0.5, 8);
    cols.forEach((e, i) => rise(e, t, 1.0 + i * 0.7, 0.7, 24));
    const tn = 1.9 + (cols.length - 1) * 0.7;
    nota.forEach((e, i) => rise(e, t, tn + i * 0.3, 0.6, 10));
    if (gag) gag(t);
  };
};

/* pequenas ilustrações para a etimologia */
const GAGS = {
  cadeira(c) {
    const gg = g(c, { transform: 'translate(1180,360)' });
    const chair = (x, col) => {
      const ch = g(gg);
      el('rect', { x, y: 10, width: 120, height: 90, rx: 8, fill: 'none', stroke: col, 'stroke-width': 9 }, ch);
      el('line', { x1: x + 20, y1: 32, x2: x + 100, y2: 32, stroke: col, 'stroke-width': 6, opacity: 0.6 }, ch);
      el('path', { d: `M${x - 14},112 L${x + 134},112 L${x + 124},130 L${x - 4},130 Z`, fill: col }, ch);
      el('path', { d: `M${x + 6},130 L${x - 2},204 M${x + 114},130 L${x + 122},204`, fill: 'none', stroke: col, 'stroke-width': 9, 'stroke-linecap': 'round' }, ch);
      return ch;
    };
    chair(40, C.dim);
    const mover = chair(200, C.cream);
    const lab = tx(gg, 420, 290, 'à parte', { f: 'mono', size: 30, fill: C.amber, anchor: 'middle' });
    el('line', { x1: 0, y1: 206, x2: 620, y2: 206, stroke: C.faint, 'stroke-width': 3 }, gg);
    return t => {
      const pr = Ez.io(P(t, 2.6, 3.6));
      mover.setAttribute('transform', `translate(${pr * 230},0)`);
      op(lab, P(t, 3.5, 4.0));
    };
  },
  soleira(c) {
    const gg = g(c, { transform: 'translate(1180,250)' });
    el('rect', { x: 260, y: 40, width: 220, height: 420, fill: 'none', stroke: C.dim, 'stroke-width': 8 }, gg);
    const sill = el('line', { x1: 250, y1: 460, x2: 490, y2: 460, stroke: C.amber, 'stroke-width': 12 }, gg);
    el('line', { x1: -40, y1: 466, x2: 620, y2: 466, stroke: C.faint, 'stroke-width': 3 }, gg);
    const man = g(gg);
    el('circle', { cx: 0, cy: 300, r: 26, fill: C.cream }, man);
    el('rect', { x: -26, y: 336, width: 52, height: 120, rx: 18, fill: C.cream }, man);
    const lab = tx(gg, 370, 520, 'soleira', { f: 'mono', size: 30, fill: C.amber, anchor: 'middle' });
    const parou = tx(gg, 140, 250, '', { f: 'mono', size: 24, fill: C.dim, anchor: 'middle' });
    return t => {
      const pr = Ez.out(P(t, 2.4, 4.0));
      man.setAttribute('transform', `translate(${40 + pr * 190},0)`);
      op(lab, P(t, 2.0, 2.5));
      op(sill, 0.6 + 0.4 * P(t, 2.0, 2.5));
      typeIn(parou, '(e ficou aqui)', P(t, 4.4, 5.2));
    };
  },
  decimo(c) {
    const gg = g(c, { transform: 'translate(1200,360)' });
    const cells = [];
    for (let i = 0; i < 10; i++) {
      const x = (i % 5) * 110, y = Math.floor(i / 5) * 110;
      cells.push(el('rect', { x, y, width: 90, height: 90, fill: 'none', stroke: C.dim, 'stroke-width': 4 }, gg));
    }
    const lab = tx(gg, 270, 290, '1/10', { f: 'disp', size: 80, anchor: 'middle', fill: C.amber });
    return t => {
      cells.forEach((e, i) => op(e, P(t, 1.2 + i * 0.06, 1.4 + i * 0.06)));
      const f = P(t, 2.4, 2.8);
      cells[9].setAttribute('fill', f > 0 ? C.amber : 'none');
      cells[9].setAttribute('fill-opacity', f);
      op(lab, P(t, 2.8, 3.3));
    };
  }
};

/* Números grandes com contagem */
TEMPLATES.numeros = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const n = p.itens.length;
  const size = p.size || (n <= 2 ? 230 : n === 3 ? 190 : 150);
  const titulo = p.titulo ? tx(c, 160, 270, p.titulo, { f: 'mono', size: 30, fill: C.dim, ls: '0.18em', upper: true }) : null;
  const span = 1600 / n;
  const tiles = p.itens.map((it, i) => {
    const x = 160 + i * span;
    const gg = g(c);
    const num = tx(gg, x, 600, '', { f: 'disp', size, fill: it.cor ? C[it.cor] : C.cream });
    const lab = txLines(gg, x + 6, 680, it.label || [], { f: 'mono', size: 28, fill: C.dim, lh: 40 });
    el('line', { x1: x + 4, y1: 630, x2: x + span - 80, y2: 630, stroke: C.faint, 'stroke-width': 2 }, gg);
    return { gg, num, lab, it };
  });
  const nota = p.nota ? txLines(c, 166, 900, Array.isArray(p.nota) ? p.nota : [p.nota], { f: 'mono', size: 26, fill: C.cream, lh: 38 }) : [];
  const finalStr = it => it.texto !== undefined ? it.texto : (it.pre || '') + fmt(it.v, it.dec || 0) + (it.suf || '');
  let fitted = false;
  return t => {
    if (!fitted) {
      // reduz a fonte de cada número para caber na sua coluna
      tiles.forEach(o => {
        o.num.textContent = finalStr(o.it);
        const w = o.num.getComputedTextLength(), max = span - 70;
        if (w > max) o.num.setAttribute('font-size', Math.floor(size * max / w));
      });
      fitted = true;
    }
    if (titulo) rise(titulo, t, 0.1, 0.5, 8);
    tiles.forEach((o, i) => {
      const t0 = 0.4 + i * 0.4;
      const pr = P(t, t0, t0 + 1.3);
      op(o.gg, P(t, t0, t0 + 0.3));
      const it = o.it;
      if (it.texto !== undefined) o.num.textContent = it.texto;
      else {
        const v = (clip.somber || it.fixo) ? it.v : it.v * Ez.out5(pr);
        o.num.textContent = (it.pre || '') + fmt(v, it.dec || 0) + (it.suf || '');
      }
    });
    const tn = 0.4 + n * 0.4 + 1.0;
    nota.forEach((e, i) => rise(e, t, tn + i * 0.25, 0.6, 10));
  };
};

/* Linha do tempo horizontal */
TEMPLATES.linhatempo = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const acc = clip.somber ? C.cream : C.amber;
  const ev = p.eventos, n = ev.length;
  const titulo = p.titulo ? tx(c, 160, 280, p.titulo, { f: 'disp', size: 70, upper: true }) : null;
  const y = 560, x0 = 140, x1 = 1780;
  el('line', { x1: x0, y1: y, x2: x1, y2: y, stroke: C.faint, 'stroke-width': 3 }, c);
  const prog = el('line', { x1: x0, y1: y, x2: x0, y2: y, stroke: acc, 'stroke-width': 4 }, c);
  const xs = ev.map((e, i) => x0 + (x1 - x0) * (i + 0.5) / n);
  const step = Math.min(1.5, (D - 2.2) / n);
  const nodes = ev.map((e, i) => {
    const gg = g(c);
    const col = e.destaque ? C.red : acc;
    const dot = el('circle', { cx: xs[i], cy: y, r: 12, fill: C.bg, stroke: col, 'stroke-width': 4 }, gg);
    const ano = tx(gg, xs[i], y - 46, e.ano, { f: 'disp', size: p.anoSize || 70, anchor: 'middle', fill: e.destaque ? C.red : C.cream });
    const txt = txLines(gg, xs[i], y + 70, e.txt, { f: 'mono', size: p.txtSize || 24, anchor: 'middle', fill: C.dim, lh: 34 });
    return { gg, dot, col, ano, txt, t0: 0.6 + i * step };
  });
  const nota = p.nota ? tx(c, 160, FY(clip, 930), p.nota, { f: 'mono', size: 28, fill: C.cream }) : null;
  return t => {
    if (titulo) rise(titulo, t, 0.1, 0.6, 16);
    const last = nodes[n - 1].t0;
    const pr = P(t, 0.4, last + 0.2);
    // a barra de progresso alcança cada nó no seu t0
    let xx = x0;
    for (let i = 0; i < n; i++) {
      const a = i === 0 ? 0.4 : nodes[i - 1].t0, b = nodes[i].t0;
      const xa = i === 0 ? x0 : xs[i - 1];
      if (t >= b) xx = xs[i];
      else if (t > a) { xx = lerp(xa, xs[i], Ez.io(P(t, a, b))); break; }
      else break;
    }
    prog.setAttribute('x2', xx);
    nodes.forEach(o => {
      const on = P(t, o.t0, o.t0 + 0.25);
      o.dot.setAttribute('fill', on > 0.5 ? o.col : C.bg);
      o.dot.setAttribute('r', 12 + 6 * Math.sin(Math.PI * on));
      rise(o.ano, t, o.t0, 0.5, 16);
      o.txt.forEach((e, k) => rise(e, t, o.t0 + 0.15 + k * 0.08, 0.5, 10));
    });
    if (nota) rise(nota, t, last + 0.8, 0.6, 10);
    void pr;
  };
};

/* Lista de 8 com item ativo (Lifton, oito perguntas) */
TEMPLATES.lista8 = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const it = p.itens, k = p.ativo;
  const titulo = tx(c, 160, 230, p.titulo, { f: 'mono', size: 26, fill: C.dim, ls: '0.18em', upper: true });
  if (!k) {
    // visão geral 2 x 4
    const cells = it.map((o, i) => {
      const col = i < 4 ? 0 : 1, row = i % 4;
      const x = 160 + col * 820, y = 400 + row * 150;
      const gg = g(c);
      tx(gg, x, y, String(i + 1).padStart(2, '0'), { f: 'disp', size: 84, fill: C.amber });
      txLines(gg, x + 120, y - 18, o.tl || [o.t], { f: 'disp', size: (o.tl && o.tl.length > 1) ? 44 : 56, lh: 46, upper: true });
      return gg;
    });
    return t => {
      rise(titulo, t, 0.1, 0.5, 8);
      cells.forEach((e, i) => rise(e, t, 0.4 + i * 0.35, 0.6, 18));
    };
  }
  const o = it[k - 1];
  const big = tx(c, 150, 590, String(k).padStart(2, '0'), { f: 'disp', size: 380, fill: 'none' });
  big.setAttribute('stroke', C.amber); big.setAttribute('stroke-width', 3);
  const tl = o.tl || [o.t];
  const tlines = txLines(c, 160, 720, tl, { f: 'disp', size: tl.length > 1 ? 80 : 96, lh: 86, upper: true });
  const dy = 720 + (tl.length - 1) * 86 + 80;
  const dl = (o.d || []).map((s, i) => ({ e: tx(c, 164, dy + i * 46, '', { f: 'mono', size: 32 }), s }));
  const list = it.map((x, i) => {
    const y = 330 + i * 72;
    const gg = g(c);
    const active = i === k - 1;
    const col = active ? C.amber : (i < k - 1 ? C.dim : C.faint);
    if (active) el('rect', { x: 1150, y: y - 34, width: 8, height: 46, fill: C.amber }, gg);
    tx(gg, 1180, y, String(i + 1).padStart(2, '0'), { f: 'mono', size: 26, w: 500, fill: col });
    tx(gg, 1240, y, x.curto || x.t, { f: 'mono', size: 26, w: active ? 500 : 400, fill: active ? C.cream : col });
    return gg;
  });
  let total = 0; dl.forEach(d => total += d.s.length);
  return t => {
    rise(titulo, t, 0.05, 0.4, 8);
    list.forEach((e, i) => op(e, P(t, 0.1 + i * 0.04, 0.4 + i * 0.04)));
    const pb = Ez.out(P(t, 0.2, 0.9));
    op(big, pb); big.setAttribute('transform', `translate(${(1 - pb) * -30},0)`);
    tlines.forEach((e, i) => rise(e, t, 0.5 + i * 0.12, 0.6, 20));
    let acc = 0; const t0 = 1.1, cps = 38;
    dl.forEach(d => { typeIn(d.e, d.s, P(t, t0 + acc / cps, t0 + (acc + d.s.length) / cps)); acc += d.s.length; });
  };
};

/* Barras horizontais */
TEMPLATES.barras = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const it = p.itens, n = it.length;
  const max = p.max || Math.max(...it.map(o => o.v));
  const titulo = p.titulo ? tx(c, 160, 270, p.titulo, { f: 'disp', size: 70, upper: true }) : null;
  const sub = p.sub ? tx(c, 164, 320, p.sub, { f: 'mono', size: 26, fill: C.dim }) : null;
  const gap = p.gap || (n <= 3 ? 170 : 130), bh = p.bh || 64;
  const y0 = 540 - ((n - 1) * gap) / 2 + (titulo ? 40 : 0);
  const xL = 160, xB = p.xBar || 640, maxLen = 1760 - xB - (p.reserva || 260);
  const rows = it.map((o, i) => {
    const y = y0 + i * gap;
    const gg = g(c);
    const lab = txLines(gg, xL, y - (o.label.length - 1) * 18 + 10, o.label, { f: 'mono', size: 28, fill: C.cream, lh: 36 });
    el('line', { x1: xB, y1: y - bh / 2 - 8, x2: xB, y2: y + bh / 2 + 8, stroke: C.faint, 'stroke-width': 2 }, gg);
    const bar = el('rect', { x: xB, y: y - bh / 2, width: 0, height: bh, fill: o.cor ? C[o.cor] : (clip.somber ? C.cream : C.amber) }, gg);
    const val = tx(gg, xB + 20, y + 22, '', { f: 'disp', size: 66 });
    return { gg, bar, val, o, len: Math.max(4, maxLen * o.v / max), lab };
  });
  const nota = p.nota ? txLines(c, 164, FY(clip, 960), Array.isArray(p.nota) ? p.nota : [p.nota], { f: 'mono', size: 26, fill: C.dim, lh: 38 }) : [];
  const stepT = p.step || 0.7;
  return t => {
    if (titulo) rise(titulo, t, 0.1, 0.6, 14);
    if (sub) rise(sub, t, 0.3, 0.6, 8);
    rows.forEach((r, i) => {
      const t0 = 0.6 + i * stepT;
      op(r.gg, P(t, t0 - 0.2, t0 + 0.1));
      const pr = Ez.out(P(t, t0, t0 + 1.2));
      const len = r.len * pr;
      r.bar.setAttribute('width', len);
      r.val.setAttribute('x', xB + len + 22);
      r.val.textContent = r.o.txt ? (pr > 0.95 ? r.o.txt : (r.o.pre || '') + fmt(r.o.v * pr, r.o.dec || 0) + (r.o.suf || '')) : (r.o.pre || '') + fmt(r.o.v * pr, r.o.dec || 0) + (r.o.suf || '');
    });
    const tn = 0.6 + n * stepT + 1.0;
    nota.forEach((e, i) => rise(e, t, tn + i * 0.2, 0.6, 8));
  };
};

/* Duas colunas, com opção de riscar a esquerda */
TEMPLATES.comparacao = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const size = p.size || 62, lh = size * 1.3;
  const col = (side, x) => {
    const gg = g(c);
    const h = tx(gg, x, 300, side.titulo, { f: 'mono', size: 28, w: 500, fill: side.cor ? C[side.cor] : C.amber, ls: '0.14em', upper: true });
    el('line', { x1: x, y1: 330, x2: x + 680, y2: 330, stroke: C.faint, 'stroke-width': 2 }, gg);
    const items = side.itens.map((s, i) => {
      const ig = g(gg);
      const lines = Array.isArray(s) ? s : [s];
      const te = txLines(ig, x, 420 + i * (lh * (side.alt || 1)), lines, { f: side.f || 'disp', size: side.size || size, lh: (side.size || size) * 1.1, upper: side.f ? false : true, fill: side.fill ? C[side.fill] : C.cream });
      return { ig, te };
    });
    return { gg, h, items };
  };
  const L = col(p.esq, 160), R = col(p.dir, 1000);
  const strikes = p.riscarEsq ? L.items.map(o => {
    const bb = o.te[0];
    return { line: el('line', { x1: 150, y1: 0, x2: 150, y2: 0, stroke: C.red, 'stroke-width': 6 }, c), bb };
  }) : [];
  const rod = p.rodape ? txLines(c, 164, FY(clip, 960), Array.isArray(p.rodape) ? p.rodape : [p.rodape], { f: 'mono', size: 28, fill: C.cream, lh: 40 }) : [];
  const st = p.passo || 0.4;
  return t => {
    rise(L.h, t, 0.1, 0.5, 8);
    L.items.forEach((o, i) => rise(o.ig, t, 0.4 + i * st, 0.5, 16));
    let tR = 0.6 + L.items.length * st;
    if (strikes.length) {
      strikes.forEach((s, i) => {
        const pr = Ez.io(P(t, tR + i * 0.18, tR + i * 0.18 + 0.35));
        const w = s.bb.getComputedTextLength();
        const y = +s.bb.getAttribute('y') - (p.esq.size || size) * 0.3;
        s.line.setAttribute('y1', y); s.line.setAttribute('y2', y);
        s.line.setAttribute('x1', 150); s.line.setAttribute('x2', 150 + (w + 20) * pr);
        L.items[i].te.forEach(e => op(e, 1 - 0.55 * pr));
      });
      tR += strikes.length * 0.18 + 0.5;
    }
    rise(R.h, t, tR, 0.5, 8);
    R.items.forEach((o, i) => rise(o.ig, t, tR + 0.3 + i * st, 0.5, 16));
    const tn = tR + 0.6 + R.items.length * st;
    rod.forEach((e, i) => rise(e, t, tn + i * 0.25, 0.6, 10));
  };
};

/* Palavra grande que leva um carimbo */
TEMPLATES.carimbo = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const cor = C[p.cor || 'red'];
  const antes = p.antes ? txLines(c, W / 2, 330, Array.isArray(p.antes) ? p.antes : [p.antes], { f: 'mono', size: 32, fill: C.dim, anchor: 'middle', lh: 44 }) : [];
  const size = p.size || 240;
  const wordsG = g(c);
  const words = txLines(wordsG, W / 2, 600 - ((p.linhas.length - 1) * size * 0.95) / 2, p.linhas, { f: 'disp', size, anchor: 'middle', lh: size * 0.95, upper: true });
  const st = g(c);
  const sText = tx(st, 0, 0, p.carimbo, { f: 'disp', size: p.cSize || 150, anchor: 'middle', fill: cor, upper: true, ls: '0.06em' });
  const box = el('rect', { fill: 'none', stroke: cor, 'stroke-width': 10 }, st);
  const box2 = el('rect', { fill: 'none', stroke: cor, 'stroke-width': 3 }, st);
  const depois = p.depois ? txLines(c, W / 2, 900, Array.isArray(p.depois) ? p.depois : [p.depois], { f: 'mono', size: 30, fill: C.cream, anchor: 'middle', lh: 42 }) : [];
  const t1 = p.tCarimbo || 1.7;
  const lastBase = 600 - ((p.linhas.length - 1) * size * 0.95) / 2 + (p.linhas.length - 1) * size * 0.95;
  const cy = p.cy || lastBase + 60 + (p.cSize || 150) * 0.75;
  let measured = false;
  const rot = p.rot !== undefined ? p.rot : -9;
  return t => {
    antes.forEach((e, i) => rise(e, t, 0.1 + i * 0.2, 0.5, 8));
    words.forEach((e, i) => rise(e, t, 0.4 + i * 0.15, 0.7, 30));
    if (!measured) {
      const bb = sText.getBBox();
      const padX = 40, padY = 18;
      box.setAttribute('x', bb.x - padX); box.setAttribute('y', bb.y - padY + 10);
      box.setAttribute('width', bb.width + padX * 2); box.setAttribute('height', bb.height + padY * 2 - 20);
      box2.setAttribute('x', bb.x - padX + 16); box2.setAttribute('y', bb.y - padY + 26);
      box2.setAttribute('width', bb.width + padX * 2 - 32); box2.setAttribute('height', bb.height + padY * 2 - 52);
      measured = true;
    }
    const ps = P(t, t1, t1 + 0.22);
    const s = ps <= 0 ? 1.8 : lerp(1.8, 1, Ez.out(ps)) + 0.05 * Math.sin(P(t, t1 + 0.22, t1 + 0.5) * Math.PI);
    op(st, ps > 0 ? 0.92 * Ez.out(ps) : 0);
    st.setAttribute('transform', `translate(${W / 2 + (p.dx || 0)},${cy}) rotate(${rot}) scale(${s})`);
    // tranco na palavra quando o carimbo bate
    const k = P(t, t1 + 0.2, t1 + 0.45);
    const shake = k > 0 && k < 1 ? Math.sin(k * Math.PI * 6) * (1 - k) * 8 : 0;
    wordsG.setAttribute('transform', `translate(${shake},0)`);
    if (p.apagar && ps > 0) words.forEach(e => op(e, 1 - 0.5 * Ez.out(ps)));
    depois.forEach((e, i) => rise(e, t, t1 + 0.8 + i * 0.25, 0.6, 10));
  };
};

/* Lista com marcas de checagem */
TEMPLATES.checklist = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const n = p.itens.length;
  const gap = p.gap || (n > 6 ? 82 : 104);
  const titulo = p.titulo ? tx(c, 160, 250, p.titulo, { f: 'disp', size: 72, upper: true }) : null;
  const y0 = (titulo ? 380 : 330) + (p.y0off || 0);
  const rows = p.itens.map((o, i) => {
    const y = y0 + i * gap;
    const gg = g(c);
    el('rect', { x: 160, y: y - 42, width: 52, height: 52, fill: 'none', stroke: C.dim, 'stroke-width': 3 }, gg);
    const mark = o.ok === false ? iconCross(gg, 186, y - 16, 30, C.red) : iconCheck(gg, 186, y - 16, 40, C.amber);
    const te = tx(gg, 250, y, o.t, { f: 'disp', size: p.size || (n > 6 ? 48 : 60), upper: true });
    const s = o.s ? tx(gg, 1760, y, o.s, { f: 'mono', size: 28, fill: o.ok === false ? C.red : C.dim, anchor: 'end' }) : null;
    return { gg, mark, s };
  });
  const nota = p.nota ? txLines(c, 164, FY(clip, p.notaY || 980), Array.isArray(p.nota) ? p.nota : [p.nota], { f: 'mono', size: 28, fill: C.cream, lh: 40 }) : [];
  const step = p.passo || 0.55;
  return t => {
    if (titulo) rise(titulo, t, 0.1, 0.6, 14);
    rows.forEach((r, i) => {
      const t0 = 0.5 + i * step;
      rise(r.gg, t, t0, 0.4, 12);
      op(r.mark, P(t, t0 + 0.3, t0 + 0.5));
      if (r.s) op(r.s, P(t, t0 + 0.4, t0 + 0.7));
    });
    const tn = 0.5 + n * step + 0.6;
    nota.forEach((e, i) => rise(e, t, tn + i * 0.3, 0.6, 10));
  };
};

/* Lista genérica com marcadores (recapitulação, prévias, inventários) */
TEMPLATES.itens = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const acc = clip.somber ? C.dim : (p.cor ? C[p.cor] : C.amber);
  const kick = p.kicker ? tx(c, 164, 230, p.kicker, { f: 'mono', size: 28, fill: acc, ls: '0.2em', w: 500, upper: true }) : null;
  const tl = p.titulo ? txLines(c, 158, 330, Array.isArray(p.titulo) ? p.titulo : [p.titulo], { f: 'disp', size: 96, lh: 96, upper: true }) : [];
  const n = p.itens.length;
  const size = p.size || (n > 6 ? 40 : 50);
  const gap = p.gap || (n > 6 ? 70 : 88);
  const y0 = p.y0 || (tl.length ? 330 + tl.length * 96 + 40 : 340);
  const rows = p.itens.map((s, i) => {
    const gg = g(c);
    const y = y0 + i * gap;
    if (p.numerado) tx(gg, 164, y, String(i + 1).padStart(2, '0'), { f: 'mono', size: size * 0.6, fill: acc, w: 500 });
    else el('rect', { x: 166, y: y - size * 0.36, width: 26, height: 5, fill: acc }, gg);
    const lines = Array.isArray(s) ? s : [s];
    txLines(gg, 220, y, lines, { f: p.f || 'disp', size: p.f === 'mono' ? size * 0.7 : size, upper: !p.f, lh: size * 1.05, fill: C.cream });
    return gg;
  });
  const nota = p.nota ? txLines(c, 164, FY(clip, p.notaY || 990), Array.isArray(p.nota) ? p.nota : [p.nota], { f: 'mono', size: 26, fill: C.dim, lh: 36 }) : [];
  const step = p.passo || (clip.somber ? 0.7 : 0.45);
  return t => {
    if (kick) rise(kick, t, 0.1, 0.5, 8);
    tl.forEach((e, i) => rise(e, t, 0.25 + i * 0.12, 0.7, 24));
    rows.forEach((r, i) => rise(r, t, 0.8 + i * step, 0.5, 14));
    const tn = 0.8 + n * step + 0.4;
    nota.forEach((e, i) => rise(e, t, tn + i * 0.2, 0.6, 8));
  };
};

/* Frase com verbos/palavras destacadas (para lei, tese) */
TEMPLATES.destaque = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const kick = p.kicker ? tx(c, 164, 260, p.kicker, { f: 'mono', size: 28, fill: C.dim, ls: '0.18em', upper: true }) : null;
  const size = p.size || 84, lh = size * 1.2;
  const y0 = p.y0 || 420;
  const marks = [];
  const texts = p.linhas.map((ln, i) => {
    const te = el('text', { x: 160, y: y0 + i * lh, 'font-family': FONT.disp, 'font-size': size, 'font-weight': 600, fill: C.cream }, c);
    // trechos entre colchetes ficam destacados
    ln.split(/(\[[^\]]+\])/).forEach(part => {
      if (!part) return;
      const hl = part.startsWith('[');
      const ts = el('tspan', {}, te);
      ts.textContent = hl ? part.slice(1, -1) : part;
      if (hl) marks.push(ts);
    });
    return te;
  });
  const under = marks.map(() => el('rect', { height: 10, fill: C.amber, width: 0 }, c));
  const nota = p.nota ? txLines(c, 164, FY(clip, p.notaY || 900), Array.isArray(p.nota) ? p.nota : [p.nota], { f: 'mono', size: 32, fill: C.cream, lh: 46 }) : [];
  let boxes = null;
  return t => {
    if (kick) rise(kick, t, 0.1, 0.5, 8);
    texts.forEach((e, i) => rise(e, t, 0.3 + i * 0.25, 0.7, 20));
    if (!boxes) boxes = marks.map(m => { try { return m.getBBox(); } catch (e) { return null; } });
    const tm = 0.6 + texts.length * 0.25;
    marks.forEach((m, i) => {
      const pr = Ez.io(P(t, tm + i * 0.45, tm + i * 0.45 + 0.4));
      m.setAttribute('fill', pr > 0.3 ? C.amber : C.cream);
      const bb = boxes[i];
      if (bb) { under[i].setAttribute('x', bb.x); under[i].setAttribute('y', bb.y + bb.height - 6); under[i].setAttribute('width', bb.width * pr); }
    });
    const tn = tm + marks.length * 0.45 + 0.5;
    nota.forEach((e, i) => rise(e, t, tn + i * 0.3, 0.6, 10));
  };
};

/* Cartela de encerramento: "no próximo episódio" */
TEMPLATES.proximo = (root, p, D, clip) => {
  const S = stage(root, clip);
  const c = S.content;
  const kick = tx(c, 164, 250, p.kicker || 'NO PRÓXIMO EPISÓDIO', { f: 'mono', size: 30, fill: C.red, ls: '0.22em', w: 500 });
  const parte = tx(c, 160, 370, p.parte, { f: 'mono', size: 34, fill: C.dim, ls: '0.1em' });
  const tl = txLines(c, 154, 500, p.titulo, { f: 'disp', size: 150, lh: 140, upper: true });
  const y0 = 500 + (p.titulo.length - 1) * 140 + 110;
  const rows = (p.itens || []).map((s, i) => tx(c, 164, y0 + i * 52, s, { f: 'mono', size: 32, fill: C.cream }));
  return t => {
    rise(kick, t, 0.1, 0.5, 8);
    rise(parte, t, 0.4, 0.5, 8);
    tl.forEach((e, i) => rise(e, t, 0.6 + i * 0.15, 0.8, 30));
    rows.forEach((e, i) => rise(e, t, 1.6 + i * 0.45, 0.5, 10));
  };
};

/* ============================================================
 * SOBREPOSIÇÕES (fundo transparente; exportadas com verde e com alfa)
 * ============================================================ */

function overlayIO(t, D, tin = 0.45, tout = 0.4) {
  const a = Ez.out(P(t, 0, tin));
  const b = 1 - Ez.in(P(t, D - tout, D));
  return Math.min(a, b);
}

/* Selo de evidência (carimbo) */
TEMPLATES.selo = (root, p, D, clip) => {
  const cat = CAT[p.cat];
  const gg = g(root);
  const plate = el('rect', { fill: C.plate, rx: 4 }, gg);
  const lab = tx(gg, 0, 0, cat.label, { f: 'disp', size: 40, w: 700, fill: cat.color, ls: '0.08em' });
  const b1 = el('rect', { fill: 'none', stroke: cat.color, 'stroke-width': 4 }, gg);
  const fontes = (Array.isArray(p.fonte) ? p.fonte : [p.fonte]).map(s => tx(gg, 0, 0, s, { f: 'mono', size: 25, fill: C.cream }));
  let laid = false, bw = 0, bh = 0;
  const pos = p.pos || 'tr';
  return t => {
    if (!laid) {
      const lw = lab.getComputedTextLength();
      const fw = Math.max(...fontes.map(f => f.getComputedTextLength()));
      const padX = 30;
      const inner = Math.max(lw + 36, fw);
      bw = inner + padX * 2; bh = 112 + fontes.length * 36;
      plate.setAttribute('x', 0); plate.setAttribute('y', 0); plate.setAttribute('width', bw); plate.setAttribute('height', bh);
      b1.setAttribute('x', padX); b1.setAttribute('y', 22); b1.setAttribute('width', lw + 36); b1.setAttribute('height', 58);
      lab.setAttribute('x', padX + 18); lab.setAttribute('y', 66);
      fontes.forEach((f, i) => { f.setAttribute('x', padX); f.setAttribute('y', 122 + i * 36); });
      laid = true;
    }
    const x = pos.includes('r') ? W - 80 - bw : 80;
    const y = pos.includes('t') ? 80 : H - 80 - bh;
    const a = overlayIO(t, D, 0.3, 0.35);
    const s = lerp(1.18, 1, Ez.back(P(t, 0, 0.32)));
    const ox = pos.includes('r') ? bw : 0;
    gg.setAttribute('transform', `translate(${x + ox},${y}) scale(${s}) translate(${-ox},0) rotate(-1.2 ${bw / 2} ${bh / 2})`);
    op(gg, a);
  };
};

/* Crédito de nome (lower third) */
TEMPLATES.nome = (root, p, D, clip) => {
  const gg = g(root);
  const plate = el('rect', { x: 0, y: 0, height: 150, fill: C.plate }, gg);
  const bar = el('rect', { x: 0, y: 0, width: 8, height: 150, fill: C.amber }, gg);
  const nome = tx(gg, 40, 70, p.nome, { f: 'disp', size: 62, upper: true });
  const papel = txLines(gg, 42, 112, Array.isArray(p.papel) ? p.papel : [p.papel], { f: 'mono', size: 25, fill: C.dim, lh: 32 });
  let w = 0;
  return t => {
    if (!w) {
      w = Math.max(nome.getComputedTextLength(), ...papel.map(e => e.getComputedTextLength())) + 84;
      const h = 150 + (papel.length - 1) * 32;
      plate.setAttribute('height', h); bar.setAttribute('height', h);
    }
    const a = overlayIO(t, D, 0.5, 0.4);
    const pw = Ez.out(P(t, 0.05, 0.5));
    plate.setAttribute('width', w * pw);
    op(nome, P(t, 0.25, 0.55)); papel.forEach(e => op(e, P(t, 0.35, 0.65)));
    gg.setAttribute('transform', `translate(120,${H - 150 - 120 - (papel.length - 1) * 32})`);
    op(gg, a);
  };
};

/* Contador de águias */
TEMPLATES.aguias = (root, p, D, clip) => {
  const gg = g(root, { transform: 'translate(80,80)' });
  el('rect', { x: 0, y: 0, width: 360, height: 110, fill: C.plate }, gg);
  iconEagle(gg, 64, 58, 80, C.cream);
  tx(gg, 130, 70, 'ÁGUIAS:', { f: 'mono', size: 34, w: 500, fill: C.cream, ls: '0.08em' });
  const numG = g(gg);
  const oldN = tx(numG, 0, 0, String(p.n - 1), { f: 'disp', size: 72, fill: C.dim, anchor: 'middle' });
  const newN = tx(numG, 0, 0, String(p.n), { f: 'disp', size: 72, fill: C.red, anchor: 'middle' });
  return t => {
    op(gg, overlayIO(t, D));
    const k = Ez.io(P(t, 0.7, 1.1));
    oldN.setAttribute('transform', `translate(318,${80 - 40 * k})`); op(oldN, 1 - k);
    newN.setAttribute('transform', `translate(318,${80 + 40 * (1 - k)})`); op(newN, k);
  };
};

/* Marcador de pergunta em aberto / respondida */
TEMPLATES.loop = (root, p, D, clip) => {
  const aberto = p.estado === 'aberto';
  const col = aberto ? C.amber : C.cream;
  const gg = g(root);
  const lines = Array.isArray(p.texto) ? p.texto : [p.texto];
  const h = 104 + lines.length * 48;
  const plate = el('rect', { x: 0, y: 0, height: h, fill: C.plate }, gg);
  el('rect', { x: 0, y: 0, width: 8, height: h, fill: col }, gg);
  const ic = g(gg);
  el('circle', { cx: 56, cy: 50, r: 22, fill: 'none', stroke: col, 'stroke-width': 4 }, ic);
  if (aberto) tx(ic, 56, 62, '?', { f: 'disp', size: 36, anchor: 'middle', fill: col });
  else iconCheck(ic, 57, 50, 26, col);
  tx(gg, 96, 62, `${p.rotulo || (aberto ? 'PERGUNTA EM ABERTO' : 'RESPONDIDA')}${p.num ? '  ·  ' + p.num : ''}`, { f: 'mono', size: 26, w: 500, fill: col, ls: '0.1em' });
  const te = txLines(gg, 40, 128, lines, { f: 'disp', size: 42, w: 600, lh: 48 });
  let w = 0;
  return t => {
    if (!w) {
      w = Math.max(640, ...te.map(e => e.getComputedTextLength() + 80));
      plate.setAttribute('width', w);
    }
    const a = overlayIO(t, D);
    const pulse = aberto ? 1 + 0.08 * Math.sin(t * 4) : 1;
    ic.setAttribute('transform', `translate(56,50) scale(${pulse}) translate(-56,-50)`);
    gg.setAttribute('transform', `translate(${80 - (1 - Ez.out(P(t, 0, 0.5))) * 40},${H - 80 - h})`);
    op(gg, a);
  };
};
