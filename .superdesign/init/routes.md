# Route map

Router: hash-based routing in `jornalismo/js/app.js`.
Host page: `/jornalismo/app.html`.
Shared layout: `topbar(current)` and authorized mobile `dock(current)`.

| Hash route | Renderer | Access |
| --- | --- | --- |
| `#/aberto` | `renderAberto` | Public |
| `#/comprar` | `renderComprar` | Public |
| `#/entrar` | `renderEntrar` | Public |
| `#/onboarding` | `renderOnboarding` | Authorized buyer |
| `#/inicio` | `renderInicio` | Authorized buyer |
| `#/sala` | `renderSala` | Authorized buyer |
| `#/aula/:id` | `renderAula` | Authorized buyer |
| `#/pauta` | `renderPauta` | Authorized buyer |
| `#/bonus` | `renderBonus` | Authorized buyer |
| `#/conta` | `renderConta` | Authenticated |
| `#/mentor` | `renderMentor` | Teacher |

## Router source

```js
function parseRoute() {
  const hash = (location.hash || '').replace(/^#/, '');
  const parts = hash.split('/').filter(Boolean);
  return { name: parts[0] || '', id: parts[1] || '' };
}

if (!session && !PUBLIC.has(route.name)) renderLock();
else if (session && !paid && !PUBLIC.has(route.name) && route.name !== 'conta') {
  location.hash = '#/comprar';
}
```
