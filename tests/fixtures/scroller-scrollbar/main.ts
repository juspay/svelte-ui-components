// The consumer stylesheet is imported ahead of the component on purpose: an app's global
// stylesheet precedes the library's, and that order is what lets a zero-specificity rule of
// the app's tie a rule of the library's. The spec checks the order it actually got.
import './consumer.css';
import { mount } from 'svelte';
import ScrollerScrollbar from './ScrollerScrollbar.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Scroller scrollbar fixture mount target is missing');
}
mount(ScrollerScrollbar, { target });
