import { mount } from 'svelte';
import ChatMessageMinWidth from './ChatMessageMinWidth.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('ChatMessage min-width fixture mount target is missing');
}
mount(ChatMessageMinWidth, { target });
