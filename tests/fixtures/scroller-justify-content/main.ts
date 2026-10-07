// The consumer stylesheet is put at the head of the page, ahead of every sheet the build links:
// an app's global stylesheet precedes the library's, and that order is what lets an app rule of
// low specificity meet a library rule on the same footing, and an app's `@layer base` come
// before the library's anonymous layer. Importing it as CSS would leave the order to the build,
// which links a component's stylesheet ahead of the entry's own once a second fixture shares
// that component. The spec checks the order it actually got.
import consumerCss from './consumer.css?raw';
import { mount } from 'svelte';
import ScrollerJustifyContent from './ScrollerJustifyContent.svelte';

const consumerSheet = document.createElement('style');
consumerSheet.textContent = consumerCss;
document.head.prepend(consumerSheet);

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Scroller justify-content fixture mount target is missing');
}
mount(ScrollerJustifyContent, { target });
