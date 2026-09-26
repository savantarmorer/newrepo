import * as auth from './opsAuth.js';

const OPEN_CATALOG_URL = new URL('../content/aberto.json', import.meta.url).href;
const root = document.getElementById('jip-root');
const PUBLIC_ROUTES = new Set(['aberto', 'entrar', 'cadastro', 'recuperar', 'redefinir', 'comprar']);
const state = {
  session: null,
  paid: false,
  teacher: false,
  catalog: null,
  workspace: null,
  loadingError: ''
};

function route() {
  const [name = '', id = ''] = location.hash.replace(/^#\/?/, '').split('/');
  return { name, id };
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function sanitizedLessonHtml(html = '') {
  const documentNode = new DOMParser().parseFromString(`<main>${html}</main>`, 'text/html');
  const allowed = new Set(['MAIN', 'H2', 'H3', 'P', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'CODE', 'ASIDE', 'BR', 'A']);
  const walk = (node) => {
    [...node.children].forEach((child) => {
      if (!allowed.has(child.tagName)) {
        child.replaceWith(...child.childNodes);
        return;
      }
      const href = child.tagName === 'A' ? safeUrl(child.getAttribute('href')) : '';
      [...child.attributes].forEach((attribute) => child.removeAttribute(attribute.name));
      if (child.tagName === 'ASIDE') child.className = 'ops-callout';
      if (child.tagName === 'H3') child.className = 'ops-script-label';
      if (child.tagName === 'A') {
        if (!href) {
          child.replaceWith(...child.childNodes);
          return;
        }
        child.setAttribute('href', href);
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener noreferrer');
      }
      walk(child);
    });
  };
  const main = documentNode.body.firstElementChild;
  walk(main);
  return main.innerHTML;
}

function toast(message, type = 'info') {
  document.querySelector('.ops-toast')?.remove();
  const element = document.createElement('div');
  element.className = `ops-toast ops-toast-${type}`;
  element.setAttribute('role', 'status');
  element.textContent = message;
  document.body.append(element);
  setTimeout(() => element.remove(), 3600);
}

function button(label, id, variant = 'primary', type = 'button') {
  return `<button class="ops-btn ops-btn-${variant}" id="${id}" type="${type}">${label}</button>`;
}

function publicHeader() {
  return `<header class="ops-public-header">
    <a class="ops-wordmark" href="/jornalismo/">JIP <span>/ CURSO</span></a>
    <nav aria-label="Acesso"><a href="#/aberto">Aula aberta</a><a href="#/entrar">Entrar</a></nav>
  </header>`;
}

function shell(current, content, context = '') {
  const items = [
    ['inicio', 'Início'],
    ['sala', 'Aulas'],
    ['bonus', 'Ferramentas'],
    ['conta', 'Minha conta']
  ];
  const navigation = items.map(([key, label]) =>
    `<a href="#/${key}" ${current === key ? 'aria-current="page"' : ''}>${label}</a>`).join('');
  return `<a class="ops-skip" href="#conteudo">Pular para o conteúdo</a>
  <div class="ops-shell">
    <aside class="ops-sidebar">
      <a class="ops-brand" href="#/inicio"><span>JIP</span>Jornalismo Investigativo</a>
      <nav aria-label="Principal">${navigation}</nav>
      <footer><span class="ops-status-dot"></span> Conta ativa<br><small>Acesso liberado</small></footer>
    </aside>
    <header class="ops-mobile-head"><a href="#/inicio">JIP / CURSO</a><span><i></i> Online</span></header>
    <div class="ops-stage ${context ? 'has-context' : ''}">
      <main id="conteudo" class="ops-main">${content}</main>
      ${context ? `<aside class="ops-context">${context}</aside>` : ''}
    </div>
    <nav class="ops-mobile-nav ops-mobile-nav-4" aria-label="Navegação móvel">${navigation}</nav>
  </div>`;
}

function authLayout(title, intro, form) {
  root.innerHTML = `${publicHeader()}<main class="ops-auth-layout">
    <section class="ops-auth-brief">
      <p class="ops-eyebrow">Curso</p>
      <h1>Assista às aulas.<br>Use as ferramentas.</h1>
      <p>31 aulas de apuração, LAI, dados públicos e checagem. Você entra, continua de onde parou e baixa os materiais.</p>
      <ul><li>Progresso e notas salvos na sua conta</li><li>Acesso liberado após a compra</li><li>Notas privadas protegidas por RLS</li></ul>
    </section>
    <section class="ops-auth-panel"><p class="ops-eyebrow">JIP</p><h2>${title}</h2><p>${intro}</p>${form}</section>
  </main>`;
}

function field(id, label, type = 'text', autocomplete = '', hint = '') {
  return `<label class="ops-field" for="${id}"><span>${label}</span>
    <input id="${id}" name="${id}" type="${type}" autocomplete="${autocomplete}" ${type === 'password' ? 'minlength="12"' : ''}>
    ${hint ? `<small>${hint}</small>` : ''}</label>`;
}

function renderLogin() {
  authLayout('Entrar', 'Use o mesmo e-mail da compra.', `
    <form id="login-form" novalidate>
      ${field('email', 'E-mail', 'email', 'email')}
      ${field('password', 'Senha', 'password', 'current-password')}
      <div class="ops-form-row">${button('Entrar', 'login-submit', 'primary', 'submit')}<a href="#/recuperar">Esqueci a senha</a></div>
    </form>
    <div class="ops-divider"><span>ou</span></div>
    ${button('Continuar com Google', 'google', 'secondary')}
    ${button('Receber link por e-mail', 'magic', 'quiet')}
    <p class="ops-auth-foot">Primeiro acesso? <a href="#/cadastro">Criar conta</a></p>
    <p id="auth-feedback" class="ops-feedback" role="status"></p>`);
  document.getElementById('login-form').onsubmit = async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      await auth.signInPassword(email, password);
    } catch (error) {
      document.getElementById('auth-feedback').textContent = auth.friendlyAuthError(error);
    }
  };
  document.getElementById('google').onclick = () => auth.signInGoogle().catch(showAuthError);
  document.getElementById('magic').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    if (!isEmail(email)) return showAuthError(new Error('email'));
    try {
      await auth.sendMagicLink(email);
      document.getElementById('auth-feedback').textContent = 'Se a conta estiver habilitada, o link chegará em instantes.';
    } catch (error) {
      showAuthError(error);
    }
  };
}

