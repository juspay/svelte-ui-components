<script context="module">
  const tap = (sel) => ['click', sel];
  export const cases = [
    { name: 'default' },
    { name: 'label-plain' },
    { name: 'label-html' },
    { name: 'label-long' },
    { name: 'left-png' },
    { name: 'left-svg' },
    { name: 'left-null' },
    { name: 'left-fallback' },
    { name: 'left-broken-no-fallback' },
    { name: 'right-image' },
    { name: 'right-image-null' },
    { name: 'right-text' },
    { name: 'right-text-empty' },
    { name: 'right-text-null' },
    { name: 'all-props' },
    { name: 'accordion-collapsed' },
    { name: 'accordion-expanded' },
    { name: 'accordion-toggle', actions: [tap('#t'), ['wait', 600]] },
    {
      name: 'accordion-toggle-twice',
      actions: [tap('#t'), ['wait', 600], tap('#t'), ['wait', 600]]
    },
    { name: 'accordion-expanded-prop', actions: [['wait', 600]] },
    { name: 'accordion-off-with-bottom' },
    { name: 'accordion-off-expanded-with-bottom', actions: [['wait', 600]] },
    { name: 'show-loader' },
    { name: 'right-loader' },
    { name: 'right-loader-with-text' },
    { name: 'prevent-focus', actions: [['focus', '.center-text']] },
    { name: 'prevent-focus-item', actions: [['focus', '.item']] },
    { name: 'focus-center-no-prevent', actions: [['focus', '.center-text']] },
    { name: 'slot-left' },
    { name: 'slot-center' },
    { name: 'slot-right' },
    { name: 'slot-bottom-accordion' },
    { name: 'slot-bottom-no-accordion' },
    { name: 'slots-only-default-props' },
    { name: 'slots-all', actions: [['wait', 600]] },
    { name: 'hover', actions: [['hover', '.item']] },
    { name: 'hover-right-image', actions: [['hover', '.right-img']] },
    { name: 'hover-left-image', actions: [['hover', '.left-content img']] },
    { name: 'focus', actions: [['focus', '.item']] },
    { name: 'keydown-enter', actions: [['press', '.item', 'Enter']] },
    { name: 'keydown-top', actions: [['press', '.top-section', 'Space']] },
    { name: 'click-item', actions: [tap('.item')] },
    { name: 'click-top-section', actions: [tap('.top-section')] },
    { name: 'click-left-image', actions: [tap('.left-content img')] },
    { name: 'click-right-image', actions: [tap('.right-img')] },
    { name: 'click-center-text', actions: [tap('.center-text')] },
    {
      name: 'click-by-test-ids',
      actions: [
        tap('[data-pw="left"]'),
        tap('[data-pw="right"]'),
        tap('[data-pw="center"]'),
        tap('[data-pw="top"]'),
        tap('[data-pw="item"]')
      ]
    },
    { name: 'click-slot-content', actions: [tap('#slot-btn')] },
    { name: 'themed' },
    { name: 'themed-hover', actions: [['hover', '.item']] },
    { name: 'themed-loader' },
    { name: 'style-props' },
    { name: 'style-props-right' }
  ];
</script>

<script>
  import { ListItem, defaultListItemProperties } from 'sui-v1-under-test';
  import { log, note, png, svg } from './_kit.js';
  export let name;
  const bad = 'data:image/png;base64,AAAA';
  const base = {
    ...defaultListItemProperties,
    label: 'Pay with card',
    testId: 'item',
    topSectionTestId: 'top',
    leftImageTestId: 'left',
    rightImageTestId: 'right',
    centerTextTestId: 'center'
  };
  const full = {
    ...base,
    leftImageUrl: png,
    rightImageUrl: svg,
    rightContentText: 'INR 100'
  };
  let expanded =
    name === 'accordion-expanded' || name === 'accordion-expanded-prop' || name === 'slots-all';
  $: note('expand', expanded);
</script>

