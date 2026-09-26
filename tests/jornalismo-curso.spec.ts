import { test, expect } from '@playwright/test';

test('landing do curso tem SEO de Course', async ({ page }) => {
  await page.goto('/jornalismo/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/Jornalismo Investigativo na Prática/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://iuripiragibe.net/jornalismo/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index/i);
  await expect(page.locator('text=Sem documento, é lenda')).toBeVisible();
  const json = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(json).toContain('"@type": "Course"');
});

test('aula aberta 3.2 e 3.3 abre sem login', async ({ page }) => {
  await page.goto('/jornalismo/app.html?v=aberto#/aberto', { waitUntil: 'networkidle' });
  await expect(page.locator('h1')).toContainText(/LAI|pedido|prazos/i);
  await expect(page.getByRole('link', { name: /Fala\.BR/i })).toBeVisible();
});

test('sala lista módulo 1 e a aula 1.1', async ({ page }) => {
  await page.goto('/jornalismo/app.html#/sala', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: /Sala de aula/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /O que é apuração/i })).toBeVisible();
});
