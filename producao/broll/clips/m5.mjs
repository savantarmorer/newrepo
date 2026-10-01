// Módulo 5 — Checagem e padrão de prova
import {
  C, W, H, X0, X1, BW, anim, rich, layout, heading, statement, list, columns, compare, flow, timeline, paperCard,
  stamp, table, box, icon, badge, arrowH, arrowV, arrowPath, edge, node, pill, redact, checklist, docSheet, bars, hbars, calendar, label
} from '../kit.mjs';

const SRC_LEG = 'Conteúdo educativo. Não substitui advogado no caso concreto.';

function thumb(x, y, w, title, bad, d) {
  const h = w * 9 / 16;
  let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bad ? '#3A1512' : '#14202A'}"/>`;
  if (bad) {
    g += icon('person', { x: x + w - 300, y: y + 60, s: 260, color: C.ink2, sw: 8 });
    g += `<circle cx="${x + 90}" cy="${y + 80}" r="46" fill="${C.red}"/><rect x="${x + 50}" y="${y + 120}" width="80" height="26" fill="${C.ink3}"/>`;
    g += rich(title, { x: x + 40, y: y + h - 60, size: 64, font: 'display', fill: '#FFE14D', w: w - 80, lh: 1 }).svg;
  } else {
    g += `<rect x="${x + 40}" y="${y + 40}" width="${w * 0.42}" height="${h - 80}" fill="${C.paper}"/>` + [0.8, 0.6, 0.9, 0.7, 0.5].map((k, i) => `<rect x="${x + 64}" y="${y + 80 + i * 34}" width="${w * 0.36 * k}" height="12" fill="${C.pLine}"/>`).join('');
    g += `<rect x="${x + 64}" y="${y + 80 + 2 * 34 - 8}" width="${w * 0.36}" height="28" fill="${C.amber}" opacity=".55"/>`;
    g += rich(title, { x: x + w * 0.5, y: y + 110, size: 40, font: 'display', fill: C.ink, w: w * 0.46, lh: 1.05 }).svg;
  }
  return anim('pop', d, g);
}

