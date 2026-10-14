/**
 * Camada de pagamento Pix. O app nunca fala com o gateway: só as Edge Functions,
 * com chaves em variáveis de ambiente. Troque o provedor com PAYMENT_PROVIDER.
 *   mock         → desenvolvimento (gera um "Pix" fictício e permite simular o pagamento)
 *   asaas        → https://docs.asaas.com (cobrança PIX + webhook PAYMENT_RECEIVED)
 *   mercadopago  → https://www.mercadopago.com.br/developers (payment pix + webhook)
 */
import { ErroHttp, variavel } from './http.ts';

export interface NovaCobranca {
  doacaoId: string;
  valor: number; // em reais
  descricao: string;
  pagador?: { nome?: string; email?: string } | null;
}

export interface Cobranca {
  gatewayRef: string;
  pixCopiaCola: string;
  qrCodeBase64: string | null;
  expiraEm: string;
}

export interface EventoPagamento {
  gatewayRef: string;
  status: 'confirmada' | 'falhou' | 'pendente';
}

export interface PaymentProvider {
  readonly nome: 'mock' | 'asaas' | 'mercadopago';
  criarCobrancaPix(c: NovaCobranca): Promise<Cobranca>;
  /** Valida a autenticidade do webhook e traduz o evento; null = ignorar */
  lerWebhook(req: Request, corpoBruto: string): Promise<EventoPagamento | null>;
}

const em30min = () => new Date(Date.now() + 30 * 60_000).toISOString();

/** Payload "BR Code" com aparência real — não é pagável. */
function brCodeFicticio(ref: string, valor: number): string {
  const v = valor.toFixed(2);
  return `00020126580014BR.GOV.BCB.PIX0136agora-mock-${ref.slice(0, 8)}520400005303986540${v.length}${v}5802BR5905AGORA6009SAO PAULO62140510${ref.slice(0, 10)}6304ABCD`;
}

class MockProvider implements PaymentProvider {
  readonly nome = 'mock' as const;
  async criarCobrancaPix(c: NovaCobranca): Promise<Cobranca> {
    const ref = `mock-${crypto.randomUUID()}`;
    return { gatewayRef: ref, pixCopiaCola: brCodeFicticio(ref, c.valor), qrCodeBase64: null, expiraEm: em30min() };
  }
  async lerWebhook(): Promise<EventoPagamento | null> {
    return null; // no mock a confirmação vem de { simular }
  }
}

class AsaasProvider implements PaymentProvider {
  readonly nome = 'asaas' as const;
  private base = Deno.env.get('ASAAS_API_URL') ?? 'https://sandbox.asaas.com/api/v3';
  private async chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
    const r = await fetch(`${this.base}${caminho}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', access_token: variavel('ASAAS_API_KEY'), ...(init?.headers ?? {}) },
    });
    if (!r.ok) throw new ErroHttp(502, `Asaas respondeu ${r.status}: ${await r.text()}`);
    return r.json() as Promise<T>;
  }
  async criarCobrancaPix(c: NovaCobranca): Promise<Cobranca> {
    // Doações anônimas usam um cliente genérico configurado no Asaas
    const customer = variavel('ASAAS_CLIENTE_DOACOES');
    const vencimento = new Date().toISOString().slice(0, 10);
    const pagamento = await this.chamar<{ id: string }>('/payments', {
      method: 'POST',
      body: JSON.stringify({ customer, billingType: 'PIX', value: c.valor, dueDate: vencimento, description: c.descricao, externalReference: c.doacaoId }),
    });
    const qr = await this.chamar<{ encodedImage: string; payload: string; expirationDate: string }>(`/payments/${pagamento.id}/pixQrCode`);
    return { gatewayRef: pagamento.id, pixCopiaCola: qr.payload, qrCodeBase64: qr.encodedImage, expiraEm: new Date(qr.expirationDate).toISOString() };
  }
  async lerWebhook(req: Request, corpo: string): Promise<EventoPagamento | null> {
    if (req.headers.get('asaas-access-token') !== variavel('ASAAS_WEBHOOK_TOKEN')) throw new ErroHttp(401, 'Webhook não autenticado');
    const ev = JSON.parse(corpo) as { event: string; payment?: { id: string } };
    if (!ev.payment) return null;
    if (ev.event === 'PAYMENT_RECEIVED' || ev.event === 'PAYMENT_CONFIRMED') return { gatewayRef: ev.payment.id, status: 'confirmada' };
    if (ev.event === 'PAYMENT_OVERDUE' || ev.event === 'PAYMENT_DELETED' || ev.event === 'PAYMENT_REFUNDED') return { gatewayRef: ev.payment.id, status: 'falhou' };
    return null;
  }
}

class MercadoPagoProvider implements PaymentProvider {
  readonly nome = 'mercadopago' as const;
  async criarCobrancaPix(c: NovaCobranca): Promise<Cobranca> {
    const r = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${variavel('MERCADOPAGO_ACCESS_TOKEN')}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': c.doacaoId },
      body: JSON.stringify({
        transaction_amount: c.valor,
        description: c.descricao,
        payment_method_id: 'pix',
        external_reference: c.doacaoId,
        date_of_expiration: em30min(),
        payer: { email: c.pagador?.email ?? variavel('MERCADOPAGO_EMAIL_PADRAO') },
      }),
    });
    if (!r.ok) throw new ErroHttp(502, `Mercado Pago respondeu ${r.status}`);
    const p = (await r.json()) as { id: number; date_of_expiration: string; point_of_interaction: { transaction_data: { qr_code: string; qr_code_base64: string } } };
    return { gatewayRef: String(p.id), pixCopiaCola: p.point_of_interaction.transaction_data.qr_code, qrCodeBase64: p.point_of_interaction.transaction_data.qr_code_base64, expiraEm: p.date_of_expiration };
  }
  async lerWebhook(req: Request, corpo: string): Promise<EventoPagamento | null> {
    // Validação HMAC do cabeçalho x-signature (ts + id da notificação)
    const assinatura = req.headers.get('x-signature') ?? '';
    const requestId = req.headers.get('x-request-id') ?? '';
    const ev = JSON.parse(corpo) as { type?: string; data?: { id: string } };
    if (ev.type !== 'payment' || !ev.data?.id) return null;
    const partes = Object.fromEntries(assinatura.split(',').map((p) => p.trim().split('=') as [string, string]));
    const manifesto = `id:${ev.data.id};request-id:${requestId};ts:${partes.ts};`;
    const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(variavel('MERCADOPAGO_WEBHOOK_SECRET')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const hmac = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(manifesto)))).map((b) => b.toString(16).padStart(2, '0')).join('');
    if (hmac !== partes.v1) throw new ErroHttp(401, 'Assinatura do webhook inválida');
    // Nunca confiar no corpo: consulta o pagamento na API
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${ev.data.id}`, { headers: { Authorization: `Bearer ${variavel('MERCADOPAGO_ACCESS_TOKEN')}` } });
    const p = (await r.json()) as { status: string };
    if (p.status === 'approved') return { gatewayRef: ev.data.id, status: 'confirmada' };
    if (['rejected', 'cancelled', 'refunded'].includes(p.status)) return { gatewayRef: ev.data.id, status: 'falhou' };
    return { gatewayRef: ev.data.id, status: 'pendente' };
  }
}

export function provedorPagamento(): PaymentProvider {
  switch (Deno.env.get('PAYMENT_PROVIDER') ?? 'mock') {
    case 'asaas': return new AsaasProvider();
    case 'mercadopago': return new MercadoPagoProvider();
    default: return new MockProvider();
  }
}
