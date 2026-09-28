import { test, expect } from '@playwright/test';
import { stat } from 'node:fs/promises';

declare global {
  interface Window {
    __dbWrites: Array<{ table: string; op: string; value?: Record<string, unknown> }>;
  }
}

test('landing do curso tem SEO de Course', async ({ page }) => {
  await page.goto('/jornalismo/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Jornalismo Investigativo na Prática/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://iuripiragibe.net/jornalismo/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index/i);
  await expect(page.getByText('Sem documento, é lenda').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Comprar/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Garantir vaga/i }).first()).toBeVisible();
  await expect(page.locator('#programa details')).toHaveCount(8);
  await expect(page.locator('#programa li')).toHaveCount(31);
  await expect(page.getByRole('link', { name: /Entrar/i }).first()).toBeVisible();
  const json = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(json).toContain('"@type": "Course"');
});

test('aula aberta 3.2 e 3.3 abre sem login', async ({ page }) => {
  await page.goto('/jornalismo/app.html?v=aberto#/aberto', { waitUntil: 'networkidle' });
  await expect(page.locator('h1')).toContainText(/LAI|pedido/i);
  await expect(page.getByText(/Pedido vago recebe resposta vaga/i).first()).toBeVisible();
});

test('guarda de rota leva visitante ao login', async ({ page }) => {
  await page.goto('/jornalismo/app.html#/sala', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/#\/entrar$/);
  await expect(page.getByRole('heading', { name: /^Entrar$/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /O que é apuração/i })).toHaveCount(0);
});

test('catálogo pago não está no diretório público', async ({ request }) => {
  const response = await request.get('/jornalismo/content/aulas.json');
  expect(response.status()).toBe(404);
});

test('recursos fornecidos existem apenas no bundle privado', async ({ request }) => {
  const resources = [
    'planilha-de-cruzamento.xlsx',
    'materiais-bonus.pdf',
    'documento-completo-curso.md'
  ];
  for (const filename of resources) {
    const publicResponse = await request.get(`/jornalismo/downloads/${filename}`);
    expect(publicResponse.status(), filename).toBe(404);
    const file = await stat(`supabase/functions/curso-catalog/resources/${filename}`);
    expect(file.size, filename).toBeGreaterThan(100);
  }
  for (const path of [
    '/jornalismo/content/aulas.json',
    '/jornalismo/downloads/planilha-de-cruzamento.xlsx'
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
  }
});

const catalog = {
  title: 'Jornalismo Investigativo na Prática',
  modules: [{ id: 1, title: 'Mentalidade investigativa', blurb: 'Pauta e hipótese.' }],
  toolbox: {
    falabr: { name: 'Fala.BR — pedido LAI', url: 'https://falabr.cgu.gov.br/', kind: 'prática' }
  },
  aulas: [{
    id: '1.1',
    module: 1,
    title: 'O que é apuração',
    duration: '10 min',
    objective: 'separar pista de prova',
    tools: ['falabr'],
    contentHtml: '<h3>ABERTURA</h3><p>Apuração exige verificação.</p>',
    exerciseHtml: '<p>Registre sua primeira pergunta.</p>',
    closingHtml: '<p>Agora teste a hipótese.</p>'
  }]
};

async function mockAuthorizedSupabase(page, profile: null | {
  user_id: string;
  codinome: string;
  vertente: string;
  opsec_score: number;
  onboarding_completed: boolean;
}, progress: string[] = []) {
  const profileJson = JSON.stringify(profile);
  const progressJson = JSON.stringify(progress.map((aula_id) => ({ aula_id, completed_at: '2026-09-20T15:00:00Z' })));
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
        window.__dbWrites = [];
        const session = { access_token: 'test-token', user: { id: '00000000-0000-4000-8000-000000000001', email: 'aluno@example.com', user_metadata: {} } };
        const profile = ${profileJson};
        function resultFor(table) {
          if (table === 'curso_jip_perfis') return profile;
          if (table === 'curso_jip_pautas') return null;
          if (table === 'curso_jip_progresso') return ${progressJson};
          return [];
        }
        function query(table) {
          let payload = null;
          const chain = {
            select() { return chain; },
            eq() { return chain; },
            order() { return chain; },
            upsert(value) { payload = value; window.__dbWrites.push({ table, op: 'upsert', value }); return chain; },
            insert(value) { payload = value; window.__dbWrites.push({ table, op: 'insert', value }); return chain; },
            delete() { window.__dbWrites.push({ table, op: 'delete' }); return chain; },
            maybeSingle() { return Promise.resolve({ data: resultFor(table), error: null }); },
            single() { return Promise.resolve({ data: payload, error: null }); },
            then(resolve) { return Promise.resolve({ data: resultFor(table), error: null }).then(resolve); }
          };
          return chain;
        }
        window.supabase = { createClient() { return {
          auth: {
            getSession: async () => ({ data: { session }, error: null }),
            getUser: async () => ({ data: { user: session.user }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
            signOut: async () => ({ error: null })
          },
          rpc: async () => ({ data: true, error: null }),
          from: query
        }; } };
      `
    });
  });
  await page.route('https://fveslvzjjixzpwiqcydz.supabase.co/functions/v1/curso-catalog', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(catalog) });
  });
}

test('aluno autorizado cai no início sem OpSec e marca onboarding', async ({ page }) => {
  await mockAuthorizedSupabase(page, null);
  await page.goto('/jornalismo/app.html#/inicio', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/#\/inicio$/);
  await expect(page.getByRole('link', { name: /Continuar aula|Começar pela aula/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Ver aulas/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Ferramentas$/i }).first()).toBeVisible();
  await expect(page.getByText(/Triagem operacional|OpSec|Credencial|Diagnóstico de segurança/i)).toHaveCount(0);
  const writes = await page.evaluate(() => window.__dbWrites);
  expect(writes).toContainEqual(expect.objectContaining({
    table: 'curso_jip_perfis',
    value: expect.objectContaining({ onboarding_completed: true })
  }));
});

test('notas da aula são persistidas e não simulam vídeo', async ({ page }) => {
  await mockAuthorizedSupabase(page, {
    user_id: '00000000-0000-4000-8000-000000000001',
    codinome: 'Aluno',
    vertente: 'financeira',
    opsec_score: 0,
    onboarding_completed: true
  });
  await page.goto('/jornalismo/app.html#/aula/1.1', { waitUntil: 'networkidle' });
  await expect(page.getByText(/Roteiro de leitura/i)).toBeVisible();
  await expect(page.locator('video')).toHaveCount(0);
  await expect(page.locator('.ops-player')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Ferramentas desta aula/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Fala\.BR/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Exercício da aula 1\.1/i })).toBeVisible();
  await page.locator('#lesson-notes').fill('Hipótese baseada no contrato público.');
  await page.getByRole('button', { name: /Salvar notas/i }).click();
  await expect(page.getByRole('status')).toContainText(/salvas/i);
  const writes = await page.evaluate(() => window.__dbWrites);
  expect(writes).toContainEqual(expect.objectContaining({
    table: 'curso_jip_exercicios',
    value: expect.objectContaining({ aula_id: '1.1' })
  }));
});

test('compra sem checkout configurado oferece reserva por e-mail', async ({ page }) => {
  await page.goto('/jornalismo/app.html#/comprar', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Jornalismo Investigativo/i);
  await expect(page.getByRole('link', { name: /Reservar vaga por e-mail/i })).toHaveAttribute('href', /^mailto:iuri@piragibe\.com\.br/);
});

test('grade de aulas abre o módulo pedido e marca estados', async ({ page }) => {
  await mockAuthorizedSupabase(page, {
    user_id: '00000000-0000-4000-8000-000000000001',
    codinome: 'Aluno',
    vertente: 'financeira',
    opsec_score: 0,
    onboarding_completed: true
  });
  await page.goto('/jornalismo/app.html#/sala/1', { waitUntil: 'networkidle' });
  await expect(page.locator('#modulo-1')).toHaveAttribute('open', '');
  await expect(page.getByRole('link', { name: /1\.1 · O que é apuração/i })).toBeVisible();
  await expect(page.getByRole('progressbar').first()).toBeVisible();
});

test('painel mostra medalhas por módulo', async ({ page }) => {
  await mockAuthorizedSupabase(page, {
    user_id: '00000000-0000-4000-8000-000000000001',
    codinome: 'Aluno',
    vertente: 'financeira',
    opsec_score: 0,
    onboarding_completed: true
  });
  await page.goto('/jornalismo/app.html#/inicio', { waitUntil: 'networkidle' });
  await expect(page.locator('.ops-medals li')).toHaveCount(1);
  await expect(page.locator('.ops-medals li.is-earned')).toHaveCount(0);
  await expect(page.getByText(/Medalhas · 0\/1/)).toBeVisible();
});

test('landing mostra plataforma real, números e medalhas; depoimentos só com dados', async ({ page }) => {
  await page.goto('/jornalismo/', { waitUntil: 'networkidle' });
  await expect(page.locator('.jl-mock img').first()).toHaveAttribute('src', '/jornalismo/img/plataforma-painel.jpg');
  const broken = await page.locator('img').evaluateAll((imgs) =>
    imgs.filter((img) => img.getAttribute('src')?.startsWith('/jornalismo/img/plataforma') && img.complete && img.naturalWidth === 0).map((img) => img.getAttribute('src')));
  expect(broken).toEqual([]);
  await expect(page.locator('.jl-num-grid li')).toHaveCount(6);
  await expect(page.locator('.jl-medals li')).toHaveCount(8);
  await expect(page.locator('#depoimentos')).toBeHidden();
  await expect(page.locator('#autoridade-title')).toContainText(/caso Master e a mineração predatória na Serra do Curral/);
  await expect(page.locator('a.jl-video')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=pe1e8sq1UP8');
});

test('depoimentos aparecem quando o JSON tem relatos', async ({ page }) => {
  await page.route('**/jornalismo/content/depoimentos.json', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([{ nome: 'Maria Silva', papel: 'Repórter', texto: 'Meu primeiro pedido de LAI foi respondido.', resultado: 'LAI respondida' }])
  }));
  await page.goto('/jornalismo/', { waitUntil: 'networkidle' });
  await expect(page.locator('#depoimentos')).toBeVisible();
  await expect(page.locator('.jl-quote-card')).toHaveCount(1);
  await expect(page.locator('.jl-quote-avatar')).toHaveText('MS');
});

const alunoPerfil = {
  user_id: '00000000-0000-4000-8000-000000000001',
  codinome: 'Aluno',
  vertente: 'financeira',
  opsec_score: 0,
  onboarding_completed: true
};

test('certificado fica bloqueado até concluir todas as aulas', async ({ page }) => {
  await mockAuthorizedSupabase(page, alunoPerfil);
  await page.goto('/jornalismo/app.html#/certificado', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: /Quase lá/i })).toBeVisible();
  await expect(page.locator('.cert')).toHaveCount(0);
});

test('certificado é emitido pela empresa ao concluir o curso', async ({ page }) => {
  await mockAuthorizedSupabase(page, alunoPerfil, ['1.1']);
  await page.goto('/jornalismo/app.html#/inicio', { waitUntil: 'networkidle' });
  await expect(page.locator('.ops-cert-card.is-ready')).toBeVisible();
  await page.goto('/jornalismo/app.html#/certificado', { waitUntil: 'networkidle' });
  await page.locator('#cert-nome').fill('Maria da Silva');
  const cert = page.locator('.cert');
  await expect(cert).toContainText('MARIA DA SILVA', { ignoreCase: true });
  await expect(cert).toContainText('Iuri Piragibe Comunicação e Audiovisual Ltda.');
  await expect(cert).toContainText('CNPJ 68.595.950/0001-40');
  await expect(cert).toContainText('20 de setembro de 2026');
  await expect(cert).toContainText(/JIP-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}/);
});

test('landing anuncia o certificado', async ({ page }) => {
  await page.goto('/jornalismo/', { waitUntil: 'networkidle' });
  await expect(page.locator('#certificado')).toContainText('68.595.950/0001-40');
  await expect(page.locator('#certificado img')).toHaveAttribute('src', '/jornalismo/img/certificado-exemplo.jpg');
});
