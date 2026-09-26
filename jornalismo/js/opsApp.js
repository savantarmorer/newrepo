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
  loadingError: '',
  onboardingStep: 0,
  onboarding: { vertente: '', answers: [] }
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
    <a class="ops-wordmark" href="/jornalismo/">JIP <span>/ SALA DE INVESTIGAÇÃO</span></a>
    <nav aria-label="Acesso"><a href="#/aberto">Aula aberta</a><a href="#/entrar">Entrar</a></nav>
  </header>`;
}

function shell(current, content, context = '') {
  const items = [
    ['inicio', 'Operação'],
    ['sala', 'Aulas'],
    ['evidencias', 'Evidências'],
    ['bonus', 'Recursos'],
    ['conta', 'Conta']
  ];
  const navigation = items.map(([key, label]) =>
    `<a href="#/${key}" ${current === key ? 'aria-current="page"' : ''}>${label}</a>`).join('');
  return `<a class="ops-skip" href="#conteudo">Pular para o conteúdo</a>
  <div class="ops-shell">
    <aside class="ops-sidebar">
      <a class="ops-brand" href="#/inicio"><span>JIP</span>Sala de investigação</a>
      <nav aria-label="Principal">${navigation}</nav>
      <footer><span class="ops-status-dot"></span> Sessão sincronizada<br><small>Acesso autorizado</small></footer>
    </aside>
    <header class="ops-mobile-head"><a href="#/inicio">JIP / SALA</a><span><i></i> Sincronizado</span></header>
    <div class="ops-stage ${context ? 'has-context' : ''}">
      <main id="conteudo" class="ops-main">${content}</main>
      ${context ? `<aside class="ops-context">${context}</aside>` : ''}
    </div>
    <nav class="ops-mobile-nav" aria-label="Navegação móvel">${navigation}</nav>
  </div>`;
}

function authLayout(title, intro, form) {
  root.innerHTML = `${publicHeader()}<main class="ops-auth-layout">
    <section class="ops-auth-brief">
      <p class="ops-eyebrow">Acesso operacional</p>
      <h1>Apure com método.<br>Publique com prova.</h1>
      <p>Uma pauta real atravessa 31 aulas: hipótese, LAI, dados, checagem, outro lado e revisão pré-publicação.</p>
      <ul><li>Estado salvo na sua conta</li><li>Acesso condicionado à autorização da compra</li><li>Dados privados protegidos por RLS</li></ul>
    </section>
    <section class="ops-auth-panel"><p class="ops-eyebrow">JIP / Identificação</p><h2>${title}</h2><p>${intro}</p>${form}</section>
  </main>`;
}

function field(id, label, type = 'text', autocomplete = '', hint = '') {
  return `<label class="ops-field" for="${id}"><span>${label}</span>
    <input id="${id}" name="${id}" type="${type}" autocomplete="${autocomplete}" ${type === 'password' ? 'minlength="12"' : ''}>
    ${hint ? `<small>${hint}</small>` : ''}</label>`;
}

function renderLogin() {
  authLayout('Entrar na sala', 'Use a conta autorizada na lista de alunos.', `
    <form id="login-form" novalidate>
      ${field('email', 'E-mail', 'email', 'email')}
      ${field('password', 'Senha', 'password', 'current-password')}
      <div class="ops-form-row">${button('Entrar', 'login-submit', 'primary', 'submit')}<a href="#/recuperar">Esqueci a senha</a></div>
    </form>
    <div class="ops-divider"><span>ou</span></div>
    ${button('Continuar com Google', 'google', 'secondary')}
    ${button('Receber link seguro por e-mail', 'magic', 'quiet')}
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
  authLayout('Criar identificação', 'A conta não libera o curso sozinha: o e-mail também precisa estar autorizado após a compra.', `
    <form id="signup-form" novalidate>
      ${field('codinome', 'Codinome (opcional)', 'text', 'nickname', 'Até 40 caracteres; não use dados de fonte.')}
      ${field('email', 'E-mail seguro', 'email', 'email')}
      ${field('password', 'Senha', 'password', 'new-password', '12+ caracteres com maiúscula, minúscula, número e símbolo.')}
      ${button('Criar conta', 'signup-submit', 'primary', 'submit')}
    </form>
    <p class="ops-auth-foot">Já tem conta? <a href="#/entrar">Entrar</a></p>
    <p id="auth-feedback" class="ops-feedback" role="status"></p>`);
  document.getElementById('signup-form').onsubmit = async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const codinome = document.getElementById('codinome').value.trim().slice(0, 40);
    if (!isEmail(email)) return showAuthError(new Error('email'));
    if (!strongPassword(password)) {
      document.getElementById('auth-feedback').textContent = 'A senha ainda não atende a todos os requisitos.';
      return;
    }
    try {
      await auth.signUp({ email, password, codinome });
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
  authLayout('Conta identificada', 'Este e-mail ainda não possui autorização para o curso.', `
    <div class="ops-empty"><h3>Acesso pendente</h3><p>Entre com o mesmo e-mail informado na compra. Se já pagou, solicite a correção ao suporte.</p>
    <a class="ops-btn ops-btn-primary" href="mailto:iuri@piragibe.com.br?subject=Acesso%20ao%20curso%20JIP">Falar com o suporte</a>
    ${button('Sair desta conta', 'logout', 'quiet')}</div>`);
  document.getElementById('logout').onclick = async () => { await auth.signOut(); location.hash = '#/entrar'; };
}

