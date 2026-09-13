/**
 * Form participation for the custom-element build.
 *
 * The two builds diverge at the form boundary. `<Input name="email">` in Svelte
 * renders a real `<input name>` that the surrounding `<form>` collects; the
 * matching `<sui-input name="email">` renders that same input inside a shadow
 * root, where the form cannot see it. It contributes nothing to `FormData`,
 * `form.reset()` leaves it alone, `form.checkValidity()` never consults it, and
 * `:invalid` on the host never matches.
 *
 * `ElementInternals` is the platform's answer and the only one that delivers
 * reset and constraint validation as well as `FormData` -- a hidden input would
 * get the first and none of the rest.
 *
 * Two things have to be watched, because a control's value changes two ways:
 *
 * 1. Programmatically (`el.value = 'x'`). Svelte defines each prop as an
 *    accessor on the generated class's prototype, and `extend` runs after that,
 *    so a subclass can wrap the setter through `super`.
 * 2. By the user typing or clicking. That never touches the host property, so
 *    the inner control's own `input`/`change` events are the signal. The
 *    listener goes on the shadow root rather than the host, because that is the
 *    only position that catches every control. A native `change` is not
 *    composed, so it stops at the shadow boundary and a host listener would
 *    never see it. Checkbox is the exception and does not weaken the rule: its
 *    inner input never receives a real click (it is `aria-hidden`,
 *    `tabindex="-1"`, `pointer-events: none`), so `Checkbox.svelte` dispatches
 *    `input`/`change` itself with `composed: true` -- and a composed event still
 *    passes through the shadow root on its way out, so the same listener sees
 *    it. Listening on the shadow root is therefore the superset position, not a
 *    bet on non-composed events.
 */

/** Which of a wrapper's props carry the value a form should collect. */
export type FormValueBinding = {
  /** Prop holding the submitted value. Defaults to `'value'`. */
  readonly value?: string;
  /**
   * Prop holding checkedness, for checkbox- and switch-shaped controls. When
   * set, an unchecked control submits nothing, mirroring native behaviour.
   */
  readonly checked?: string;
  /**
   * Prop holding the selected member of a radio group. The control submits its
   * own `value` only while the two match, which is how a native radio group
   * contributes exactly one entry.
   */
  readonly selected?: string;
  /**
   * Prop holding an ARRAY of selected values, for a multi-select control.
   *
   * Distinct from `selected`, which is radio semantics -- one chosen member
   * compared against this control's own `value`. A multi-select contributes one
   * FormData entry PER member under the element's own name, which is how a
   * native `<select multiple>` behaves, and a single `setFormValue(string)` call
   * cannot express that. When the prop is absent or empty the control falls
   * through to its single-value path, so a Combobox left in single-select mode
   * submits exactly what it did before.
   */
  readonly values?: string;
  /**
   * Set when the control's inner native input is NOT its value.
   *
   * The inner control is normally the honest answer -- see `#innerControl` -- but
   * a combobox's visible `<input>` holds the user's SEARCH QUERY, not the
   * selection. Preferring it made `<sui-combobox name="tag" value="b">` submit
   * nothing at all: the query box is empty, and an empty inner value reads as
   * "no value" rather than "ask the props". Measured, not predicted -- the form
   * collected `{}` for both single- and multi-select until this existed.
   */
  readonly innerControlIsNotTheValue?: boolean;
  /** Prop that disables the control. Defaults to `'disabled'`. */
  readonly disabled?: string;
  /** Prop that marks the control required. Defaults to `'required'`. */
  readonly required?: string;
  /**
   * Value submitted for a checked control that carries no explicit `value`.
   * The platform default for a valueless checked input is the string `'on'`.
   */
  readonly checkedFallback?: string;
};

/**
 * TypeScript accepts a class expression extending a type parameter only when
 * that parameter's construct signature is exactly `new (...args: any[])`
 * (TS2545); `never[]` and `unknown[]` are both rejected, and the class must
 * declare no constructor of its own, which is why internals are attached
 * lazily below. This is the one `any` the language leaves no way around.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HostConstructor = new (...args: any[]) => HTMLElement;

const readString = (host: HTMLElement, prop: string | undefined): string | null => {
  if (typeof prop !== 'string') {
    return null;
  }
  const raw = Reflect.get(host, prop);
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }
  return typeof raw === 'string' ? raw : String(raw);
};

const readBoolean = (host: HTMLElement, prop: string | undefined): boolean =>
  typeof prop === 'string' && Reflect.get(host, prop) === true;

/**
 * Wraps a Svelte-generated custom element class so the element takes part in
 * its form. Pass the result as `customElement.extend`.
 */
