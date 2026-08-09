import { test, expect } from '@playwright/test';

// Testes de fumaça do site Ágora (agora-slu/). Cobrem só o que dá pra
// verificar sem uma sessão real do Supabase (login social não é
// automatizável aqui) — carregamento de página, gate de autenticação,
// navegação e estrutura de formulários.

test.describe('Login e gate de autenticação', () => {
  test('login.html mostra os botões de Discord e Google', async ({ page }) => {
    await page.goto('/agora-slu/login.html', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Entrar com Discord/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Entrar com Google/i })).toBeVisible();
  });

  test('login.html exibe a mensagem de erro repassada via ?erro=', async ({ page }) => {
    await page.goto('/agora-slu/login.html?erro=Erro%20de%20teste', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/O ritual foi interrompido: Erro de teste/i)).toBeVisible();
  });

  test('dashboard.html redireciona pra login.html sem sessão', async ({ page }) => {
    await page.goto('/agora-slu/dashboard.html', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/login\.html/, { timeout: 10_000 });
    expect(page.url()).toContain('next=');
  });

  test('perfil.html redireciona pra login.html sem sessão', async ({ page }) => {
    await page.goto('/agora-slu/perfil.html', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/login\.html/, { timeout: 10_000 });
  });

  test('admin.html mostra o formulário de login (não o painel) sem sessão', async ({ page }) => {
    await page.goto('/agora-slu/admin.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#loginBox')).toBeVisible();
    await expect(page.locator('#adminContent')).toBeHidden();
  });
});

test.describe('Navegação e páginas públicas', () => {
  test('index.html carrega e tem os links principais no menu', async ({ page }) => {
    await page.goto('/agora-slu/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('nav.cultus-nav a[href="perfil.html"]')).toHaveCount(1);
    await expect(page.locator('nav.cultus-nav a[href="investigacoes.html"]')).toHaveCount(1);
    await expect(page.locator('nav.cultus-nav a[href="provida.html"]')).toHaveCount(1);
    await expect(page.locator('nav.cultus-nav a[href="busca.html"]')).toHaveCount(1);
  });

  test('investigacoes.html carrega sem exigir login (visualização pública)', async ({ page }) => {
    await page.goto('/agora-slu/investigacoes.html', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Investigação Coletiva de Arquivos/i })).toBeVisible();
  });

  test('busca.html tem o campo de busca', async ({ page }) => {
    await page.goto('/agora-slu/busca.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#q')).toBeVisible();
  });

  test('novo-aeon.html carrega o texto e o formulário de ingresso', async ({ page }) => {
    await page.goto('/agora-slu/novo-aeon.html', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'O Novo Æon', exact: true })).toBeVisible();
    await expect(page.locator('#aNome')).toBeVisible();
    await expect(page.locator('#aEmail')).toBeVisible();
    await expect(page.locator('#aTelefone')).toBeVisible();
  });

  test('páginas removidas (terminal, evidencias, mobile, grafo, clube-do-livro) não existem mais', async ({ request }) => {
    for (const pagina of ['terminal.html', 'evidencias.html', 'mobile.html', 'grafo.html', 'clube-do-livro.html']) {
      const res = await request.get(`/agora-slu/${pagina}`);
      expect(res.status(), `${pagina} deveria retornar 404`).toBe(404);
    }
  });
});

test.describe('PWA', () => {
  test('manifest.json é referenciado e é um JSON válido', async ({ page, request }) => {
    await page.goto('/agora-slu/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', 'manifest.json');

    const res = await request.get('/agora-slu/manifest.json');
    expect(res.ok()).toBeTruthy();
    const manifest = await res.json();
    expect(manifest.name).toContain('Ágora');
    expect(Array.isArray(manifest.icons)).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('sw.js existe e não intercepta chamadas de API', async ({ request }) => {
    const res = await request.get('/agora-slu/sw.js');
    expect(res.ok()).toBeTruthy();
    const corpo = await res.text();
    expect(corpo).toContain("pathname.startsWith('/api/')");
  });
});
