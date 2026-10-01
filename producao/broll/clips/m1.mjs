// Módulo 1 — Mentalidade investigativa
import {
  C, W, H, X0, X1, BW, anim, rich, layout, heading, statement, list, columns, compare, flow, timeline, paperCard,
  stamp, table, box, icon, badge, arrowH, arrowV, arrowPath, edge, node, pill, redact, chatBubble, label
} from '../kit.mjs';

export default [
  // ---------------------------------------------------------------- 1.1
  {
    id: '1.1-01', aula: '1.1', title: 'Toda semana, uma bomba',
    cue: 'ABERTURA — “Toda semana alguém me manda uma bomba… Nove em cada dez não têm nada dentro.”',
    render() {
      const h = heading('Toda semana, alguém me manda uma bomba.', { size: 64 });
      const items = [
        ['Print de conversa', 'chat'], ['Áudio do primo que trabalha na prefeitura', 'mic'], ['PDF sem timbre', 'doc'],
        ['Foto sem data', 'camera'], ['“Dizem que…”', 'chat'], ['Planilha sem autor', 'doc'], ['Print de post apagado', 'chat'],
        ['Áudio encaminhado', 'mic'], ['Documento com cara de oficial', 'doc'], ['Mensagem anônima', 'mail']
      ];
      const cw = 300; const ch = 176; const gap = 36; const x0 = X0 + (BW - (5 * cw + 4 * gap)) / 2; const y0 = 320;
      const keep = 5;
      let body = h.svg;
      items.forEach(([t, ic], i) => {
        const x = x0 + (i % 5) * (cw + gap); const y = y0 + Math.floor(i / 5) * (ch + gap);
        const card = box({ x, y, w: cw, h: ch, fill: C.s1, stroke: C.lineUi, sw: 2 }) + icon(ic, { x: x + 24, y: y + 22, s: 44, color: C.ink2 })
          + rich(t, { x: x + 24, y: y + 108, size: 26, w: cw - 48, weight: 500, lh: 1.15 }).svg;
        let g = anim('pop', 0.6 + i * 0.16, card);
        if (i !== keep) g = anim('dim', 3.6 + (i % 5) * 0.06, g);
        body += g;
      });
      const kx = x0 + (keep % 5) * (cw + gap); const ky = y0 + Math.floor(keep / 5) * (ch + gap);
      body += anim('draw', 4.3, `<rect x="${kx - 6}" y="${ky - 6}" width="${cw + 12}" height="${ch + 12}" fill="none" stroke="${C.amber}" stroke-width="6" pathLength="1"/>`);
      body += anim('up', 4.2, rich('{a|Nove em cada dez não têm nada dentro.} A décima pode ter.', { x: X0, y: 812, size: 44, font: 'display', w: BW }).svg);
      body += anim('up', 5.2, rich('Mas só vira matéria depois de semanas de um trabalho que ninguém filma: ler diário oficial, cruzar planilha, esperar resposta de órgão público.', { x: X0, y: 880, size: 32, fill: C.ink2, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '1.1-02', aula: '1.1', title: 'Apurar é tornar puro',
    cue: 'BLOCO 1 — “Apurar vem de puro. Apurar é, literalmente, tornar puro.”',
    render() {
      let body = anim('up', 0.2, rich('APURAR', { x: X0, y: 420, size: 150, font: 'display', w: 900 }).svg);
      body += anim('up', 0.7, rich('vem de {a|puro}.', { x: X0, y: 500, size: 56, font: 'display', w: 900 }).svg);
      body += anim('up', 1.2, rich('Apurar é, literalmente, {a|tornar puro}.', { x: X0, y: 600, size: 40, w: 760, weight: 500 }).svg);
      body += anim('up', 1.7, rich('Você pega uma massa de boato, versão e ruído e tira o que não é fato. O que sobra é a matéria.', { x: X0, y: 690, size: 32, w: 760, fill: C.ink2 }).svg);
      // peneira
      const fx = 1100; const fw = 620; const fy = 560;
      body += anim('fade', 1.0, `<path d="M${fx} ${fy} H${fx + fw} L${fx + fw - 180} ${fy + 120} H${fx + 180} Z" fill="${C.s2}" stroke="${C.lineUi}" stroke-width="3"/>`
        + Array.from({ length: 11 }, (_, i) => `<path d="M${fx + 40 + i * 54} ${fy + 8} L${fx + 190 + i * 22.5} ${fy + 112}" stroke="${C.line}" stroke-width="2"/>`).join(''));
      const words = [['boato', 1130, 300], ['versão', 1400, 250], ['ruído', 1600, 330], ['print sem contexto', 1180, 420], ['achismo', 1530, 440], ['“dizem que”', 1330, 360]];
      words.forEach(([w0, x, y], i) => {
        const L = layout(w0, { size: 34, font: 'mono', weight: 700 });
        const g = `<rect x="${x - 14}" y="${y - 38}" width="${L.w + 28}" height="54" fill="${C.s3}"/>` + rich(w0, { x, y: y - 1, size: 34, font: 'mono', weight: 700, fill: C.ink2, w: 800 }).svg;
        body += anim('drop', 2.6 + i * 0.35, anim('pop', 0.5 + i * 0.2, g));
      });
      body += anim('pop', 5.0, `<rect x="${fx + 190}" y="${fy + 190}" width="${fw - 380}" height="110" fill="${C.amber}"/>` + rich('FATO', { x: fx + fw / 2, y: fy + 268, size: 64, font: 'display', fill: C.bg, anchor: 'middle', w: 600 }).svg);
      body += anim('fade', 5.4, `<path d="M${fx + fw / 2} ${fy + 124} V${fy + 182}" stroke="${C.amber}" stroke-width="4"/>`);
      body += anim('up', 6.0, rich('Às vezes não sobra nada.', { x: fx + fw / 2, y: fy + 370, size: 32, fill: C.ink2, anchor: 'middle', w: 700 }).svg);
      return { body };
    }
  },
  {
    id: '1.1-03', aula: '1.1', title: 'Os três elementos da investigação',
    cue: 'BLOCO 1 — definição do manual da UNESCO: revelar ao público questões escondidas',
    render() {
      const h = heading('Investigar é revelar ao público questões {a|escondidas}.', { size: 62 });
      const cols = columns([
        { num: '01', head: 'Trabalho original', body: 'Você produziu a informação. Não repercutiu a de outro.', icon: 'pen' },
        { num: '02', head: 'Interesse público', body: 'Envolve dinheiro público, poder público ou direitos de muita gente.', icon: 'users' },
        { num: '03', head: 'Estava escondido', body: 'De propósito, por alguém com poder. Ou espalhado em dez bases que ninguém se deu ao trabalho de juntar.', icon: 'search', foot: 'O segundo tipo é o mais comum. E o mais barato de achar.' }
      ], { y: 380, h: 520, size: 32, headSize: 40, step: 0.9 });
      return { body: h.svg + cols.svg, source: 'Fonte: manual “A Investigação a partir de Histórias”, UNESCO, coordenado por Mark Lee Hunter' };
    }
  },
  {
    id: '1.1-04', aula: '1.1', title: 'O que não é investigação',
    cue: 'BLOCO 2 — opinião, react, “exposed” sem documento, vazamento sem verificação',
    render() {
      const h = heading('O que {r|não} é investigação');
      const l = list([
        { t: '{s|Opinião}', sub: 'Você pode ter a melhor opinião do mundo sobre o governador. Ela não prova nada.' },
        { t: '{s|Reagir à notícia dos outros}', sub: 'React é comentário.' },
        { t: '{s|“Exposed” sem documento}', sub: 'É acusação com trilha sonora.' },
        { t: '{s|Vazamento publicado sem verificação}', sub: 'É trabalhar de graça para quem vazou.' }
      ], { y: 330, size: 48, subSize: 32, gap: 40, numbered: false, marker: 'no', step: 1.2 });
      return { body: h.svg + l.svg };
    }
  },
  {
    id: '1.1-05', aula: '1.1', title: 'Sem documento, é lenda',
    cue: '[LETTERING: Sem documento, é lenda.] — a regra que volta ao longo do curso',
    render() {
      let body = anim('fade', 0.2, label('A regra de todo roteiro', { x: W / 2, y: 330, size: 28, anchor: 'middle' }));
      body += anim('up', 0.5, rich('Sem documento,', { x: W / 2, y: 520, size: 150, font: 'display', anchor: 'middle', w: 1800 }).svg);
      body += anim('up', 1.1, rich('{a|é lenda.}', { x: W / 2, y: 690, size: 150, font: 'display', anchor: 'middle', w: 1800 }).svg);
      body += anim('grow', 1.9, `<rect x="${W / 2 - 360}" y="740" width="720" height="10" fill="${C.amber}"/>`);
      return { body, kicker: null };
    }
  },
  {
    id: '1.1-06', aula: '1.1', title: 'O funil da apuração',
    cue: '[TELA: funil em cinco camadas — boato, pista, hipótese, prova, publicação]',
    render() {
      const layers = [
        ['BOATO', '“Dizem que o secretário está enriquecendo.”'],
        ['PISTA', 'Um fato verificável que aponta para algum lugar: “O secretário comprou uma fazenda em 2025.”'],
        ['HIPÓTESE', 'A frase que você vai tentar provar ou derrubar. Aula 1.3.'],
        ['PROVA', 'Documentos, dados, fontes independentes.'],
        ['PUBLICAÇÃO', 'Só o que sobreviveu.']
      ];
      const cx = 560; const top = 200; const lh = 112; const gap = 14; const w0 = 860; const w1 = 330;
      let body = '';
      layers.forEach(([t, ex], i) => {
        const y = top + i * (lh + gap);
        const wa = w0 - (w0 - w1) * (i / 5); const wb = w0 - (w0 - w1) * ((i + 1) / 5);
        const col = i === 4 ? C.amber : [C.s3, '#2E2E33', '#3A3A40', '#4A4A52'][i];
        const shape = `<path d="M${cx - wa / 2} ${y} H${cx + wa / 2} L${cx + wb / 2} ${y + lh} H${cx - wb / 2} Z" fill="${col}"/>`
          + rich(t, { x: cx, y: y + lh / 2 + 16, size: 44, font: 'display', anchor: 'middle', fill: i === 4 ? C.bg : C.ink, w: 800 }).svg;
        const d = 0.5 + i * 1.0;
        body += anim('pop', d, shape);
        body += anim('left', d + 0.3, `<path d="M${cx + wa / 2 + 30} ${y + lh / 2} H1070" stroke="${C.line}" stroke-width="2"/>` + rich(ex, { x: 1090, y: y + lh / 2 - (layout(ex, { size: 30, w: 700 }).h / 2) + 26, size: 30, w: 700, fill: i === 4 ? C.amber : C.ink2 }).svg);
        if (i >= 1 && i <= 3) {
          [[-1, 0], [1, 0.25], [-1, 0.5]].forEach(([side, dd], k) => {
            const px = cx + side * (wa / 2 - 30 - k * 20); const py = y + 30 + k * 18;
            body += anim('drop', d + 1.1 + dd, anim('pop', d + 0.4, `<rect x="${px - 12}" y="${py - 12}" width="24" height="24" fill="${C.ink3}"/>`), { t: 1.2 });
          });
        }
      });
      body += anim('up', 5.8, rich('A maior parte das histórias morre no meio do funil. {a|É o funil funcionando.}', { x: X0, y: 880, size: 36, font: 'display', w: BW }).svg);
      body += anim('up', 6.4, rich('O que morre no funil é o que você não vai precisar desmentir depois.', { x: X0, y: 935, size: 30, fill: C.ink2, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '1.1-07', aula: '1.1', title: 'Quanto tempo leva',
    cue: 'BLOCO 4 — orçamento secreto: relatos no fim de 2020, primeira reportagem em maio de 2021',
    render() {
      const h = heading('Quanto tempo leva', { sub: 'Um exemplo de escala: a série do Estadão sobre o orçamento secreto.' });
      const tl = timeline([
        { at: 0.06, date: 'FIM DE 2020', t: 'Relatos de bastidor', sub: 'ligados à eleição para a presidência da Câmara', anchor: 'start' },
        { at: 0.94, date: 'MAIO DE 2021', t: 'Sai a primeira reportagem', sub: 'com uma redação inteira por trás', anchor: 'end' }
      ], { y: 560, d0: 0.8, step: 1.2, alt: false, side: 'down', labelW: 560 });
      let body = h.svg + tl.svg;
      const xa = X0 + 40 + 0.06 * (BW - 80) + 40; const xb = X0 + 40 + 0.94 * (BW - 80) - 40;
      body += anim('grow', 2.6, `<rect x="${xa}" y="470" width="${xb - xa}" height="12" fill="${C.amber}" opacity=".6"/><rect x="${xa}" y="460" width="6" height="32" fill="${C.amber}"/><rect x="${xb - 6}" y="460" width="6" height="32" fill="${C.amber}"/>`, { t: 1.4 });
      body += anim('pop', 3.6, rich('MESES entre a pista e a publicação', { x: (xa + xb) / 2, y: 430, size: 44, font: 'display', anchor: 'middle', w: 1200 }).svg);
      body += anim('up', 4.6, rich('Desconfie de quem entrega {s|investigação em cinco horas}.', { x: W / 2, y: 900, size: 38, anchor: 'middle', w: BW, weight: 500, hlD: 5.2 }).svg);
      return { body, source: 'Caso de apoio: série do Estadão sobre o orçamento secreto' };
    }
  },
  {
    id: '1.1-08', aula: '1.1', title: 'Três bombas, uma pauta',
    cue: '[TELA: tabela modelo — bomba / quem mandou / documento verificável? / interesse público?]',
    render() {
      const h = heading('Três bombas. Escolha uma.', { sub: 'A escolhida é a sua pauta do curso. Ela vai com você até o módulo 8.' });
      const t = table({
        y: 380, rowH: 118, headH: 62, size: 30, step: 0.9, d0: 0.9,
        cols: [{ h: 'Bomba', w: 600 }, { h: 'Quem mandou', w: 360 }, { h: 'Documento verificável?', w: 380 }, { h: 'Interesse público?', w: 340 }],
        rows: [
          ['Print: o secretário de saúde superfatura remédio', 'Grupo de WhatsApp, sem autor', '{r|Não}', 'Sim'],
          ['Áudio: o prefeito tem apartamento em Miami', '“O primo de alguém”', '{r|Não}', 'Depende de onde veio o dinheiro'],
          ['Empresa aberta cinco meses antes ganha contrato sem licitação', 'Servidor da secretaria', '{g|Sim: extrato no Diário Oficial}', '{g|Sim: dinheiro público}']
        ]
      });
      let body = h.svg + t.svg;
      body += anim('draw', 4.2, `<rect x="${X0 - 8}" y="${380 + 62 + 2 * 118 - 6}" width="${1680 + 16}" height="${118 + 12}" fill="none" stroke="${C.amber}" stroke-width="6" pathLength="1"/>`);
      body += stamp('SUA PAUTA DO CURSO', { x: 1500, y: 900, color: C.amber, size: 38, d: 4.8 });
      body += anim('up', 3.4, rich('Existe algum documento que eu consiga ver? {d|Não “alguém diz que existe”.}', { x: X0, y: 905, size: 30, w: 1100 }).svg);
      return { body };
    }
  },

  // ---------------------------------------------------------------- 1.2
  {
    id: '1.2-01', aula: '1.2', title: 'Vazamento é um convite',
    cue: 'ABERTURA — “Vazamento não é reportagem. É um convite para trabalhar para o interesse de alguém.”',
    render() {
      const h = heading('Vazamento não é reportagem.', { sub: 'É um convite para trabalhar para o interesse de alguém.' });
      const cy = 610; const r = 240;
      let body = h.svg;
      body += anim('slideR', 1.4, anim('pop', 0.6, `<circle cx="600" cy="${cy}" r="${r}" fill="${C.red}" fill-opacity=".12" stroke="${C.red}" stroke-width="5"/>`
        + rich('Interesse de quem vazou', { x: 540, y: cy - 10, size: 36, weight: 700, anchor: 'middle', w: 300 }).svg), { t: 1.4, style: '--dx:200px' });
      body += anim('slideL', 1.4, anim('pop', 0.9, `<circle cx="1320" cy="${cy}" r="${r}" fill="${C.green}" fill-opacity=".12" stroke="${C.green}" stroke-width="5"/>`
        + rich('Interesse público', { x: 1380, y: cy - 10, size: 36, weight: 700, anchor: 'middle', w: 300 }).svg), { t: 1.4, style: '--dx:-200px' });
      body += anim('pop', 3.1, `<path d="M${W / 2} ${cy + 60} V${cy + 272}" stroke="${C.amber}" stroke-width="3"/>` + rich('{a|às vezes coincidem}', { x: W / 2, y: cy + 312, size: 28, font: 'mono', weight: 700, anchor: 'middle', w: 600 }).svg);
      body += anim('up', 3.8, rich('O seu trabalho: descobrir qual dos dois é o caso {a|antes} de apertar “publicar”.', { x: W / 2, y: 990, size: 36, weight: 500, anchor: 'middle', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '1.2-02', aula: '1.2', title: 'Denúncia é versão',
    cue: 'BLOCO 1 — denuntiare: anunciar, declarar. Quem denuncia anuncia uma versão.',
    render() {
      let body = anim('up', 0.2, rich('DENÚNCIA', { x: X0, y: 360, size: 120, font: 'display', w: 900 }).svg);
      body += anim('up', 0.7, rich('do latim {a|denuntiare}: anunciar, declarar.', { x: X0, y: 440, size: 38, w: 820, weight: 500 }).svg);
      body += anim('up', 1.2, rich('Quem denuncia anuncia uma {a|versão}.', { x: X0, y: 520, size: 46, font: 'display', w: 820 }).svg);
      const opts = [['Pode ser verdadeira.', C.green], ['Pode ser meia verdade.', C.amber], ['Pode ser mentira bem montada.', C.red]];
      opts.forEach(([t, col], i) => {
        const y = 250 + i * 110;
        body += anim('left', 1.8 + i * 0.5, `<rect x="1100" y="${y}" width="700" height="84" fill="${C.s1}" stroke="${col}" stroke-width="3"/><rect x="1100" y="${y}" width="12" height="84" fill="${col}"/>` + rich(t, { x: 1136, y: y + 55, size: 34, weight: 700, w: 640 }).svg);
      });
      body += anim('up', 3.6, rich('E quase sempre é {a|interessada}:', { x: X0, y: 690, size: 40, weight: 700, w: BW }).svg);
      const who = ['o ex-aliado do secretário', 'o concorrente que perdeu a licitação', 'o adversário da próxima eleição'];
      let px = X0;
      who.forEach((t, i) => { const p = pill(t, { x: px, y: 770, size: 28, d: 4.1 + i * 0.35, color: C.ink2 }); body += p.svg; px += p.w + 24; });
      body += stamp('VERSÃO TEM DONO', { x: 1480, y: 900, color: C.amber, size: 44, d: 5.6 });
      body += anim('up', 5.2, rich('Isso não torna a denúncia falsa.', { x: X0, y: 905, size: 34, fill: C.ink2, w: 900 }).svg);
      return { body };
    }
  },
  {
    id: '1.2-03', aula: '1.2', title: 'As cinco perguntas',
    cue: '[TELA: as cinco perguntas, uma por vez]',
    render() {
      const h = heading('Cinco perguntas a toda denúncia');
      const l = list([
        'Quem me mandou isso?',
        'Por que agora?',
        'Quem ganha se isso for publicado?',
        { t: 'O que ficou fora do recorte?', sub: 'Um print mostra uma conversa. Não mostra a mensagem anterior nem a seguinte.' },
        'Dá para confirmar por outro caminho, sem depender de quem mandou?'
      ], { y: 310, size: 50, subSize: 30, gap: 34, step: 1.4, d0: 0.7 });
      return { body: h.svg + l.svg };
    }
  },
  {
    id: '1.2-04', aula: '1.2', title: 'O que ficou fora do recorte',
    cue: 'BLOCO 2, pergunta 4 — o print não mostra a mensagem anterior nem a seguinte',
    render() {
      const px = 200; const pw = 760; let y = 180;
      let body = anim('fade', 0.2, box({ x: px - 30, y: 150, w: pw + 60, h: 820, fill: C.s1, stroke: C.line, sw: 2 }));
      const msgs = [
        { t: 'O conserto do telhado da escola é emergência? Choveu dentro da sala.', me: true },
        { t: 'É. Dispensa por emergência, já está no processo.' },
        { t: 'Pode pagar hoje, sem licitação.', crop: true },
        { t: 'Feito.', me: true, crop: true },
        { t: 'Publica o extrato da dispensa no diário amanhã.' },
        { t: 'Publicado, junto com o laudo da Defesa Civil.', me: true }
      ];
      const pos = [];
      msgs.forEach((m, i) => {
        const b = chatBubble({ x: px, y, w: pw, text: m.t, me: m.me, size: 30, d: m.crop ? 0.4 : 0.1 });
        pos.push([y, b.h]);
        body += b.svg;
        y += b.h + 22;
      });
      const cTop = pos[2][0] - 16; const cBot = pos[3][0] + pos[3][1] + 16;
      body += anim('gone', 3.6, `<rect x="${px - 30}" y="150" width="${pw + 60}" height="${cTop - 150}" fill="${C.bg}" opacity=".86"/><rect x="${px - 30}" y="${cBot}" width="${pw + 60}" height="${970 - cBot}" fill="${C.bg}" opacity=".86"/>`, { t: 0.9 });
      body += anim('fade', 0.8, `<rect x="${px - 20}" y="${cTop}" width="${pw + 40}" height="${cBot - cTop}" fill="none" stroke="${C.amber}" stroke-width="5" stroke-dasharray="18 10"/>`);
      body += anim('gone', 3.6, anim('fade', 1.0, label('o print que chegou', { x: px - 20, y: cTop - 14, size: 22 })), { t: 0.6 });
      body += anim('fade', 4.3, label('a conversa inteira', { x: px - 30, y: 138, size: 22, color: C.green }));
      body += anim('up', 1.4, rich('O que ficou fora do recorte?', { x: 1080, y: 360, size: 56, font: 'display', w: 720 }).svg);
      body += anim('up', 2.0, rich('Um print mostra uma conversa. Não mostra a mensagem anterior nem a seguinte.', { x: 1080, y: 520, size: 34, fill: C.ink2, w: 700 }).svg);
      body += anim('up', 4.8, rich('Com o antes e o depois, {a|a mesma frase conta outra história}.', { x: 1080, y: 700, size: 38, weight: 700, w: 700 }).svg);
      return { body, source: 'Conversa fictícia, para exemplo' };
    }
  },
  {
    id: '1.2-05', aula: '1.2', title: 'Por que agora',
    cue: 'BLOCO 2 — “Dossiê aparece em setembro por um motivo. O calendário também é uma arma.”',
    render() {
      const h = heading('Por que agora?', { sub: 'Em ano eleitoral, a pergunta dois vale ouro.' });
      const tl = timeline([
        { at: 0.04, date: 'AGOSTO', t: 'Começa a campanha', color: C.ink2 },
        { at: 0.5, date: 'SETEMBRO', t: 'O dossiê aparece', sub: 'na sua caixa de entrada', color: C.red },
        { at: 0.96, date: 'OUTUBRO', t: 'Eleição', color: C.ink2 }
      ], { y: 600, d0: 0.8, step: 1.0, alt: false, labelW: 460 });
      let body = h.svg + tl.svg;
      body += anim('pop', 3.4, icon('mail', { x: X0 + 40 + 0.5 * (BW - 80) - 50, y: 680, s: 100, color: C.red, sw: 4 }));
      body += anim('up', 4.2, rich('{a|O calendário também é uma arma.}', { x: W / 2, y: 940, size: 46, font: 'display', anchor: 'middle', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '1.2-06', aula: '1.2', title: 'De denúncia a pauta',
    cue: '[TELA: coluna da esquerda com a denúncia; coluna da direita se preenchendo com as perguntas]',
    render() {
      let body = anim('up', 0.2, box({ x: X0, y: 180, w: 600, h: 520, fill: C.s1, stroke: C.red, sw: 3 }) + `<rect x="${X0}" y="180" width="600" height="72" fill="${C.red}"/>`
        + label('A denúncia', { x: X0 + 30, y: 228, size: 28, color: C.bg })
        + rich('“O secretário de educação está {h|roubando} na merenda.”', { x: X0 + 36, y: 330, size: 46, font: 'display', w: 530, lh: 1.15, hlColor: C.red, hlOpacity: 0.45, hlD: 1.2 }).svg);
      body += anim('up', 1.8, rich('“Roubando” é conclusão. E é conclusão de crime.', { x: X0 + 36, y: 640, size: 28, fill: C.red, w: 530, weight: 700 }).svg);
      body += anim('fade', 2.4, label('A pauta: perguntas verificáveis', { x: 800, y: 214, size: 24 }));
      const qs = [
        ['Quais empresas forneceram merenda para a secretaria entre 2023 e 2025?', 'portal de contratações'],
        ['Por qual modalidade foram contratadas?', 'Diário Oficial'],
        ['Quem são os sócios dessas empresas? Algum tem vínculo com o secretário?', 'cadastro de CNPJ'],
        ['Os preços pagos estão acima de contratos parecidos em outros municípios?', 'contratos de outros órgãos']
      ];
      const l = list(qs.map(([t, s]) => ({ t, sub: `{d|onde a resposta mora:} {a|${s}}` })), { x: 800, y: 260, w: 1000, size: 34, subSize: 26, gap: 30, d0: 2.8, step: 1.1 });
      body += l.svg;
      body += anim('up', 7.6, rich('Repare: nenhuma pergunta diz “roubar”. Se as respostas apontarem nessa direção, {a|os documentos vão dizer por você}.', { x: X0, y: 870, size: 34, w: BW, weight: 500 }).svg);
      return { body };
    }
  },
  {
    id: '1.2-07', aula: '1.2', title: 'Licitação, dispensa e inexigibilidade',
    cue: 'BLOCO 3 — as três formas de contratar, explicadas na pergunta sobre modalidade',
    render() {
      const h = heading('Três jeitos de contratar');
      const cols = columns([
        { head: 'Licitação', body: 'A disputa entre fornecedores. Quem oferece a melhor proposta leva.', icon: 'users', color: C.green },
        { head: 'Dispensa', body: 'A lei permite pular a disputa. Por valor baixo ou emergência, por exemplo.', icon: 'bolt', color: C.amber },
        { head: 'Inexigibilidade', body: 'A disputa é impossível, porque só um fornecedor pode entregar aquilo.', icon: 'key', color: C.blue }
      ], { y: 330, h: 520, size: 34, headSize: 44, step: 0.9 });
      return { body: h.svg + cols.svg };
    }
  },
  {
    id: '1.2-08', aula: '1.2', title: 'Confirmação independente',
    cue: 'BLOCO 4 — “Duas pessoas do mesmo grupo de WhatsApp dizendo a mesma coisa não são duas fontes.”',
    render() {
      const h = heading('Nada vai ao ar sem confirmação {a|independente}');
      let body = h.svg;
      body += anim('fade', 0.6, label('Não são duas fontes', { x: 470, y: 340, size: 24, color: C.red, anchor: 'middle' }));
      body += node({ x: 300, y: 470, t: 'Fonte A', d: 0.8, color: C.ink2, w: 240 });
      body += node({ x: 640, y: 470, t: 'Fonte B', d: 1.0, color: C.ink2, w: 240 });
      body += node({ x: 470, y: 720, t: 'o mesmo grupo de WhatsApp', d: 1.6, color: C.red, w: 420 });
      body += edge(300, 525, 440, 665, { d: 1.9, color: C.red });
      body += edge(640, 525, 500, 665, { d: 2.1, color: C.red });
      body += anim('up', 2.8, rich('{r|A mesma fonte, duas vezes.}', { x: 470, y: 870, size: 36, font: 'display', anchor: 'middle', w: 700 }).svg);
      body += anim('fade', 3.6, `<path d="M960 320 V930" stroke="${C.line}" stroke-width="2"/>`);
      body += anim('fade', 3.8, label('Independente = sem ligação com a primeira', { x: 1400, y: 340, size: 24, color: C.green, anchor: 'middle' }));
      const ind = ['Um documento público', 'Uma segunda fonte que não conversou com a primeira', 'Um dado oficial'];
      ind.forEach((t, i) => {
        const y = 400 + i * 150;
        body += anim('left', 4.2 + i * 0.6, box({ x: 1080, y, w: 680, h: 118, fill: C.s1, stroke: C.green, sw: 3 }) + rich(t, { x: 1180, y: y + 50 + (layout(t, { size: 32, w: 560, weight: 700 }).lines === 1 ? 20 : 0), size: 32, w: 560, weight: 700 }).svg);
        body += badge('ok', { x: 1106, y: y + 36, s: 46, d: 4.5 + i * 0.6 });
      });
      return { body };
    }
  },

  // ---------------------------------------------------------------- 1.3
  {
    id: '1.3-01', aula: '1.3', title: 'A frase que você tenta destruir',
    cue: 'ABERTURA e BLOCO 1 — hypo, “embaixo”, e thesis, “o que se coloca”',
    render() {
      let body = anim('up', 0.2, rich('HIPÓTESE', { x: X0, y: 330, size: 120, font: 'display', w: 1000 }).svg);
      body += anim('up', 0.7, rich('{a|hypo}, “embaixo” + {a|thesis}, “o que se coloca”', { x: X0, y: 410, size: 38, weight: 500, w: 1000 }).svg);
      body += anim('up', 1.3, rich('É o que você coloca embaixo da investigação para ela ficar de pé.', { x: X0, y: 510, size: 34, fill: C.ink2, w: 780 }).svg);
      // estrutura
      const bx = 1180; const bw = 520;
      body += anim('down', 1.8, box({ x: bx, y: 360, w: bw, h: 240, fill: C.s2, stroke: C.lineUi, sw: 3 }) + rich('INVESTIGAÇÃO', { x: bx + bw / 2, y: 500, size: 44, font: 'display', anchor: 'middle', w: bw }).svg);
      body += anim('up', 2.8, `<rect x="${bx + 60}" y="620" width="${bw - 120}" height="120" fill="${C.amber}"/>` + rich('HIPÓTESE', { x: bx + bw / 2, y: 698, size: 44, font: 'display', fill: C.bg, anchor: 'middle', w: bw }).svg);
      body += anim('fade', 3.2, `<path d="M${bx - 40} 760 H${bx + bw + 40}" stroke="${C.lineUi}" stroke-width="4"/>`);
      body += anim('up', 3.8, rich('Não é conclusão. É uma {a|aposta declarada}, que você vai testar.', { x: X0, y: 830, size: 44, font: 'display', w: BW }).svg);
      body += anim('up', 4.5, rich('Se ela sobreviver, você tem matéria. Se ela morrer, você economizou meses e, provavelmente, um processo.', { x: X0, y: 910, size: 30, fill: C.ink2, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '1.3-02', aula: '1.3', title: 'Para que serve a hipótese',
    cue: 'BLOCO 1 — dizer o que procurar, estimar o custo e dizer quando parar',
    render() {
      const h = heading('A hipótese serve para três coisas');
      const cols = columns([
        { num: '01', head: 'Dizer o que procurar', body: 'Cada pedaço da frase aponta para um documento.', icon: 'search' },
        { num: '02', head: 'Estimar o custo', body: 'Quanto a pauta vai custar em tempo e dinheiro.', icon: 'clock' },
        { num: '03', head: 'Dizer quando parar', body: '{h|Principalmente isso.} Hipótese derrubada também é resultado.', icon: 'stop', color: C.amber }
      ], { y: 330, h: 520, size: 34, headSize: 42, step: 1.0 });
      return { body: h.svg + cols.svg };
    }
  },
  {
    id: '1.3-03', aula: '1.3', title: 'O modelo de frase',
    cue: '[TELA: “[Agente] fez [ato] com [recurso público], gerando [benefício para alguém], e isso foi ocultado por [meio].”]',
    render() {
      const h = heading('O modelo de frase', { y: 190 });
      let body = h.svg;
      const tpl = '{a|[Agente]} fez {a|[ato]} com {a|[recurso público]}, gerando {a|[benefício para alguém]}, e isso foi ocultado por {a|[meio]}.';
      body += anim('up', 0.6, box({ x: X0, y: 250, w: BW, h: 190, fill: C.s1, stroke: C.amber, sw: 3 }) + rich(tpl, { x: X0 + 40, y: 322, size: 44, font: 'mono', weight: 700, w: BW - 80, lh: 1.35 }).svg);
      body += anim('fade', 1.8, label('Exemplo', { x: X0, y: 510, size: 24 }));
      body += anim('up', 2.0, rich('“A prefeitura de X contratou sem licitação uma empresa aberta seis meses antes, cujo sócio é assessor do vereador Y. O contrato foi publicado só como extrato, sem o processo.”', { x: X0, y: 568, size: 36, w: BW, weight: 500, lh: 1.3 }).svg);
      const map = [['Agente', 'a prefeitura'], ['Ato', 'contratar sem licitação'], ['Recurso', 'dinheiro do município'], ['Benefício', 'a empresa, e talvez o vereador'], ['Ocultação', 'publicação mínima']];
      const cw = (BW - 4 * 20) / 5;
      map.forEach(([k, v], i) => {
        const x = X0 + i * (cw + 20);
        body += anim('up', 3.4 + i * 0.45, `<rect x="${x}" y="760" width="${cw}" height="170" fill="${C.s2}"/><rect x="${x}" y="760" width="${cw}" height="8" fill="${C.amber}"/>`
          + rich(k, { x: x + 20, y: 814, size: 22, font: 'mono', weight: 700, fill: C.amber, upper: true, w: cw - 40 }).svg
          + rich(v, { x: x + 20, y: 862, size: 28, weight: 700, w: cw - 40, lh: 1.15 }).svg);
      });
      return { body };
    }
  },
  {
    id: '1.3-04', aula: '1.3', title: 'Hipótese não é comício',
    cue: 'BLOCO 2 — “Tem corrupção na prefeitura” não é hipótese. Não dá para testar, não dá para derrubar.',
    render() {
      const h = heading('Específica ou não serve');
      const c = compare(
        { head: 'Serve para comício', body: '{w|“Tem corrupção na prefeitura.”}\n\nNão dá para testar. Não dá para derrubar.', kind: 'no' },
        { head: 'Serve para investigação', body: '{w|“A prefeitura de X contratou sem licitação uma empresa aberta seis meses antes, cujo sócio é assessor do vereador Y.”}\n\nCada pedaço tem uma fonte. Dá para provar. Dá para derrubar.', kind: 'ok', delay: 1.6 },
        { y: 320, h: 580, size: 36 }
      );
      return { body: h.svg + c };
    }
  },
  {
    id: '1.3-05', aula: '1.3', title: 'A árvore de sub-hipóteses',
    cue: '[TELA: árvore com a hipótese no topo e cinco galhos, cada um com sua fonte]',
    render() {
      let body = anim('pop', 0.3, box({ x: 560, y: 170, w: 800, h: 150, fill: C.s1, stroke: C.amber, sw: 4 })
        + label('Hipótese', { x: 590, y: 212, size: 22 })
        + rich('Contrato sem licitação para empresa aberta seis meses antes, cujo sócio é assessor do vereador', { x: 960, y: 262, size: 28, weight: 700, anchor: 'middle', w: 740, lh: 1.2 }).svg);
      const br = [
        ['O contrato existe e foi feito sem licitação', 'portal de contratações e Diário Oficial'],
        ['A empresa foi aberta pouco antes', 'cadastro de CNPJ, data de abertura'],
        ['O sócio é assessor do vereador', 'ato de nomeação ou portal da câmara'],
        ['O preço está acima do mercado', 'contratos parecidos de outros órgãos'],
        ['Houve ocultação', 'o que foi publicado × o que deveria ter sido']
      ];
      const bw = 300; const gap = 45; const by = 520;
      br.forEach(([t, s], i) => {
        const x = X0 + i * (bw + gap); const cx = x + bw / 2;
        const d = 1.2 + i * 0.6;
        body += arrowPath(`M960 322 C960 420 ${cx} 420 ${cx} ${by - 6}`, { d, color: C.lineUi, t: 0.6 });
        let card = box({ x, y: by, w: bw, h: 300, fill: C.s1, stroke: C.lineUi, sw: 2 })
          + rich(String(i + 1).padStart(2, '0'), { x: x + 22, y: by + 44, size: 26, font: 'mono', weight: 700, fill: C.amber, w: 100 }).svg
          + rich(t, { x: x + 22, y: by + 96, size: 28, weight: 700, w: bw - 44, lh: 1.15 }).svg
          + rich(`{d|fonte:} ${s}`, { x: x + 22, y: by + 210, size: 22, font: 'mono', w: bw - 44, lh: 1.25, fill: C.ink2 }).svg;
        let g = anim('up', d + 0.4, card);
        if (i === 2) g = anim('drop', 6.0, anim('shake', 5.2, g), { t: 1.2 });
        body += g;
      });
      body += pill('HOMÔNIMO: alguém com o mesmo nome', { x: X0 + 2 * 345 + 150, y: 880, color: C.red, size: 24, anchor: 'middle', d: 6.4 }).svg;
      body += anim('up', 7.2, rich('Se um galho cai, {a|a hipótese muda}. Talvez vire outra história. Talvez nenhuma.', { x: W / 2, y: 960, size: 34, weight: 700, anchor: 'middle', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '1.3-06', aula: '1.3', title: 'O arquivo-mestre',
    cue: '[TELA: planilha-base do curso, abas “Linha do tempo” e “Log”]',
    render() {
      const h = heading('O arquivo-mestre', { sub: 'Cada fato registrado com fonte, data e link. No curso, é a planilha de cruzamento.' });
      let body = h.svg;
      body += pill('Linha do tempo', { x: X0, y: 380, size: 24, d: 0.8, fill: C.amber }).svg;
      body += table({
        y: 410, rowH: 58, headH: 50, size: 24, d0: 1.1, step: 0.35,
        cols: [{ h: 'Data', w: 190, mono: true }, { h: 'Fato', w: 760 }, { h: 'Documento', w: 460 }, { h: 'Fonte', w: 270, mono: true }],
        rows: [['10/03/2025', 'Empresa aberta, com o assessor como sócio', 'Cadastro CNPJ', 'L001'], ['20/08/2025', 'Contrato por dispensa, R$ 480 mil', 'Extrato do contrato', 'L003'], ['30/09/2025', 'Primeiro pagamento: R$ 120 mil', 'Ordem bancária', 'L004']]
      }).svg;
      body += pill('Log', { x: X0, y: 690, size: 24, d: 2.6, fill: C.amber }).svg;
      body += table({
        y: 720, rowH: 58, headH: 50, size: 24, d0: 2.9, step: 0.35,
        cols: [{ h: 'ID', w: 110, mono: true }, { h: 'Origem', w: 520 }, { h: 'Data e hora', w: 300, mono: true }, { h: 'Hash SHA-256', w: 750, mono: true }],
        rows: [['L001', 'Cadastro CNPJ (Receita)', '01/09/2026 10:12', 'aaa3e37c…9a7cb22d'], ['L003', 'PNCP', '02/09/2026 09:40', '7dfb629a…bfc3e48']]
      }).svg;
      return { body, source: 'Exemplo fictício, no formato da planilha de cruzamento do curso' };
    }
  },
  {
    id: '1.3-07', aula: '1.3', title: 'Contra a sua própria hipótese',
    cue: 'BLOCO 5 — viés de confirmação: procure primeiro o documento que derrubaria a frase',
    render() {
      const h = heading('Viés de confirmação', { sub: 'A tendência de enxergar só o que confirma o que você já acha.' });
      let body = h.svg;
      const docs = [[180, 420, 'confirma', C.green], [420, 470, 'confirma', C.green], [300, 640, 'confirma', C.green], [620, 600, 'derruba', C.red]];
      docs.forEach(([x, y, t, col], i) => {
        const wrap = (g) => (i < 3 ? anim('dim', 2.8, g, { style: '' }) : g);
        body += wrap(anim('pop', 0.8 + i * 0.25, box({ x, y, w: 200, h: 250, fill: C.paper, stroke: C.paper, sw: 0 })
          + [0.7, 0.9, 0.6, 0.8].map((k, j) => `<rect x="${x + 24}" y="${y + 40 + j * 30}" width="${152 * k}" height="10" fill="${C.pLine}"/>`).join('')
          + `<rect x="${x}" y="${y + 190}" width="200" height="60" fill="${col}"/>` + rich(t.toUpperCase(), { x: x + 100, y: y + 230, size: 22, font: 'mono', weight: 700, fill: C.bg, anchor: 'middle', w: 200 }).svg));
      });
      body += anim('right', 2.4, `<g><circle cx="760" cy="720" r="110" fill="${C.amber}" fill-opacity=".12" stroke="${C.amber}" stroke-width="8"/><path d="M838 800 L920 882" stroke="${C.amber}" stroke-width="16" stroke-linecap="round"/></g>`);
      body += anim('up', 3.2, rich('Que documento, se existisse, provaria que você está errado?', { x: 1040, y: 470, size: 40, font: 'display', w: 760, lh: 1.12 }).svg);
      body += anim('up', 3.9, rich('{a|Vá atrás dele primeiro.}', { x: 1040, y: 620, size: 48, font: 'display', w: 760 }).svg);
      body += anim('up', 4.8, rich('Não encontrou: a hipótese ficou mais forte.', { x: 1040, y: 740, size: 32, w: 760, weight: 500 }).svg);
      body += anim('up', 5.3, rich('Encontrou: você ganhou uma pauta melhor. Ou uma noite de sono.', { x: 1040, y: 800, size: 32, w: 760, weight: 500, fill: C.ink2 }).svg);
      return { body };
    }
  },

  // ---------------------------------------------------------------- 1.4
  {
    id: '1.4-01', aula: '1.4', title: 'A ética te defende',
    cue: 'ABERTURA e BLOCO 1 — êthos: costume, caráter. “A ética é o que te defende quando o processo chega.”',
    render() {
      let body = anim('pop', 0.3, icon('shield', { x: 1260, y: 250, s: 440, color: C.amber, sw: 5 }));
      body += anim('fade', 0.9, rich('ÉTICA', { x: 1480, y: 520, size: 64, font: 'display', anchor: 'middle', w: 400 }).svg);
      body += anim('up', 0.3, rich('A ética não é o que te impede de publicar.', { x: X0, y: 330, size: 52, font: 'display', w: 1000, lh: 1.1 }).svg);
      body += anim('up', 1.2, rich('{a|É o que te defende quando o processo chega.}', { x: X0, y: 480, size: 52, font: 'display', w: 1000, lh: 1.1 }).svg);
      body += anim('up', 2.2, rich('Do grego {a|êthos}: costume, caráter. É o jeito de fazer que vira regra.', { x: X0, y: 700, size: 36, w: 1000, weight: 500 }).svg);
      body += anim('up', 2.9, rich('No processo, a pergunta do juiz vai ser simples: você agiu com cuidado? E cuidado, no jornalismo, tem lista escrita.', { x: X0, y: 790, size: 32, w: 1000, fill: C.ink2 }).svg);
      return { body };
    }
  },
  {
    id: '1.4-02', aula: '1.4', title: 'Os quatro pontos do código',
    cue: 'BLOCO 2 — arts. 4º, 12 (I e II), 11 (III) e 5º do Código de Ética dos Jornalistas Brasileiros',
    render() {
      const h = heading('Quatro pontos do código');
      const cols = columns([
        { num: '4º', head: 'Verdade', body: 'Compromisso com a verdade no relato dos fatos. Precisa apuração e correta divulgação.' },
        { num: '12', head: 'Outro lado e provas', body: 'Inciso I: ouvir, antes da divulgação, os envolvidos. Inciso II: buscar provas que fundamentem a informação.' },
        { num: '11', head: 'Métodos', body: 'Inciso III: não divulgar o que foi obtido com identidade falsa, câmera escondida ou microfone oculto. Com exceção.' },
        { num: '5º', head: 'Sigilo da fonte', body: 'É direito do jornalista. Também está na Constituição. Aula 2.2.' }
      ], { y: 310, h: 590, size: 29, headSize: 36, step: 0.8, gap: 28 });
      return { body: h.svg + cols.svg, source: 'Código de Ética dos Jornalistas Brasileiros, FENAJ, versão de 2007' };
    }
  },
  {
    id: '1.4-03', aula: '1.4', title: 'A exceção tem duas condições',
    cue: 'BLOCO 2 — art. 11, III: interesse público incontestável E todas as outras vias esgotadas',
    render() {
      const h = heading('Câmera escondida: proibido, com exceção', { sub: 'Art. 11, III. As duas condições valem juntas. Não uma ou outra.' });
      let body = h.svg;
      const c1 = [X0 + 60, 420]; const c2 = [X0 + 60, 640];
      const cond = (x, y, t, d, lit) => anim('left', d, box({ x, y, w: 620, h: 150, fill: C.s1, stroke: lit, sw: 4 }) + rich(t, { x: x + 36, y: y + 64, size: 32, weight: 700, w: 560, lh: 1.15 }).svg);
      body += cond(c1[0], c1[1], 'Interesse público incontestável', 0.8, C.green);
      body += cond(c2[0], c2[1], 'Todas as outras possibilidades de apuração esgotadas', 1.1, C.green);
      // porta E
      const gx = 980; const gy = 520;
      body += anim('pop', 1.6, `<path d="M${gx} ${gy} H${gx + 90} A110 110 0 0 1 ${gx + 90} ${gy + 220} H${gx} Z" fill="${C.s2}" stroke="${C.ink2}" stroke-width="4"/>` + rich('E', { x: gx + 95, y: gy + 138, size: 72, font: 'display', anchor: 'middle', w: 200 }).svg);
      body += arrowH(c1[0] + 640, c1[1] + 75, gx - 6, { d: 2.0 });
      body += arrowH(c2[0] + 640, c2[1] + 75, gx - 6, { d: 2.2 });
      body += arrowH(gx + 214, gy + 110, 1400, { d: 2.8 });
      // estado 1: só uma condição
      body += anim('gone', 4.2, anim('fade', 2.6, `<rect x="${c2[0] - 6}" y="${c2[1] - 6}" width="632" height="162" fill="${C.bg}" opacity=".78"/>`), { t: 0.5 });
      body += anim('gone', 4.2, anim('pop', 3.0, `<rect x="1420" y="${gy + 40}" width="380" height="140" fill="${C.red}"/>` + rich('PROIBIDO', { x: 1610, y: gy + 128, size: 50, font: 'display', fill: C.bg, anchor: 'middle', w: 380 }).svg), { t: 0.4 });
      body += anim('pop', 4.8, `<rect x="1420" y="${gy + 40}" width="380" height="140" fill="${C.green}"/>` + rich('EXCEÇÃO', { x: 1610, y: gy + 128, size: 50, font: 'display', fill: C.bg, anchor: 'middle', w: 380 }).svg);
      body += anim('up', 5.4, rich('Só as duas juntas abrem a exceção.', { x: 1610, y: gy + 250, size: 28, anchor: 'middle', fill: C.ink2, w: 400 }).svg);
      return { body, source: 'Código de Ética dos Jornalistas Brasileiros, art. 11, III' };
    }
  },
  {
    id: '1.4-04', aula: '1.4', title: 'Interesse público não é interesse do público',
    cue: '[TELA: duas colunas — “interesse público” / “curiosidade”]',
    render() {
      const h = heading('Interesse público {a|não é} interesse do público');
      const t = table({
        y: 330, rowH: 124, headH: 62, size: 32, d0: 0.9, step: 1.1,
        cols: [{ h: 'O fato', w: 1060 }, { h: 'É assunto público?', w: 620, bold: true }],
        rows: [
          ['Os gastos do cartão corporativo de um presidente', '{g|Interesse público}'],
          ['A doença de um parente dele', '{r|Em regra, não}'],
          ['O caso extraconjugal de um prefeito', '{r|Em regra, não}'],
          ['O mesmo caso, se envolver dinheiro público, nomeação ou uso do cargo', '{a|Vira pauta. E a pauta é o dinheiro.}']
        ]
      });
      let body = h.svg + t.svg;
      body += anim('up', 5.8, rich('Interesse público é o que afeta a coletividade: dinheiro público, uso do cargo, decisões que mexem com a vida de muita gente.', { x: X0, y: 930, size: 28, fill: C.ink2, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '1.4-05', aula: '1.4', title: 'Conflito de interesse e publi',
    cue: 'BLOCO 4 — duas regras práticas para quem é criador de conteúdo',
    render() {
      const h = heading('Duas regras para quem é criador');
      const cols = columns([
        { num: '01', head: 'Conflito de interesse', body: 'Ligação com o investigado ou com o adversário dele? {a|Declare ou passe a pauta adiante.} Em ano de eleição, vale em dobro.', icon: 'link', foot: 'Investigação que parece encomenda perde valor, mesmo verdadeira.' },
        { num: '02', head: 'Publicidade', body: 'Art. 12, IV: informe claramente quando o conteúdo tem caráter publicitário. {a|Publi, patrocínio, parceria.}', icon: 'money', foot: 'Publi sem aviso: o jeito mais rápido de perder credibilidade.' }
      ], { y: 330, h: 560, size: 34, headSize: 42, step: 1.2 });
      return { body: h.svg + cols.svg };
    }
  },
  {
    id: '1.4-06', aula: '1.4', title: 'Quem não pode ser exposto',
    cue: 'BLOCO 5 — ECA, art. 143: nem nome, nem foto, nem apelido, nem iniciais',
    render() {
      let body = anim('up', 0.2, box({ x: X0 + 40, y: 200, w: 640, h: 700, fill: C.paper, stroke: C.paper, sw: 0, shadow: C.amber, sh: 14 }));
      body += anim('fade', 0.5, label('ECA, art. 143', { x: X0 + 90, y: 262, size: 24, color: C.pAccent }));
      body += anim('fade', 0.6, `<rect x="${X0 + 90}" y="300" width="220" height="260" fill="#D9D2C3"/><circle cx="${X0 + 200}" cy="400" r="58" fill="#BDB4A2"/><path d="M${X0 + 110} 560 C${X0 + 120} 470 ${X0 + 280} 470 ${X0 + 290} 560 Z" fill="#BDB4A2"/>`);
      const fields = [['Nome', 360], ['Apelido', 460], ['Iniciais', 560]];
      fields.forEach(([k, y]) => {
        body += anim('fade', 0.8, rich(k.toUpperCase(), { x: X0 + 350, y: y - 20, size: 20, font: 'mono', weight: 700, fill: C.pInk2, w: 300 }).svg + `<rect x="${X0 + 350}" y="${y}" width="280" height="14" fill="${C.pLine}"/>`);
      });
      body += redact({ x: X0 + 90, y: 300, w: 220, h: 260, d: 1.8 });
      [['Nome', 360], ['Apelido', 460], ['Iniciais', 560]].forEach(([, y], i) => { body += redact({ x: X0 + 346, y: y - 6, w: 290, h: 30, d: 2.2 + i * 0.4 }); });
      body += anim('up', 3.4, rich('nem nome, nem foto,\nnem apelido, nem iniciais', { x: X0 + 90, y: 680, size: 36, font: 'display', fill: C.pInk, w: 560, lh: 1.15 }).svg);
      body += anim('up', 0.6, rich('Adolescente a quem se atribua ato infracional', { x: 900, y: 290, size: 40, font: 'display', w: 880, lh: 1.1 }).svg);
      body += anim('up', 1.1, rich('A notícia não pode identificá-lo. É uma linha que não se cruza.', { x: 900, y: 420, size: 32, fill: C.ink2, w: 860 }).svg);
      body += anim('fade', 4.2, label('Para todo o resto, a mesma pergunta', { x: 900, y: 560, size: 24 }));
      body += anim('up', 4.6, rich('Vítima, pessoa vulnerável, terceiro sem relevância pública: {a|expor essa pessoa é necessário para o interesse público da matéria?}', { x: 900, y: 630, size: 36, w: 860, weight: 700, lh: 1.25 }).svg);
      body += anim('up', 5.6, rich('Se não é, não exponha.', { x: 900, y: 880, size: 44, font: 'display', w: 860 }).svg);
      return { body, source: 'Estatuto da Criança e do Adolescente, art. 143' };
    }
  }
];
