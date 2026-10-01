// Módulo 3 — Lei de Acesso à Informação
import {
  C, W, H, X0, X1, BW, anim, rich, layout, heading, statement, list, columns, compare, flow, timeline, paperCard,
  stamp, table, box, icon, badge, arrowH, arrowV, arrowPath, edge, node, pill, redact, checklist, docSheet, bars, hbars, calendar, label
} from '../kit.mjs';

const SRC_LAI = 'Lei 12.527/2011, a Lei de Acesso à Informação · regras válidas em setembro de 2026';

// cartão “print” de resposta evasiva + reação
function evasive(y, quote, reaction, d) {
  let s = anim('left', d, `<rect x="${X0}" y="${y}" width="700" height="150" rx="14" fill="${C.s3}"/>` + icon('mail', { x: X0 + 26, y: y + 22, s: 34, color: C.ink3, sw: 3 })
    + rich('Resposta do órgão', { x: X0 + 74, y: y + 48, size: 20, font: 'mono', fill: C.ink3, w: 500 }).svg
    + rich(quote, { x: X0 + 30, y: y + 100, size: 32, weight: 700, w: 640, lh: 1.15 }).svg);
  s += arrowH(X0 + 720, y + 75, X0 + 810, { d: d + 0.6, color: C.amber });
  s += anim('up', d + 0.9, `<rect x="${X0 + 830}" y="${y}" width="850" height="150" fill="${C.s1}" stroke="${C.amber}" stroke-width="3"/>`
    + rich(reaction, { x: X0 + 860, y: y + 150 / 2 - layout(reaction, { size: 27, w: 790 }).h / 2 + 22, size: 27, w: 790, lh: 1.22 }).svg);
  return s;
}

