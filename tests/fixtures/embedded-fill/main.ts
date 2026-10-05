import { mount } from 'svelte';
import EmbeddedFill from './EmbeddedFill.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Embedded fill fixture mount target is missing');
}
mount(EmbeddedFill, { target });
