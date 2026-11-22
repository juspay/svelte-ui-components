<script lang="ts">
  import Link from '#lib/Link/Link.svelte';
  import { resolve } from '$app/paths';
</script>

<h1>Link</h1>
<p>A real anchor with host-owned appearance and native browser navigation.</p>
<Link href={resolve('components/dialog')} testId="link-native-navigation"
  >Explore dialog integration</Link
>
