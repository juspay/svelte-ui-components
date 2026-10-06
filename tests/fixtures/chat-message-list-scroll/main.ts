import { mount } from 'svelte';
import ChatMessageListScroll from './ChatMessageListScroll.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Chat message list scroll fixture mount target is missing');
}
mount(ChatMessageListScroll, { target });