function renderOnboarding() {
  const profile = state.workspace.profile || {};
  if (state.onboardingStep === 0) {
    root.innerHTML = shell('inicio', `<section class="ops-onboarding">
      <p class="ops-eyebrow">Triagem operacional · 1 de 3</p><h1>Qual é sua frente principal?</h1>
      <p>Isso organiza a primeira missão. Você poderá alterar depois.</p>
      <div class="ops-choice-grid">
        <button data-track="financeira"><strong>Investigação financeira</strong><span>Contratos, pagamentos, empresas e sócios.</span></button>
        <button data-track="direitos-humanos"><strong>Conflitos e direitos humanos</strong><span>Fontes sensíveis, documentação e interesse público.</span></button>
        <button data-track="osint"><strong>OSINT</strong><span>Fontes abertas, imagens, arquivos e geolocalização.</span></button>
      </div></section>`);
    root.querySelectorAll('[data-track]').forEach((element) => {
      element.onclick = () => {
        state.onboarding.vertente = element.dataset.track;
        state.onboardingStep = 1;
        renderOnboarding();
      };
    });
    return;
  }
  if (state.onboardingStep === 1) {
    root.innerHTML = shell('inicio', `<section class="ops-onboarding">
      <p class="ops-eyebrow">Triagem operacional · 2 de 3</p><h1>Diagnóstico de segurança</h1>
      <form id="opsec-form">
        <fieldset><legend>Uma fonte envia um PDF sensível pelo mensageiro. O primeiro passo é:</legend>
          <label for="opsec-q1-no"><input id="opsec-q1-no" type="radio" name="q1" value="0"> Publicar um print para provar que recebeu.</label>
          <label for="opsec-q1-ok"><input id="opsec-q1-ok" type="radio" name="q1" value="50"> Guardar o original, registrar a origem e gerar um hash.</label>
        </fieldset>
        <fieldset><legend>Antes de publicar o documento, você:</legend>
          <label for="opsec-q2-no"><input id="opsec-q2-no" type="radio" name="q2" value="0"> Só cobre o CPF visualmente no editor de PDF.</label>
          <label for="opsec-q2-ok"><input id="opsec-q2-ok" type="radio" name="q2" value="50"> Remove o dado do arquivo final, metadados e marcas que identifiquem a fonte.</label>
        </fieldset>
        ${button('Calcular diagnóstico', 'opsec-submit', 'primary', 'submit')}
      </form><p id="opsec-feedback" class="ops-feedback" role="status"></p></section>`);
    document.getElementById('opsec-form').onsubmit = (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      if (!form.has('q1') || !form.has('q2')) {
        document.getElementById('opsec-feedback').textContent = 'Responda às duas situações.';
        return;
      }
      state.onboarding.answers = [Number(form.get('q1')), Number(form.get('q2'))];
      state.onboardingStep = 2;
      renderOnboarding();
    };
    return;
  }
  const score = state.onboarding.answers.reduce((sum, value) => sum + value, 0);
  const name = auth.displayName(state.session, profile);
  root.innerHTML = shell('inicio', `<section class="ops-onboarding ops-credential">
    <p class="ops-eyebrow">Triagem operacional · 3 de 3</p><h1>Credencial pronta</h1>
    <div class="ops-credential-card"><span>JIP / REPÓRTER</span><strong>${escapeHtml(name)}</strong><dl>
      <div><dt>Vertente</dt><dd>${trackLabel(state.onboarding.vertente)}</dd></div>
      <div><dt>OpSec inicial</dt><dd>${score}/100</dd></div>
    </dl></div>
    <p>${score === 100 ? 'Você reconheceu as duas práticas essenciais.' : 'O módulo 2 reforçará cadeia de custódia, metadados e proteção de fontes.'}</p>
    ${button('Liberar primeira missão', 'finish-onboarding', 'primary')}</section>`);
  document.getElementById('finish-onboarding').onclick = async () => {
    try {
      state.workspace.profile = await auth.saveProfile(state.session, {
        codinome: profile.codinome || state.session.user.user_metadata?.codinome || '',
        vertente: state.onboarding.vertente,
        opsec_score: score,
        onboarding_completed: true
      });
      location.hash = '#/aula/1.1';
    } catch {
      toast('Não foi possível salvar a triagem. Tente novamente.', 'error');
    }
  };
}

