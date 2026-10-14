const LOCALE = 'pt-BR';
const FUSO = 'America/Sao_Paulo';

const moeda = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'BRL' });
const numero = new Intl.NumberFormat(LOCALE);
const dataCurta = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO });
const dataLonga = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: FUSO });
const dataHora = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: FUSO,
});
const diaSemana = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: FUSO,
});
const mesAno = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: '2-digit', timeZone: FUSO });

export const formatarMoeda = (v: number | string | null | undefined) => moeda.format(Number(v ?? 0));
export const formatarNumero = (v: number | string | null | undefined) => numero.format(Number(v ?? 0));
export const formatarData = (iso?: string | null) => (iso ? dataCurta.format(new Date(iso)) : '—');
export const formatarDataLonga = (iso?: string | null) => (iso ? dataLonga.format(new Date(iso)) : '—');
export const formatarDataHora = (iso?: string | null) => (iso ? dataHora.format(new Date(iso)) : '—');
export const formatarEvento = (iso?: string | null) => (iso ? diaSemana.format(new Date(iso)) : '—');
export const formatarMes = (iso: string) => mesAno.format(new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')));

/** "há 3 dias", "em 2 horas" */
export function tempoRelativo(iso?: string | null): string {
  if (!iso) return '';
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
  const min = 60_000, hora = 60 * min, dia = 24 * hora;
  if (abs < hora) return rtf.format(Math.round(diff / min), 'minute');
  if (abs < dia) return rtf.format(Math.round(diff / hora), 'hour');
  if (abs < 30 * dia) return rtf.format(Math.round(diff / dia), 'day');
  if (abs < 365 * dia) return rtf.format(Math.round(diff / (30 * dia)), 'month');
  return rtf.format(Math.round(diff / (365 * dia)), 'year');
}

/** Contagem regressiva legível: "4d 03h", "5h 12min", "encerrado" */
export function contagemRegressiva(iso?: string | null): string {
  if (!iso) return '';
  let ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'encerrado';
  const d = Math.floor(ms / 86_400_000);
  ms -= d * 86_400_000;
  const h = Math.floor(ms / 3_600_000);
  ms -= h * 3_600_000;
  const m = Math.floor(ms / 60_000);
  if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  return `${m}min`;
}

/** Tempo estimado de leitura (≈ 200 palavras/min) */
export function tempoLeitura(markdown: string): string {
  const palavras = markdown.trim().split(/\s+/).filter(Boolean).length;
  const min = Math.max(1, Math.round(palavras / 200));
  return `${min} min de leitura`;
}

export function plural(n: number, singular: string, pluralForma?: string) {
  return `${formatarNumero(n)} ${n === 1 ? singular : pluralForma ?? singular + 's'}`;
}

/** Converte "12,50" ou "12.5" em número */
export function parseValorBR(texto: string): number {
  const limpo = texto.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) ? n : NaN;
}

/** Formata wei (string) em DRC com até 2 casas */
export function formatarDRC(wei: string | number | bigint | null | undefined, casas = 2): string {
  if (wei === null || wei === undefined) return '0';
  const valor = BigInt(typeof wei === 'number' ? Math.trunc(wei) : wei.toString().split('.')[0]);
  const inteiro = valor / 10n ** 18n;
  const resto = valor % 10n ** 18n;
  const frac = Number(resto) / 1e18;
  return (Number(inteiro) + frac).toLocaleString(LOCALE, { maximumFractionDigits: casas });
}

export function encurtarEndereco(e?: string | null) {
  if (!e) return '';
  return `${e.slice(0, 6)}…${e.slice(-4)}`;
}
