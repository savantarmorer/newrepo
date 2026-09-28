// Link de pagamento do curso (Hotmart, Kiwify, Stripe Payment Link, Mercado Pago…).
// Enquanto estiver vazio, os botões de compra levam à página de inscrição,
// que oferece reserva por e-mail. Preencha aqui e todos os CTAs passam a
// abrir o checkout direto, sem passar pela área do aluno.
window.JIP_CHECKOUT_URL = '';

(function () {
  var url = window.JIP_CHECKOUT_URL;
  if (!url) return;
  function apply() {
    document.querySelectorAll('[data-checkout]').forEach(function (link) {
      link.href = url;
      link.rel = 'noopener';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
