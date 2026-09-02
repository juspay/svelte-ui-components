import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'scripts/codemod/**/*.{test,spec}.{js,ts}',
      'scripts/migrate/**/*.{test,spec}.{js,ts}'
    ]
  }
});
