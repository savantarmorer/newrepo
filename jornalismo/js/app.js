import * as api from './cursoAuth.js';

const CATALOG_URL = new URL('../content/aulas.json', import.meta.url).href;
let catalog = null;
let session = null;
let state = { pauta: { titulo: '', dados: {} }, progress: [], exercises: {}, cloud: false };
let teacher = false;

const root = () => document.getElementById('jip-root');

function parseRoute() {
  const hash = (location.hash || '#/sala').replace(/^#/, '');
  const parts = hash.split('/').filter(Boolean);
  const name = parts[0] || 'sala';
  return { name, id: parts[1] || '' };
}

function dock(current) {
  const items = [
    ['sala', 'Sala', '#/sala'],
    ['pauta', 'Pauta', '#/pauta'],
    ['bonus', 'Bônus', '#/bonus'],
    ['entrar', 'Conta', '#/entrar']
  ];
  return `<nav class="jip-dock" aria-label="Navegação do curso">${items.map(([k, l, h]) =>
    `<a href="${h}" ${current === k ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
}

function topbar(current) {
  return `<a class="jip-skip" href="#conteudo">Pular para o conteúdo</a>
  <header class="jip-top">
    <a class="jip-brand" href="/jornalismo/">JIP<span>.</span></a>
    <nav aria-label="Curso">
      <a href="#/sala" ${current === 'sala' ? 'aria-current="page"' : ''}>Sala</a>
      <a href="#/aberto" ${current === 'aberto' ? 'aria-current="page"' : ''}>Aula aberta</a>
      <a href="#/pauta" ${current === 'pauta' ? 'aria-current="page"' : ''}>Minha pauta</a>
      <a href="#/bonus" ${current === 'bonus' ? 'aria-current="page"' : ''}>Bônus</a>
      ${teacher ? '<a href="#/mentor">Mentor</a>' : ''}
      <a href="#/entrar">${session ? 'Sair / conta' : 'Entrar'}</a>
    </nav>
  </header>`;
}

function pct() {
  const n = catalog.aulas.length;
  return Math.round((state.progress.length / n) * 100);
}

function toolsHtml(ids) {
  if (!ids?.length) return '<p class="jip-muted">Nenhuma bancada nesta aula — só o caderno da pauta.</p>';
  return ids.map((id) => {
    const t = catalog.toolbox[id];
    if (!t) return '';
    const target = t.sameOrigin ? '' : 'target="_blank" rel="noopener noreferrer"';
    return `<a class="jip-tool" href="${t.url}" ${target}><span><span class="jip-kind">${t.kind}</span><br>${t.name}</span><span>Abrir</span></a>`;
  }).join('');
}

function renderSala() {
  const mods = catalog.modules.map((mod) => {
    const aulas = catalog.aulas.filter((a) => a.module === mod.id);
    const lis = aulas.map((a) => {
      const done = state.progress.includes(a.id);
      const badge = done ? 'done' : a.open ? 'open' : '';
      return `<a class="jip-lesson" href="#/aula/${a.id}">
        <span class="jip-badge ${badge}">${a.id}</span>
        <span><strong>${a.title}</strong><br><span class="jip-muted">${a.duration} · ${a.objective}</span></span>
      </a>`;
    }).join('');
    return `<section class="jip-mod jip-card"><h2>Módulo ${mod.id} — ${mod.title}</h2><p class="jip-muted">${mod.blurb}</p>${lis}</section>`;
  }).join('');
  root().innerHTML = `${topbar('sala')}
  <main id="conteudo" class="jip-wrap">
    <p class="jip-kicker">31 aulas · ${catalog.minutes} min</p>
    <h1>Sala de aula</h1>
    <p class="jip-muted">Uma pauta sua, da aula 1.1 ao módulo 8. ${catalog.slogan}</p>
    <div class="jip-card" style="margin:16px 0">
      <p><strong>${pct()}%</strong> concluído · ${state.progress.length}/${catalog.aulas.length} aulas</p>
      <div class="jip-progress" aria-hidden="true"><span style="width:${pct()}%"></span></div>
      ${state.cloud ? '<p class="jip-muted">Sincronizado na nuvem.</p>' : '<p class="jip-muted">Rascunho neste aparelho. Entre para não perder a pauta.</p>'}
    </div>
    ${mods}
  </main>${dock('sala')}`;
}

function renderAberto() {
  const a32 = catalog.aulas.find((a) => a.id === '3.2');
  const a33 = catalog.aulas.find((a) => a.id === '3.3');
  root().innerHTML = `${topbar('aberto')}
  <main id="conteudo" class="jip-wrap jip-split">
    <article class="jip-prose jip-card">
      <p class="jip-kicker">Aula aberta · ~20 min · sem exercícios</p>
      <h1>Pedido LAI que não dá para enrolar + prazos e recursos</h1>
      <p class="jip-muted">Aulas 3.2 e 3.3 juntas, como no roteiro de lançamento.</p>
      <h2>${a32.id} — ${a32.title}</h2>
      ${a32.contentHtml}
      ${a32.closingHtml}
      <h2>${a33.id} — ${a33.title}</h2>
      ${a33.contentHtml}
      ${a33.closingHtml}
    </article>
    <aside class="jip-card">
      <h2>Bancada</h2>
      ${toolsHtml(['falabr', 'informabr', 'cmri'])}
      <p class="jip-muted" style="margin-top:12px">Os exercícios destas aulas ficam na sala, depois do login — aqui é só o método.</p>
      <a class="jip-btn jip-btn-primary" href="#/sala">Ir para a sala</a>
    </aside>
  </main>${dock('sala')}`;
}

function renderAula(id) {
  const aula = catalog.aulas.find((a) => a.id === id) || catalog.aulas[0];
  const idx = catalog.aulas.findIndex((a) => a.id === aula.id);
  const prev = catalog.aulas[idx - 1];
  const next = catalog.aulas[idx + 1];
  const saved = state.exercises[aula.id]?.texto || '';
  const needsPauta = aula.id !== '1.1' && !(state.pauta.titulo || '').trim();
  const tab = (name) => `data-tab="${name}"`;

  root().innerHTML = `${topbar('sala')}
  <main id="conteudo" class="jip-wrap">
    <p class="jip-kicker">Módulo ${aula.module} · ${aula.duration}</p>
    <h1>${aula.id} — ${aula.title}</h1>
    <p class="jip-muted"><strong>Objetivo:</strong> ${aula.objective}. <strong>Na tela:</strong> ${aula.screen}.</p>
    <div class="jip-tabs" role="tablist">
      <button type="button" role="tab" aria-selected="true" ${tab('aula')}>Aula</button>
      <button type="button" role="tab" aria-selected="false" ${tab('ex')}>Exercício</button>
      <button type="button" role="tab" aria-selected="false" ${tab('banco')}>Bancada</button>
    </div>
    <div class="jip-split">
      <div>
        <section class="jip-card jip-prose" data-panel="aula">${aula.contentHtml}${aula.closingHtml}</section>
        <section class="jip-card" data-panel="ex" hidden>
          <h2>Exercício — a mesma pauta</h2>
          ${needsPauta ? '<p class="jip-muted">Escolha a pauta na aula 1.1 antes de enviar este exercício.</p><a class="jip-btn jip-btn-gold" href="#/aula/1.1">Ir para 1.1</a>' : ''}
          <div class="jip-prose">${aula.exerciseHtml || '<p>Esta aula não tem exercício separado.</p>'}</div>
          ${aula.id === '1.1' ? `<label for="titulo">Pauta escolhida</label><input id="titulo" value="${escapeAttr(state.pauta.titulo || '')}" placeholder="A suspeita verificável que você vai apurar">` : ''}
          <label for="resposta">Seu caderno</label>
          <textarea id="resposta" rows="10" ${needsPauta ? 'disabled' : ''}>${escapeAttr(saved)}</textarea>
          <div class="jip-cta-row">
            <button class="jip-btn jip-btn-primary" id="salvar" ${needsPauta ? 'disabled' : ''}>Salvar exercício</button>
            <button class="jip-btn jip-btn-ghost" id="concluir">Marcar aula como vista</button>
          </div>
        </section>
        <section class="jip-card" data-panel="banco" hidden>
          <h2>Pratique nestes sites</h2>
          <p class="jip-muted">Abra em outra aba no computador; no celular, volte aqui com o botão do sistema.</p>
          ${toolsHtml(aula.tools)}
        </section>
      </div>
      <aside class="jip-card" style="position:sticky;top:72px">
        <h2>Minha pauta</h2>
        <p>${state.pauta.titulo ? `<strong>${escapeHtml(state.pauta.titulo)}</strong>` : '<span class="jip-muted">Ainda não escolhida.</span>'}</p>
        <p class="jip-muted">${catalog.slogan}</p>
        <a href="#/pauta">Abrir dossiê completo</a>
        <div class="jip-cta-row">
          ${prev ? `<a class="jip-btn jip-btn-ghost" href="#/aula/${prev.id}">← ${prev.id}</a>` : ''}
          ${next ? `<a class="jip-btn jip-btn-ghost" href="#/aula/${next.id}">${next.id} →</a>` : ''}
        </div>
      </aside>
    </div>
  </main>${dock('sala')}`;

  root().querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.tab;
      root().querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      root().querySelectorAll('[data-panel]').forEach((p) => {
        p.hidden = p.dataset.panel !== name;
      });
    });
  });
  document.getElementById('salvar')?.addEventListener('click', async () => {
    const texto = document.getElementById('resposta').value.trim();
    if (aula.id === '1.1') {
      const titulo = document.getElementById('titulo').value.trim();
      state.pauta.titulo = titulo;
      state.pauta.dados = { ...state.pauta.dados, aula11: texto };
      await api.savePauta(session, state.pauta);
    }
    const payload = { texto };
    await api.saveExercise(session, aula.id, payload);
    state.exercises[aula.id] = payload;
    if (aula.id === '8.1') api.toast('Poste também no Discord do Ágora para a leitura da turma.');
    else api.toast(session ? 'Exercício salvo na nuvem.' : 'Rascunho salvo neste aparelho.');
  });
  document.getElementById('concluir')?.addEventListener('click', async () => {
    await api.markDone(session, aula.id);
    if (!state.progress.includes(aula.id)) state.progress.push(aula.id);
    api.toast('Aula marcada.');
    renderAula(aula.id);
  });
}

