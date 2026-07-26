import { defineConfig, devices } from '@playwright/test';

/**
 * Testes da app Express (participação cívica). Sobe `server.js` na porta 3456.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/civic-*.spec.ts',
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: 'http://127.0.0.1:3560',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node server.js',
    url: 'http://127.0.0.1:3560/participacao',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { ...process.env, PORT: '3560' }
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
