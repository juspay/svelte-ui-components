import { mount } from 'svelte';
import ChatMessageListInner from './ChatMessageListInner.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Chat message list inner fixture mount target is missing');
}
mount(ChatMessageListInner, { target });
