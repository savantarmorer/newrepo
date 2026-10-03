// Dados de cada grau: nome exibido, nome alternativo, rótulo temático, família
// visual, emblema do brasão e o trecho do roteiro (usado para estimar quanto
// tempo o grau fica na tela). Ajuste à vontade e rode `npm run tudo`.
import { GREEK, HEBREW, RUNES_YOUNGER, ZODIAC } from './lib/themes.mjs';
import { circle, g, path, poly } from './lib/svg.mjs';

// 41°: os cantos mostram a Ursa Maior em quatro posições ao redor da Polar
// (a "revolução" que o roteiro associa ao gamádion).
function dipperCorner(doc, th, k) {
  const pts = [[-11, -3], [-10, 4], [-3, 6], [-2, 0], [3, -2], [7, -4], [12, -1]];
  return g(
    { transform: `rotate(${k * 90})` },
    path(poly([pts[3], pts[0], pts[1], pts[2], pts[3], pts[4], pts[5], pts[6]], false), { fill: 'none', stroke: th.lineDim, 'stroke-width': 1.2 }),
    pts.map(([x, y]) => circle(x, y, 1.9, { fill: th.hi })),
    circle(0, -15, 2.6, { fill: '#FFFFFF', stroke: th.accent, 'stroke-width': 1 }),
  );
}

const ARCANA = [
  { plate: '#050505', accent: '#C9CED6', phaseColor: '#000000', phaseInk: '#E6EAF0', line: '#CFC6B2', lineDim: '#6E6A62', glyph: '#D9DDE3', gold: ['#FFFFFF', '#D5D9DF', '#8D939C'], hi: '#FFFFFF' },
  { plate: '#0F1114', accent: '#FFFFFF', phaseColor: '#F2F2EC', phaseInk: '#1A1A1A', line: '#E4E7EB', lineDim: '#8C939C', glyph: '#EEF1F4', gold: ['#FFFFFF', '#E8ECF0', '#A6ADB6'], hi: '#FFFFFF' },
  { plate: '#1C0606', accent: '#FF7A66', phaseColor: '#A3161B', phaseInk: '#FFE3C2', line: '#E9B062', lineDim: '#A0453A', glyph: '#F08A6A', gold: ['#FFD7B0', '#F0745A', '#A3161B'], hi: '#FFE8D0' },
  { plate: '#1A1204', accent: '#FFE38A', phaseColor: '#C99A2E', phaseInk: '#1A1204', line: '#F5C542', lineDim: '#A88A3A', glyph: '#F7D46A', gold: ['#FFF8D6', '#F7CF58', '#C08A1F'], hi: '#FFFDF0' },
];