function showAuthError(error) {
  const target = document.getElementById('auth-feedback');
  if (target) target.textContent = auth.friendlyAuthError(error);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function strongPassword(value) {
  return value.length >= 12
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9]/.test(value);
}

function renderSignup() {
  authLayout('Criar conta', 'Criar conta não libera o curso sozinho: o e-mail também precisa estar autorizado após a compra.', `
    <form id="signup-form" novalidate>
      ${field('email', 'E-mail', 'email', 'email')}
      ${field('password', 'Senha', 'password', 'new-password', '12+ caracteres com maiúscula, minúscula, número e símbolo.')}
      ${button('Criar conta', 'signup-submit', 'primary', 'submit')}
    </form>
    <p class="ops-auth-foot">Já tem conta? <a href="#/entrar">Entrar</a></p>
    <p id="auth-feedback" class="ops-feedback" role="status"></p>`);
  document.getElementById('signup-form').onsubmit = async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!isEmail(email)) return showAuthError(new Error('email'));
    if (!strongPassword(password)) {
      document.getElementById('auth-feedback').textContent = 'A senha ainda não atende a todos os requisitos.';
      return;
    }
    try {
      await auth.signUp({ email, password });
      document.getElementById('auth-feedback').textContent = 'Verifique seu e-mail para confirmar a conta.';
    } catch (error) {
      showAuthError(error);
    }
  };
}

