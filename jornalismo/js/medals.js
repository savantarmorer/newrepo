// Medalhas do curso: uma por módulo, conquistada ao concluir todas as aulas dele.
export const MEDALS = {
  1: 'Faro investigativo',
  2: 'Guardião de fontes',
  3: 'Transparência ativa',
  4: 'Cruzador de dados',
  5: 'Padrão de prova',
  6: 'Blindagem jurídica',
  7: 'Matéria no ar',
  8: 'Investigação completa'
};

export function medalSvg(moduleId, earned, size = 56) {
  const n = String(moduleId).padStart(2, '0');
  const fill = earned ? '#FFB800' : 'none';
  const stroke = earned ? '#FFB800' : '#66666F';
  const ink = earned ? '#0C0C0D' : '#A9A59C';
  return `<svg class="ops-medal-svg" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <path d="M22 2h20l-4 14H26z" fill="${earned ? '#D49A00' : 'none'}" stroke="${stroke}" stroke-width="2"/>
    <path d="M32 14l15.6 9v18L32 50l-15.6-9V23z" transform="translate(0 6)" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <path d="M32 24l9.5 5.5v11L32 46l-9.5-5.5v-11z" transform="translate(0 2)" fill="none" stroke="${earned ? '#0C0C0D' : '#3A3A40'}" stroke-width="1.5" opacity=".5"/>
    <text x="32" y="43" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, monospace" font-size="12" font-weight="700" fill="${ink}">${n}</text>
  </svg>`;
}
