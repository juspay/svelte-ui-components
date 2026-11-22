import { redirect } from '@sveltejs/kit';
import { firstSlug } from './components/_nav';
import { componentHref } from './components/_href';

export function load() {
  redirect(307, componentHref(firstSlug));
}
