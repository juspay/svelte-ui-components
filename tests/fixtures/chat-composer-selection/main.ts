import { mount } from 'svelte';
import ChatComposerSelection from './ChatComposerSelection.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('ChatComposer selection fixture mount target is missing');
}
mount(ChatComposerSelection, { target });