function trackLabel(value) {
  return {
    financeira: 'Investigação financeira',
    'direitos-humanos': 'Conflitos e direitos humanos',
    osint: 'OSINT'
  }[value] || 'Não definida';
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
  const pauta = state.workspace.pauta;
  const evidence = state.workspace.evidence;
  const profile = state.workspace.profile;
  const dossierTitle = pauta.titulo
    ? escapeHtml(pauta.titulo)
    : 'Nenhuma pauta definida';
  const nextAction = pauta.titulo
    ? `<a class="ops-action" href="#/aula/${lesson.id}"><span>Próxima ação</span><strong>Continuar aula ${lesson.id}: ${escapeHtml(lesson.title)}</strong><small>${escapeHtml(lesson.objective)}</small></a>`
    : `<a class="ops-action" href="#/aula/1.1"><span>Primeira missão</span><strong>Transformar uma suspeita em pergunta verificável</strong><small>Abra a aula 1.1 e defina a pauta que acompanhará o curso.</small></a>`;
  const content = `<header class="ops-page-head"><div><p class="ops-eyebrow">Operação ativa</p><h1>Mesa de apuração</h1></div><span class="ops-state"><i></i>${pauta.titulo ? 'Pauta em andamento' : 'Aguardando pauta'}</span></header>
    <section class="ops-dossier"><div><p class="ops-eyebrow">Dossiê do aluno</p><h2>${dossierTitle}</h2><p>${pauta.titulo ? 'Dados e exercícios salvos na sua conta.' : 'O dossiê nasce quando você concluir a primeira missão.'}</p></div><a class="ops-btn ops-btn-secondary" href="#/pauta">Abrir dossiê</a>${nextAction}</section>
    <section class="ops-metrics" aria-label="Estado da operação">
      <div><span>OpSec</span><strong>${profile?.opsec_score ?? 0}/100</strong></div>
      <div><span>Evidências</span><strong>${evidence.length}</strong></div>
      <div><span>Progresso</span><strong>${percentage()}%</strong></div>
      <div><span>Aulas concluídas</span><strong>${state.workspace.progress.length}/${state.catalog.aulas.length}</strong></div>
    </section>
    <section class="ops-section"><div class="ops-section-head"><div><p class="ops-eyebrow">Formação</p><h2>Continuar aprendizagem</h2></div><a href="#/sala">Ver grade completa</a></div>
      <a class="ops-lesson-row" href="#/aula/${lesson.id}"><b>${lesson.id}</b><span><strong>${escapeHtml(lesson.title)}</strong><small>${escapeHtml(lesson.duration)} · ${escapeHtml(lesson.objective)}</small></span><em>Continuar →</em></a>
    </section>`;
  const context = `<section><div class="ops-context-head"><h2>Evidências recentes</h2><a href="#/evidencias">Ver todas</a></div>
    ${evidence.length ? evidence.slice(0, 3).map(evidenceRow).join('') : '<div class="ops-empty compact"><p>Nenhuma evidência cadastrada.</p><a href="#/evidencias">Adicionar a primeira</a></div>'}
    </section><section><div class="ops-context-head"><h2>Recursos protegidos</h2></div><button class="ops-resource-mini" data-resource="planilha" data-filename="planilha-de-cruzamento.xlsx">Planilha de cruzamento <span>XLSX</span></button><button class="ops-resource-mini" data-resource="bonus" data-filename="materiais-bonus.pdf">Materiais bônus <span>PDF</span></button></section>`;
  root.innerHTML = shell('inicio', content, context);
  bindResourceDownloads();
}

