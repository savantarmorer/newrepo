# Page dependency trees

All application screens share the same dependency tree because this is a
single-file vanilla JavaScript SPA.

## `/jornalismo/`

Entry: `jornalismo/index.html`

- `jornalismo/css/curso.css`

## `/jornalismo/app.html#/inicio`

Entry: `jornalismo/app.html`

- `jornalismo/js/opsApp.js`
  - `jornalismo/js/opsAuth.js`
  - authenticated Edge Function `curso-catalog`
  - `jornalismo/content/aberto.json`
- `jornalismo/css/ops.css`
- Supabase JS v2 from CDN

## Application route renderers

- Authentication: `renderEntrar`, `renderLock`
- Onboarding: `renderOnboarding`
- Dashboard: `renderInicio`
- Curriculum: `renderSala`
- Lesson workspace: `renderAula`
- Investigation dossier: `renderPauta`
- Resources: `renderBonus`
- Account: `renderConta`
- Teacher console: `renderMentor`

Every renderer lives in `jornalismo/js/opsApp.js`, uses the shared operational shell,
and writes directly into `#jip-root`.