function renderPauta() {
  const dados = JSON.stringify(state.pauta.dados || {}, null, 2);
  root().innerHTML = `${topbar('pauta')}
  <main id="conteudo" class="jip-wrap jip-split">
    <section class="jip-card">
      <h1>Minha pauta</h1>
      <p class="jip-muted">O funil inteiro mora aqui. Não espalhe fontes identificáveis.</p>
      <label>Título da investigação</label>
      <input id="titulo" value="${escapeAttr(state.pauta.titulo || '')}">
      <label>Notas cumulativas (JSON)</label>
      <textarea id="dados" rows="16">${escapeAttr(dados)}</textarea>
      <div class="jip-cta-row">
        <button class="jip-btn jip-btn-primary" id="salvar">Salvar dossiê</button>
        <button class="jip-btn jip-btn-ghost" id="exportar">Exportar Markdown</button>
      </div>
    </section>
    <aside class="jip-card">
      <h2>Exercícios enviados</h2>
      ${Object.keys(state.exercises).length
    ? Object.keys(state.exercises).sort().map((id) => `<p><a href="#/aula/${id}">${id}</a></p>`).join('')
    : '<p class="jip-muted">Nenhum ainda.</p>'}
    </aside>
  </main>${dock('pauta')}`;
  document.getElementById('salvar').onclick = async () => {
    let parsed = {};
    try { parsed = JSON.parse(document.getElementById('dados').value); }
    catch { api.toast('JSON inválido nas notas.'); return; }
    state.pauta = { titulo: document.getElementById('titulo').value.trim(), dados: parsed };
    await api.savePauta(session, state.pauta);
    api.toast('Dossiê salvo.');
  };
  document.getElementById('exportar').onclick = () => {
    const md = api.exportDossie(state.pauta, state.exercises, catalog.aulas);
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dossie-pauta.md';
    a.click();
  };
}

