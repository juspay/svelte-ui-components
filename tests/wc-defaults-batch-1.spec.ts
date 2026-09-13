import { expect, test } from '@playwright/test';

/**
 * Regression coverage for wc-defaults-batch-1.
 *
 * Each of these nine wrappers declared its default-bearing slot as
 * `{#snippet x()}<slot name="x"></slot>{/snippet}`. A statically declared snippet is
 * always `typeof === 'function'`, so the wrapped component's own
 * `{#if typeof x === 'function'}...{:else}<default/>{/if}` branch can never take the
 * `{:else}` path through the custom element -- the component's built-in default can
 * never render, host content or not.
 *
 * The fix moves each default into the `<slot>` tag's fallback content
 * (`<slot name="x">{default}</slot>`). This is NOT plain native-browser slot-fallback
 * semantics -- Svelte compiles a `<slot name="x">` written inside a `{#snippet}` that
 * is forwarded into a child component to a call of its own legacy slot-forwarding
 * runtime helper, `slot(anchor, $props, name, slotProps, fallbackFn)` (see
 * `node_modules/svelte/src/internal/client/dom/blocks/slot.js`), not to
 * `document.createElement('slot')`. Confirmed against Pill.wc.svelte's already-fixed,
 * compiled `dismissIcon` snippet in `dist-wc/index.js`.
 *
 * Svelte's custom-element wrapper (`SvelteElement` in
 * `.../dom/elements/custom-element.js`) only creates a genuine native `<slot>` DOM
 * element for a given name -- appended into the shadow tree -- when the custom
 * element's real light-DOM children already include one tagged `slot="x"` at
 * `connectedCallback` time (`get_custom_elements_slots()` inspects `this.childNodes`
 * once, before the component is created). When the host supplies no such child, no
 * `<slot>` element is created anywhere in the shadow tree for that name -- the `slot()`
 * runtime helper instead calls the compiled `fallbackFn` directly. So the two
 * directions this suite checks are asymmetric, not mirror images:
 *
 *  - No host content: assert there is NO `slot[name="x"]` element in the shadow tree
 *    at all (`querySelector` returns `null`), and separately assert the component's
 *    own default markup rendered in its place.
 *  - Host content supplied: a real `<slot>` element IS created, and
 *    `HTMLSlotElement.assignedNodes({ flatten: true })` reliably reports the
 *    host-provided node as assigned to it.
 *
 * Default-content checks that read `.innerHTML` are written to look for a concrete
 * child element (e.g. an `<svg>`) rather than a nonzero string length: Svelte's own
 * `<!---->` anchor/comment nodes for `{#if}`/`{@render}` blocks are always present in
 * `innerHTML` regardless of whether anything visible rendered, so a raw length check
 * can pass even when the wrapping element around a still-buggy conditional is itself
 * unconditionally rendered by the source component (this was caught for
 * `sui-split-button`'s `.split-button-arrow`, which SplitButton.svelte always renders
 * around its `{#if typeof dropdownIcon === 'function'}` branch).
 */

const WC_SCRIPT = { path: 'dist-wc/index.js', type: 'module' } as const;

async function waitForTag(page: import('@playwright/test').Page, tag: string): Promise<void> {
  await page.addScriptTag(WC_SCRIPT);
  await page.waitForFunction((t) => typeof customElements.get(t) !== 'undefined', tag, {
    timeout: 15_000
  });
}

