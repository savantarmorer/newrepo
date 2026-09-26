import * as api from './cursoAuth.js';

const CATALOG_URL = new URL('../content/aulas.json', import.meta.url).href;
const ABERTO_URL = new URL('../content/aberto.json', import.meta.url).href;
const ONBOARD_KEY = 'jip-onboard-v1';
const PUBLIC = new Set(['aberto', 'entrar', 'comprar']);
let catalog = null;
let session = null;
let paid = false;
let state = { pauta: { titulo: '', dados: {} }, progress: [], exercises: {}, cloud: false };
let teacher = false;
let onboardStep = 0;

const root = () => document.getElementById('jip-root');

function parseRoute() {
  const hash = (location.hash || '').replace(/^#/, '');
  const parts = hash.split('/').filter(Boolean);
  return { name: parts[0] || '', id: parts[1] || '' };
}

function nextLesson() {
  return catalog.aulas.find((a) => !state.progress.includes(a.id)) || catalog.aulas[0];
}

function pct() {
  return Math.round((state.progress.length / catalog.aulas.length) * 100);
}

function needsOnboarding() {
  return Boolean(session) && localStorage.getItem(ONBOARD_KEY) !== '1' && state.progress.length === 0;
}

function finishOnboarding() {
  localStorage.setItem(ONBOARD_KEY, '1');
  location.hash = '#/aula/1.1';
}

function toolsHtml(ids) {
  if (!ids?.length) return '<p class="jip-muted">Nesta aula o trabalho é no caderno da pauta.</p>';
  return ids.map((id) => {
    const t = catalog.toolbox[id];
    if (!t) return '';
    const target = t.sameOrigin ? '' : 'target="_blank" rel="noopener noreferrer"';
    return `<a class="jip-tool" href="${t.url}" ${target}><span><span class="jip-kind">${t.kind}</span><br>${t.name}</span><span>Abrir →</span></a>`;
  }).join('');
}

function dock(current) {
  if (!session || !paid) return '';
  const items = [
    ['inicio', 'Início', '#/inicio'],
    ['sala', 'Aulas', '#/sala'],
    ['pauta', 'Pauta', '#/pauta'],
    ['conta', 'Você', '#/conta']
  ];
  return `<nav class="jip-dock" aria-label="Navegação">${items.map(([k, l, h]) =>
    `<a href="${h}" ${current === k ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
}

function topbar(current) {
  const nav = session && paid
    ? `<a href="#/inicio" ${current === 'inicio' ? 'aria-current="page"' : ''}>Início</a>
       <a href="#/sala" ${current === 'sala' ? 'aria-current="page"' : ''}>Aulas</a>
       <a href="#/pauta" ${current === 'pauta' ? 'aria-current="page"' : ''}>Pauta</a>
       ${teacher ? '<a href="#/mentor">Turma</a>' : ''}
       <a class="jip-avatar" href="#/conta" title="Minha conta">${api.initials(session)}</a>`
    : `<a href="/jornalismo/">O curso</a>
       <a href="#/aberto" ${current === 'aberto' ? 'aria-current="page"' : ''}>Aula aberta</a>
       <a href="#/comprar" ${current === 'comprar' ? 'aria-current="page"' : ''}>Comprar</a>
       <a href="#/entrar" ${current === 'entrar' ? 'aria-current="page"' : ''}>Entrar</a>`;
  return `<a class="jip-skip" href="#conteudo">Pular para o conteúdo</a>
  <header class="jip-top">
    <a class="jip-brand" href="${session ? '#/inicio' : '/jornalismo/'}">CURSO<span>.</span>JIP</a>
    <nav aria-label="Curso">${nav}</nav>
  </header>`;
}

function renderLock() {
  sessionStorage.setItem('jip-next', location.hash || '#/inicio');
  root().innerHTML = `${topbar('entrar')}
  <main id="conteudo" class="jip-lock">
    <div class="jip-card" style="max-width:420px">
      <p class="jip-kicker">Sala fechada</p>
      <h1 class="jip-display" style="font-size:1.8rem">Só quem comprou entra na sala.</h1>
      <p class="jip-muted">Os roteiros e os exercícios são para alunos. A aula aberta de LAI continua pública.</p>
      <div class="jip-cta-row" style="justify-content:center">
        <a class="jip-btn jip-btn-primary" href="#/comprar">Comprar o curso</a>
        <a class="jip-btn jip-btn-ghost" href="#/entrar">Já comprei — entrar</a>
        <a class="jip-btn jip-btn-ghost" href="#/aberto">Aula aberta</a>
      </div>
    </div>
  </main>`;
}

function renderOnboarding() {
  const steps = [
    {
      title: 'Uma pauta. Oito módulos.',
      body: 'Você não assiste 31 aulas soltas. Escolhe uma suspeita na 1.1 e leva ela até o dossiê do módulo 8. O que não tiver documento, cai fora.'
    },
    {
      title: 'Sem documento, é lenda.',
      body: 'Cada exercício avança a mesma investigação. Print, áudio de primo e “exposed” não valem. Vale protocolo, diário, contrato, base com data de coleta.'
    },
    {
      title: 'A bancada é o Brasil real.',
      body: 'Fala.BR, Querido Diário, PNCP, TSE, DataJud. Você pratica nos sites oficiais, no computador ou no celular, e volta ao caderno.'
    },
    {
      title: 'Pronto para a primeira aula.',
      body: 'Na 1.1 você lista três bombas e escolhe uma. Essa frase vira o título da sua pauta. Dá para mudar depois — o funil é para isso.'
    }
  ];
  const s = steps[onboardStep];
  root().innerHTML = `${topbar('inicio')}
  <main id="conteudo" class="jip-wrap" style="max-width:560px">
    <p class="jip-kicker">Boas-vindas · ${onboardStep + 1} de ${steps.length}</p>
    <h1 class="jip-display">${s.title}</h1>
    <p class="jip-lead">${s.body}</p>
    <div class="jip-dots">${steps.map((_, i) => `<span class="${i === onboardStep ? 'on' : ''}"></span>`).join('')}</div>
    <div class="jip-cta-row">
      ${onboardStep > 0 ? '<button type="button" class="jip-btn jip-btn-ghost" id="back">Voltar</button>' : ''}
      <button type="button" class="jip-btn jip-btn-primary" id="next">${onboardStep === steps.length - 1 ? 'Começar a aula 1.1' : 'Continuar'}</button>
    </div>
  </main>${dock('inicio')}`;
  document.getElementById('back')?.addEventListener('click', () => { onboardStep -= 1; renderOnboarding(); });
  document.getElementById('next').addEventListener('click', () => {
    if (onboardStep === steps.length - 1) finishOnboarding();
    else { onboardStep += 1; renderOnboarding(); }
  });
}

function renderInicio() {
  const next = nextLesson();
  const name = api.displayName(session);
  const done = state.progress.length;
  root().innerHTML = `${topbar('inicio')}
  <main id="conteudo" class="jip-wrap">
    <p class="jip-kicker">Sua mesa de apuração</p>
    <h1 class="jip-display">Olá, ${escapeHtml(name.split(' ')[0])}.</h1>
    <a class="jip-continue" href="#/aula/${next.id}">
      <p class="jip-kicker">Continuar de onde parou</p>
      <h2 style="margin:8px 0 6px">Aula ${next.id} — ${escapeHtml(next.title)}</h2>
      <p class="jip-muted">${next.duration} · ${escapeHtml(next.objective)}</p>
      <p style="margin:16px 0 0;font-weight:800;color:#c7d2fe">Abrir aula →</p>
    </a>
    <div class="jip-grid jip-grid-2" style="margin-top:18px">
      <section class="jip-card">
        <p class="jip-muted">Progresso</p>
        <p class="jip-stat">${pct()}%</p>
        <div class="jip-progress" aria-hidden="true"><span style="width:${pct()}%"></span></div>
        <p class="jip-muted" style="margin-top:10px">${done} de ${catalog.aulas.length} aulas · ${state.cloud ? 'salvo na conta' : 'ainda só neste aparelho'}</p>
      </section>
      <section class="jip-card">
        <p class="jip-muted">Minha pauta</p>
        <h2>${state.pauta.titulo ? escapeHtml(state.pauta.titulo) : 'Ainda não escolhida'}</h2>
        <p class="jip-muted">${state.pauta.titulo ? 'Ela te acompanha até o módulo 8.' : 'Você escolhe na aula 1.1, com documento verificável.'}</p>
        <a class="jip-btn jip-btn-ghost" href="${state.pauta.titulo ? '#/pauta' : '#/aula/1.1'}" style="margin-top:12px">${state.pauta.titulo ? 'Abrir dossiê' : 'Escolher pauta'}</a>
      </section>
    </div>
    <div class="jip-cta-row">
      <a class="jip-btn jip-btn-ghost" href="#/sala">Ver as 8 módulos</a>
      <a class="jip-btn jip-btn-ghost" href="#/bonus">Bônus e sites</a>
      <a class="jip-btn jip-btn-ghost" href="#/conta">Minha conta</a>
    </div>
  </main>${dock('inicio')}`;
}

function renderSala() {
  const nxt = nextLesson().id;
  const mods = catalog.modules.map((mod) => {
    const aulas = catalog.aulas.filter((a) => a.module === mod.id);
    const lis = aulas.map((a) => {
      const done = state.progress.includes(a.id);
      const badge = done ? 'done' : a.id === nxt ? 'next' : '';
      return `<a class="jip-lesson" href="#/aula/${a.id}">
        <span class="jip-badge ${badge}">${a.id}</span>
        <span><strong>${a.title}</strong><br><span class="jip-muted">${a.duration} · ${a.objective}</span></span>
      </a>`;
    }).join('');
    const open = aulas.some((a) => a.id === nxt);
    return `<details class="jip-mod jip-card" ${open ? 'open' : ''}><summary>Módulo ${mod.id} — ${mod.title}</summary><p class="jip-muted">${mod.blurb}</p>${lis}</details>`;
  }).join('');
  root().innerHTML = `${topbar('sala')}
  <main id="conteudo" class="jip-wrap">
    <p class="jip-kicker">Grade · 31 aulas</p>
    <h1 class="jip-display" style="font-size:2rem">As aulas</h1>
    <p class="jip-muted">Abra um módulo. O próximo passo está marcado.</p>
    <div style="margin-top:18px">${mods}</div>
  </main>${dock('sala')}`;
}

function renderAberto() {
  const a32 = catalog.aulas.find((a) => a.id === '3.2');
  const a33 = catalog.aulas.find((a) => a.id === '3.3');
  root().innerHTML = `${topbar('aberto')}
  <main id="conteudo" class="jip-wrap jip-split">
    <article class="jip-prose jip-card">
      <p class="jip-kicker">Amostra grátis · ~20 min · sem exercício</p>
      <h1>Como fazer um pedido LAI que o órgão não enrola</h1>
      <p class="jip-muted">Aulas 3.2 e 3.3 juntas. O caderno e o resto do curso pedem conta.</p>
      <h2>${a32.id} — ${a32.title}</h2>
      ${a32.contentHtml}${a32.closingHtml}
      <h2>${a33.id} — ${a33.title}</h2>
      ${a33.contentHtml}${a33.closingHtml}
    </article>
    <aside class="jip-card">
      <p class="jip-quote">Sem documento, é lenda.</p>
      <h2 style="margin-top:18px">Bancada desta aula</h2>
      ${toolsHtml(['falabr', 'informabr', 'cmri'])}
      <div class="jip-cta-row">
      <a class="jip-btn jip-btn-primary" href="#/comprar">Quero comprar o curso</a>
      </div>
    </aside>
  </main>`;
}

function renderAula(id) {
  const aula = catalog.aulas.find((a) => a.id === id) || catalog.aulas[0];
  const idx = catalog.aulas.findIndex((a) => a.id === aula.id);
  const prev = catalog.aulas[idx - 1];
  const next = catalog.aulas[idx + 1];
  const saved = state.exercises[aula.id]?.texto || '';
  const needsPauta = aula.id !== '1.1' && !(state.pauta.titulo || '').trim();

  root().innerHTML = `${topbar('sala')}
  <main id="conteudo" class="jip-wrap">
    <p class="jip-kicker">Módulo ${aula.module} · ${aula.duration} · roteiro para o vídeo</p>
    <h1 class="jip-display" style="font-size:clamp(1.6rem,3vw,2.3rem)">${aula.id} — ${aula.title}</h1>
    <p class="jip-muted">${aula.objective}</p>
    <div class="jip-card" style="margin:12px 0">
      <p class="jip-kicker">Vídeo</p>
      <p><strong>Em gravação.</strong> Enquanto isso, use o roteiro abaixo no mesmo ritmo da aula (8–15 min).</p>
      <p class="jip-muted">Conteúdo educativo; não substitui advogado no caso concreto. Regras válidas em setembro de 2026.</p>
    </div>
    <div class="jip-tabs" role="tablist">
      <button type="button" role="tab" aria-selected="true" data-tab="aula">Roteiro</button>
      <button type="button" role="tab" aria-selected="false" data-tab="ex">Fazer o exercício</button>
      <button type="button" role="tab" aria-selected="false" data-tab="banco">Praticar nos sites</button>
    </div>
    <div class="jip-split">
      <div>
        <section class="jip-card jip-prose" data-panel="aula">${aula.contentHtml}${aula.closingHtml}</section>
        <section class="jip-card" data-panel="ex" hidden>
          <h2>Exercício desta aula</h2>
          ${needsPauta ? '<p class="jip-muted">Antes, escolhe a pauta na 1.1.</p><a class="jip-btn jip-btn-gold" href="#/aula/1.1">Ir para 1.1</a>' : ''}
          <div class="jip-prose">${aula.exerciseHtml || '<p>Marque a aula como vista quando terminar a leitura.</p>'}</div>
          ${aula.id === '1.1' ? `<label for="titulo">A pauta que você escolheu</label><input id="titulo" value="${escapeAttr(state.pauta.titulo || '')}" placeholder="Uma frase verificável, não uma acusação">` : ''}
          <label for="resposta">Seu caderno</label>
          <textarea id="resposta" rows="9" ${needsPauta ? 'disabled' : ''}>${escapeAttr(saved)}</textarea>
          <div class="jip-cta-row">
            <button class="jip-btn jip-btn-primary" id="salvar" ${needsPauta ? 'disabled' : ''}>Salvar na minha pauta</button>
            <button class="jip-btn jip-btn-ghost" id="concluir">Concluir aula</button>
          </div>
        </section>
        <section class="jip-card" data-panel="banco" hidden>
          <h2>Abra e pratique</h2>
          <p class="jip-muted">No celular, use o botão voltar do sistema para retornar.</p>
          ${toolsHtml(aula.tools)}
        </section>
      </div>
      <aside class="jip-card" style="position:sticky;top:76px">
        <p class="jip-muted">Sua pauta</p>
        <h2>${state.pauta.titulo ? escapeHtml(state.pauta.titulo) : 'Ainda em branco'}</h2>
        <div class="jip-cta-row">
          ${prev ? `<a class="jip-btn jip-btn-ghost" href="#/aula/${prev.id}">← ${prev.id}</a>` : ''}
          ${next ? `<a class="jip-btn jip-btn-ghost" href="#/aula/${next.id}">${next.id} →</a>` : '<a class="jip-btn jip-btn-primary" href="#/inicio">Voltar ao início</a>'}
        </div>
      </aside>
    </div>
  </main>${dock('sala')}`;

  root().querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      root().querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      root().querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== btn.dataset.tab; });
    });
  });
  document.getElementById('salvar')?.addEventListener('click', async () => {
    const texto = document.getElementById('resposta').value.trim();
    if (aula.id === '1.1') {
      state.pauta.titulo = document.getElementById('titulo').value.trim();
      state.pauta.dados = { ...state.pauta.dados, aula11: texto };
      await api.savePauta(session, state.pauta);
    }
    const payload = { texto };
    await api.saveExercise(session, aula.id, payload);
    state.exercises[aula.id] = payload;
    api.toast(aula.id === '8.1' ? 'Salvo. Poste também no Discord do Ágora.' : 'Salvo na sua conta.');
  });
  document.getElementById('concluir')?.addEventListener('click', async () => {
    await api.markDone(session, aula.id);
    if (!state.progress.includes(aula.id)) state.progress.push(aula.id);
    api.toast('Aula concluída.');
    location.hash = next ? `#/aula/${next.id}` : '#/inicio';
  });
}

