<script module>
  const wait = ['wait', 600];
  export const cases = [
    { name: 'no-trigger-collapsed' },
    { name: 'no-trigger-expanded' },
    { name: 'trigger-collapsed' },
    { name: 'trigger-expanded' },
    {
      name: 'trigger-click-opens',
      actions: [['click', '[data-pw="trigger"]'], wait]
    },
    {
      name: 'trigger-click-open-then-close',
      actions: [['click', '[data-pw="trigger"]'], wait, ['click', '[data-pw="trigger"]'], wait]
    },
    {
      name: 'keyboard-enter-opens',
      actions: [['focus', '.accordion-trigger'], ['key', 'Enter'], wait]
    },
    {
      name: 'keyboard-space-opens',
      actions: [['focus', '.accordion-trigger'], ['key', ' '], wait]
    },
    { name: 'trigger-focus', actions: [['focus', '.accordion-trigger']] },
    { name: 'disabled-collapsed' },
    { name: 'disabled-expanded' },
    {
      name: 'disabled-click-ignored',
      actions: [['click', '.accordion-trigger', { force: true }], wait]
    },
    { name: 'lazy-collapsed' },
    {
      name: 'lazy-opens-then-closes',
      actions: [['click', '.accordion-trigger'], wait, ['click', '.accordion-trigger'], wait]
    },
    { name: 'lazy-expanded' },
    { name: 'content-after-mount', actions: [['click', '#t'], wait] },
    { name: 'external-expand-controlled', actions: [['click', '#t'], wait] },
    { name: 'bound-expand-recorded', actions: [['click', '.accordion-trigger'], wait] },
    { name: 'classes-and-trigger-classes' },
    { name: 'test-id-and-panel-id' },
    { name: 'native-collapsed' },
    { name: 'native-expanded' },
    { name: 'native-summary-click', actions: [['click', 'summary'], wait] },
    { name: 'native-disabled-click', actions: [['click', 'summary'], wait] },
    { name: 'native-attrs-and-summary-attrs' },
    { name: 'native-attachment-and-element' },
    { name: 'trigger-snippet-uses-expanded', actions: [['click', '.accordion-trigger'], wait] },
    { name: 'long-content-expanded' },
    { name: 'css-variables-transition-and-cursor' }
  ];
</script>

<script>
  import { Accordion } from 'sui-under-test';
  import { log, note } from './_kit.js';
  let { name } = $props();

  let later = $state(false);
  let controlled = $state(false);
  let bound = $state(false);
  let el = $state(null);
  $effect(() => note('bound', bound));
  $effect(() => note('element', el ? el.tagName : null));
  const attach = (node) => {
    note('attached', node.tagName);
  };
</script>

