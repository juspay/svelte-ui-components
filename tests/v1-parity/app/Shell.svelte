<script>
  // Legacy (Svelte 4) syntax on purpose: this file is compiled unchanged by both stacks.
  const modules = import.meta.glob('./cases/*.svelte', { eager: true });
  const registry = {};
  for (const [path, mod] of Object.entries(modules)) {
    const file = path.split('/').pop().replace('.svelte', '');
    registry[file] = mod;
  }
  window.__cases = Object.entries(registry)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([file, mod]) =>
      (mod.cases ?? []).map((entry) => ({
        id: `${file}:${entry.name}`,
        actions: entry.actions ?? [],
        expectDifferent: entry.expectDifferent === true,
        allowBlank: entry.allowBlank === true,
        knownDifference: typeof entry.knownDifference === 'string' ? entry.knownDifference : null
      }))
    );
  const id = new URLSearchParams(location.search).get('case');
  let component = null;
  let caseName = null;
  if (id !== null) {
    const [file, name] = id.split(':');
    component = registry[file] ? registry[file].default : null;
    caseName = name;
  }
</script>

{#if component !== null}
  <div id="stage"><svelte:component this={component} name={caseName} /></div>
  <!-- Tab from the last control lands here on both stacks. Without it Chrome may wrap focus back to
       the first control depending on load, which shows up as an extra focus event. -->
  <button id="focus-sink" style="position: absolute; left: -9999px; top: 0;">end</button>
{/if}