export const GRAUS = [
  // ── Grande Consistório ───────────────────────────────────────────────────
  {
    n: 34, name: 'Cavaleiro da Escandinávia', kicker: 'Mitologia nórdica · Odin · Runas', family: 'nordico', emblem: 'valknut',
    fala: 'Grau 34° Cavaleiro da Escandinávia — Mitologia nórdica; Odin como vidente, curador e poeta. Conexão com as runas. (O grau onde você ganha um machado e descobre que Odin era na verdade o primeiro coach ontológico).',
  },
  {
    n: 35, name: 'Sublime Comandante do Templo', kicker: 'O Templo como imagem do Universo', family: 'templo', emblem: 'templo',
    fala: '35° Sublime Comandante do Templo — O Templo como imagem do Universo.',
  },
  {
    n: 36, name: 'Sublime Negociante', kicker: 'Geometria · Astronomia caldaica', family: 'ceu', emblem: 'negociante',
    theme: { cornerGlyphs: ['✴', '☉', '☽', '✴'] },
    fala: '36° Sublime Negociante — Geometria e Astronomia; observações caldaico-babilônicas das estrelas. (Basicamente o grau do Faria Limer esotérico que calcula o aluguel do Zodíaco em criptomoedas).',
  },
  {
    n: 37, name: 'Cavaleiro de Shota', alt: 'Sábio da Verdade', kicker: 'Tradições iniciáticas antigas', family: 'gnose', emblem: 'shota',
    theme: { accent: '#F2C46B', sideGlyphs: ['☥', '✡', '☯', '☸', '☤', '⛤', '✠', '⚚', '☉', '☽', '♁', '🜍'] },
    fala: '37° Cavaleiro de Shota (Sábio da Verdade) — Tradições iniciáticas antigas. (Tente ler o nome desse grau em voz alta sem rir na frente do Venerável Mestre. Desafio impossível).',
  },
  {
    n: 38, name: 'Sublime Eleito da Verdade', alt: 'A Águia Vermelha', kicker: 'Luz × Trevas · Dualismo cósmico', family: 'gnose', emblem: 'aguia',
    theme: { accent: '#FF8A6B', sideGlyphs: [...Array(6).fill('☉'), ...Array(6).fill('☽')], cornerGlyphs: ['☉', '☽', '☉', '☽'] },
    fala: '38° Sublime Eleito da Verdade (A Águia Vermelha) — O combate entre Luz e Trevas através das civilizações. Dualismo cósmico.',
  },
  {
    n: 39, name: 'Grande Eleito dos Eões', kicker: 'Gnosticismo valentiniano · Éons', family: 'gnose', emblem: 'eoes',
    theme: { sideBand: 'aeons' },
    fala: '39° Grande Eleito dos Eões — Conceito gnóstico de "Éon"; economia divina. Conexão com o gnosticismo valentiniano.',
  },
  {
    n: 40, name: 'Sábio Savaísta', alt: 'Sábio Perfeito', kicker: 'Leis da natureza · Alfa e Ômega', family: 'gnose', emblem: 'alfaomega',
    theme: { sideGlyphs: GREEK, cornerGlyphs: ['Α', 'Ω', 'Α', 'Ω'] },
    fala: '40° Sábio Savaísta (Sábio Perfeito) — Leis fundamentais da natureza; Deus como Alfa e Ômega.',
  },
  {
    n: 41, name: 'Cavaleiro do Arco de Sete Cores', kicker: 'Simbolismo solar · Ursa Maior', family: 'ceu', emblem: 'arco',
    theme: { sideBand: 'colors7', cornerDraw: dipperCorner },
    fala: '41° Cavaleiro do Arco de Sete Cores — Simbolismo solar; transição da adoração estelar para a solar. O Gammadion (suástica) como símbolo da revolução da Ursa Maior em torno da Estrela Polar. (Maluco, os caras meteram o Projac do esoterismo com direito a Arco-Íris e Ursa Maior no mesmo ritual).',
  },
  {
    n: 42, name: 'Príncipe da Luz', kicker: 'Pureza · Desinteresse · Justiça', family: 'solar', emblem: 'principeLuz',
    theme: { sideCount: 9 },
    fala: '42° Príncipe da Luz — Pureza de coração, desinteresse, justiça.',
  },
  {
    n: 43, name: 'Sublime Sábio Hermético', alt: 'Filósofo Hermético', kicker: 'Hermetismo · As 12 casas do Sol', family: 'hermes', emblem: 'hermetico',
    theme: { sideGlyphs: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'], sideGlyphSize: 20 },
    fala: '43° Sublime Sábio Hermético (Filósofo Hermético) — [HERMETISMO] O aspirante percorre as 12 Casas Simbólicas do Sol. Boaz e Jachin representam nascimento e morte. O tesouro oculto da vida.',
  },
  {
    n: 44, name: 'Príncipe do Zodíaco', kicker: 'Zodíaco · Os 12 trabalhos de Hércules', family: 'ceu', emblem: 'zodiaco',
    theme: { sideBand: 'glyphs', sideGlyphs: ZODIAC },
    fala: '44° Príncipe do Zodíaco — [HERMETISMO/ASTROLOGIA] Correspondências entre os 12 trabalhos de Hércules e os signos zodiacais (Áries=Éguas de Diomedes, Touro=Touro de Creta, Gêmeos=Maçãs de Ouro, etc.).',
  },
  {
    n: 45, name: 'Sublime Sábio dos Mistérios', kicker: 'Da escuridão à luz · O número três', family: 'gnose', emblem: 'misterios',
    theme: { sideGlyphs: ['▲', '△', '△'], sideCount: 12 },
    fala: '45° Sublime Sábio dos Mistérios — Transição da escuridão à luz; número místico três.',
  },
  {
    n: 46, name: 'Sublime Pastor das Cabanas', kicker: 'Alquimia · O Leão Verde', family: 'alquimia', emblem: 'leao',
    theme: { sideGlyphs: ['V', 'I', 'T', 'R', 'I', 'O', 'L', '🜖', '🜆', '🜍', '☿', '🜔', '♌', '🜚'] },
    fala: '46° Sublime Pastor das Cabanas — [ALQUIMIA] A Grande Obra alquímica; encontro com o Leão Verde (vitríolo/ácido sulfúrico; criação da aqua regia que dissolve o ouro). (Imagina você estudar 46 graus para virar oficialmente o "Zé das Couves das Cabanhas" e aprender a brincar com ácido).',
  },
  {
    n: 47, name: 'Cavaleiro das Sete Estrelas', kicker: 'Ursa Maior · Saptarshi · Plêiades', family: 'ceu', emblem: 'seteEstrelas',
    fala: '47° Cavaleiro das Sete Estrelas — Ursa Maior; os Sete Sábios (Saptarshi) da mitologia hindu; as Plêiades.',
  },
  {
    n: 48, name: 'Sublime Guardião do Monte Sagrado', kicker: 'Mistérios supremos · O altar', family: 'fogo', emblem: 'monte',
    fala: '48° Sublime Guardião do Monte Sagrado — Mistérios supremos; altar do sacrifício.',
  },
  {
    n: 49, name: 'Sublime Sábio das Pirâmides', kicker: 'Egito · 21 degraus vermelhos', family: 'egito', emblem: 'piramide',
    fala: '49° Sublime Sábio das Pirâmides — [EGITO] Caminho antigo de iniciação: o neófito é conduzido a um edifício maravilhoso, chegando ao Pórtico de mármore por 21 degraus vermelhos.',
  },
  {
    n: 50, name: 'Sublime Filósofo de Samotrácia', kicker: 'Mistérios de Samotrácia · Cabiros', family: 'grecia', emblem: 'samotracia',
    fala: '50° Sublime Filósofo de Samotrácia — Mistérios de Samotrácia; a Grande Mãe; divindades masculinas com falo ereto; a figura de Kasmílos. (Parabéns, grau 50! Você ganhou o diploma de especialista em estátuas peladas com órgãos proeminentes).',
  },
  {
    n: 51, name: 'Sublime Titã do Cáucaso', kicker: 'Prometeu · O dom do fogo', family: 'grecia', emblem: 'prometeu',
    theme: { sideBand: 'chain', accent: '#FF9D4D' },
    fala: '51° Sublime Titã do Cáucaso — Mito de Prometeu; o dom do fogo à humanidade.',
  },
  {
    n: 52, name: 'Sábio do Labirinto', kicker: 'Hermetismo · Hermes Trismegisto', family: 'hermes', emblem: 'labirinto',
    theme: { arms: 'meander', topBand: 'meander', sideBand: 'meander' },
    fala: '52° Sábio do Labirinto — [HERMETISMO] A Hermética (textos egípcio-gregos dos séculos II-III); Hermes Trismegisto como guia do labirinto.',
  },
  {
    n: 53, name: 'Cavaleiro / Sábio da Fênix', kicker: 'Rosacruz · Morte e ressurreição', family: 'rosacruz', emblem: 'fenix',
    theme: { sideBand: 'flames' },
    fala: '53° Cavaleiro/Sábio da Fênix — [ROSACRUZ] Mito da Fênix; morte e ressurreição. Conexão com o simbolismo cristão e rosacruz.',
  },
  {
    n: 54, name: 'Sublime Escaldo', kicker: 'Poesia escandinava · Os escaldos', family: 'nordico', emblem: 'escaldo',
    theme: { sideGlyphs: RUNES_YOUNGER, cornerGlyphs: ['ᛋ', 'ᚴ', 'ᛅ', 'ᛚ'] },
    fala: '54° Sublime Escaldo — Mitologia comparada; tradição poética escandinava. (O grau oficial dos Bardo de RPG que passaram no concurso da maçonaria).',
  },
  {
    n: 55, name: 'Sublime Doutor Órfico', kicker: 'Mistérios órficos · Dioniso Zagreu', family: 'grecia', emblem: 'orfico',
    theme: { accent: '#D59BFF' },
    fala: '55° Sublime Doutor Órfico — [HERMETISMO] Mistérios Órficos; mito de Dioniso Zagreus (filho de Zeus e Perséfone); Titãs; natureza dual da humanidade (dionisíaca vs. titânica).',
  },
  {
    n: 56, name: 'Pontífice / Sábio de Cádmia', kicker: 'Alquimia · 7 tons, 7 cores, 7 vogais', family: 'alquimia', emblem: 'cadmia',
    theme: { sideGlyphs: [...'ΑΕΗΙΟΥΩΑΕΗΙΟΥΩ'] },
    fala: '56° Pontífice/Sábio de Cádmia — [ALQUIMIA] A Grande Obra alquímica; sete tons musicais, sete cores e sete vogais. Cadmia = óxido de zinco dos fornos de fundição de cobre. (Você faz um ritual ultra secreto só para descobrir que Cadmia é literalmente resto de forno de fundição de cobre).',
  },
  {
    n: 57, name: 'Sublime Mago', kicker: 'Um único Espírito · Espírito e matéria', family: 'hermes', emblem: 'mago',
    theme: { sideGlyphs: ['🜂', '🜄', '🜁', '🜃', '🜀'], sideCount: 10 },
    fala: '57° Sublime Mago — Derivação de todas as coisas de um único Espírito Onipotente; relação espírito-matéria.',
  },
  {
    n: 58, name: 'Sábio / Príncipe Brâmane', kicker: 'Tradição oriental · Trimúrti', family: 'oriente', emblem: 'brahmane',
    fala: '58° Sábio/Príncipe Brâmane — [TRADIÇÃO ORIENTAL] Ciência natural e espiritual; Trimúrti brahmânica (Brahma-Criador, Vishnu-Preservador, Shiva-Destruidor); Noite e Dia de Brahma; evolução do mineral ao humano; Avatares de Vishnu.',
  },
  {
    n: 59, name: 'Sublime Sábio de Ogígia', kicker: 'Mitologia homérica · Odisseu', family: 'grecia', emblem: 'ogigia',
    theme: { sideBand: 'waves', accent: '#8FCBF2' },
    fala: '59° Sublime Sábio de Ogígia — Mitologia homérica; Odisseu, Circe, Hermes/Thoth, a planta sagrada moly, a Caverna dos Cimérios, o Tártaro. (Nome de planeta do Star Wars, mas é só o Ulisses preso na ilha comendo planta mística).',
  },
  {
    n: 60, name: 'Sublime Guardião dos Três Fogos', kicker: 'Corpo · Alma · Espírito', family: 'fogo', emblem: 'tresFogos',
    fala: '60° Sublime Guardião dos Três Fogos — Três princípios do ser humano: corpo, alma, espírito divino.',
  },
  {
    n: 61, name: 'Sublime Filósofo Desconhecido', kicker: 'Alquimia · Medicina oculta', family: 'rosacruz', emblem: 'desconhecido',
    theme: { sideBand: 'glyphs', sideGlyphs: ['🜍', '☿', '🜔'], sideCount: 9 },
    fala: '61° Sublime Filósofo Desconhecido — [ALQUIMIA/ROSACRUZ] Medicina oculta dos alquimistas. O título evoca Louis-Claude de Saint-Martin, o "Filósofo Desconhecido."',
  },
  {
    n: 62, name: 'Sublime Sábio de Elêusis', kicker: 'Mistérios eleusinos · Deméter e Perséfone', family: 'grecia', emblem: 'eleusis',
    theme: { sideBand: 'wheat' },
    fala: '62° Sublime Sábio de Elêusis — Mistérios Eleusinos; culto de Deméter e Perséfone; descida e retorno do mundo inferior.',
  },
  {
    n: 63, name: 'Sublime Kawi', kicker: 'Amor · União · Trabalho', family: 'oriente', emblem: 'kawi',
    theme: { sideBand: 'glyphs', sideGlyphs: ['♥'], sideCount: 10 },
    fala: '63° Sublime Kawi — Termo sânscrito para "poeta"; ensina amor, união e trabalho. (A versão fofa da Maçonaria: seja legal, faça um poema e vá trabalhar).',
  },
  {
    n: 64, name: 'Sábio de Mitra', kicker: 'Mistérios mitraicos · A chama sagrada', family: 'fogo', emblem: 'mitra',
    fala: '64° Sábio de Mitra — [HERMETISMO/ZOROASTRISMO] Mistérios Mitraicos; Ahura Mazda vs. Angra Mainyu; iniciação exotérica vs. esotérica; a chama sagrada.',
  },
  {
    n: 65, name: 'Guardião do Santuário', alt: 'Grande Instalador', kicker: 'Fé · Esperança · Caridade', family: 'ovo', emblem: 'ovoAlado',
    theme: { sideGlyphs: ['✝', '⚓', '♥'], sideCount: 9 },
    fala: '65° Guardião do Santuário — Grande Instalador — Fé, Esperança, Caridade. Símbolo: Ovo alado.',
  },
  {
    n: 66, name: 'Grande Arquiteto da Cidade Misteriosa', alt: 'Grande Consagrador', kicker: 'Grau hierático · Pneuma', family: 'ovo', emblem: 'ovoCirculo',
    fala: '66° Grande Arquiteto da Cidade Misteriosa — Grande Consagrador (Patriarche Grand Consécrateur) — [GRAU HIERÁTICO] Espírito/Sopro Sagrado (Pneuma/Ruach). Símbolo: Ovo alado com círculo e três estrelas. Este grau é comparado a uma consagração episcopal — confere autoridade espiritual para consagrar templos, lojas e espaços rituais. Conferido apenas a irmãos selecionados. Marca a fronteira entre os graus filosóficos e o Templo Místico.',
  },
  {
    n: 67, name: 'Guardião do Nome Incomunicável', alt: 'Grande Eulogista', kicker: 'Cabala · O Tetragrama', family: 'cabala', emblem: 'ovoDelta',
    fala: '67° Guardião do Nome Incomunicável — Grande Eulogista — [CABALA] O Filho divino. Símbolo: Ovo alado com triângulo radiante contendo a letra G (Gnose/Geometria). O Tetragrama (YHVH) corresponde aos elementos alquímicos: Yod=Fogo, He=Água, Vav=Ar, He(final)=Terra.',
  },

  // ── Sublime Conselho ─────────────────────────────────────────────────────
  {
    n: 68, name: 'Patriarca da Verdade', kicker: 'Tradições de Heliópolis', family: 'egito', emblem: 'ovoQuadrado',
    fala: '68° Patriarca da Verdade — Deus, inteligência, tradições de Heliópolis. Símbolo: quadrado sobre ovo alado com quatro raios; delta com estrela central. (Mais um ovo alado. Se colar esse símbolo na cozinha, vira logo o mascote de uma marca de granja esotérica).',
  },
  {
    n: 69, name: 'Cavaleiro do Ramo de Ouro de Elêusis', kicker: 'O Ramo de Ouro · O Y pitagórico', family: 'grecia', emblem: 'ramoOuro',
    theme: { accent: '#F2D27A' },
    fala: '69° Cavaleiro do Ramo de Ouro de Elêusis — O Ramo como símbolo de iniciação; a letra Y pitagórica (caminho duplo: estreito e pedregoso para o Elísio, largo e fácil para o Tártaro).',
  },
  {
    n: 70, name: 'Príncipe da Luz', alt: 'Patriarca dos Planisferos', kicker: 'Contemplação do Oriente divino', family: 'ceu', emblem: 'planisferio',
    theme: { cornerGlyphs: ['☉', '✶', '✶', '☉'] },
    fala: '70° Príncipe da Luz / Patriarca dos Planisferos — Contemplação do Oriente divino.',
  },
  {
    n: 71, name: 'Patriarca dos Vedas Sagrados', kicker: 'Bhagavad Gita · Arjuna e Krishna', family: 'oriente', emblem: 'vedas',
    fala: '71° Patriarca dos Vedas Sagrados — [TRADIÇÃO ORIENTAL] Batalhas de Arjuna em Kurukshetra, da Bhagavad Gita; Krishna como 8° avatar de Vishnu.',
  },
  {
    n: 72, name: 'Sublime Mestre da Sabedoria', kicker: 'As instituições de mistérios', family: 'hermes', emblem: 'sabedoria',
    theme: { sideGlyphs: ['☥', '⚚', '✡', '☸', '☯', '⛤', '✠', '☤', '☉', '☽', '🜍', '♁'] },
    fala: '72° Sublime Mestre da Sabedoria — Estudo geral das instituições de mistérios.',
  },
  {
    n: 73, name: 'Patriarca / Doutor do Fogo Sagrado', kicker: 'O fogo eterno de Heliópolis', family: 'egito', emblem: 'fogoSagrado',
    theme: { accent: '#FFB067', sideGlyphs: ['𓇳', '𓆗', '𓊮', '𓋹', '𓂀', '𓆓'], sideSplit: false, sideCount: 12 },
    fala: '73° Patriarca/Doutor do Fogo Sagrado — [EGITO/HERMETISMO] Fogo oculto; fogo eterno do templo de Heliópolis; serpente que emerge da cabeça dos Reis-Iniciados egípcios; chifres de Ísis e Moisés. (É o grau onde você aprende a usar chifres místicos com orgulho e sem ressentimentos).',
  },
  {
    n: 74, name: 'Sublime Mestre do Stoka', kicker: 'Ritmo · Número · 2 × 16 sílabas', family: 'oriente', emblem: 'stoka',
    theme: { sideBand: 'syllables' },
    fala: '74° Sublime Mestre do Stoka — [TRADIÇÃO ORIENTAL] Termo sânscrito para medida poética (distique de duas linhas de 16 sílabas); poderes ocultos dos números e do ritmo.',
  },
  {
    n: 75, name: 'Cavaleiro Comandante da Cadeia Líbia', kicker: 'Grau supremo do Consistório', family: 'cadeia', emblem: 'cadeia',
    fala: '75° Cavaleiro Comandante da Cadeia Líbia — Grau supremo do Consistório. Correntes de ouro como marcas de favor real nas cortes egípcias e orientais.',
  },
  {
    n: 76, name: 'Intérprete dos Hieróglifos', alt: 'Patriarca de Ísis', kicker: 'Egito · Hieróglifos · Ísis', family: 'egito', emblem: 'hieroglifos',
    fala: "76° Intérprete dos Hieróglifos / Patriarca de Ísis — [EGITO] Estudo dos hieróglifos; ciência, sabedoria, virtude. Dedicado a Ísis. (O lendário grau do 'Duolingo de Papiro').",
  },
  {
    n: 77, name: 'Sublime Cavaleiro / Sábio Teósofo', kicker: 'Cabala · A Árvore da Vida', family: 'cabala', emblem: 'arvoreVida',
    theme: { sideGlyphs: HEBREW },
    fala: '77° Sublime Cavaleiro/Sábio Teósofo — [CABALA] Mitologia comparada usando a Árvore da Vida cabalística como sistema de correspondências entre figuras divinas e as Sefirot.',
  },
  {
    n: 78, name: 'Grande Pontífice da Tebaida', kicker: 'Tebas · Osíris · Ciência astral', family: 'egito', emblem: 'tebas',
    theme: { sideGlyphs: ['𓇼', '𓇳', '𓇼', '𓊽', '𓇼', '𓋹'], sideSplit: false, sideCount: 12 },
    fala: '78° Grande Pontífice da Tebaida — [EGITO] Tradições mitológicas e científicas de Tebas; berço de Osíris; invenção da ciência astral.',
  },
  {
    n: 79, name: 'Cavaleiro do Formidável Sada', kicker: 'Sada = sempre · Constância', family: 'oriente', emblem: 'sada',
    theme: { sideBand: 'glyphs', sideGlyphs: ['∞'], sideCount: 10 },
    fala: '79° Cavaleiro do Formidável Sada — Sânscrito Sada = "sempre/eternamente"; constância na busca dos mistérios.',
  },
  {
    n: 80, name: 'Sublime Eleito do Santuário de Heliópolis/Mazias', kicker: 'Rá · O lótus primordial', family: 'egito', emblem: 'lotusRa',
    theme: { sideBand: 'text', sideText: ['RÁ → SHU + TEFNUT → GEB + NUT', 'OSÍRIS + ÍSIS → HÓRUS'] },
    fala: '80° Sublime Eleito do Santuário de Heliópolis/Mazias — [EGITO] Mitologia de Rá; criação a partir do lótus no oceano primordial. Genealogia: Rá → Shu + Tefnut → Geb + Nut → Osíris + Ísis → Hórus. (Uma árvore genealógica divina tão grande que parece escalação de time da Segunda Divisão egípcia).',
  },
  {
    n: 81, name: 'Intendente Regulador', alt: 'Patriarca de Mênfis', kicker: 'Teologia menfita · Ptah e a Palavra', family: 'egito', emblem: 'ptah',
    theme: { sideGlyphs: ['𓊽', '𓋹', '𓌀'], sideSplit: false, sideCount: 12 },
    fala: '81° Intendente Regulador / Patriarca de Mênfis — [EGITO] Hórus como Filho divino e mediador. Teologia Menfita da Pedra de Shabaka (Dinastia XXV, séc. VIII a.C.); Ptah como criador pela Palavra.',
  },
  {
    n: 82, name: 'Grande Eleito do Templo de Midgard', kicker: 'Cosmologia nórdica · Yggdrasil', family: 'nordico', emblem: 'midgard',
    theme: { cornerGlyphs: ['ᛗ', 'ᛁ', 'ᛞ', 'ᚷ'] },
    fala: '82° Grande Eleito do Templo de Midgard — Cosmologia nórdica; filosofia comparada das religiões. (Do nada saímos do Egito e caímos de cabeça nos Vingadores de Asgard).',
  },
  {
    n: 83, name: 'Sublime Eleito do Vale de Oddy', kicker: 'Enéada · Coração e língua de Ptah', family: 'egito', emblem: 'oddy',
    theme: { sideGlyphs: ['✶'], sideCount: 9 },
    fala: '83° Sublime Eleito do Vale de Oddy — [EGITO] Enéada de Heliópolis; Ptah como Atum-Rá falante; Logos/Grande Palavra como causa primeira; Hórus = epifania da mente (coração) de Ptah; Thoth = epifania da língua (fala) de Ptah.',
  },
  {
    n: 84, name: 'Patriarca dos Izeds', kicker: 'Zoroastrismo · Os 28 Izeds', family: 'fogo', emblem: 'izeds',
    theme: { sideBand: 'glyphs', sideGlyphs: ['✦'], sideCount: 14, sideGlyphSize: 18 },
    fala: '84° Patriarca dos Izeds — [ZOROASTRISMO] Hierarquia espiritual zoroastriana: Amshaspands (1° escalão), Izeds (2° escalão, 28 em número, chefe = Mitra), Fervers (3° escalão).',
  },
  {
    n: 85, name: 'Sublime Sábio / Cavaleiro de Kneph', kicker: 'Kneph · O espírito sobre a matéria', family: 'egito', emblem: 'kneph',
    fala: '85° Sublime Sábio/Cavaleiro de Kneph — [EGITO] Ovo alado (Kneph) = espírito universal agindo sobre a matéria primordial; o mundo produtivo. (Mais um Kneph, mais um ovo alado. Eles realmente tinham uma obsessão doentia por omeletes voadoras).',
  },
  {
    n: 86, name: 'Sublime Filósofo do Vale de Kab', kicker: 'A Rosa de Kab · Ísis, Rainha das Rosas', family: 'rosacruz', emblem: 'rosaKab',
    fala: '86° Sublime Filósofo do Vale de Kab — [ROSACRUZ/EGITO] Rosa do Vale de Kab; sacerdotes de Mênfis consagravam a roseira a Ísis, "Rainha das Rosas." Conexão direta com o simbolismo rosacruz.',
  },

  // ── Arcana Arcanorum ─────────────────────────────────────────────────────
  {
    n: 87, name: 'Sublime Príncipe da Maçonaria', alt: 'Grande Regulador Geral', kicker: 'Arcana Arcanorum · Nigredo', family: 'arcana', emblem: 'nigredo',
    theme: { ...ARCANA[0], phase: 0, sideGlyphs: ['♄', '🝤', '☿', '🜍', '🜔', '🜃'], sideSplit: false, sideCount: 12 },
    fala: '87° Sublime Príncipe da Maçonaria — Grande Regulador Geral Tema: Unidade filosófica com o Cosmos.',
  },
  {
    n: 88, name: 'Sublime Pontífice da Maçonaria', alt: 'Soberano Grande Patriarca', kicker: 'Arcana Arcanorum · Albedo · O Microcosmo', family: 'arcana', emblem: 'albedo',
    theme: { ...ARCANA[1], phase: 1, sideBand: 'serpent' },
    fala: '88° Sublime Pontífice da Maçonaria — Soberano Grande Patriarca Tema: O Microcosmo. "Este é o mais espantoso e sublime de todos os graus; exige a maior força de espírito, a maior pureza de costumes e a mais intrépida fé." Ensinamento oral: A Natureza é povoada por uma Hierarquia de criaturas; o homem ocupa uma posição intermediária, matéria e espírito ao mesmo tempo. Existem Instrutores no Invisível, incluindo um "Instrutor Negro"; eles inspiram profetas, sábios e legisladores. Trocas com poderes espirituais são possíveis durante cerimônias rituais; tradição egípcia: os ritos faziam "os Deuses descerem, moverem-se nos templos e animarem suas imagens." Perturbações físicas podem acompanhar esses contatos (terra treme, raios, paredes oscilam). Vegetarianismo e continência do oficiante são fatores de sucesso. Treinamento pessoal necessário: exercícios respiratórios e a prática da "esfera branca"; uma "serpente de fogo corre do cóccix até a raiz do nariz" (Resumo do 88°: Pare de comer carne, não faça sexo, vire um vulcão humano e assista à sua sala chacoalhar enquanto uma cobra pega fogo na sua espinha).',
  },
  {
    // O roteiro só cita o 89° como "Rubedo"; o nome vem da escala de Misraïm.
    n: 89, name: 'Patriarca da Cidade Mística', kicker: 'Arcana Arcanorum · Rubedo', family: 'arcana', emblem: 'rubedo',
    theme: { ...ARCANA[2], phase: 2, sideGlyphs: ['🜍', '♂', '🜓'], sideSplit: false, sideCount: 12 },
    fala: '89° Patriarca da Cidade Mística — Rubedo.',
  },
  {
    n: 90, name: 'Soberano Grande Mestre Absoluto', alt: 'Sublime Mestre da Grande Obra', kicker: 'Arcana Arcanorum · Auredo', family: 'arcana', emblem: 'auredo',
    theme: { ...ARCANA[3], phase: 3, sideGlyphs: ['☉', '🜚'], sideSplit: false, sideCount: 12 },
    fala: '90° Soberano Grande Mestre Absoluto — Sublime Mestre da Grande Obra Tema: Consistório da Sabedoria Suprema; conclusão da Grande Obra. Ensinamento oral: A sabedoria iniciática confere consciência cósmica; dever de iluminar e guiar; imperativo supremo: trazer PAZ à humanidade. Prever períodos de trevas, guerras, perseguições; as Ordens devem retornar ao segredo tradicional. O iniciado contém uma partícula de Divindade, um "fogo secreto de eternidade" — o Corpo Solar/Hermes expressando-se através do caminho alquímico interno.',
  },

  // ── Graus administrativos ───────────────────────────────────────────────
  {
    n: 91, name: 'Grande Defensor', kicker: 'Grande Tribunal de Defensores · 9 membros', family: 'admin', emblem: 'defensor',
    fala: '91° Grande Defensor — 9 membros formam o Grande Tribunal de Defensores',
  },
  {
    n: 92, name: 'Grande Catequista', kicker: 'Grande Colégio Litúrgico · 7 oficiais', family: 'admin', emblem: 'catequista',
    fala: '92° Grande Catequista — 7 oficiais formam o Grande Colégio Litúrgico',
  },
  {
    n: 93, name: 'Regulador Geral', kicker: 'Consistório de Inspetores Reguladores · 9 membros', family: 'admin', emblem: 'regulador',
    fala: '93° Regulador Geral — 9 membros formam o Grande Consistório de Inspetores Reguladores',
  },
  {
    n: 94, name: 'Príncipe de Mênfis', alt: 'Grande Administrador', kicker: 'Conselho Geral · 7 oficiais', family: 'admin', emblem: 'menfis',
    fala: '94° Príncipe de Mênfis / Grande Administrador — 7 oficiais formam o Conselho Geral',
  },
  {
    n: 95, name: 'Patriarca Grande Conservador', kicker: 'Soberano Santuário · Transmite a filiação do Rito', family: 'admin', emblem: 'conservador',
    fala: '95° Patriarca Grande Conservador — 7 oficiais formam o Soberano Santuário; direito de sentar no "Conselho dos Sábios"; pode transmitir a filiação do Rito como indivíduo único (Grau 95: Quando você finalmente vira o RH Supremo do esoterismo mundial com canetada ilimitada).',
  },
  {
    n: 96, name: 'Grande e Poderoso Soberano da Ordem', kicker: 'Liderança nacional', family: 'admin', emblem: 'soberano',
    fala: '96° Grande e Poderoso Soberano da Ordem — Liderança nacional',
  },
  {
    n: 97, name: 'Vice-Grão-Mestre Internacional', kicker: 'Governança internacional adjunta', family: 'admin', emblem: 'viceGrao',
    fala: '97° Vice-Grão-Mestre Internacional — Governança internacional adjunta',
  },
  {
    n: 98, name: 'Grão-Mestre Internacional', kicker: 'Autoridade suprema internacional', family: 'admin', emblem: 'graoMestre',
    fala: '98° Grão-Mestre Internacional — Autoridade suprema internacional',
  },
  {
    n: 99, name: 'Grande Hierofante', kicker: 'Autoridade espiritual suprema do Rito', family: 'admin', emblem: 'hierofante',
    theme: { sideBand: 'medals' },
    fala: '99° Grande Hierofante — Autoridade espiritual suprema do Rito (O Zênite. O Boss Final do Rito. O cara que usa tanta medalha no peito que precisa de fisioterapia para não cair pra frente).',
  },
  {
    // Bônus: citado no roteiro como reconhecido por algumas linhagens (Palermo).
    n: 100, name: 'Imperador Soberano Grande Hierofante Geral', kicker: 'Bônus · Sede de Palermo · Igreja Gnóstica', family: 'admin', emblem: 'imperador',
    fala: 'Algumas linhagens reconhecem um 100° (Imperador Soberano Grande Hierofante Geral), documentado apenas na sede de Palermo, que também engloba o título de Patriarca Supremo da Igreja Gnóstica.',
  },
];

/** Palavras faladas (ignora rótulos entre colchetes). */
export const palavras = (deg) => deg.fala.replace(/\[[^\]]*\]/g, ' ').split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;

/** Duração do MP4: fala estimada a 2,4 palavras/s + 4 s de folga (mínimo 10 s). */
export const duracao = (deg) => Math.max(10, Math.ceil(palavras(deg) / 2.4 + 4));

export const slug = (deg) =>
  `${deg.n}-${deg.name}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
