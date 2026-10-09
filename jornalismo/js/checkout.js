// Pré-venda: os botões de compra abrem um formulário (e-mail + telefone),
// salvam o contato no Netlify Forms e levam ao link de pagamento do Mercado Pago.
window.JIP_CHECKOUT_URL = 'https://mpago.la/15kWm4V';

(function () {
  var url = window.JIP_CHECKOUT_URL;
  if (!url) return;

  function iniciar() {
    var modal = document.getElementById('jl-lead');
    var form = document.getElementById('jl-lead-form');
    // Sem o formulário na página: os botões vão direto ao pagamento.
    document.querySelectorAll('[data-checkout]').forEach(function (link) {
      link.href = url; link.rel = 'noopener';
      if (!modal) return;
      link.addEventListener('click', function (e) { e.preventDefault(); abrir(); });
    });
    if (!modal) return;

    var anterior = null;
    function abrir() {
      anterior = document.activeElement;
      modal.hidden = false; document.body.style.overflow = 'hidden';
      setTimeout(function () { form.email.focus(); }, 30);
    }
    function fechar() {
      modal.hidden = true; document.body.style.overflow = '';
      if (anterior) anterior.focus();
    }
    modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('[data-lead-fechar]')) fechar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) fechar(); });

    // Máscara simples de telefone brasileiro
    form.telefone.addEventListener('input', function () {
      var d = this.value.replace(/\D/g, '').slice(0, 11);
      this.value = d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
        : d.length > 6 ? d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
        : d.length > 2 ? d.replace(/(\d{2})(\d+)/, '($1) $2') : d;
    });

    var status = form.querySelector('.jl-lead-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.email.value.trim(), tel = form.telefone.value.replace(/\D/g, '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { status.textContent = 'Confira o e-mail.'; form.email.focus(); return; }
      if (tel.length < 10) { status.textContent = 'Informe o telefone com DDD.'; form.telefone.focus(); return; }
      if (!form.aceite.checked) { status.textContent = 'Marque a caixa de concordância para continuar.'; return; }
      var botao = form.querySelector('button[type=submit]');
      botao.disabled = true; status.textContent = 'Salvando seus dados…';
      try { localStorage.setItem('jip_lead_email', email); } catch (_) {}
      var dados = new URLSearchParams(new FormData(form)).toString();
      var seguir = function () { status.textContent = 'Abrindo o pagamento…'; location.href = url; };
      // Salva o contato; se demorar ou falhar, segue mesmo assim para não perder a compra.
      var tempo = setTimeout(seguir, 4000);
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: dados })
        .catch(function () {})
        .then(function () { clearTimeout(tempo); seguir(); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
