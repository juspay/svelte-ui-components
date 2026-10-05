import { mount } from 'svelte';
import TablePaginator from './TablePaginator.svelte';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('Table paginator fixture mount target is missing');
}
mount(TablePaginator, { target });