function evidenceRow(item) {
  return `<article class="ops-evidence-mini"><span>${escapeHtml(item.tipo)}</span><strong>${escapeHtml(item.titulo)}</strong><small>${statusLabel(item.status)} · ${new Date(item.updated_at).toLocaleDateString('pt-BR')}</small></article>`;
}

function statusLabel(status) {
  return { 'a-verificar': 'A verificar', verificada: 'Verificada', descartada: 'Descartada' }[status] || status;
}

function renderCurriculum() {
  const modules = state.catalog.modules.map((module) => {
    const lessons = state.catalog.aulas.filter((lesson) => lesson.module === module.id);
    const completed = lessons.filter((lesson) => state.workspace.progress.includes(lesson.id)).length;
    return `<details class="ops-module" ${completed < lessons.length ? 'open' : ''}><summary><span>M${module.id}</span><div><strong>${escapeHtml(module.title)}</strong><small>${escapeHtml(module.blurb)}</small></div><em>${completed}/${lessons.length}</em></summary>
      ${lessons.map((lesson) => `<a href="#/aula/${lesson.id}" class="ops-curriculum-row"><b>${lesson.id}</b><span><strong>${escapeHtml(lesson.title)}</strong><small>${escapeHtml(lesson.duration)} · ${escapeHtml(lesson.objective)}</small></span><em>${state.workspace.progress.includes(lesson.id) ? 'Concluída' : 'Abrir'}</em></a>`).join('')}</details>`;
  }).join('');
  root.innerHTML = shell('sala', `<header class="ops-page-head"><div><p class="ops-eyebrow">31 aulas · 8 módulos</p><h1>Plano de operações</h1></div><strong>${percentage()}%</strong></header>${modules}`);
}

