/**
 * Design tokens da Ágora — "praça pública grega encontrando um caderno de estudos".
 * Pergaminho claro / grafite profundo; terracota (primária), verde-oliva (secundária)
 * e dourado discreto para destaques e níveis. Contrastes verificados para WCAG AA.
 */

export type NomeEsquema = 'claro' | 'escuro';

export interface Cores {
  fundo: string;
  superficie: string;
  superficieElevada: string;
  superficieAfundada: string;
  texto: string;
  textoSecundario: string;
  textoSutil: string;
  borda: string;
  bordaForte: string;
  primaria: string;
  primariaPressionada: string;
  primariaSuave: string;
  textoSobrePrimaria: string;
  secundaria: string;
  secundariaSuave: string;
  textoSobreSecundaria: string;
  dourado: string;
  douradoTexto: string;
  douradoSuave: string;
  perigo: string;
  perigoSuave: string;
  sucesso: string;
  sucessoSuave: string;
  aviso: string;
  avisoSuave: string;
  sobreposicao: string;
  esqueleto: string;
  niveis: Record<1 | 2 | 3 | 4, string>;
}

export const cores: Record<NomeEsquema, Cores> = {
  claro: {
    fundo: '#F5EFE3',
    superficie: '#FBF7EF',
    superficieElevada: '#FFFFFF',
    superficieAfundada: '#EDE5D6',
    texto: '#2A2622',
    textoSecundario: '#5B534A',
    textoSutil: '#776D61',
    borda: '#DED4C3',
    bordaForte: '#C4B69F',
    primaria: '#A9452B',
    primariaPressionada: '#8C3922',
    primariaSuave: '#F2DED5',
    textoSobrePrimaria: '#FFFFFF',
    secundaria: '#56652A',
    secundariaSuave: '#E4E7D2',
    textoSobreSecundaria: '#FFFFFF',
    dourado: '#B48A2C',
    douradoTexto: '#7A5A10',
    douradoSuave: '#F3E7C6',
    perigo: '#A3302B',
    perigoSuave: '#F6DCDA',
    sucesso: '#3D6838',
    sucessoSuave: '#DDEBD9',
    aviso: '#875800',
    avisoSuave: '#F7E8C8',
    sobreposicao: 'rgba(42, 38, 34, 0.45)',
    esqueleto: '#E6DDCC',
    niveis: { 1: '#7D705F', 2: '#56652A', 3: '#A9452B', 4: '#8F6A14' },
  },
  escuro: {
    fundo: '#1C1A18',
    superficie: '#25221F',
    superficieElevada: '#2F2B27',
    superficieAfundada: '#171513',
    texto: '#F0E9DD',
    textoSecundario: '#BDB2A2',
    textoSutil: '#9A8F80',
    borda: '#3C3631',
    bordaForte: '#544B43',
    primaria: '#DB7A57',
    primariaPressionada: '#C96A48',
    primariaSuave: '#3D2820',
    textoSobrePrimaria: '#1A120E',
    secundaria: '#A9BA6C',
    secundariaSuave: '#2C3120',
    textoSobreSecundaria: '#171A0E',
    dourado: '#D6B25C',
    douradoTexto: '#E2C277',
    douradoSuave: '#3A3120',
    perigo: '#EE8178',
    perigoSuave: '#3E2422',
    sucesso: '#8FC287',
    sucessoSuave: '#22301F',
    aviso: '#E6B455',
    avisoSuave: '#3A2E17',
    sobreposicao: 'rgba(0, 0, 0, 0.6)',
    esqueleto: '#332E29',
    niveis: { 1: '#B3A794', 2: '#A9BA6C', 3: '#DB7A57', 4: '#D6B25C' },
  },
};

export const espaco = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  gigante: 48,
} as const;

export const raio = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
  pilula: 999,
} as const;

export const familias = {
  titulo: 'CormorantGaramond_600SemiBold',
  tituloNegrito: 'CormorantGaramond_700Bold',
  tituloItalico: 'CormorantGaramond_500Medium_Italic',
  leitura: 'Lora_400Regular',
  leituraItalico: 'Lora_400Regular_Italic',
  leituraNegrito: 'Lora_600SemiBold',
  ui: 'Inter_400Regular',
  uiMedio: 'Inter_500Medium',
  uiNegrito: 'Inter_600SemiBold',
} as const;

export type VarianteTexto =
  | 'display'
  | 'titulo'
  | 'subtitulo'
  | 'secao'
  | 'corpo'
  | 'corpoForte'
  | 'leitura'
  | 'legenda'
  | 'rotulo'
  | 'botao'
  | 'numero';

export const tipografia: Record<
  VarianteTexto,
  { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing?: number }
> = {
  display: { fontFamily: familias.tituloNegrito, fontSize: 38, lineHeight: 42 },
  titulo: { fontFamily: familias.titulo, fontSize: 30, lineHeight: 34 },
  subtitulo: { fontFamily: familias.titulo, fontSize: 23, lineHeight: 28 },
  secao: { fontFamily: familias.uiNegrito, fontSize: 13, lineHeight: 18, letterSpacing: 1.1 },
  corpo: { fontFamily: familias.ui, fontSize: 15, lineHeight: 22 },
  corpoForte: { fontFamily: familias.uiNegrito, fontSize: 15, lineHeight: 22 },
  leitura: { fontFamily: familias.leitura, fontSize: 18, lineHeight: 30 },
  legenda: { fontFamily: familias.ui, fontSize: 13, lineHeight: 18 },
  rotulo: { fontFamily: familias.uiMedio, fontSize: 14, lineHeight: 19 },
  botao: { fontFamily: familias.uiNegrito, fontSize: 15, lineHeight: 20, letterSpacing: 0.2 },
  numero: { fontFamily: familias.tituloNegrito, fontSize: 28, lineHeight: 32 },
};

/** Alvo de toque mínimo (WCAG 2.5.5 / diretrizes iOS e Android) */
export const ALVO_TOQUE = 44;

export const sombra = (esquema: NomeEsquema) =>
  esquema === 'claro'
    ? {
        shadowColor: '#5A4630',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }
    : { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 };
