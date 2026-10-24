import type { Snippet } from 'svelte';
import type { HTMLAnchorAttributes } from 'svelte/elements';

export type LinkProperties = {
  href: string;
  target?: string;
  rel?: string;
  classes?: string;
  testId?: string;
  element?: HTMLAnchorElement | null;
  nativeAttrs?: Omit<
    HTMLAnchorAttributes,
    'href' | 'target' | 'rel' | 'class' | 'onclick' | 'onkeydown'
  >;
  children?: Snippet;
  onclick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
