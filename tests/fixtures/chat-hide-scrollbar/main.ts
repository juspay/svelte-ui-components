import { mount } from 'svelte';
import ChatHideScrollbar from './ChatHideScrollbar.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Chat hide scrollbar fixture mount target is missing');
}
mount(ChatHideScrollbar, { target });
