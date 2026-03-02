import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { firstSlug } from './components/_nav';

export function load() {
  redirect(307, `${base}/components/${firstSlug}`);
}
