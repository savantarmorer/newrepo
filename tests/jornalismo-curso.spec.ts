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
  await expect(page.getByRole('heading', { name: /Entrar na sala/i })).toBeVisible();
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
  toolbox: {},
  aulas: [{
    id: '1.1',
    module: 1,
    title: 'O que é apuração',
    duration: '10 min',
    objective: 'separar pista de prova',
    tools: [],
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
}) {
  const profileJson = JSON.stringify(profile);
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

test('aluno autorizado conclui onboarding persistido', async ({ page }) => {
  await mockAuthorizedSupabase(page, null);
  await page.goto('/jornalismo/app.html#/inicio', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/#\/onboarding$/);
  await page.getByRole('button', { name: /^OSINT/ }).click();
  await page.getByLabel(/Guardar o original/i).check();
  await page.getByLabel(/Remove o dado do arquivo final/i).check();
  await page.getByRole('button', { name: /Calcular diagnóstico/i }).click();
  await page.getByRole('button', { name: /Liberar primeira missão/i }).click();
  await expect(page).toHaveURL(/#\/aula\/1\.1$/);
  const writes = await page.evaluate(() => window.__dbWrites);
  expect(writes).toContainEqual(expect.objectContaining({
    table: 'curso_jip_perfis',
    value: expect.objectContaining({ onboarding_completed: true, vertente: 'osint', opsec_score: 100 })
  }));
});

test('notas da aula são persistidas e não simulam vídeo', async ({ page }) => {
  await mockAuthorizedSupabase(page, {
    user_id: '00000000-0000-4000-8000-000000000001',
    codinome: 'Repórter',
    vertente: 'financeira',
    opsec_score: 100,
    onboarding_completed: true
  });
  await page.goto('/jornalismo/app.html#/aula/1.1', { waitUntil: 'networkidle' });
  await expect(page.getByText('Vídeo ainda não publicado')).toBeVisible();
  await expect(page.locator('video')).toHaveCount(0);
  await page.getByRole('tab', { name: /Notas privadas/i }).click();
  await page.locator('#lesson-notes').fill('Hipótese baseada no contrato público.');
  await page.getByRole('button', { name: /Salvar notas/i }).click();
  await expect(page.getByRole('status')).toContainText(/salvas/i);
  const writes = await page.evaluate(() => window.__dbWrites);
  expect(writes).toContainEqual(expect.objectContaining({
    table: 'curso_jip_exercicios',
    value: expect.objectContaining({ aula_id: '1.1' })
  }));
});
