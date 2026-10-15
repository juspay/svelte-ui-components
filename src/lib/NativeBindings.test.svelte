<script lang="ts">
  import Accordion from './Accordion/Accordion.svelte';
  import Button from './Button/Button.svelte';
  import Dialog from './Dialog/Dialog.svelte';
  import FileInput from './FileInput/FileInput.svelte';
  import IframeViewer from './IframeViewer/IframeViewer.svelte';
  import Img from './Img/Img.svelte';
  import Input from './Input/Input.svelte';
  import Link from './Link/Link.svelte';
  import MediaPlayer from './MediaPlayer/MediaPlayer.svelte';
  import Select from './Select/Select.svelte';

  let action = $state<HTMLButtonElement>();
  let dialog = $state<HTMLDialogElement>();
  let file = $state<HTMLInputElement>();
  let frame = $state<HTMLIFrameElement>();
  let image = $state<HTMLImageElement>();
  let field = $state<HTMLInputElement>();
  let anchor = $state<HTMLAnchorElement>();
  let media = $state<HTMLVideoElement>();
  let selection = $state<HTMLSelectElement>();
  let disclosure = $state<HTMLDetailsElement>();
  const refs = $derived([
    action,
    dialog,
    file,
    frame,
    image,
    field,
    anchor,
    media,
    selection,
    disclosure
  ]);
</script>

<Button unstyled bind:element={action}>Action</Button>
<Dialog bind:element={dialog}>Details</Dialog>
<FileInput native bind:element={file} />
<IframeViewer unstyled src="about:blank" bind:element={frame} />
<Img unstyled src="/fixture.png" alt="" bind:element={image} />
<Input native value="" bind:element={field} />
<Link href="/next" bind:element={anchor}>Next</Link>
<MediaPlayer unstyled type="video" src="" autoplay={false} playing={false} bind:element={media} />
<Select native items={['One']} bind:element={selection} />
<Accordion native bind:element={disclosure}>
  {#snippet trigger()}More{/snippet}
  Content
</Accordion>
<span data-testid="bound-ref-count">{refs.filter(Boolean).length}</span>