function renderPauta() {
  const d = state.pauta.dados || {};
  root().innerHTML = `${topbar('pauta')}
  <main id="conteudo" class="jip-wrap jip-split">
    <section class="jip-card">
      <p class="jip-kicker">Dossiê</p>
      <h1 class="jip-display" style="font-size:2rem">Minha pauta</h1>
      <p class="jip-muted">Não escreva nada que identifique fonte: cargo, setor, canal, data de contato.</p>
      <label>Título da investigação</label>
      <input id="titulo" value="${escapeAttr(state.pauta.titulo || '')}" placeholder="A pergunta verificável">
      <label>Hipótese (aula 1.3)</label>
      <textarea id="hipotese" rows="3" placeholder="Se X for verdade, então o documento Y existe.">${escapeAttr(d.hipotese || '')}</textarea>
      <label>Caderno livre</label>
      <textarea id="notas" rows="10">${escapeAttr(d.notas || d.aula11 || '')}</textarea>
      <div class="jip-cta-row">
        <button class="jip-btn jip-btn-primary" id="salvar">Salvar dossiê</button>
        <button class="jip-btn jip-btn-ghost" id="exportar">Baixar Markdown</button>
      </div>
    </section>
    <aside class="jip-card">
      <h2>Exercícios</h2>
      ${Object.keys(state.exercises).length
    ? Object.keys(state.exercises).sort().map((id) => `<p><a href="#/aula/${id}">Aula ${id}</a></p>`).join('')
    : '<p class="jip-muted">Nenhum enviado ainda.</p>'}
    </aside>
  </main>${dock('pauta')}`;
  document.getElementById('salvar').onclick = async () => {
    state.pauta = {
      titulo: document.getElementById('titulo').value.trim(),
      dados: {
        ...state.pauta.dados,
        hipotese: document.getElementById('hipotese').value,
        notas: document.getElementById('notas').value
      }
    };
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
  root().innerHTML = `${topbar('bonus')}
  <main id="conteudo" class="jip-wrap">
    <p class="jip-kicker">Material do curso</p>
    <h1 class="jip-display" style="font-size:2rem">Bônus</h1>
    <section class="jip-card jip-prose">
      <h2>A. Pedido inicial (LAI)</h2>
      <p>Com fundamento na Lei 12.527/2011, solicito cópia integral dos [contratos, aditivos e empenhos] entre [órgão] e [empresa, CNPJ], de [período], em formato aberto (.csv, .xlsx ou PDF pesquisável). Havendo parte sigilosa, requeiro acesso à parte não sigilosa (art. 7º, §2º), com a indicação do fundamento, da autoridade classificadora e do prazo.</p>
      <h2>B. Recurso de 1ª instância</h2>
      <p>Recorro da resposta ao NUP [nº], que [negou ou atendeu parcialmente]. O pedido é específico e trata de gasto público (art. 7º, VI). A publicidade é a regra (art. 3º, I). Requeiro a entrega integral ou, subsidiariamente, parcial com tarjas.</p>
      <h2>C. 2ª instância e CGU</h2>
      <p>A negativa persiste [sem fundamento legal, em violação ao art. 11, §1º, II]. Requeiro a reforma e, se mantida, o encaminhamento à CGU e à CMRI.</p>
      <h2>D. Contra LGPD, dado pessoal ou “pedido genérico”</h2>
      <p>O Enunciado CGU 12/2023 veda negar por “informações pessoais” de forma geral e abstrata e manda tarjar e entregar o restante. O art. 31, §3º, V, e §4º, da LAI afasta a restrição diante de interesse público preponderante e de apuração de irregularidades. A LGPD não afasta a LAI (arts. 7º, II, e 23). O pedido não é genérico (Decreto 7.724, art. 13): indica objeto, período e órgão, e pede o dado tal como existe. Aceito entrega em lotes.</p>
      <h2>E. Omissão</h2>
      <p>O NUP [nº], de [data], não foi respondido no prazo legal. Apresento reclamação à autoridade de monitoramento, para resposta em 5 dias.</p>
      <p class="jip-muted">Estados e municípios: troque o Decreto 7.724 pela norma local (art. 45). Sem norma, cite a LAI e o MP ou o Tribunal de Contas.</p>
    </section>
    <section class="jip-card" style="margin-top:14px">
      <h2>Checklist pré-publicação</h2>
      <ul class="jip-muted">
        <li>Hipótese e sub-hipóteses verificadas</li>
        <li>Afirmações numeradas, cada uma com fonte primária</li>
        <li>Documentos testados, com hash</li>
        <li>Homônimos descartados · termo processual correto</li>
        <li>Delação só como versão · nenhuma imputação de crime sem documento</li>
        <li>Pedido de posicionamento enviado e resposta incluída</li>
        <li>Dados pessoais sem interesse público tarjados</li>
        <li>Em eleição: sem conteúdo sintético e resposta rápida pronta</li>
        <li>Revisão por advogado em pauta de alto risco</li>
        <li>Provas e vídeo fora da plataforma · Abraji à mão</li>
      </ul>
    </section>
    <section class="jip-card" style="margin-top:14px">
      <h2>Planilha de cruzamento</h2>
      <p class="jip-muted">Abas: Pessoas, Empresas, Sócios, Contratos, Pagamentos, Sanções, Eleitoral, Linha do tempo, Log (data da coleta, URL, hash). Chave principal: CNPJ. Vínculo não é culpa.</p>
    </section>
    <section class="jip-card" style="margin-top:14px">
      <h2>Glossário</h2>
      <p class="jip-muted">Acórdão, ADI/ADPF, denúncia, dolo, culpa grave, exceção da verdade, indiciado, inquérito, ação penal, liminar, queixa-crime, tema de repercussão geral, réu, súmula, trânsito em julgado.</p>
    </section>
    <aside class="jip-card" style="margin-top:14px"><h2>Sites da bancada</h2>${toolsHtml(Object.keys(catalog.toolbox))}</aside>
  </main>${dock('inicio')}`;
}

function renderComprar() {
  root().innerHTML = `${topbar('comprar')}
  <main id="conteudo" class="jip-wrap" style="max-width:640px">
    <p class="jip-kicker">Oferta</p>
    <h1 class="jip-display" style="font-size:2.2rem">R$ 197 na pré-venda · R$ 297 cheio</h1>
    <p class="jip-lead">31 aulas (~5h40 de vídeo) + ~6h de exercícios numa pauta sua. Não é blindagem jurídica: é método para apurar e reduzir risco.</p>
    <div class="jip-card">
      <p>Você sai com hipótese, pedido LAI protocolado, planilha, posicionamento e checklist. Conteúdo educativo; não substitui advogado no caso concreto. Regras válidas em setembro de 2026.</p>
      <p class="jip-muted">Depois do pagamento, entre com o <strong>mesmo e-mail da compra</strong>. O Iuri libera o acesso na lista de alunos.</p>
      <div class="jip-cta-row">
        <a class="jip-btn jip-btn-primary" href="mailto:iuri@piragibe.com.br?subject=Compra%20curso%20JIP">Quero comprar — falar com o Iuri</a>
        <a class="jip-btn jip-btn-ghost" href="#/entrar">Já paguei — entrar</a>
      </div>
    </div>
  </main>`;
}

function renderEntrar() {
  root().innerHTML = `${topbar('entrar')}
  <main id="conteudo" class="jip-gate">
    <div class="jip-card">
      <p class="jip-kicker">Acesso à sala</p>
      <h1 class="jip-display" style="font-size:1.9rem">${session ? (paid ? 'Você já está dentro' : 'Conta ok. Falta a compra.') : 'Entre com o e-mail da compra'}</h1>
      ${session ? `<p class="jip-muted">${escapeHtml(session.user.email || '')}</p>
        <div class="jip-cta-row" style="justify-content:center">
          ${paid ? '<a class="jip-btn jip-btn-primary" href="#/inicio">Ir ao início</a>' : '<a class="jip-btn jip-btn-primary" href="#/comprar">Liberar acesso</a>'}
          <button class="jip-btn jip-btn-ghost" id="sair">Sair</button>
        </div>` : `<p class="jip-muted">Link no e-mail. Use o mesmo endereço da compra. Sem compra, a sala não abre.</p>
        <label style="text-align:left">E-mail</label>
        <input id="email" type="email" autocomplete="email" placeholder="voce@email.com">
        <div class="jip-cta-row" style="justify-content:center">
          <button class="jip-btn jip-btn-primary" id="magic">Enviar link</button>
        </div>
        <div class="jip-cta-row" style="justify-content:center">
          <button class="jip-btn jip-btn-ghost" id="google">Google</button>
          <button class="jip-btn jip-btn-ghost" id="discord">Discord</button>
        </div>
        <p class="jip-muted"><a href="#/aberto">Ou assistir a aula aberta</a></p>`}
    </div>
  </main>`;
  document.getElementById('sair')?.addEventListener('click', () => api.signOut());
  document.getElementById('magic')?.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    if (!email) { api.toast('Digite o e-mail.'); return; }
    try { await api.sendMagicLink(email); api.toast('Confira a caixa de entrada.'); }
    catch (err) { api.toast(err.message); }
  });
  document.getElementById('google')?.addEventListener('click', () => api.signInOAuth('google').catch((e) => api.toast(e.message)));
  document.getElementById('discord')?.addEventListener('click', () => api.signInOAuth('discord').catch((e) => api.toast(e.message)));
}

