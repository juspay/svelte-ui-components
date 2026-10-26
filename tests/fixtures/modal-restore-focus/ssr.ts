import { render } from 'svelte/server';
import SSRModal from './SSRModal.svelte';
export const checkSSR = (): { getterCalls: number; rendered: boolean } => {
  let getterCalls = 0;
  const result = render(SSRModal, {
    props: {
      resolve: () => {
        getterCalls += 1;
        throw new Error('SSR must not resolve a focus target');
      }
    }
  });
  if (getterCalls !== 0 || !result.body.includes('Server-rendered Modal content')) {
    throw new Error('SSR focus getter/lifecycle contract failed');
  }
  return { getterCalls, rendered: true };
};