function renderBonus() {
  const extras = [
    { name: 'Modelos de pedido LAI A–E', note: 'Cole no Fala.BR. Arquivo do pacote do curso, quando você enviar.' },
    { name: 'Checklist pré-publicação', note: 'Obrigatório antes do módulo 8. Marque no caderno da pauta.' },
    { name: 'Planilha de cruzamento', note: 'Homônimos, datas e CNPJ. Use com o módulo 4.' },
    { name: 'Glossário', note: 'LAI, CMRI, RP-9, off, background.' }
  ];
  const glossary = Object.entries(catalog.toolbox).map(([id, t]) =>
    `<a class="jip-tool" href="${t.url}" ${t.sameOrigin ? '' : 'target="_blank" rel="noopener noreferrer"'}>
      <span><span class="jip-kind">${t.kind}</span><br>${t.name}</span><span>Abrir</span></a>`).join('');
  root().innerHTML = `${topbar('bonus')}
  <main id="conteudo" class="jip-wrap jip-split">
    <section class="jip-card">
      <h1>Bônus e bancada permanente</h1>
      ${extras.map((e) => `<div class="jip-tool"><span><strong>${e.name}</strong><br><span class="jip-muted">${e.note}</span></span></div>`).join('')}
      <h2>Antes de gravar (autor)</h2>
      <p class="jip-muted">ADPF 601, Fala.BR, PL do art. 31, Querido Diário, Minha Receita/BrasilAPI, inelegibilidade 2025, RI eletrônico, CruzaGrafos, Temas 987/533, nota eleitoral, telas do módulo 4.</p>
    </section>
    <aside class="jip-card"><h2>Todas as plataformas</h2>${glossary}</aside>
  </main>${dock('bonus')}`;
}

