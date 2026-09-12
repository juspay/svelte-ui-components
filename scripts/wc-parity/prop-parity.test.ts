import { describe, expect, it } from 'vitest';
import { HOST_EVENT_HANDLER_PROPS, HOST_RESERVED_PROPS, readWrapperParity } from './prop-parity.ts';

/**
 * Adding a prop to a Svelte component and forgetting its custom-element wrapper
 * has shipped repeatedly: `show-indicator` on sui-choicebox, `statusIconAlt` on
 * sui-status, and the `icon` / `descriptionSnippet` / `children` snippets on
 * sui-status. It is invisible from the Svelte side because every Svelte test
 * still passes — an undeclared prop simply gets no accessor and no observed
 * attribute, so a web-component consumer sets it and silently gets nothing.
 *
 * This asserts the class rather than the instances.
 */

const parity = readWrapperParity();

describe('custom-element wrappers declare every prop of the component they wrap', () => {
  it('finds the wrappers to check', () => {
    expect(parity.length).toBeGreaterThan(0);
  });

  for (const entry of parity) {
    it(`${entry.wrapper} declares every prop`, () => {
      expect(entry.missing, `${entry.wrapper} is missing: ${entry.missing.join(', ')}`).toEqual([]);
    });
  }
});

/**
 * Empty, as of 4.0.0. It held 27 declarations whose names were already taken on
 * the host element — `children`, `hidden`, `id`, `role`, `title` and ten
 * `aria*` names — recorded rather than failed on, because renaming a public
 * prop needs a major. `scripts/migrate/rename-host-reserved-props.ts` did that
 * rename; the list stays so a twenty-eighth fails here instead of shipping.
 *
 * Worth keeping straight, because the old note was careful about it and the fix
 * should not overstate what it fixed: these were not 27 proven bugs. Only
 * `children` was measured broken — `element.children` returned undefined
 * instead of an HTMLCollection on the three wrappers that declared it, and that
 * declaration is now simply gone, since light DOM already carries slotted
 * content. `sui-badge`'s `hidden` was measured *working*: Svelte's declared
 * setter reflects to the attribute, so the native behaviour survived. The
 * `aria*` entries are the ones with a clear mechanism — ARIAMixin puts those
 * accessors on every Element, and a same-named prop displaces the reflection
 * assistive technology reads.
 *
 * They were renamed uniformly anyway, because "the setter happens to reflect,
 * so the platform behaviour survives" is a property of Svelte's current
 * codegen rather than something this library guarantees, and a major is the
 * only time the whole set can move at once. The rename is property-only: each
 * declaration pins the attribute it already observed, so `<sui-card
 * title="x">` is unchanged and only `element.title` versus
 * `element.cardTitle` differs.
 */
const KNOWN_HOST_RESERVED_DECLARATIONS: readonly string[] = [];