{#if name === 'default'}
  <div style="width: 360px">
    <ListItem
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
    <p>after</p>
  </div>
{:else if name === 'label-plain'}
  <div style="width: 360px">
    <ListItem
      properties={base}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'label-html'}
  <div style="width: 360px">
    <ListItem
      properties={{
        ...base,
        label: '<b>Bold</b> and <i>italic</i><br/><span style="color:#c2410c">orange</span>'
      }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'label-long'}
  <div style="width: 360px">
    <ListItem
      properties={{
        ...full,
        label:
          'A very long label that keeps going and going so that it has to wrap across several lines inside the narrow container width'
      }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'left-png'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...base, leftImageUrl: png }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'left-svg'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...base, leftImageUrl: svg }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'left-null'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...base, leftImageUrl: null, leftImageFallbackUrl: png }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'left-fallback'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...base, leftImageUrl: bad, leftImageFallbackUrl: svg }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'left-broken-no-fallback'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...base, leftImageUrl: bad, leftImageFallbackUrl: null }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'right-image'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...base, rightImageUrl: png }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'right-image-null'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...base, rightImageUrl: null, rightContentText: 'only text' }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'right-text'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...base, rightContentText: 'INR 1,250.00' }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'right-text-empty'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...base, rightContentText: '' }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'right-text-null'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...base, rightContentText: null }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'all-props'}
  <div style="width: 360px">
    <ListItem
      properties={full}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'accordion-collapsed'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...full, useAccordion: true }}
      bind:expand={expanded}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <div slot="bottomContent" style="padding: 8px; background: #fde68a">Hidden details</div>
    </ListItem>
    <p>after</p>
  </div>
{:else if name === 'accordion-expanded'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...full, useAccordion: true }}
      bind:expand={expanded}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <div slot="bottomContent" style="padding: 8px; background: #fde68a">Visible details</div>
    </ListItem>
    <p>after</p>
  </div>
{:else if name === 'accordion-toggle' || name === 'accordion-toggle-twice'}
  <div style="width: 360px">
    <button id="t" on:click={() => (expanded = !expanded)}>toggle</button>
    <ListItem
      properties={{ ...full, useAccordion: true }}
      bind:expand={expanded}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <div slot="bottomContent" style="padding: 8px; background: #bfdbfe; height: 120px">
        Toggled details
      </div>
    </ListItem>
    <p>after</p>
  </div>
{:else if name === 'accordion-expanded-prop'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...full, useAccordion: true }}
      expand={true}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <div slot="bottomContent" style="padding: 8px; background: #bbf7d0">Expanded by prop</div>
    </ListItem>
    <p>after</p>
  </div>
{:else if name === 'accordion-off-with-bottom'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...full, useAccordion: false }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <div slot="bottomContent" style="padding: 8px; background: #fecaca">Never shown</div>
    </ListItem>
    <p>after</p>
  </div>
{:else if name === 'accordion-off-expanded-with-bottom'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...full, useAccordion: false }}
      expand={true}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <div slot="bottomContent" style="padding: 8px; background: #fecaca">Never shown</div>
    </ListItem>
    <p>after</p>
  </div>
{:else if name === 'show-loader'}
  <div style="width: 360px">
    <ListItem
      properties={full}
      showLoader={true}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'right-loader'}
  <div style="width: 360px">
    <ListItem
      properties={base}
      showRightContentLoader={true}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'right-loader-with-text'}
  <div style="width: 360px">
    <ListItem
      properties={full}
      showRightContentLoader={true}
      showLoader={true}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'prevent-focus' || name === 'prevent-focus-item'}
  <div style="width: 360px">
    <ListItem
      properties={full}
      preventFocus={true}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'focus-center-no-prevent'}
  <div style="width: 360px">
    <ListItem
      properties={full}
      preventFocus={false}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'slot-left'}
  <div style="width: 360px">
    <ListItem
      properties={base}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <div slot="leftContent" style="width: 24px; height: 24px; background: #c2410c"></div>
    </ListItem>
  </div>
{:else if name === 'slot-center'}
  <div style="width: 360px">
    <ListItem
      properties={base}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <span slot="centerContent" style="color: #1d4ed8">Center slot</span>
    </ListItem>
  </div>
{:else if name === 'slot-right'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...base, rightContentText: 'text' }}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <span slot="rightContent" style="color: #15803d">Right</span>
    </ListItem>
  </div>
{:else if name === 'slot-bottom-accordion'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...base, useAccordion: true }}
      bind:expand={expanded}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <div slot="bottomContent">Bottom content collapsed</div>
    </ListItem>
    <p>after</p>
  </div>
{:else if name === 'slot-bottom-no-accordion'}
  <div style="width: 360px">
    <ListItem
      properties={base}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <div slot="bottomContent">Bottom content without accordion</div>
    </ListItem>
  </div>
{:else if name === 'slots-only-default-props'}
  <div style="width: 360px">
    <ListItem
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <span slot="centerContent">Only a center slot</span>
    </ListItem>
  </div>
{:else if name === 'slots-all'}
  <div style="width: 360px">
    <ListItem
      properties={{ ...full, useAccordion: true }}
      bind:expand={expanded}
      showRightContentLoader={true}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <div slot="leftContent" style="width: 16px; height: 16px; background: #c2410c"></div>
      <span slot="centerContent" style="color: #1d4ed8">Center</span>
      <span slot="rightContent" style="color: #15803d">R</span>
      <div slot="bottomContent" style="padding: 8px; background: #fde68a">Bottom</div>
    </ListItem>
  </div>
{:else if name === 'hover' || name === 'focus' || name === 'keydown-enter' || name === 'keydown-top'}
  <div style="width: 360px" class="hover-theme">
    <ListItem
      properties={full}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'hover-right-image' || name === 'hover-left-image'}
  <div style="width: 360px" class="hover-theme">
    <ListItem
      properties={full}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'click-item' || name === 'click-top-section' || name === 'click-left-image' || name === 'click-right-image' || name === 'click-center-text' || name === 'click-by-test-ids'}
  <div style="width: 360px">
    <ListItem
      properties={full}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'click-slot-content'}
  <div style="width: 360px">
    <ListItem
      properties={base}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    >
      <button slot="rightContent" id="slot-btn" type="button">go</button>
    </ListItem>
  </div>
{:else if name === 'themed' || name === 'themed-hover'}
  <div class="themed" style="width: 360px">
    <ListItem
      properties={full}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'themed-loader'}
  <div class="themed-loader" style="width: 360px">
    <ListItem
      properties={full}
      showLoader={true}
      showRightContentLoader={true}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'style-props'}
  <div style="width: 360px">
    <ListItem
      properties={full}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
      --list-item-background-color="#eff6ff"
      --list-item-padding="10px"
      --list-item-margin="6px"
      --list-item-border="1px solid #1d4ed8"
      --list-item-border-radius="10px"
      --list-item-box-shadow="0 2px 6px #00000040"
      --list-item-center-text-color="#9a3412"
      --list-item-center-text-font-size="16px"
      --list-item-center-text-font-weight="700"
      --list-item-center-text-padding="0px 12px"
      --list-item-left-image-height="32px"
      --list-item-left-image-width="32px"
      --list-item-left-image-border-radius="50%"
    />
  </div>
{:else if name === 'style-props-right'}
  <div style="width: 360px">
    <ListItem
      properties={full}
      showRightContentLoader={true}
      on:itemClick={log('itemClick')}
      on:topSectionClick={log('topSectionClick')}
      on:leftImageClick={log('leftImageClick')}
      on:rightImageClick={log('rightImageClick')}
      on:centerTextClick={log('centerTextClick')}
      on:keydown={log('keydown')}
      --list-item-right-image-height="28px"
      --list-item-right-image-width="28px"
      --list-item-right-image-padding="3px"
      --list-item-right-image-border-radius="6px"
      --list-item-right-image-margin="0 4px"
      --list-item-right-image-background="#fef3c7"
      --list-item-right-image-border="1px solid #92400e"
      --list-item-right-content-text-color="#be123c"
      --list-item-right-content-text-font-size="15px"
      --list-item-right-content-text-font-weight="700"
      --list-item-right-content-text-padding="0 6px"
      --list-item-right-content-text-vertical-align="center"
      --list-item-right-content-loader-margin="0 8px"
    />
  </div>
{/if}