function renderLesson(id) {
  const lesson = state.catalog.aulas.find((item) => item.id === id) || state.catalog.aulas[0];
  const index = state.catalog.aulas.indexOf(lesson);
  const previous = state.catalog.aulas[index - 1];
  const next = state.catalog.aulas[index + 1];
  const saved = state.workspace.exercises[lesson.id]?.texto || '';
  const script = sanitizedLessonHtml(`${lesson.contentHtml || ''}${lesson.closingHtml || ''}`);
  const exercise = sanitizedLessonHtml(lesson.exerciseHtml || '<p>Registre o que você aplicou à pauta.</p>');
  const tools = (lesson.tools || []).map((id) => state.catalog.toolbox[id]).filter(Boolean);
  const content = `<header class="ops-lesson-head"><div><p class="ops-eyebrow">Módulo ${lesson.module} · Aula ${lesson.id} · ${escapeHtml(lesson.duration)}</p><h1>${escapeHtml(lesson.title)}</h1><p>${escapeHtml(lesson.objective)}</p></div><button id="focus-toggle" class="ops-btn ops-btn-secondary">Modo foco</button></header>
    <div class="ops-video-empty"><strong>Vídeo ainda não publicado</strong><p>O roteiro completo e pesquisável está disponível abaixo; nenhum player fictício é exibido.</p></div>
    <div class="ops-tabs" role="tablist"><button role="tab" aria-selected="true" data-tab="script">Roteiro</button><button role="tab" aria-selected="false" data-tab="notes">Notas privadas</button><button role="tab" aria-selected="false" data-tab="tools">Ferramentas</button></div>
    <article class="ops-script" data-panel="script"><label class="ops-search">Buscar no roteiro<input id="script-search" type="search" placeholder="termo, lei ou ferramenta"></label><div id="script-content">${script}</div></article>
    <section class="ops-notes" data-panel="notes" hidden><h2>Aplicação à sua pauta</h2>${exercise}<label class="ops-field"><span>Notas privadas</span><textarea id="lesson-notes" rows="12">${escapeHtml(saved)}</textarea><small>Salvas no Supabase com acesso restrito ao seu usuário por RLS. Não registre dados que identifiquem fontes.</small></label>${button('Salvar notas', 'save-notes')}</section>
    <section class="ops-tools" data-panel="tools" hidden><h2>Bancada desta aula</h2>${tools.length ? tools.map((tool) => `<a href="${escapeHtml(safeUrl(tool.url))}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(tool.kind)}</span><strong>${escapeHtml(tool.name)}</strong></a>`).join('') : '<div class="ops-empty"><p>Esta aula não exige ferramenta externa.</p></div>'}</section>
    <footer class="ops-lesson-footer">${previous ? `<a href="#/aula/${previous.id}">← Aula ${previous.id}</a>` : '<span></span>'}${button(state.workspace.progress.includes(lesson.id) ? 'Aula concluída' : 'Marcar como concluída', 'complete', state.workspace.progress.includes(lesson.id) ? 'secondary' : 'primary')}${next ? `<a href="#/aula/${next.id}">Aula ${next.id} →</a>` : '<a href="#/inicio">Voltar à operação</a>'}</footer>`;
  root.innerHTML = shell('sala', content);
  bindTabs();
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

function bindTabs() {
  root.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.onclick = () => {
      root.querySelectorAll('[data-tab]').forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
      root.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== tab.dataset.tab; });
    };
  });
}

function renderDossier() {
  const pauta = state.workspace.pauta;
  root.innerHTML = shell('inicio', `<header class="ops-page-head"><div><p class="ops-eyebrow">Arquivo de trabalho</p><h1>Dossiê da pauta</h1></div></header>
    <form id="dossier-form" class="ops-form-panel">
      ${field('pauta-title', 'Pergunta verificável', 'text', '', 'Não escreva uma acusação como título.')}
      <label class="ops-field"><span>Hipótese</span><textarea id="pauta-hypothesis" rows="5">${escapeHtml(pauta.dados?.hipotese || '')}</textarea></label>
      <label class="ops-field"><span>Caderno de apuração</span><textarea id="pauta-notes" rows="14">${escapeHtml(pauta.dados?.notas || '')}</textarea><small>Não registre informações que identifiquem fontes sensíveis.</small></label>
      ${button('Salvar dossiê', 'save-dossier', 'primary', 'submit')}
    </form>`);
  document.getElementById('pauta-title').value = pauta.titulo || '';
  document.getElementById('dossier-form').onsubmit = async (event) => {
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
      toast('Dossiê salvo na sua conta.', 'success');
    } catch {
      toast('Não foi possível salvar o dossiê.', 'error');
    }
  };
}

function renderEvidence() {
  const items = state.workspace.evidence;
  root.innerHTML = shell('evidencias', `<header class="ops-page-head"><div><p class="ops-eyebrow">Quadro de investigação</p><h1>Evidências</h1><p>Registros estruturados da sua própria pauta. Vínculo não é culpa.</p></div>${button('Adicionar evidência', 'new-evidence')}</header>
    <section id="evidence-form-wrap" hidden></section>
    <section class="ops-evidence-list">${items.length ? items.map((item) => {
      const related = items.find((candidate) => candidate.id === item.relacionada_a);
      return `<article><div><span>${escapeHtml(item.tipo)} · ${statusLabel(item.status)}</span><h2>${escapeHtml(item.titulo)}</h2><p>${escapeHtml(item.observacao)}</p>${related ? `<small>Relacionada a: ${escapeHtml(related.titulo)}</small>` : ''}${safeUrl(item.fonte_url) ? `<a href="${escapeHtml(safeUrl(item.fonte_url))}" target="_blank" rel="noopener noreferrer">Abrir fonte</a>` : ''}</div><button class="ops-btn ops-btn-danger" data-delete="${item.id}">Excluir</button></article>`;
    }).join('') : '<div class="ops-empty"><h2>Nenhuma evidência cadastrada</h2><p>Adicione apenas registros da sua investigação. A plataforma não cria dados de exemplo.</p></div>'}</section>`);
  document.getElementById('new-evidence').onclick = showEvidenceForm;
  root.querySelectorAll('[data-delete]').forEach((element) => {
    element.onclick = async () => {
      if (!confirm('Excluir esta evidência? Esta ação não pode ser desfeita.')) return;
      try {
        await auth.deleteEvidence(state.session, element.dataset.delete);
        state.workspace.evidence = state.workspace.evidence.filter((item) => item.id !== element.dataset.delete);
        renderEvidence();
      } catch {
        toast('Não foi possível excluir a evidência.', 'error');
      }
    };
  });
}

function showEvidenceForm() {
  const wrap = document.getElementById('evidence-form-wrap');
  wrap.hidden = false;
  wrap.innerHTML = `<form id="evidence-form" class="ops-form-panel"><h2>Nova evidência</h2>
    ${field('evidence-title', 'Título')}
    <label class="ops-field"><span>Tipo</span><select id="evidence-type"><option value="documento">Documento</option><option value="pessoa">Pessoa</option><option value="empresa">Empresa</option><option value="link">Link</option><option value="nota">Nota</option></select></label>
    ${field('evidence-url', 'URL da fonte (opcional)', 'url', 'url')}
    <label class="ops-field"><span>Observação</span><textarea id="evidence-note" rows="5"></textarea></label>
    <label class="ops-field"><span>Relacionar a outro registro (opcional)</span><select id="evidence-related"><option value="">Sem relação</option>${state.workspace.evidence.map((item) => `<option value="${item.id}">${escapeHtml(item.titulo)}</option>`).join('')}</select><small>A relação indica apenas vínculo de apuração, nunca culpa.</small></label>
    <label class="ops-field"><span>Status</span><select id="evidence-status"><option value="a-verificar">A verificar</option><option value="verificada">Verificada</option><option value="descartada">Descartada</option></select></label>
    <div class="ops-form-row">${button('Salvar evidência', 'save-evidence', 'primary', 'submit')}${button('Cancelar', 'cancel-evidence', 'quiet')}</div></form>`;
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
    if (!evidence.titulo) return toast('Dê um título à evidência.', 'error');
    try {
      state.workspace.evidence.unshift(await auth.addEvidence(state.session, evidence));
      renderEvidence();
    } catch {
      toast('Não foi possível salvar a evidência.', 'error');
    }
  };
}

function renderResources() {
  const resources = [
    ['Planilha de cruzamento', '13 abas, fórmulas e exemplo fictício identificado no próprio arquivo.', 'planilha', 'planilha-de-cruzamento.xlsx', 'XLSX'],
    ['Materiais bônus', 'Modelos LAI, checklist pré-publicação, guia da planilha e glossário.', 'bonus', 'materiais-bonus.pdf', 'PDF'],
    ['Documento completo do curso', 'Mapa, roteiros, referências, caveats e materiais em texto.', 'documento', 'documento-completo-curso.md', 'MD']
  ];
  root.innerHTML = shell('bonus', `<header class="ops-page-head"><div><p class="ops-eyebrow">Biblioteca operacional</p><h1>Recursos do curso</h1></div></header><section class="ops-resource-grid">${resources.map(([title, description, key, filename, type]) => `<button data-resource="${key}" data-filename="${filename}"><span>${type}</span><h2>${title}</h2><p>${description}</p><strong>Baixar arquivo →</strong></button>`).join('')}</section>
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
        toast('Não foi possível baixar o recurso. Tente novamente.', 'error');
      } finally {
        element.disabled = false;
      }
    };
  });
}