function renderRecovery(update = false) {
  const title = update ? 'Definir nova senha' : 'Recuperar acesso';
  const input = update
    ? field('password', 'Nova senha', 'password', 'new-password', '12+ caracteres com maiúscula, minúscula, número e símbolo.')
    : field('email', 'E-mail', 'email', 'email');
  authLayout(title, 'A resposta é neutra para proteger a existência das contas.', `
    <form id="recovery-form">${input}${button(update ? 'Salvar nova senha' : 'Enviar instruções', 'recovery-submit', 'primary', 'submit')}</form>
    <p id="auth-feedback" class="ops-feedback" role="status"></p>`);
  document.getElementById('recovery-form').onsubmit = async (event) => {
    event.preventDefault();
    try {
      if (update) {
        const password = document.getElementById('password').value;
        if (!strongPassword(password)) throw new Error('password');
        await auth.updatePassword(password);
        location.hash = '#/inicio';
      } else {
        const email = document.getElementById('email').value.trim();
        if (!isEmail(email)) throw new Error('email');
        await auth.requestPasswordReset(email);
        document.getElementById('auth-feedback').textContent = 'Se a conta existir, as instruções chegarão em instantes.';
      }
    } catch (error) {
      showAuthError(error);
    }
  };
}

function renderAccessRequired() {
  authLayout('Conta identificada', 'Este e-mail ainda não tem autorização para o curso.', `
    <div class="ops-empty"><h3>Acesso pendente</h3><p>Entre com o mesmo e-mail informado na compra. Se já pagou, peça a correção ao suporte.</p>
    <a class="ops-btn ops-btn-primary" href="mailto:iuri@piragibe.com.br?subject=Acesso%20ao%20curso%20JIP">Falar com o suporte</a>
    ${button('Sair desta conta', 'logout', 'quiet')}</div>`);
  document.getElementById('logout').onclick = async () => { await auth.signOut(); location.hash = '#/entrar'; };
}

async function ensureProfileReady() {
  if (!state.workspace || state.workspace.profile?.onboarding_completed) return;
  try {
    state.workspace.profile = await auth.saveProfile(state.session, {
      codinome: state.workspace.profile?.codinome
        || state.session.user.user_metadata?.codinome
        || '',
      opsec_score: state.workspace.profile?.opsec_score ?? 0,
      onboarding_completed: true
    });
  } catch {
    // Não bloqueia o aluno: o gate OpSec foi removido.
  }
}

function nextLesson() {
  return state.catalog.aulas.find((lesson) => !state.workspace.progress.includes(lesson.id))
    || state.catalog.aulas.at(-1);
}

function percentage() {
  return Math.round((state.workspace.progress.length / state.catalog.aulas.length) * 100);
}

function renderDashboard() {
  const lesson = nextLesson();
  const done = state.workspace.progress.length;
  const total = state.catalog.aulas.length;
  const modulesPreview = state.catalog.modules.slice(0, 4).map((module) => {
    const lessons = state.catalog.aulas.filter((item) => item.module === module.id);
    const completed = lessons.filter((item) => state.workspace.progress.includes(item.id)).length;
    return `<a class="ops-lesson-row" href="#/sala"><b>M${module.id}</b><span><strong>${escapeHtml(module.title)}</strong><small>${completed}/${lessons.length} aulas · ${escapeHtml(module.blurb)}</small></span><em>Ver →</em></a>`;
  }).join('');
  const content = `<header class="ops-page-head"><div><p class="ops-eyebrow">Seu curso</p><h1>Olá, ${escapeHtml(auth.displayName(state.session, state.workspace.profile))}</h1><p>${done} de ${total} aulas concluídas · ${percentage()}%</p></div></header>
    <section class="ops-home-cta">
      <a class="ops-action" href="#/aula/${lesson.id}"><span>Continuar aula</span><strong>${lesson.id} · ${escapeHtml(lesson.title)}</strong><small>${escapeHtml(lesson.duration)} · ${escapeHtml(lesson.objective)}</small></a>
      <div class="ops-home-links">
        <a class="ops-btn ops-btn-secondary" href="#/sala">Ver aulas</a>
        <a class="ops-btn ops-btn-secondary" href="#/bonus">Ferramentas</a>
      </div>
    </section>
    <section class="ops-section"><div class="ops-section-head"><div><p class="ops-eyebrow">Módulos</p><h2>O que você vai estudar</h2></div><a href="#/sala">Grade completa</a></div>${modulesPreview}</section>`;
  const context = `<section><div class="ops-context-head"><h2>Arquivos do curso</h2></div>
    <button class="ops-resource-mini" data-resource="planilha" data-filename="planilha-de-cruzamento.xlsx">Planilha de cruzamento <span>XLSX</span></button>
    <button class="ops-resource-mini" data-resource="bonus" data-filename="materiais-bonus.pdf">Materiais bônus <span>PDF</span></button>
    <button class="ops-resource-mini" data-resource="documento" data-filename="documento-completo-curso.md">Documento completo <span>MD</span></button>
    <p class="ops-legal" style="border:0;padding-top:12px;margin:0"><a href="#/bonus">Ver todas as ferramentas →</a></p></section>`;
  root.innerHTML = shell('inicio', content, context);
  bindResourceDownloads();
}