export default [
  // ---------------------------------------------------------------- 3.1
  {
    id: '3.1-01', aula: '3.1', title: 'Não precisa dizer por quê',
    cue: 'ABERTURA — “Você não precisa explicar por que quer a informação. Está na lei. Artigo 10, parágrafo 3º.”',
    render() {
      const fx = 1060; const fy = 200;
      let body = anim('up', 0.3, box({ x: fx, y: fy, w: 740, h: 700, fill: C.paper, stroke: C.paper, sw: 0, shadow: C.amber, sh: 14 })
        + rich('PEDIDO DE ACESSO À INFORMAÇÃO', { x: fx + 44, y: fy + 70, size: 26, font: 'mono', weight: 700, fill: C.pInk, w: 660 }).svg);
      const fields = [['Órgão', 150], ['O que você pede', 300], ['Motivo do pedido', 470]];
      fields.forEach(([k, dy], i) => {
        body += anim('fade', 0.8 + i * 0.3, rich(k, { x: fx + 44, y: fy + dy, size: 24, font: 'mono', weight: 700, fill: C.pInk2, w: 600 }).svg
          + `<rect x="${fx + 44}" y="${fy + dy + 20}" width="652" height="${i === 1 ? 110 : 64}" fill="#fff" stroke="${C.pLine}" stroke-width="2"/>`);
      });
      body += anim('draw', 2.2, `<path d="M${fx + 30} ${fy + 480} L${fx + 710} ${fy + 540}" stroke="${C.red}" stroke-width="10" stroke-linecap="round" fill="none" pathLength="1"/>`, { t: 0.5 });
      body += stamp('NÃO É EXIGIDO', { x: fx + 370, y: fy + 640, color: C.red, size: 44, d: 2.8 });
      body += anim('up', 0.4, rich('Você não precisa explicar por que quer a informação.', { x: X0, y: 300, size: 56, font: 'display', w: 820, lh: 1.08 }).svg);
      body += anim('up', 1.2, rich('Está na lei: {a|art. 10, §3º}.', { x: X0, y: 530, size: 40, weight: 700, w: 820 }).svg);
      body += anim('up', 3.4, rich('O servidor pode achar estranho. Pode perguntar. Pode fazer cara feia.', { x: X0, y: 680, size: 34, fill: C.ink2, w: 820 }).svg);
      body += anim('up', 4.2, rich('{a|Não pode exigir.}', { x: X0, y: 830, size: 56, font: 'display', w: 820 }).svg);
      return { body, source: SRC_LAI };
    }
  },
  {
    id: '3.1-02', aula: '3.1', title: 'A publicidade é a regra',
    cue: 'BLOCO 1 — art. 3º, I: a publicidade é a regra, o sigilo é a exceção',
    render() {
      const cx = 1320; const top = 330;
      let body = anim('fade', 0.3, `<path d="M${cx} ${top} V${top + 470} M${cx - 160} ${top + 470} H${cx + 160}" stroke="${C.ink2}" stroke-width="8" stroke-linecap="round"/>`);
      const beam = `<path d="M${cx - 360} ${top + 60} L${cx + 360} ${top - 30}" stroke="${C.ink2}" stroke-width="8" stroke-linecap="round"/>`
        + `<path d="M${cx - 360} ${top + 60} V${top + 170} M${cx + 360} ${top - 30} V${top + 80}" stroke="${C.ink3}" stroke-width="3"/>`
        + `<rect x="${cx - 520}" y="${top + 170}" width="320" height="120" fill="${C.amber}"/>` + rich('PUBLICIDADE', { x: cx - 360, y: top + 222, size: 34, font: 'display', fill: C.bg, anchor: 'middle', w: 320 }).svg + rich('a regra', { x: cx - 360, y: top + 266, size: 26, font: 'mono', weight: 700, fill: C.bg, anchor: 'middle', w: 320 }).svg
        + `<rect x="${cx + 230}" y="${top + 80}" width="260" height="96" fill="${C.s2}" stroke="${C.lineUi}" stroke-width="2"/>` + rich('SIGILO', { x: cx + 360, y: top + 124, size: 30, font: 'display', anchor: 'middle', w: 260 }).svg + rich('a exceção', { x: cx + 360, y: top + 160, size: 22, font: 'mono', weight: 700, fill: C.ink2, anchor: 'middle', w: 260 }).svg;
      body += anim('pop', 0.9, beam);
      body += anim('up', 0.3, rich('A inversão que muda tudo', { x: X0, y: 290, size: 52, font: 'display', w: 700, lh: 1.08 }).svg);
      body += anim('up', 1.2, rich('Art. 3º, I: “observância da publicidade como preceito geral e do sigilo como exceção”.', { x: X0, y: 440, size: 30, w: 640, weight: 500 }).svg);
      body += anim('up', 2.6, rich('Quem precisa se justificar não é você, que pediu.', { x: X0, y: 650, size: 32, fill: C.ink2, w: 640 }).svg);
      body += anim('up', 3.2, rich('{a|É o órgão, se quiser negar.}', { x: X0, y: 760, size: 44, font: 'display', w: 640 }).svg);
      return { body, source: 'Lei 12.527/2011, em vigor desde maio de 2012 · regulamenta a Constituição, art. 5º, XXXIII' };
    }
  },
  {
    id: '3.1-03', aula: '3.1', title: 'Quem é obrigado a responder',
    cue: '[TELA: arts. 1º e 2º da LAI]',
    render() {
      const h = heading('Quem é obrigado a responder', { sub: 'Art. 1º: os três Poderes, nas três esferas.' });
      let body = h.svg;
      const gx = X0 + 220; const gy = 380; const cw = 300; const ch = 104;
      ['Executivo', 'Legislativo', 'Judiciário'].forEach((t, j) => { body += anim('fade', 0.6, rich(t, { x: gx + j * (cw + 12) + cw / 2, y: gy - 20, size: 26, font: 'mono', weight: 700, fill: C.amber, anchor: 'middle', upper: true, w: cw }).svg); });
      ['União', 'Estados', 'Municípios'].forEach((t, i) => {
        body += anim('fade', 0.6, rich(t, { x: gx - 24, y: gy + i * (ch + 12) + ch / 2 + 10, size: 28, weight: 700, anchor: 'end', w: 220 }).svg);
        for (let j = 0; j < 3; j++) body += anim('pop', 0.9 + (i * 3 + j) * 0.12, `<rect x="${gx + j * (cw + 12)}" y="${gy + i * (ch + 12)}" width="${cw}" height="${ch}" fill="${C.amber}" fill-opacity=".22" stroke="${C.amber}" stroke-width="3"/>` + icon('check', { x: gx + j * (cw + 12) + cw / 2 - 22, y: gy + i * (ch + 12) + ch / 2 - 22, s: 44, color: C.amber, sw: 5 }));
      });
      const chips = ['tribunais de contas', 'Ministério Público', 'autarquias', 'fundações', 'empresas públicas', 'sociedades de economia mista'];
      let px = 1330; let py = 400;
      chips.forEach((t, i) => { const p = pill(t, { x: px, y: py, size: 24, d: 2.4 + i * 0.25, color: C.ink2 }); body += p.svg; py += 64; });
      body += anim('fade', 2.2, label('Também', { x: 1330, y: 360, size: 22 }));
      body += anim('up', 4.2, box({ x: X0, y: 770, w: BW, h: 150, fill: C.s1, stroke: C.blue, sw: 3 }) + label('Art. 2º', { x: X0 + 30, y: 820, size: 24, color: C.blue })
        + rich('Entidades privadas sem fins lucrativos que recebem dinheiro público. {b|Só em relação a esse dinheiro.}', { x: X0 + 30, y: 878, size: 32, weight: 700, w: BW - 60 }).svg);
      return { body, source: SRC_LAI };
    }
  },
  {
    id: '3.1-04', aula: '3.1', title: 'O que dá para pedir',
    cue: 'BLOCO 3 — informação que existe: documento, dado, registro. Opinião, não.',
    render() {
      const h = heading('Peça documento. {r|Não peça opinião.}');
      let body = h.svg;
      const docs = ['Contratos', 'Notas de empenho', 'Processos administrativos', 'Pareceres', 'Relatórios de auditoria', 'Agendas de autoridades', 'Planilhas', 'Bases de dados'];
      docs.forEach((t, i) => {
        const x = X0 + (i % 2) * 400; const y = 320 + Math.floor(i / 2) * 110;
        body += anim('pop', 0.6 + i * 0.18, `<rect x="${x}" y="${y}" width="370" height="84" fill="${C.s1}" stroke="${C.lineUi}" stroke-width="2"/>` + icon('doc', { x: x + 18, y: y + 20, s: 44, color: C.amber, sw: 3 }) + rich(t, { x: x + 78, y: y + 52, size: 26, weight: 700, w: 280 }).svg);
      });
      body += anim('fade', 2.2, rich('Art. 7º, VI: uso de recursos públicos, licitações e contratos administrativos.', { x: X0, y: 800, size: 26, font: 'mono', fill: C.ink2, w: 780 }).svg);
      body += anim('up', 2.6, box({ x: 1000, y: 320, w: 800, h: 190, fill: C.s1, stroke: C.red, sw: 3 }) + label('Recebe resposta de assessoria', { x: 1030, y: 364, size: 22, color: C.red })
        + rich('“Por que o prefeito fez isso?”', { x: 1030, y: 440, size: 40, font: 'display', w: 740 }).svg);
      body += badge('no', { x: 1720, y: 336, d: 3.0 });
      body += anim('up', 3.8, box({ x: 1000, y: 560, w: 800, h: 250, fill: C.s1, stroke: C.green, sw: 3 }) + label('Troque por', { x: 1030, y: 604, size: 22, color: C.green })
        + rich('“Cópia do processo administrativo que fundamentou a decisão X.”', { x: 1030, y: 680, size: 36, font: 'display', w: 740, lh: 1.1 }).svg);
      body += badge('ok', { x: 1720, y: 576, d: 4.2 });
      body += anim('up', 4.8, rich('O processo diz o porquê. {a|Com assinatura.}', { x: 1000, y: 880, size: 36, weight: 700, w: 800 }).svg);
      return { body, source: SRC_LAI };
    }
  },
  {
    id: '3.1-05', aula: '3.1', title: 'Antes de pedir, procure',
    cue: 'BLOCO 4 — art. 8º, transparência ativa: pedir o que já está no site é perder 20 dias',
    render() {
      const h = heading('Antes de pedir, procure', { sub: 'Art. 8º: os órgãos publicam na internet, sem ninguém pedir, informações básicas. É a transparência ativa.' });
      let body = h.svg;
      const bx = X0; const by = 400;
      body += anim('up', 0.8, box({ x: bx, y: by, w: 820, h: 460, fill: C.s2, stroke: C.lineUi, sw: 2 }) + `<rect x="${bx}" y="${by}" width="820" height="54" fill="${C.s3}"/>` + ['#FF6B5E', '#FFB800', '#4ADE80'].map((c, i) => `<circle cx="${bx + 30 + i * 28}" cy="${by + 27}" r="8" fill="${c}"/>`).join('')
        + rich('portal da transparência do órgão', { x: bx + 130, y: by + 36, size: 22, font: 'mono', fill: C.ink3, w: 600 }).svg);
      ['Estrutura', 'Despesas', 'Licitações', 'Contratos'].forEach((t, i) => {
        body += anim('left', 1.4 + i * 0.35, `<rect x="${bx + 40}" y="${by + 90 + i * 88}" width="740" height="68" fill="${C.s1}"/>` + icon('doc', { x: bx + 58, y: by + 100 + i * 88, s: 46, color: C.green, sw: 3 }) + rich(t, { x: bx + 124, y: by + 136 + i * 88, size: 32, weight: 700, w: 600 }).svg);
      });
      body += anim('up', 3.2, calendar({ x: 1080, y: 470, cell: 70, days: 20, startDow: 3, d: 3.2, marks: {}, weekendShade: true, title: '20 dias perdidos' }));
      body += anim('draw', 4.4, `<path d="M1070 530 L1590 830" stroke="${C.red}" stroke-width="10" stroke-linecap="round" fill="none" pathLength="1"/>`, { t: 0.5 });
      body += anim('up', 5.0, rich('Pedir o que já está no site é perder 20 dias. {a|E dar ao órgão a resposta mais fácil do mundo.}', { x: 1080, y: 900, size: 30, weight: 700, w: 720 }).svg);
      return { body, source: SRC_LAI };
    }
  },
  {
    id: '3.1-06', aula: '3.1', title: 'As regras do jogo',
    cue: '[TELA: resumo em quatro linhas]',
    render() {
      const h = heading('As regras do jogo');
      const l = list([
        { t: 'Não precisa dizer o motivo.', sub: '{a|Art. 10, §3º}' },
        { t: 'A exigência de identificação não pode inviabilizar o pedido.', sub: '{a|Art. 10, §1º}' },
        { t: 'É gratuito. Só se cobra o custo de reprodução, quando houver.', sub: '{a|Art. 12}' },
        { t: 'Cada esfera tem sua regulamentação.', sub: 'No Executivo federal, o Decreto 7.724/2012, alterado em 2023 pelo Decreto 11.527. Estados e municípios têm normas próprias: {a|art. 45}.' }
      ], { y: 310, size: 44, subSize: 30, gap: 40, step: 1.1 });
      return { body: h.svg + l.svg, source: SRC_LAI };
    }
  },

  // ---------------------------------------------------------------- 3.2
  {
    id: '3.2-01', aula: '3.2', title: 'Pedido vago, resposta vaga',
    cue: 'ABERTURA — “Pedido vago recebe resposta vaga. Pedido cirúrgico recebe planilha.”',
    render() {
      let body = anim('up', 0.3, box({ x: X0, y: 200, w: 800, h: 250, fill: C.s1, stroke: C.red, sw: 3 }) + label('Pedido vago', { x: X0 + 30, y: 246, size: 22, color: C.red })
        + rich('“Quero informações sobre os gastos da prefeitura.”', { x: X0 + 30, y: 320, size: 36, font: 'display', w: 740, lh: 1.1 }).svg);
      body += arrowV(X0 + 400, 470, 560, { d: 1.2, color: C.red });
      body += anim('pop', 1.7, `<rect x="${X0}" y="580" width="800" height="150" rx="14" fill="${C.s3}"/>` + rich('“A informação está disponível no Portal da Transparência.”', { x: X0 + 30, y: 648, size: 30, weight: 700, w: 740, fill: C.ink2 }).svg);
      body += anim('up', 2.4, box({ x: 1000, y: 200, w: 800, h: 250, fill: C.s1, stroke: C.green, sw: 3 }) + label('Pedido cirúrgico', { x: 1030, y: 246, size: 22, color: C.green })
        + rich('“Cópia integral dos contratos da Secretaria de Educação com a empresa X, CNPJ tal, de 2023 a 2025, em formato aberto.”', { x: 1030, y: 310, size: 28, weight: 700, w: 740, lh: 1.2 }).svg);
      body += arrowV(1400, 470, 560, { d: 3.2, color: C.green });
      let grid = `<rect x="1000" y="580" width="800" height="280" fill="${C.s1}" stroke="${C.green}" stroke-width="2"/><rect x="1000" y="580" width="800" height="44" fill="${C.green}"/>`;
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) grid += `<rect x="${1016 + c * 156}" y="${640 + r * 42}" width="${140 * (0.5 + ((r * 7 + c * 3) % 5) / 10)}" height="14" fill="${C.lineUi}"/>`;
      body += anim('pop', 3.7, grid + rich('contratos_2023_2025.xlsx', { x: 1020, y: 610, size: 20, font: 'mono', weight: 700, fill: C.bg, w: 600 }).svg);
      body += anim('up', 4.6, rich('Pedido vago recebe resposta vaga. {a|Pedido cirúrgico recebe planilha.}', { x: W / 2, y: 960, size: 42, font: 'display', anchor: 'middle', w: BW }).svg);
      return { body, source: 'Exemplo' };
    }
  },
  {
    id: '3.2-02', aula: '3.2', title: 'A anatomia do pedido',
    cue: '[TELA: estrutura do pedido em cinco partes]',
    render() {
      const h = heading('O pedido em cinco partes', { y: 190 });
      let body = h.svg;
      const txt = 'Solicito {a|cópia integral dos contratos, termos aditivos e notas de empenho} firmados entre {g|a Secretaria Municipal de Educação e a empresa X, CNPJ tal}, {b|de 1º de janeiro de 2023 a 31 de dezembro de 2025}, {r|em formato aberto}. {w|Havendo parte sigilosa, requeiro acesso à parte não sigilosa, com indicação do fundamento legal.}';
      body += anim('up', 0.5, box({ x: X0, y: 250, w: 1060, h: 520, fill: C.s1, stroke: C.lineUi, sw: 2 }) + rich(txt, { x: X0 + 40, y: 320, size: 34, w: 980, lh: 1.42 }).svg);
      const parts = [
        ['01', 'Objeto', '“Cópia integral”, não “informações sobre”.', C.amber],
        ['02', 'Período', 'De quando a quando.', C.blue],
        ['03', 'Recorte', 'Órgão, unidade, empresa, com CNPJ.', C.green],
        ['04', 'Formato', 'Planilha aberta. PDF pesquisável.', C.red],
        ['05', 'Subsidiário', 'O pedido reserva. Art. 7º, §2º.', C.ink]
      ];
      parts.forEach(([n, t, s, col], i) => {
        const y = 250 + i * 108;
        body += anim('left', 1.4 + i * 0.8, `<rect x="1220" y="${y}" width="10" height="90" fill="${col}"/>` + rich(`${n} · ${t}`, { x: 1250, y: y + 32, size: 28, font: 'mono', weight: 700, fill: col, w: 560 }).svg + rich(s, { x: 1250, y: y + 70, size: 24, fill: C.ink2, w: 560 }).svg);
      });
      body += anim('up', 6.0, box({ x: X0, y: 820, w: BW, h: 110, fill: C.s2, stroke: C.amber, sw: 2 }) + label('06 · opcional', { x: X0 + 30, y: 862, size: 22 })
        + rich('“Caso o órgão não detenha a informação, indique quem a detém.” {d|O art. 11 obriga o órgão a fazer isso.}', { x: X0 + 30, y: 905, size: 28, weight: 700, w: BW - 60 }).svg);
      return { body, source: 'Modelo A dos bônus · Lei 12.527/2011, arts. 7º, §2º, e 11' };
    }
  },
  {
    id: '3.2-03', aula: '3.2', title: 'Pedido ruim e pedido bom',
    cue: '[TELA: os dois pedidos lado a lado]',
    render() {
      const h = heading('Ruim × bom');
      const c = compare(
        { head: 'Ruim', body: '{w|“Quero todas as informações sobre os gastos da prefeitura com a empresa X.”}', kind: 'no', foot: 'Dá margem para “pedido genérico”.' },
        { head: 'Bom', body: '“Solicito cópia integral dos contratos, termos aditivos e notas de empenho firmados entre a Secretaria Municipal de Educação e a empresa X, CNPJ tal, de 1º de janeiro de 2023 a 31 de dezembro de 2025, em formato aberto. Havendo parte sigilosa, requeiro acesso à parte não sigilosa, com indicação do fundamento legal.”', kind: 'ok', delay: 1.6, foot: 'Não dá margem para nada.' },
        { y: 300, h: 640, size: 30 }
      );
      return { body: h.svg + c };
    }
  },
  {
    id: '3.2-04', aula: '3.2', title: 'As três palavras que matam um pedido',
    cue: 'BLOCO 3 — Decreto 7.724, art. 13: genérico, desproporcional, trabalho adicional',
    render() {
      const h = heading('As três palavras que matam um pedido');
      const c = columns([
        { head: 'Genérico', body: 'Não dá para saber o que você quer.', icon: 'x', color: C.red },
        { head: 'Desproporcional', body: 'Você pede tanto que atender paralisaria o órgão.', icon: 'x', color: C.red },
        { head: 'Trabalho adicional', body: 'Você pede que o órgão analise, interprete ou consolide dados. Um relatório que não existe.', icon: 'x', color: C.red }
      ], { y: 290, h: 330, size: 30, headSize: 38, step: 0.7 });
      let body = h.svg + c.svg;
      body += anim('fade', 2.8, label('Como fugir das três', { x: X0, y: 700, size: 24, color: C.green }));
      let px = X0;
      ['Recorte: período, unidade, tipo de documento', 'Peça o dado “tal como existe”', 'Aceite entrega em partes'].forEach((t, i) => { const p = pill(t, { x: px, y: 760, size: 26, d: 3.1 + i * 0.4, color: C.green }); body += p.svg; px += p.w + 24; });
      body += anim('up', 4.6, rich('Trabalho adicional? O próprio decreto manda o órgão indicar {a|onde estão os dados brutos}, para você mesmo consolidar. Art. 13, parágrafo único.', { x: X0, y: 870, size: 30, w: BW, weight: 500 }).svg);
      return { body, source: 'Decreto 7.724/2012, art. 13 · muitos estados e municípios copiaram a regra' };
    }
  },
  {
    id: '3.2-05', aula: '3.2', title: 'Específico no documento, discreto no alvo',
    cue: 'BLOCO 5 — “Peça todos os contratos da secretaria no período. O alvo fica no meio dos outros.”',
    render() {
      const h = heading('Específico no documento. {a|Discreto no alvo.}');
      let body = h.svg;
      const gx = X0; const gy = 320; const cw = 196; const ch = 110; const target = 13;
      for (let i = 0; i < 24; i++) {
        const x = gx + (i % 8) * (cw + 16); const y = gy + Math.floor(i / 8) * (ch + 16);
        const isT = i === target;
        body += anim('pop', 0.4 + i * 0.04, `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="${C.s1}" stroke="${C.lineUi}" stroke-width="2"/>` + icon('doc', { x: x + 16, y: y + 16, s: 36, color: C.ink3, sw: 3 })
          + rich(isT ? 'Empresa X' : `Contrato ${String(i + 1).padStart(2, '0')}`, { x: x + 16, y: y + 88, size: 22, font: 'mono', weight: 700, fill: C.ink2, w: cw - 20 }).svg);
      }
      const tx = gx + (target % 8) * (cw + 16); const ty = gy + Math.floor(target / 8) * (ch + 16);
      body += anim('gone', 3.6, anim('pop', 1.6, `<rect x="${tx - 6}" y="${ty - 6}" width="${cw + 12}" height="${ch + 12}" fill="none" stroke="${C.red}" stroke-width="6"/>`), { t: 0.4 });
      body += anim('gone', 3.6, anim('up', 1.9, rich('{r|Pedir só o da empresa X pode avisar a empresa X.}', { x: X0, y: 760, size: 34, weight: 700, w: BW }).svg), { t: 0.4 });
      body += anim('grow', 4.0, `<rect x="${gx - 10}" y="${gy - 10}" width="${8 * (cw + 16) + 4}" height="${3 * (ch + 16) + 4}" fill="none" stroke="${C.amber}" stroke-width="6"/>`, { t: 0.8 });
      body += anim('up', 4.6, rich('Peça {a|todos os contratos da secretaria no período}. O alvo fica no meio dos outros.', { x: X0, y: 760, size: 36, weight: 700, w: BW }).svg);
      body += anim('up', 5.4, rich('E mande para mais de um lugar: a prefeitura tem o contrato; o tribunal de contas também pode ter.', { x: X0, y: 860, size: 30, fill: C.ink2, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '3.2-06', aula: '3.2', title: 'Quatro cuidados no pedido',
    cue: 'BLOCO 5 — educado e neutro, sem revelar a hipótese, discreto no alvo, mais de um destino',
    render() {
      const h = heading('Quatro cuidados');
      const l = list([
        { t: 'Educado e neutro.', sub: 'O pedido é lido por um servidor. Tom agressivo não acelera nada.' },
        { t: 'Não revele sua hipótese.', sub: 'Você não precisa justificar. Então não justifique.' },
        { t: 'Específico no documento, discreto no alvo.', sub: 'Em pauta sensível, peça o conjunto em que o alvo está.' },
        { t: 'Mande para mais de um lugar.', sub: 'O documento pode estar na prefeitura e no tribunal de contas.' }
      ], { y: 310, size: 44, subSize: 30, gap: 36, step: 1.0 });
      return { body: h.svg + l.svg };
    }
  },
  {
    id: '3.2-07', aula: '3.2', title: 'O relógio começou a correr',
    cue: 'BLOCO 4 e FECHAMENTO — “Anote o número e a data. A partir de agora, o relógio trabalha para você.”',
    render() {
      const cx = 1440; const cy = 520;
      let body = anim('up', 0.3, box({ x: X0, y: 250, w: 860, h: 300, fill: C.paper, stroke: C.paper, sw: 0, shadow: C.amber, sh: 14 })
        + rich('PEDIDO REGISTRADO', { x: X0 + 40, y: 310, size: 26, font: 'mono', weight: 700, fill: C.pAccent, w: 700 }).svg
        + rich('Protocolo', { x: X0 + 40, y: 380, size: 24, font: 'mono', fill: C.pInk2, w: 400 }).svg + rich('00000.000000/2026-00', { x: X0 + 40, y: 430, size: 40, font: 'mono', weight: 700, fill: C.pInk, w: 780 }).svg
        + rich('Data do pedido: [data]', { x: X0 + 40, y: 500, size: 28, font: 'mono', fill: C.pInk, w: 780 }).svg);
      body += anim('pop', 1.4, `<circle cx="${cx}" cy="${cy}" r="230" fill="${C.s1}" stroke="${C.amber}" stroke-width="10"/>` + Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<path d="M${cx + 190 * Math.sin(a)} ${cy - 190 * Math.cos(a)} L${cx + 210 * Math.sin(a)} ${cy - 210 * Math.cos(a)}" stroke="${C.ink2}" stroke-width="6"/>`; }).join(''));
      body += anim('spin', 2.0, `<path d="M${cx} ${cy} V${cy - 170}" stroke="${C.amber}" stroke-width="12" stroke-linecap="round"/>`, { t: 4, style: `transform-origin:${cx}px ${cy}px;--r:720deg` });
      body += anim('fade', 2.0, `<circle cx="${cx}" cy="${cy}" r="16" fill="${C.amber}"/>`);
      body += anim('up', 2.4, rich('Anote o número e a data.', { x: X0, y: 700, size: 52, font: 'display', w: 900 }).svg);
      body += anim('up', 3.2, rich('A partir de agora, {a|o relógio trabalha para você}.', { x: X0, y: 800, size: 40, weight: 700, w: BW }).svg);
      body += anim('up', 4.0, rich('É da data do pedido que corre o prazo. Guarde tudo na aba Log da planilha.', { x: X0, y: 890, size: 30, fill: C.ink2, w: BW }).svg);
      return { body };
    }
  },

  // ---------------------------------------------------------------- 3.3
  {
    id: '3.3-01', aula: '3.3', title: 'A primeira resposta é um teste',
    cue: 'ABERTURA — “Quem desiste na primeira negativa perde metade do que conseguiria.”',
    render() {
      const s = statement('Quem desiste na primeira negativa perde metade do que conseguiria.', { y: 380, size: 72, d: 0.3 });
      let body = s.svg;
      body += anim('up', 1.6, rich('A primeira resposta, muitas vezes, não é a resposta. {a|É um teste. Para ver se você volta.}', { x: W / 2, y: s.bottom + 120, size: 40, weight: 700, anchor: 'middle', w: 1500 }).svg);
      return { body };
    }
  },
  {
    id: '3.3-02', aula: '3.3', title: 'Vinte dias, mais dez',
    cue: '[TELA: linha do tempo — dia 0, pedido · dia 20 · dia 30]',
    render() {
      const h = heading('O prazo', { sub: 'Até 20 dias. Mais 10, se o órgão justificar e avisar você. Art. 11, §§ 1º e 2º.' });
      let body = h.svg;
      const x0 = X0; const cw = 52; const y = 560; const start = 2; // dia 0 numa terça
      for (let d = 0; d <= 30; d++) {
        const dow = (start + d) % 7; const we = dow === 0 || dow === 6;
        const col = d === 0 ? C.blue : d === 20 ? C.amber : d === 30 ? C.red : we ? C.s3 : C.s1;
        body += anim('pop', 0.6 + d * 0.05, `<rect x="${x0 + d * cw + 2}" y="${y}" width="${cw - 4}" height="80" fill="${col}" stroke="${C.line}" stroke-width="1"/>` + rich(String(d), { x: x0 + d * cw + cw / 2, y: y + 52, size: 22, font: 'mono', weight: 700, fill: [0, 20, 30].includes(d) ? C.bg : we ? C.ink2 : C.ink3, anchor: 'middle', w: 60 }).svg);
      }
      const mark = (d, t, s, col, dd) => anim('down', dd, `<path d="M${x0 + d * cw + cw / 2} ${y - 16} V${y - 90}" stroke="${col}" stroke-width="4"/>` + rich(t, { x: x0 + d * cw + cw / 2, y: y - 150, size: 34, font: 'display', fill: col, anchor: d === 0 ? 'start' : d === 30 ? 'end' : 'middle', w: 500 }).svg + rich(s, { x: x0 + d * cw + cw / 2, y: y - 108, size: 24, fill: C.ink2, anchor: d === 0 ? 'start' : d === 30 ? 'end' : 'middle', w: 500 }).svg);
      body += mark(0, 'Dia 0', 'o pedido', C.blue, 2.4);
      body += mark(20, 'Dia 20', 'prazo do órgão', C.amber, 3.0);
      body += mark(30, 'Dia 30', 'com prorrogação', C.red, 3.6);
      body += anim('up', 4.4, rich('{a|Dias corridos, não úteis.} Conta sábado, domingo e feriado.', { x: X0, y: 760, size: 40, weight: 700, w: BW }).svg + `<rect x="${X0}" y="800" width="30" height="30" fill="${C.s3}"/>` + rich('fim de semana também conta', { x: X0 + 44, y: 825, size: 24, font: 'mono', fill: C.ink2, w: 800 }).svg);
      body += anim('up', 5.2, rich('Se a informação estiver disponível, a regra é entregar na hora. Os 20 dias são o limite, não a meta.', { x: X0, y: 910, size: 30, fill: C.ink2, w: BW }).svg);
      return { body, source: SRC_LAI };
    }
  },
  {
    id: '3.3-03', aula: '3.3', title: 'O catálogo da enrolação, parte 1',
    cue: '[TELA: cada resposta evasiva aparece como um print, seguida da reação]',
    render() {
      const h = heading('O catálogo da enrolação');
      let body = h.svg;
      body += evasive(290, '“A informação está disponível no site.”', 'Se não diz onde, está errado. O art. 11, §6º, manda informar por escrito o lugar e a forma de acessar. {a|Recorra pedindo o caminho exato.}', 0.6);
      body += evasive(490, '“Não temos essa informação.”', 'O art. 11 manda indicar quem tem, se souber, ou encaminhar o pedido. {a|Faz sentido um órgão não ter o próprio contrato?}', 2.4);
      body += evasive(690, '“Pedido genérico.”', '{a|Recorte e recorra}, mostrando que o pedido especifica objeto, período e órgão.', 4.2);
      return { body, source: SRC_LAI };
    }
  },
  {
    id: '3.3-04', aula: '3.3', title: 'O catálogo da enrolação, parte 2',
    cue: '[TELA: cada resposta evasiva aparece como um print, seguida da reação]',
    render() {
      const h = heading('O catálogo da enrolação');
      let body = h.svg;
      body += evasive(290, '“Documento preparatório.”', 'Usado para uma decisão ainda não tomada. O art. 7º, §3º, garante o acesso quando a decisão sai. {a|Se já saiu, recorra.}', 0.6);
      body += evasive(490, '“Informação pessoal.”', 'A desculpa preferida. {a|É o assunto da aula 3.4.}', 2.4);
      body += evasive(690, 'Você pediu contratos. Veio o link da página de licitações.', 'É a resposta que responde outra pergunta: {a|negativa disfarçada. Recorra.}', 4.2);
      return { body, source: SRC_LAI };
    }
  },
  {
    id: '3.3-05', aula: '3.3', title: 'A escada de recursos',
    cue: '[TELA: escada com quatro degraus e os prazos de cada um]',
    render() {
      const h = heading('A escada de recursos no governo federal', { size: 56 });
      let body = h.svg;
      const steps = [
        ['1ª instância', 'Autoridade superior a quem respondeu', 'Recorrer: 10 dias · decidir: 5', 'LAI, art. 15 · Decreto 7.724, art. 21'],
        ['2ª instância', 'Autoridade máxima do órgão', 'Recorrer: 10 dias · decidir: 5', 'Decreto 7.724, art. 21, parágrafo único'],
        ['3ª instância', 'CGU', 'Recorrer: 10 dias · admitir: 5 · decidir: 5', 'LAI, art. 16 · Decreto, art. 23 · Portaria 101/2023'],
        ['4ª instância', 'CMRI, na Casa Civil', 'Recorrer: 10 dias', 'Decreto 7.724, art. 24']
      ];
      const sw = 405; const stepH = 130; const base = 980;
      steps.forEach(([k, who, pz, law], i) => {
        const x = X0 + i * (sw + 20); const top = base - (i + 1) * stepH - 160;
        const d = 0.8 + i * 1.1;
        body += anim('growY', d, `<rect x="${x}" y="${top}" width="${sw}" height="${base - top}" fill="${C.s1}" stroke="${C.amber}" stroke-width="3"/><rect x="${x}" y="${top}" width="${sw}" height="10" fill="${C.amber}"/>`);
        body += anim('up', d + 0.5, rich(k, { x: x + 24, y: top + 52, size: 24, font: 'mono', weight: 700, fill: C.amber, upper: true, w: sw - 40 }).svg
          + rich(who, { x: x + 24, y: top + 96, size: 30, font: 'display', w: sw - 40, lh: 1.08 }).svg);
        body += anim('fade', d + 0.8, rich(pz, { x: x + 24, y: base - 110, size: 22, weight: 700, w: sw - 40, fill: C.ink }).svg + rich(law, { x: x + 24, y: base - 42, size: 17, font: 'mono', w: sw - 40, fill: C.ink3 }).svg);
      });
      body += anim('up', 5.6, rich('Se a CGU pedir esclarecimentos ao órgão, o prazo passa a {a|30 dias, prorrogáveis por mais 30}.', { x: X0 + 2 * (sw + 20) + 24, y: 640, size: 24, w: sw - 48, weight: 500, fill: C.ink2 }).svg);
      return { body, source: SRC_LAI };
    }
  },
  {
    id: '3.3-06', aula: '3.3', title: 'Não com fundamento é recorrível',
    cue: 'BLOCO 3 — “‘Não’ com fundamento é recorrível. Resposta vaga é areia movediça.”',
    render() {
      let body = anim('up', 0.3, `<rect x="${X0 + 60}" y="560" width="620" height="220" fill="${C.green}"/>` + rich('“NÃO”, COM FUNDAMENTO', { x: X0 + 370, y: 690, size: 40, font: 'display', fill: C.bg, anchor: 'middle', w: 600 }).svg);
      body += anim('pop', 1.0, icon('person', { x: X0 + 300, y: 410, s: 140, color: C.ink, sw: 5 }));
      body += anim('up', 1.4, rich('Dá para pisar. {g|É recorrível.}', { x: X0 + 370, y: 860, size: 36, weight: 700, anchor: 'middle', w: 700 }).svg);
      const wave = (y, a) => `M1080 ${y} ${Array.from({ length: 8 }, (_, i) => `Q${1120 + i * 80} ${y - a} ${1160 + i * 80} ${y} T${1240 + i * 80} ${y}`).join(' ')}`;
      body += anim('up', 2.0, `<rect x="1080" y="600" width="660" height="180" fill="#6B5A2E"/>` + `<path d="${wave(600, 16)}" stroke="#8A7440" stroke-width="6" fill="none"/>` + rich('RESPOSTA VAGA', { x: 1410, y: 710, size: 40, font: 'display', fill: C.bg, anchor: 'middle', w: 600 }).svg);
      body += anim('down', 2.6, anim('drop', 3.2, icon('person', { x: 1340, y: 450, s: 140, color: C.ink, sw: 5 }), { t: 1.6 }));
      body += anim('up', 3.4, rich('{a|É areia movediça.}', { x: 1410, y: 860, size: 36, weight: 700, anchor: 'middle', w: 700 }).svg);
      body += anim('up', 0.2, rich('Em cada degrau, exija uma {a|negativa por escrito, com fundamento}.', { x: W / 2, y: 260, size: 46, font: 'display', anchor: 'middle', w: 1500, lh: 1.1 }).svg);
      body += anim('fade', 4.2, rich('A CMRI costuma não analisar recurso quando não houve negativa formal.', { x: W / 2, y: 960, size: 28, fill: C.ink2, anchor: 'middle', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '3.3-07', aula: '3.3', title: 'Quando não respondem nada',
    cue: 'BLOCO 4 — reclamação à autoridade de monitoramento: começa 30 dias depois do pedido e dura 10 dias',
    render() {
      const h = heading('Silêncio não se recorre. {a|Reclama-se.}', { size: 60 });
      let body = h.svg;
      const tl = timeline([
        { at: 0, date: 'DIA 0', t: 'Pedido', color: C.blue, anchor: 'start' },
        { at: 0.52, date: 'DIA 30', t: 'Prazo vencido, sem resposta', color: C.red },
        { at: 0.86, date: 'DIA 40', t: 'Fecha a janela', color: C.amber }
      ], { y: 520, d0: 0.8, step: 0.8, alt: false, side: 'down', labelW: 420 });
      body += tl.svg;
      const xa = X0 + 40 + 0.52 * (BW - 80); const xb = X0 + 40 + 0.86 * (BW - 80);
      body += anim('grow', 3.2, `<rect x="${xa}" y="440" width="${xb - xa}" height="40" fill="${C.amber}"/>`) + anim('fade', 3.6, rich('janela de 10 dias para reclamar', { x: (xa + xb) / 2, y: 425, size: 24, font: 'mono', weight: 700, fill: C.amber, anchor: 'middle', w: 700 }).svg);
      body += anim('up', 4.2, rich('A reclamação vai à {a|autoridade de monitoramento} da LAI no órgão (art. 40), que tem 5 dias para se manifestar. Não resolveu? Sobe para a CGU.', { x: X0, y: 790, size: 30, weight: 500, w: 1000 }).svg);
      body += anim('up', 5.0, box({ x: 1180, y: 740, w: 620, h: 200, fill: C.s1, stroke: C.red, sw: 3 }) + label('LAI, art. 32', { x: 1210, y: 784, size: 22, color: C.red })
        + rich('Recusar, retardar de propósito ou entregar de forma incorreta, incompleta ou imprecisa é conduta ilícita do servidor.', { x: 1210, y: 832, size: 24, w: 560, weight: 500 }).svg);
      return { body, source: 'Lei 12.527/2011, arts. 32 e 40 · Decreto 7.724/2012, art. 22' };
    }
  },
  {
    id: '3.3-08', aula: '3.3', title: 'Fora do governo federal',
    cue: 'BLOCO 5 — mesmos prazos, degraus da norma local e saídas quando o sistema não funciona',
    render() {
      const h = heading('Fora do governo federal', { sub: 'Os prazos são os mesmos: 20 mais 10. Os degraus de recurso quem define é a norma local.' });
      const c = columns([
        { head: 'Ministério Público', body: 'Representação quando o sistema local simplesmente não funciona.', icon: 'building' },
        { head: 'Tribunal de contas', body: 'Representação ao órgão que fiscaliza as contas do ente.', icon: 'scale' },
        { head: 'Mandado de segurança', body: 'Com advogado: a ação para proteger um direito claro contra ato ilegal de autoridade.', icon: 'gavel' }
      ], { y: 400, h: 340, size: 30, headSize: 36, step: 0.8 });
      let body = h.svg + c.svg;
      body += anim('up', 3.4, box({ x: X0, y: 800, w: BW, h: 130, fill: C.paper, stroke: C.paper, sw: 0, shadow: C.amber, sh: 10 }) + label('A omissão também vira pauta', { x: X0 + 30, y: 842, size: 20, color: C.pAccent })
        + rich('“Prefeitura ignora a Lei de Acesso há seis meses”', { x: X0 + 30, y: 900, size: 40, font: 'display', fill: C.pInk, w: BW - 60 }).svg);
      return { body, source: SRC_LAI };
    }
  },

  // ---------------------------------------------------------------- 3.4
  {
    id: '3.4-01', aula: '3.4', title: 'Cem anos? Quinze',
    cue: 'ABERTURA — desde 2024, no governo federal, restrição sem prazo justificado é presumida em 15 anos, não em 100',
    render() {
      let body = anim('pop', 0.3, rich('100', { x: 560, y: 560, size: 330, font: 'display', fill: C.ink3, anchor: 'middle', w: 900 }).svg + rich('ANOS', { x: 560, y: 650, size: 44, font: 'mono', weight: 700, fill: C.ink3, anchor: 'middle', w: 600 }).svg);
      body += anim('draw', 1.4, `<path d="M300 520 L830 360" stroke="${C.red}" stroke-width="22" stroke-linecap="round" fill="none" pathLength="1"/>`, { t: 0.5 });
      body += anim('pop', 2.0, rich('15', { x: 1380, y: 560, size: 330, font: 'display', fill: C.amber, anchor: 'middle', w: 900 }).svg + rich('ANOS', { x: 1380, y: 650, size: 44, font: 'mono', weight: 700, fill: C.amber, anchor: 'middle', w: 600 }).svg);
      body += anim('up', 2.8, rich('Desde 2024, no governo federal, a restrição de informação pessoal {a|sem prazo justificado} é presumida em 15 anos.', { x: W / 2, y: 820, size: 38, weight: 700, anchor: 'middle', w: 1500 }).svg);
      body += anim('up', 3.6, rich('Quase ninguém sabe disso. Inclusive alguns órgãos, que continuaram carimbando 100 anos por hábito.', { x: W / 2, y: 940, size: 28, fill: C.ink2, anchor: 'middle', w: 1600 }).svg);
      return { body };
    }
  },
  {
    id: '3.4-02', aula: '3.4', title: 'Dois tipos de segredo',
    cue: 'BLOCO 1 e 2 — informação classificada (art. 24) e informação pessoal (art. 31)',
    render() {
      const h = heading('Dois tipos de segredo', { sub: 'Confundir os dois é o erro mais comum.' });
      const c = columns([
        { num: 'art. 24', head: 'Informação classificada', items: ['Uma autoridade decide, por ato formal', 'Risco à segurança da sociedade ou do Estado', 'Tem grau e prazo', 'A decisão precisa dizer assunto, fundamento, prazo e quem classificou (art. 28)'], color: C.blue },
        { num: 'art. 31', head: 'Informação pessoal', items: ['Intimidade, vida privada, honra e imagem', 'Acesso restrito {a|por até} 100 anos', 'Não é classificação: não tem grau, não tem autoridade classificadora', 'Tem exceções que derrubam muita negativa'], color: C.amber }
      ], { y: 380, h: 560, size: 30, headSize: 40, step: 1.4, itemStep: 0.35 });
      return { body: h.svg + c.svg, source: SRC_LAI };
    }
  },
  {
    id: '3.4-03', aula: '3.4', title: 'Os graus de classificação',
    cue: '[TELA: ultrassecreta, até 25 anos · secreta, até 15 anos · reservada, até 5 anos]',
    render() {
      const h = heading('Informação classificada: os graus', { sub: 'Art. 24 da LAI.' });
      let body = h.svg;
      body += hbars([
        { name: 'Ultrassecreta', v: 25, label: 'até 25 anos', color: C.red },
        { name: 'Secreta', v: 15, label: 'até 15 anos', color: C.amber },
        { name: 'Reservada', v: 5, label: 'até 5 anos', color: C.blue }
      ], { x: X0 + 400, y: 390, w: 900, rowH: 130, labelW: 380, labelSize: 38, valueSize: 40, d0: 0.8, step: 0.6 }).svg;
      body += anim('up', 3.0, box({ x: X0, y: 800, w: BW, h: 150, fill: C.s1, stroke: C.lineUi, sw: 2 }) + label('Art. 24, §2º', { x: X0 + 30, y: 846, size: 22 })
        + rich('Informações que possam pôr em risco a segurança do presidente, do vice e de suas famílias: {a|reservadas até o fim do mandato}. Guarde essa: ela volta num caso de cartão corporativo.', { x: X0 + 30, y: 900, size: 28, w: BW - 60, weight: 500 }).svg);
      return { body, source: SRC_LAI };
    }
  },
  {
    id: '3.4-04', aula: '3.4', title: 'O que a decisão de classificar precisa dizer',
    cue: 'BLOCO 1 — art. 28: assunto, fundamento, prazo e quem classificou',
    render() {
      const h = heading('“É sigiloso.” Mostre a decisão.', { sub: 'Classificar exige decisão formal. O art. 28 manda a decisão dizer:' });
      let body = h.svg;
      body += checklist([
        { t: 'O assunto', kind: 'no' }, { t: 'O fundamento', kind: 'no' }, { t: 'O prazo', kind: 'no' }, { t: 'Quem classificou', kind: 'no' }
      ], { y: 420, w: 800, size: 44, step: 0.6, gap: 34 }).svg;
      body += stamp('NEGATIVA INCOMPLETA', { x: 1320, y: 560, color: C.red, size: 50, d: 3.4 });
      body += anim('up', 4.2, rich('Se o órgão não mostra isso, você pode pedir a {a|desclassificação}, com recurso previsto no art. 17.', { x: 1000, y: 760, size: 34, weight: 700, w: 800 }).svg);
      return { body, source: SRC_LAI };
    }
  },
  {
    id: '3.4-05', aula: '3.4', title: 'As duas exceções do art. 31',
    cue: '[TELA: art. 31, §3º, V, e §4º, destacados]',
    render() {
      const h = heading('As duas exceções que derrubam negativas', { size: 58 });
      let body = h.svg;
      body += paperCard({ x: X0, y: 300, w: 800, h: 430, ref: 'LAI · art. 31, §3º, V', text: 'A restrição não vale quando a informação é necessária {h|à proteção do interesse público e geral preponderante}.', size: 36, d: 0.6, hlD: 1.6 }).svg;
      body += paperCard({ x: 1000, y: 300, w: 800, h: 430, ref: 'LAI · art. 31, §4º', text: 'A restrição {h|não pode ser usada para prejudicar a apuração de irregularidades} em que o titular da informação esteja envolvido.', size: 36, d: 1.8, hlD: 2.8 }).svg;
      body += anim('up', 4.0, rich('Traduzindo: {a|dado pessoal não serve de escudo para esconder irregularidade.}', { x: X0, y: 880, size: 42, font: 'display', w: BW, lh: 1.1 }).svg);
      return { body, source: 'Resumo dos dispositivos, como no roteiro · Lei 12.527/2011' };
    }
  },
  {
    id: '3.4-06', aula: '3.4', title: 'O que a CGU mudou',
    cue: 'BLOCO 3 — Enunciado 12/2023 e a portaria de setembro de 2024',
    warn: 'Conferir antes de gravar a situação do projeto de lei da CGU sobre o art. 31.',
    render() {
      const h = heading('Dois entendimentos da CGU para citar');
      const c = columns([
        { num: '2023', head: 'Enunciado 12', body: 'É vedado negar acesso alegando “informações pessoais” de forma geral e abstrata. {a|O órgão aponta o dado, tarja e entrega o resto.}', icon: 'doc' },
        { num: '2024', head: 'Portaria de setembro', body: 'Restrição de informação pessoal sem prazo indicado: {a|presumida em 15 anos.} Prazo maior exige justificativa concreta.', icon: 'clock' }
      ], { y: 300, h: 420, size: 32, headSize: 40, step: 1.0 });
      let body = h.svg + c.svg;
      body += anim('up', 3.2, rich('Dois avisos', { x: X0, y: 800, size: 26, font: 'mono', weight: 700, fill: C.red, upper: true, w: 600 }).svg);
      body += anim('up', 3.5, rich('A regra dos 15 anos é administrativa e vale só para o Executivo federal. Estados, municípios e outros Poderes têm regras próprias.', { x: X0, y: 850, size: 26, w: 800, fill: C.ink2 }).svg);
      body += anim('up', 3.9, rich('A CGU anunciou um projeto de lei para tirar o “até 100 anos” da LAI. Na última checagem, não havia sido aprovado.', { x: 1000, y: 850, size: 26, w: 800, fill: C.ink2 }).svg);
      return { body, source: 'CGU, instância de recurso no governo federal' };
    }
  },
  {
    id: '3.4-07', aula: '3.4', title: 'O hábito dos cem anos em números',
    cue: 'BLOCO 3 — 1.916 negativas com prazo de 100 anos em 2024; para 2025, as fontes divergem entre 77 e 83',
    render() {
      const h = heading('O tamanho do hábito', { sub: 'Negativas com prazo de 100 anos no governo federal.' });
      let body = h.svg;
      body += bars([
        { name: '2024', v: 1916, label: '1.916', color: C.red },
        { name: '2025', v: 83, label: '77 a 83', color: C.amber }
      ], { x: X0 + 260, w: 800, y: 900, h: 460, gap: 200, d0: 0.8, step: 0.8, valueSize: 70 }).svg;
      body += anim('up', 2.8, rich('Para 2025, as fontes divergem: entre 77 e 83.', { x: 1320, y: 560, size: 32, weight: 700, w: 480 }).svg);
      body += anim('up', 3.6, rich('Até junho de 2025, o Fala.BR {a|registrava o prazo de 100 anos automaticamente}.', { x: 1320, y: 700, size: 32, w: 480, weight: 500 }).svg);
      return { body, source: 'Números citados no roteiro da aula 3.4' };
    }
  },
  {
    id: '3.4-08', aula: '3.4', title: 'LGPD não é borracha',
    cue: 'BLOCO 4 — a LGPD não revogou a LAI; as duas convivem',
    render() {
      let body = anim('up', 0.3, rich('LEI DE ACESSO À INFORMAÇÃO', { x: W / 2, y: 470, size: 84, font: 'display', anchor: 'middle', w: 1800 }).svg);
      const er = `<g><rect x="0" y="0" width="300" height="130" fill="${C.red}" transform="rotate(-12 150 65)"/><rect x="0" y="80" width="300" height="50" fill="#FFB3AC" transform="rotate(-12 150 65)"/></g>`;
      body += anim('slideR', 1.0, `<g transform="translate(200 320)">${er}</g>` + rich('LGPD', { x: 350, y: 410, size: 54, font: 'display', fill: C.bg, anchor: 'middle', w: 300 }).svg, { t: 2.4, style: '--dx:1750px' });
      body += stamp('NÃO APAGA', { x: W / 2, y: 610, color: C.amber, size: 48, d: 3.3 });
      body += anim('up', 3.8, rich('A LGPD não revogou a LAI. {a|As duas convivem.}', { x: W / 2, y: 760, size: 44, font: 'display', anchor: 'middle', w: BW }).svg);
      body += anim('up', 4.5, rich('O poder público trata dados pessoais para cumprir obrigação legal (LGPD, art. 7º, II) e para executar suas atribuições (art. 23). Cumprir a LAI é cumprir obrigação legal.', { x: W / 2, y: 860, size: 30, fill: C.ink2, anchor: 'middle', w: 1600 }).svg);
      return { body, source: 'Lei 13.709/2018, a LGPD · Lei 12.527/2011, a LAI' };
    }
  },
  {
    id: '3.4-09', aula: '3.4', title: 'O que é público e o que é protegido',
    cue: 'BLOCO 4 — Tema 483 do STF; tarje o que for íntimo e entregue o resto',
    render() {
      const h = heading('Tarje o que for íntimo. {a|Entregue o resto.}');
      const c = columns([
        { head: 'É público', items: ['Salário de servidor, com o nome: STF, Tema 483, julgado em 2015', 'Nome de quem assina ato público', 'Sócio de empresa contratada com dinheiro público'], color: C.green, icon: 'eye' },
        { head: 'Continua protegido', items: ['Endereço residencial', 'CPF completo', 'Dados de saúde', 'Dados bancários pessoais'], color: C.red, icon: 'lock' }
      ], { x: X0, w: 1060, y: 300, h: 600, size: 30, headSize: 40, step: 1.2 });
      let body = h.svg + c.svg;
      body += docSheet({ x: 1260, y: 300, w: 540, h: 600, head: true, title: 'Resposta ao pedido', lines: [{ t: 'Servidor: Fulano de Tal', size: 24 }, { t: 'Cargo: assessor', size: 24 }, { t: 'Remuneração: R$ 12.000,00', size: 24 }, { t: 'CPF: 000.000.000-00', size: 24 }, { t: 'Endereço: Rua Exemplo, 100', size: 24 }, 0.8, 0.6], d: 3.4 });
      body += redact({ x: 1354, y: 592, w: 240, h: 32, d: 4.6 });
      body += redact({ x: 1418, y: 637, w: 282, h: 32, d: 4.9 });
      return { body, source: 'Exemplo fictício' };
    }
  },
  {
    id: '3.4-10', aula: '3.4', title: 'O recurso contra negativa por dado pessoal',
    cue: '[TELA: modelo D dos bônus, com os quatro argumentos destacados]',
    render() {
      const h = heading('O recurso em quatro argumentos', { sub: 'Modelo D dos bônus.' });
      const l = list([
        { t: 'Enunciado CGU 12, de 2023', sub: 'Negativa genérica é vedada. Tarje e entregue.' },
        { t: 'LAI, art. 31, §3º, V, e §4º', sub: 'Interesse público preponderante e apuração de irregularidade.' },
        { t: 'LGPD, arts. 7º, II, e 23', sub: 'A lei de dados não afasta a lei de acesso.' },
        { t: 'O pedido não é genérico', sub: 'Tem objeto, período e órgão, e pede o dado tal como existe.' }
      ], { y: 380, size: 42, subSize: 30, gap: 36, step: 1.1 });
      let body = h.svg + l.svg;
      body += anim('fade', 5.4, rich('Fora do governo federal, o enunciado da CGU não obriga ninguém. Mas o raciocínio vale, e os artigos da LAI valem para todos.', { x: X0, y: 960, size: 26, fill: C.ink2, w: BW }).svg);
      return { body };
    }
  },

  // ---------------------------------------------------------------- 3.5
  {
    id: '3.5-01', aula: '3.5', title: 'Um formulário virou decreto',
    cue: 'ABERTURA — “Um pedido de LAI sobre voos da FAB virou decreto presidencial.”',
    render() {
      let body = docSheet({ x: 300, y: 330, w: 420, h: 520, head: false, title: 'Pedido LAI', lines: [0.9, 0.7, 0.8, 0.6, 0.9, 0.5], d: 0.4 });
      body += arrowH(760, 590, 1140, { d: 1.4, color: C.amber, sw: 6 });
      body += docSheet({ x: 1180, y: 330, w: 420, h: 520, head: true, title: 'Decreto 8.783/2016', lines: [0.9, 0.8, 0.95, 0.7, 0.85], d: 1.9 });
      body += anim('up', 0.2, rich('Um pedido de LAI sobre voos da FAB virou {a|decreto presidencial}.', { x: W / 2, y: 230, size: 54, font: 'display', anchor: 'middle', w: 1700 }).svg);
      body += anim('up', 2.8, rich('Não foi um vazamento. Não foi uma fonte. {a|Foi um formulário.}', { x: W / 2, y: 960, size: 42, font: 'display', anchor: 'middle', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '3.5-02', aula: '3.5', title: 'Estados e municípios',
    cue: '[TELA: dois exemplos — um órgão que usa o Fala.BR e um com sistema próprio]',
    warn: 'O sistema federal de pedidos migrou do Fala.BR para o InformaBR (ver insertos). Conferir o nome e a tela do dia antes de gravar.',
    render() {
      const h = heading('Estados e municípios', { sub: 'A LAI é lei nacional. Mas o art. 45 manda cada ente definir quem responde, quem julga recurso e quantos degraus existem.' });
      const c = columns([
        { head: 'Aderiu ao sistema federal', body: 'Alguns estados e muitas prefeituras usam o sistema federal de pedidos.', icon: 'globe', color: C.blue },
        { head: 'Tem sistema próprio', body: 'No site do órgão, procure “Acesso à Informação”, “e-SIC” ou “SIC”, o Serviço de Informação ao Cidadão.', icon: 'building', color: C.amber },
        { head: 'Não tem nada funcionando', body: 'Protocole mesmo assim: e-mail oficial ou papel, com comprovante. Anote data, nome de quem recebeu e guarde cópia.', icon: 'mail', color: C.red, foot: 'Sem norma local, a LAI se aplica direto.' }
      ], { y: 420, h: 500, size: 30, headSize: 34, step: 0.9 });
      return { body: h.svg + c.svg, source: SRC_LAI };
    }
  },
  {
    id: '3.5-03', aula: '3.5', title: 'Caso 1, os voos da FAB',
    cue: 'BLOCO 2 — 153 órgãos para transplante deixaram de ser transportados; nos mesmos dias, 716 voos de autoridades',
    render() {
      const h = heading('Duas listas, cruzadas por data', { sub: 'O Globo, 2016, repórter Vinicius Sassine: dados da FAB obtidos pela LAI, de 2013 a 2015.' });
      let body = h.svg;
      body += anim('up', 0.8, box({ x: X0, y: 380, w: 620, h: 420, fill: C.s1, stroke: C.red, sw: 3 }) + rich('153', { x: X0 + 40, y: 530, size: 130, font: 'display', fill: C.red, w: 560 }).svg + rich('órgãos para transplante deixaram de ser transportados', { x: X0 + 40, y: 610, size: 32, weight: 700, w: 540 }).svg);
      body += anim('up', 1.6, box({ x: 1180, y: 380, w: 620, h: 420, fill: C.s1, stroke: C.amber, sw: 3 }) + rich('716', { x: 1220, y: 530, size: 130, font: 'display', fill: C.amber, w: 560 }).svg + rich('voos de autoridades atendidos pela FAB nos mesmos dias', { x: 1220, y: 610, size: 32, weight: 700, w: 540 }).svg);
      [430, 520, 610, 700, 760].forEach((y, i) => { body += anim('draw', 2.6 + i * 0.2, `<path d="M${X0 + 630} ${y} C900 ${y - 40} 1000 ${y + 40} 1170 ${y}" stroke="${C.ink2}" stroke-width="3" stroke-dasharray="1" fill="none" pathLength="1"/>`, { t: 0.6 }); });
      body += anim('pop', 3.4, `<rect x="820" y="545" width="280" height="70" fill="${C.bg}" stroke="${C.ink2}" stroke-width="2"/>` + rich('mesma data', { x: 960, y: 590, size: 26, font: 'mono', weight: 700, anchor: 'middle', fill: C.ink, w: 280 }).svg);
      body += anim('up', 4.2, rich('Depois da reportagem: {a|Decreto 8.783/2016}, que obriga a FAB a manter aeronave disponível para transporte de órgãos.', { x: X0, y: 880, size: 32, weight: 700, w: BW }).svg);
      body += anim('fade', 5.0, rich('Nenhuma das listas era segredo. Juntas, eram escândalo.', { x: X0, y: 960, size: 28, fill: C.ink2, w: BW }).svg);
      return { body, source: 'Caso citado na aula 3.5' };
    }
  },
  {
    id: '3.5-04', aula: '3.5', title: 'Caso 2, o cartão corporativo',
    cue: 'BLOCO 3 — pedido em 18/12/2022, fim do mandato em 31/12, resposta em 11/01/2023',
    render() {
      const h = heading('Saber quando o sigilo vence', { sub: 'Fiquem Sabendo: os gastos do cartão corporativo da Presidência.' });
      let body = h.svg;
      body += timeline([
        { at: 0.05, date: '18/12/2022', t: 'O pedido', sub: 'antes de o sigilo vencer', anchor: 'start' },
        { at: 0.45, date: '31/12/2022', t: 'Fim do mandato', sub: 'vence o sigilo do art. 24, §2º', color: C.red },
        { at: 0.95, date: '11/01/2023', t: 'A resposta', sub: 'logo depois', anchor: 'end', color: C.green }
      ], { y: 520, d0: 0.8, step: 1.0, alt: false, side: 'down', labelW: 460 }).svg;
      body += anim('up', 4.0, rich('pelo menos {a|R$ 27,6 milhões}', { x: X0, y: 870, size: 52, font: 'display', w: 1000 }).svg + rich('gastos no cartão durante o governo Bolsonaro, incluindo despesas ligadas a motociatas. O pedido liberou também gastos de ex-presidentes.', { x: X0, y: 930, size: 26, fill: C.ink2, w: 1000 }).svg);
      body += anim('up', 4.8, rich('Calendário também é ferramenta.', { x: X1, y: 880, size: 36, font: 'display', fill: C.amber, anchor: 'end', w: 600 }).svg);
      return { body, source: 'Prêmio Cláudio Weber Abramo de Jornalismo de Dados, 2023' };
    }
  },
  {
    id: '3.5-05', aula: '3.5', title: 'Caso 3, Lobby sem lei',
    cue: 'BLOCO 4 — milhares de documentos obtidos via LAI mostraram como o lobby funciona em Brasília',
    render() {
      let body = '';
      for (let i = 0; i < 16; i++) {
        const x = 1180 + (i % 4) * 22 + (i % 3) * 30; const y = 820 - i * 34;
        body += anim('down', 0.4 + i * 0.12, `<rect x="${x}" y="${y}" width="480" height="30" fill="${i % 2 ? C.paper : '#E7E0D0'}" stroke="${C.pLine}" stroke-width="2"/>`);
      }
      body += anim('up', 0.3, rich('“Lobby sem lei”', { x: X0, y: 300, size: 76, font: 'display', w: 950 }).svg);
      body += anim('up', 0.9, rich('Revista Época · repórter Alana Rizzo', { x: X0, y: 370, size: 30, font: 'mono', weight: 700, fill: C.amber, w: 950 }).svg);
      body += anim('up', 1.6, rich('Milhares de documentos obtidos via LAI para mostrar como o lobby funciona em Brasília.', { x: X0, y: 480, size: 38, weight: 700, w: 900 }).svg);
      body += anim('up', 3.0, rich('Muitos documentos, um tema, paciência.', { x: X0, y: 720, size: 44, font: 'display', w: 950 }).svg);
      body += anim('up', 3.6, rich('É a fórmula {a|menos glamourosa e mais eficiente} do jornalismo.', { x: X0, y: 860, size: 34, w: 950, fill: C.ink2 }).svg);
      return { body };
    }
  },
  {
    id: '3.5-06', aula: '3.5', title: 'Pedido bom é reutilizável',
    cue: 'BLOCO 5 — quando um pedido dá certo, copie a estrutura; antes de pedir, veja se alguém já pediu',
    render() {
      const h = heading('Pedido bom é reutilizável', { sub: 'Muda o órgão, muda o período. O texto funciona.' });
      let body = h.svg;
      const y = 470;
      body += anim('up', 0.6, box({ x: X0, y: 380, w: BW, h: 300, fill: C.s1, stroke: C.lineUi, sw: 2 }));
      const pre = 'Solicito cópia integral dos contratos firmados por';
      body += anim('fade', 0.8, rich(pre, { x: X0 + 40, y, size: 36, weight: 500, w: BW - 80 }).svg);
      const orgs = ['a Secretaria Municipal de Educação', 'a Secretaria Estadual de Saúde', 'a Câmara Municipal de Y'];
      const pers = ['de 2023 a 2025', 'de 2020 a 2022', 'de 2024 a 2026'];
      orgs.forEach((o, i) => {
        const d = 1.2 + i * 1.8;
        let g = rich(`{a|${o}}, ${''}`, { x: X0 + 40, y: y + 60, size: 36, weight: 700, w: BW - 80 }).svg + rich(`{b|${pers[i]}}, em formato aberto.`, { x: X0 + 40, y: y + 120, size: 36, weight: 700, w: BW - 80 }).svg;
        g = anim('up', d, g);
        if (i < orgs.length - 1) g = anim('gone', d + 1.5, g, { t: 0.3 });
        body += g;
      });
      body += anim('up', 6.6, box({ x: X0, y: 760, w: BW, h: 160, fill: C.s2, stroke: C.amber, sw: 3 }) + label('Antes de pedir, veja se alguém já pediu', { x: X0 + 30, y: 806, size: 22 })
        + rich('Base {a|Achados e Pedidos}, mantida pela Abraji e pela Transparência Brasil. E a {a|Fiquem Sabendo}, agência especializada em LAI.', { x: X0 + 30, y: 862, size: 30, weight: 500, w: BW - 60 }).svg);
      return { body };
    }
  }
];
