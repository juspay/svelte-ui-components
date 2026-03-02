<script lang="ts">
  import Avatar from '$lib/Avatar/Avatar.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Media</span>
  <h1>Avatar</h1>
</div>

<div class="demo-row" style="align-items: center;">
  <Avatar src="https://i.pravatar.cc/150?img=5" alt="Jane Doe" name="Jane Doe" size="small" />
  <Avatar src="https://i.pravatar.cc/150?img=12" alt="John Smith" name="John Smith" size="medium" />
  <Avatar alt="Alice Wonderland" name="Alice Wonderland" size="large" />
  <Avatar alt="Bob" name="Bob" size="medium" />
</div>
