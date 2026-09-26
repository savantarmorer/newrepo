# Shared layouts

## Application shell

Source: `jornalismo/js/app.js`

The SPA injects a shared top bar and, for authorized students, a mobile dock.

```js
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
```

## HTML host

Source: `jornalismo/app.html`

```html
<body class="jip">
  <div id="jip-root"><p class="jip-wrap jip-muted">Carregando a sala…</p></div>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script type="module" src="/jornalismo/js/app.js"></script>
</body>
```
