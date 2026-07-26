import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npx --yes http-server . -p 4173 -c-1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 30_000
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] }
    }
  ]
});

