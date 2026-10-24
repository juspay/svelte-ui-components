import { defineConfig, devices } from '@playwright/test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const artifactRoot =
  process.env.SUI_AUDIT_ARTIFACT_ROOT ?? join(tmpdir(), 'sui-native-adversarial');
export default defineConfig({
  testDir: 'tests',
  testMatch: 'native-adversarial.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  use: {
    headless: true,
    testIdAttribute: 'data-pw',
    video: 'on',
    trace: 'on',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  outputDir: join(artifactRoot, 'results'),
  reporter: [
    ['line'],
    ['json', { outputFile: join(artifactRoot, 'report.json') }],
    ['html', { open: 'never', outputFolder: join(artifactRoot, 'html') }]
  ]
});
