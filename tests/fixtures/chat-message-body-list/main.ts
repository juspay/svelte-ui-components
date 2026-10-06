import { mount } from 'svelte';
import ChatMessageBodyList from './ChatMessageBodyList.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Chat message body list fixture mount target is missing');
}
mount(ChatMessageBodyList, { target });
