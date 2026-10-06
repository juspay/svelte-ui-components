import { mount } from 'svelte';
import ImgMaxSize from './ImgMaxSize.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Img max size fixture mount target is missing');
}
mount(ImgMaxSize, { target });