function renderAccount() {
  const profile = state.workspace.profile;
  root.innerHTML = shell('conta', `<header class="ops-page-head"><div><p class="ops-eyebrow">Identificação</p><h1>${escapeHtml(auth.displayName(state.session, profile))}</h1><p>${escapeHtml(state.session.user.email || '')}</p></div></header>
    <section class="ops-account"><dl><div><dt>Acesso</dt><dd>Autorizado</dd></div><div><dt>Vertente</dt><dd>${trackLabel(profile?.vertente)}</dd></div><div><dt>OpSec inicial</dt><dd>${profile?.opsec_score ?? 0}/100</dd></div><div><dt>Progresso</dt><dd>${percentage()}%</dd></div></dl>${button('Sair com segurança', 'logout', 'danger')}</section>`);
  document.getElementById('logout').onclick = async () => { await auth.signOut(); location.hash = '#/entrar'; };
}

async function renderOpenLesson() {
  const catalog = await fetch(OPEN_CATALOG_URL).then((response) => response.json());
  const content = catalog.aulas.map((lesson) => `<section class="ops-open-lesson"><p class="ops-eyebrow">Aula ${lesson.id} · ${escapeHtml(lesson.duration)}</p><h2>${escapeHtml(lesson.title)}</h2><div class="ops-script">${sanitizedLessonHtml(`${lesson.contentHtml}${lesson.closingHtml}`)}</div></section>`).join('');
  root.innerHTML = `${publicHeader()}<main class="ops-open"><header><p class="ops-eyebrow">Aula aberta</p><h1>Pedido LAI e recursos</h1><p>Conteúdo real das aulas 3.2 e 3.3. Exercícios e dossiê exigem acesso autorizado.</p></header>${content}</main>`;
}