export function formAssociated(binding: FormValueBinding = {}) {
  const valueProp = binding.value ?? 'value';
  const disabledProp = binding.disabled ?? 'disabled';
  const requiredProp = binding.required ?? 'required';
  const checkedFallback = binding.checkedFallback ?? 'on';

  return <T extends HostConstructor>(Base: T): T => {
    // Every prop that can change what the form should collect. Wrapping their
    // setters is what makes a programmatic assignment reach setFormValue.
    const watched = [
      valueProp,
      binding.checked,
      binding.selected,
      binding.values,
      disabledProp,
      requiredProp
    ].filter((prop): prop is string => typeof prop === 'string');

    const Associated = class extends Base {
      static readonly formAssociated = true;

      #internals: ElementInternals | null = null;
      #internalsAttached = false;
      #defaults: Map<string, unknown> = new Map();
      #captured = false;

      /**
       * Attached on first use rather than in a constructor. A mixin over a
       * generic base cannot declare a constructor without widening its
       * parameters to `any[]`, and the element needs no internals before its
       * first sync. `attachInternals` throws if called twice -- and an element
       * can be constructed and upgraded in ways that make that easy to hit --
       * so the attempt is made exactly once, whether or not it yields anything.
       */
      #elementInternals(): ElementInternals | null {
        if (this.#internalsAttached) {
          return this.#internals;
        }
        this.#internalsAttached = true;
        if (typeof this.attachInternals === 'function') {
          this.#internals = this.attachInternals();
        }
        return this.#internals;
      }

      get internals(): ElementInternals | null {
        return this.#elementInternals();
      }

      /**
       * The native control the component renders inside its shadow root, if any.
       * It is preferred over the host's props as the source of truth, because a
       * wrapper spreads props into its component without binding them back: when
       * the user clicks `<sui-checkbox>`, the component flips its own state and
       * the host prop stays at whatever the markup said. The inner control is
       * what the form would have collected had it not been in a shadow root, so
       * it is the honest answer.
       */
      #innerControl(): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null {
        const root = this.shadowRoot;
        if (root === null) {
          return null;
        }
        const found = root.querySelector('input, textarea, select');
        if (
          found instanceof HTMLInputElement ||
          found instanceof HTMLTextAreaElement ||
          found instanceof HTMLSelectElement
        ) {
          return found;
        }
        return null;
      }

      /** The value this control contributes, or null when it contributes none. */
      #formValue(): string | FormData | null {
        if (readBoolean(this, disabledProp)) {
          return null;
        }
        // Multi-select first: the array is the value when there is one, and the
        // single-value paths below cannot represent it. `setFormValue` takes a
        // FormData precisely so one control can contribute several entries, all
        // under the element's own name -- the same shape a `<select multiple>`
        // submits. An empty or absent array falls through, so single-select mode
        // is untouched.
        const valuesProp = binding.values;
        const multi =
          typeof valuesProp === 'string' && valuesProp !== ''
            ? Reflect.get(this, valuesProp)
            : null;
        // An empty array ends the lookup only when the array IS this control's value
        // prop, as it is for Select (`value: string[]` for one selection or many). When
        // `values` names a SEPARATE prop -- Combobox's `selected`, empty in single-select
        // mode -- an empty array means "not multi-selecting" and the single `value` is
        // still authoritative, so the fall-through below has to stay intact.
        if (Array.isArray(multi) && (multi.length > 0 || valuesProp === valueProp)) {
          const name = this.getAttribute('name');
          if (typeof name === 'string' && name !== '') {
            const data = new FormData();
            for (const member of multi) {
              data.append(name, typeof member === 'string' ? member : String(member));
            }
            // An EMPTY array returns empty FormData, not a fall-through. Once this
            // prop holds an array it IS the control's value, and "nothing selected"
            // must submit nothing -- which is what a native `<select multiple>` does,
            // and what the Svelte build's per-selection hidden inputs do by rendering
            // none. Falling through sent the array itself down the single-value path,
            // where `String([])` is '' and the form collected `name=''`: an empty entry
            // that reads to a server as "the user chose the empty option".
            return data;
          }
        }
        const inner = binding.innerControlIsNotTheValue === true ? null : this.#innerControl();
        if (inner !== null) {
          if (inner.disabled) {
            return null;
          }
          if (
            inner instanceof HTMLInputElement &&
            (inner.type === 'checkbox' || inner.type === 'radio')
          ) {
            if (!inner.checked) {
              return null;
            }
            return inner.value === '' ? checkedFallback : inner.value;
          }
          return inner.value === '' ? null : inner.value;
        }
        if (typeof binding.checked === 'string') {
          return readBoolean(this, binding.checked)
            ? (readString(this, valueProp) ?? checkedFallback)
            : null;
        }
        if (typeof binding.selected === 'string') {
          const own = readString(this, valueProp);
          const selected = readString(this, binding.selected);
          return own !== null && own === selected ? own : null;
        }
        return readString(this, valueProp);
      }

      #syncValidity(): void {
        const internals = this.#elementInternals();
        if (internals === null) {
          return;
        }
        const isRequired = readBoolean(this, requiredProp);
        const missing = isRequired && this.#formValue() === null;
        if (missing) {
          // The anchor is the host: the inner control lives in a shadow root,
          // and reportValidity() must scroll and point at something the user
          // and the form can both see.
          internals.setValidity({ valueMissing: true }, 'Please fill in this field.', this);
          return;
        }
        internals.setValidity({});
      }

      syncFormState(): void {
        this.#elementInternals()?.setFormValue(this.#formValue());
        this.#syncValidity();
      }

      #captureDefaults(): void {
        if (this.#captured) {
          return;
        }
        this.#captured = true;
        for (const prop of watched) {
          this.#defaults.set(prop, Reflect.get(this, prop));
        }
      }

      connectedCallback(): void {
        // @ts-expect-error -- the base class defines it; TS cannot see through T.
        super.connectedCallback?.();
        this.#captureDefaults();
        // The inner control's own events are the only signal that the user --
        // rather than the page -- changed the value. They are listened for on the
        // shadow root because that catches both kinds: a native `change` is not
        // composed and never leaves the root, and Checkbox's deliberately
        // composed one (see the module comment) passes through it on the way out.
        // `click` and `keyup` are watched on the host as well: a component that
        // flips its own state renders on the next tick and emits no native event
        // at all, so the only reliable signal is "the user did something, re-read
        // afterwards".
        this.shadowRoot?.addEventListener('input', this.#onInnerChange, true);
        this.shadowRoot?.addEventListener('change', this.#onInnerChange, true);
        this.addEventListener('click', this.#onInnerChange, true);
        this.addEventListener('keyup', this.#onInnerChange, true);
        // Props are applied asynchronously on first render, so the initial
        // value is not readable yet in this tick.
        queueMicrotask(() => this.syncFormState());
      }

      disconnectedCallback(): void {
        this.shadowRoot?.removeEventListener('input', this.#onInnerChange, true);
        this.shadowRoot?.removeEventListener('change', this.#onInnerChange, true);
        this.removeEventListener('click', this.#onInnerChange, true);
        this.removeEventListener('keyup', this.#onInnerChange, true);
        // @ts-expect-error -- the base class defines it; TS cannot see through T.
        super.disconnectedCallback?.();
      }

      #onInnerChange = (): void => {
        // Deferred: the component re-renders in response to the same event, so
        // reading synchronously would capture the state before the flip.
        this.syncFormState();
        queueMicrotask(() => this.syncFormState());
        setTimeout(() => this.syncFormState(), 0);
      };

      formResetCallback(): void {
        this.#captureDefaults();
        for (const [prop, value] of this.#defaults) {
          Reflect.set(this, prop, value);
        }
        queueMicrotask(() => this.syncFormState());
      }

      formDisabledCallback(): void {
        this.syncFormState();
      }

      get form(): HTMLFormElement | null {
        return this.#elementInternals()?.form ?? null;
      }

      get name(): string | null {
        return this.getAttribute('name');
      }

      get type(): string {
        return this.localName;
      }

      get willValidate(): boolean {
        return this.#elementInternals()?.willValidate ?? false;
      }

      get validity(): ValidityState | null {
        return this.#elementInternals()?.validity ?? null;
      }

      get validationMessage(): string {
        return this.#elementInternals()?.validationMessage ?? '';
      }

      checkValidity(): boolean {
        return this.#elementInternals()?.checkValidity() ?? true;
      }

      reportValidity(): boolean {
        return this.#elementInternals()?.reportValidity() ?? true;
      }
    };

    for (const prop of watched) {
      const descriptor = Object.getOwnPropertyDescriptor(Base.prototype, prop);
      if (descriptor === undefined || typeof descriptor.set !== 'function') {
        continue;
      }
      const { get, set } = descriptor;
      Object.defineProperty(Associated.prototype, prop, {
        configurable: true,
        enumerable: descriptor.enumerable,
        get,
        set(this: HTMLElement & { syncFormState: () => void }, next: unknown) {
          set.call(this, next);
          // Synchronously for the prop-derived path, then again after the
          // component has re-rendered: the value the form should collect is
          // read from the inner control, which does not exist in its new state
          // until Svelte has flushed.
          this.syncFormState();
          queueMicrotask(() => this.syncFormState());
          setTimeout(() => this.syncFormState(), 0);
        }
      });
    }

    return Associated as unknown as T;
  };
}