<div style="width: 360px; font-family: sans-serif;">
  {#if name === 'no-trigger-collapsed'}
    <Accordion>
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
    <div>After</div>
  {:else if name === 'no-trigger-expanded'}
    <Accordion expand>
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
    <div>After</div>
  {:else if name === 'trigger-collapsed'}
    <Accordion>
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Header</div>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'trigger-expanded'}
    <Accordion expand>
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Header</div>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'trigger-click-opens' || name === 'trigger-click-open-then-close'}
    <Accordion ontoggle={log('ontoggle')}>
      {#snippet trigger()}<div data-pw="trigger" style="padding: 8px; background: #e5e7eb;">
          Header
        </div>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'keyboard-enter-opens' || name === 'keyboard-space-opens'}
    <Accordion ontoggle={log('ontoggle')}>
      {#snippet trigger()}<span>Header</span>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'trigger-focus'}
    <Accordion>
      {#snippet trigger()}<span>Header</span>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'disabled-collapsed'}
    <Accordion disabled>
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Locked</div>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'disabled-expanded'}
    <Accordion disabled expand>
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Locked</div>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'disabled-click-ignored'}
    <Accordion disabled ontoggle={log('ontoggle')}>
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Locked</div>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'lazy-collapsed'}
    <Accordion lazy>
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Lazy</div>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">
          Lazy body
        </div>{/snippet}
    </Accordion>
  {:else if name === 'lazy-opens-then-closes'}
    <Accordion lazy ontoggle={log('ontoggle')}>
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Lazy</div>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">
          Lazy body
        </div>{/snippet}
    </Accordion>
  {:else if name === 'lazy-expanded'}
    <Accordion lazy expand>
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Lazy</div>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">
          Lazy body
        </div>{/snippet}
    </Accordion>
  {:else if name === 'content-after-mount'}
    <button id="t" onclick={() => (later = true)}>load</button>
    <Accordion expand>
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Header</div>{/snippet}
      {#snippet children()}
        <div style="background: #eef2ff;">
          <div style="padding: 12px;">Always here</div>
          {#if later}<div style="padding: 40px; background: #bbf7d0;">Arrived later</div>{/if}
        </div>
      {/snippet}
    </Accordion>
  {:else if name === 'external-expand-controlled'}
    <button id="t" onclick={() => (controlled = !controlled)}>toggle</button>
    <Accordion expand={controlled} ontoggle={log('ontoggle')}>
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Header</div>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'bound-expand-recorded'}
    <Accordion bind:expand={bound}>
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Header</div>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'classes-and-trigger-classes'}
    <Accordion expand classes="panel-class" triggerClasses="trigger-class">
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Header</div>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'test-id-and-panel-id'}
    <Accordion expand testId="acc" panelId="my-panel">
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Header</div>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'native-collapsed'}
    <Accordion native>
      {#snippet trigger({ expanded })}<span>Native {expanded ? 'open' : 'closed'}</span>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'native-expanded'}
    <Accordion native expand>
      {#snippet trigger({ expanded })}<span>Native {expanded ? 'open' : 'closed'}</span>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'native-summary-click'}
    <Accordion native ontoggle={log('ontoggle')}>
      {#snippet trigger({ expanded })}<span>Native {expanded ? 'open' : 'closed'}</span>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'native-disabled-click'}
    <Accordion native disabled ontoggle={log('ontoggle')}>
      {#snippet trigger()}<span>Native locked</span>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'native-attrs-and-summary-attrs'}
    <Accordion
      native
      expand
      testId="nat"
      classes="native-class"
      triggerClasses="summary-class"
      nativeAttrs={{ style: 'border: 2px solid #d97706; padding: 4px;', id: 'nat-details' }}
      summaryAttrs={{ style: 'color: #1d4ed8; font-weight: 700;' }}
    >
      {#snippet trigger()}<span>Attr summary</span>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'native-attachment-and-element'}
    <Accordion native expand attachment={attach} bind:element={el}>
      {#snippet trigger()}<span>Attached</span>{/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'trigger-snippet-uses-expanded'}
    <Accordion>
      {#snippet trigger({ expanded })}
        <div style="padding: 8px; background: {expanded ? '#bbf7d0' : '#fecaca'};">
          {expanded ? 'Collapse' : 'Expand'}
        </div>
      {/snippet}
      {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
    </Accordion>
  {:else if name === 'long-content-expanded'}
    <Accordion expand>
      {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Header</div>{/snippet}
      {#snippet children()}
        <div style="padding: 12px; background: #eef2ff;">
          {#each [1, 2, 3, 4, 5, 6, 7, 8] as n (n)}<p style="margin: 0 0 8px;">
              Paragraph {n} of the body content.
            </p>{/each}
        </div>
      {/snippet}
    </Accordion>
  {:else if name === 'css-variables-transition-and-cursor'}
    <div
      style="--accordion-transition-duration: 0s; --accordion-trigger-cursor: help; --accordion-align-self: stretch; display: grid; grid-template-rows: auto 120px; height: 200px; background: #f3f4f6;"
    >
      <Accordion expand>
        {#snippet trigger()}<div style="padding: 8px; background: #e5e7eb;">Header</div>{/snippet}
        {#snippet children()}<div style="padding: 12px; background: #eef2ff;">Body</div>{/snippet}
      </Accordion>
    </div>
  {/if}
</div>