function renderCurriculum() {
  const modules = state.catalog.modules.map((module) => {
    const lessons = state.catalog.aulas.filter((lesson) => lesson.module === module.id);
    const completed = lessons.filter((lesson) => state.workspace.progress.includes(lesson.id)).length;
    return `<details class="ops-module" ${completed < lessons.length ? 'open' : ''}><summary><span>M${module.id}</span><div><strong>${escapeHtml(module.title)}</strong><small>${escapeHtml(module.blurb)}</small></div><em>${completed}/${lessons.length}</em></summary>
      ${lessons.map((lesson) => `<a href="#/aula/${lesson.id}" class="ops-curriculum-row"><b>${lesson.id}</b><span><strong>${escapeHtml(lesson.title)}</strong><small>${escapeHtml(lesson.duration)} · ${escapeHtml(lesson.objective)}</small></span><em>${state.workspace.progress.includes(lesson.id) ? 'Concluída' : 'Abrir'}</em></a>`).join('')}</details>`;
  }).join('');
  root.innerHTML = shell('sala', `<header class="ops-page-head"><div><p class="ops-eyebrow">31 aulas · 8 módulos</p><h1>Aulas</h1></div><strong>${percentage()}%</strong></header>${modules}`);
}

function toolLinks(tools) {
  if (!tools.length) return '<div class="ops-empty"><p>Esta aula não exige ferramenta externa.</p></div>';
  return tools.map((tool) =>
    `<a href="${escapeHtml(safeUrl(tool.url))}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(tool.kind)}</span><strong>${escapeHtml(tool.name)}</strong></a>`
  ).join('');
}

function renderLesson(id) {
  const lesson = state.catalog.aulas.find((item) => item.id === id) || state.catalog.aulas[0];
  const index = state.catalog.aulas.indexOf(lesson);
  const previous = state.catalog.aulas[index - 1];
  const next = state.catalog.aulas[index + 1];
  const saved = state.workspace.exercises[lesson.id]?.texto || '';
  const script = sanitizedLessonHtml(`${lesson.contentHtml || ''}${lesson.closingHtml || ''}`);
  const exercise = sanitizedLessonHtml(lesson.exerciseHtml || '<p>Registre o que você aplicou à sua pauta.</p>');
  const tools = (lesson.tools || []).map((toolId) => state.catalog.toolbox[toolId]).filter(Boolean);
  const content = `<header class="ops-lesson-head"><div><p class="ops-eyebrow">Módulo ${lesson.module} · Aula ${lesson.id} · ${escapeHtml(lesson.duration)}</p><h1>${escapeHtml(lesson.title)}</h1><p>${escapeHtml(lesson.objective)}</p></div><button id="focus-toggle" class="ops-btn ops-btn-secondary">Modo foco</button></header>
    <div class="ops-video-empty"><strong>Vídeo ainda não publicado</strong><p>O roteiro completo está abaixo. Não há player fictício.</p></div>
    <section class="ops-tools ops-tools-inline"><h2>Ferramentas desta aula</h2>${toolLinks(tools)}</section>
    <article class="ops-script"><label class="ops-search">Buscar no roteiro<input id="script-search" type="search" placeholder="termo, lei ou ferramenta"></label><div id="script-content">${script}</div></article>
    <details class="ops-notes-block"><summary>Notas e exercício (opcional)</summary>
      <section class="ops-notes">${exercise}<label class="ops-field"><span>Notas privadas</span><textarea id="lesson-notes" rows="10">${escapeHtml(saved)}</textarea><small>Salvas na sua conta com acesso só seu (RLS). Não registre dados que identifiquem fontes.</small></label>${button('Salvar notas', 'save-notes')}</section>
    </details>
    <footer class="ops-lesson-footer">${previous ? `<a href="#/aula/${previous.id}">← Aula ${previous.id}</a>` : '<span></span>'}${button(state.workspace.progress.includes(lesson.id) ? 'Aula concluída' : 'Marcar como concluída', 'complete', state.workspace.progress.includes(lesson.id) ? 'secondary' : 'primary')}${next ? `<a href="#/aula/${next.id}">Aula ${next.id} →</a>` : '<a href="#/inicio">Voltar ao início</a>'}</footer>`;
  root.innerHTML = shell('sala', content);
  document.getElementById('focus-toggle').onclick = () => document.body.classList.toggle('ops-focus');
  document.getElementById('script-search').oninput = (event) => {
    const query = event.target.value.trim().toLocaleLowerCase('pt-BR');
    root.querySelectorAll('#script-content p, #script-content li, #script-content h3').forEach((element) => {
      element.hidden = query && !element.textContent.toLocaleLowerCase('pt-BR').includes(query);
    });
  };
  document.getElementById('save-notes').onclick = async () => {
    const texto = document.getElementById('lesson-notes').value.slice(0, 12000);
    try {
      await auth.saveExercise(state.session, lesson.id, { texto });
      state.workspace.exercises[lesson.id] = { texto };
      toast('Notas salvas na sua conta.', 'success');
    } catch {
      toast('Não foi possível salvar. Nada foi marcado como sincronizado.', 'error');
    }
  };
  document.getElementById('complete').onclick = async () => {
    if (state.workspace.progress.includes(lesson.id)) return;
    try {
      await auth.markComplete(state.session, lesson.id);
      state.workspace.progress.push(lesson.id);
      toast('Aula concluída.', 'success');
      if (next) location.hash = `#/aula/${next.id}`;
    } catch {
      toast('Não foi possível salvar o progresso.', 'error');
    }
  };
}

