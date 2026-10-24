<script lang="ts">
  import NativeFileInput from '$lib/NativeFileInput/NativeFileInput.svelte';
  import Button from '$lib/Button/Button.svelte';
  let selected = $state('No file selected');
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>NativeFileInput</h1>
</div>
<h2 class="demo-examples-heading">Native picker and form reset</h2>
<form onsubmit={(event) => event.preventDefault()} onreset={() => (selected = 'No file selected')}>
  <label for="native-file-example">Attachment</label>
  <NativeFileInput
    name="attachment"
    required
    nativeAttrs={{ id: 'native-file-example' }}
    onfiles={(files) =>
      (selected = files.map((file) => file.name).join(', ') || 'No file selected')}
    testId="native-file-example"
  />
  <p role="status">{selected}</p>
  <Button type="reset" text="Reset selection" />
</form>
<p>
  FileInput retains the released drop-region behavior. NativeFileInput opts into native form
  participation.
</p>