export default [
  // ---------------------------------------------------------------- 5.1
  {
    id: '5.1-01', aula: '5.1', title: 'Indício autoriza a pergunta',
    cue: 'ABERTURA — “Indício autoriza a pergunta. Não autoriza a afirmação.”',
    render() {
      let body = statement('Indício autoriza a pergunta.\n{a|Não autoriza a afirmação.}', { y: 430, size: 88, d: 0.3, step: 0.9 }).svg;
      body += anim('up', 2.2, rich('Essa frase, sozinha, evita boa parte dos processos contra jornalistas.', { x: W / 2, y: 780, size: 36, fill: C.ink2, anchor: 'middle', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '5.1-02', aula: '5.1', title: 'O dedo que aponta',
    cue: 'BLOCO 1 — indicium: sinal, indicação; da mesma família de index, o dedo que aponta',
    render() {
      let body = anim('up', 0.2, rich('INDÍCIO', { x: X0, y: 360, size: 140, font: 'display', w: 1000 }).svg);
      body += anim('up', 0.8, rich('do latim {a|indicium}: sinal, indicação.', { x: X0, y: 450, size: 40, weight: 500, w: 900 }).svg);
      body += anim('up', 1.4, rich('Da mesma família de {a|index}, o dedo que aponta.', { x: X0, y: 520, size: 40, weight: 500, fill: C.ink2, w: 900 }).svg);
      const hx = 1180; const hy = 500;
      body += anim('right', 1.8, `<path d="M${hx} ${hy} H${hx + 330} a26 26 0 0 1 0 52 H${hx + 160} V${hy + 70} a24 24 0 0 1 0 48 H${hx + 130} V${hy + 160} a22 22 0 0 1 0 44 H${hx + 110} V${hy + 240} a22 22 0 0 1 0 44 H${hx} Z" fill="${C.amber}"/><rect x="${hx - 80}" y="${hy - 10}" width="90" height="300" fill="${C.amber}" opacity=".7"/>`);
      body += arrowH(hx + 380, hy + 26, 1820, { d: 2.6, color: C.amber, sw: 5 });
      body += anim('up', 3.2, rich('O indício {a|aponta}.', { x: X0, y: 760, size: 64, font: 'display', w: 1000 }).svg + rich('Não prova.', { x: X0, y: 850, size: 64, font: 'display', fill: C.red, w: 1000 }).svg);
      return { body };
    }
  },
  {
    id: '5.1-03', aula: '5.1', title: 'Código de Processo Penal, art. 239',
    cue: '[TELA: art. 239 do CPP]',
    render() {
      const p = paperCard({ y: 200, ref: 'Código de Processo Penal · art. 239', text: '“Considera-se indício a circunstância {h|conhecida e provada}, que, tendo relação com o fato, autorize, por indução, {h|concluir-se a existência de outra ou outras circunstâncias}.”', size: 44, d: 0.3, hlD: 1.8 });
      let body = p.svg;
      body += anim('up', 3.4, rich('Leia de novo, devagar.', { x: X0, y: p.bottom + 90, size: 30, fill: C.ink2, w: BW }).svg);
      body += anim('up', 4.0, rich('O indício, ele mesmo, {g|é provado}. O que ele sugere {a|é que não é}.', { x: X0, y: p.bottom + 170, size: 44, font: 'display', w: BW }).svg);
      return { body, source: SRC_LEG };
    }
  },
  {
    id: '5.1-04', aula: '5.1', title: 'Fato provado e inferência',
    cue: 'BLOCO 1 — a empresa foi aberta seis meses antes do contrato: fato provado; aberta para ganhar o contrato: inferência',
    render() {
      const h = heading('O fato e o que ele sugere');
      let body = h.svg;
      body += anim('up', 0.6, box({ x: X0, y: 330, w: 760, h: 380, fill: C.s1, stroke: C.green, sw: 4 }) + label('Fato provado', { x: X0 + 36, y: 384, size: 24, color: C.green })
        + rich('A empresa foi aberta seis meses antes do contrato.', { x: X0 + 36, y: 470, size: 44, font: 'display', w: 690, lh: 1.08 }).svg + rich('Está no cadastro de CNPJ.', { x: X0 + 36, y: 660, size: 30, fill: C.ink2, w: 690 }).svg);
      body += anim('fade', 1.8, `<path d="M900 520 H1020" stroke="${C.amber}" stroke-width="6" stroke-dasharray="16 12"/>`) + anim('fade', 2.0, rich('sugere', { x: 960, y: 500, size: 24, font: 'mono', weight: 700, fill: C.amber, anchor: 'middle', w: 200 }).svg);
      body += anim('up', 2.4, `<rect x="1040" y="330" width="760" height="380" fill="none" stroke="${C.amber}" stroke-width="4" stroke-dasharray="18 12"/>` + label('Inferência', { x: 1076, y: 384, size: 24 })
        + rich('Ela foi aberta para ganhar aquele contrato.', { x: 1076, y: 470, size: 44, font: 'display', w: 690, lh: 1.08 }).svg + rich('Pode ser verdade. Pode ser coincidência.', { x: 1076, y: 660, size: 30, fill: C.ink2, w: 690 }).svg);
      body += anim('up', 3.6, rich('Publique o fato. Transforme a inferência em {a|pergunta}.', { x: X0, y: 860, size: 44, font: 'display', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '5.1-05', aula: '5.1', title: 'Fato, indício e versão',
    cue: '[TELA: tabela com três colunas — fato, indício, versão]',
    render() {
      const h = heading('Todo o seu material cabe em três colunas');
      const c = columns([
        { head: 'Fato', body: 'O que o documento mostra diretamente.', items: ['“O contrato tem valor de R$ 4,2 milhões.”', '“O sócio foi nomeado em 3 de março.”'], foot: 'é · mostra · registra', color: C.green },
        { head: 'Indício', body: 'O fato que aponta para outra coisa.', items: ['“A empresa foi aberta seis meses antes do edital.”', '“O preço unitário é o triplo da média.”'], foot: 'aponta · sugere · levanta a pergunta', color: C.amber },
        { head: 'Versão', body: 'O que alguém diz. Sempre tem dono e vai atribuída.', items: ['“Segundo o ex-diretor, o contrato foi direcionado.”'], foot: 'diz · afirma · segundo', color: C.blue }
      ], { y: 310, h: 620, size: 30, headSize: 48, step: 1.2 });
      return { body: h.svg + c.svg };
    }
  },
  {
    id: '5.1-06', aula: '5.1', title: 'O que um documento prova',
    cue: 'BLOCO 3 — pergunte a cada documento: o que ele prova, exatamente?',
    render() {
      const h = heading('O que esse documento prova, exatamente?');
      const t = table({
        y: 300, rowH: 120, headH: 64, size: 32, d0: 0.8, step: 1.0,
        cols: [{ h: 'Documento', w: 520, bold: true }, { h: 'Prova', w: 580 }, { h: 'Não prova', w: 580 }],
        rows: [
          ['Um contrato', '{g|que existe um contrato}', '{r|superfaturamento}'],
          ['Uma comparação de preços', '{g|que o preço está acima da média}', '{r|que alguém embolsou a diferença}'],
          ['Uma foto de duas pessoas juntas', '{g|que estiveram juntas}', '{r|acordo}']
        ]
      });
      let body = h.svg + t.svg;
      body += anim('up', 4.2, rich('Quase nenhum documento prova {a|intenção}. Descreva o que a pessoa fez. Deixe a intenção para quem julga.', { x: X0, y: 860, size: 36, weight: 700, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '5.1-07', aula: '5.1', title: 'Código de Processo Penal, art. 155',
    cue: '[TELA: art. 155 do CPP] — o inquérito não é a sentença',
    render() {
      const p = paperCard({ y: 180, h: 420, ref: 'Código de Processo Penal · art. 155', text: '“O juiz formará sua convicção pela livre apreciação da prova produzida em contraditório judicial, {h|não podendo fundamentar sua decisão exclusivamente nos elementos informativos colhidos na investigação}, ressalvadas as provas cautelares, não repetíveis e antecipadas.”', size: 36, d: 0.3, hlD: 1.6 });
      let body = p.svg;
      body += anim('up', 3.0, rich('O relatório da PF importa. Mas é o que a investigação concluiu, {a|não o que a Justiça decidiu}.', { x: X0, y: 700, size: 34, weight: 700, w: BW }).svg);
      body += badge('ok', { x: X0, y: 790, s: 56, d: 3.8 }) + anim('left', 3.8, rich('“Relatório da PF aponta que…”', { x: X0 + 80, y: 832, size: 38, font: 'display', w: 760 }).svg);
      body += badge('no', { x: 1000, y: 790, s: 56, d: 4.4 }) + anim('left', 4.4, rich('{s|“Fulano desviou”}', { x: 1080, y: 832, size: 38, font: 'display', w: 700, hlD: 4.8 }).svg);
      return { body, source: SRC_LEG };
    }
  },
  {
    id: '5.1-08', aula: '5.1', title: 'Presunção de inocência',
    cue: 'BLOCO 5 — Constituição, art. 5º, LVII; a saída não é o silêncio, é a precisão',
    render() {
      const p = paperCard({ y: 180, ref: 'Constituição Federal · art. 5º, LVII', text: '“ninguém será considerado culpado até o {h|trânsito em julgado} de sentença penal condenatória;”', size: 44, d: 0.3, hlD: 1.4 });
      let body = p.svg;
      body += anim('up', 2.4, rich('Obriga o Estado, não o jornalista. {a|Você pode e deve investigar quem ainda não foi condenado.}', { x: X0, y: p.bottom + 100, size: 34, weight: 700, w: BW }).svg);
      body += anim('up', 3.4, rich('Mas chamar alguém de criminoso antes da condenação definitiva é imputar crime. Se você não provar, o módulo 6 tem nome para isso: calúnia.', { x: X0, y: p.bottom + 220, size: 30, fill: C.ink2, w: BW }).svg);
      body += anim('up', 4.4, rich('A saída não é o silêncio. {a|É a precisão.}', { x: X0, y: 950, size: 44, font: 'display', w: BW }).svg);
      return { body, source: SRC_LEG };
    }
  },

  // ---------------------------------------------------------------- 5.2
  {
    id: '5.2-01', aula: '5.2', title: 'Investigado não é réu',
    cue: 'ABERTURA — “Chamar investigado de réu pode render um processo.”',
    render() {
      let body = statement('Chamar {a|investigado}\nde {r|réu} pode render um processo.', { y: 420, size: 86, d: 0.3, step: 0.8 }).svg;
      body += anim('up', 2.2, rich('E aí você aprende a diferença na prática. Do lado errado da mesa.', { x: W / 2, y: 800, size: 38, fill: C.ink2, anchor: 'middle', w: BW }).svg);
      return { body, source: SRC_LEG };
    }
  },
  {
    id: '5.2-02', aula: '5.2', title: 'A linha do tempo do processo penal',
    cue: '[TELA: linha do tempo que se monta a cada fase]',
    render() {
      const h = heading('Cada fase, uma palavra');
      let body = h.svg;
      const ph = [
        ['Investigado', 'Polícia ou MP apuram. Em geral, inquérito.', C.ink2],
        ['Indiciado', 'O delegado aponta o provável autor. Lei 12.830/2013.', C.blue],
        ['Denunciado', 'O MP oferece a acusação formal. CPP, art. 41.', C.blue],
        ['Réu', 'O juiz recebe a denúncia. Começa a ação penal.', C.amber],
        ['1ª instância', 'Sentença: condenado ou absolvido. Cabe recurso.', C.amber],
        ['2ª instância', 'Acórdão do tribunal. Pode haver recurso ao STJ e ao STF.', C.amber],
        ['Trânsito em julgado', 'Não cabe mais recurso. Só aí a condenação é definitiva.', C.red]
      ];
      const n = ph.length; const x0 = X0 + 20; const w = BW - 40; const y = 560;
      body += anim('draw', 0.5, `<path d="M${x0} ${y} H${x0 + w}" stroke="${C.lineUi}" stroke-width="4" fill="none" pathLength="1"/>`, { t: 1.2 });
      ph.forEach(([t, s, col], i) => {
        const px = x0 + (i * w) / (n - 1); const up = i % 2 === 0; const d = 1.0 + i * 0.9;
        const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
        body += anim('pop', d, `<rect x="${px - 16}" y="${y - 16}" width="32" height="32" fill="${col}" transform="rotate(45 ${px} ${y})"/><path d="M${px} ${up ? y - 28 : y + 28} V${up ? y - 70 : y + 70}" stroke="${col}" stroke-width="3"/>`);
        const tl = layout(s, { size: 22, w: 380 });
        const ty = up ? y - 100 - tl.h : y + 120;
        body += anim(up ? 'down' : 'up', d + 0.15, rich(t, { x: px, y: ty, size: 32, font: 'display', fill: col, anchor, w: 420 }).svg + rich(s, { x: px, y: ty + 40, size: 22, fill: C.ink2, anchor, w: 380, lh: 1.25 }).svg);
      });
      body += anim('fade', 8.0, rich('Terminada a investigação, o MP pode arquivar, propor acordo ou denunciar.', { x: X0, y: 960, size: 26, font: 'mono', fill: C.ink3, w: BW }).svg);
      return { body, source: SRC_LEG };
    }
  },
  {
    id: '5.2-03', aula: '5.2', title: 'A frase certa em cada fase',
    cue: '[TELA: a frase certa ao lado de cada fase]',
    render() {
      const h = heading('Como escrever cada fase');
      const t = table({
        y: 290, rowH: 104, headH: 60, size: 32, d0: 0.8, step: 0.8,
        cols: [{ h: 'Fase', w: 380, bold: true }, { h: 'A frase', w: 1300 }],
        rows: [
          ['Investigação', '“O deputado {a|é investigado} em inquérito no STF.”'],
          ['Indiciamento', '“O secretário {a|foi indiciado} pela Polícia Federal.”'],
          ['Denúncia', '“O Ministério Público {a|denunciou} o prefeito por peculato.”'],
          ['Ação penal', '“A Justiça recebeu a denúncia, e o prefeito {a|virou réu}.”'],
          ['Sentença', '“O prefeito {a|foi condenado em primeira instância e pode recorrer}.”'],
          ['Definitiva', '“A condenação {a|transitou em julgado}.”']
        ]
      });
      return { body: h.svg + t.svg, source: SRC_LEG };
    }
  },
  {
    id: '5.2-04', aula: '5.2', title: 'Uma pessoa, vários processos',
    cue: 'BLOCO 2 — “A mesma pessoa pode estar em fases diferentes em processos diferentes.”',
    render() {
      let body = node({ x: 400, y: 560, t: 'A mesma pessoa', w: 420, h: 160, d: 0.3, color: C.ink2, size: 40 });
      const ps = [['Processo A', 'investigada em inquérito', C.ink2, 330], ['Processo B', 'ré em ação penal', C.amber, 560], ['Processo C', 'condenada em 1ª instância, pode recorrer', C.red, 790]];
      ps.forEach(([t, s, col, y], i) => {
        body += arrowPath(`M610 560 C760 560 760 ${y} 920 ${y}`, { d: 1.0 + i * 0.6, color: col, end: [920, y, 0] });
        body += anim('left', 1.4 + i * 0.6, box({ x: 940, y: y - 80, w: 860, h: 160, fill: C.s1, stroke: col, sw: 3 }) + rich(t, { x: 976, y: y - 20, size: 26, font: 'mono', weight: 700, fill: col, upper: true, w: 780 }).svg + rich(s, { x: 976, y: y + 40, size: 32, font: 'display', w: 790 }).svg);
      });
      body += anim('up', 3.6, rich('Diga sempre de {a|qual processo} você está falando.', { x: X0, y: 990, size: 40, font: 'display', w: BW }).svg);
      return { body, kicker: undefined, source: undefined };
    }
  },
  {
    id: '5.2-05', aula: '5.2', title: 'Prisão não é condenação',
    cue: 'BLOCO 3 — prisão preventiva e temporária são cautelares; pena só depois do trânsito em julgado',
    render() {
      const h = heading('Prisão não é condenação. E o contrário também vale.', { size: 54 });
      const c = columns([
        { head: '“Foi preso” ≠ “foi condenado”', body: 'Prisão preventiva e prisão temporária são {a|medidas cautelares}. Servem à investigação ou ao processo. Não são pena.', icon: 'lock' },
        { head: 'Condenado e solto', body: 'Desde 2019, nas ADCs 43, 44 e 54, o STF entende que a pena só pode ser executada depois do trânsito em julgado. {a|Condenado em 2ª instância e solto é situação comum, não escândalo em si.}', icon: 'scale' }
      ], { y: 320, h: 560, size: 34, headSize: 40, step: 1.4 });
      return { body: h.svg + c.svg, source: SRC_LEG };
    }
  },
  {
    id: '5.2-06', aula: '5.2', title: 'Acordo não é condenação',
    cue: 'BLOCO 4 — acordo de não persecução penal, art. 28-A do CPP',
    render() {
      const h = heading('Acordo não é condenação', { sub: 'Acordo de não persecução penal, CPP, art. 28-A. Uma das condições é confessar formalmente. Não aparece na certidão de antecedentes.' });
      const c = compare(
        { head: 'Não escreva', body: '{w|“Foi condenado.”}', kind: 'no' },
        { head: 'Escreva', body: '{w|“Fez acordo com o Ministério Público, no qual admitiu os fatos, para não ser processado.”}', kind: 'ok', delay: 1.4 },
        { y: 430, h: 420, size: 40 }
      );
      return { body: h.svg + c, source: SRC_LEG };
    }
  },
  {
    id: '5.2-07', aula: '5.2', title: 'Nem todo processo é criminal',
    cue: 'BLOCO 5 — improbidade é cível; efeitos eleitorais; o foro',
    render() {
      const h = heading('Nem todo processo é criminal');
      const c = columns([
        { head: 'Improbidade', body: 'Ação cível. Quem responde é réu numa ação cível, não num processo criminal. Desde a Lei 14.230/2021, exige {a|dolo}: erro ou descuido não bastam.', icon: 'scale' },
        { head: 'Eleitoral', body: 'Pela Lei da Ficha Limpa, certas condenações por {a|órgão colegiado} já podem gerar inelegibilidade, sem esperar o trânsito em julgado.', icon: 'flag' },
        { head: 'Foro', body: 'Governador responde por crime comum no STJ. Deputado federal e senador, no STF. {a|As regras mudaram mais de uma vez: confira o caso concreto.}', icon: 'building' }
      ], { y: 310, h: 600, size: 30, headSize: 40, step: 1.0 });
      return { body: h.svg + c.svg, source: SRC_LEG };
    }
  },

  // ---------------------------------------------------------------- 5.3
  {
    id: '5.3-01', aula: '5.3', title: 'A palavra do delator',
    cue: 'ABERTURA — “A palavra do delator, sozinha, não condena ninguém. Também não deveria virar manchete sozinha.”',
    render() {
      let body = statement('A palavra do delator, sozinha,\nnão condena ninguém.', { y: 380, size: 80, d: 0.3, step: 0.8 }).svg;
      body += anim('up', 2.0, rich('{a|Também não deveria virar manchete sozinha.}', { x: W / 2, y: 760, size: 52, font: 'display', anchor: 'middle', w: BW }).svg);
      return { body, source: SRC_LEG };
    }
  },
  {
    id: '5.3-02', aula: '5.3', title: 'Meio de obtenção de prova',
    cue: 'BLOCO 1 — Lei 12.850, art. 3º-A: o acordo é “meio de obtenção de prova”; não é a prova',
    render() {
      const h = heading('Colaboração premiada', { sub: 'Delação vem do latim delatio: denúncia, acusação. Está na Lei 12.850/2013.' });
      let body = h.svg;
      body += node({ x: 360, y: 560, t: 'Delação', sub: 'conta o que sabe, entrega provas', w: 420, h: 170, d: 0.8, color: C.amber, size: 40 });
      body += anim('draw', 1.6, `<path d="M590 560 C800 460 1100 660 1330 560" stroke="${C.ink2}" stroke-width="6" stroke-dasharray="1" fill="none" pathLength="1"/>`, { t: 1.2 });
      body += anim('fade', 2.0, rich('o caminho', { x: 960, y: 520, size: 26, font: 'mono', weight: 700, fill: C.ink2, anchor: 'middle', w: 300 }).svg);
      body += node({ x: 1560, y: 560, t: 'Prova', sub: 'documentos, extratos, registros', w: 420, h: 170, d: 2.8, color: C.green, size: 40 });
      body += anim('up', 3.4, rich('“Meio de obtenção de prova”, diz o art. 3º-A. {a|Não é a prova. É o caminho para chegar a ela.}', { x: X0, y: 820, size: 38, font: 'display', w: BW, lh: 1.12 }).svg);
      body += anim('fade', 4.2, rich('Em troca do que entrega, o colaborador pode ter a pena reduzida ou até perdoada.', { x: X0, y: 950, size: 28, fill: C.ink2, w: BW }).svg);
      return { body, source: SRC_LEG };
    }
  },
  {
    id: '5.3-03', aula: '5.3', title: 'Lei 12.850, art. 4º, §16',
    cue: '[TELA: art. 4º, §16, da Lei 12.850]',
    render() {
      const p = paperCard({ y: 180, ref: 'Lei 12.850/2013 · art. 4º, §16', text: '“Nenhuma das seguintes medidas será decretada ou proferida com fundamento {h|apenas nas declarações do colaborador}:\nI - medidas cautelares reais ou pessoais;\nII - recebimento de denúncia ou queixa-crime;\nIII - sentença condenatória.”', size: 40, d: 0.3, hlD: 1.6 });
      let body = p.svg;
      body += anim('up', 3.4, rich('Se a Justiça não pode condenar só com a palavra do delator, {a|o jornalista não deveria acusar só com ela.}', { x: X0, y: p.bottom + 110, size: 38, font: 'display', w: BW, lh: 1.12 }).svg);
      return { body, source: SRC_LEG };
    }
  },
  {
    id: '5.3-04', aula: '5.3', title: 'Por que desconfiar do delator',
    cue: 'BLOCO 3 — o incentivo embutido; sigilo até o recebimento da denúncia, art. 7º, §3º',
    render() {
      const h = heading('Por que desconfiar');
      let body = h.svg;
      body += anim('up', 0.6, box({ x: X0, y: 300, w: 800, h: 560, fill: C.s1, stroke: C.amber, sw: 3 }) + label('O incentivo embutido', { x: X0 + 36, y: 354, size: 24 }));
      for (let i = 0; i < 5; i++) {
        body += anim('growY', 1.0 + i * 0.25, `<rect x="${X0 + 60 + i * 140}" y="${760 - (i + 1) * 70}" width="100" height="${(i + 1) * 70}" fill="${C.amber}" fill-opacity="${0.35 + i * 0.13}"/>`);
      }
      body += anim('fade', 2.4, rich('quanto mais entrega → maior o prêmio', { x: X0 + 400, y: 820, size: 28, font: 'mono', weight: 700, anchor: 'middle', w: 760 }).svg);
      body += anim('up', 2.8, rich('Isso não torna o delator mentiroso. {a|Torna a palavra dele interessada.}', { x: 1000, y: 380, size: 34, weight: 700, w: 800 }).svg);
      body += anim('up', 3.8, box({ x: 1000, y: 540, w: 800, h: 320, fill: C.s1, stroke: C.red, sw: 3 }) + label('Art. 7º, §3º', { x: 1036, y: 594, size: 24, color: C.red })
        + rich('O acordo e os depoimentos ficam em sigilo até o recebimento da denúncia.', { x: 1036, y: 650, size: 30, weight: 500, w: 730 }).svg + rich('Se vazou antes, {r|alguém escolheu vazar}. Por que agora?', { x: 1036, y: 790, size: 34, weight: 700, w: 730 }).svg);
      return { body, source: SRC_LEG };
    }
  },
  {
    id: '5.3-05', aula: '5.3', title: 'Onde estava o acusado em 12 de março',
    cue: 'BLOCO 4 — “A agenda pública dele pode desmentir o delator. Ou confirmar.”',
    render() {
      let body = anim('up', 0.3, `<rect x="${X0}" y="200" width="820" height="200" rx="16" fill="${C.s3}"/>` + label('O delator diz', { x: X0 + 30, y: 250, size: 22, color: C.ink3 })
        + rich('“Entreguei o dinheiro num restaurante, em 12 de março.”', { x: X0 + 30, y: 320, size: 38, font: 'display', w: 760, lh: 1.1 }).svg);
      body += arrowV(X0 + 410, 420, 500, { d: 1.2, color: C.amber });
      body += anim('pop', 1.6, box({ x: X0, y: 520, w: 820, h: 220, fill: C.paper, stroke: C.paper, sw: 0 }) + rich('AGENDA PÚBLICA · 12 DE MARÇO', { x: X0 + 30, y: 570, size: 24, font: 'mono', weight: 700, fill: C.pAccent, w: 760 }).svg
        + rich('Onde estava o acusado?', { x: X0 + 30, y: 650, size: 40, font: 'display', fill: C.pInk, w: 760 }).svg);
      body += anim('up', 2.6, rich('Pode {r|desmentir} o delator. Ou {g|confirmar}.', { x: X0, y: 820, size: 40, font: 'display', w: 820 }).svg);
      body += anim('fade', 0.8, label('Corroboração', { x: 1040, y: 230, size: 24 }) + rich('a prova que confirma por outro caminho', { x: 1040, y: 262, size: 22, fill: C.ink2, w: 760 }).svg);
      body += checklist(['Extratos mencionados', 'Contratos', 'Agendas oficiais, que você pode pedir pela LAI', 'Registros de entrada em prédios públicos', 'Voos', 'Datas que batem ou não batem'], { x: 1040, y: 310, w: 760, size: 32, step: 0.45, d0: 1.0, gap: 28 }).svg;
      return { body, source: SRC_LEG };
    }
  },
  {
    id: '5.3-06', aula: '5.3', title: 'Como escrever a delação',
    cue: 'BLOCO 4 — “Segundo o delator, cuja colaboração ainda não foi confirmada por outras provas…”',
    render() {
      const h = heading('Na hora de escrever');
      let body = h.svg;
      body += list([
        '“Segundo o delator, cuja colaboração ainda não foi confirmada por outras provas…”',
        '“O colaborador afirma, sem apresentar documentos até agora, que…”'
      ], { y: 330, size: 44, gap: 50, numbered: false, marker: 'ok', step: 1.2 }).svg;
      body += anim('up', 3.2, rich('E o outro lado, sempre. {a|Com destaque parecido.}', { x: X0, y: 860, size: 48, font: 'display', w: BW }).svg);
      return { body, source: SRC_LEG };
    }
  },

  // ---------------------------------------------------------------- 5.4
  {
    id: '5.4-01', aula: '5.4', title: 'Cada verbo precisa de um documento',
    cue: 'ABERTURA — “‘Recebeu’ precisa de extrato. ‘Assinou’ precisa de assinatura. ‘Desviou’ precisa de sentença.”',
    render() {
      const h = heading('Cada verbo precisa de um documento');
      let body = h.svg;
      const rows = [['Recebeu', 'extrato', C.green], ['Assinou', 'assinatura', C.green], ['Desviou', 'sentença', C.red]];
      rows.forEach(([v, d0, col], i) => {
        const y = 330 + i * 170; const d = 0.8 + i * 1.0;
        body += anim('left', d, rich(`“${v}”`, { x: X0, y: y + 80, size: 72, font: 'display', w: 700 }).svg);
        body += arrowH(X0 + 640, y + 56, X0 + 860, { d: d + 0.4, color: col, sw: 5 });
        body += anim('pop', d + 0.8, `<rect x="${X0 + 900}" y="${y}" width="${780}" height="110" fill="${col}"/>` + rich(`precisa de ${d0}`, { x: X0 + 940, y: y + 74, size: 48, font: 'display', fill: C.bg, w: 720 }).svg);
      });
      body += anim('up', 4.4, rich('Ou de muita coragem e um bom advogado.', { x: X0 + 900, y: 900, size: 30, fill: C.ink2, w: 780 }).svg);
      return { body };
    }
  },
  {
    id: '5.4-02', aula: '5.4', title: 'Checagem linha a linha',
    cue: '[DEMONSTRAÇÃO: roteiro de exemplo com cada afirmação numerada e uma coluna de fontes na margem]',
    render() {
      const h = heading('Se não tem fonte na margem, sai do roteiro', { size: 58 });
      const t = table({
        y: 290, rowH: 108, headH: 60, size: 28, d0: 0.8, step: 0.7,
        cols: [{ h: 'Nº', w: 90, mono: true }, { h: 'Afirmação', w: 1000 }, { h: 'Fonte', w: 590, mono: true }],
        rows: [
          ['1', 'O contrato tem valor de R$ 480 mil.', 'PNCP, contrato 045/2025, p. 1, acesso em [data]'],
          ['2', 'A empresa foi aberta em 10/03/2025.', 'Cadastro CNPJ, Receita, acesso em [data]'],
          ['3', 'O sócio é assessor do vereador.', 'Diário Oficial da Câmara, 15/01/2025'],
          ['4', '{s|O prefeito sabia de tudo.}', '{r|—}']
        ]
      });
      let body = h.svg + t.svg;
      body += stamp('SAI DO ROTEIRO', { x: 1500, y: 290 + 60 + 3 * 108 + 54, color: C.red, size: 36, d: 4.0 });
      body += anim('up', 4.6, rich('Depois, alguém confere cada número contra a fonte. De preferência outra pessoa. Se for você, no dia seguinte.', { x: X0, y: 900, size: 30, fill: C.ink2, w: BW }).svg);
      return { body, source: 'Exemplo fictício' };
    }
  },
  {
    id: '5.4-03', aula: '5.4', title: 'O método de quem checa',
    cue: 'BLOCO 2 — Verification Handbook, Lupa, Aos Fatos, Projeto Comprova',
    render() {
      const h = heading('O esqueleto de toda checagem');
      let body = h.svg;
      body += flow([
        { t: 'Escolha', sub: 'uma afirmação verificável' },
        { t: 'Vá à fonte', sub: 'original' },
        { t: 'Consulte', sub: 'dados oficiais' },
        { t: 'Ouça', sub: 'o autor da afirmação' },
        { t: 'Classifique', sub: 'o resultado', color: C.green }
      ], { y: 340, h: 260, step: 0.7, gap: 50, size: 38, subSize: 26 }).svg;
      body += anim('up', 4.2, rich('Referências gratuitas: o {a|Verification Handbook}, do European Journalism Centre; e os métodos publicados por {a|Lupa}, {a|Aos Fatos} e o {a|Projeto Comprova}.', { x: X0, y: 760, size: 32, weight: 500, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '5.4-04', aula: '5.4', title: 'Armadilhas com números, parte 1',
    cue: '[TELA: cada armadilha com um exemplo] — unidade e período; empenhado não é pago',
    render() {
      const h = heading('Armadilhas com números');
      const c = columns([
        { head: 'Unidade', body: '{a|Milhão} não é {r|bilhão}.', icon: 'hash' },
        { head: 'Período', body: '{a|Por ano} não é {r|por mandato}.', icon: 'cal' },
        { head: 'Fase do gasto', body: '{a|Empenhado} não é {r|pago}. Aula 4.2.', icon: 'money' }
      ], { y: 330, h: 380, size: 44, headSize: 44, step: 1.0 });
      return { body: h.svg + c.svg };
    }
  },
  {
    id: '5.4-05', aula: '5.4', title: 'Armadilhas com números, parte 2',
    cue: '[TELA: cada armadilha com um exemplo] — valor corrigido, por habitante, porcentagem e ponto percentual',
    render() {
      const h = heading('Mais três armadilhas');
      let body = h.svg;
      body += anim('up', 0.6, box({ x: X0, y: 300, w: 540, h: 560, fill: C.s1, stroke: C.amber, sw: 3 }) + label('Nominal × corrigido', { x: X0 + 30, y: 350, size: 22 })
        + rich('R$ 1 milhão em 2016 não é R$ 1 milhão hoje.', { x: X0 + 30, y: 420, size: 34, font: 'display', w: 480, lh: 1.1 }).svg + rich('Para comparar anos diferentes, corrija pela inflação, normalmente pelo {a|IPCA}.', { x: X0 + 30, y: 640, size: 28, fill: C.ink2, w: 480 }).svg);
      body += anim('up', 1.8, box({ x: X0 + 570, y: 300, w: 540, h: 560, fill: C.s1, stroke: C.amber, sw: 3 }) + label('Por habitante', { x: X0 + 600, y: 350, size: 22 })
        + rich('R$ 10 milhões', { x: X0 + 600, y: 420, size: 34, font: 'display', w: 480 }).svg
        + rich('cidade de 10 mil habitantes', { x: X0 + 600, y: 490, size: 26, fill: C.ink2, w: 480 }).svg + rich('{a|R$ 1.000 por habitante}', { x: X0 + 600, y: 540, size: 34, weight: 700, w: 480 }).svg
        + rich('cidade de 1 milhão', { x: X0 + 600, y: 640, size: 26, fill: C.ink2, w: 480 }).svg + rich('{a|R$ 10 por habitante}', { x: X0 + 600, y: 690, size: 34, weight: 700, w: 480 }).svg);
      body += anim('up', 3.0, box({ x: X0 + 1140, y: 300, w: 540, h: 560, fill: C.s1, stroke: C.amber, sw: 3 }) + label('% × ponto percentual', { x: X0 + 1170, y: 350, size: 22 })
        + rich('De 10% para 15%', { x: X0 + 1170, y: 420, size: 34, font: 'display', w: 480 }).svg + rich('= alta de {a|5 pontos percentuais}', { x: X0 + 1170, y: 500, size: 30, weight: 700, w: 480 }).svg
        + rich('= alta de {a|50%}', { x: X0 + 1170, y: 560, size: 30, weight: 700, w: 480 }).svg + rich('As duas frases são verdadeiras. Só uma é honesta no contexto.', { x: X0 + 1170, y: 680, size: 28, fill: C.ink2, w: 480 }).svg);
      return { body };
    }
  },
  {
    id: '5.4-06', aula: '5.4', title: 'A escala de verbos',
    cue: '[TELA: escala do mais forte ao mais fraco]',
    render() {
      const h = heading('A escala de verbos', { sub: 'Do mais forte ao mais fraco. Cada degrau pede um tipo de prova.' });
      let body = h.svg;
      const rows = [
        ['“Recebeu”, “assinou”, “pagou”', 'o documento prova', C.green],
        ['“Teria recebido, segundo X”', 'versão atribuída', C.blue],
        ['“É investigado por”, “foi denunciado por”', 'fase formal, com o processo identificado', C.amber],
        ['“Não explicou”, “não respondeu”', 'o fato é o silêncio', C.ink2]
      ];
      rows.forEach(([v, s, col], i) => {
        const y = 370 + i * 110; const d = 0.8 + i * 0.7; const w = 1680 - i * 120;
        body += anim('grow', d, `<rect x="${X0}" y="${y}" width="${w}" height="92" fill="${col}" fill-opacity=".16"/><rect x="${X0}" y="${y}" width="10" height="92" fill="${col}"/>`);
        body += anim('fade', d + 0.3, rich(v, { x: X0 + 36, y: y + 58, size: 32, weight: 700, w: 900 }).svg + rich(s, { x: X0 + w - 30, y: y + 58, size: 24, font: 'mono', weight: 700, fill: col, anchor: 'end', w: 680 }).svg);
      });
      body += anim('fade', 3.8, label('Fora do roteiro, sem condenação ou prova direta', { x: X0, y: 850, size: 22, color: C.red }));
      let px = X0;
      ['desviou', 'roubou', 'esquema', 'quadrilha', '“laranja” como acusação', 'comprovadamente', 'sem dúvida'].forEach((t, i) => { const p = pill(t, { x: px, y: 910, size: 24, color: C.red, d: 4.0 + i * 0.2 }); body += p.svg; px += p.w + 16; });
      return { body };
    }
  },
  {
    id: '5.4-07', aula: '5.4', title: 'Corte os adjetivos',
    cue: 'BLOCO 4 — “Adjetivo não acrescenta prova. Só acrescenta risco.”',
    render() {
      let body = '';
      ['escandaloso', 'absurdo', 'vergonhoso'].forEach((t, i) => {
        body += anim('up', 0.3 + i * 0.4, rich(`{s|${t}}`, { x: W / 2, y: 330 + i * 130, size: 96, font: 'display', anchor: 'middle', w: 1600, hlD: 1.6 + i * 0.3 }).svg);
      });
      body += anim('up', 3.0, rich('Adjetivo não acrescenta prova. {a|Só acrescenta risco.}', { x: W / 2, y: 820, size: 52, font: 'display', anchor: 'middle', w: BW }).svg);
      body += anim('up', 3.6, rich('Se o fato é escandaloso, o público percebe sozinho.', { x: W / 2, y: 910, size: 34, fill: C.ink2, anchor: 'middle', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '5.4-08', aula: '5.4', title: 'Título e thumbnail também são publicação',
    cue: 'BLOCO 5 — “PREFEITO LADRÃO” com sirene × “O contrato de R$ 4 milhões que ninguém explicou”',
    render() {
      const h = heading('Título e thumbnail também são publicação', { size: 56 });
      let body = h.svg;
      body += thumb(X0, 340, 800, 'PREFEITO LADRÃO', true, 0.6);
      body += badge('no', { x: X0 + 740, y: 310, s: 60, d: 1.4 });
      body += anim('fade', 1.2, rich('Acusação de crime, em letras garrafais.', { x: X0, y: 840, size: 28, fill: C.red, weight: 700, w: 800 }).svg);
      body += thumb(1000, 340, 800, 'O contrato de R$ 4 milhões que ninguém explicou', false, 2.2);
      body += badge('ok', { x: 1740, y: 310, s: 60, d: 3.0 });
      body += anim('fade', 2.8, rich('Curiosidade vem da pergunta, não da condenação antecipada.', { x: 1000, y: 840, size: 28, fill: C.green, weight: 700, w: 800 }).svg);
      body += anim('up', 3.8, rich('Título, thumbnail, legenda e descrição passam pela mesma escala de verbos.', { x: X0, y: 950, size: 30, fill: C.ink2, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '5.4-09', aula: '5.4', title: 'Quando errar',
    cue: 'BLOCO 6 — corrija rápido e à vista: comentário fixado, descrição, card',
    render() {
      const h = heading('Você vai errar. Corrija rápido e à vista.');
      let body = h.svg;
      body += checklist([
        'Comentário fixado', 'Correção na descrição', 'Card no vídeo', { t: 'Vídeo de correção', sub: 'se o erro for grave' }
      ], { y: 320, w: 900, size: 40, step: 0.6, gap: 34 }).svg;
      body += anim('up', 3.0, box({ x: 1060, y: 320, w: 740, h: 520, fill: C.s1, stroke: C.amber, sw: 3 }) + label('Lei 13.188, art. 2º, §3º', { x: 1096, y: 374, size: 22 })
        + rich('A correção espontânea não impede o direito de resposta nem uma ação de indenização.', { x: 1096, y: 440, size: 32, weight: 500, w: 670 }).svg
        + rich('Mas mostra boa-fé.', { x: 1096, y: 680, size: 44, font: 'display', w: 670 }).svg + rich('{a|E boa-fé pesa.}', { x: 1096, y: 750, size: 44, font: 'display', w: 670 }).svg);
      return { body, source: SRC_LEG };
    }
  }
];
