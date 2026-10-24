import { mount } from 'svelte';
import NativeReview from './NativeReview.svelte';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Native review mount target is missing');
}
mount(NativeReview, { target });