function renderPauta() {
  const pauta = state.workspace.pauta;
  root.innerHTML = shell('conta', `<header class="ops-page-head"><div><p class="ops-eyebrow">Opcional</p><h1>Minha pauta</h1><p>Espaço para a pergunta verificável e o caderno da sua investigação.</p></div></header>
    <form id="pauta-form" class="ops-form-panel">
      ${field('pauta-title', 'Pergunta verificável', 'text', '', 'Não escreva uma acusação como título.')}
      <label class="ops-field"><span>Hipótese</span><textarea id="pauta-hypothesis" rows="5">${escapeHtml(pauta.dados?.hipotese || '')}</textarea></label>
      <label class="ops-field"><span>Caderno de apuração</span><textarea id="pauta-notes" rows="14">${escapeHtml(pauta.dados?.notas || '')}</textarea><small>Não registre informações que identifiquem fontes sensíveis.</small></label>
      ${button('Salvar pauta', 'save-pauta', 'primary', 'submit')}
    </form>`);
  document.getElementById('pauta-title').value = pauta.titulo || '';
  document.getElementById('pauta-form').onsubmit = async (event) => {
    event.preventDefault();
    const updated = {
      titulo: document.getElementById('pauta-title').value.trim().slice(0, 180),
      dados: {
        ...pauta.dados,
        hipotese: document.getElementById('pauta-hypothesis').value.slice(0, 4000),
        notas: document.getElementById('pauta-notes').value.slice(0, 12000)
      }
    };
    try {
      state.workspace.pauta = await auth.savePauta(state.session, updated);
      toast('Pauta salva na sua conta.', 'success');
    } catch {
      toast('Não foi possível salvar a pauta.', 'error');
    }
  };
}

function statusLabel(status) {
  return { 'a-verificar': 'A verificar', verificada: 'Verificada', descartada: 'Descartada' }[status] || status;
}

