// Paletas e componentes por família temática. Nenhuma cor aqui é verde: o MP4
// sai sobre fundo verde (#00FF00) para chroma key.
export const RUNES_ELDER = [...'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ'];
export const RUNES_YOUNGER = [...'ᚠᚢᚦᚬᚱᚴᚼᚾᛁᛅᛋᛏᛒᛘᛚᛦ'];
export const ZODIAC = [...'♈♉♊♋♌♍♎♏♐♑♒♓'];
export const GREEK = [...'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'];
export const HEBREW = [...'אבגדהוזחטיכלמנסעפצקרשת'];
export const PLANETS = [...'☉☽☿♀♂♃♄'];
export const ELEMENTS = ['🜂', '🜄', '🜁', '🜃'];

export const BASE = {
  ink: '#0A0705',
  plate: '#120E0A',
  line: '#E2BE68',
  lineDim: '#9A783B',
  hi: '#FFF7DC',
  glyph: '#DDB862',
  gold: ['#FFF2C4', '#E8C56B', '#B3812D'],
  accent: '#E8C56B',
  altColor: '#F4E7C8',
  arms: 'line',
  topBand: 'beads',
  sideBand: 'glyphs',
  cornerGlyphs: [],
  sideGlyphs: [],
};

export const FAMILIES = {
  nordico: {
    plate: '#0D1015', accent: '#A8D6F0', lineDim: '#7E8C99', arms: 'braid', topBand: 'beads',
    cornerGlyphs: ['ᛟ', 'ᚠ', 'ᛉ', 'ᛏ'], sideGlyphs: RUNES_ELDER, steel: '#CBD5DE', wood: '#7B4F27',
  },
  templo: {
    plate: '#100D0A', accent: '#F1E6CF', lineDim: '#8E7A55', sideBand: 'pillars', topBand: 'stars', bottomBand: 'checker',
    cornerGlyphs: ['☉', '☽', '✶', '✶'],
  },
  ceu: {
    plate: '#0A0F24', accent: '#BFD3FF', lineDim: '#6C7AA6', hi: '#FFFFFF', sideBand: 'constellation', topBand: 'stars',
    cornerGlyphs: ['✶', '✶', '✶', '✶'],
  },
  gnose: {
    plate: '#120B1C', accent: '#C9A8FF', lineDim: '#7E62A3', cornerGlyphs: ['☉', '☽', '✶', '✶'], sideGlyphs: GREEK,
  },
  solar: {
    plate: '#161006', accent: '#FFE39A', lineDim: '#A88A45', cornerGlyphs: ['☉', '☉', '☉', '☉'], sideGlyphs: ['☀'],
  },
  hermes: {
    plate: '#0E0F13', accent: '#D7DEE6', lineDim: '#8B94A0', cornerGlyphs: ['☿', '☉', '☽', '☿'], sideGlyphs: PLANETS,
  },
  alquimia: {
    plate: '#170B08', accent: '#F59A62', lineDim: '#9A5A3A', cornerGlyphs: ELEMENTS,
    sideGlyphs: ['🜍', '☿', '🜔', '🜆', '🜖', '🜚', '🜛', '🜂', '🜄', '🜁', '🜃', '🜀'],
  },
  egito: {
    plate: '#0B1226', accent: '#7FD6DE', lineDim: '#5C7BB0', plaque: 'cartouche',
    cornerGlyphs: ['𓋹', '𓂀', '𓊽', '𓌀'],
    sideGlyphs: [...'𓇳𓋹𓊽𓂀𓆣𓅃𓋴𓇋𓈖𓏏𓆓𓌀𓎬𓄿𓆑𓅓𓇯𓉐𓂋𓊪𓎛𓇼'],
    sideGlyphSize: 28,
  },
  grecia: {
    plate: '#100907', accent: '#EA9A6E', lineDim: '#9A6A4A', arms: 'meander', topBand: 'meander', sideBand: 'laurel',
    cornerGlyphs: ['Ψ', 'Φ', 'Θ', 'Ω'],
  },
  oriente: {
    plate: '#1A0A0E', accent: '#FFB65E', lineDim: '#A8653A', arms: 'beads', topBand: 'beads', sideBand: 'lotus',
    cornerGlyphs: ['ॐ', 'ॐ', 'ॐ', 'ॐ'], cornerGlyphSize: 24,
  },
  fogo: {
    plate: '#180905', accent: '#FFA15A', lineDim: '#A0522D', sideBand: 'flames', cornerGlyphs: ['🜂', '🜂', '🜂', '🜂'],
  },
  rosacruz: {
    plate: '#1A070D', accent: '#F78FA7', lineDim: '#9E4A5E', sideBand: 'roses', cornerGlyphs: ['✠', '✠', '✠', '✠'],
  },
  cabala: {
    plate: '#0A0E26', accent: '#AFC0FF', lineDim: '#5A68A8', cornerGlyphs: ['י', 'ה', 'ו', 'ה'], sideGlyphs: HEBREW,
  },
  ovo: {
    plate: '#13110C', accent: '#F4EAD3', lineDim: '#9C8A62', cornerGlyphs: ['✦', '✦', '✦', '✦'], sideGlyphs: ['✦', '✧'],
  },
  cadeia: {
    plate: '#110D07', accent: '#F2D27A', arms: 'chain', topBand: 'chain', sideBand: 'chain', cornerGlyphs: ['✶', '✶', '✶', '✶'],
  },
  arcana: {
    // as quatro fases nos cantos; a do grau fica acesa
    plate: '#0B0907', accent: '#F2D27A', cornerGlyphs: ['♄', '☽', '♂', '☉'], cornerPhase: true,
  },
  admin: {
    plate: '#16100C', accent: '#8E1E35', arms: 'guilloche', topBand: 'guilloche', sideBand: 'guilloche',
    cornerGlyphs: ['✶', '✶', '✶', '✶'],
    plaqueFill: '#F2E7CC', plaqueInk: '#2A1A10',
    nameFill: ['#4A2F1C', '#2B1A0E', '#140A04'], numberFill: ['#D2465B', '#9A2136', '#5E0F21'],
    kickerColor: '#9A2136', altColor: '#4A3020',
  },
};

export function themeFor(deg) {
  const fam = FAMILIES[deg.family];
  if (!fam) throw new Error(`Família "${deg.family}" não existe (grau ${deg.n})`);
  return { ...BASE, ...fam, ...(deg.theme ?? {}) };
}
