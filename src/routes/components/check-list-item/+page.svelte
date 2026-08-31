<script lang="ts">
  import CheckListItem from '$lib/CheckListItem/CheckListItem.svelte';

  let checklistItem1 = $state(false);
  let checklistItem2 = $state(true);
  let checklistItem3 = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>CheckListItem</h1>
</div>

<div class="demo-row" style="flex-direction: column; max-width: 400px;">
  <CheckListItem text="Set up project" bind:checked={checklistItem1} />
  <CheckListItem text="Install dependencies" bind:checked={checklistItem2} />
  <CheckListItem text="Write tests" bind:checked={checklistItem3} />
  <CheckListItem text="Required business details" disabled testId="check-list-item-disabled">
    {#snippet checkboxLabel()}
      <span data-pw="check-list-item-disabled-content">
        Required business details <strong>Required</strong>
      </span>
    {/snippet}
  </CheckListItem>
</div>
