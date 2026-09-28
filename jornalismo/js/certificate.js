// Certificado de conclusão do curso, emitido pela empresa do autor.
// Usado pela área do aluno (#/certificado) e para gerar a prévia da landing.
import { MEDALS, medalSvg } from './medals.js';

export const ISSUER = {
  razaoSocial: 'Iuri Piragibe Comunicação e Audiovisual Ltda.',
  cnpj: '68.595.950/0001-40',
  instrutor: 'Iuri Piragibe'
};

export const COURSE = {
  titulo: 'Jornalismo Investigativo na Prática',
  cargaHoraria: '6 horas'
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })
    .format(date);
}

// Código estável por aluno: o mesmo usuário sempre recebe o mesmo código.
export async function certificateCode(userId) {
  const bytes = new TextEncoder().encode(`jip-certificado:${userId}`);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const hex = [...hash.slice(0, 6)].map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `JIP-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

export function certificateHtml({ nome, concluidoEm, emitidoEm, codigo, modules, aulas }) {
  const modulesList = modules.map((module) =>
    `<li><span>${String(module.id).padStart(2, '0')}</span>${escapeHtml(module.title)}</li>`).join('');
  const medals = modules.map((module) =>
    `<li title="${escapeHtml(MEDALS[module.id] || module.title)}">${medalSvg(module.id, true, 30)}</li>`).join('');
  return `<article class="cert" aria-label="Certificado de conclusão">
    <div class="cert-inner">
      <header class="cert-top">
        <span class="cert-brand">IURI<b>PIRAGIBE</b></span>
        <span class="cert-code">Código ${escapeHtml(codigo)}</span>
      </header>
      <p class="cert-kicker">Certificado de conclusão</p>
      <p class="cert-lead">Certificamos que</p>
      <h1 class="cert-name">${escapeHtml(nome)}</h1>
      <p class="cert-text">concluiu o curso livre <strong>${escapeHtml(COURSE.titulo)}</strong>, com carga horária de ${escapeHtml(COURSE.cargaHoraria)}, composto por ${aulas} aulas em ${modules.length} módulos, em ${escapeHtml(concluidoEm)}.</p>
      <div class="cert-body">
        <ol class="cert-modules">${modulesList}</ol>
        <div class="cert-seal">
          <ul class="cert-medals" aria-label="Medalhas conquistadas">${medals}</ul>
          <p>“Sem documento, é lenda.”</p>
        </div>
      </div>
      <footer class="cert-foot">
        <div class="cert-sign">
          <img src="/jornalismo/img/assinatura.png" alt="" onerror="this.remove()">
          <span class="cert-line"></span>
          <strong>${escapeHtml(ISSUER.instrutor)}</strong>
          <small>Instrutor</small>
        </div>
        <div class="cert-issuer">
          <strong>${escapeHtml(ISSUER.razaoSocial)}</strong>
          <small>CNPJ ${escapeHtml(ISSUER.cnpj)}</small>
          <small>Emitido em ${escapeHtml(emitidoEm)}</small>
        </div>
      </footer>
      <p class="cert-legal">Curso livre de formação continuada, nos termos da Lei nº 9.394/1996 e do Decreto nº 5.154/2004.</p>
    </div>
  </article>`;
}
