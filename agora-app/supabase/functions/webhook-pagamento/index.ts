// Webhook do gateway de pagamento (Asaas ou Mercado Pago). Publique com --no-verify-jwt.
// Em desenvolvimento (PAYMENT_PROVIDER=mock), aceita { simular: doacao_id } de um membro logado.
// Confirmar a doação dispara o trigger que lança a entrada no caixa transparente.
import { admin, usuario } from '../_shared/supabase.ts';
import { ErroHttp, json, servir } from '../_shared/http.ts';
import { provedorPagamento } from '../_shared/pagamentos.ts';

servir(async (req) => {
  const provedor = provedorPagamento();
  const bruto = await req.text();
  const db = admin();

  if (provedor.nome === 'mock') {
    await usuario(req);
    const { simular } = JSON.parse(bruto || '{}') as { simular?: string };
    if (!simular) throw new ErroHttp(400, 'Informe { simular: doacao_id }');
    const { error } = await db.from('doacoes').update({ status: 'confirmada' }).eq('id', simular).eq('status', 'pendente');
    if (error) throw new ErroHttp(400, error.message);
    return json({ ok: true, simulado: true });
  }

  const evento = await provedor.lerWebhook(req, bruto);
  if (!evento || evento.status === 'pendente') return json({ ok: true, ignorado: true });
  // Idempotente: só muda doações pendentes (o trigger impede reprocessar confirmadas)
  const { error } = await db.from('doacoes').update({ status: evento.status })
    .eq('gateway', provedor.nome).eq('gateway_ref', evento.gatewayRef).eq('status', 'pendente');
  if (error) throw new ErroHttp(400, error.message);
  return json({ ok: true });
});
