// Módulo 4 — Dados públicos e cruzamento
import {
  C, W, H, X0, X1, BW, anim, rich, layout, heading, statement, list, columns, compare, flow, timeline, paperCard,
  stamp, table, box, icon, badge, arrowH, arrowV, arrowPath, edge, node, pill, redact, checklist, docSheet, bars, hbars, calendar, label
} from '../kit.mjs';

const browser = (x, y, w, h, url, d) => anim('up', d, box({ x, y, w, h, fill: C.s1, stroke: C.lineUi, sw: 2 }) + `<rect x="${x}" y="${y}" width="${w}" height="52" fill="${C.s3}"/>`
  + ['#FF6B5E', '#FFB800', '#4ADE80'].map((c, i) => `<circle cx="${x + 28 + i * 26}" cy="${y + 26}" r="7" fill="${c}"/>`).join('')
  + `<rect x="${x + 120}" y="${y + 12}" width="${w - 150}" height="28" fill="${C.s2}"/>` + rich(url, { x: x + 136, y: y + 33, size: 18, font: 'mono', fill: C.ink3, w: w - 180 }).svg);

export default [
  // ---------------------------------------------------------------- 4.1
  {
    id: '4.1-01', aula: '4.1', title: 'Sai no Diário Oficial',
    cue: 'ABERTURA — “A corrupção municipal raramente sai no jornal. Mas quase sempre sai no Diário Oficial.”',
    render() {
      const px = 1120; const py = 150; const pw = 640; const ph = 820;
      let page = box({ x: px, y: py, w: pw, h: ph, fill: C.paper, stroke: C.paper, sw: 0 }) + rich('DIÁRIO OFICIAL DO MUNICÍPIO', { x: px + pw / 2, y: py + 50, size: 22, font: 'mono', weight: 700, fill: C.pInk, anchor: 'middle', w: pw }).svg + `<rect x="${px + 30}" y="${py + 70}" width="${pw - 60}" height="3" fill="${C.pInk}"/>`;
      for (let c = 0; c < 3; c++) for (let r = 0; r < 34; r++) page += `<rect x="${px + 30 + c * 200}" y="${py + 100 + r * 20}" width="${170 * (0.55 + ((r * 13 + c * 7) % 9) / 20)}" height="7" fill="${C.pLine}"/>`;
      let body = anim('up', 0.3, page);
      const ex = px + 430; const ey = py + 620;
      body += anim('pop', 1.4, `<rect x="${ex - 6}" y="${ey - 6}" width="182" height="72" fill="none" stroke="${C.red}" stroke-width="4"/>`);
      body += arrowPath(`M${ex - 10} ${ey + 30} C${ex - 200} ${ey + 60} 1000 ${ey + 40} 940 ${ey - 20}`, { d: 2.0, color: C.red, t: 0.7, end: [940, ey - 20, -130] });
      body += anim('pop', 2.6, box({ x: X0, y: 540, w: 800, h: 360, fill: C.paper, stroke: C.red, sw: 4 })
        + rich('EXTRATO DO CONTRATO Nº 045/2025', { x: X0 + 30, y: 590, size: 24, font: 'mono', weight: 700, fill: C.pInk, w: 740 }).svg
        + rich('Contratante: Secretaria Municipal de Educação. Contratada: Alimentos Modelo Ltda. Objeto: fornecimento de merenda escolar. Valor: {h|R$ 480.000,00}. Fundamento: {h|dispensa de licitação}.', { x: X0 + 30, y: 640, size: 26, font: 'mono', fill: C.pInk, w: 740, lh: 1.35, paper: true, hlColor: C.amber, hlOpacity: 0.6, hlD: 3.4 }).svg);
      body += anim('up', 0.4, rich('A corrupção municipal raramente sai no jornal.', { x: X0, y: 230, size: 46, font: 'display', w: 900, lh: 1.08 }).svg);
      body += anim('up', 1.0, rich('{a|Mas quase sempre sai no Diário Oficial.}', { x: X0, y: 350, size: 46, font: 'display', w: 900, lh: 1.08 }).svg);
      body += anim('up', 4.6, rich('Em três linhas. Em letra miúda. Numa sexta-feira à noite.', { x: X0, y: 960, size: 30, fill: C.ink2, w: 900 }).svg);
      return { body, source: 'Extrato fictício' };
    }
  },
  {
    id: '4.1-02', aula: '4.1', title: 'O que procurar no diário',
    cue: '[TELA: o que procurar — extratos, dispensas e inexigibilidades, aditivos, nomeações e exonerações]',
    render() {
      const h = heading('O que procurar no diário', { sub: 'Ato administrativo só produz efeito quando é publicado. O poder é obrigado a deixar rastro.' });
      const c = columns([
        { head: 'Extratos de contrato', body: 'Quem contratou quem, por quanto, com base em quê.', icon: 'doc' },
        { head: 'Dispensas e inexigibilidades', body: 'As contratações sem disputa.', icon: 'bolt' },
        { head: 'Aditivos', body: 'Quando o contrato cresce depois de assinado.', icon: 'arrow' },
        { head: 'Nomeações e exonerações', body: 'Quem entrou, quem saiu e quando.', icon: 'person' }
      ], { y: 400, h: 420, size: 30, headSize: 34, step: 0.7, gap: 28 });
      return { body: h.svg + c.svg };
    }
  },
  {
    id: '4.1-03', aula: '4.1', title: 'O limite dos aditivos',
    cue: 'BLOCO 1 — Lei 14.133: acréscimos limitados, em regra, a 25% do valor inicial; em reforma, 50%',
    render() {
      const h = heading('Aditivo que passa do limite merece uma olhada');
      let body = h.svg;
      const x = X0 + 60; const unit = 900; const y = 430;
      body += anim('grow', 0.6, `<rect x="${x}" y="${y}" width="${unit}" height="120" fill="${C.s3}"/>`) + anim('fade', 0.9, rich('valor inicial atualizado do contrato', { x: x + 30, y: y + 72, size: 30, weight: 700, w: 800 }).svg);
      body += anim('grow', 1.6, `<rect x="${x + unit}" y="${y}" width="${unit * 0.31}" height="120" fill="${C.red}"/>`) + anim('fade', 2.2, rich('aditivo de +31%', { x: x + unit + 20, y: y + 72, size: 28, font: 'mono', weight: 700, fill: C.bg, w: 300 }).svg);
      const l25 = x + unit * 1.25; const l50 = x + unit * 1.5;
      body += anim('draw', 2.6, `<path d="M${l25} ${y - 70} V${y + 200}" stroke="${C.amber}" stroke-width="5" stroke-dasharray="1" fill="none" pathLength="1"/>`) + anim('fade', 2.8, rich('+25%', { x: l25, y: y - 86, size: 36, font: 'display', fill: C.amber, anchor: 'middle', w: 200 }).svg + rich('limite, em regra', { x: l25 - 16, y: y + 240, size: 24, font: 'mono', weight: 700, fill: C.amber, anchor: 'end', w: 300 }).svg);
      body += anim('draw', 3.2, `<path d="M${l50} ${y - 70} V${y + 200}" stroke="${C.ink2}" stroke-width="5" fill="none" pathLength="1"/>`) + anim('fade', 3.4, rich('+50%', { x: l50, y: y - 86, size: 36, font: 'display', fill: C.ink2, anchor: 'middle', w: 200 }).svg + rich('reforma de edifício ou equipamento', { x: l50 + 16, y: y + 240, size: 22, font: 'mono', weight: 700, fill: C.ink2, w: 250 }).svg);
      body += anim('up', 4.2, rich('Passou dos 25% sem ser reforma? {r|É uma pergunta para o contrato.}', { x: X0, y: 880, size: 38, font: 'display', w: BW }).svg);
      return { body, source: 'Lei 14.133/2021, a nova lei de licitações · exemplo ilustrativo' };
    }
  },
  {
    id: '4.1-04', aula: '4.1', title: 'As três seções do DOU',
    cue: 'BLOCO 2 — Seção 1, atos normativos; Seção 2, atos de pessoal; Seção 3, contratos, licitações e extratos',
    render() {
      const h = heading('Diário Oficial da União: três seções', { sub: 'Parece óbvio. Economiza horas.' });
      let body = h.svg;
      const secs = [['1', 'Atos normativos', C.ink2], ['2', 'Atos de pessoal, como nomeações', C.blue], ['3', 'Contratos, licitações e extratos', C.amber]];
      secs.forEach(([n, t, col], i) => {
        const y = 400 + i * 150;
        body += anim('left', 0.7 + i * 0.5, `<rect x="${X0}" y="${y}" width="1000" height="120" fill="${C.s1}" stroke="${col}" stroke-width="3"/><rect x="${X0}" y="${y}" width="150" height="120" fill="${col}"/>`
          + rich(`${n}`, { x: X0 + 75, y: y + 88, size: 80, font: 'display', fill: C.bg, anchor: 'middle', w: 150 }).svg + rich(t, { x: X0 + 180, y: y + 74, size: 36, weight: 700, w: 800 }).svg);
      });
      body += anim('up', 2.6, rich('Procura contrato?', { x: 1220, y: 440, size: 36, weight: 700, w: 580 }).svg + rich('{a|Seção 3.}', { x: 1220, y: 500, size: 52, font: 'display', w: 580 }).svg);
      body += anim('up', 3.2, rich('Procura nomeação?', { x: 1220, y: 620, size: 36, weight: 700, w: 580 }).svg + rich('{b|Seção 2.}', { x: 1220, y: 680, size: 52, font: 'display', w: 580 }).svg);
      body += anim('fade', 4.0, rich('Busque o nome entre aspas · busque pelo CNPJ · filtre por período e por órgão', { x: X0, y: 900, size: 26, font: 'mono', fill: C.ink2, w: BW }).svg);
      return { body, source: 'Diário Oficial da União, em in.gov.br · conferir a tela no dia da gravação' };
    }
  },
  {
    id: '4.1-05', aula: '4.1', title: 'Muitos diários, uma busca',
    cue: 'BLOCO 3 — 5.570 prefeituras, cada uma com seu diário; o Querido Diário junta numa busca só',
    warn: 'Conferir antes de gravar o número atual de municípios cobertos pelo Querido Diário.',
    render() {
      let body = anim('up', 0.2, rich('5.570', { x: X0, y: 380, size: 180, font: 'display', fill: C.amber, w: 900 }).svg + rich('prefeituras, cada uma com seu diário, cada diário num formato.', { x: X0, y: 460, size: 34, weight: 700, w: 760 }).svg);
      const tx = 1400; const ty = 700;
      for (let i = 0; i < 36; i++) {
        const x = 1000 + (i % 9) * 88; const y = 190 + Math.floor(i / 9) * 80;
        const shape = i % 3 === 0 ? `<rect x="${x}" y="${y}" width="50" height="62" fill="${C.s3}" stroke="${C.lineUi}" stroke-width="2"/>` : i % 3 === 1 ? `<rect x="${x}" y="${y + 10}" width="62" height="46" fill="${C.s2}" stroke="${C.lineUi}" stroke-width="2"/>` : `<path d="M${x} ${y} H${x + 40} L${x + 56} ${y + 16} V${y + 62} H${x} Z" fill="${C.s3}" stroke="${C.lineUi}" stroke-width="2"/>`;
        body += anim('dim', 3.0 + (i % 9) * 0.05, anim('pop', 0.4 + i * 0.03, shape));
      }
      body += anim('pop', 2.4, `<rect x="1000" y="${ty - 60}" width="800" height="110" fill="${C.s1}" stroke="${C.amber}" stroke-width="4"/>` + icon('search', { x: 1030, y: ty - 30, s: 50, color: C.amber, sw: 4 }) + rich('Querido Diário', { x: 1100, y: ty + 14, size: 44, font: 'display', w: 600 }).svg);
      body += anim('up', 3.2, rich('Open Knowledge Brasil · busca por nome e por CNPJ · API aberta', { x: 1000, y: ty + 110, size: 24, font: 'mono', fill: C.ink2, w: 800 }).svg);
      body += anim('up', 3.8, rich('Cobre centenas de municípios, {a|não todos}. Confira se o seu está na lista. Se não estiver, veja o diário da associação de municípios.', { x: X0, y: 760, size: 30, w: 760, weight: 500 }).svg);
      return { body };
    }
  },
  {
    id: '4.1-06', aula: '4.1', title: 'Três hábitos de busca',
    cue: 'BLOCO 4 — variações, CNPJ e ler em volta',
    render() {
      const h = heading('Três hábitos separam quem acha de quem desiste');
      const l = list([
        { t: 'Busque variações', sub: 'Com e sem acento, nome completo e abreviado, nome de solteira. Diário oficial é digitado por gente, e gente erra.' },
        { t: 'Busque pelo CNPJ, não só pelo nome', sub: 'Nome de empresa muda. CNPJ não.' },
        { t: 'Leia em volta', sub: 'O extrato saiu no dia 10. O que saiu nos dias 3 e 17?' }
      ], { y: 330, size: 46, subSize: 32, gap: 44, step: 1.2 });
      return { body: h.svg + l.svg };
    }
  },
  {
    id: '4.1-07', aula: '4.1', title: 'Leia em volta',
    cue: 'BLOCO 4 — “Às vezes a nomeação do sócio sai uma semana antes do contrato. Coincidências gostam de companhia.”',
    render() {
      let body = calendar({ x: X0 + 20, y: 250, cell: 96, days: 30, startDow: 2, d: 0.3, markStep: 1.0, marks: { 3: { color: C.blue, d: 1.2 }, 10: { color: C.amber, d: 2.2 }, 17: { color: C.ink3, d: 3.2 } }, title: 'O mês no diário oficial' });
      body += anim('left', 1.4, `<rect x="820" y="310" width="16" height="16" fill="${C.blue}"/>` + rich('Dia 3: nomeação do sócio da empresa', { x: 850, y: 326, size: 30, weight: 700, w: 950 }).svg);
      body += anim('left', 2.4, `<rect x="820" y="400" width="16" height="16" fill="${C.amber}"/>` + rich('Dia 10: extrato do contrato com a empresa', { x: 850, y: 416, size: 30, weight: 700, w: 950 }).svg);
      body += anim('left', 3.4, `<rect x="820" y="490" width="16" height="16" fill="${C.ink3}"/>` + rich('Dia 17: o que saiu?', { x: 850, y: 506, size: 30, weight: 700, w: 950 }).svg);
      body += anim('up', 4.4, rich('Coincidências {a|gostam de companhia}.', { x: 820, y: 720, size: 54, font: 'display', w: 980, lh: 1.08 }).svg);
      body += anim('up', 5.0, rich('Registre cada achado na aba Linha do tempo, com data, link e o que o ato diz.', { x: 820, y: 880, size: 28, fill: C.ink2, w: 960 }).svg);
      return { body, source: 'Exemplo ilustrativo' };
    }
  },

  // ---------------------------------------------------------------- 4.2
  {
    id: '4.2-01', aula: '4.2', title: 'Empresa punida pode continuar contratando',
    cue: 'ABERTURA — “Às vezes porque a punição não alcança aquele órgão. Às vezes porque ninguém conferiu.”',
    render() {
      const s = statement('Empresa punida pode continuar contratando com o poder público.', { y: 320, size: 64, d: 0.2 });
      let body = s.svg;
      body += anim('up', 1.4, box({ x: X0 + 80, y: 560, w: 720, h: 170, fill: C.s1, stroke: C.blue, sw: 3 }) + label('Às vezes', { x: X0 + 110, y: 606, size: 22, color: C.blue }) + rich('a punição não alcança aquele órgão.', { x: X0 + 110, y: 670, size: 34, weight: 700, w: 660 }).svg);
      body += anim('up', 2.2, box({ x: 1000, y: 560, w: 720, h: 170, fill: C.s1, stroke: C.red, sw: 3 }) + label('Às vezes', { x: 1030, y: 606, size: 22, color: C.red }) + rich('ninguém conferiu.', { x: 1030, y: 670, size: 34, weight: 700, w: 660 }).svg);
      body += anim('up', 3.2, rich('Você descobre qual dos dois {a|em dois cliques}.', { x: W / 2, y: 860, size: 44, font: 'display', anchor: 'middle', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '4.2-02', aula: '4.2', title: 'Empenho, liquidação e pagamento',
    cue: '[TELA: empenho → liquidação → pagamento]',
    render() {
      const h = heading('O caminho do dinheiro público');
      let body = h.svg;
      body += flow([
        { t: 'Empenho', sub: 'O governo reserva o dinheiro. Vem de penhor: é uma promessa de pagar.' },
        { t: 'Liquidação', sub: 'O governo confere se o serviço foi prestado ou o produto entregue.' },
        { t: 'Pagamento', sub: 'O dinheiro sai.', color: C.green }
      ], { y: 310, h: 320, step: 1.1, size: 52, subSize: 28 }).svg;
      body += anim('up', 3.8, box({ x: X0, y: 720, w: BW, h: 200, fill: C.s1, stroke: C.red, sw: 3 })
        + rich('“A prefeitura empenhou R$ 10 milhões”', { x: X0 + 40, y: 790, size: 34, weight: 700, w: 720 }).svg
        + rich('≠', { x: W / 2, y: 812, size: 90, font: 'display', fill: C.red, anchor: 'middle', w: 100 }).svg
        + rich('“a prefeitura pagou R$ 10 milhões”', { x: 1040, y: 790, size: 34, weight: 700, w: 720 }).svg
        + rich('Empenho pode ser cancelado. Confundir os dois é erro factual. E erro factual, no módulo 6, vira culpa.', { x: X0 + 40, y: 880, size: 26, fill: C.ink2, w: BW - 80 }).svg);
      return { body };
    }
  },
  {
    id: '4.2-03', aula: '4.2', title: 'Os cadastros de punidos',
    cue: 'BLOCO 3 — CEIS, CNEP e CEPIM, no Portal da Transparência',
    render() {
      const h = heading('Os cadastros de punidos', { sub: 'A pergunta que vale uma pauta: {a|essa empresa estava punida quando foi contratada?}' });
      const c = columns([
        { head: 'CEIS', body: 'Cadastro de Empresas Inidôneas e Suspensas. Punidas e impedidas de contratar.', icon: 'x', color: C.red },
        { head: 'CNEP', body: 'Cadastro Nacional de Empresas Punidas, com base na Lei Anticorrupção, a Lei 12.846/2013.', icon: 'gavel', color: C.amber },
        { head: 'CEPIM', body: 'Entidades sem fins lucrativos impedidas de receber recursos federais.', icon: 'building', color: C.blue }
      ], { y: 400, h: 460, size: 32, headSize: 56, step: 0.8 });
      return { body: h.svg + c.svg, source: 'Portal da Transparência, da CGU' };
    }
  },
  {
    id: '4.2-04', aula: '4.2', title: 'Onde a sanção vale',
    cue: 'BLOCO 3 — impedimento de licitar vale só no ente que puniu; inidoneidade vale para todos',
    render() {
      const h = heading('Leia a abrangência antes de concluir');
      let body = h.svg;
      const entes = ['União', 'Estado A', 'Estado B', 'Município C', 'Município D', 'Município E'];
      const panel = (x, title, sub, all, d) => {
        let s = anim('up', d, box({ x, y: 320, w: 800, h: 560, fill: C.s1, stroke: C.lineUi, sw: 2 }) + rich(title, { x: x + 40, y: 390, size: 40, font: 'display', w: 720 }).svg + rich(sub, { x: x + 40, y: 440, size: 26, fill: C.ink2, w: 720 }).svg);
        entes.forEach((e, i) => {
          const bx = x + 40 + (i % 3) * 245; const by = 500 + Math.floor(i / 3) * 170;
          const hit = all || i === 3;
          s += anim('pop', d + 0.6 + i * 0.12, `<rect x="${bx}" y="${by}" width="225" height="140" fill="${hit ? C.red : C.s3}" fill-opacity="${hit ? 0.9 : 1}"/>` + rich(e, { x: bx + 112, y: by + 80, size: 26, weight: 700, anchor: 'middle', fill: hit ? C.bg : C.ink2, w: 210 }).svg);
        });
        return s;
      };
      body += panel(X0, 'Impedimento de licitar', 'Vale só no ente que puniu. Aqui, o Município C.', false, 0.6);
      body += panel(1000, 'Declaração de inidoneidade', 'Vale para todos os entes.', true, 2.4);
      body += anim('up', 4.6, rich('Leia o {a|tipo de sanção}, a {a|abrangência} e o {a|período} antes de concluir qualquer coisa.', { x: X0, y: 950, size: 32, weight: 700, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '4.2-05', aula: '4.2', title: 'Estava punida no dia do contrato',
    cue: 'BLOCO 3 — “Essa empresa estava punida quando foi contratada?”',
    render() {
      const h = heading('Estava punida no dia do contrato?');
      let body = h.svg;
      const x0 = X0 + 40; const w = BW - 80; const y = 560;
      const t = (m) => x0 + (m / 30) * w; // meses a partir de jan/2022
      body += anim('draw', 0.5, `<path d="M${x0} ${y} H${x0 + w}" stroke="${C.lineUi}" stroke-width="4" fill="none" pathLength="1"/>`);
      ['2022', '2023', '2024', '2024'].slice(0, 3).forEach((yy, i) => { body += anim('fade', 0.7, rich(yy, { x: t(i * 12), y: y + 60, size: 24, font: 'mono', fill: C.ink3, w: 200 }).svg + `<path d="M${t(i * 12)} ${y - 10} V${y + 10}" stroke="${C.ink3}" stroke-width="3"/>`); });
      body += anim('grow', 1.2, `<rect x="${t(12.3)}" y="${y - 60}" width="${t(24.3) - t(12.3)}" height="40" fill="${C.red}" fill-opacity=".85"/>`, { t: 1.0 });
      body += anim('fade', 2.0, rich('sanção: 10/01/2023 a 10/01/2024', { x: t(12.3), y: y - 80, size: 26, font: 'mono', weight: 700, fill: C.red, w: 800 }).svg);
      const dot = (m, col, t1, t2, d) => anim('pop', d, `<circle cx="${t(m)}" cy="${y}" r="20" fill="${col}"/><path d="M${t(m)} ${y + 24} V${y + 150}" stroke="${col}" stroke-width="3"/>` + rich(t1, { x: t(m), y: y + 190, size: 28, weight: 700, anchor: 'middle', fill: col, w: 420 }).svg + rich(t2, { x: t(m), y: y + 230, size: 24, anchor: 'middle', fill: C.ink2, w: 420 }).svg);
      body += dot(16, C.red, 'Contrato em 02/05/2023', 'SANÇÃO VIGENTE NA DATA', 2.8);
      body += dot(26.5, C.ink2, 'Contrato em 15/03/2024', 'sanção já encerrada', 3.8);
      body += anim('up', 4.8, rich('Datas são fatos. O cadastro diz o início e o fim de cada sanção.', { x: X0, y: 950, size: 30, fill: C.ink2, w: BW }).svg);
      return { body, source: 'Exemplo fictício, como na planilha de cruzamento do curso' };
    }
  },
  {
    id: '4.2-06', aula: '4.2', title: 'Compare o preço unitário',
    cue: 'BLOCO 4 — PNCP: comparar o preço unitário de um mesmo item em contratos de órgãos diferentes',
    render() {
      const h = heading('O mesmo item, em quatro contratos', { sub: 'Não precisa de fonte, não precisa de vazamento. Precisa de paciência e de uma planilha.' });
      let body = h.svg;
      body += hbars([
        { name: 'Órgão A', v: 24, label: 'R$ 24' }, { name: 'Órgão B', v: 26, label: 'R$ 26' }, { name: 'Órgão C', v: 25, label: 'R$ 25' }, { name: 'Órgão D', v: 78, label: 'R$ 78', color: C.red }
      ], { x: X0 + 260, y: 380, w: 900, rowH: 96, labelW: 240, labelSize: 30, valueSize: 36, d0: 0.7, step: 0.4 }).svg;
      body += pill('3× a média', { x: X0 + 260 + 900 + 150, y: 380 + 3 * 96 + 36, size: 26, color: C.red, d: 2.6 }).svg;
      body += anim('up', 3.2, box({ x: X0, y: 790, w: 820, h: 170, fill: C.s1, stroke: C.amber, sw: 3 }) + label('Sobrepreço', { x: X0 + 30, y: 834, size: 24 }) + rich('Preço orçado ou contratado muito acima da referência de mercado.', { x: X0 + 30, y: 884, size: 28, weight: 500, w: 760 }).svg);
      body += anim('up', 3.8, box({ x: 980, y: 790, w: 820, h: 170, fill: C.s1, stroke: C.red, sw: 3 }) + label('Superfaturamento', { x: 1010, y: 834, size: 24, color: C.red }) + rich('O dano efetivo: pagar mais do que o devido. {r|Não troque um pelo outro.}', { x: 1010, y: 884, size: 28, weight: 500, w: 760 }).svg);
      return { body, source: 'Valores fictícios · Lei 14.133/2021, art. 6º' };
    }
  },
  {
    id: '4.2-07', aula: '4.2', title: 'Fracionamento',
    cue: 'BLOCO 5 — dividir uma compra grande em várias pequenas para ficar abaixo do limite da dispensa',
    render() {
      const h = heading('Fracionamento', { sub: 'Dividir uma compra grande em várias pequenas para ficar abaixo do limite em que a dispensa é permitida.' });
      let body = h.svg;
      const base = 900; const limY = 650;
      body += anim('draw', 0.6, `<path d="M${X0} ${limY} H${X1}" stroke="${C.amber}" stroke-width="4" stroke-dasharray="1" fill="none" pathLength="1"/>`) + anim('fade', 0.8, rich('limite da dispensa', { x: X1, y: limY - 16, size: 26, font: 'mono', weight: 700, fill: C.amber, anchor: 'end', w: 500 }).svg);
      body += anim('growY', 1.0, `<rect x="${X0 + 80}" y="400" width="300" height="${base - 400}" fill="${C.red}"/>`) + anim('fade', 1.4, rich('uma compra grande', { x: X0 + 230, y: base + 40, size: 26, font: 'mono', weight: 700, anchor: 'middle', fill: C.ink2, w: 400 }).svg);
      body += arrowH(X0 + 420, 700, X0 + 560, { d: 2.0, color: C.ink2, sw: 5 });
      for (let i = 0; i < 4; i++) {
        const x = X0 + 620 + i * 250;
        body += anim('growY', 2.4 + i * 0.3, `<rect x="${x}" y="${limY + 30}" width="200" height="${base - limY - 30}" fill="${C.s3}" stroke="${C.lineUi}" stroke-width="2"/>`);
      }
      body += anim('fade', 3.6, rich('quatro compras “pequenas”, cada uma abaixo do limite', { x: X0 + 620 + 475, y: base + 40, size: 26, font: 'mono', weight: 700, anchor: 'middle', fill: C.ink2, w: 1000 }).svg);
      body += anim('up', 4.2, rich('Os limites são atualizados todo ano por decreto. {a|Confira o valor do ano.}', { x: X0, y: 1000, size: 28, weight: 700, w: BW }).svg);
      return { body, kicker: undefined };
    }
  },
  {
    id: '4.2-08', aula: '4.2', title: 'Sinais de alerta nas contratações',
    cue: '[TELA: lista de sinais]',
    render() {
      const h = heading('Sinais de alerta');
      let body = h.svg;
      body += list([
        'Dispensa ou inexigibilidade repetida para o mesmo fornecedor.',
        'Fracionamento para ficar abaixo do limite da dispensa.',
        'Empresa aberta pouco antes do edital.',
        'Concorrentes com o mesmo endereço, o mesmo telefone ou sócios em comum.',
        'Preço unitário muito acima de contratos parecidos.'
      ], { y: 300, size: 38, gap: 28, step: 0.8, numbered: false, marker: 'q', w: BW }).svg;
      body += anim('up', 5.0, rich('Nenhum sinal prova nada sozinho. Cada um é uma pergunta. {a|Três juntos são uma hipótese.}', { x: X0, y: 920, size: 38, font: 'display', w: BW, lh: 1.12 }).svg);
      return { body };
    }
  },

  // ---------------------------------------------------------------- 4.3
  {
    id: '4.3-01', aula: '4.3', title: 'O assessor aparece no quadro de sócios',
    cue: 'ABERTURA — “O assessor não aparece no contrato. Aparece no quadro de sócios. E, às vezes, nem lá. Aparece a cunhada.”',
    render() {
      let body = docSheet({ x: X0, y: 250, w: 520, h: 600, head: true, title: 'Contrato 045/2025', lines: ['Contratante: Prefeitura', 'Contratada: Empresa X Ltda', 0.9, 0.7, 0.8, 0.6], d: 0.3 });
      body += anim('fade', 0.9, label('O assessor não aparece aqui', { x: X0, y: 230, size: 22, color: C.ink2 }));
      body += arrowH(X0 + 560, 550, 800, { d: 1.6, color: C.ink2 });
      body += anim('up', 2.0, box({ x: 820, y: 250, w: 980, h: 600, fill: C.s1, stroke: C.amber, sw: 3 }) + label('Quadro de sócios e administradores', { x: 860, y: 310, size: 24 }));
      body += anim('up', 2.6, rich('Sócio-administrador', { x: 860, y: 400, size: 24, font: 'mono', fill: C.ink3, w: 800 }).svg + rich('{s|O ASSESSOR DO VEREADOR}', { x: 860, y: 460, size: 40, font: 'display', w: 900, hlD: 3.6 }).svg);
      body += anim('up', 4.4, rich('Sócia-administradora', { x: 860, y: 580, size: 24, font: 'mono', fill: C.ink3, w: 800 }).svg + rich('{a|A CUNHADA}', { x: 860, y: 640, size: 56, font: 'display', w: 900 }).svg);
      body += anim('up', 5.2, rich('Às vezes, nem no quadro de sócios ele aparece.', { x: 860, y: 760, size: 30, fill: C.ink2, w: 900 }).svg);
      return { body, source: 'Exemplo ilustrativo' };
    }
  },
  {
    id: '4.3-02', aula: '4.3', title: 'A anatomia de uma empresa',
    cue: '[TELA: cartão de CNPJ com cada campo destacado]',
    render() {
      const cx = X0; const cy = 170; const cw = 860; const chh = 810;
      let body = anim('up', 0.2, box({ x: cx, y: cy, w: cw, h: chh, fill: C.paper, stroke: C.paper, sw: 0 }) + rich('COMPROVANTE DE INSCRIÇÃO E DE SITUAÇÃO CADASTRAL', { x: cx + 30, y: cy + 50, size: 20, font: 'mono', weight: 700, fill: C.pInk, w: cw - 60 }).svg);
      const fields = [
        ['CNPJ', '11.222.333/0001-86', 'O número da empresa na Receita Federal.'],
        ['Razão social · Nome fantasia', 'ALIMENTOS MODELO LTDA · Modelo Alimentos', 'O nome jurídico e o nome comercial.'],
        ['Abertura · Situação', '10/03/2025 · ATIVA', 'Ativa, suspensa, baixada.'],
        ['CNAE principal', '56.20-1-01 Fornecimento de alimentos preparados', 'O que a empresa declara fazer.'],
        ['Capital social', 'R$ 10.000,00', 'Quanto os sócios declararam ter investido.'],
        ['Endereço', 'Rua Exemplo, 100, sala 2 · Cidade Exemplo', 'Confira no Street View.'],
        ['QSA', 'Fulano de Tal — sócio-administrador', 'O quadro de sócios. {a|Aqui moram as surpresas.}']
      ];
      fields.forEach(([k, v, s], i) => {
        const y = cy + 110 + i * 100; const d = 0.8 + i * 0.75;
        body += anim('fade', 0.5, rich(k.toUpperCase(), { x: cx + 30, y, size: 18, font: 'mono', weight: 700, fill: C.pInk2, w: cw - 60 }).svg + rich(v, { x: cx + 30, y: y + 38, size: 28, font: 'mono', weight: 700, fill: C.pInk, w: cw - 60 }).svg);
        body += anim('grow', d, `<rect x="${cx + 18}" y="${y - 26}" width="${cw - 36}" height="84" fill="none" stroke="${C.amber}" stroke-width="4"/>`, { t: 0.4 });
        body += anim('left', d + 0.1, `<path d="M${cx + cw + 10} ${y + 16} H1040" stroke="${C.amber}" stroke-width="3"/>` + rich(s, { x: 1060, y: y + 24, size: 28, weight: 700, w: 740 }).svg);
      });
      return { body, source: 'Cartão fictício' };
    }
  },
  {
    id: '4.3-03', aula: '4.3', title: 'Nome e dígitos do CPF',
    cue: 'BLOCO 2 — o CPF do sócio aparece mascarado; uma pessoa se identifica por nome mais os dígitos visíveis',
    render() {
      const h = heading('Nome sozinho não identifica ninguém', { sub: 'Nos dados abertos da Receita, o CPF do sócio vem mascarado. Só os dígitos do meio ficam visíveis.' });
      let body = h.svg;
      body += anim('pop', 0.9, rich('***.{a|123.456}-**', { x: W / 2, y: 470, size: 110, font: 'mono', weight: 700, anchor: 'middle', w: 1600 }).svg);
      const card = (x, name, cpf, col, d, ok) => anim('up', d, box({ x, y: 580, w: 780, h: 220, fill: C.s1, stroke: col, sw: 3 }) + rich(name, { x: x + 36, y: 660, size: 44, font: 'display', w: 700 }).svg + rich(cpf, { x: x + 36, y: 740, size: 44, font: 'mono', weight: 700, fill: col, w: 700 }).svg) + badge(ok ? 'ok' : 'no', { x: x + 700, y: 600, d: d + 0.4 });
      body += card(X0, 'JOSÉ DA SILVA', '***.123.456-**', C.green, 2.0, true);
      body += card(1020, 'JOSÉ DA SILVA', '***.987.654-**', C.red, 2.8, false);
      body += anim('up', 3.8, rich('Mesmo nome, outra pessoa. {a|Nome + dígitos visíveis do CPF.} Nunca só pelo nome.', { x: X0, y: 900, size: 36, weight: 700, w: BW }).svg);
      return { body, source: 'Exemplo fictício' };
    }
  },
  {
    id: '4.3-04', aula: '4.3', title: 'CNPJ é texto',
    cue: 'BLOCO 2 — “Na planilha, trate CNPJ sempre como texto. Número come o zero à esquerda. E não aceita letra.”',
    render() {
      const h = heading('Na planilha, CNPJ é {a|texto}');
      let body = h.svg;
      const row = (y, lab, input, out, ok, d) => anim('up', d, rich(lab, { x: X0, y, size: 26, font: 'mono', weight: 700, fill: ok ? C.green : C.red, upper: true, w: 600 }).svg
        + box({ x: X0, y: y + 24, w: 620, h: 96, fill: C.s2, stroke: C.lineUi, sw: 2 }) + rich(input, { x: X0 + 30, y: y + 88, size: 40, font: 'mono', weight: 700, w: 580 }).svg)
        + arrowH(X0 + 650, y + 72, X0 + 800, { d: d + 0.6, color: ok ? C.green : C.red })
        + anim('pop', d + 1.0, box({ x: X0 + 830, y: y + 24, w: 850, h: 96, fill: C.s1, stroke: ok ? C.green : C.red, sw: 3 }) + rich(out, { x: X0 + 860, y: y + 88, size: 40, font: 'mono', weight: 700, w: 800 }).svg);
      body += row(300, 'Como número', '01234567000189', '{r|1234567000189}  {d|← comeu o zero}', false, 0.6);
      body += row(480, 'Como texto', '01234567000189', '{g|01234567000189}', true, 2.0);
      body += row(660, 'CNPJ com letras, como número', '12ABC34501DE35', '{r|#erro}  {d|← número não aceita letra}', false, 3.4);
      body += anim('up', 5.0, rich('A Receita está implantando o CNPJ com letras e números para novas inscrições.', { x: X0, y: 900, size: 30, fill: C.ink2, w: BW }).svg);
      return { body, source: 'Exemplos de formato' };
    }
  },
  {
    id: '4.3-05', aula: '4.3', title: 'A foto e o filme',
    cue: 'BLOCO 3 — “O cadastro da Receita mostra a foto de hoje. A junta comercial mostra o filme.”',
    render() {
      let body = anim('up', 0.3, box({ x: X0, y: 220, w: 460, h: 420, fill: C.s1, stroke: C.ink2, sw: 3 }) + icon('camera', { x: X0 + 150, y: 290, s: 160, color: C.ink2, sw: 4 })
        + rich('Receita Federal', { x: X0 + 230, y: 540, size: 34, font: 'display', anchor: 'middle', w: 440 }).svg + rich('a foto de hoje', { x: X0 + 230, y: 590, size: 28, fill: C.ink2, anchor: 'middle', w: 440 }).svg);
      const frames = ['Abertura', 'Entra um sócio', 'Capital muda', 'Sai um sócio', 'Muda o endereço'];
      const fx = 660; const fy = 260;
      body += anim('grow', 1.0, `<rect x="${fx}" y="${fy}" width="${frames.length * 228 + 12}" height="300" fill="#111"/>` + Array.from({ length: 24 }, (_, i) => `<rect x="${fx + 12 + i * 48}" y="${fy + 12}" width="24" height="16" fill="${C.s3}"/><rect x="${fx + 12 + i * 48}" y="${fy + 272}" width="24" height="16" fill="${C.s3}"/>`).join(''), { t: 0.8 });
      frames.forEach((t, i) => {
        const x = fx + 12 + i * 228;
        body += anim('pop', 1.6 + i * 0.4, `<rect x="${x}" y="${fy + 44}" width="216" height="212" fill="${i === 3 ? C.red : C.s2}"/>` + rich(t, { x: x + 108, y: fy + 160, size: 26, weight: 700, anchor: 'middle', fill: i === 3 ? C.bg : C.ink, w: 190 }).svg);
      });
      body += anim('fade', 1.2, rich('Junta comercial: {a|o filme}', { x: fx, y: fy + 360, size: 34, font: 'display', w: 1100 }).svg + rich('Contrato social e alterações: quem entrou, quem saiu, quando o capital mudou, quando o endereço mudou.', { x: fx, y: fy + 410, size: 26, fill: C.ink2, w: 1140 }).svg);
      body += anim('up', 4.2, rich('O sócio que saiu da empresa um mês antes do contrato {a|continua sendo uma pergunta}.', { x: X0, y: 860, size: 40, font: 'display', w: BW, lh: 1.12 }).svg);
      return { body };
    }
  },
  {
    id: '4.3-06', aula: '4.3', title: 'Capital de dez mil, contrato de cinco milhões',
    cue: 'BLOCO 4 — sinal de alerta: capital social de R$ 10 mil e contrato de R$ 5 milhões',
    render() {
      const side = Math.sqrt(5000000 / 10000) * 30;
      let body = anim('pop', 0.6, `<rect x="${X0 + 40}" y="${900 - 30}" width="30" height="30" fill="${C.amber}"/>`) + anim('fade', 0.9, rich('Capital social', { x: X0 + 40, y: 820, size: 28, font: 'mono', weight: 700, fill: C.amber, w: 400 }).svg + rich('R$ 10 mil', { x: X0 + 40, y: 780, size: 56, font: 'display', w: 500 }).svg);
      body += anim('grow', 1.8, `<rect x="${X1 - side}" y="${900 - side}" width="${side}" height="${side}" fill="${C.red}" fill-opacity=".9"/>`, { t: 1.6 });
      body += anim('fade', 3.2, rich('Contrato', { x: X1 - side + 40, y: 900 - side + 80, size: 32, font: 'mono', weight: 700, fill: C.bg, w: 500 }).svg + rich('R$ 5 milhões', { x: X1 - side + 40, y: 900 - side + 160, size: 72, font: 'display', fill: C.bg, w: side - 60 }).svg);
      body += anim('up', 4.2, rich('As áreas estão na proporção: {a|500 vezes}.', { x: X0 + 40, y: 300, size: 40, font: 'display', w: 900 }).svg + rich('Não prova nada sozinho. É uma pergunta para a empresa e para o órgão.', { x: X0 + 40, y: 370, size: 30, fill: C.ink2, w: 780 }).svg);
      return { body };
    }
  },
  {
    id: '4.3-07', aula: '4.3', title: 'Sinais de alerta na empresa',
    cue: '[TELA: lista de sinais]',
    render() {
      const h = heading('Sinais de alerta na empresa');
      const l = list([
        { t: 'Capital social de R$ 10 mil e contrato de R$ 5 milhões' },
        { t: 'CNAE sem relação com o objeto', sub: 'Empresa de eventos fornecendo merenda.' },
        { t: 'Endereço residencial, sala virtual ou terreno baldio', sub: 'Confira no Street View. Depois, se for seguro, vá até lá.' },
        { t: 'Empresa aberta semanas antes do edital' },
        { t: 'Concorrentes da mesma licitação com sócios em comum', sub: 'Pode indicar conluio: concorrentes que fingem disputar.' },
        { t: 'Sócio sem renda compatível com a empresa', sub: 'Na gíria, laranja.' }
      ], { y: 290, size: 36, subSize: 26, gap: 22, step: 0.8, numbered: false, marker: 'q' });
      return { body: h.svg + l.svg };
    }
  },
  {
    id: '4.3-08', aula: '4.3', title: 'O laranja também é gente',
    cue: 'BLOCO 5 — “Normalmente, a história é quem usou o laranja. Não o laranja.”',
    render() {
      let body = anim('pop', 0.3, `<circle cx="1480" cy="480" r="230" fill="${C.amber}"/><path d="M1480 250 C1500 200 1560 190 1590 210" stroke="${C.green}" stroke-width="16" fill="none" stroke-linecap="round"/>` + icon('person', { x: 1380, y: 380, s: 200, color: C.bg, sw: 6 }));
      body += anim('up', 0.4, rich('O laranja também é gente.', { x: X0, y: 300, size: 64, font: 'display', w: 1000, lh: 1.05 }).svg);
      body += anim('up', 1.2, rich('Muitas vezes é vítima. Emprestou o nome por medo, por pouco dinheiro ou sem saber. Às vezes nem sabe que é sócio.', { x: X0, y: 460, size: 32, fill: C.ink2, w: 960 }).svg);
      body += anim('up', 2.2, rich('A história é {a|quem usou o laranja}. Não o laranja.', { x: X0, y: 650, size: 40, font: 'display', w: 1000, lh: 1.1 }).svg);
      body += anim('up', 3.2, rich('Empresa pequena não é empresa de fachada. Empresa nova não é empresa fantasma.', { x: X0, y: 860, size: 32, weight: 700, w: BW }).svg);
      return { body };
    }
  },

  // ---------------------------------------------------------------- 4.4
  {
    id: '4.4-01', aula: '4.4', title: 'Patrimônio que cresce dez vezes',
    cue: 'ABERTURA — “Patrimônio que cresce dez vezes entre duas eleições não prova crime. Mas é uma ótima pergunta.”',
    render() {
      let body = bars([
        { name: 'Eleição A', v: 1, label: '1×', color: C.ink2 },
        { name: 'Eleição B', v: 10, label: '10×' }
      ], { x: X0 + 1000, w: 640, y: 900, h: 600, gap: 140, d0: 0.8, step: 0.9, valueSize: 72 }).svg;
      body += anim('up', 0.3, rich('Patrimônio que cresce dez vezes entre duas eleições', { x: X0, y: 330, size: 54, font: 'display', w: 880, lh: 1.08 }).svg);
      body += anim('up', 1.6, rich('não prova crime.', { x: X0, y: 580, size: 54, font: 'display', fill: C.ink2, w: 880 }).svg);
      body += anim('up', 2.6, rich('{a|Mas é uma ótima pergunta.}', { x: X0, y: 690, size: 54, font: 'display', w: 880 }).svg);
      return { body };
    }
  },
  {
    id: '4.4-02', aula: '4.4', title: 'A ficha do candidato',
    cue: 'BLOCO 1 — DivulgaCandContas: dados, bens, certidões e prestação de contas',
    render() {
      const h = heading('A ficha do candidato no TSE', { sub: 'DivulgaCandContas: candidatos de 2026 e das eleições anteriores.' });
      const c = columns([
        { head: 'Candidatura', body: 'Dados pessoais e de candidatura.', icon: 'person' },
        { head: 'Bens', body: 'A declaração de bens.', icon: 'house' },
        { head: 'Certidões', body: 'Criminais, da Justiça Eleitoral, Federal e Estadual. Lei 9.504, art. 11, §1º, VII.', icon: 'doc' },
        { head: 'Contas', body: 'Quanto entrou, de quem. Quanto saiu, para quem.', icon: 'money' }
      ], { y: 400, h: 380, size: 28, headSize: 36, step: 0.6, gap: 28 });
      let body = h.svg + c.svg;
      body += anim('up', 3.4, rich('Doações em dinheiro aparecem em até {a|72 horas} depois de recebidas (art. 28, §4º, I). Dá para acompanhar a campanha quase ao vivo.', { x: X0, y: 900, size: 30, weight: 700, w: BW }).svg);
      return { body, source: 'Lei 9.504/1997, a Lei das Eleições' };
    }
  },
  {
    id: '4.4-03', aula: '4.4', title: 'Bens declarados, três cuidados',
    cue: 'BLOCO 2 — valor de aquisição, declarado pelo próprio candidato, sem o que está em nome de terceiros',
    render() {
      const h = heading('Antes de fazer a conta, três cuidados');
      const l = list([
        { t: 'O valor é o declarado, normalmente o de aquisição.', sub: 'Uma casa comprada em 2002 aparece pelo preço de 2002. Patrimônio declarado não é patrimônio de mercado.' },
        { t: 'Quem declara é o próprio candidato.', sub: 'O TSE registra, não audita.' },
        { t: 'O que está em nome de parentes, empresas ou terceiros não aparece.', sub: 'A ausência de um bem na declaração é, às vezes, a informação.' }
      ], { y: 320, size: 42, subSize: 30, gap: 44, step: 1.2 });
      return { body: h.svg + l.svg };
    }
  },
  {
    id: '4.4-04', aula: '4.4', title: 'Os dois cruzamentos da campanha',
    cue: '[TELA: esquema dos dois cruzamentos, com setas]',
    render() {
      const h = heading('Seguir o dinheiro da campanha');
      let body = h.svg;
      body += anim('fade', 0.5, label('1 · Doadores contra fornecedores do governo', { x: X0, y: 320, size: 24 }));
      body += node({ x: 300, y: 430, t: 'Doador', sub: 'pessoa física', w: 320, h: 130, d: 0.8, color: C.ink2 });
      body += node({ x: 960, y: 430, t: 'Empresa', sub: 'fornecedora do governo', w: 360, h: 130, d: 1.4, color: C.ink2 });
      body += node({ x: 1580, y: 430, t: 'Contrato', sub: 'depois da eleição', w: 360, h: 130, d: 2.0, color: C.amber });
      body += edge(460, 430, 780, 430, { lab: 'sócio de', d: 1.2, color: C.amber });
      body += edge(1140, 430, 1400, 430, { lab: 'ganhou', d: 1.8, color: C.amber });
      body += anim('fade', 2.8, label('2 · Fornecedores de campanha contra contratos públicos', { x: X0, y: 600, size: 24 }));
      body += node({ x: 300, y: 710, t: 'Gráfica', sub: 'fez os santinhos em setembro', w: 400, h: 140, d: 3.0, color: C.ink2 });
      body += node({ x: 960, y: 710, t: 'Campanha', w: 320, d: 3.4, color: C.ink2 });
      body += node({ x: 1580, y: 710, t: 'Prefeitura', sub: 'a gráfica virou fornecedora em março?', w: 400, h: 140, d: 3.8, color: C.amber });
      body += edge(500, 710, 800, 710, { lab: 'forneceu a', d: 3.2, color: C.amber });
      body += arrowPath('M300 780 C300 870 1580 870 1580 780', { d: 4.2, color: C.amber, end: [1580, 782, -90] });
      body += anim('fade', 4.6, rich('Desde 2015, empresas não podem doar para campanhas (STF, ADI 4650). O dinheiro vem de pessoas físicas. Inclusive de sócios de empresas.', { x: X0, y: 930, size: 24, font: 'mono', fill: C.ink2, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '4.4-05', aula: '4.4', title: 'Coincidência documentada',
    cue: 'BLOCO 3 — “Nenhum desses cruzamentos prova troca de favores. Mostra coincidência documentada.”',
    render() {
      const s = statement('Nenhum desses cruzamentos prova troca de favores.', { y: 380, size: 70, d: 0.2 });
      let body = s.svg;
      body += anim('up', 1.4, rich('Mostra {a|coincidência documentada}.', { x: W / 2, y: s.bottom + 70, size: 52, font: 'display', anchor: 'middle', w: 1600 }).svg);
      body += anim('up', 2.4, rich('E coincidência documentada é o começo de uma pergunta ao candidato.', { x: W / 2, y: s.bottom + 170, size: 36, fill: C.ink2, anchor: 'middle', w: 1600 }).svg);
      return { body };
    }
  },
  {
    id: '4.4-06', aula: '4.4', title: 'A cota parlamentar',
    cue: 'BLOCO 4 — nota fiscal do posto, da gráfica, do aluguel de carro, com o CNPJ do fornecedor',
    render() {
      let body = docSheet({ x: X0, y: 220, w: 640, h: 700, head: false, title: 'Nota fiscal · cota parlamentar', lines: [{ t: 'Fornecedor: Posto Exemplo Ltda', size: 26 }, { t: 'CNPJ: {h|44.555.666/0001-86}', size: 26, font: 'mono', hlD: 1.6 }, { t: 'Descrição: combustível', size: 26 }, { t: 'Valor: R$ 1.850,00', size: 26 }, 0.8, 0.6, 0.9], d: 0.3 });
      body += arrowH(X0 + 690, 470, 1000, { d: 2.2, color: C.amber, sw: 5 });
      body += anim('pop', 2.6, box({ x: 1020, y: 380, w: 780, h: 180, fill: C.s1, stroke: C.amber, sw: 3 }) + icon('search', { x: 1050, y: 440, s: 60, color: C.amber, sw: 4 }) + rich('Consulta de CNPJ', { x: 1130, y: 460, size: 40, font: 'display', w: 640 }).svg + rich('que você já sabe fazer (aula 4.3)', { x: 1130, y: 510, size: 26, fill: C.ink2, w: 640 }).svg);
      body += anim('up', 0.4, rich('A cota é uma mina.', { x: 1020, y: 300, size: 56, font: 'display', w: 780 }).svg);
      body += anim('up', 3.6, rich('Câmara e Senado publicam a cota parlamentar, presença, votações e proposições em dados abertos.', { x: 1020, y: 660, size: 30, weight: 500, w: 780 }).svg);
      body += anim('up', 4.4, rich('Assembleias e câmaras municipais têm transparência pior. {a|Para elas, a ferramenta é a LAI.}', { x: 1020, y: 820, size: 30, weight: 700, w: 780 }).svg);
      return { body, source: 'Nota fictícia' };
    }
  },
  {
    id: '4.4-07', aula: '4.4', title: 'A lista dos tribunais de contas',
    cue: 'BLOCO 5 — gestores com contas rejeitadas por irregularidade insanável, em decisão irrecorrível',
    warn: 'As regras de inelegibilidade mudaram em 2025. Conferir a redação atual antes de gravar.',
    render() {
      const h = heading('A lista que interessa em ano eleitoral');
      let body = h.svg;
      body += flow([
        { t: 'Tribunais de contas', sub: 'Julgam as contas de quem gasta dinheiro público. Acórdãos na internet.' },
        { t: 'Contas rejeitadas', sub: 'Por irregularidade insanável, em decisão irrecorrível.' },
        { t: 'Justiça Eleitoral', sub: 'Recebe a lista. Lei 9.504, art. 11, §5º.' }
      ], { y: 320, h: 300, step: 1.0, size: 40, subSize: 26 }).svg;
      body += anim('up', 3.6, box({ x: X0, y: 700, w: BW, h: 200, fill: C.s1, stroke: C.red, sw: 3 }) + label('Antes de escrever “inelegível”', { x: X0 + 30, y: 746, size: 24, color: C.red })
        + rich('Rejeição de contas pode ter efeito eleitoral, pela Lei da Ficha Limpa. Mas as regras mudaram em 2025. {a|Confira a redação atual e a decisão da Justiça Eleitoral no caso concreto.}', { x: X0 + 30, y: 800, size: 30, weight: 500, w: BW - 60 }).svg);
      return { body };
    }
  },

  // ---------------------------------------------------------------- 4.5
  {
    id: '4.5-01', aula: '4.5', title: 'O avião do cunhado',
    cue: 'ABERTURA — “O avião não está no nome do político. Está no nome da empresa do cunhado. E o registro de aeronaves é público.”',
    render() {
      const px = 360; const py = 330;
      let body = anim('left', 0.3, `<path d="M${px} ${py + 80} L${px + 620} ${py + 40} C${px + 700} ${py + 36} ${px + 720} ${py + 90} ${px + 640} ${py + 110} L${px + 90} ${py + 150} Z" fill="${C.ink}"/>`
        + `<path d="M${px + 250} ${py + 90} L${px + 390} ${py - 70} L${px + 440} ${py - 70} L${px + 380} ${py + 80} Z" fill="${C.ink2}"/><path d="M${px + 280} ${py + 130} L${px + 400} ${py + 270} L${px + 450} ${py + 270} L${px + 380} ${py + 120} Z" fill="${C.ink2}"/><path d="M${px + 20} ${py + 90} L${px - 40} ${py - 20} L${px + 10} ${py - 20} L${px + 90} ${py + 80} Z" fill="${C.ink2}"/>`
        + rich('PR-ABC', { x: px + 470, y: py + 104, size: 38, font: 'mono', weight: 700, fill: C.bg, anchor: 'middle', w: 300 }).svg, { t: 1.0 });
      body += anim('pop', 1.4, `<rect x="${px + 380}" y="${py + 60}" width="180" height="60" fill="none" stroke="${C.amber}" stroke-width="5"/>`);
      body += arrowPath(`M${px + 470} ${py + 130} C${px + 470} 640 ${px + 600} 680 1040 680`, { d: 1.8, color: C.amber, end: [1040, 680, 0] });
      body += anim('up', 2.4, box({ x: 1060, y: 560, w: 740, h: 300, fill: C.s1, stroke: C.amber, sw: 3 }) + label('RAB · Registro Aeronáutico Brasileiro', { x: 1090, y: 606, size: 22 })
        + rich('Proprietário', { x: 1090, y: 670, size: 24, font: 'mono', fill: C.ink3, w: 680 }).svg + rich('{a|Empresa do cunhado Ltda}', { x: 1090, y: 720, size: 38, font: 'display', w: 680 }).svg
        + rich('Operador', { x: 1090, y: 790, size: 24, font: 'mono', fill: C.ink3, w: 680 }).svg + rich('—', { x: 1090, y: 834, size: 30, weight: 700, w: 680 }).svg);
      body += anim('up', 0.4, rich('O avião não está no nome do político.', { x: X0, y: 200, size: 52, font: 'display', w: BW }).svg);
      body += anim('up', 3.6, rich('E o registro de aeronaves é {a|público}. A matrícula, pintada na fuselagem, você acha em fotos e em rastreadores de voo.', { x: X0, y: 925, size: 30, weight: 500, w: BW }).svg);
      return { body, source: 'Exemplo fictício · consulta pública do RAB, da ANAC' };
    }
  },
  {
    id: '4.5-02', aula: '4.5', title: 'Onde procurar processo',
    cue: 'BLOCO 1 — consulta dos tribunais, DataJud e buscadores privados',
    render() {
      const h = heading('Onde procurar processo', { sub: 'Processo judicial é, em regra, público. Constituição, art. 93, IX.' });
      const c = columns([
        { head: 'Consulta do tribunal', body: 'O sistema oficial. Uns buscam por nome, CPF ou CNPJ da parte. Outros, só por número ou advogado.', icon: 'gavel', color: C.green, foot: 'Para achar o processo de alguém.' },
        { head: 'DataJud, do CNJ', body: 'API pública com metadados dos processos do país: classe, assunto, movimentações.', icon: 'globe', color: C.blue, foot: 'Para medir volume e padrão.' },
        { head: 'Buscadores privados', body: 'Jusbrasil, Escavador. Úteis para começar. Erram homônimo, erram fase, erram tudo o que um robô pode errar.', icon: 'search', color: C.amber, foot: 'Confira sempre no oficial.' }
      ], { y: 400, h: 500, size: 30, headSize: 36, step: 0.9 });
      return { body: h.svg + c.svg };
    }
  },
  {
    id: '4.5-03', aula: '4.5', title: 'Como ler um processo',
    cue: 'BLOCO 2 — capa, movimentações e decisões; “Decisão proferida” não diz o que foi decidido',
    render() {
      const h = heading('Como ler um processo');
      let body = h.svg;
      body += anim('up', 0.6, box({ x: X0, y: 290, w: 980, h: 640, fill: C.s1, stroke: C.lineUi, sw: 2 }) + `<rect x="${X0}" y="290" width="980" height="150" fill="${C.s2}"/>`
        + label('Capa', { x: X0 + 30, y: 330, size: 22 }) + rich('Classe: ação civil · Assunto: improbidade · Partes · Valor da causa', { x: X0 + 30, y: 390, size: 26, weight: 700, w: 920 }).svg
        + label('Movimentações', { x: X0 + 30, y: 490, size: 22 }));
      const mv = [['12/05/2026', 'Decisão proferida'], ['03/05/2026', 'Conclusos para decisão'], ['20/04/2026', 'Juntada de petição'], ['02/04/2026', 'Distribuído por sorteio']];
      mv.forEach(([d0, t], i) => {
        body += anim('left', 1.2 + i * 0.3, rich(d0, { x: X0 + 30, y: 550 + i * 80, size: 26, font: 'mono', fill: C.ink3, w: 200 }).svg + rich(t, { x: X0 + 260, y: 550 + i * 80, size: 30, weight: 700, w: 700 }).svg);
      });
      body += anim('draw', 2.8, `<rect x="${X0 + 16}" y="508" width="948" height="64" fill="none" stroke="${C.red}" stroke-width="4" pathLength="1"/>`);
      body += anim('up', 3.4, rich('“Decisão proferida” {r|não diz o que foi decidido}.', { x: 1160, y: 440, size: 40, font: 'display', w: 640, lh: 1.1 }).svg);
      body += docSheet({ x: 1160, y: 560, w: 640, h: 370, head: false, title: 'A decisão', lines: [{ t: '{h|Recebo a petição inicial.}', size: 28, weight: 700, hlD: 5.2 }, 0.9, 0.7, 0.8], d: 4.4 });
      body += anim('fade', 4.2, label('Abra a decisão', { x: 1160, y: 545, size: 22, color: C.green }));
      return { body, source: 'Exemplo fictício' };
    }
  },
  {
    id: '4.5-04', aula: '4.5', title: 'Segredo de justiça',
    cue: 'BLOCO 3 — casos de família, de menores, algumas investigações criminais; não tente contornar',
    render() {
      let body = anim('pop', 0.3, icon('lock', { x: 1300, y: 250, s: 380, color: C.amber, sw: 4 }));
      body += anim('up', 0.4, rich('Segredo de justiça', { x: X0, y: 300, size: 64, font: 'display', w: 1000 }).svg);
      body += anim('up', 1.0, rich('Casos de família, de menores, algumas investigações criminais. Não aparecem na consulta.', { x: X0, y: 400, size: 32, fill: C.ink2, w: 1000 }).svg);
      body += list([
        { t: 'Não tente contornar.', mark: 'no' },
        { t: 'Nada de pedir senha emprestada a advogado.', mark: 'no' },
        { t: 'Nada de “dar um jeito”.', mark: 'no' }
      ], { y: 530, w: 1000, size: 38, gap: 30, numbered: false, marker: 'no', d0: 1.8, step: 0.6 }).svg;
      body += anim('up', 4.0, rich('Chegou um documento sob segredo por uma fonte? {a|Passe pelo advogado antes de publicar.}', { x: X0, y: 900, size: 34, weight: 700, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '4.5-05', aula: '4.5', title: 'A matrícula do imóvel',
    cue: 'BLOCO 4 — a matrícula é a biografia do imóvel; qualquer pessoa pode pedir certidão sem informar o motivo',
    warn: 'Conferir antes de gravar quais buscas o serviço eletrônico dos registradores permite (por CPF ou CNPJ).',
    render() {
      let body = docSheet({ x: X0, y: 200, w: 820, h: 740, head: true, title: 'Matrícula nº 00.000 · Registro de Imóveis', lines: [
        { t: 'R.1 · Compra e venda: adquirido por A, de B, por R$ [valor], em [data].', size: 25 },
        { t: 'R.2 · Hipoteca em favor do banco C.', size: 25 },
        { t: 'AV.3 · Penhora determinada no processo [número].', size: 25 },
        { t: 'R.4 · Usufruto instituído em favor de D.', size: 25 }, 0.8, 0.6], d: 0.3 });
      body += anim('up', 0.6, rich('A matrícula é a {a|biografia do imóvel}.', { x: 1040, y: 300, size: 52, font: 'display', w: 760, lh: 1.08 }).svg);
      body += anim('up', 1.4, rich('Quem comprou, de quem, quando, por quanto. Se tem hipoteca, penhora ou usufruto.', { x: 1040, y: 470, size: 30, fill: C.ink2, w: 760 }).svg);
      body += anim('up', 2.6, rich('Qualquer pessoa pode pedir certidão, {a|sem informar o motivo}. Paga-se a taxa.', { x: 1040, y: 640, size: 32, weight: 700, w: 760 }).svg);
      body += anim('up', 3.4, rich('Lei de Registros Públicos, art. 17 · pedido pela internet, no serviço dos registradores ligado ao ONR · imóvel rural: SIGEF, do Incra, e CAR', { x: 1040, y: 800, size: 24, font: 'mono', fill: C.ink3, w: 760 }).svg);
      return { body, source: 'Matrícula fictícia' };
    }
  },
  {
    id: '4.5-06', aula: '4.5', title: 'O que não é público',
    cue: 'BLOCO 5 — cadastro de veículos, dados bancários, dados fiscais; não compre base vazada',
    render() {
      const h = heading('O que {r|não} é público');
      let body = h.svg;
      ['Cadastro de veículos', 'Dados bancários', 'Dados fiscais'].forEach((t, i) => {
        const x = X0 + i * 570;
        body += anim('pop', 0.6 + i * 0.3, box({ x, y: 300, w: 540, h: 160, fill: C.s1, stroke: C.red, sw: 3 }) + icon('lock', { x: x + 30, y: 350, s: 60, color: C.red, sw: 4 }) + rich(t, { x: x + 110, y: 396, size: 34, font: 'display', w: 400 }).svg);
      });
      body += list([
        { t: 'Não compre base vazada.', mark: 'no' },
        { t: 'Não peça favor a quem tem acesso.', mark: 'no', sub: 'Quem entrega dado sigiloso pode responder por violação de sigilo. E você pode ir junto.' }
      ], { y: 560, size: 40, subSize: 28, numbered: false, marker: 'no', d0: 2.0, step: 0.8 }).svg;
      body += anim('up', 3.8, rich('Além disso, a matéria inteira vira o método, e não o fato. {a|O advogado do outro lado vai adorar.}', { x: X0, y: 900, size: 34, weight: 700, w: BW }).svg);
      return { body };
    }
  },

  // ---------------------------------------------------------------- 4.6
  {
    id: '4.6-01', aula: '4.6', title: 'Duas planilhas sem graça',
    cue: 'ABERTURA — “Duas planilhas sem graça, cruzadas, viram manchete.”',
    render() {
      let body = '';
      const mini = (x, y, t, col, d) => {
        let g = `<rect x="${x}" y="${y}" width="620" height="360" fill="${C.s1}" stroke="${col}" stroke-width="3"/><rect x="${x}" y="${y}" width="620" height="56" fill="${col}"/>` + rich(t, { x: x + 24, y: y + 38, size: 24, font: 'mono', weight: 700, fill: C.bg, w: 580 }).svg;
        for (let r = 0; r < 6; r++) g += `<rect x="${x + 24}" y="${y + 84 + r * 44}" width="${260}" height="14" fill="${C.lineUi}"/><rect x="${x + 320}" y="${y + 84 + r * 44}" width="${200 * (0.5 + (r % 3) / 4)}" height="14" fill="${C.line}"/>`;
        return anim('up', d, g);
      };
      body += mini(X0, 200, 'Contratos da prefeitura', C.ink2, 0.3);
      body += mini(X1 - 620, 200, 'Sanções da CGU', C.ink2, 0.7);
      body += anim('fade', 0.9, rich('chata', { x: X0 + 310, y: 610, size: 30, font: 'mono', fill: C.ink3, anchor: 'middle', w: 300 }).svg + rich('chata', { x: X1 - 310, y: 610, size: 30, font: 'mono', fill: C.ink3, anchor: 'middle', w: 300 }).svg);
      body += arrowPath(`M${X0 + 310} 640 C${X0 + 310} 740 ${W / 2 - 200} 740 ${W / 2 - 40} 760`, { d: 1.6, color: C.amber, end: [W / 2 - 40, 760, 10] });
      body += arrowPath(`M${X1 - 310} 640 C${X1 - 310} 740 ${W / 2 + 200} 740 ${W / 2 + 40} 760`, { d: 1.6, color: C.amber, end: [W / 2 + 40, 760, 170] });
      body += anim('pop', 2.4, `<rect x="${W / 2 - 720}" y="780" width="1440" height="160" fill="${C.amber}"/>` + rich('Empresas punidas que continuam recebendo', { x: W / 2, y: 856, size: 46, font: 'display', fill: C.bg, anchor: 'middle', w: 1400 }).svg + rich('isso é matéria', { x: W / 2, y: 908, size: 28, font: 'mono', weight: 700, fill: C.bg, anchor: 'middle', w: 600 }).svg);
      return { body };
    }
  },
  {
    id: '4.6-02', aula: '4.6', title: 'A chave do cruzamento',
    cue: '[TELA: duas tabelas com a coluna em comum destacada]',
    render() {
      const h = heading('Cruzar é juntar duas bases por uma {a|chave}');
      let body = h.svg;
      const tb = (x, title, cols, d, keyCol) => {
        let g = rich(title, { x, y: 310, size: 24, font: 'mono', weight: 700, fill: C.ink2, upper: true, w: 700 }).svg;
        cols.forEach((c, j) => { g += `<rect x="${x + j * 240}" y="330" width="232" height="60" fill="${j === keyCol ? C.amber : C.s3}"/>` + rich(c, { x: x + j * 240 + 16, y: 370, size: 24, font: 'mono', weight: 700, fill: j === keyCol ? C.bg : C.ink2, w: 210 }).svg; for (let r = 0; r < 4; r++) g += `<rect x="${x + j * 240}" y="${396 + r * 58}" width="232" height="52" fill="${j === keyCol ? 'rgba(255,184,0,.18)' : C.s1}"/>`; });
        return anim('up', d, g);
      };
      body += tb(X0, 'Contratos', ['CNPJ', 'Órgão', 'Valor'], 0.5, 0);
      body += tb(1080, 'Sanções', ['CNPJ', 'Tipo'], 1.0, 0);
      body += arrowPath(`M${X0 + 116} 640 C${X0 + 116} 700 1196 700 1196 640`, { d: 1.8, color: C.amber, end: [1196, 642, -90] });
      const keys = [['CNPJ', 'A melhor chave. Único, oficial, não muda.', 'ok'], ['Nome + dígitos visíveis do CPF', 'Para pessoas. O CPF vem mascarado.', 'q'], ['Nome sozinho', 'A pior. O Brasil tem milhares de Josés da Silva.', 'no']];
      keys.forEach(([t, s, k], i) => {
        const x = X0 + i * 570;
        body += badge(k, { x, y: 770, s: 50, d: 2.4 + i * 0.5 });
        body += anim('up', 2.4 + i * 0.5, rich(t, { x: x + 70, y: 806, size: 30, weight: 700, w: 480 }).svg + rich(s, { x: x + 70, y: 860, size: 24, fill: C.ink2, w: 470 }).svg);
      });
      return { body };
    }
  },
  {
    id: '4.6-03', aula: '4.6', title: 'Limpar antes de cruzar',
    cue: 'BLOCO 2 — tirar pontos, barra e traço do CNPJ; nomes em maiúsculas e sem espaços sobrando',
    render() {
      const h = heading('Cruzamento falha por sujeira, não por falta de dado', { size: 56 });
      let body = h.svg;
      const row = (y, a, f, b, d) => anim('up', d, box({ x: X0, y, w: 500, h: 100, fill: C.s2, stroke: C.red, sw: 2 }) + rich(a, { x: X0 + 24, y: y + 64, size: 32, font: 'mono', weight: 700, w: 460 }).svg)
        + anim('fade', d + 0.6, rich(f, { x: X0 + 540, y: y + 96, size: 20, font: 'mono', fill: C.amber, w: 600 }).svg)
        + arrowH(X0 + 540, y + 50, 1250, { d: d + 0.8, color: C.amber })
        + anim('pop', d + 1.3, box({ x: 1280, y, w: 520, h: 100, fill: C.s1, stroke: C.green, sw: 3 }) + rich(b, { x: 1304, y: y + 64, size: 32, font: 'mono', weight: 700, w: 480 }).svg);
      body += row(300, '11.222.333/0001-86', '=SUBSTITUIR(SUBSTITUIR(SUBSTITUIR(A2;".";"");"/";"");"-";"")', '11222333000186', 0.6);
      body += row(470, '  josé  da silva ', '=ARRUMAR(MAIÚSCULA(B2))', 'JOSÉ DA SILVA', 2.2);
      body += row(640, 'JOSÉ DA SILVA', 'tirar acentos, se as bases escrevem diferente', 'JOSE DA SILVA', 3.8);
      body += anim('up', 5.6, rich('Dez minutos de limpeza evitam {a|dez horas de falso positivo}.', { x: X0, y: 900, size: 42, font: 'display', w: BW }).svg);
      return { body, source: 'Fórmulas como mostradas na aula, no Excel em português' };
    }
  },
  {
    id: '4.6-04', aula: '4.6', title: 'PROCX em ação',
    cue: '[DEMONSTRAÇÃO: aba “Contratos” cruzada com a aba “Sanções”] — =PROCX(A2;Sancoes!A:A;Sancoes!B:B;"não consta")',
    render() {
      let body = anim('up', 0.2, box({ x: X0, y: 180, w: BW, h: 80, fill: C.s2, stroke: C.lineUi, sw: 2 }) + rich('fx', { x: X0 + 24, y: 232, size: 28, font: 'mono', weight: 700, fill: C.ink3, w: 60 }).svg
        + rich('=PROCX({a|A2};{b|Sancoes!A:A};{g|Sancoes!B:B};"não consta")', { x: X0 + 90, y: 234, size: 34, font: 'mono', weight: 700, w: BW - 120 }).svg);
      const t1 = table({ x: X0, y: 330, cols: [{ h: 'A · CNPJ', w: 320, mono: true }, { h: 'B · Órgão', w: 260 }, { h: 'Sanção (fórmula)', w: 360, bold: true }], rows: [['11222333000186', 'Educação', ''], ['44555666000186', 'Obras', ''], ['77888999000186', 'Câmara', '']], rowH: 80, headH: 56, size: 26, d0: 0.8, step: 0.2 });
      body += t1.svg;
      const t2 = table({ x: 1120, y: 330, cols: [{ h: 'A · CNPJ', w: 320, mono: true }, { h: 'B · Tipo de sanção', w: 360 }], rows: [['44555666000186', 'Impedimento de licitar e contratar'], ['99000111000186', 'Declaração de inidoneidade']], rowH: 80, headH: 56, size: 24, d0: 1.2, step: 0.2, head: C.blue });
      body += t2.svg;
      body += anim('fade', 1.0, label('Contratos', { x: X0, y: 316, size: 20 }) + label('Sancoes', { x: 1120, y: 316, size: 20, color: C.blue }));
      const res = [['não consta', C.ink3], ['Impedimento de licitar e contratar', C.red], ['não consta', C.ink3]];
      res.forEach(([t, col], i) => {
        const y = 330 + 56 + i * 80;
        if (i === 1) body += arrowPath(`M${X0 + 320} ${y + 40} C900 ${y + 40} 1000 ${y - 40} 1120 ${y - 40}`, { d: 2.4, color: C.amber, end: [1120, y - 40, 0] });
        body += anim('pop', 2.8 + i * 0.5, rich(t, { x: X0 + 600, y: y + 50, size: 24, weight: 700, fill: col, w: 340 }).svg);
      });
      body += anim('up', 4.6, rich('Procure o CNPJ da linha 2 na lista de sanções. Se achar, traga o tipo de sanção. {a|Se não achar, escreva “não consta”.}', { x: X0, y: 760, size: 32, weight: 500, w: BW }).svg);
      body += anim('fade', 5.4, rich('Versão antiga do Excel: =PROCV(A2;Sancoes!A:C;2;FALSO)', { x: X0, y: 900, size: 26, font: 'mono', fill: C.ink2, w: BW }).svg);
      return { body, source: 'Dados fictícios, como na planilha de cruzamento do curso' };
    }
  },
  {
    id: '4.6-05', aula: '4.6', title: 'Aberta menos de seis meses antes',
    cue: 'BLOCO 3 — =SE(F2-G2<180;"ABERTA MENOS DE 6 MESES ANTES";"")',
    render() {
      let body = anim('up', 0.2, box({ x: X0, y: 180, w: BW, h: 80, fill: C.s2, stroke: C.lineUi, sw: 2 }) + rich('fx', { x: X0 + 24, y: 232, size: 28, font: 'mono', weight: 700, fill: C.ink3, w: 60 }).svg
        + rich('=SE({a|F2}-{b|G2}<180;"ABERTA MENOS DE 6 MESES ANTES";"")', { x: X0 + 90, y: 234, size: 32, font: 'mono', weight: 700, w: BW - 120 }).svg);
      body += timeline([
        { at: 0.12, date: '10/03/2025', t: 'Abertura da empresa', sub: 'coluna G, trazida de Empresas', color: C.blue },
        { at: 0.88, date: '20/08/2025', t: 'Data do contrato', sub: 'coluna F' }
      ], { y: 560, d0: 0.8, step: 1.0, alt: false, side: 'down', labelW: 500 }).svg;
      const xa = X0 + 40 + 0.12 * (BW - 80); const xb = X0 + 40 + 0.88 * (BW - 80);
      body += anim('grow', 2.6, `<rect x="${xa}" y="470" width="${xb - xa}" height="14" fill="${C.red}"/>`);
      body += anim('pop', 3.4, rich('163 dias', { x: (xa + xb) / 2, y: 440, size: 60, font: 'display', fill: C.red, anchor: 'middle', w: 600 }).svg);
      body += anim('pop', 4.2, `<rect x="${W / 2 - 430}" y="860" width="860" height="90" fill="${C.red}"/>` + rich('ABERTA MENOS DE 6 MESES ANTES', { x: W / 2, y: 920, size: 40, font: 'display', fill: C.bg, anchor: 'middle', w: 860 }).svg);
      return { body, source: 'Exemplo fictício · é uma pergunta, não uma conclusão' };
    }
  },
  {
    id: '4.6-06', aula: '4.6', title: 'Tabela dinâmica e a concentração',
    cue: 'BLOCO 4 — “Um fornecedor que recebia R$ 200 mil por ano e, de repente, passa a receber R$ 8 milhões.”',
    render() {
      const h = heading('A tabela dinâmica mostra a concentração', { sub: 'Pagamentos a um fornecedor, somados por ano.' });
      let body = h.svg;
      body += bars([
        { name: 'Ano 1', v: 0.2, label: 'R$ 200 mil', color: C.ink2 }, { name: 'Ano 2', v: 0.2, label: 'R$ 200 mil', color: C.ink2 }, { name: 'Ano 3', v: 0.2, label: 'R$ 200 mil', color: C.ink2 }, { name: 'Ano 4', v: 8, label: 'R$ 8 milhões', color: C.red }
      ], { x: X0 + 60, w: 1100, y: 900, h: 480, gap: 60, d0: 0.8, step: 0.4, valueSize: 34, labelSize: 28 }).svg;
      body += anim('up', 3.0, rich('O número sobe.', { x: 1340, y: 520, size: 46, font: 'display', w: 470 }).svg);
      body += anim('up', 3.8, rich('{a|A pergunta também.}', { x: 1340, y: 600, size: 46, font: 'display', w: 470 }).svg);
      return { body, source: 'Valores ilustrativos' };
    }
  },
  {
    id: '4.6-07', aula: '4.6', title: 'Cruzamentos que costumam render',
    cue: '[TELA: lista]',
    render() {
      const h = heading('Cruzamentos que costumam render');
      const l = list([
        { t: 'Contratos × sanções', sub: 'Empresa punida recebendo.' },
        { t: 'Sócios × nomeações', sub: 'Sócio de fornecedor nomeado para cargo público, ou parente de quem nomeia.' },
        { t: 'Doadores de campanha × sócios de fornecedores' },
        { t: 'Fornecedores de campanha × contratos depois da eleição' },
        { t: 'Datas de abertura × datas de edital' }
      ], { y: 300, size: 42, subSize: 28, gap: 30, step: 0.9 });
      return { body: h.svg + l.svg };
    }
  },
  {
    id: '4.6-08', aula: '4.6', title: 'Vínculo não é culpa',
    cue: 'BLOCO 7 — “Uma linha num grafo não é crime. É uma pergunta.”',
    render() {
      let body = node({ x: 520, y: 520, t: 'Pessoa', sub: 'sócia em comum', w: 320, h: 140, d: 0.4, color: C.ink2, size: 36 });
      body += node({ x: 1400, y: 520, t: 'Empresa', sub: 'fornecedora', w: 320, h: 140, d: 0.8, color: C.ink2, size: 36 });
      body += anim('draw', 1.4, `<path d="M680 520 H1240" stroke="${C.amber}" stroke-width="6" fill="none" pathLength="1"/>`);
      body += anim('gone', 3.0, anim('pop', 2.0, `<rect x="880" y="470" width="160" height="100" fill="${C.red}"/>` + rich('CULPA', { x: 960, y: 535, size: 36, font: 'display', fill: C.bg, anchor: 'middle', w: 160 }).svg), { t: 0.3 });
      body += anim('draw', 2.4, `<path d="M860 460 L1060 580" stroke="${C.ink}" stroke-width="8" fill="none" pathLength="1"/>`, { t: 0.4 });
      body += anim('gone', 3.0, anim('fade', 2.4, `<path d="M860 460 L1060 580" stroke="${C.ink}" stroke-width="8" fill="none"/>`), { t: 0.3 });
      body += anim('pop', 3.4, `<rect x="840" y="470" width="240" height="100" fill="${C.amber}"/>` + rich('PERGUNTA', { x: 960, y: 535, size: 36, font: 'display', fill: C.bg, anchor: 'middle', w: 240 }).svg);
      body += anim('up', 0.2, rich('Vínculo não é culpa.', { x: W / 2, y: 280, size: 80, font: 'display', anchor: 'middle', w: BW }).svg);
      body += anim('up', 4.2, rich('O sócio em comum pode ter explicação. A coincidência de datas pode ser só coincidência. {a|Você só descobre perguntando}, aos documentos e às pessoas.', { x: W / 2, y: 800, size: 34, weight: 500, anchor: 'middle', w: 1500 }).svg);
      return { body };
    }
  },
  {
    id: '4.6-09', aula: '4.6', title: 'Reprodutibilidade',
    cue: 'BLOCO 7 — registre de onde veio cada base e quando você baixou',
    render() {
      const h = heading('Reprodutibilidade', { sub: 'Se alguém refizer o seu cruzamento, tem que chegar ao mesmo resultado.' });
      let body = h.svg;
      body += table({
        y: 400, rowH: 80, headH: 60, size: 26, d0: 0.8, step: 0.5,
        cols: [{ h: 'ID', w: 110, mono: true }, { h: 'Base', w: 540 }, { h: 'Baixada em', w: 380, mono: true }, { h: 'Arquivo', w: 650, mono: true }],
        rows: [['L001', 'Cadastro CNPJ (Receita)', '01/09/2026 10:12', 'cnpj-empresas-da-pauta.json'], ['L004', 'Pagamentos do portal municipal', '02/09/2026 10:05', 'pagamentos-2023-2025.csv'], ['L005', 'CEIS, CNEP e CEPIM (CGU)', '02/09/2026 10:30', 'sancoes-2026-09-02.pdf']]
      }).svg;
      body += anim('up', 3.0, rich('É o que separa jornalismo de dados de {a|palpite com planilha}.', { x: X0, y: 860, size: 40, font: 'display', w: BW }).svg);
      return { body, source: 'Aba Log da planilha de cruzamento · dados fictícios' };
    }
  },

  // ---------------------------------------------------------------- 4.7
  {
    id: '4.7-01', aula: '4.7', title: 'Acessível não é público',
    cue: 'ABERTURA — “Nem tudo que está acessível é público. E nem tudo que é público pode ser usado de qualquer jeito.”',
    render() {
      let body = statement('Nem tudo que está acessível\né {a|público}.', { y: 380, size: 84, d: 0.2, step: 0.6 }).svg;
      body += anim('up', 2.0, rich('E nem tudo que é público pode ser usado de qualquer jeito.', { x: W / 2, y: 820, size: 44, font: 'display', fill: C.ink2, anchor: 'middle', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '4.7-02', aula: '4.7', title: 'Voltar no tempo',
    cue: 'BLOCO 2 — Wayback Machine: o “quem somos” de 2021 pode mostrar o sócio que hoje não aparece',
    render() {
      let body = browser(X0, 220, 800, 560, 'web.archive.org/web/2021…/empresa.exemplo/quem-somos', 0.3);
      body += anim('fade', 0.8, label('2021 · cópia arquivada', { x: X0 + 30, y: 320, size: 22 }));
      ['Diretora: Maria Exemplo', 'Sócio: Fulano de Tal', 'Gerente: Beltrano Exemplo'].forEach((t, i) => { body += anim('up', 1.0 + i * 0.2, rich(t, { x: X0 + 30, y: 400 + i * 80, size: 34, weight: 700, fill: i === 1 ? C.amber : C.ink, w: 740 }).svg); });
      body += browser(1000, 220, 800, 560, 'empresa.exemplo/quem-somos', 1.8);
      body += anim('fade', 2.2, label('hoje', { x: 1030, y: 320, size: 22, color: C.ink2 }));
      ['Diretora: Maria Exemplo', '', 'Gerente: Beltrano Exemplo'].forEach((t, i) => { if (t) body += anim('up', 2.4 + i * 0.2, rich(t, { x: 1030, y: 400 + i * 80, size: 34, weight: 700, w: 740 }).svg); });
      body += anim('pop', 3.2, `<rect x="1026" y="444" width="560" height="64" fill="none" stroke="${C.red}" stroke-width="4" stroke-dasharray="14 8"/>` + rich('sumiu', { x: 1606, y: 486, size: 28, font: 'mono', weight: 700, fill: C.red, w: 200 }).svg);
      body += anim('up', 4.0, rich('Site muda. Página some. {a|A Wayback Machine guarda versões antigas.}', { x: X0, y: 870, size: 36, weight: 700, w: BW }).svg);
      body += anim('up', 4.8, rich('E faça o caminho inverso: o archive.today salva a página agora, com data. Prova que estava lá.', { x: X0, y: 940, size: 28, fill: C.ink2, w: BW }).svg);
      return { body, source: 'Exemplo fictício' };
    }
  },
  {
    id: '4.7-03', aula: '4.7', title: 'Busca reversa de imagem',
    cue: 'BLOCO 3 — foto de obra “recém-inaugurada” pode ser de 2019',
    render() {
      let body = anim('up', 0.3, `<rect x="${X0}" y="230" width="700" height="460" fill="#3A4A5C"/><path d="M${X0} 600 L${X0 + 200} 420 L${X0 + 380} 560 L${X0 + 520} 460 L${X0 + 700} 600 V690 H${X0} Z" fill="#6B7A5C"/><rect x="${X0 + 260}" y="420" width="220" height="200" fill="${C.ink2}"/><rect x="${X0 + 300}" y="470" width="50" height="60" fill="#3A4A5C"/><rect x="${X0 + 390}" y="470" width="50" height="60" fill="#3A4A5C"/>`
        + rich('“Obra recém-inaugurada”', { x: X0, y: 740, size: 30, weight: 700, w: 700 }).svg);
      body += arrowH(X0 + 730, 460, 960, { d: 1.2, color: C.amber });
      body += anim('up', 1.6, box({ x: 980, y: 230, w: 820, h: 520, fill: C.s1, stroke: C.lineUi, sw: 2 }) + label('Busca reversa · onde a imagem já apareceu', { x: 1010, y: 280, size: 22 }));
      const hits = [['2026', 'Perfil da prefeitura'], ['2023', 'Blog de notícias'], ['2019', 'Site de outra cidade']];
      hits.forEach(([y0, t], i) => { body += anim('left', 2.2 + i * 0.5, rich(y0, { x: 1010, y: 380 + i * 110, size: 44, font: 'display', fill: i === 2 ? C.red : C.ink2, w: 160 }).svg + rich(t, { x: 1180, y: 376 + i * 110, size: 30, weight: 700, w: 580 }).svg); });
      body += stamp('NÃO É DE HOJE', { x: 1390, y: 820, color: C.red, size: 44, d: 4.0 });
      body += anim('up', 4.6, rich('Se apareceu em 2019, não é de hoje.', { x: X0, y: 880, size: 36, font: 'display', w: 800 }).svg);
      return { body, source: 'Exemplo fictício · Google Lens e TinEye' };
    }
  },
  {
    id: '4.7-04', aula: '4.7', title: 'Geolocalizar uma foto',
    cue: 'BLOCO 3 — placa de rua, fachada, antena, formato do morro',
    render() {
      let body = anim('up', 0.3, `<rect x="${X0}" y="200" width="1000" height="620" fill="#2F3B48"/><path d="M${X0} 520 L${X0 + 180} 360 L${X0 + 330} 470 L${X0 + 520} 300 L${X0 + 760} 480 L${X0 + 1000} 380 V820 H${X0} Z" fill="#4E5E47"/>`
        + `<rect x="${X0 + 80}" y="560" width="360" height="260" fill="#8A867D"/><rect x="${X0 + 120}" y="610" width="80" height="80" fill="#2F3B48"/><rect x="${X0 + 260}" y="610" width="80" height="80" fill="#2F3B48"/>`
        + `<path d="M${X0 + 760} 540 V300 M${X0 + 730} 330 H${X0 + 790} M${X0 + 740} 380 H${X0 + 780}" stroke="${C.ink2}" stroke-width="8"/>`
        + `<rect x="${X0 + 560}" y="660" width="200" height="60" fill="#2E6B3A"/><path d="M${X0 + 660} 720 V820" stroke="${C.ink2}" stroke-width="8"/>` + rich('R. EXEMPLO', { x: X0 + 660, y: 700, size: 24, font: 'mono', weight: 700, fill: C.ink, anchor: 'middle', w: 200 }).svg);
      const clues = [[X0 + 660, 690, 'placa de rua', 1.2], [X0 + 260, 700, 'fachada', 1.8], [X0 + 760, 360, 'antena', 2.4], [X0 + 520, 320, 'formato do morro', 3.0]];
      clues.forEach(([x, y, t, d], i) => {
        body += anim('pop', d, `<circle cx="${x}" cy="${y}" r="56" fill="none" stroke="${C.amber}" stroke-width="5"/>` + `<rect x="${x + 50}" y="${y - 64}" width="${layout(t, { size: 24, font: 'mono', weight: 700 }).w + 24}" height="40" fill="${C.amber}"/>` + rich(t, { x: x + 62, y: y - 36, size: 24, font: 'mono', weight: 700, fill: C.bg, w: 400 }).svg);
      });
      body += anim('pop', 4.0, icon('pin', { x: 1420, y: 300, s: 260, color: C.amber, sw: 5 }));
      body += anim('up', 4.4, rich('Geolocalizar é descobrir onde a foto foi tirada.', { x: 1200, y: 700, size: 34, font: 'display', w: 600, lh: 1.1 }).svg + rich('Paciência e comparação: Google Earth e Street View.', { x: 1200, y: 820, size: 28, fill: C.ink2, w: 600 }).svg);
      return { body, source: 'Ilustração' };
    }
  },
  {
    id: '4.7-05', aula: '4.7', title: 'Operadores de busca',
    cue: '[TELA: site:gov.br "nome da empresa" — só páginas de governo · filetype:pdf "CNPJ da empresa" — só PDFs]',
    render() {
      const h = heading('Faça o buscador trabalhar para você');
      let body = h.svg;
      const q = (y, query, res, d) => anim('up', d, box({ x: X0, y, w: BW, h: 110, fill: C.s1, stroke: C.lineUi, sw: 2 }) + icon('search', { x: X0 + 30, y: y + 30, s: 50, color: C.ink2, sw: 4 }) + rich(query, { x: X0 + 110, y: y + 70, size: 40, font: 'mono', weight: 700, w: BW - 140 }).svg)
        + anim('left', d + 0.8, rich(res, { x: X0 + 110, y: y + 170, size: 32, weight: 700, w: BW - 140 }).svg);
      body += q(320, '{a|site:gov.br} "nome da empresa"', '→ só páginas de governo', 0.6);
      body += q(580, '{a|filetype:pdf} "CNPJ da empresa"', '→ só PDFs, {a|onde moram atas e contratos esquecidos}', 2.2);
      body += anim('fade', 3.8, rich('Aspas acham a expressão exata.', { x: X0, y: 920, size: 30, fill: C.ink2, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '4.7-06', aula: '4.7', title: 'A foto no aniversário',
    cue: 'BLOCO 4 — a foto do dono da empresa no aniversário do secretário é pública, se o perfil é público',
    render() {
      let body = anim('up', 0.3, box({ x: X0, y: 200, w: 760, h: 700, fill: C.s1, stroke: C.lineUi, sw: 2 }) + `<circle cx="${X0 + 50}" cy="250" r="22" fill="${C.s3}"/>` + rich('perfil público', { x: X0 + 90, y: 258, size: 24, font: 'mono', fill: C.ink3, w: 400 }).svg
        + `<rect x="${X0 + 30}" y="300" width="700" height="460" fill="#3A3140"/>` + icon('person', { x: X0 + 160, y: 440, s: 200, color: C.ink2, sw: 5 }) + icon('person', { x: X0 + 420, y: 440, s: 200, color: C.ink2, sw: 5 })
        + rich('Parabéns, secretário!', { x: X0 + 30, y: 820, size: 30, weight: 700, w: 700 }).svg);
      body += anim('pop', 1.4, `<rect x="${X0 + 150}" y="430" width="220" height="220" fill="none" stroke="${C.amber}" stroke-width="5"/>` + rich('dono da empresa', { x: X0 + 150, y: 690, size: 22, font: 'mono', weight: 700, fill: C.amber, w: 300 }).svg);
      body += anim('up', 2.0, rich('É um vínculo.', { x: 1000, y: 360, size: 64, font: 'display', w: 800 }).svg);
      body += anim('up', 2.8, rich('Não prova nada além do vínculo. {a|Pergunta, não conclusão.}', { x: 1000, y: 480, size: 36, weight: 700, w: 780 }).svg);
      body += anim('up', 3.8, rich('Preserve tudo: captura com endereço e data visíveis, link arquivado, anotação no Log.', { x: 1000, y: 700, size: 30, fill: C.ink2, w: 780 }).svg);
      return { body, source: 'Ilustração' };
    }
  },
  {
    id: '4.7-07', aula: '4.7', title: 'Os limites legais',
    cue: '[TELA: cada dispositivo aparece conforme é citado]',
    render() {
      const h = heading('A fronteira');
      const c = columns([
        { num: 'LGPD', head: 'Art. 4º, II, “a”', body: 'Não se aplica ao tratamento para fins {a|exclusivamente} jornalísticos. Dossiê para vender, para campanha ou para cliente não é jornalismo.' },
        { num: 'CP', head: 'Art. 154-A', body: 'Invadir dispositivo informático alheio para obter dados: crime, com {r|reclusão de 1 a 4 anos}.', color: C.red },
        { num: 'CP', head: 'Art. 147-A', body: 'Perseguição reiterada, por qualquer meio, invadindo a privacidade: crime desde 2021.', color: C.red },
        { num: 'Gravar', head: 'Conversa', body: 'A própria, mesmo sem avisar: lícito (STF, Tema 237; Lei 9.296, art. 10-A, §1º). {r|A alheia: crime.} Publicar exige interesse público.', color: C.blue }
      ], { y: 290, h: 620, size: 28, headSize: 34, step: 1.4, gap: 26 });
      return { body: h.svg + c.svg };
    }
  },
  {
    id: '4.7-08', aula: '4.7', title: 'Senha que não é sua, pare',
    cue: 'BLOCO 5 — “se, para ver alguma coisa, você precisa passar por uma senha, um login ou um bloqueio que não são seus, pare.”',
    render() {
      let body = anim('pop', 0.3, `<path d="M${1420 - 130} 280 H${1420 + 130} L${1420 + 240} 390 V${390 + 260} L${1420 + 130} ${760} H${1420 - 130} L${1420 - 240} ${650} V390 Z" fill="${C.red}"/>` + rich('PARE', { x: 1420, y: 560, size: 120, font: 'display', fill: C.ink, anchor: 'middle', w: 500 }).svg);
      body += anim('up', 0.6, rich('Senha, login ou bloqueio que não são seus?', { x: X0, y: 330, size: 52, font: 'display', w: 900, lh: 1.08 }).svg);
      body += anim('up', 1.6, rich('Adivinhar senha, usar senha vazada, entrar num sistema por uma falha: {r|tudo isso é invasão.}', { x: X0, y: 560, size: 34, weight: 500, w: 880 }).svg);
      body += anim('up', 2.6, rich('Mesmo que tenha sido fácil. {a|Principalmente se foi fácil.}', { x: X0, y: 760, size: 38, font: 'display', w: 880, lh: 1.1 }).svg);
      return { body, source: 'Código Penal, art. 154-A' };
    }
  },
  {
    id: '4.7-09', aula: '4.7', title: 'O que este curso não ensina',
    cue: 'BLOCO 5 — falsa identidade, engenharia social e compra de base vazada',
    render() {
      const h = heading('O que este curso não ensina');
      let body = h.svg;
      body += list([
        { t: '{s|Falsa identidade}', mark: 'no' },
        { t: '{s|Engenharia social}', sub: 'Enganar alguém para arrancar informação.', mark: 'no' },
        { t: '{s|Compra de base vazada}', mark: 'no' }
      ], { y: 320, size: 52, subSize: 30, gap: 40, numbered: false, marker: 'no', step: 0.9 }).svg;
      body += anim('up', 3.4, rich('Não é só ilegal ou antiético. {a|Contamina a prova.} A matéria vira o método, e não o fato.', { x: X0, y: 860, size: 40, font: 'display', w: BW, lh: 1.12 }).svg);
      return { body };
    }
  }
];