function renderEvidence() {
  const items = state.workspace.evidence;
  root.innerHTML = shell('conta', `<header class="ops-page-head"><div><p class="ops-eyebrow">Opcional</p><h1>Registros</h1><p>Anote documentos, links e pessoas da sua própria pauta. Vínculo não é culpa.</p></div>${button('Adicionar registro', 'new-evidence')}</header>
    <section id="evidence-form-wrap" hidden></section>
    <section class="ops-evidence-list">${items.length ? items.map((item) => {
      const related = items.find((candidate) => candidate.id === item.relacionada_a);
      return `<article><div><span>${escapeHtml(item.tipo)} · ${statusLabel(item.status)}</span><h2>${escapeHtml(item.titulo)}</h2><p>${escapeHtml(item.observacao)}</p>${related ? `<small>Relacionado a: ${escapeHtml(related.titulo)}</small>` : ''}${safeUrl(item.fonte_url) ? `<a href="${escapeHtml(safeUrl(item.fonte_url))}" target="_blank" rel="noopener noreferrer">Abrir fonte</a>` : ''}</div><button class="ops-btn ops-btn-danger" data-delete="${item.id}">Excluir</button></article>`;
    }).join('') : '<div class="ops-empty"><h2>Nenhum registro ainda</h2><p>Adicione apenas itens da sua investigação. A plataforma não cria dados de exemplo.</p></div>'}</section>`);
  document.getElementById('new-evidence').onclick = showEvidenceForm;
  root.querySelectorAll('[data-delete]').forEach((element) => {
    element.onclick = async () => {
      if (!confirm('Excluir este registro? Esta ação não pode ser desfeita.')) return;
      try {
        await auth.deleteEvidence(state.session, element.dataset.delete);
        state.workspace.evidence = state.workspace.evidence.filter((item) => item.id !== element.dataset.delete);
        renderEvidence();
      } catch {
        toast('Não foi possível excluir o registro.', 'error');
      }
    };
  });
}

function showEvidenceForm() {
  const wrap = document.getElementById('evidence-form-wrap');
  wrap.hidden = false;
  wrap.innerHTML = `<form id="evidence-form" class="ops-form-panel"><h2>Novo registro</h2>
    ${field('evidence-title', 'Título')}
    <label class="ops-field"><span>Tipo</span><select id="evidence-type"><option value="documento">Documento</option><option value="pessoa">Pessoa</option><option value="empresa">Empresa</option><option value="link">Link</option><option value="nota">Nota</option></select></label>
    ${field('evidence-url', 'URL da fonte (opcional)', 'url', 'url')}
    <label class="ops-field"><span>Observação</span><textarea id="evidence-note" rows="5"></textarea></label>
    <label class="ops-field"><span>Relacionar a outro registro (opcional)</span><select id="evidence-related"><option value="">Sem relação</option>${state.workspace.evidence.map((item) => `<option value="${item.id}">${escapeHtml(item.titulo)}</option>`).join('')}</select><small>A relação indica apenas vínculo de apuração, nunca culpa.</small></label>
    <label class="ops-field"><span>Status</span><select id="evidence-status"><option value="a-verificar">A verificar</option><option value="verificada">Verificada</option><option value="descartada">Descartada</option></select></label>
    <div class="ops-form-row">${button('Salvar', 'save-evidence', 'primary', 'submit')}${button('Cancelar', 'cancel-evidence', 'quiet')}</div></form>`;
  document.getElementById('cancel-evidence').onclick = () => { wrap.hidden = true; };
  document.getElementById('evidence-form').onsubmit = async (event) => {
    event.preventDefault();
    const evidence = {
      titulo: document.getElementById('evidence-title').value.trim().slice(0, 160),
      tipo: document.getElementById('evidence-type').value,
      fonte_url: safeUrl(document.getElementById('evidence-url').value.trim()),
      observacao: document.getElementById('evidence-note').value.slice(0, 4000),
      relacionada_a: document.getElementById('evidence-related').value || null,
      status: document.getElementById('evidence-status').value
    };
    if (!evidence.titulo) return toast('Dê um título ao registro.', 'error');
    try {
      state.workspace.evidence.unshift(await auth.addEvidence(state.session, evidence));
      renderEvidence();
    } catch {
      toast('Não foi possível salvar o registro.', 'error');
    }
  };
}

function kindLabel(kind) {
  return {
    leitura: 'Leitura',
    consulta: 'Consulta',
    prática: 'Prática',
    ferramenta: 'Ferramenta',
    segurança: 'Segurança'
  }[kind] || kind;
}

