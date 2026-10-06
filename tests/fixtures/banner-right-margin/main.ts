import { mount } from 'svelte';
import BannerRightMargin from './BannerRightMargin.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Banner right margin fixture mount target is missing');
}
mount(BannerRightMargin, { target });
