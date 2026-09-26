import { test, expect } from '@playwright/test';

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
  await expect(page.getByRole('link', { name: /Fala\.BR/i })).toBeVisible();
});

test('sala fechada exige compra', async ({ page }) => {
  await page.goto('/jornalismo/app.html#/sala', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: /comprou/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Comprar o curso/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /O que é apuração/i })).toHaveCount(0);
});