test.describe('wc-defaults-batch-1: native slot fallback restores built-in defaults', () => {
  test('sui-checkbox: checkmark and indeterminate dash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await waitForTag(page, 'sui-checkbox');

    const measured = await page.evaluate(async () => {
      // Direction (a): no host content -> component's own checkmark renders.
      const defaultBox = document.createElement('sui-checkbox');
      defaultBox.setAttribute('text', 'Accept terms');
      defaultBox.setAttribute('checked', '');
      document.body.append(defaultBox);

      // Direction (a), indeterminate: component's own dash renders.
      const indeterminateBox = document.createElement('sui-checkbox');
      indeterminateBox.setAttribute('text', 'Partial');
      indeterminateBox.setAttribute('indeterminate', '');
      document.body.append(indeterminateBox);

      // Direction (b): host content overrides checkmark.
      const overrideBox = document.createElement('sui-checkbox');
      overrideBox.setAttribute('text', 'Accept terms');
      overrideBox.setAttribute('checked', '');
      const hostIcon = document.createElement('span');
      hostIcon.setAttribute('slot', 'checked-icon');
      hostIcon.className = 'host-checkmark';
      hostIcon.textContent = 'HOST-ICON';
      overrideBox.append(hostIcon);
      document.body.append(overrideBox);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const defaultRoot = defaultBox.shadowRoot;
      const defaultSlot = defaultRoot?.querySelector('slot[name="checked-icon"]') ?? null;
      const indeterminateRoot = indeterminateBox.shadowRoot;
      const indeterminateSlot =
        indeterminateRoot?.querySelector('slot[name="indeterminate-icon"]') ?? null;
      const overrideRoot = overrideBox.shadowRoot;
      const overrideSlot = overrideRoot?.querySelector('slot[name="checked-icon"]') ?? null;

      return {
        defaultCheckmarkHasSvg: defaultRoot?.querySelector('.box .icon svg') !== null,
        defaultSlotExists: defaultSlot !== null,
        indeterminateDashHasSvg: indeterminateRoot?.querySelector('.box .icon.dash svg') !== null,
        indeterminateSlotExists: indeterminateSlot !== null,
        overrideAssignedCount:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).length
            : -1,
        overrideAssignedIsHost:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).includes(hostIcon)
            : false
      };
    });

    expect(errors).toEqual([]);
    expect(
      measured.defaultCheckmarkHasSvg,
      "no host content: component's own checkmark svg renders"
    ).toBe(true);
    expect(
      measured.defaultSlotExists,
      'no host content: no native <slot> element is created for checked-icon'
    ).toBe(false);
    expect(
      measured.indeterminateDashHasSvg,
      "no host content: component's own dash svg renders"
    ).toBe(true);
    expect(
      measured.indeterminateSlotExists,
      'no host content: no native <slot> element is created for indeterminate-icon'
    ).toBe(false);
    expect(
      measured.overrideAssignedCount,
      'host content supplied: checked-icon slot has an assigned node'
    ).toBeGreaterThan(0);
    expect(
      measured.overrideAssignedIsHost,
      'host content supplied: the assigned node is the host-provided icon'
    ).toBe(true);
  });

  test('sui-tooltip: bubble text', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await waitForTag(page, 'sui-tooltip');

    const measured = await page.evaluate(async () => {
      const defaultTip = document.createElement('sui-tooltip');
      defaultTip.setAttribute('text', 'Save your changes');
      defaultTip.textContent = 'Trigger';
      document.body.append(defaultTip);

      const overrideTip = document.createElement('sui-tooltip');
      overrideTip.setAttribute('text', 'Save your changes');
      overrideTip.textContent = 'Trigger';
      const hostContent = document.createElement('strong');
      hostContent.setAttribute('slot', 'content');
      hostContent.className = 'host-content';
      hostContent.textContent = 'HOST-CONTENT';
      overrideTip.append(hostContent);
      document.body.append(overrideTip);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const defaultContainer = defaultTip.shadowRoot?.querySelector('.tooltip-container') ?? null;
      defaultContainer?.dispatchEvent(new Event('mouseenter', { bubbles: true }));
      const overrideContainer = overrideTip.shadowRoot?.querySelector('.tooltip-container') ?? null;
      overrideContainer?.dispatchEvent(new Event('mouseenter', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 300));

      const defaultRoot = defaultTip.shadowRoot;
      const defaultSlot = defaultRoot?.querySelector('slot[name="content"]') ?? null;
      const overrideRoot = overrideTip.shadowRoot;
      const overrideSlot = overrideRoot?.querySelector('slot[name="content"]') ?? null;

      return {
        defaultBubbleText: (
          defaultRoot?.querySelector('.tooltip-bubble .tooltip-text')?.textContent ?? ''
        ).trim(),
        defaultSlotExists: defaultSlot !== null,
        overrideAssignedCount:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).length
            : -1,
        overrideAssignedIsHost:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).includes(hostContent)
            : false
      };
    });

    expect(errors).toEqual([]);
    expect(
      measured.defaultBubbleText,
      "no host content: the tooltip's own text prop renders in the bubble"
    ).toBe('Save your changes');
    expect(
      measured.defaultSlotExists,
      'no host content: no native <slot> element is created for content'
    ).toBe(false);
    expect(
      measured.overrideAssignedCount,
      'host content supplied: content slot has an assigned node'
    ).toBeGreaterThan(0);
    expect(
      measured.overrideAssignedIsHost,
      'host content supplied: the assigned node is the host-provided content'
    ).toBe(true);
  });

  test('sui-toolbar: back control and heading text', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await waitForTag(page, 'sui-toolbar');

    const measured = await page.evaluate(async () => {
      const defaultBar = document.createElement('sui-toolbar');
      defaultBar.setAttribute('text', 'Settings');
      document.body.append(defaultBar);

      const overrideBar = document.createElement('sui-toolbar');
      overrideBar.setAttribute('text', 'Settings');
      const hostLeft = document.createElement('span');
      hostLeft.setAttribute('slot', 'left-content');
      hostLeft.className = 'host-left';
      hostLeft.textContent = 'HOST-LEFT';
      overrideBar.append(hostLeft);
      const hostCenter = document.createElement('span');
      hostCenter.setAttribute('slot', 'center-content');
      hostCenter.className = 'host-center';
      hostCenter.textContent = 'HOST-CENTER';
      overrideBar.append(hostCenter);
      document.body.append(overrideBar);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const defaultRoot = defaultBar.shadowRoot;
      const defaultLeftSlot = defaultRoot?.querySelector('slot[name="left-content"]') ?? null;
      const defaultCenterSlot = defaultRoot?.querySelector('slot[name="center-content"]') ?? null;
      const overrideRoot = overrideBar.shadowRoot;
      const overrideLeftSlot = overrideRoot?.querySelector('slot[name="left-content"]') ?? null;
      const overrideCenterSlot = overrideRoot?.querySelector('slot[name="center-content"]') ?? null;

      return {
        defaultBackButton: defaultRoot?.querySelector('.back') !== null,
        defaultLeftSlotExists: defaultLeftSlot !== null,
        defaultHeadingText: (defaultRoot?.querySelector('.text')?.textContent ?? '').trim(),
        defaultCenterSlotExists: defaultCenterSlot !== null,
        overrideLeftAssignedCount:
          overrideLeftSlot instanceof HTMLSlotElement
            ? overrideLeftSlot.assignedNodes({ flatten: true }).length
            : -1,
        overrideLeftIsHost:
          overrideLeftSlot instanceof HTMLSlotElement
            ? overrideLeftSlot.assignedNodes({ flatten: true }).includes(hostLeft)
            : false,
        overrideCenterAssignedCount:
          overrideCenterSlot instanceof HTMLSlotElement
            ? overrideCenterSlot.assignedNodes({ flatten: true }).length
            : -1,
        overrideCenterIsHost:
          overrideCenterSlot instanceof HTMLSlotElement
            ? overrideCenterSlot.assignedNodes({ flatten: true }).includes(hostCenter)
            : false
      };
    });

    expect(errors).toEqual([]);
    expect(
      measured.defaultBackButton,
      "no host content: the toolbar's own back control renders"
    ).toBe(true);
    expect(
      measured.defaultLeftSlotExists,
      'no host content: no native <slot> element is created for left-content'
    ).toBe(false);
    expect(
      measured.defaultHeadingText,
      "no host content: the toolbar's own heading text renders"
    ).toBe('Settings');
    expect(
      measured.defaultCenterSlotExists,
      'no host content: no native <slot> element is created for center-content'
    ).toBe(false);
    expect(
      measured.overrideLeftAssignedCount,
      'host content supplied: left-content slot has an assigned node'
    ).toBeGreaterThan(0);
    expect(
      measured.overrideLeftIsHost,
      'host content supplied: the assigned node is the host-provided left content'
    ).toBe(true);
    expect(
      measured.overrideCenterAssignedCount,
      'host content supplied: center-content slot has an assigned node'
    ).toBeGreaterThan(0);
    expect(
      measured.overrideCenterIsHost,
      'host content supplied: the assigned node is the host-provided center content'
    ).toBe(true);
  });

  test('sui-modal: primary and secondary footer buttons', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await waitForTag(page, 'sui-modal');

    const measured = await page.evaluate(async () => {
      const defaultModal = document.createElement('sui-modal');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (defaultModal as any).footer = {
        primaryButton: { text: 'Save' },
        secondaryButton: { text: 'Cancel' }
      };
      document.body.append(defaultModal);

      const overrideModal = document.createElement('sui-modal');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (overrideModal as any).footer = {
        primaryButton: { text: 'Save' },
        secondaryButton: { text: 'Cancel' }
      };
      const hostFooter = document.createElement('span');
      hostFooter.setAttribute('slot', 'footer');
      hostFooter.className = 'host-footer';
      hostFooter.textContent = 'HOST-FOOTER';
      overrideModal.append(hostFooter);
      document.body.append(overrideModal);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const defaultRoot = defaultModal.shadowRoot;
      const defaultSlot = defaultRoot?.querySelector('slot[name="footer"]') ?? null;
      const overrideRoot = overrideModal.shadowRoot;
      const overrideSlot = overrideRoot?.querySelector('slot[name="footer"]') ?? null;

      return {
        defaultPrimaryText: (
          defaultRoot?.querySelector('.footer-primary-button .button-text')?.textContent ?? ''
        ).trim(),
        defaultSecondaryText: (
          defaultRoot?.querySelector('.footer-secondary-button .button-text')?.textContent ?? ''
        ).trim(),
        defaultSlotExists: defaultSlot !== null,
        overrideAssignedCount:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).length
            : -1,
        overrideAssignedIsHost:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).includes(hostFooter)
            : false
      };
    });

    expect(errors).toEqual([]);
    expect(
      measured.defaultPrimaryText,
      "no host content: the modal's own primary footer button renders"
    ).toBe('Save');
    expect(
      measured.defaultSecondaryText,
      "no host content: the modal's own secondary footer button renders"
    ).toBe('Cancel');
    expect(
      measured.defaultSlotExists,
      'no host content: no native <slot> element is created for footer'
    ).toBe(false);
    expect(
      measured.overrideAssignedCount,
      'host content supplied: footer slot has an assigned node'
    ).toBeGreaterThan(0);
    expect(
      measured.overrideAssignedIsHost,
      'host content supplied: the assigned node is the host-provided footer'
    ).toBe(true);
  });

  test('sui-empty-state: title and description', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await waitForTag(page, 'sui-empty-state');

    const measured = await page.evaluate(async () => {
      const defaultEmpty = document.createElement('sui-empty-state');
      defaultEmpty.setAttribute('title', 'No results');
      defaultEmpty.setAttribute('description', 'Try a different search.');
      document.body.append(defaultEmpty);

      const overrideEmpty = document.createElement('sui-empty-state');
      overrideEmpty.setAttribute('title', 'No results');
      overrideEmpty.setAttribute('description', 'Try a different search.');
      const hostTitle = document.createElement('span');
      hostTitle.setAttribute('slot', 'title-snippet');
      hostTitle.className = 'host-title';
      hostTitle.textContent = 'HOST-TITLE';
      overrideEmpty.append(hostTitle);
      const hostDescription = document.createElement('span');
      hostDescription.setAttribute('slot', 'description-snippet');
      hostDescription.className = 'host-description';
      hostDescription.textContent = 'HOST-DESCRIPTION';
      overrideEmpty.append(hostDescription);
      document.body.append(overrideEmpty);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const defaultRoot = defaultEmpty.shadowRoot;
      const defaultTitleSlot = defaultRoot?.querySelector('slot[name="title-snippet"]') ?? null;
      const defaultDescriptionSlot =
        defaultRoot?.querySelector('slot[name="description-snippet"]') ?? null;
      const overrideRoot = overrideEmpty.shadowRoot;
      const overrideTitleSlot = overrideRoot?.querySelector('slot[name="title-snippet"]') ?? null;
      const overrideDescriptionSlot =
        overrideRoot?.querySelector('slot[name="description-snippet"]') ?? null;

      return {
        defaultTitleText: (
          defaultRoot?.querySelector('.empty-state-title')?.textContent ?? ''
        ).trim(),
        defaultTitleSlotExists: defaultTitleSlot !== null,
        defaultDescriptionText: (
          defaultRoot?.querySelector('.empty-state-description')?.textContent ?? ''
        ).trim(),
        defaultDescriptionSlotExists: defaultDescriptionSlot !== null,
        overrideTitleAssignedCount:
          overrideTitleSlot instanceof HTMLSlotElement
            ? overrideTitleSlot.assignedNodes({ flatten: true }).length
            : -1,
        overrideTitleIsHost:
          overrideTitleSlot instanceof HTMLSlotElement
            ? overrideTitleSlot.assignedNodes({ flatten: true }).includes(hostTitle)
            : false,
        overrideDescriptionAssignedCount:
          overrideDescriptionSlot instanceof HTMLSlotElement
            ? overrideDescriptionSlot.assignedNodes({ flatten: true }).length
            : -1,
        overrideDescriptionIsHost:
          overrideDescriptionSlot instanceof HTMLSlotElement
            ? overrideDescriptionSlot.assignedNodes({ flatten: true }).includes(hostDescription)
            : false
      };
    });

    expect(errors).toEqual([]);
    expect(measured.defaultTitleText, "no host content: the component's own title renders").toBe(
      'No results'
    );
    expect(
      measured.defaultTitleSlotExists,
      'no host content: no native <slot> element is created for title-snippet'
    ).toBe(false);
    expect(
      measured.defaultDescriptionText,
      "no host content: the component's own description renders"
    ).toBe('Try a different search.');
    expect(
      measured.defaultDescriptionSlotExists,
      'no host content: no native <slot> element is created for description-snippet'
    ).toBe(false);
    expect(
      measured.overrideTitleAssignedCount,
      'host content supplied: title-snippet slot has an assigned node'
    ).toBeGreaterThan(0);
    expect(
      measured.overrideTitleIsHost,
      'host content supplied: the assigned node is the host-provided title'
    ).toBe(true);
    expect(
      measured.overrideDescriptionAssignedCount,
      'host content supplied: description-snippet slot has an assigned node'
    ).toBeGreaterThan(0);
    expect(
      measured.overrideDescriptionIsHost,
      'host content supplied: the assigned node is the host-provided description'
    ).toBe(true);
  });

  test('sui-check-list-item: visible label text', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await waitForTag(page, 'sui-check-list-item');

    const measured = await page.evaluate(async () => {
      const defaultItem = document.createElement('sui-check-list-item');
      defaultItem.setAttribute('text', 'Remember me');
      document.body.append(defaultItem);

      const overrideItem = document.createElement('sui-check-list-item');
      overrideItem.setAttribute('text', 'Remember me');
      const hostLabel = document.createElement('span');
      hostLabel.setAttribute('slot', 'checkbox-label');
      hostLabel.className = 'host-label';
      hostLabel.textContent = 'HOST-LABEL';
      overrideItem.append(hostLabel);
      document.body.append(overrideItem);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const defaultRoot = defaultItem.shadowRoot;
      const defaultSlot = defaultRoot?.querySelector('slot[name="checkbox-label"]') ?? null;
      const overrideRoot = overrideItem.shadowRoot;
      const overrideSlot = overrideRoot?.querySelector('slot[name="checkbox-label"]') ?? null;

      return {
        defaultLabelText: (defaultRoot?.querySelector('.text')?.textContent ?? '').trim(),
        defaultSlotExists: defaultSlot !== null,
        overrideAssignedCount:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).length
            : -1,
        overrideAssignedIsHost:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).includes(hostLabel)
            : false
      };
    });

    expect(errors).toEqual([]);
    expect(
      measured.defaultLabelText,
      "no host content: the component's own label text renders"
    ).toBe('Remember me');
    expect(
      measured.defaultSlotExists,
      'no host content: no native <slot> element is created for checkbox-label'
    ).toBe(false);
    expect(
      measured.overrideAssignedCount,
      'host content supplied: checkbox-label slot has an assigned node'
    ).toBeGreaterThan(0);
    expect(
      measured.overrideAssignedIsHost,
      'host content supplied: the assigned node is the host-provided label'
    ).toBe(true);
  });

  test('sui-stat-card: value', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await waitForTag(page, 'sui-stat-card');

    const measured = await page.evaluate(async () => {
      const defaultCard = document.createElement('sui-stat-card');
      defaultCard.setAttribute('title', 'Revenue');
      defaultCard.setAttribute('value', '1,024');
      document.body.append(defaultCard);

      const overrideCard = document.createElement('sui-stat-card');
      overrideCard.setAttribute('title', 'Revenue');
      overrideCard.setAttribute('value', '1,024');
      const hostValue = document.createElement('span');
      hostValue.setAttribute('slot', 'value-snippet');
      hostValue.className = 'host-value';
      hostValue.textContent = 'HOST-VALUE';
      overrideCard.append(hostValue);
      document.body.append(overrideCard);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const defaultRoot = defaultCard.shadowRoot;
      const defaultSlot = defaultRoot?.querySelector('slot[name="value-snippet"]') ?? null;
      const overrideRoot = overrideCard.shadowRoot;
      const overrideSlot = overrideRoot?.querySelector('slot[name="value-snippet"]') ?? null;

      return {
        defaultValueText: (defaultRoot?.querySelector('.statcard-value')?.textContent ?? '').trim(),
        defaultSlotExists: defaultSlot !== null,
        overrideAssignedCount:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).length
            : -1,
        overrideAssignedIsHost:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).includes(hostValue)
            : false
      };
    });

    expect(errors).toEqual([]);
    expect(
      measured.defaultValueText,
      "no host content: the component's own value prop renders"
    ).toBe('1,024');
    expect(
      measured.defaultSlotExists,
      'no host content: no native <slot> element is created for value-snippet'
    ).toBe(false);
    expect(
      measured.overrideAssignedCount,
      'host content supplied: value-snippet slot has an assigned node'
    ).toBeGreaterThan(0);
    expect(
      measured.overrideAssignedIsHost,
      'host content supplied: the assigned node is the host-provided value'
    ).toBe(true);
  });

  test('sui-command-menu: search icon', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await waitForTag(page, 'sui-command-menu');

    const measured = await page.evaluate(async () => {
      const defaultMenu = document.createElement('sui-command-menu');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (defaultMenu as any).items = [{ label: 'Item one', value: 'one' }];
      defaultMenu.setAttribute('open', '');
      document.body.append(defaultMenu);

      const overrideMenu = document.createElement('sui-command-menu');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (overrideMenu as any).items = [{ label: 'Item one', value: 'one' }];
      overrideMenu.setAttribute('open', '');
      const hostIcon = document.createElement('span');
      hostIcon.setAttribute('slot', 'search-icon');
      hostIcon.className = 'host-search-icon';
      hostIcon.textContent = 'HOST-ICON';
      overrideMenu.append(hostIcon);
      document.body.append(overrideMenu);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const defaultRoot = defaultMenu.shadowRoot;
      const defaultSlot = defaultRoot?.querySelector('slot[name="search-icon"]') ?? null;
      const overrideRoot = overrideMenu.shadowRoot;
      const overrideSlot = overrideRoot?.querySelector('slot[name="search-icon"]') ?? null;

      return {
        defaultIconHasSvg: defaultRoot?.querySelector('.command-menu-search-icon svg') !== null,
        defaultSlotExists: defaultSlot !== null,
        overrideAssignedCount:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).length
            : -1,
        overrideAssignedIsHost:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).includes(hostIcon)
            : false
      };
    });

    expect(errors).toEqual([]);
    expect(
      measured.defaultIconHasSvg,
      "no host content: the component's own search icon svg renders"
    ).toBe(true);
    expect(
      measured.defaultSlotExists,
      'no host content: no native <slot> element is created for search-icon'
    ).toBe(false);
    expect(
      measured.overrideAssignedCount,
      'host content supplied: search-icon slot has an assigned node'
    ).toBeGreaterThan(0);
    expect(
      measured.overrideAssignedIsHost,
      'host content supplied: the assigned node is the host-provided icon'
    ).toBe(true);
  });

  test('sui-split-button: dropdown chevron', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await waitForTag(page, 'sui-split-button');

    const measured = await page.evaluate(async () => {
      const defaultButton = document.createElement('sui-split-button');
      defaultButton.setAttribute('text', 'Deploy');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (defaultButton as any).items = [{ label: 'Deploy now', value: 'now' }];
      document.body.append(defaultButton);

      const overrideButton = document.createElement('sui-split-button');
      overrideButton.setAttribute('text', 'Deploy');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (overrideButton as any).items = [{ label: 'Deploy now', value: 'now' }];
      const hostIcon = document.createElement('span');
      hostIcon.setAttribute('slot', 'dropdown-icon');
      hostIcon.className = 'host-dropdown-icon';
      hostIcon.textContent = 'HOST-ICON';
      overrideButton.append(hostIcon);
      document.body.append(overrideButton);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const defaultRoot = defaultButton.shadowRoot;
      const defaultSlot = defaultRoot?.querySelector('slot[name="dropdown-icon"]') ?? null;
      const overrideRoot = overrideButton.shadowRoot;
      const overrideSlot = overrideRoot?.querySelector('slot[name="dropdown-icon"]') ?? null;

      return {
        defaultArrowHasSvg: defaultRoot?.querySelector('.split-button-arrow svg') !== null,
        defaultSlotExists: defaultSlot !== null,
        overrideAssignedCount:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).length
            : -1,
        overrideAssignedIsHost:
          overrideSlot instanceof HTMLSlotElement
            ? overrideSlot.assignedNodes({ flatten: true }).includes(hostIcon)
            : false
      };
    });

    expect(errors).toEqual([]);
    expect(
      measured.defaultArrowHasSvg,
      "no host content: the component's own chevron svg renders"
    ).toBe(true);
    expect(
      measured.defaultSlotExists,
      'no host content: no native <slot> element is created for dropdown-icon'
    ).toBe(false);
    expect(
      measured.overrideAssignedCount,
      'host content supplied: dropdown-icon slot has an assigned node'
    ).toBeGreaterThan(0);
    expect(
      measured.overrideAssignedIsHost,
      'host content supplied: the assigned node is the host-provided icon'
    ).toBe(true);
  });
});