function renderEntrar() {
  root().innerHTML = `${topbar('entrar')}
  <main id="conteudo" class="jip-wrap" style="max-width:480px">
    <h1>${session ? 'Sua conta' : 'Entrar na sala'}</h1>
    ${session ? `<p>Logado como ${escapeHtml(session.user.email || session.user.id)}</p>
      <button class="jip-btn jip-btn-ghost" id="sair">Sair</button>` : `
      <p class="jip-muted">Link mágico no e-mail. Google/Discord se já estiverem ligados neste projeto Supabase.</p>
      <label>E-mail</label>
      <input id="email" type="email" autocomplete="email">
      <div class="jip-cta-row">
        <button class="jip-btn jip-btn-primary" id="magic">Enviar link</button>
        <button class="jip-btn jip-btn-ghost" id="google">Google</button>
        <button class="jip-btn jip-btn-ghost" id="discord">Discord</button>
      </div>`}
  </main>${dock('entrar')}`;
  document.getElementById('sair')?.addEventListener('click', () => api.signOut());
  document.getElementById('magic')?.addEventListener('click', async () => {
    try {
      await api.sendMagicLink(document.getElementById('email').value.trim());
      api.toast('Confira o e-mail.');
    } catch (err) { api.toast(err.message); }
  });
  document.getElementById('google')?.addEventListener('click', () => api.signInOAuth('google').catch((e) => api.toast(e.message)));
  document.getElementById('discord')?.addEventListener('click', () => api.signInOAuth('discord').catch((e) => api.toast(e.message)));
}

async function renderMentor() {
  if (!teacher) {
    location.hash = '#/sala';
    return;
  }
  const turma = await api.loadTurma();
  root().innerHTML = `${topbar('mentor')}
  <main id="conteudo" class="jip-wrap">
    <h1>Mentor</h1>
    <p class="jip-muted">Pautas da turma (requer SQL do curso no Supabase).</p>
    ${(turma.length ? turma : [{ titulo: 'Nenhuma pauta na nuvem ainda', user_id: '', updated_at: '' }]).map((row) =>
    `<article class="jip-card"><p><strong>${escapeHtml(row.titulo || '(sem título)')}</strong></p>
      <p class="jip-muted">${row.user_id} · ${row.updated_at || ''}</p></article>`).join('')}
  </main>${dock('sala')}`;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

async function boot() {
  catalog = await fetch(CATALOG_URL).then((r) => r.json());
  session = await api.getSession();
  state = await api.loadState(session);
  teacher = await api.isTeacher(session);
  const route = parseRoute();
  if (route.name === 'aberto') renderAberto();
  else if (route.name === 'aula') renderAula(route.id);
  else if (route.name === 'pauta') renderPauta();
  else if (route.name === 'bonus') renderBonus();
  else if (route.name === 'entrar') renderEntrar();
  else if (route.name === 'mentor') await renderMentor();
  else renderSala();
}

window.addEventListener('hashchange', () => boot());
boot();
