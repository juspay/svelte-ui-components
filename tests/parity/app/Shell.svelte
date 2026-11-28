<script>
  const modules = import.meta.glob('./cases/*.svelte', { eager: true });
  const registry = {};
  for (const [path, mod] of Object.entries(modules)) {
    const file = path.split('/').pop().replace('.svelte', '');
    registry[file] = mod;
  }
  window.__cases = Object.entries(registry)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([file, mod]) =>
      (mod.cases ?? []).map((entry) => {
        const visualDifferenceOnly = typeof entry.knownVisualDifference === 'string';
        const reason = visualDifferenceOnly ? entry.knownVisualDifference : entry.knownDifference;
        return {
          id: `${file}:${entry.name}`,
          actions: entry.actions ?? [],
          expectDifferent: entry.expectDifferent === true,
          allowBlank: entry.allowBlank === true,
          knownDifference: typeof reason === 'string' ? reason : null,
          visualDifferenceOnly
        };
      })
    );
  const id = new URLSearchParams(location.search).get('case');
  const [file, caseName] = id === null ? [null, null] : id.split(':');
  const Case = file !== null && registry[file] ? registry[file].default : null;
</script>

{#if Case !== null}
  <div id="stage"><Case name={caseName} /></div>
  <!-- Tab from the last control lands here on both stacks. Without it Chrome may wrap focus back to
       the first control depending on load, which shows up as an extra focus event. -->
  <button id="focus-sink" style="position: absolute; left: -9999px; top: 0;">end</button>
{/if}
