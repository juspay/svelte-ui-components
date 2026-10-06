// The consumer stylesheet is put at the head of the page, ahead of every sheet the build links:
// an app's global stylesheet precedes the library's, and that order is what lets a
// zero-specificity rule of the app's tie a rule of the library's. Importing it as CSS would leave
// the order to the build, which links a component's stylesheet ahead of the entry's own once a
// second fixture shares that component. The spec checks the order it actually got.
import consumerCss from './consumer.css?raw';
import { mount } from 'svelte';
import ScrollerScrollbar from './ScrollerScrollbar.svelte';

const consumerSheet = document.createElement('style');
consumerSheet.textContent = consumerCss;
document.head.prepend(consumerSheet);

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Scroller scrollbar fixture mount target is missing');
}
mount(ScrollerScrollbar, { target });
