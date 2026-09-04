<svelte:options
  customElement={{
    tag: 'sui-task-list',
    shadow: 'open',
    props: {
      rows: { type: 'Array' },
      onretry: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onRetry: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import TaskList from '$lib/TaskList/TaskList.svelte';
  let props = $props();
</script>

<TaskList {...props} />