function renderConta() {
  const name = api.displayName(session);
  root().innerHTML = `${topbar('conta')}
  <main id="conteudo" class="jip-wrap" style="max-width:560px">
    <div class="jip-card" style="text-align:center">
      <div class="jip-avatar" style="width:72px;height:72px;margin:0 auto 12px;font-size:1.4rem">${api.initials(session)}</div>
      <h1 class="jip-display" style="font-size:2rem">${escapeHtml(name)}</h1>
      <p class="jip-muted">${escapeHtml(session.user.email || '')}</p>
      <p class="jip-stat" style="margin:18px 0 0">${pct()}%</p>
      <p class="jip-muted">${state.progress.length} aulas · pauta: ${state.pauta.titulo ? escapeHtml(state.pauta.titulo) : 'em branco'}</p>
      <div class="jip-cta-row" style="justify-content:center">
        <a class="jip-btn jip-btn-primary" href="#/inicio">Voltar ao início</a>
        <button class="jip-btn jip-btn-ghost" id="sair">Sair da sala</button>
      </div>
    </div>
  </main>${dock('conta')}`;
  document.getElementById('sair').addEventListener('click', () => api.signOut());
}

async function renderMentor() {
  if (!teacher) { location.hash = '#/inicio'; return; }
  const [turma, alunos] = await Promise.all([api.loadTurma(), api.listAlunos()]);
  root().innerHTML = `${topbar('mentor')}
  <main id="conteudo" class="jip-wrap">
    <h1 class="jip-display" style="font-size:2rem">Turma</h1>
    <section class="jip-card">
      <h2>Liberar aluno (e-mail da compra)</h2>
      <input id="grant" type="email" placeholder="aluno@email.com">
      <button class="jip-btn jip-btn-primary" id="grantBtn" style="margin-top:10px">Liberar acesso</button>
      <p class="jip-muted" style="margin-top:12px">${(alunos.length ? alunos : []).map((a) => escapeHtml(a.email)).join(' · ') || 'Nenhum e-mail na lista ainda. Rode curso-jip-alunos.sql.'}</p>
    </section>
    ${(turma.length ? turma : []).map((row) =>
    `<article class="jip-card"><strong>${escapeHtml(row.titulo || '(sem pauta)')}</strong>
      <p class="jip-muted">${row.updated_at || ''}</p></article>`).join('') || '<p class="jip-muted">Nenhuma pauta na nuvem ainda.</p>'}
  </main>${dock('inicio')}`;
  document.getElementById('grantBtn').onclick = async () => {
    try {
      await api.grantAluno(document.getElementById('grant').value);
      api.toast('Aluno liberado.');
      renderMentor();
    } catch (err) { api.toast(err.message); }
  };
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

async function boot() {
  session = await api.getSession();
  if (location.hash.includes('access_token')) {
    history.replaceState(null, '', `${location.pathname}${location.search}#/inicio`);
  }
  teacher = await api.isTeacher(session);
  paid = await api.hasPaidAccess(session, teacher);
  if (paid) {
    catalog = await fetch(CATALOG_URL).then((r) => r.json());
    state = await api.loadState(session);
  } else {
    catalog = await fetch(ABERTO_URL).then((r) => r.json());
    state = { pauta: { titulo: '', dados: {} }, progress: [], exercises: {}, cloud: false };
  }
  let route = parseRoute();

  if (session && paid && sessionStorage.getItem('jip-next')) {
    const n = sessionStorage.getItem('jip-next');
    sessionStorage.removeItem('jip-next');
    if (n && n !== '#/entrar' && n !== '#/comprar') {
      location.hash = n;
      return;
    }
  }

  if (!route.name) {
    const dest = !session ? 'comprar' : (paid ? 'inicio' : 'comprar');
    location.replace(`${location.pathname}${location.search}#/${dest}`);
    return;
  }

  if (session && paid && (route.name === 'comprar' || route.name === 'entrar')) {
    location.hash = '#/inicio';
    return;
  }

  if (!session && !PUBLIC.has(route.name)) {
    renderLock();
    return;
  }

  if (session && !paid && !PUBLIC.has(route.name) && route.name !== 'conta') {
    location.hash = '#/comprar';
    return;
  }

  if (paid && needsOnboarding() && route.name !== 'onboarding' && route.name !== 'entrar') {
    location.hash = '#/onboarding';
    return;
  }

  if (route.name === 'aberto') renderAberto();
  else if (route.name === 'comprar') renderComprar();
  else if (route.name === 'onboarding') renderOnboarding();
  else if (route.name === 'inicio') renderInicio();
  else if (route.name === 'sala') renderSala();
  else if (route.name === 'aula') renderAula(route.id);
  else if (route.name === 'pauta') renderPauta();
  else if (route.name === 'bonus') renderBonus();
  else if (route.name === 'entrar') renderEntrar();
  else if (route.name === 'conta') renderConta();
  else if (route.name === 'mentor') await renderMentor();
  else if (paid) renderInicio();
  else renderComprar();
}

window.addEventListener('hashchange', () => boot());
boot();