<style>
  .hover-theme {
    --list-item-hover-background-color: #fef3c7;
    --list-item-hover-border: 1px solid #b45309;
    --list-item-left-image-hover-background: #bfdbfe;
    --list-item-left-image-hover-border: 2px solid #1d4ed8;
    --list-item-right-image-hover-background: #bbf7d0;
    --list-item-right-image-hover-border: 2px solid #15803d;
  }
  .themed {
    --list-item-background-color: #f0fdf4;
    --list-item-hover-background-color: #dcfce7;
    --list-item-border: 2px solid #15803d;
    --list-item-hover-border: 2px solid #166534;
    --list-item-border-radius: 12px;
    --list-item-padding: 12px 8px;
    --list-item-margin: 4px;
    --list-item-box-width: 320px;
    --list-item-box-shadow: 0 1px 4px #00000033;
    --list-item-cursor: default;
    --list-item-transition: all 0s;
    --list-item-center-text-color: #14532d;
    --list-item-center-text-font-size: 18px;
    --list-item-center-text-font-weight: 600;
    --list-item-center-text-padding: 0px 8px;
    --list-item-center-text-justify-content: center;
    --list-item-center-text-vertical-align: flex-start;
    --list-item-center-text-margin: 2px;
    --list-item-center-text-border: 1px dashed #15803d;
    --list-item-center-text-font-family: monospace;
    --list-item-left-image-height: 40px;
    --list-item-left-image-width: 40px;
    --list-item-left-image-padding: 4px;
    --list-item-left-image-border-radius: 8px;
    --list-item-left-image-margin: 0 2px;
    --list-item-left-image-filter: grayscale(1);
    --list-item-left-image-background: #fef08a;
    --list-item-left-image-border: 1px solid #ca8a04;
    --list-item-left-image-object-fit: cover;
    --list-item-right-image-height: 24px;
    --list-item-right-image-width: 24px;
    --list-item-right-image-filter: invert(1);
    --list-item-right-content-text-color: #7f1d1d;
    --list-item-right-content-text-font-family: serif;
    --list-item-right-content-text-justify-content: flex-end;
    --list-item-right-content-text-margin: 0 4px;
    --list-item-right-content-text-border: 1px solid #7f1d1d;
    --list-item-right-content-text-cursor: default;
    --list-item-right-content-display: flex;
    --list-item-left-content-display: flex;
  }
  .themed-loader {
    --list-item-loader-foreground: #be123c;
    --list-item-loader-background: #fff1f2;
    --list-item-loader-foreground-end: #fff1f2;
    --list-item-loader-background-color: #1d4ed855;
    --list-item-loader-duration: 100s;
    --list-item-right-content-loader-margin: 0 10px;
  }
</style>
