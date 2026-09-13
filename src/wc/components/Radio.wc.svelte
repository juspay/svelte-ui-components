<svelte:options
  customElement={{
    tag: 'sui-radio',
    shadow: 'open',
    extend: extendRadio,
    props: {
      errorMessage: { type: 'String', attribute: 'error-message' },
      infoMessage: { type: 'String', attribute: 'info-message' },
      invalid: { type: 'Boolean', reflect: true },
      name: { type: 'String', reflect: true },
      value: { type: 'String', reflect: true },
      selectedValue: { type: 'String', reflect: true, attribute: 'selected-value' },
      text: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      required: { type: 'Boolean', reflect: true },
      form: { type: 'String', reflect: true },
      onchange: { type: 'Object' }
    }
  }}
/>

<script module lang="ts">
  import { formAssociated } from '../form-associated';
  import { getActiveElement } from '$lib/_interaction/focus';

  /**
   * Same constraint as `HostConstructor` in form-associated.ts: a class
   * expression can extend a type parameter only when its construct signature
   * is exactly `new (...args: any[])` (TS2545), and the class below declares
   * no constructor of its own, so nothing is ever actually built with `any`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type HostConstructor = new (...args: any[]) => HTMLElement;

  function readStringProp(host: Element, prop: string): string | null {
    const raw = Reflect.get(host, prop);
    return typeof raw === 'string' ? raw : null;
  }

  function isDisabledHost(host: Element): boolean {
    return Reflect.get(host, 'disabled') === true;
  }

  /**
   * `Reflect.get`'s declared signature is
   * `<T, P>(target: T, key: P) => P extends keyof T ? T[P] : any`, so a
   * literal `'onchange'` key -- unlike the widened `prop: string` above --
   * resolves through `keyof HTMLElement` to the NATIVE `GlobalEventHandlers`
   * `onchange` (`(this: GlobalEventHandlers, ev: Event) => any`), not this
   * wrapper's own `onchange: (value: string) => void` prop of the same name;
   * calling that shape as a bare function fails with a `this`-context error.
   * Reading the key through a `string`-typed local, exactly as `readStringProp`
   * does, keeps `Reflect.get` on its `any` branch instead.
   */
  function readOnChange(host: HTMLElement): ((value: string) => void) | null {
    const key: string = 'onchange';
    const raw = Reflect.get(host, key);
    return typeof raw === 'function' ? raw : null;
  }

  /**
   * The other `<sui-radio>` elements this one forms a group with.
   *
   * Native radios are grouped by `name` within the nearest form owner, or
   * within the whole tree when there is none -- two same-named groups in two
   * different forms on one page stay separate. `host.form` (from
   * `formAssociated`, applied before this mixin below) gives the same answer
   * here; falling back to `getRootNode()` covers the un-form-owned case and
   * keeps a group from reaching into an unrelated shadow tree.
   */
  function groupMembers(host: HTMLElement): HTMLElement[] {
    const name = host.getAttribute('name');
    if (name === null || name.length === 0) {
      return [host];
    }
    const formOwner = Reflect.get(host, 'form');
    const scope = formOwner instanceof HTMLFormElement ? formOwner : host.getRootNode();
    if (
      !(scope instanceof HTMLFormElement) &&
      !(scope instanceof Document) &&
      !(scope instanceof ShadowRoot)
    ) {
      return [host];
    }
    const members: HTMLElement[] = [];
    scope.querySelectorAll('sui-radio').forEach((node) => {
      if (node instanceof HTMLElement && node.getAttribute('name') === name) {
        members.push(node);
      }
    });
    return members;
  }

  /**
   * Selecting one native radio unchecks every other one sharing its `name` --
   * for free, because the browser groups same-named radios that share a tree.
   * Each `<sui-radio>` puts its native input in its OWN shadow root, so that
   * grouping never happens; this stands in for it, writing the chosen value
   * onto every member's `selectedValue` the way one `bind:selectedValue`
   * shared across several Svelte-build instances would. `selectedValue` is
   * already watched by `formAssociated`, so a value set here reaches
   * ElementInternals -- and so FormData -- through the same path a click does.
   *
   * `notify` fires the target's `onchange` the way a real 'change' event
   * would. A click already dispatches one natively, so that path passes
   * `false` to avoid firing twice; arrow-key selection has no native event to
   * rely on, so that path passes `true`.
   */
  function broadcastSelection(host: HTMLElement, notify: boolean): void {
    const value = readStringProp(host, 'value');
    if (value === null) {
      return;
    }
    for (const member of groupMembers(host)) {
      if (readStringProp(member, 'selectedValue') !== value) {
        Reflect.set(member, 'selectedValue', value);
      }
    }
    if (notify) {
      readOnChange(host)?.(value);
    }
  }

  const FORWARD_KEYS = new Set(['ArrowDown', 'ArrowRight']);
  const BACKWARD_KEYS = new Set(['ArrowUp', 'ArrowLeft']);

  /**
   * Wraps `formAssociated`'s output with the cross-shadow-root coordination a
   * native radio group gets automatically. Composed rather than folded into
   * `formAssociated` itself: every other control that mixin serves has no
   * notion of a "group" of sibling elements, only of its own form.
   */
  function radioGrouping<T extends HostConstructor>(Base: T): T {
    const Grouped = class extends Base {
      #onChange = (event: Event): void => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement) || input.type !== 'radio' || !input.checked) {
          return;
        }
        broadcastSelection(this, false);
      };

      // Same WAI-ARIA shape as Tabs' tablist keyboard handling: arrow keys
      // rove with wrap-around, Home/End jump to the ends (see Tabs.svelte's
      // nextEnabledIndex/edgeIndex). Unlike Tabs, moving always selects --
      // a native radio group has no separate "manual" activation mode.
      #onKeydown = (event: KeyboardEvent): void => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
          return;
        }
        const forward = FORWARD_KEYS.has(event.key);
        const backward = BACKWARD_KEYS.has(event.key);
        const isHome = event.key === 'Home';
        const isEnd = event.key === 'End';
        if (!forward && !backward && !isHome && !isEnd) {
          return;
        }
        const ownInput = this.shadowRoot?.querySelector('input');
        if (!(ownInput instanceof HTMLInputElement)) {
          return;
        }
        // `getActiveElement` resolves via `node.getRootNode()`: passing the
        // HOST would resolve to the document, whose `activeElement` reports
        // the host itself (never an element inside its shadow root), so the
        // comparison would always fail. Passing the input resolves to its own
        // shadow root instead, whose `activeElement` is the input exactly
        // while it holds focus -- see getActiveElement's own doc comment.
        if (getActiveElement(ownInput) !== ownInput) {
          return;
        }
        const members = groupMembers(this).filter((member) => !isDisabledHost(member));
        if (members.length < 2) {
          return;
        }
        const currentIndex = members.indexOf(this);
        if (currentIndex === -1) {
          return;
        }
        event.preventDefault();
        const targetIndex = isHome
          ? 0
          : isEnd
            ? members.length - 1
            : (currentIndex + (forward ? 1 : -1) + members.length) % members.length;
        const target = members[targetIndex];
        const targetInput = target.shadowRoot?.querySelector('input');
        if (targetInput instanceof HTMLInputElement) {
          targetInput.focus();
        }
        broadcastSelection(target, true);
      };

      connectedCallback(): void {
        // @ts-expect-error -- the base class defines it; TS cannot see through T.
        super.connectedCallback?.();
        // `change` does not compose across the shadow boundary, so it is
        // listened for where it actually fires, same as formAssociated's own
        // choice for the same event. `keydown` does compose, so the host is
        // enough for it.
        this.shadowRoot?.addEventListener('change', this.#onChange, true);
        this.addEventListener('keydown', this.#onKeydown);
      }

      disconnectedCallback(): void {
        this.shadowRoot?.removeEventListener('change', this.#onChange, true);
        this.removeEventListener('keydown', this.#onKeydown);
        // @ts-expect-error -- the base class defines it; TS cannot see through T.
        super.disconnectedCallback?.();
      }
    };

    return Grouped as unknown as T;
  }

  function extendRadio<T extends HostConstructor>(Base: T): T {
    return radioGrouping(formAssociated({ selected: 'selectedValue' })(Base));
  }
</script>

<script lang="ts">
  import Radio from '$lib/Radio/Radio.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onchange is this element's ONLY callback prop, and it collides with
  // HTMLElement's own onchange accessor with no exception recorded for
  // 'sui-radio:onchange' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS -- so
  // dispatchEvents intentionally returns nothing for it. It stays callback-only.
  // Called anyway, on every wrapper, rather than special-cased away: proves the
  // collision guard produces this no-op instead of assuming it -- which matters
  // more here than on a plain wrapper, since `extend: extendRadio` (above)
  // registers hostEl through a SUBCLASS chain (radioGrouping -> formAssociated ->
  // the Svelte-generated class that actually declares `onchange`), so the
  // declared accessor sits two prototype levels above hostEl, not one.
  // `declaredCallbackPropNames` (src/wc/dispatch.ts) already walks the whole
  // chain up to HTMLElement.prototype for exactly this reason, so the collision
  // is still found; see dispatch-pagination-pill-radio.test.ts for the assertion that it
  // actually is. The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Radio {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (inline-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-radio-display, inline-block);
  }
</style>
