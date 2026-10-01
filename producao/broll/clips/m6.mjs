// Módulo 6 — Risco jurídico
import {
  C, W, H, X0, X1, BW, anim, rich, layout, heading, statement, list, columns, compare, flow, timeline, paperCard,
  stamp, table, box, icon, badge, arrowH, arrowV, arrowPath, edge, node, pill, redact, checklist, docSheet, bars, hbars, calendar, label
} from '../kit.mjs';

const SRC = 'Conteúdo educativo. Não substitui advogado no caso concreto. Regras válidas em setembro de 2026.';
const dow = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();

export default [
  // ---------------------------------------------------------------- 6.1
  {
    id: '6.1-01', aula: '6.1', title: 'Pena em triplo nas redes',
    cue: 'ABERTURA — “Nas redes sociais, a pena de crime contra a honra é aplicada em triplo.”',
    render() {
      let body = anim('pop', 0.3, rich('×3', { x: 1460, y: 640, size: 380, font: 'display', fill: C.red, anchor: 'middle', w: 900 }).svg);
      body += anim('up', 0.4, rich('Nas redes sociais, a pena de crime contra a honra é aplicada {r|em triplo}.', { x: X0, y: 300, size: 56, font: 'display', w: 960, lh: 1.08 }).svg);
      body += anim('up', 1.6, rich('Não é projeto de lei. {a|Está em vigor desde 2021.}', { x: X0, y: 620, size: 38, weight: 700, w: 900 }).svg);
      body += anim('up', 2.4, rich('E quem publica vídeo sobre político publica nas redes sociais.', { x: X0, y: 760, size: 34, fill: C.ink2, w: 860 }).svg);
      return { body, source: 'Código Penal, art. 141, §2º · ' + SRC };
    }
  },
  {
    id: '6.1-02', aula: '6.1', title: 'Calúnia, difamação e injúria',
    cue: '[TELA: quadro comparativo — crime / o que é / exemplo / admite prova da verdade?]',
    render() {
      const h = heading('Os três crimes contra a honra', { y: 180 });
      const t = table({
        y: 230, rowH: 200, headH: 60, size: 24, d0: 0.8, step: 1.4,
        cols: [{ h: 'Crime', w: 230, bold: true }, { h: 'O que é', w: 360 }, { h: 'Exemplo', w: 470 }, { h: 'Pena', w: 300 }, { h: 'Prova da verdade?', w: 320 }],
        rows: [
          ['{a|Calúnia}\nart. 138', 'Imputar falsamente fato definido como crime', '“O prefeito recebeu R$ 50 mil da empreiteira X para direcionar a licitação”, se falso', 'Detenção de 6 meses a 2 anos, e multa', '{g|Sim}, com exceções (§3º)'],
          ['{a|Difamação}\nart. 139', 'Imputar fato ofensivo à reputação. Não precisa ser crime.', '“O secretário chega bêbado ao expediente toda segunda-feira”', 'Detenção de 3 meses a 1 ano, e multa', '{a|Só} se o ofendido é funcionário público e a ofensa é sobre a função'],
          ['{a|Injúria}\nart. 140', 'Ofender a dignidade ou o decoro. Não há fato: há rótulo.', '“Ladrão”, “canalha”, “vagabundo”', 'Detenção de 1 a 6 meses, ou multa', '{r|Não}. Xingamento não se prova.']
        ]
      });
      return { body: h.svg + t.svg, source: 'Código Penal, arts. 138 a 140 · ' + SRC };
    }
  },
  {
    id: '6.1-03', aula: '6.1', title: 'Calúnia, os três elementos',
    cue: 'BLOCO 1 — um fato determinado, que é crime, e que é falso; repostar também conta',
    render() {
      const h = heading('Calúnia: três elementos juntos', { sub: 'Do latim calumnia: acusação falsa.' });
      let body = h.svg;
      const els = ['Um fato determinado', 'que é crime', 'e que é falso'];
      els.forEach((t, i) => {
        const x = X0 + i * 420;
        const L = layout(t, { size: 34, font: 'display', w: 340 });
        const ty = 395 + 34 * 0.36 - (L.lines.length - 1) * L.lh / 2;
        body += anim('pop', 0.8 + i * 0.6, `<rect x="${x}" y="330" width="380" height="130" fill="${C.s1}" stroke="${C.red}" stroke-width="4"/>` + rich(t, { x: x + 190, y: ty, size: 34, font: 'display', anchor: 'middle', w: 340 }).svg);
        if (i < 2) body += anim('fade', 1.0 + i * 0.6, rich('+', { x: x + 400, y: 412, size: 48, font: 'display', fill: C.ink2, anchor: 'middle', w: 60 }).svg);
      });
      body += anim('fade', 2.6, rich('=', { x: X0 + 1260, y: 412, size: 56, font: 'display', fill: C.ink2, anchor: 'middle', w: 60 }).svg);
      body += anim('stamp', 3.0, `<g><rect x="${X0 + 1300}" y="330" width="380" height="130" fill="${C.red}"/>` + rich('CALÚNIA', { x: X0 + 1490, y: 418, size: 52, font: 'display', fill: C.bg, anchor: 'middle', w: 380 }).svg + '</g>');
      body += anim('up', 3.8, paperCard({ x: X0, y: 540, w: BW, text: '“O prefeito recebeu R$ 50 mil da empreiteira X para direcionar a licitação.” {d|Imputa corrupção. Se for falso, é calúnia.}', size: 36, d: 0 }).svg);
      body += anim('up', 5.0, rich('§1º: quem propala ou divulga a calúnia, sabendo que é falsa, responde igual. {a|Repostar também conta.}', { x: X0, y: 960, size: 32, weight: 700, w: BW }).svg);
      return { body, source: 'Código Penal, art. 138 · ' + SRC };
    }
  },
  {
    id: '6.1-04', aula: '6.1', title: 'A exceção da verdade',
    cue: 'BLOCO 2 — “o que eu falei é verdade, e eu provo”',
    render() {
      const h = heading('A exceção da verdade', { sub: 'A defesa que diz: o que eu falei é verdade, e eu provo.' });
      let body = h.svg;
      const rows = [
        ['Calúnia', 'ok', 'Admitida, com exceções. Se o ofendido foi absolvido daquele crime por sentença definitiva, não adianta tentar provar.', 'art. 138, §3º'],
        ['Difamação', 'q', 'Só se o ofendido é funcionário público e a ofensa tem a ver com o exercício da função.', 'art. 139, parágrafo único'],
        ['Injúria', 'no', 'Não há. Xingamento não se prova.', 'art. 140']
      ];
      rows.forEach(([t, k, s, art], i) => {
        const y = 380 + i * 150; const d = 0.8 + i * 0.9;
        body += badge(k, { x: X0, y: y + 10, s: 64, d });
        body += anim('left', d, rich(t, { x: X0 + 100, y: y + 58, size: 44, font: 'display', w: 400 }).svg + rich(s, { x: X0 + 520, y: y + 40, size: 30, weight: 500, w: 1160 }).svg + rich(art, { x: X0 + 520, y: y + 110, size: 22, font: 'mono', fill: C.ink3, w: 600 }).svg);
      });
      body += anim('up', 4.0, rich('Agente público, sobre o exercício do cargo: {a|a verdade é defesa}. Vida privada: em regra, não é.', { x: X0, y: 900, size: 36, font: 'display', w: BW, lh: 1.12 }).svg);
      return { body, source: 'Código Penal · ' + SRC };
    }
  },
  {
    id: '6.1-05', aula: '6.1', title: 'Os aumentos de pena',
    cue: '[TELA: art. 141 do Código Penal]',
    render() {
      const h = heading('Art. 141: os aumentos de pena');
      let body = h.svg;
      body += hbars([
        { name: '+ 1/3', v: 1.33, label: 'contra funcionário público, em razão das funções; ou por meio que facilite a divulgação', color: C.amber },
        { name: '× 2', v: 2, label: 'mediante paga ou promessa de recompensa · §1º', color: C.amber },
        { name: '× 3', v: 3, label: 'cometido ou divulgado em redes sociais · §2º', color: C.red },
        { name: '× 2', v: 2, label: 'contra a mulher, por razões da condição do sexo feminino · §3º, de 2024', color: C.amber }
      ], { x: X0 + 220, y: 320, w: 480, rowH: 140, labelW: 200, labelSize: 44, valueSize: 26, d0: 0.8, step: 0.8 }).svg;
      body += anim('up', 4.4, rich('O §2º veio do pacote anticrime, em 2019. Foi vetado e teve o veto derrubado em 2021. Parte da doutrina critica. {a|Mas critica em vigor.}', { x: X0, y: 930, size: 28, weight: 500, w: BW }).svg);
      return { body, source: 'Código Penal, art. 141 · ' + SRC };
    }
  },
  {
    id: '6.1-06', aula: '6.1', title: 'O que não é crime contra a honra',
    cue: 'BLOCO 4 — art. 142 e a intenção de ofender; conte com os documentos',
    render() {
      const h = heading('O que não é injúria ou difamação punível', { size: 56 });
      const c = columns([
        { num: '142', head: 'Crítica', body: 'A opinião desfavorável da crítica literária, artística ou científica. Salvo quando inequívoca a intenção de ofender.', icon: 'pen', color: C.green },
        { num: '142', head: 'Conceito de funcionário', body: 'O conceito desfavorável emitido por funcionário público no cumprimento do dever do ofício.', icon: 'building', color: C.green },
        { head: 'Intenção de ofender', body: 'Entendimento antigo dos tribunais: sem ela, não há crime. Narrar fatos de interesse público com base em documentos, e criticar, é diferente de ofender.', icon: 'scale', color: C.blue }
      ], { y: 300, h: 460, size: 30, headSize: 36, step: 0.9 });
      let body = h.svg + c.svg;
      body += anim('up', 3.6, rich('Mas isso se discute dentro do processo. {a|Não conte com isso como escudo. Conte com os documentos.}', { x: X0, y: 880, size: 36, font: 'display', w: BW, lh: 1.12 }).svg);
      return { body, source: 'Código Penal, art. 142 · ' + SRC };
    }
  },
  {
    id: '6.1-07', aula: '6.1', title: 'Retratação, prazo e quem processa',
    cue: 'BLOCO 5 — arts. 143, 145 e 103; Súmula 714 do STF',
    render() {
      const h = heading('Retratação e procedimento');
      const c = columns([
        { num: '143', head: 'Retratação', body: 'Quem se retrata cabalmente da calúnia ou da difamação antes da sentença fica isento de pena. Desde 2015, pelos mesmos meios: {a|vídeo ofende, vídeo se retrata}.', icon: 'video' },
        { num: '145', head: 'Ação privada', body: 'Em regra, quem processa é o próprio ofendido, por queixa-crime. {a|Tem 6 meses} desde que soube quem é o autor (art. 103).', icon: 'clock' },
        { num: 'STF', head: 'Súmula 714', body: 'Servidor público ofendido em razão da função: pode apresentar queixa ou representar ao Ministério Público.', icon: 'gavel' }
      ], { y: 300, h: 560, size: 30, headSize: 38, step: 1.0 });
      return { body: h.svg + c.svg, source: 'Código Penal, arts. 103, 143 e 145 · ' + SRC };
    }
  },
  {
    id: '6.1-08', aula: '6.1', title: 'As quatro perguntas para cada frase',
    cue: '[TELA: as quatro perguntas]',
    render() {
      const h = heading('O teste de cada frase', { sub: 'Vale para roteiro, título, thumbnail e descrição.' });
      let body = h.svg;
      const qs = [['Estou imputando um fato?', 'sim'], ['Esse fato é crime?', 'sim'], ['Tenho documento que prove?', 'não']];
      qs.forEach(([q, a], i) => {
        const y = 370 + i * 130; const d = 0.8 + i * 0.9;
        body += anim('left', d, `<rect x="${X0}" y="${y}" width="900" height="100" fill="${C.s1}" stroke="${C.lineUi}" stroke-width="2"/>` + rich(String(i + 1), { x: X0 + 40, y: y + 66, size: 40, font: 'display', fill: C.amber, w: 60 }).svg + rich(q, { x: X0 + 100, y: y + 64, size: 36, weight: 700, w: 760 }).svg);
        body += anim('pop', d + 0.5, `<rect x="${X0 + 920}" y="${y}" width="140" height="100" fill="${a === 'sim' ? C.ink2 : C.red}"/>` + rich(a.toUpperCase(), { x: X0 + 990, y: y + 66, size: 36, font: 'display', fill: C.bg, anchor: 'middle', w: 140 }).svg);
      });
      body += arrowPath(`M${X0 + 1080} 500 C1300 500 1300 500 1380 500`, { d: 3.6, color: C.red, end: [1380, 500, 0] });
      body += stamp('A FRASE SAI', { x: 1600, y: 500, color: C.red, size: 48, d: 4.0 });
      const y4 = 370 + 3 * 130 + 30;
      body += anim('left', 4.6, `<rect x="${X0}" y="${y4}" width="900" height="100" fill="${C.s1}" stroke="${C.lineUi}" stroke-width="2"/>` + rich('4', { x: X0 + 40, y: y4 + 66, size: 40, font: 'display', fill: C.amber, w: 60 }).svg + rich('A palavra só serve para ofender?', { x: X0 + 100, y: y4 + 64, size: 36, weight: 700, w: 760 }).svg);
      body += anim('pop', 5.1, `<rect x="${X0 + 920}" y="${y4}" width="140" height="100" fill="${C.red}"/>` + rich('SIM', { x: X0 + 990, y: y4 + 66, size: 36, font: 'display', fill: C.bg, anchor: 'middle', w: 140 }).svg);
      body += stamp('A PALAVRA SAI', { x: 1600, y: y4 + 50, color: C.red, size: 48, d: 5.6 });
      return { body, source: SRC };
    }
  },

  // ---------------------------------------------------------------- 6.2
  {
    id: '6.2-01', aula: '6.2', title: 'Só com dolo ou culpa grave',
    cue: 'ABERTURA — “Pelo Supremo, jornalista só paga indenização por reportagem se agiu com dolo ou culpa grave.”',
    render() {
      const s = statement('Jornalista só paga indenização por reportagem se agiu com {a|dolo} ou {a|culpa grave}.', { y: 330, size: 64, d: 0.3 });
      let body = s.svg;
      body += anim('up', 1.8, box({ x: X0 + 160, y: 600, w: BW - 320, h: 150, fill: C.s1, stroke: C.amber, sw: 3 }) + label('Culpa grave', { x: X0 + 200, y: 648, size: 24 })
        + rich('Evidente negligência profissional na apuração.', { x: X0 + 200, y: 712, size: 44, font: 'display', w: BW - 400 }).svg);
      body += anim('up', 3.0, rich('Quem apura direito tem uma proteção que quem não apura não tem.', { x: W / 2, y: 880, size: 38, weight: 700, anchor: 'middle', w: BW }).svg);
      return { body, source: 'STF, ADIs 6792 e 7055 · ' + SRC };
    }
  },
  {
    id: '6.2-02', aula: '6.2', title: 'Súmula 221 do STJ',
    cue: '[TELA: Súmula 221 do STJ] — autor e veículo respondem',
    render() {
      const p = paperCard({ y: 180, ref: 'STJ · Súmula 221', text: '“São civilmente responsáveis pelo ressarcimento de dano, decorrente de publicação pela imprensa, tanto {h|o autor do escrito} quanto {h|o proprietário do veículo de divulgação}.”', size: 42, d: 0.3, hlD: 1.4 });
      let body = p.svg;
      body += anim('up', 3.0, rich('Canal próprio?', { x: X0, y: p.bottom + 110, size: 36, weight: 700, w: 700 }).svg + rich('Você é o autor {a|e} o veículo. As duas contas chegam para a mesma pessoa.', { x: X0, y: p.bottom + 180, size: 44, font: 'display', w: BW, lh: 1.1 }).svg);
      body += anim('fade', 4.0, rich('A base: Código Civil, arts. 186 e 927. Quem causa dano por ato ilícito tem de reparar, inclusive dano moral.', { x: X0, y: 980, size: 24, font: 'mono', fill: C.ink3, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '6.2-03', aula: '6.2', title: 'Não existe mais Lei de Imprensa',
    cue: 'BLOCO 1 — ADPF 130, de 2009: a Lei de Imprensa de 1967 não foi recepcionada',
    render() {
      let body = docSheet({ x: X0 + 60, y: 220, w: 600, h: 700, head: true, title: 'Lei de Imprensa · 1967', lines: [0.9, 0.8, 0.95, 0.7, 0.85, 0.9, 0.6, 0.8], d: 0.3, tilt: -2 });
      body += stamp('NÃO RECEPCIONADA', { x: X0 + 360, y: 600, color: C.red, size: 42, d: 1.4 });
      body += anim('up', 0.6, rich('Não existe mais lei especial de imprensa.', { x: 900, y: 320, size: 50, font: 'display', w: 900, lh: 1.08 }).svg);
      body += anim('up', 2.0, rich('Em 2009, na {a|ADPF 130}, o Supremo declarou que a Lei de Imprensa de 1967 não foi recepcionada pela Constituição.', { x: 900, y: 500, size: 32, weight: 500, w: 880 }).svg);
      body += anim('fade', 3.0, label('Valem', { x: 900, y: 690, size: 24, color: C.green }));
      let px = 900;
      ['as regras gerais', 'a Constituição', 'a lei do direito de resposta'].forEach((t, i) => { const pl = pill(t, { x: px, y: 750 + i * 70, size: 28, color: C.green, d: 3.2 + i * 0.3 }); body += pl.svg; });
      return { body, source: SRC };
    }
  },
  {
    id: '6.2-04', aula: '6.2', title: 'As três teses contra o assédio judicial',
    cue: '[TELA: as três teses] — ADIs 6792 e 7055, julgadas em maio de 2024, acórdão em abril de 2025',
    render() {
      const h = heading('As três teses', { sub: 'STF, ADIs 6792 e 7055: julgamento em maio de 2024, acórdão em abril de 2025.' });
      const l = list([
        { t: 'É assédio judicial', sub: 'Ajuizar inúmeras ações sobre os mesmos fatos, em comarcas diferentes, com o intuito ou o efeito de constranger o jornalista, dificultar a defesa ou torná-la excessivamente cara.' },
        { t: 'As ações podem ser reunidas', sub: 'No foro do domicílio do jornalista.' },
        { t: 'Só dolo ou culpa grave', sub: 'A responsabilidade civil do jornalista ou do veículo só existe em caso inequívoco de dolo ou culpa grave. {a|Culpa grave é evidente negligência profissional na apuração dos fatos.}' }
      ], { y: 400, size: 42, subSize: 30, gap: 40, step: 1.4 });
      return { body: h.svg + l.svg, source: SRC };
    }
  },
  {
    id: '6.2-05', aula: '6.2', title: 'Reunir as ações no domicílio',
    cue: 'BLOCO 2 — segunda tese: o jornalista pode pedir que todas as ações sejam reunidas no foro do seu domicílio',
    render() {
      const h = heading('Muitas comarcas, uma defesa');
      let body = h.svg;
      const cx = 1420; const cy = 600;
      const pts = [[240, 360], [430, 300], [620, 420], [300, 560], [520, 620], [720, 560], [260, 780], [480, 820], [700, 760], [860, 380]];
      pts.forEach(([x, y], i) => {
        body += anim('pop', 0.5 + i * 0.12, `<rect x="${x - 34}" y="${y - 34}" width="68" height="68" fill="${C.s3}" stroke="${C.red}" stroke-width="3"/>` + icon('gavel', { x: x - 20, y: y - 20, s: 40, color: C.red, sw: 3 }));
        body += arrowPath(`M${x + 40} ${y} C${(x + cx) / 2} ${y} ${(x + cx) / 2} ${cy} ${cx - 180} ${cy}`, { d: 2.4 + i * 0.08, color: C.ink3, t: 0.6, sw: 3 });
      });
      body += anim('pop', 3.4, box({ x: cx - 170, y: cy - 150, w: 520, h: 300, fill: C.s1, stroke: C.green, sw: 4 }) + icon('house', { x: cx - 130, y: cy - 110, s: 90, color: C.green, sw: 4 })
        + rich('Foro do domicílio do jornalista', { x: cx - 130, y: cy + 50, size: 34, font: 'display', w: 450, lh: 1.08 }).svg);
      body += anim('up', 4.2, rich('Inúmeras ações sobre os mesmos fatos, em comarcas diferentes: o STF chamou de {a|assédio judicial}.', { x: X0, y: 960, size: 30, weight: 700, w: BW }).svg);
      return { body, source: 'STF, ADIs 6792 e 7055 · ' + SRC };
    }
  },
  {
    id: '6.2-06', aula: '6.2', title: 'A terceira tese é um manual',
    cue: 'BLOCO 2 — “Ela diz o que você precisa mostrar a um juiz: que apurou.”',
    render() {
      const h = heading('Leia a terceira tese como um manual', { sub: 'O juiz vai perguntar uma coisa: você apurou?' });
      let body = h.svg;
      const items = [['doc', 'Documentos', 'com hash e link no Log (módulos 2 e 4)'], ['mail', 'Pedido de posicionamento', 'com data e prazo (aula 6.4)'], ['check', 'Checagem', 'roteiro numerado, fonte na margem (aula 5.4)']];
      items.forEach(([ic, t, s], i) => {
        const x = X0 + i * 570; const d = 0.8 + i * 0.7;
        body += anim('up', d, box({ x, y: 400, w: 540, h: 360, fill: C.s1, stroke: C.green, sw: 3 }) + icon(ic, { x: x + 36, y: 440, s: 80, color: C.green, sw: 4 }) + rich(t, { x: x + 36, y: 600, size: 40, font: 'display', w: 470, lh: 1.08 }).svg + rich(s, { x: x + 36, y: 700, size: 26, fill: C.ink2, w: 470 }).svg);
      });
      body += anim('up', 3.2, rich('Tudo o que você fez nos módulos anteriores {a|vira prova de que não houve negligência}.', { x: X0, y: 880, size: 38, font: 'display', w: BW, lh: 1.12 }).svg);
      return { body, source: SRC };
    }
  },
  {
    id: '6.2-07', aula: '6.2', title: 'Tema 995 e a entrevista',
    cue: '[TELA: resumo da tese revisada] — o veículo só responde se houver má-fé',
    render() {
      const h = heading('Tema 995: quando o entrevistado acusa', { sub: 'Tese de 2023, revisada em embargos.' });
      const c = columns([
        { head: 'Má-fé', body: '{a|Dolo}: sabia que a acusação era falsa. Ou {a|culpa grave}: divulgou sem ouvir o ofendido ou sem buscar o contraditório.', icon: 'warn', color: C.red },
        { head: 'Ao vivo', body: 'O veículo não responde pelo que o convidado disse por conta própria. Mas deve garantir o direito de resposta.', icon: 'video', color: C.amber },
        { head: 'Falsidade constatada', body: 'O conteúdo deve ser removido.', icon: 'x', color: C.blue }
      ], { y: 400, h: 340, size: 30, headSize: 36, step: 0.9 });
      let body = h.svg + c.svg;
      body += anim('up', 3.6, box({ x: X0, y: 800, w: BW, h: 160, fill: C.s2, stroke: C.amber, sw: 2 }) + label('Lives, podcasts e cortes', { x: X0 + 30, y: 846, size: 22 })
        + rich('O convidado acusou alguém? Peça as provas. Dê espaço ao outro lado. Se a acusação for falsa, tire o trecho do ar. {a|Principalmente dos cortes, que circulam sozinhos.}', { x: X0 + 30, y: 900, size: 28, weight: 500, w: BW - 60 }).svg);
      return { body, source: 'STF, Tema 995 · ' + SRC };
    }
  },
  {
    id: '6.2-08', aula: '6.2', title: 'Sem direito ao esquecimento',
    cue: 'BLOCO 4 — Tema 786, 2021: o direito ao esquecimento é incompatível com a Constituição',
    render() {
      const h = heading('Tema 786: o tempo não apaga o fato', { sub: 'Em 2021, o STF decidiu que a ideia de um direito ao esquecimento é incompatível com a Constituição.' });
      let body = h.svg;
      body += timeline([
        { at: 0.06, date: 'ANOS ATRÁS', t: 'Condenação de um político', color: C.ink2, anchor: 'start' },
        { at: 0.94, date: 'HOJE', t: 'Ele volta a disputar eleição', anchor: 'end' }
      ], { y: 600, d0: 0.9, step: 1.0, alt: false, side: 'up', labelW: 600 }).svg;
      body += anim('up', 2.8, rich('A condenação antiga {a|continua sendo informação}.', { x: W / 2, y: 780, size: 46, font: 'display', anchor: 'middle', w: BW }).svg);
      body += anim('up', 3.4, rich('Fato verdadeiro, obtido licitamente, não deixa de poder ser publicado só porque o tempo passou. Abusos continuam sendo discutidos caso a caso.', { x: W / 2, y: 880, size: 30, fill: C.ink2, anchor: 'middle', w: 1600 }).svg);
      return { body, source: SRC };
    }
  },
  {
    id: '6.2-09', aula: '6.2', title: 'O que condena e o que protege',
    cue: '[TELA: duas colunas — o que costuma condenar / o que costuma proteger]',
    render() {
      const h = heading('Como é a culpa grave na prática');
      const c = columns([
        { head: 'O que costuma condenar', items: ['Publicar sem conferir o que era fácil de conferir', 'Não ouvir o acusado', 'Distorcer um documento', 'Ignorar a prova contrária que você tinha', 'Usar adjetivo onde deveria haver fato'], color: C.red, icon: 'x' },
        { head: 'O que costuma proteger', items: ['O dossiê da apuração, com documentos e hashes', 'O pedido de posicionamento, com data e prazo', 'A redação proporcional', 'A correção rápida quando você erra'], color: C.green, icon: 'shield' }
      ], { y: 300, h: 560, size: 32, headSize: 40, step: 2.2, itemStep: 0.4 });
      let body = h.svg + c.svg;
      body += anim('up', 5.0, rich('Repare: a segunda coluna é, literalmente, {a|o conteúdo deste curso}.', { x: X0, y: 960, size: 34, font: 'display', w: BW }).svg);
      return { body, source: SRC };
    }
  },

  // ---------------------------------------------------------------- 6.3
  {
    id: '6.3-01', aula: '6.3', title: 'Querem cansar',
    cue: 'ABERTURA — “Muitos não querem ganhar. Querem cansar. O processo, às vezes, é a própria punição.”',
    render() {
      let body = anim('pop', 0.3, rich('784', { x: W / 2, y: 470, size: 260, font: 'display', fill: C.amber, anchor: 'middle', w: 1200 }).svg);
      body += anim('up', 0.9, rich('processos contra jornalistas mapeados pela Abraji', { x: W / 2, y: 560, size: 40, weight: 700, anchor: 'middle', w: BW }).svg);
      body += anim('up', 2.0, rich('Muitos não querem ganhar. {a|Querem cansar.}', { x: W / 2, y: 760, size: 56, font: 'display', anchor: 'middle', w: BW }).svg);
      body += anim('up', 2.8, rich('O processo, às vezes, é a própria punição.', { x: W / 2, y: 860, size: 38, fill: C.ink2, anchor: 'middle', w: BW }).svg);
      return { body, source: 'Monitor de Assédio Judicial contra Jornalistas, Abraji, 2ª edição' };
    }
  },
  {
    id: '6.3-02', aula: '6.3', title: 'O Monitor de Assédio Judicial',
    cue: '[TELA: dados da segunda edição do Monitor de Assédio Judicial contra Jornalistas]',
    render() {
      const h = heading('O tamanho do problema');
      let body = h.svg;
      body += anim('pop', 0.6, rich('784', { x: X0, y: 470, size: 150, font: 'display', fill: C.amber, w: 600 }).svg + rich('processos registrados', { x: X0, y: 530, size: 32, weight: 700, w: 600 }).svg);
      body += anim('pop', 1.4, rich('130', { x: X0, y: 760, size: 150, font: 'display', fill: C.amber, w: 600 }).svg + rich('novos entre 2024 e setembro de 2025', { x: X0, y: 820, size: 32, weight: 700, w: 600 }).svg);
      const cx = 1300; const cy = 590; const r = 220; const C2 = 2 * Math.PI * r;
      body += anim('fade', 2.0, `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.s3}" stroke-width="70"/>`);
      body += anim('draw', 2.2, `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.red}" stroke-width="70" pathLength="1" stroke-dasharray="0.672 1" transform="rotate(-90 ${cx} ${cy})"/>`, { t: 1.4 });
      body += anim('fade', 3.2, rich('67,2%', { x: cx, y: cy + 30, size: 84, font: 'display', anchor: 'middle', w: 400 }).svg);
      body += anim('up', 3.6, rich('dos processos cíveis correram nos {a|Juizados Especiais Cíveis}: baratos e rápidos para quem processa.', { x: 1620, y: 450, size: 26, weight: 700, w: 220 }).svg);
      body += anim('up', 4.4, rich('Para quem é processado em outra cidade: viajar para cada audiência.', { x: 1000, y: 920, size: 30, fill: C.ink2, w: 800 }).svg);
      return { body, source: 'Monitor de Assédio Judicial contra Jornalistas, Abraji, 2ª edição' };
    }
  },
  {
    id: '6.3-03', aula: '6.3', title: 'Programa de Proteção Legal',
    cue: '[TELA: página do programa] — Abraji, Media Defence e Tornavoz',
    warn: 'Conferir antes de gravar o número atualizado de atendidos e o canal de pedido.',
    render() {
      const h = heading('Onde buscar ajuda', { sub: 'Programa de Proteção Legal para Jornalistas: Abraji, Media Defence e Tornavoz.' });
      let body = h.svg;
      body += anim('up', 0.8, box({ x: X0, y: 380, w: 780, h: 460, fill: C.s1, stroke: C.green, sw: 3 }) + icon('shield', { x: X0 + 40, y: 420, s: 100, color: C.green, sw: 4 })
        + rich('Assistência jurídica gratuita', { x: X0 + 40, y: 600, size: 44, font: 'display', w: 700, lh: 1.08 }).svg + rich('Na última checagem, {a|33 profissionais} tinham sido atendidos. Prioridade para quem trabalha fora dos grandes centros e sem veículo por trás.', { x: X0 + 40, y: 730, size: 26, fill: C.ink2, w: 700 }).svg);
      body += anim('up', 1.8, box({ x: 980, y: 380, w: 820, h: 460, fill: C.s1, stroke: C.amber, sw: 3 }) + label('Como pedir', { x: 1020, y: 434, size: 24 })
        + rich('Formulário no site da Abraji', { x: 1020, y: 520, size: 34, weight: 700, w: 760 }).svg + rich('ou pelo e-mail', { x: 1020, y: 590, size: 28, fill: C.ink2, w: 760 }).svg
        + rich('programadeprotecao@abraji.org.br', { x: 1020, y: 660, size: 32, font: 'mono', weight: 700, fill: C.amber, w: 760 }).svg);
      body += anim('up', 3.0, rich('Guarde o contato {a|antes de precisar}. Na hora da citação, o tempo é curto.', { x: X0, y: 940, size: 36, font: 'display', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '6.3-04', aula: '6.3', title: 'Recebi. E agora?',
    cue: '[TELA: fluxograma — recebi o quê? → prazo → provas → quem me ajuda → decisão]',
    render() {
      const h = heading('Recebi. E agora?');
      let body = h.svg;
      body += flow([
        { t: 'Recebi o quê?' }, { t: 'Prazo' }, { t: 'Provas', sub: 'o dossiê da pauta' }, { t: 'Quem me ajuda' }, { t: 'Decisão', color: C.green }
      ], { y: 290, h: 170, step: 0.6, gap: 46, size: 34, subSize: 22 }).svg;
      const kinds = [
        ['Notificação extrajudicial', 'Uma carta, em geral de advogado. {a|Não é processo.}', C.blue],
        ['Citação', '{r|Agora é processo.} Tem prazo. Procure advogado ou a Abraji no mesmo dia.', C.red],
        ['Pedido de direito de resposta', 'Regra própria: Lei 13.188.', C.amber],
        ['Remoção pela plataforma', 'Regra própria: Marco Civil, depois do STF.', C.amber]
      ];
      kinds.forEach(([t, s, col], i) => {
        const x = X0 + (i % 2) * 850; const y = 540 + Math.floor(i / 2) * 200;
        body += anim('up', 3.4 + i * 0.4, box({ x, y, w: 830, h: 170, fill: C.s1, stroke: col, sw: 3 }) + rich(t, { x: x + 30, y: y + 62, size: 34, font: 'display', w: 770 }).svg + rich(s, { x: x + 30, y: y + 120, size: 26, weight: 500, w: 770 }).svg);
      });
      return { body, source: SRC };
    }
  },
  {
    id: '6.3-05', aula: '6.3', title: 'Notificação não é processo',
    cue: 'BLOCO 3 — não entre em pânico, não ignore e não apague tudo na hora',
    render() {
      let body = docSheet({ x: 1180, y: 200, w: 600, h: 740, head: true, title: 'Notificação extrajudicial', lines: [0.9, 0.8, { t: 'Requer a retirada do conteúdo…', size: 26, weight: 700 }, 0.7, 0.85, 0.6, 0.8], d: 0.3 });
      body += anim('up', 0.4, rich('Notificação {a|não é processo}.', { x: X0, y: 300, size: 60, font: 'display', w: 980 }).svg);
      body += list([
        { t: 'Não entre em pânico.', mark: 'no' },
        { t: 'Não ignore.', mark: 'no' },
        { t: 'Não apague tudo na hora.', mark: 'no', sub: 'Apagar pode parecer confissão.' }
      ], { y: 400, w: 980, size: 44, subSize: 30, gap: 30, numbered: false, marker: 'no', d0: 1.2, step: 0.7 }).svg;
      body += anim('up', 3.6, rich('Avalie com calma, de preferência com advogado. E reúna o dossiê: documentos, hashes, pedido de posicionamento, versões do roteiro.', { x: X0, y: 800, size: 30, weight: 500, w: 980 }).svg);
      return { body, source: SRC };
    }
  },
  {
    id: '6.3-06', aula: '6.3', title: 'O direito de resposta',
    cue: '[TELA: arts. 2º a 5º da Lei 13.188]',
    render() {
      const h = heading('Direito de resposta: os prazos', { sub: 'Constituição, art. 5º, V. Regulado pela Lei 13.188/2015, confirmada pelo STF em 2021.' });
      let body = h.svg;
      body += timeline([
        { at: 0, date: 'DIA 0', t: 'A matéria é divulgada', sub: 'em qualquer meio ou plataforma', anchor: 'start' },
        { at: 0.35, date: 'ATÉ 60 DIAS', t: 'O ofendido pede a resposta', sub: 'ao veículo, com aviso de recebimento', color: C.blue },
        { at: 0.66, date: '7 DIAS', t: 'Prazo para publicar', sub: 'no caso de um canal, quem responde é você' },
        { at: 1, date: 'DEPOIS', t: 'Justiça, num rito rápido', sub: 'se a resposta não sair', color: C.red, anchor: 'end' }
      ], { y: 500, d0: 0.8, step: 0.9, alt: false, side: 'down', labelW: 360 }).svg;
      body += anim('up', 4.6, box({ x: X0, y: 820, w: BW, h: 130, fill: C.s1, stroke: C.amber, sw: 3 }) + rich('A resposta tem o {a|mesmo destaque, publicidade, periodicidade e dimensão} da matéria original.', { x: X0 + 30, y: 900, size: 32, weight: 700, w: BW - 60 }).svg);
      return { body, source: 'Lei 13.188/2015, arts. 2º a 5º · ' + SRC };
    }
  },
  {
    id: '6.3-07', aula: '6.3', title: 'Publicar a resposta costuma ser a melhor defesa',
    cue: 'BLOCO 4 — “quando o pedido é razoável, publicar a resposta costuma ser a melhor defesa”',
    render() {
      let body = statement('Pedido razoável?\n{a|Publicar a resposta} costuma ser a melhor defesa.', { y: 380, size: 76, d: 0.3, step: 0.8 }).svg;
      body += anim('up', 2.2, rich('Mostra boa-fé. E encerra a briga mais barato do que qualquer processo.', { x: W / 2, y: 820, size: 38, fill: C.ink2, anchor: 'middle', w: BW }).svg);
      return { body, source: SRC };
    }
  },
  {
    id: '6.3-08', aula: '6.3', title: 'Marco Civil, o regime atual',
    cue: '[TELA: resumo do regime atual] — art. 19 parcialmente inconstitucional',
    warn: 'Conferir antes de gravar o texto final da tese dos Temas 987 e 533 depois dos embargos e se canais independentes contam como provedor jornalístico.',
    render() {
      const h = heading('Plataforma: o regime atual', { sub: 'O STF declarou o art. 19 do Marco Civil parcialmente inconstitucional em junho de 2025. Recursos julgados em junho de 2026.' });
      const t = table({
        y: 380, rowH: 120, headH: 60, size: 28, d0: 0.9, step: 0.8,
        cols: [{ h: 'Conteúdo', w: 520, bold: true }, { h: 'Regra', w: 1160 }],
        rows: [
          ['Ofensa à honra', 'Continua a exigência de ordem judicial para responsabilizar a plataforma. {a|Mas ela pode remover por notificação extrajudicial.}'],
          ['Outros conteúdos ilícitos', 'Notificação e retirada: notificada, a plataforma pode responder se não remover.'],
          ['Anúncios e conteúdo impulsionado', '{r|Culpa da plataforma presumida.}'],
          ['Atividade jornalística', 'Fora dessa tese. Responde pela lei do direito de resposta.']
        ]
      });
      return { body: h.svg + t.svg, source: 'STF, Temas 987 e 533 · ' + SRC };
    }
  },
  {
    id: '6.3-09', aula: '6.3', title: 'Não dependa de uma plataforma',
    cue: 'BLOCO 6 — “Canal que só existe num lugar pode deixar de existir numa tarde.”',
    render() {
      const h = heading('Na prática, para o criador');
      const c = columns([
        { head: 'Impulsionado corre mais risco', body: 'A plataforma tem mais incentivo para tirar do que para manter.', icon: 'bolt', color: C.red },
        { head: 'Cópias fora da plataforma', body: 'O arquivo final, a versão publicada, o roteiro com as fontes.', icon: 'lock', color: C.amber },
        { head: 'Caiu injustamente?', body: 'Recorra na plataforma. Se não resolver, com advogado, peça à Justiça o restabelecimento.', icon: 'gavel', color: C.blue },
        { head: 'Mais de um lugar', body: 'Newsletter, site, comunidade própria.', icon: 'globe', color: C.green }
      ], { y: 300, h: 460, size: 28, headSize: 32, step: 0.7, gap: 26 });
      let body = h.svg + c.svg;
      body += anim('up', 3.6, rich('Canal que só existe num lugar {a|pode deixar de existir numa tarde}.', { x: X0, y: 900, size: 42, font: 'display', w: BW }).svg);
      return { body, source: SRC };
    }
  },

  // ---------------------------------------------------------------- 6.4
  {
    id: '6.4-01', aula: '6.4', title: 'Horas, não semanas',
    cue: 'ABERTURA — “No período eleitoral, o pedido de resposta a uma matéria sobre candidato corre em horas.”',
    render() {
      const cx = 1440; const cy = 520;
      let body = anim('pop', 0.3, `<circle cx="${cx}" cy="${cy}" r="250" fill="${C.s1}" stroke="${C.red}" stroke-width="12"/>` + Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `<path d="M${cx + 205 * Math.sin(a)} ${cy - 205 * Math.cos(a)} L${cx + 230 * Math.sin(a)} ${cy - 230 * Math.cos(a)}" stroke="${C.ink2}" stroke-width="6"/>`; }).join(''));
      body += anim('spin', 1.0, `<path d="M${cx} ${cy} V${cy - 190}" stroke="${C.red}" stroke-width="10" stroke-linecap="round"/>`, { t: 3, style: `transform-origin:${cx}px ${cy}px;--r:1080deg` });
      body += anim('spin', 1.0, `<path d="M${cx} ${cy} H${cx + 130}" stroke="${C.ink}" stroke-width="14" stroke-linecap="round"/>`, { t: 3, style: `transform-origin:${cx}px ${cy}px;--r:90deg` });
      body += anim('up', 0.4, rich('No período eleitoral, o pedido de resposta corre em {r|horas}.', { x: X0, y: 330, size: 56, font: 'display', w: 960, lh: 1.08 }).svg);
      body += anim('up', 1.4, rich('Não em semanas.', { x: X0, y: 560, size: 56, font: 'display', fill: C.ink2, w: 960 }).svg);
      body += anim('up', 2.4, rich('A Justiça Eleitoral tem pressa. {a|Você precisa ter mais.}', { x: X0, y: 760, size: 40, weight: 700, w: 960 }).svg);
      return { body, source: 'Regras do período eleitoral de 2026 · ' + SRC };
    }
  },
  {
    id: '6.4-02', aula: '6.4', title: 'O calendário eleitoral de 2026',
    cue: '[TELA: calendário com as três datas]',
    render() {
      const h = heading('Eleições gerais de 2026', { sub: 'Nesse período, regras especiais se somam a tudo o que você viu no módulo.' });
      let body = h.svg;
      const cell = 62;
      body += calendar({ x: X0, y: 420, cell, days: 31, startDow: dow(2026, 8, 1), title: 'Agosto', marks: { 16: { color: C.amber, d: 1.4 } }, d: 0.6 });
      body += calendar({ x: X0 + 560, y: 420, cell, days: 30, startDow: dow(2026, 9, 1), title: 'Setembro', marks: {}, d: 0.9 });
      body += calendar({ x: X0 + 1120, y: 420, cell, days: 31, startDow: dow(2026, 10, 1), title: 'Outubro', marks: { 4: { color: C.red, d: 2.2 }, 25: { color: C.red, d: 2.8 } }, d: 1.2 });
      body += anim('up', 3.4, `<rect x="${X0}" y="900" width="24" height="24" fill="${C.amber}"/>` + rich('16/08: começa a propaganda', { x: X0 + 36, y: 920, size: 28, weight: 700, w: 500 }).svg
        + `<rect x="${X0 + 560}" y="900" width="24" height="24" fill="${C.red}"/>` + rich('04/10: 1º turno · 25/10: 2º turno, onde houver', { x: X0 + 596, y: 920, size: 28, weight: 700, w: 1000 }).svg);
      return { body, source: 'Regras do período eleitoral de 2026' };
    }
  },
  {
    id: '6.4-03', aula: '6.4', title: 'Os prazos do direito de resposta eleitoral',
    cue: '[TELA: art. 58, §1º, da Lei 9.504]',
    render() {
      const h = heading('Lei 9.504, art. 58: os prazos para pedir', { sub: 'Contados da veiculação. Para candidato, partido ou coligação atingidos por afirmação caluniosa, difamatória, injuriosa ou sabidamente inverídica.' });
      let body = h.svg;
      body += hbars([
        { name: 'Horário eleitoral gratuito', v: 24, label: '24 horas' },
        { name: 'Rádio e TV, programação normal', v: 48, label: '48 horas' },
        { name: 'Imprensa escrita', v: 72, label: '72 horas' }
      ], { x: X0 + 560, y: 440, w: 760, rowH: 110, labelW: 520, labelSize: 30, valueSize: 40, d0: 0.9, step: 0.5 }).svg;
      body += anim('up', 2.6, box({ x: X0, y: 790, w: BW, h: 150, fill: C.s1, stroke: C.red, sw: 3 }) + label('Internet', { x: X0 + 30, y: 836, size: 24, color: C.red })
        + rich('{r|A qualquer tempo}, enquanto o conteúdo estiver no ar, ou em até 72 horas depois de retirado. Defesa em 24 horas; decisão em até 72 horas do pedido.', { x: X0 + 30, y: 890, size: 28, weight: 500, w: BW - 60 }).svg);
      return { body, source: 'Lei 9.504/1997, art. 58 · regras do período eleitoral de 2026' };
    }
  },
  {
    id: '6.4-04', aula: '6.4', title: 'Sabidamente inverídica, a qualquer tempo',
    cue: 'BLOCO 2 — “o seu vídeo de agosto pode gerar pedido de resposta em outubro”',
    render() {
      const h = heading('Duas expressões para guardar');
      let body = h.svg;
      body += anim('up', 0.8, box({ x: X0, y: 300, w: 820, h: 300, fill: C.s1, stroke: C.amber, sw: 3 }) + rich('“sabidamente inverídica”', { x: X0 + 36, y: 390, size: 44, font: 'display', fill: C.amber, w: 760 }).svg
        + rich('A régua eleitoral alcança a mentira consciente, mesmo sem crime contra a honra.', { x: X0 + 36, y: 470, size: 30, weight: 500, w: 760 }).svg);
      body += anim('up', 1.8, box({ x: 980, y: 300, w: 820, h: 300, fill: C.s1, stroke: C.red, sw: 3 }) + rich('“a qualquer tempo”', { x: 1016, y: 390, size: 44, font: 'display', fill: C.red, w: 760 }).svg
        + rich('Na internet, enquanto o conteúdo estiver no ar.', { x: 1016, y: 470, size: 30, weight: 500, w: 760 }).svg);
      body += timeline([
        { at: 0.08, date: 'AGOSTO', t: 'Você publica o vídeo', anchor: 'start', color: C.ink2 },
        { at: 0.92, date: 'OUTUBRO', t: 'Chega o pedido de resposta', anchor: 'end', color: C.red }
      ], { y: 760, d0: 3.0, step: 1.0, alt: false, side: 'down', labelW: 600 }).svg;
      return { body, source: 'Lei 9.504/1997, art. 58 · regras do período eleitoral de 2026' };
    }
  },
  {
    id: '6.4-05', aula: '6.4', title: 'Inteligência artificial na eleição',
    cue: '[TELA: resumo das regras] — Resolução TSE 23.610, alterada em março de 2026',
    render() {
      const h = heading('IA no período eleitoral', { sub: 'Resolução TSE 23.610, alterada em março de 2026.' });
      let body = h.svg;
      body += list([
        { t: 'Conteúdo feito ou alterado por IA precisa de rótulo.' },
        { t: 'Nas 72 horas antes e nas 24 horas depois da votação: proibido publicar, republicar e impulsionar novos conteúdos sintéticos com imagem, voz ou manifestação de candidato ou pessoa pública.', sub: 'Mesmo rotulados. Mesmo gratuitos.' },
        { t: 'Sistemas de IA não podem recomendar candidatos.' },
        { t: 'Vedadas as montagens que violentem candidatas.' }
      ], { y: 330, w: 1020, size: 30, subSize: 26, gap: 26, step: 0.9 }).svg;
      const x = 1240; const y = 380;
      body += anim('fade', 3.0, label('Janela da votação (1º turno)', { x, y: y - 20, size: 20 }));
      const days = [['1/10', 'qui'], ['2/10', 'sex'], ['3/10', 'sáb'], ['4/10', 'dom'], ['5/10', 'seg']];
      days.forEach(([d0, w0], i) => {
        const col = i === 3 ? C.red : C.s2;
        body += anim('pop', 3.2 + i * 0.15, `<rect x="${x + i * 112}" y="${y}" width="104" height="104" fill="${col}"/>` + rich(d0, { x: x + i * 112 + 52, y: y + 54, size: 26, font: 'mono', weight: 700, fill: i === 3 ? C.bg : C.ink, anchor: 'middle', w: 100 }).svg + rich(w0, { x: x + i * 112 + 52, y: y + 86, size: 20, font: 'mono', fill: i === 3 ? C.bg : C.ink3, anchor: 'middle', w: 100 }).svg);
      });
      body += anim('grow', 4.2, `<rect x="${x}" y="${y + 120}" width="${5 * 112 - 8}" height="20" fill="${C.amber}"/>`);
      body += anim('fade', 4.6, rich('72 h antes · votação · 24 h depois', { x, y: y + 180, size: 22, font: 'mono', weight: 700, fill: C.amber, w: 560 }).svg);
      body += anim('up', 5.2, box({ x: 1240, y: 640, w: 560, h: 280, fill: C.s1, stroke: C.red, sw: 3 }) + label('A orientação', { x: 1270, y: 686, size: 22, color: C.red })
        + rich('Não use IA para simular candidato. Nem como sátira. Nem com aviso. {r|Não no período eleitoral.}', { x: 1270, y: 740, size: 30, weight: 700, w: 500 }).svg);
      return { body, source: 'Regras do período eleitoral de 2026 · ' + SRC };
    }
  },
  {
    id: '6.4-06', aula: '6.4', title: 'O protocolo pré-publicação',
    cue: '[TELA: os cinco passos, um por vez]',
    render() {
      const h = heading('O protocolo pré-publicação', { sub: 'Dentro ou fora da eleição. Cinco passos. Nenhum se pula.' });
      const l = list([
        { t: 'O dossiê', sub: 'Todos os documentos da pauta, organizados, com hash e link na aba Log.' },
        { t: 'O pedido de posicionamento', sub: 'Por e-mail, para a pessoa e a assessoria, com perguntas sobre cada fato. 48 a 72 horas para temas simples; mais para os complexos. Guarde o comprovante.' },
        { t: 'A revisão jurídica das frases de imputação', sub: 'Em pauta de alto risco, com advogado.' },
        { t: 'O arquivo', sub: 'Vídeo final, roteiro com fontes e documentos, guardados fora da plataforma.' },
        { t: 'O plano de reação', sub: 'Quem responde a uma notificação, em quanto tempo, com quais documentos.' }
      ], { y: 360, size: 38, subSize: 26, gap: 26, step: 1.2 });
      return { body: h.svg + l.svg, source: SRC };
    }
  },
  {
    id: '6.4-07', aula: '6.4', title: 'O pedido de posicionamento',
    cue: '[TELA: modelo de e-mail, com os campos destacados]',
    render() {
      let body = anim('up', 0.3, box({ x: X0, y: 160, w: BW, h: 820, fill: C.paper, stroke: C.paper, sw: 0, shadow: C.amber, sh: 14 }));
      body += anim('fade', 0.5, rich('Para: [pessoa citada]; [assessoria]', { x: X0 + 50, y: 220, size: 26, font: 'mono', fill: C.pInk2, w: BW - 100 }).svg + rich('Assunto: Pedido de posicionamento · reportagem sobre [tema]', { x: X0 + 50, y: 264, size: 26, font: 'mono', fill: C.pInk2, w: BW - 100 }).svg + `<rect x="${X0 + 50}" y="290" width="${BW - 100}" height="2" fill="${C.pLine}"/>`);
      const txt = 'Prezado, sou jornalista e preparo uma reportagem sobre {h|[tema]}. A reportagem vai mostrar que {h|[fato 1, com documento]} e que {h|[fato 2, com documento]}. Gostaria de ouvir sua posição sobre cada ponto. Perguntas: {h|[1]}, {h|[2]}, {h|[3]}. Peço resposta até {h|[data e hora]}. Sua manifestação será considerada e publicada de forma fiel.';
      body += anim('fade', 0.9, rich(txt, { x: X0 + 50, y: 370, size: 40, fill: C.pInk, w: BW - 100, lh: 1.5, paper: true, hlColor: C.amber, hlOpacity: 0.6, hlD: 1.6, hlStep: 0.45 }).svg);
      return { body, source: 'Modelo da aula 6.4' };
    }
  },
  {
    id: '6.4-08', aula: '6.4', title: 'Prazo de fachada',
    cue: 'BLOCO 5 — “não mande às 23h de sexta pedindo resposta até segunda às 8h”',
    render() {
      const h = heading('Três cuidados no pedido');
      let body = h.svg;
      body += list([
        { t: 'Não esconda o que vai publicar.', sub: 'O outro lado precisa saber do que se defende.' },
        { t: 'Não mande o documento original, se ele puder identificar a fonte.', sub: 'Descreva.' }
      ], { y: 300, size: 38, subSize: 28, gap: 30, step: 0.9 }).svg;
      const y = 640;
      const blocks = [['sex', '23h', C.red], ['sáb', '', C.s3], ['dom', '', C.s3], ['seg', '8h', C.red]];
      blocks.forEach(([d0, t, col], i) => {
        body += anim('pop', 2.4 + i * 0.2, `<rect x="${X0 + i * 210}" y="${y}" width="190" height="150" fill="${col}"/>` + rich(d0, { x: X0 + i * 210 + 95, y: y + 64, size: 34, font: 'display', fill: col === C.red ? C.bg : C.ink2, anchor: 'middle', w: 180 }).svg + rich(t, { x: X0 + i * 210 + 95, y: y + 116, size: 32, font: 'mono', weight: 700, fill: C.bg, anchor: 'middle', w: 180 }).svg);
      });
      body += anim('draw', 3.4, `<path d="M${X0 - 10} ${y + 160} L${X0 + 840} ${y - 10}" stroke="${C.red}" stroke-width="10" fill="none" pathLength="1"/>`, { t: 0.4 });
      body += anim('up', 3.8, rich('Prazo ridículo é {r|outro lado de fachada}. E juiz percebe.', { x: 1040, y: 690, size: 40, font: 'display', w: 760, lh: 1.1 }).svg);
      body += anim('up', 4.6, rich('Prazo razoável: {a|48 a 72 horas} para temas simples. Mais para temas complexos.', { x: 1040, y: 840, size: 30, weight: 700, w: 760 }).svg);
      return { body, source: SRC };
    }
  }
];