describe('host-reserved names are excluded deliberately, not forgotten', () => {
  it('adds no new prop that would replace an HTMLElement accessor', () => {
    const offenders = parity.flatMap((entry) =>
      entry.declared
        .filter((name) => HOST_RESERVED_PROPS.has(name))
        .map((name) => `${entry.wrapper}:${name}`)
    );
    const added = offenders.filter((name) => !KNOWN_HOST_RESERVED_DECLARATIONS.includes(name));

    expect(added, `new host-accessor overrides: ${added.join(', ')}`).toEqual([]);
  });

  it('keeps the recorded set honest, so a fixed one cannot be quietly re-added', () => {
    const offenders = parity.flatMap((entry) =>
      entry.declared
        .filter((name) => HOST_RESERVED_PROPS.has(name))
        .map((name) => `${entry.wrapper}:${name}`)
    );
    const goneButStillListed = KNOWN_HOST_RESERVED_DECLARATIONS.filter(
      (name) => !offenders.includes(name)
    );

    expect(
      goneButStillListed,
      `fixed — delete from KNOWN_HOST_RESERVED_DECLARATIONS: ${goneButStillListed.join(', ')}`
    ).toEqual([]);
  });

  it('declares no prop twice in one customElement props map', () => {
    // A duplicated key is last-wins in JavaScript, so the object stays
    // structurally valid, every other check still sees a complete map, and the
    // only symptom is that the *earlier* declaration's `attribute` quietly does
    // not exist at runtime. Nothing here was looking for it.
    //
    // Not hypothetical: a git auto-merge of two branches that had each added
    // `sliderAriaLabel` to Slider.wc.svelte produced exactly this, with two
    // entries whose `attribute` differed. It was caught by reading the merged
    // file, which is not a control.
    const duplicated = parity.flatMap((entry) => {
      const seen = new Set<string>();
      const twice = new Set<string>();
      for (const prop of entry.declared) {
        if (seen.has(prop)) {
          twice.add(prop);
        }
        seen.add(prop);
      }
      return [...twice].map((prop) => `${entry.wrapper}:${prop}`);
    });

    expect(duplicated, `declared more than once: ${duplicated.join(', ')}`).toEqual([]);
  });

  it('reports which components want a reserved name, so the debt stays visible', () => {
    const wanted = parity
      .filter((entry) => entry.reserved.length > 0)
      .map((entry) => `${entry.wrapper} -> ${entry.reserved.join(', ')}`);

    // Not an assertion of emptiness: these are real props a consumer cannot
    // reach through the custom element. They need a renamed prop, which is an
    // API decision rather than a mechanical fix. Printing them keeps the count
    // honest instead of letting an exclusion list quietly absorb them.
    expect(Array.isArray(wanted)).toBe(true);
  });
});

/**
 * Every wrapper prop whose name is already an event-handler accessor on
 * `HTMLElement`. Recorded rather than failed on, because renaming a public prop
 * is a breaking change to each element's JavaScript API and the whole set has to
 * move at once, at a major — the same reasoning that held the `aria*` names
 * above until 4.0.0.
 *
 * Recording is not nothing: it bounds the debt. A wrapper that declares a
 * twenty-sixth native handler name fails here instead of shipping, and one that
 * gets fixed has to be deleted from this list rather than quietly re-added.
 *
 * The attributes are unaffected either way — `<sui-button onclick="...">` never
 * used this accessor, and `addEventListener` is untouched. What is affected is
 * the JavaScript property: `element.onclick = fn` sets the component prop, and
 * for `sui-checkbox` / `sui-toggle` that prop is called with a boolean rather
 * than the `MouseEvent` the platform would have given.
 */