function renderPurchase() {
  root.innerHTML = `${publicHeader()}<main class="ops-open"><header><p class="ops-eyebrow">Inscrição</p><h1>Jornalismo Investigativo na Prática</h1><p>31 aulas, materiais e exercícios aplicados a uma pauta sua. Conteúdo educativo; não substitui advogado.</p><a class="ops-btn ops-btn-primary" href="mailto:iuri@piragibe.com.br?subject=Compra%20curso%20JIP">Solicitar inscrição</a><a class="ops-btn ops-btn-secondary" href="#/entrar">Já comprei</a></header></main>`;
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
      } catch (error) {
        state.loadingError = String(error.message || error);
      }
    }
    if (state.paid && state.loadingError && !PUBLIC_ROUTES.has(current.name)) {
      renderCatalogBlocker();
      return;
    }
    if (state.paid && state.workspace && !state.workspace.profile?.onboarding_completed && current.name !== 'onboarding') {
      location.hash = '#/onboarding';
      return;
    }
    if (state.paid && current.name === 'entrar') {
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
    else if (current.name === 'onboarding') renderOnboarding();
    else if (current.name === 'inicio') renderDashboard();
    else if (current.name === 'sala') renderCurriculum();
    else if (current.name === 'aula') renderLesson(current.id);
    else if (current.name === 'pauta') renderDossier();
    else if (current.name === 'evidencias') renderEvidence();
    else if (current.name === 'bonus') renderResources();
    else if (current.name === 'conta') renderAccount();
    else location.hash = state.paid ? '#/inicio' : '#/entrar';
  } catch {
    root.innerHTML = `${publicHeader()}<main class="ops-open"><section class="ops-empty"><h1>Não foi possível carregar a sala</h1><p>Verifique sua conexão e tente novamente.</p><button class="ops-btn ops-btn-primary" onclick="location.reload()">Tentar novamente</button></section></main>`;
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