function renderResources() {
  const resources = [
    ['Planilha de cruzamento', '13 abas, fórmulas e exemplo fictício identificado no próprio arquivo.', 'planilha', 'planilha-de-cruzamento.xlsx', 'XLSX'],
    ['Materiais bônus', 'Modelos LAI, checklist pré-publicação, guia da planilha e glossário.', 'bonus', 'materiais-bonus.pdf', 'PDF'],
    ['Documento completo do curso', 'Mapa, roteiros, referências e materiais em texto.', 'documento', 'documento-completo-curso.md', 'MD']
  ];
  const byKind = {};
  Object.values(state.catalog.toolbox || {}).forEach((tool) => {
    const group = kindLabel(tool.kind);
    (byKind[group] ||= []).push(tool);
  });
  const sites = Object.entries(byKind).map(([group, tools]) =>
    `<section class="ops-tool-group"><h3>${escapeHtml(group)}</h3>${tools.map((tool) =>
      `<a href="${escapeHtml(safeUrl(tool.url))}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(tool.name)}</strong></a>`
    ).join('')}</section>`
  ).join('');
  root.innerHTML = shell('bonus', `<header class="ops-page-head"><div><p class="ops-eyebrow">Downloads e sites</p><h1>Ferramentas</h1><p>Arquivos do curso e sites oficiais usados nas aulas.</p></div></header>
    <section class="ops-resource-grid">${resources.map(([title, description, key, filename, type]) =>
      `<button data-resource="${key}" data-filename="${filename}"><span>${type}</span><h2>${title}</h2><p>${description}</p><strong>Baixar →</strong></button>`
    ).join('')}</section>
    <section class="ops-section"><div class="ops-section-head"><div><p class="ops-eyebrow">Sites</p><h2>Links por tipo</h2></div></div>
      <div class="ops-sites">${sites}</div>
    </section>
    <p class="ops-legal">Materiais conferidos em setembro de 2026. Conteúdo educativo; não substitui orientação jurídica para o caso concreto.</p>`);
  bindResourceDownloads();
}

function bindResourceDownloads() {
  root.querySelectorAll('[data-resource]').forEach((element) => {
    element.onclick = async () => {
      element.disabled = true;
      try {
        await auth.downloadResource(state.session, element.dataset.resource, element.dataset.filename);
      } catch {
        toast('Não foi possível baixar o arquivo. Tente novamente.', 'error');
      } finally {
        element.disabled = false;
      }
    };
  });
}

function renderAccount() {
  const profile = state.workspace.profile;
  root.innerHTML = shell('conta', `<header class="ops-page-head"><div><p class="ops-eyebrow">Minha conta</p><h1>${escapeHtml(auth.displayName(state.session, profile))}</h1><p>${escapeHtml(state.session.user.email || '')}</p></div></header>
    <section class="ops-account"><dl>
      <div><dt>Acesso</dt><dd>Autorizado</dd></div>
      <div><dt>Progresso</dt><dd>${percentage()}%</dd></div>
      <div><dt>Aulas concluídas</dt><dd>${state.workspace.progress.length}/${state.catalog.aulas.length}</dd></div>
    </dl>
    <div class="ops-home-links" style="margin-bottom:20px">
      <a class="ops-btn ops-btn-secondary" href="#/pauta">Minha pauta</a>
      <a class="ops-btn ops-btn-secondary" href="#/evidencias">Registros</a>
    </div>
    ${button('Sair', 'logout', 'danger')}</section>`);
  document.getElementById('logout').onclick = async () => { await auth.signOut(); location.hash = '#/entrar'; };
}

async function renderOpenLesson() {
  const catalog = await fetch(OPEN_CATALOG_URL).then((response) => response.json());
  const content = catalog.aulas.map((lesson) => `<section class="ops-open-lesson"><p class="ops-eyebrow">Aula ${lesson.id} · ${escapeHtml(lesson.duration)}</p><h2>${escapeHtml(lesson.title)}</h2><div class="ops-script">${sanitizedLessonHtml(`${lesson.contentHtml}${lesson.closingHtml}`)}</div></section>`).join('');
  root.innerHTML = `${publicHeader()}<main class="ops-open"><header><p class="ops-eyebrow">Aula aberta</p><h1>Pedido LAI e recursos</h1><p>Conteúdo real das aulas 3.2 e 3.3. Exercícios e materiais extras exigem acesso autorizado.</p></header>${content}</main>`;
}

function renderPurchase() {
  root.innerHTML = `${publicHeader()}<main class="ops-open"><header><p class="ops-eyebrow">Inscrição</p><h1>Jornalismo Investigativo na Prática</h1><p>31 aulas, materiais e exercícios aplicados a uma pauta sua. Pré-venda R$ 197 · preço cheio R$ 297. Conteúdo educativo; não substitui advogado.</p><a class="ops-btn ops-btn-primary" href="mailto:iuri@piragibe.com.br?subject=Compra%20curso%20JIP">Comprar</a><a class="ops-btn ops-btn-secondary" href="#/entrar">Já comprei — Entrar</a></header></main>`;
}

function renderCatalogBlocker() {
  root.innerHTML = shell('inicio', `<section class="ops-empty ops-blocker"><p class="ops-eyebrow">Configuração pendente</p><h1>O catálogo privado ainda não está disponível</h1><p>A autenticação funcionou, mas a função protegida de entrega das aulas não respondeu. O conteúdo não será carregado de um arquivo público como fallback.</p><p>O administrador deve executar <code>curso-jip-operacoes.sql</code> e publicar a Edge Function <code>curso-catalog</code>.</p></section>`);
}

async function boot() {
  const current = route();
  root.setAttribute('aria-busy', 'true');
  try {
    state.session = await auth.getSession();
    const access = await auth.accessState(state.session);
    state.paid = access.paid;
    state.teacher = access.teacher;

    if (!current.name) {
      location.hash = state.paid ? '#/inicio' : '#/entrar';
      return;
    }
    if (!state.session && !PUBLIC_ROUTES.has(current.name)) {
      sessionStorage.setItem('jip-next', location.hash);
      location.hash = '#/entrar';
      return;
    }
    if (state.session && !state.paid && !PUBLIC_ROUTES.has(current.name)) {
      renderAccessRequired();
      return;
    }
    if (state.paid && !state.catalog) {
      try {
        [state.catalog, state.workspace] = await Promise.all([
          auth.fetchPrivateCatalog(state.session),
          auth.loadWorkspace(state.session)
        ]);
        await ensureProfileReady();
      } catch (error) {
        state.loadingError = String(error.message || error);
      }
    }
    if (state.paid && state.loadingError && !PUBLIC_ROUTES.has(current.name)) {
      renderCatalogBlocker();
      return;
    }
    if (state.paid && (current.name === 'entrar' || current.name === 'onboarding')) {
      location.hash = sessionStorage.getItem('jip-next') || '#/inicio';
      sessionStorage.removeItem('jip-next');
      return;
    }

    if (current.name === 'entrar') renderLogin();
    else if (current.name === 'cadastro') renderSignup();
    else if (current.name === 'recuperar') renderRecovery(false);
    else if (current.name === 'redefinir') renderRecovery(true);
    else if (current.name === 'aberto') await renderOpenLesson();
    else if (current.name === 'comprar') renderPurchase();
    else if (current.name === 'inicio') renderDashboard();
    else if (current.name === 'sala') renderCurriculum();
    else if (current.name === 'aula') renderLesson(current.id);
    else if (current.name === 'pauta') renderPauta();
    else if (current.name === 'evidencias') renderEvidence();
    else if (current.name === 'bonus') renderResources();
    else if (current.name === 'conta') renderAccount();
    else location.hash = state.paid ? '#/inicio' : '#/entrar';
  } catch {
    root.innerHTML = `${publicHeader()}<main class="ops-open"><section class="ops-empty"><h1>Não foi possível carregar o curso</h1><p>Verifique sua conexão e tente novamente.</p><button class="ops-btn ops-btn-primary" onclick="location.reload()">Tentar novamente</button></section></main>`;
  } finally {
    root.removeAttribute('aria-busy');
  }
}

let authInitialized = false;
window.addEventListener('hashchange', boot);
auth.watchAuth(() => {
  if (authInitialized) {
    state.catalog = null;
    state.workspace = null;
    state.loadingError = '';
    boot();
  }
  authInitialized = true;
});
boot();