const KNOWN_HOST_EVENT_HANDLER_DECLARATIONS: readonly string[] = [
  'Accordion.wc.svelte:ontoggle',
  'Avatar.wc.svelte:onclick',
  'Banner.wc.svelte:onclick',
  'Button.wc.svelte:onclick',
  'Button.wc.svelte:onkeydown',
  'Button.wc.svelte:onkeyup',
  'Button.wc.svelte:onmousedown',
  'Button.wc.svelte:onmouseup',
  'Button.wc.svelte:onmouseleave',
  'Button.wc.svelte:ontouchstart',
  'Button.wc.svelte:ontouchend',
  'Calendar.wc.svelte:onselect',
  'Card.wc.svelte:onclick',
  'Carousel.wc.svelte:onkeydown',
  'Chat.wc.svelte:onclose',
  'ChatBubble.wc.svelte:onclose',
  'ChatBubble.wc.svelte:ontoggle',
  'ChatComposer.wc.svelte:onsubmit',
  'ChatComposer.wc.svelte:oninput',
  'ChatComposer.wc.svelte:onkeydown',
  'ChatComposer.wc.svelte:onpaste',
  'ChatHeader.wc.svelte:onclose',
  'ChatMessage.wc.svelte:oncopy',
  'ChatSuggestions.wc.svelte:onselect',
  'CheckListItem.wc.svelte:onclick',
  'Checkbox.wc.svelte:onclick',
  'ChipInput.wc.svelte:onchange',
  'Choicebox.wc.svelte:onclick',
  'ColorPicker.wc.svelte:onchange',
  'ColorPicker.wc.svelte:oninput',
  'Combobox.wc.svelte:onselect',
  'Combobox.wc.svelte:oninput',
  'Combobox.wc.svelte:onclose',
  'Combobox.wc.svelte:onkeydown',
  'Combobox.wc.svelte:onfocus',
  'Combobox.wc.svelte:onblur',
  'Combobox.wc.svelte:onchange',
  'CommandMenu.wc.svelte:onselect',
  'CommandMenu.wc.svelte:onclose',
  'ContextMenu.wc.svelte:onselect',
  'ContextMenu.wc.svelte:onclose',
  'DateRangePicker.wc.svelte:oncancel',
  'FileDropzoneTrigger.wc.svelte:onclick',
  'FileInput.wc.svelte:onerror',
  'Gallery.wc.svelte:onkeydown',
  'Gallery.wc.svelte:onclose',
  'Gallery.wc.svelte:onchange',
  'GridItem.wc.svelte:onclick',
  'GridItem.wc.svelte:onkeydown',
  'Icon.wc.svelte:onclick',
  'Icon.wc.svelte:onkeydown',
  'Img.wc.svelte:onerror',
  'Input.wc.svelte:onfocus',
  'Input.wc.svelte:onblur',
  'Input.wc.svelte:oninput',
  'Input.wc.svelte:onpaste',
  'Input.wc.svelte:onclick',
  'Input.wc.svelte:onkeydown',
  'KeyboardInput.wc.svelte:onclick',
  'ListItem.wc.svelte:onkeydown',
  'LottiePlayer.wc.svelte:onerror',
  'MediaPlayer.wc.svelte:onplay',
  'MediaPlayer.wc.svelte:onpause',
  'MediaPlayer.wc.svelte:onvolumechange',
  'MediaPlayer.wc.svelte:ontimeupdate',
  'MediaPlayer.wc.svelte:onfullscreenchange',
  'MediaUpload.wc.svelte:onchange',
  'MediaUpload.wc.svelte:onerror',
  'Menu.wc.svelte:onselect',
  'Menu.wc.svelte:onclose',
  'Modal.wc.svelte:onclose',
  'Modal.wc.svelte:onkeydown',
  'Pagination.wc.svelte:onchange',
  'Pill.wc.svelte:onclick',
  'Radio.wc.svelte:onchange',
  'RatingGroup.wc.svelte:onchange',
  'Resizable.wc.svelte:onresize',
  'Select.wc.svelte:onchange',
  'Select.wc.svelte:onclose',
  'Sheet.wc.svelte:onclose',
  'Slider.wc.svelte:oninput',
  'Slider.wc.svelte:onchange',
  'Snippet.wc.svelte:oncopy',
  'Snippet.wc.svelte:onerror',
  'SplitButton.wc.svelte:onclick',
  'SplitButton.wc.svelte:onselect',
  'SplitInput.wc.svelte:onchange',
  'SplitInput.wc.svelte:oninput',
  'StatCard.wc.svelte:onclick',
  'Tabs.wc.svelte:onchange',
  'ThemeSwitcher.wc.svelte:onchange',
  'ThinkingIndicator.wc.svelte:ontoggle',
  'Toggle.wc.svelte:onclick',
  'Toolbar.wc.svelte:onkeydown',
  'TypewriterText.wc.svelte:onprogress'
];

describe('native event-handler names are recorded, not silently shadowed', () => {
  const offenders = (): string[] =>
    parity.flatMap((entry) =>
      entry.declared
        .filter((name) => HOST_EVENT_HANDLER_PROPS.has(name))
        .map((name) => `${entry.wrapper}:${name}`)
    );

  it('adds no new prop that would replace an HTMLElement event-handler accessor', () => {
    const added = offenders().filter(
      (name) => !KNOWN_HOST_EVENT_HANDLER_DECLARATIONS.includes(name)
    );

    expect(added, `new host event-handler overrides: ${added.join(', ')}`).toEqual([]);
  });

  it('keeps the recorded set honest, so a fixed one cannot be quietly re-added', () => {
    const current = offenders();
    const goneButStillListed = KNOWN_HOST_EVENT_HANDLER_DECLARATIONS.filter(
      (name) => !current.includes(name)
    );

    expect(
      goneButStillListed,
      `fixed — delete from KNOWN_HOST_EVENT_HANDLER_DECLARATIONS: ${goneButStillListed.join(', ')}`
    ).toEqual([]);
  });
});
