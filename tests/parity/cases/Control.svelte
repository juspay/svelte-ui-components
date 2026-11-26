<script module>
  // Proves the comparator works: `same` must match, `mismatch` must NOT match.
  export const cases = [{ name: 'same' }, { name: 'mismatch', expectDifferent: true }];
</script>

<script>
  import { stack } from './_kit.js';
  let { name } = $props();
  const width = name === 'mismatch' && stack === 'candidate' ? 101 : 100;
</script>

<div style="width: {width}px; height: 20px; background: #000000;"></div>
