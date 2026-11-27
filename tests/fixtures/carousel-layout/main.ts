import { mount } from 'svelte';
import CarouselLayout from './CarouselLayout.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Carousel layout fixture mount target is missing');
}
mount(CarouselLayout, { target });
