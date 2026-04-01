import { test, expect } from '@playwright/test';

test('página /participacao carrega e listagem da Câmara responde', async ({ page }) => {
  await page.goto('/participacao', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: /Participação cívica/i })).toBeVisible();

  const res = await page.request.get('/api/civic/deputados?itens=1&nome=A');
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = await res.json();
  expect(Array.isArray(body.deputados)).toBeTruthy();
  expect(body.deputados.length).toBeGreaterThan(0);
});

test('API de feed RSS devolve itens', async ({ request }) => {
  const res = await request.get('/api/civic/feed?q=brasil&limit=4');
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = await res.json();
  expect(Array.isArray(body.items)).toBeTruthy();
  expect(body.items.length).toBeGreaterThan(0);
});

test('API /api/civic/config indica se envio está ativo', async ({ request }) => {
  const res = await request.get('/api/civic/config');
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = await res.json();
  expect(typeof body.sendEnabled).toBe('boolean');
  expect(body.transport === null || body.transport === 'resend' || body.transport === 'smtp').toBeTruthy();
});
