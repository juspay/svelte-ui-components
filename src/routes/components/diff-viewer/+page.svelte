<script lang="ts">
  import DiffViewer from '#lib/DiffViewer/DiffViewer.svelte';
  import type { DiffViewerHunk } from '#lib/DiffViewer/properties.js';

  const hunks: DiffViewerHunk[] = [
    {
      header: '@@ -1,3 +1,3 @@',
      lines: [
        { kind: 'context', oldLine: 1, newLine: 1, text: '## Release checklist' },
        { kind: 'remove', oldLine: 2, text: '- [ ] Verify the browser build' },
        { kind: 'add', newLine: 2, text: '- [x] Verify the browser build' },
        { kind: 'context', oldLine: 3, newLine: 3, text: '- [ ] Publish the release' }
      ]
    }
  ];
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>DiffViewer</h1>
  <p class="page-description">Review added, removed, and unchanged lines in a file.</p>
</div>

<h2 class="demo-examples-heading">Expand a file change</h2>
<div class="demo-row">
  <DiffViewer path="docs/release.md" {hunks} additions={1} deletions={1} collapseThreshold={2} />
</div>
