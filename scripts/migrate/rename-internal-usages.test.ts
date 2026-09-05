import { describe, expect, it } from 'vitest';
import { transformSvelte } from '../codemod/transform.ts';
import { INTERNAL_OPTIONS, planInternalRenames } from './rename-internal-usages.ts';

describe('internal import resolution', () => {
  it('treats a default import of $lib/X/X.svelte as component X', () => {
    const source = [
      '<script>',
      `  import Toggle from '$lib/Toggle/Toggle.svelte';`,
      '</script>',
      '',
      '<Toggle onClick={() => {}} />',
      ''
    ].join('\n');
    const result = transformSvelte(source, 'Demo.svelte', INTERNAL_OPTIONS);
    expect(result.code).toContain('<Toggle onclick={() => {}} />');
    expect(result.warnings).toHaveLength(0);
  });

  it('treats a relative default import of ../X/X.svelte as component X', () => {
    const source = [
      '<script>',
      `  import Toggle from '../Toggle/Toggle.svelte';`,
      '</script>',
      '',
      '<Toggle onClick={() => {}} />',
      ''
    ].join('\n');
    const result = transformSvelte(source, 'Cell.svelte', INTERNAL_OPTIONS);
    expect(result.code).toContain('<Toggle onclick={() => {}} />');
  });

  it('leaves a consumer-style package import to the default resolver', () => {
    const source = [
      '<script>',
      `  import Toggle from '@juspay/svelte-ui-components';`,
      '</script>',
      '',
      '<Toggle onClick={() => {}} />',
      ''
    ].join('\n');
    const result = transformSvelte(source, 'App.svelte', INTERNAL_OPTIONS);
    expect(result.changed).toBe(false);
  });
});

describe('the repository itself', () => {
  it('never uses a spelling it deprecates', () => {
    // Anything listed here is a call site that would warn in a consumer's
    // console for code they did not write, and break outright in 4.0.0.
    const plan = planInternalRenames(process.cwd());

    expect(plan.map((item) => `${item.file}: ${item.propsRenamed}`)).toEqual([]);
  });
});
