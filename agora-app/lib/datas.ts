/** Entrada de datas em formato brasileiro (DD/MM/AAAA e DD/MM/AAAA HH:mm) sem dependências nativas. */

export function paraEntradaData(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function paraEntradaDataHora(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${paraEntradaData(iso)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** "25/12/2026" → "2026-12-25" (null se inválida) */
export function lerData(texto: string): string | null {
  const m = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mes, a] = m;
  const data = new Date(Number(a), Number(mes) - 1, Number(d));
  if (data.getMonth() !== Number(mes) - 1) return null;
  return `${a}-${mes!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
}

/** "25/12/2026 18:30" → ISO com fuso local (null se inválida) */
export function lerDataHora(texto: string): string | null {
  const m = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, d, mes, a, h, min] = m;
  const data = new Date(Number(a), Number(mes) - 1, Number(d), Number(h), Number(min));
  if (Number.isNaN(data.getTime()) || data.getMonth() !== Number(mes) - 1) return null;
  return data.toISOString();
}

export function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function somarDias(dias: number, base = new Date()): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d;
}
