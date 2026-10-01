// Módulo 2 — Fontes e documentos
import { createHash } from 'node:crypto';
import {
  C, W, H, X0, X1, BW, anim, rich, layout, heading, statement, list, columns, compare, flow, timeline, paperCard,
  stamp, table, box, icon, badge, arrowH, arrowV, arrowPath, edge, node, pill, redact, checklist, docSheet, bars, label
} from '../kit.mjs';

const sha = (s) => createHash('sha256').update(s).digest('hex');

export default [
  // ---------------------------------------------------------------- 2.1
  {
    id: '2.1-01', aula: '2.1', title: 'Fonte queimada não volta',
    cue: 'ABERTURA — “Off mal combinado é a principal causa de fonte queimada. E fonte queimada não volta.”',
    render() {
      let body = anim('up', 0.2, rich('Off mal combinado é a principal causa de {a|fonte queimada}.', { x: X0, y: 320, size: 60, font: 'display', w: 820, lh: 1.08 }).svg);
      body += anim('up', 1.0, rich('E fonte queimada não volta.', { x: X0, y: 600, size: 44, font: 'display', w: 820 }).svg);
      body += anim('up', 1.6, rich('Nem ela, nem as amigas dela.', { x: X0, y: 680, size: 44, font: 'display', fill: C.red, w: 820 }).svg);
      const cx = 1400; const cy = 560;
      const pts = [[0, -250], [220, -140], [260, 90], [110, 250], [-140, 240], [-260, 70], [-220, -150], [60, -120], [-80, 110], [150, 30]];
      pts.forEach(([dx, dy], i) => {
        body += anim('draw', 0.6 + i * 0.05, `<path d="M${cx} ${cy} L${cx + dx} ${cy + dy}" stroke="${C.lineUi}" stroke-width="3" fill="none" pathLength="1"/>`);
      });
      pts.forEach(([dx, dy], i) => {
        const n = anim('pop', 0.8 + i * 0.08, `<circle cx="${cx + dx}" cy="${cy + dy}" r="${i < 7 ? 34 : 24}" fill="${C.s2}" stroke="${C.ink2}" stroke-width="3"/>` + icon('person', { x: cx + dx - 16, y: cy + dy - 16, s: 32, color: C.ink2, sw: 3 }));
        body += anim('dim', 2.9 + i * 0.12, n);
      });
      body += anim('pop', 0.5, `<circle cx="${cx}" cy="${cy}" r="58" fill="${C.s1}" stroke="${C.amber}" stroke-width="5"/>` + icon('person', { x: cx - 26, y: cy - 28, s: 52, color: C.amber, sw: 3.5 }));
      body += anim('pop', 2.2, `<circle cx="${cx}" cy="${cy}" r="58" fill="${C.red}"/>` + icon('cross', { x: cx - 26, y: cy - 26, s: 52, color: C.bg, sw: 6 }));
      return { body };
    }
  },
  {
    id: '2.1-02', aula: '2.1', title: 'Os cinco tipos de fonte',
    cue: '[TELA: os cinco tipos de fonte]',
    render() {
      const h = heading('Fonte é de onde a água sai', { sub: 'Como toda água, a informação precisa ser tratada antes de beber.' });
      const c = columns([
        { head: 'Oficiais', body: 'Assessorias, órgãos, autoridades. Dão a versão oficial. Útil como registro, raramente como revelação.', icon: 'building', color: C.ink2 },
        { head: 'Especialistas', body: 'Explicam como a coisa funciona. Contador, engenheiro, auditor aposentado.', icon: 'search', color: C.blue },
        { head: 'Testemunhas', body: 'Viram ou participaram.', icon: 'eye', color: C.green },
        { head: 'Gente de dentro', body: 'Servidor de carreira, ex-funcionário, fornecedor. {a|Onde moram as melhores histórias.}', icon: 'key', color: C.amber },
        { head: 'Adversários', body: 'Sabem muito e têm interesse em que você saiba. Ouça. Desconfie na mesma proporção.', icon: 'bolt', color: C.red }
      ], { y: 380, h: 520, size: 28, headSize: 34, gap: 24, step: 0.6 });
      return { body: h.svg + c.svg };
    }
  },
  {
    id: '2.1-03', aula: '2.1', title: 'On, off e background',
    cue: 'BLOCO 2 — as três combinações possíveis com a fonte',
    render() {
      const h = heading('Três combinações', { sub: 'Regra de ouro: combine {a|antes} de ouvir.' });
      const c = columns([
        { head: 'On', body: 'Publicada com o nome da fonte.\n\n{w|“Segundo Fulano, ex-diretor financeiro…”}', icon: 'person', color: C.green, foot: 'O nome vai ao ar.' },
        { head: 'Off', body: 'Usada, sem identificar quem falou.\n\n{w|“Segundo um servidor da secretaria que pediu para não ser identificado…”}', icon: 'eye', color: C.amber, foot: 'A informação vai. O nome, não.' },
        { head: 'Background', body: 'Não é publicada. Só orienta você.\n\n{w|“Olhe o contrato de 2024, não o de 2023.”}', icon: 'search', color: C.blue, foot: 'Nada vai ao ar.' }
      ], { y: 380, h: 540, size: 32, headSize: 48, step: 0.9 });
      return { body: h.svg + c.svg };
    }
  },
  {
    id: '2.1-04', aula: '2.1', title: 'A matriz de credibilidade',
    cue: '[TELA: matriz com quatro colunas — acesso, interesse, histórico, corroboração]',
    render() {
      const h = heading('Nem toda fonte vale o mesmo', { sub: 'Quatro perguntas, nota de 1 a 3 em cada.' });
      const t = table({
        y: 360, rowH: 92, headH: 64, size: 30, d0: 0.9, step: 0.7,
        cols: [{ h: 'Fonte', w: 560 }, { h: 'Acesso', w: 240, mono: true }, { h: 'Interesse', w: 260, mono: true }, { h: 'Histórico', w: 260, mono: true }, { h: 'Corroboração', w: 360 }],
        rows: [
          ['Servidor de carreira', '3', '1', '2', '{g|documento confirma}'],
          ['Especialista externo', '1', '1', '3', '{g|dados públicos}'],
          { cells: ['{w|Ex-aliado do investigado}', '{r|3}', '{r|3}', '1', '{r|nenhuma}'], mark: C.red }
        ]
      });
      let body = h.svg + t.svg;
      body += anim('draw', 3.4, `<rect x="${X0 - 8}" y="${360 + 64 + 2 * 92 - 6}" width="${1680 + 16}" height="${92 + 12}" fill="none" stroke="${C.red}" stroke-width="5" pathLength="1"/>`);
      body += anim('up', 4.0, rich('Muito acesso, muito interesse, nenhuma corroboração: {r|a fonte mais perigosa que existe.}', { x: X0, y: 790, size: 38, font: 'display', w: BW, lh: 1.12 }).svg);
      body += anim('up', 4.8, rich('Sabe o suficiente para te convencer. Quer o suficiente para te usar.', { x: X0, y: 915, size: 32, fill: C.ink2, w: BW }).svg);
      return { body, source: 'Exemplo ilustrativo' };
    }
  },
  {
    id: '2.1-05', aula: '2.1', title: 'O off orienta, o documento sustenta',
    cue: 'BLOCO 4 — a fonte diz “o contrato foi superfaturado”: isso não vai ao ar, vira uma busca',
    render() {
      const h = heading('O off orienta. {a|O documento sustenta.}');
      let body = h.svg;
      body += flow([
        { t: 'A fonte diz', sub: '“O contrato foi superfaturado.”', color: C.red },
        { t: 'Vira uma busca', sub: 'O contrato, os preços, a comparação com outros contratos.' },
        { t: 'Os documentos confirmam?', sub: 'Se não confirmam, não vai ao ar.' },
        { t: 'Publica o que eles mostram', sub: 'Não o que a fonte disse.', color: C.green }
      ], { y: 340, h: 300, step: 1.1, size: 38, subSize: 26 }).svg;
      body += stamp('NÃO VAI AO AR', { x: X0 + 190, y: 700, color: C.red, size: 30, d: 1.4 });
      body += anim('up', 5.2, rich('A fonte vira o motivo pelo qual você procurou. {a|Não a prova do que encontrou.}', { x: X0, y: 830, size: 40, font: 'display', w: BW, lh: 1.12 }).svg);
      body += anim('up', 6.0, rich('Acusação anônima sem documento é a combinação que mais condena jornalista em processo.', { x: X0, y: 945, size: 30, fill: C.ink2, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '2.1-06', aula: '2.1', title: 'Da periferia para o centro',
    cue: 'BLOCO 5 — comece pela periferia, não pelo centro',
    render() {
      let body = anim('up', 0.2, rich('Comece pela {a|periferia}. Não pelo centro.', { x: X0, y: 300, size: 56, font: 'display', w: 700, lh: 1.08 }).svg);
      body += anim('up', 1.0, rich('Escute mais do que fale. Não conte sua hipótese inteira: quem sabe o que você procura sabe o que esconder.', { x: X0, y: 520, size: 32, fill: C.ink2, w: 660 }).svg);
      const cx = 1200; const cy = 590;
      [[400, C.line], [270, C.lineUi], [140, C.amber]].forEach(([r, col], i) => {
        body += anim('pop', 0.4 + i * 0.3, `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${i === 2 ? 5 : 3}"/>`);
      });
      body += anim('pop', 1.4, rich('o investigado', { x: cx, y: cy + 10, size: 30, font: 'display', anchor: 'middle', w: 240 }).svg + rich('por último', { x: cx, y: cy + 50, size: 22, font: 'mono', weight: 700, fill: C.amber, anchor: 'middle', w: 240 }).svg);
      const outer = [
        [-60, -365, 'servidor que viu três secretários passarem'], [330, -150, 'ex-funcionário da empresa'], [300, 250, 'fornecedor que perdeu a licitação']
      ];
      outer.forEach(([dx, dy, t], i) => {
        const x = cx + dx; const y = cy + dy;
        body += anim('pop', 2.2 + i * 0.6, `<rect x="${x - 22}" y="${y - 22}" width="44" height="44" fill="${C.amber}"/>` + rich(String(i + 1), { x, y: y + 11, size: 28, font: 'mono', weight: 700, fill: C.bg, anchor: 'middle', w: 60 }).svg
          + rich(t, { x: x + (dx > 0 ? 36 : -36), y: y + 10, size: 24, weight: 700, anchor: dx > 0 ? 'start' : 'end', w: 230 }).svg);
      });
      body += arrowPath(`M${cx + 300} ${cy + 250} C${cx - 200} ${cy + 330} ${cx - 330} ${cy - 50} ${cx - 160} ${cy - 90}`, { d: 4.2, color: C.amber, t: 1.2, end: [cx - 160, cy - 90, -12] });
      body += anim('up', 5.2, rich('Ordem de abordagem: da periferia para o centro.', { x: X0, y: 880, size: 32, weight: 700, w: 660 }).svg);
      return { body };
    }
  },
  {
    id: '2.1-07', aula: '2.1', title: 'Prometa só o que depende de você',
    cue: 'BLOCO 5 — “Ninguém nunca vai saber” × “Eu não vou revelar seu nome, nem em juízo”',
    render() {
      const h = heading('Não prometa o que você não controla');
      const c = compare(
        { head: 'Não prometa', body: '{w|“Ninguém nunca vai saber que foi você.”}\n\nDepende de terceiros.', kind: 'no' },
        { head: 'Prometa', body: '{w|“Eu não vou revelar seu nome, nem em juízo.”}\n\nDepende só de você.', kind: 'ok', delay: 1.6 },
        { y: 330, h: 480, size: 40 }
      );
      return { body: h.svg + c };
    }
  },

  // ---------------------------------------------------------------- 2.2
  {
    id: '2.2-01', aula: '2.2', title: 'O silêncio e o rastro',
    cue: 'ABERTURA — “A Constituição protege o seu silêncio. Ela não protege o rastro digital da sua fonte.”',
    render() {
      let body = anim('up', 0.2, box({ x: X0, y: 200, w: 800, h: 520, fill: C.s1, stroke: C.green, sw: 3 }) + icon('lock', { x: X0 + 40, y: 240, s: 110, color: C.green, sw: 4 })
        + rich('A Constituição protege o {g|seu silêncio}.', { x: X0 + 40, y: 470, size: 52, font: 'display', w: 720, lh: 1.08 }).svg);
      body += anim('up', 1.2, box({ x: 1000, y: 200, w: 800, h: 520, fill: C.s1, stroke: C.red, sw: 3 })
        + rich('Não protege o {r|rastro digital} da sua fonte.', { x: 1040, y: 290, size: 44, font: 'display', w: 720, lh: 1.08 }).svg);
      const trail = [['mail', 'O e-mail corporativo de onde o documento saiu'], ['doc', 'O registro do sistema que mostra quem abriu o arquivo'], ['printer', 'A impressora']];
      trail.forEach(([ic, t], i) => {
        const y = 430 + i * 90;
        body += anim('left', 2.0 + i * 0.6, icon(ic, { x: 1040, y, s: 52, color: C.red, sw: 3.5 }) + rich(t, { x: 1120, y: y + 38, size: 28, weight: 500, w: 640 }).svg);
      });
      body += anim('up', 4.2, rich('A maioria das fontes expostas não foi entregue pelo jornalista. {a|Foi entregue pelo próprio documento.}', { x: X0, y: 840, size: 40, font: 'display', w: BW, lh: 1.12 }).svg);
      return { body };
    }
  },
  {
    id: '2.2-02', aula: '2.2', title: 'Sigilo, o selo pequeno',
    cue: 'BLOCO 1 — “Sigilo vem do latim sigillum: selo pequeno. O selo que fechava a carta.”',
    render() {
      const ex = 1040; const ey = 330;
      let body = anim('up', 0.3, `<rect x="${ex}" y="${ey}" width="680" height="440" fill="${C.paper}"/><path d="M${ex} ${ey} L${ex + 340} ${ey + 250} L${ex + 680} ${ey}" fill="#E7E0D0" stroke="${C.pLine}" stroke-width="3"/>`);
      body += anim('stamp', 1.2, `<g><circle cx="${ex + 340}" cy="${ey + 250}" r="86" fill="#B3261E"/><circle cx="${ex + 340}" cy="${ey + 250}" r="62" fill="none" stroke="#7F1A15" stroke-width="5"/>` + rich('S', { x: ex + 340, y: ey + 278, size: 76, font: 'display', fill: '#7F1A15', anchor: 'middle', w: 100 }).svg + '</g>');
      body += anim('up', 0.2, rich('SIGILO', { x: X0, y: 420, size: 130, font: 'display', w: 850 }).svg);
      body += anim('up', 0.8, rich('do latim {a|sigillum}: selo pequeno.', { x: X0, y: 510, size: 44, weight: 500, w: 850 }).svg);
      body += anim('up', 1.4, rich('O selo que fechava a carta.', { x: X0, y: 580, size: 44, weight: 500, fill: C.ink2, w: 850 }).svg);
      return { body };
    }
  },
  {
    id: '2.2-03', aula: '2.2', title: 'Constituição, art. 5º, XIV',
    cue: '[TELA: art. 5º, XIV, destacado]',
    render() {
      const p = paperCard({ y: 200, ref: 'Constituição Federal · art. 5º, XIV', text: '“é assegurado a todos o acesso à informação e {h|resguardado o sigilo da fonte}, quando necessário ao exercício profissional;”', size: 48, d: 0.3, hlD: 1.6 });
      let body = p.svg;
      body += anim('up', 2.6, rich('Você não pode ser obrigado a revelar quem te passou a informação:', { x: X0, y: p.bottom + 110, size: 34, weight: 700, w: BW }).svg);
      let px = X0;
      ['nem pela polícia', 'nem pelo juiz', 'nem por CPI'].forEach((t, i) => { const pl = pill(t, { x: px, y: p.bottom + 180, size: 30, d: 3.2 + i * 0.4, color: C.amber }); body += pl.svg; px += pl.w + 28; });
      body += anim('fade', 4.6, rich('O Código de Ética da FENAJ diz o mesmo no art. 5º.', { x: X0, y: p.bottom + 270, size: 26, font: 'mono', fill: C.ink3, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '2.2-04', aula: '2.2', title: 'A liminar na ADPF 601',
    cue: '[TELA: trecho da decisão no portal do STF]',
    warn: 'Conferir antes de gravar se o mérito da ADPF 601 já foi julgado. Na última checagem do roteiro, seguia só com a liminar.',
    render() {
      const h = heading('O Supremo já aplicou a regra', { sub: 'STF · ADPF 601 · liminar de 2019, do ministro Gilmar Mendes' });
      let body = h.svg;
      body += anim('up', 0.9, box({ x: X0, y: 360, w: 560, h: 420, fill: C.s1, stroke: C.amber, sw: 3 }) + label('Liminar', { x: X0 + 36, y: 420, size: 26 })
        + rich('Decisão provisória e urgente, antes do julgamento final.', { x: X0 + 36, y: 490, size: 36, font: 'display', w: 490, lh: 1.12 }).svg);
      const p = paperCard({ x: 760, y: 360, w: 1040, text: 'Mandou as autoridades se absterem de atos que visassem {h|responsabilizar o jornalista Glenn Greenwald} pela recepção, obtenção ou transmissão das informações que ele publicou sobre as mensagens da Lava Jato.', size: 34, d: 1.5, hlD: 2.8, lh: 1.35 });
      body += p.svg;
      return { body, source: 'Resumo do roteiro · conferir o andamento da ação no portal do STF' };
    }
  },
  {
    id: '2.2-05', aula: '2.2', title: 'O papel e os registros revelaram',
    cue: 'BLOCO 2 — o caso Reality Winner e o documento da NSA, em 2017',
    render() {
      const h = heading('O papel e os registros revelaram', { sub: 'Um caso real: Estados Unidos, 2017.' });
      const steps = [
        ['mail', 'O site The Intercept recebe pelo correio um documento da NSA, a agência de segurança americana.'],
        ['eye', 'Para checar a autenticidade, mostra uma cópia ao próprio governo.'],
        ['printer', 'A cópia mostrava que o documento tinha sido impresso.'],
        ['doc', 'O sistema da agência registrava quem tinha impresso aquele arquivo. Poucas pessoas.'],
        ['chat', 'Uma delas tinha trocado e-mails com o site pelo computador do trabalho.'],
        ['lock', 'A fonte, Reality Winner, foi presa antes de a reportagem sair.']
      ];
      let body = h.svg;
      steps.forEach(([ic, t], i) => {
        const col = i === 5 ? C.red : C.amber;
        const x = X0 + (i % 2) * 850; const y = 380 + Math.floor(i / 2) * 150;
        body += anim('up', 0.9 + i * 0.9, `<rect x="${x}" y="${y}" width="96" height="96" fill="${C.s2}"/>` + icon(ic, { x: x + 22, y: y + 22, s: 52, color: col, sw: 3.5 })
          + rich(String(i + 1).padStart(2, '0'), { x: x + 120, y: y + 26, size: 22, font: 'mono', weight: 700, fill: col, w: 80 }).svg
          + rich(t, { x: x + 120, y: y + 62, size: 29, weight: 500, w: 680, lh: 1.2 }).svg);
      });
      body += anim('up', 6.6, rich('Ninguém revelou o nome dela.', { x: X0, y: 900, size: 44, font: 'display', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '2.2-06', aula: '2.2', title: 'A lei que protege o informante',
    cue: '[TELA: arts. 4º-A a 4º-C da Lei 13.608]',
    render() {
      const h = heading('Lei 13.608: proteção para quem relata', { sub: 'Crimes contra a administração pública, ilícitos administrativos ou ações lesivas ao interesse público, relatados a uma ouvidoria ou corregedoria.' });
      const c = columns([
        { num: '4º-B', head: 'Identidade preservada', body: 'O informante tem direito à preservação da identidade.', icon: 'eye' },
        { num: '4º-C', head: 'Sem retaliação', body: 'Proteção contra demissão arbitrária ou mudança injustificada de funções.', icon: 'shield' },
        { num: '§3º', head: 'Recompensa', body: 'De até {a|5% do valor recuperado}.', icon: 'money' }
      ], { y: 420, h: 420, size: 32, headSize: 40, step: 0.8 });
      return { body: h.svg + c.svg, source: 'Lei 13.608/2018, com artigos incluídos pelo pacote anticrime em 2019' };
    }
  },
  {
    id: '2.2-07', aula: '2.2', title: 'Canal oficial e jornalista',
    cue: 'BLOCO 3 — a proteção vale quando o relato vai ao órgão oficial, não quando vai ao jornalista',
    render() {
      const h = heading('A proteção passa pelo canal oficial');
      let body = h.svg;
      body += node({ x: 360, y: 580, t: 'Relato da fonte', w: 360, h: 130, d: 0.6, color: C.ink2, size: 34 });
      body += node({ x: 1120, y: 400, t: 'Ouvidoria ou corregedoria', sub: 'protegido pela Lei 13.608', w: 520, h: 150, d: 1.6, color: C.green, size: 32 });
      body += node({ x: 1120, y: 760, t: 'Jornalista', sub: 'essa lei não protege', w: 520, h: 150, d: 2.6, color: C.red, size: 32 });
      body += arrowPath('M540 560 C700 480 740 400 850 400', { d: 1.2, color: C.green, end: [850, 400, 0] });
      body += arrowPath('M540 600 C700 680 740 760 850 760', { d: 2.2, color: C.red, end: [850, 760, 0] });
      body += badge('ok', { x: 1400, y: 322, d: 2.0 });
      body += badge('no', { x: 1400, y: 682, d: 3.0 });
      body += anim('up', 3.8, rich('Às vezes, o melhor para a fonte é fazer {a|as duas coisas}. Você não é advogado dela, mas pode mostrar que o caminho existe.', { x: X0, y: 930, size: 32, w: BW, weight: 500 }).svg);
      return { body };
    }
  },
  {
    id: '2.2-08', aula: '2.2', title: 'Protocolo para fonte sensível',
    cue: '[TELA: checklist do protocolo]',
    render() {
      const h = heading('Protocolo para fonte sensível');
      const c = checklist([
        { t: 'Primeiro contato por um canal que não a comprometa', sub: 'Nunca pelo e-mail ou telefone do trabalho dela.' },
        { t: 'Aplicativo com criptografia de ponta a ponta', sub: 'Só quem manda e quem recebe leem. Mensagens temporárias ligadas.' },
        { t: 'Nome verdadeiro fora dos seus contatos' },
        { t: 'Muito sensível: encontro pessoal', sub: 'Sem celulares na mesa.' },
        { t: 'Nunca publique o documento como chegou', sub: 'Recrie, transcreva, recorte. O arquivo pode ter marcas de quem vazou.' },
        { t: 'Nunca mostre o original ao investigado', sub: 'Descreva o conteúdo. Não entregue o papel.' }
      ], { y: 310, size: 32, cols: 2, step: 0.8, gap: 34 });
      return { body: h.svg + c.svg };
    }
  },

  // ---------------------------------------------------------------- 2.3
  {
    id: '2.3-01', aula: '2.3', title: 'Falsificar leva dez minutos',
    cue: 'ABERTURA — “Falsificar um PDF com cara de oficial leva dez minutos.”',
    render() {
      let body = docSheet({ x: 1180, y: 170, w: 560, h: 760, title: 'Ofício nº 000/2025', lines: [0.9, 0.7, 0.95, 0.6, 0.85, 0.9, 0.5, 0.8, 0.7], d: 0.3, stampText: 'SUSPEITO', stampColor: C.red });
      body += anim('pop', 0.9, icon('seal', { x: 1220, y: 196, s: 60, color: C.pAccent, sw: 3 }));
      const parts = [['Brasão', 230], ['Fonte certa', 380], ['Número de processo inventado', 500], ['Ferramenta gratuita', 640]];
      parts.forEach(([t, y], i) => { body += pill(t, { x: 1300, y, size: 26, d: 0.9 + i * 0.4, color: C.amber, fill: C.bg }).svg; });
      body += anim('up', 0.2, rich('Falsificar um PDF com cara de oficial leva', { x: X0, y: 300, size: 48, font: 'display', w: 900, lh: 1.08 }).svg);
      body += anim('pop', 0.8, rich('10 min', { x: X0, y: 520, size: 150, font: 'display', fill: C.amber, w: 800 }).svg);
      body += anim('up', 2.8, rich('Todo documento que chega até você é {a|suspeito até prova em contrário}.', { x: X0, y: 680, size: 36, weight: 700, w: 760 }).svg);
      body += anim('up', 3.6, rich('Principalmente os que confirmam o que você queria.', { x: X0, y: 820, size: 32, fill: C.ink2, w: 700 }).svg);
      return { body };
    }
  },
  {
    id: '2.3-02', aula: '2.3', title: 'Três testes para todo documento',
    cue: '[TELA: três colunas — origem, forma, conteúdo]',
    render() {
      const h = heading('Três testes para todo documento');
      const c = columns([
        { num: '01', head: 'Origem', body: 'Esse documento existe em algum lugar oficial?', items: ['Diário Oficial', 'Portal de contratações', 'Processo judicial público', 'Sistema de processos do órgão'], color: C.amber },
        { num: '02', head: 'Forma', body: 'O documento tem a cara do que diz ser?', items: ['Código verificador do SEI', 'Assinatura ICP-Brasil ou gov.br, no validador do ITI'], color: C.blue },
        { num: '03', head: 'Conteúdo', body: 'O que está escrito faz sentido?', items: ['Datas', 'Quem assina', 'Valores', 'Timbre'], color: C.green }
      ], { y: 320, h: 600, size: 32, headSize: 48, step: 1.0 });
      return { body: h.svg + c.svg };
    }
  },
  {
    id: '2.3-03', aula: '2.3', title: 'Peça o mesmo documento pela LAI',
    cue: 'BLOCO 2 — “Se o órgão entregar um documento diferente, você tem outra história.”',
    render() {
      const h = heading('Origem: peça o mesmo documento pela LAI', { size: 56 });
      let body = h.svg;
      body += anim('fade', 0.5, label('O que chegou até você', { x: X0 + 60, y: 330, size: 22 }));
      body += docSheet({ x: X0 + 60, y: 350, w: 620, h: 500, head: true, lines: [0.9, 0.7, { t: 'Valor: R$ 2.000.000,00', size: 28, weight: 700 }, 0.8, 0.6, 0.9, 0.7], d: 0.6 });
      body += anim('fade', 1.6, label('O que o órgão entregou', { x: 1100, y: 330, size: 22, color: C.green }));
      body += docSheet({ x: 1100, y: 350, w: 620, h: 500, head: true, lines: [0.9, 0.7, { t: 'Valor: {h|R$ 1.200.000,00}', size: 28, weight: 700, hlD: 3.0 }, 0.8, 0.6, 0.9, 0.7], d: 1.8 });
      body += arrowH(X0 + 700, 630, 1080, { d: 2.4, color: C.ink2 });
      body += anim('pop', 3.8, `<rect x="760" y="${950 - 50}" width="${1040}" height="80" fill="${C.amber}"/>` + rich('Documento diferente? Você tem outra história.', { x: 1280, y: 953, size: 36, font: 'display', fill: C.bg, anchor: 'middle', w: 1040 }).svg);
      body += anim('up', 3.4, rich('Igual: você tem a versão oficial.', { x: X0, y: 953, size: 30, weight: 700, fill: C.green, w: 620 }).svg);
      return { body, source: 'Exemplo fictício' };
    }
  },
  {
    id: '2.3-04', aula: '2.3', title: 'O rodapé do SEI e o validador do ITI',
    cue: 'BLOCO 3 — código verificador, código CRC e validação de assinatura em validar.iti.gov.br',
    render() {
      const h = heading('Forma: o documento tem a cara do que diz ser?', { size: 54 });
      let body = h.svg;
      body += docSheet({ x: X0, y: 300, w: 860, h: 640, head: true, lines: [0.9, 0.8, 0.95, 0.7], d: 0.5,
        footSize: 24, footer: 'Documento assinado eletronicamente por [nome], [cargo], em [data]. A autenticidade deste documento pode ser conferida no site [endereço do órgão], informando o código verificador {h|0000000} e o código CRC {h|A1B2C3D4}.' });
      body += anim('fade', 1.6, label('Rodapé de documento do SEI', { x: X0, y: 285, size: 22 }));
      const px = 1080;
      body += anim('up', 2.6, box({ x: px, y: 300, w: 720, h: 400, fill: C.s1, stroke: C.green, sw: 3 }) + label('Validador do ITI', { x: px + 36, y: 356, size: 24, color: C.green })
        + rich('Assinatura ICP-Brasil ou gov.br', { x: px + 36, y: 410, size: 28, fill: C.ink2, w: 650 }).svg);
      ['A assinatura é válida', 'Quem assinou', 'Quando assinou'].forEach((t, i) => {
        body += badge('ok', { x: px + 36, y: 460 + i * 74, s: 44, d: 3.2 + i * 0.4 });
        body += anim('left', 3.2 + i * 0.4, rich(t, { x: px + 100, y: 494 + i * 74, size: 32, weight: 700, w: 580 }).svg);
      });
      body += anim('up', 4.8, rich('Não validou? Não é necessariamente falso: pode ser cópia impressa e escaneada. {a|Mas agora você tem uma pergunta a mais.}', { x: px, y: 780, size: 28, w: 720, weight: 500 }).svg);
      return { body };
    }
  },
  {
    id: '2.3-05', aula: '2.3', title: 'Conteúdo: o que está escrito faz sentido',
    cue: 'BLOCO 4 — datas, quem assina, valores e timbre',
    render() {
      const h = heading('Conteúdo: o que está escrito faz sentido?');
      const l = list([
        { t: 'As datas batem com o calendário?', sub: 'Um ofício datado de domingo não é impossível. É estranho.', mark: 'q' },
        { t: 'Quem assina ocupava aquele cargo naquela data?', sub: 'Confira no Diário Oficial.', mark: 'q' },
        { t: 'Os valores conversam com outras bases?', sub: 'Um contrato de R$ 2 milhões que não aparece no portal de contratações pede explicação.', mark: 'q' },
        { t: 'O timbre é da gestão certa?', sub: 'Logotipo de governo muda com o governo. Documento de 2023 com a marca de 2025 foi feito depois.', mark: 'q' }
      ], { y: 320, size: 42, subSize: 30, gap: 38, numbered: false, marker: 'q', step: 1.2 });
      return { body: h.svg + l.svg };
    }
  },
  {
    id: '2.3-06', aula: '2.3', title: 'Metadados, o dado sobre o dado',
    cue: 'BLOCO 5 — autor, programa, data de criação; um “documento de 2019” criado em 2026',
    render() {
      const h = heading('Metadado: o dado sobre o dado', { sub: 'Meta, em grego, quer dizer “além de”. É o que o arquivo carrega sobre si mesmo.' });
      let body = h.svg;
      const px = X0; const py = 390;
      body += anim('up', 0.8, box({ x: px, y: py, w: 900, h: 500, fill: C.s2, stroke: C.lineUi, sw: 2 }) + `<rect x="${px}" y="${py}" width="900" height="60" fill="${C.s3}"/>`
        + rich('Propriedades do documento', { x: px + 30, y: py + 40, size: 26, font: 'mono', weight: 700, fill: C.ink2, w: 800 }).svg);
      const props = [['Título', 'Ofício nº 112/2019'], ['Autor', 'usuario.local'], ['Aplicativo', 'Editor de PDF'], ['Criado em', '{r|14/03/2026 22:41}'], ['Modificado em', '14/03/2026 22:58']];
      props.forEach(([k, v], i) => {
        body += anim('left', 1.2 + i * 0.3, rich(k, { x: px + 30, y: py + 120 + i * 72, size: 28, font: 'mono', fill: C.ink3, w: 260 }).svg + rich(v, { x: px + 300, y: py + 120 + i * 72, size: 30, font: 'mono', weight: 700, w: 560 }).svg);
      });
      body += anim('draw', 3.0, `<rect x="${px + 16}" y="${py + 120 + 3 * 72 - 44}" width="868" height="62" fill="none" stroke="${C.red}" stroke-width="4" pathLength="1"/>`);
      body += anim('up', 3.4, rich('Um “documento de 2019” criado em 2026 {r|merece uma conversa}.', { x: 1080, y: 470, size: 38, font: 'display', w: 720, lh: 1.12 }).svg);
      body += anim('up', 4.4, rich('Uma foto pode dizer o modelo do celular e, às vezes, as coordenadas de onde foi tirada.', { x: 1080, y: 650, size: 28, fill: C.ink2, w: 720 }).svg);
      body += anim('up', 5.2, rich('{a|Antes de publicar, remova os metadados.} Eles podem apontar para a sua fonte.', { x: 1080, y: 790, size: 30, weight: 700, w: 720 }).svg);
      return { body, source: 'Exemplo fictício' };
    }
  },
  {
    id: '2.3-07', aula: '2.3', title: 'Hash, o picadinho do arquivo',
    cue: 'BLOCO 6 — “Se um único caractere do arquivo mudar, o hash muda inteiro.”',
    render() {
      const a = 'Contrato 045/2025 · Valor: R$ 2.000.000,00'; const b = 'Contrato 045/2025 · Valor: R$ 2.000.001,00';
      const ha = sha(a); const hb = sha(b);
      const h = heading('Hash: o “picadinho” do arquivo', { sub: 'A função pica o arquivo inteiro e devolve uma sequência sempre do mesmo tamanho.' });
      let body = h.svg;
      const row = (y, txt, hash, d, col, lbl) => {
        let s = anim('left', d, box({ x: X0, y, w: 520, h: 150, fill: C.paper, stroke: C.paper, sw: 0 }) + rich(txt, { x: X0 + 26, y: y + 60, size: 26, font: 'mono', weight: 700, fill: C.pInk, w: 470, lh: 1.25, paper: true }).svg);
        s += arrowH(X0 + 540, y + 75, X0 + 640, { d: d + 0.5 });
        s += anim('fade', d + 0.9, label(lbl, { x: X0 + 660, y: y + 26, size: 20, color: col }) + rich(hash.slice(0, 32), { x: X0 + 660, y: y + 80, size: 34, font: 'mono', weight: 700, fill: col, w: 1100 }).svg + rich(hash.slice(32), { x: X0 + 660, y: y + 128, size: 34, font: 'mono', weight: 700, fill: col, w: 1100 }).svg);
        return s;
      };
      body += row(380, a, ha, 0.8, C.green, 'SHA-256');
      body += row(600, b.replace('2.000.001', '2.000.00{r|1}'), hb, 2.4, C.red, 'SHA-256 · um caractere mudou');
      body += anim('up', 4.2, rich('Se um único caractere mudar, {a|o hash muda inteiro}.', { x: X0, y: 850, size: 40, font: 'display', w: BW }).svg);
      body += anim('fade', 5.0, rich('Windows: certutil -hashfile documento.pdf SHA256   ·   Mac ou Linux: shasum -a 256 documento.pdf', { x: X0, y: 930, size: 24, font: 'mono', fill: C.ink2, w: BW }).svg);
      return { body };
    }
  },
  {
    id: '2.3-08', aula: '2.3', title: 'Cadeia de custódia',
    cue: 'BLOCO 6 — anote quando recebeu, de quem e por qual meio; original intocado; trabalhe numa cópia',
    render() {
      const h = heading('Cadeia de custódia', { sub: 'O registro de por onde a prova passou. Para o jornalista, não é obrigação: é boa prática que vira defesa.' });
      let body = h.svg;
      body += flow([
        { t: 'Anote', sub: 'Quando recebeu, de quem e por qual meio.' },
        { t: 'Guarde o original', sub: 'Intocado.' },
        { t: 'Trabalhe numa cópia', sub: 'Sempre.' },
        { t: 'Gere o hash', sub: 'E registre na aba Log da planilha.' }
      ], { y: 420, h: 280, step: 0.9, size: 42, subSize: 28 }).svg;
      body += anim('up', 4.6, rich('Se alguém disser que você adulterou o documento, você mostra que {a|o arquivo é o mesmo desde o dia em que chegou}.', { x: X0, y: 840, size: 34, weight: 700, w: BW }).svg);
      return { body, source: 'Código de Processo Penal, arts. 158-A a 158-F, para provas periciais' };
    }
  },

  // ---------------------------------------------------------------- 2.4
  {
    id: '2.4-01', aula: '2.4', title: 'Ataques a jornalistas no Brasil',
    cue: '[TELA: 557 em 2022 · 210 em 2024 · 204 em 2025 — fonte: relatório da Abraji, julho de 2026]',
    render() {
      const h = heading('Alertas de ataques a jornalistas', { sub: 'Queda não é segurança. É só uma queda.' });
      const b = bars([
        { name: '2022', v: 557, label: '557', color: C.red },
        { name: '2024', v: 210, label: '210' },
        { name: '2025', v: 204, label: '204' }
      ], { x: X0 + 200, w: 1280, y: 890, h: 440, d0: 0.8, step: 0.6, gap: 160, valueSize: 64, labelSize: 32 });
      let body = h.svg + b.svg;
      body += pill('RECORDE', { x: X0 + 200 + 160, y: 340, size: 24, color: C.red, d: 2.6, anchor: 'middle' }).svg;
      return { body, source: 'Fonte: relatório da Abraji, julho de 2026' };
    }
  },
  {
    id: '2.4-02', aula: '2.4', title: 'Quem é o alvo dos ataques',
    cue: 'ABERTURA — 68,6% dos casos tinham uma pessoa como alvo; mais de quatro em cada dez partiram de agentes do Estado',
    render() {
      let body = anim('pop', 0.4, rich('68,6%', { x: X0, y: 460, size: 200, font: 'display', fill: C.amber, w: 900 }).svg);
      body += anim('up', 1.0, rich('dos casos: o alvo era {a|uma pessoa}, não um veículo.', { x: X0, y: 560, size: 40, weight: 700, w: 780 }).svg);
      const gx = 1080; const gy = 300; const s = 120; const g = 22;
      for (let i = 0; i < 10; i++) {
        const x = gx + (i % 5) * (s + g); const y = gy + Math.floor(i / 5) * (s + g);
        const col = i < 4 ? C.red : C.s3;
        body += anim('pop', 1.8 + i * 0.12, `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${col}"/>` + icon('person', { x: x + 30, y: y + 30, s: 60, color: i < 4 ? C.bg : C.ink3, sw: 4 }));
      }
      body += anim('up', 3.4, rich('{r|Mais de quatro em cada dez} ataques partiram de agentes do próprio Estado.', { x: gx, y: gy + 2 * (s + g) + 70, size: 34, weight: 700, w: 690 }).svg);
      return { body, source: 'Fonte: relatório da Abraji, julho de 2026' };
    }
  },
  {
    id: '2.4-03', aula: '2.4', title: 'O protocolo acompanha o risco',
    cue: 'BLOCO 1 — três perguntas: quem pode querer saber, o que pode fazer, qual o estrago',
    render() {
      const h = heading('Segurança começa com três perguntas');
      let body = h.svg;
      body += list([
        'Quem pode querer saber o que você sabe?',
        { t: 'O que essa pessoa pode fazer?', sub: 'Processar, invadir seu celular, te seguir, ameaçar.' },
        'Qual o estrago se ela conseguir?'
      ], { y: 310, w: 960, size: 38, subSize: 28, step: 0.9 }).svg;
      const meter = (y, t, lvl, d) => {
        let s = anim('up', d, rich(t, { x: 1160, y, size: 30, weight: 700, w: 640 }).svg + `<rect x="1160" y="${y + 24}" width="640" height="30" fill="${C.s2}"/>`);
        s += anim('grow', d + 0.4, `<rect x="1160" y="${y + 24}" width="${640 * lvl}" height="30" fill="${lvl > 0.7 ? C.red : C.amber}"/>`, { t: 1.0 });
        return s;
      };
      body += meter(380, 'Contrato de merenda numa capital', 0.38, 3.2);
      body += meter(540, 'Milícia no bairro onde você mora', 0.94, 4.0);
      body += anim('up', 5.4, rich('O protocolo acompanha o risco. {a|Não o contrário.}', { x: X0, y: 880, size: 48, font: 'display', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '2.4-04', aula: '2.4', title: 'A matriz de risco',
    cue: '[TELA: matriz de risco — risco / probabilidade / impacto / medida]',
    render() {
      const h = heading('Matriz de risco da pauta');
      const t = table({
        y: 310, rowH: 118, headH: 64, size: 28, d0: 0.8, step: 0.8,
        cols: [{ h: 'Risco', w: 480, bold: true }, { h: 'Probabilidade', w: 250 }, { h: 'Impacto', w: 210 }, { h: 'Medida', w: 740 }],
        rows: [
          ['Ataque on-line de apoiadores', '{r|alta}', 'médio', 'Arquivar tudo, não responder, registrar ocorrência se virar ameaça'],
          ['Processo de um dos citados', 'média', '{r|alto}', 'Dossiê, pedido de posicionamento, redação na medida da prova'],
          ['Visita ao local', 'baixa', '{r|alto}', 'Não ir sozinho, avisar o roteiro, não postar em tempo real'],
          ['Exposição da fonte', 'média', '{r|alto}', 'Protocolo da aula 2.2']
        ]
      });
      return { body: h.svg + t.svg, source: 'Exemplo, no formato da aba Risco da planilha do curso' };
    }
  },
  {
    id: '2.4-05', aula: '2.4', title: 'Segurança digital mínima',
    cue: 'BLOCO 2 — o básico que todo mundo deveria ter e quase ninguém tem',
    render() {
      const h = heading('Segurança digital mínima');
      const c = checklist([
        { t: 'Verificação em duas etapas em tudo', sub: 'E-mail, redes, nuvem. Por aplicativo autenticador, não por SMS: chip pode ser clonado.' },
        { t: 'Gerenciador de senhas', sub: 'Uma senha diferente para cada serviço.' },
        { t: 'Disco do computador criptografado', sub: 'FileVault no Mac. BitLocker ou criptografia de dispositivo no Windows.' },
        { t: 'Backup fora da nuvem pessoal', sub: 'Também criptografado.' },
        { t: 'Um e-mail só para a pauta', sub: 'E, se possível, um número de telefone.' },
        { t: 'Sistema atualizado', sub: 'E desconfiança de link “do tribunal”, “da Receita” ou “do banco” pedindo login: é phishing, pescaria de senha.' }
      ], { y: 300, size: 32, cols: 2, step: 0.7, gap: 30 });
      return { body: h.svg + c.svg };
    }
  },
  {
    id: '2.4-06', aula: '2.4', title: 'Segurança física',
    cue: 'BLOCO 3 — a parte que não aparece em tutorial',
    render() {
      const h = heading('Segurança física');
      let body = h.svg;
      body += list([
        'Não vá sozinho a área dominada.',
        { t: 'Avise alguém de confiança sobre o seu roteiro', sub: 'E combine horários de contato. Sem notícia no horário, a pessoa sabe o que fazer.' },
        { t: 'Não publique sua localização em tempo real', sub: 'Nem story “chegando aqui”. Publique depois de sair.' },
        'Varie rotina e trajeto quando a pauta estiver quente.'
      ], { y: 300, size: 40, subSize: 28, gap: 32, step: 0.9 }).svg;
      body += anim('up', 4.4, rich('Nenhuma matéria vale a sua vida. {a|O documento não atira.}', { x: X0, y: 900, size: 46, font: 'display', w: BW }).svg);
      return { body };
    }
  },
  {
    id: '2.4-07', aula: '2.4', title: 'Assédio on-line e ameaça',
    cue: 'BLOCO 4 — documente tudo, não alimente, ameaça concreta não é “coisa da internet”',
    render() {
      const h = heading('Quando o ataque muda de forma', { sub: 'Enxurrada de comentários, exposição de dados pessoais, ameaça por mensagem.' });
      const c = columns([
        { num: '01', head: 'Documente tudo', body: 'Print com data e endereço visíveis. Link arquivado.', icon: 'camera' },
        { num: '02', head: 'Não alimente', body: 'Não responda ataque com ataque.', icon: 'chat' },
        { num: '03', head: 'Ameaça concreta não é “coisa da internet”', body: 'Registre ocorrência, guarde as provas e procure apoio: a Abraji e o sindicato da sua região.', icon: 'warn', color: C.red }
      ], { y: 400, h: 480, size: 32, headSize: 38, step: 0.9 });
      return { body: h.svg + c.svg };
    }
  },
  {
    id: '2.4-08', aula: '2.4', title: 'Ative hoje',
    cue: 'EXERCÍCIO — “E ative hoje a verificação em duas etapas em tudo que ainda não tem. Hoje. Não amanhã.”',
    render() {
      let body = anim('pop', 0.3, icon('lock', { x: W / 2 - 90, y: 200, s: 180, color: C.amber, sw: 4 }));
      body += statement('Ative hoje a verificação em duas etapas.\n{a|Hoje. Não amanhã.}', { y: 560, size: 80, d: 0.8, step: 0.9 }).svg;
      return { body };
    }
  }
];
