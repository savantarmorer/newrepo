// Depoimentos de alunos na landing do curso.
// A seção #depoimentos fica oculta enquanto /jornalismo/content/depoimentos.json
// estiver vazio. Use só relatos reais, com autorização por escrito de quem deu.
// Formato de cada item:
// { "nome": "Nome Sobrenome", "papel": "Repórter, Cidade", "texto": "…",
//   "foto": "/jornalismo/img/alunos/nome.jpg" (opcional),
//   "resultado": "Pedido LAI respondido em 12 dias" (opcional) }
(function () {
  var section = document.getElementById('depoimentos');
  var list = section && section.querySelector('[data-depoimentos]');
  if (!list || !window.fetch) return;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function initials(name) {
    return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) {
      return part.charAt(0).toUpperCase();
    }).join('');
  }

  function safeImage(src) {
    return typeof src === 'string' && /^\/(?!\/)[\w\-./]+\.(jpe?g|png|webp|avif)$/i.test(src) ? src : '';
  }

  fetch('/jornalismo/content/depoimentos.json', { cache: 'no-cache' })
    .then(function (response) { return response.ok ? response.json() : []; })
    .then(function (items) {
      if (!Array.isArray(items)) return;
      items = items.filter(function (item) { return item && item.nome && item.texto; });
      if (!items.length) return;
      items.forEach(function (item) {
        var card = el('figure', 'jl-quote-card');
        if (item.resultado) card.appendChild(el('p', 'jl-quote-result', item.resultado));
        card.appendChild(el('blockquote', '', '“' + item.texto + '”'));
        var who = el('figcaption', 'jl-quote-who');
        var photo = safeImage(item.foto);
        if (photo) {
          var img = el('img');
          img.src = photo; img.alt = ''; img.width = 48; img.height = 48; img.loading = 'lazy';
          who.appendChild(img);
        } else {
          who.appendChild(el('span', 'jl-quote-avatar', initials(item.nome)));
        }
        var meta = el('span');
        meta.appendChild(el('strong', '', item.nome));
        if (item.papel) meta.appendChild(el('small', '', item.papel));
        who.appendChild(meta);
        card.appendChild(who);
        list.appendChild(card);
      });
      section.hidden = false;
    })
    .catch(function () { /* sem depoimentos: seção continua oculta */ });
})();
