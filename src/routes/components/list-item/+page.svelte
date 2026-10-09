<script lang="ts">
  import ListItem from '$lib/ListItem/ListItem.svelte';

  const svgIcon =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Ccircle cx="12" cy="12" r="8" fill="currentColor"/%3E%3C/svg%3E';
  const transformIconSvg = (svg: string): string =>
    svg.replace('<svg', '<svg data-transformed="true"');

  let suppressedItemClicks = $state(0);
  const handleSuppressedItemClick = (): void => {
    suppressedItemClicks += 1;
  };

  const longValue = 'accounts.payable.department@a-very-long-merchant-domain.example.com';
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>ListItem</h1>
</div>

<h2 class="demo-examples-heading">Examples</h2>

<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <ListItem label="John Doe" rightContentText="$120.00" />
  <ListItem label="Payment Received" rightContentText="Yesterday" />
  <ListItem label="Loading Item" showLoader />
</div>

<h3>SVG transforms and semantic suppression</h3>
<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <ListItem
    label="Transformed SVG icons"
    leftImageUrl={svgIcon}
    rightImageUrl={svgIcon}
    leftImageTestId="list-item-transform-left"
    rightImageTestId="list-item-transform-right"
    transformSvg={transformIconSvg}
  />
  <ListItem
    label="Consumer-owned semantics"
    leftImageUrl={svgIcon}
    rightImageUrl={svgIcon}
    testId="list-item-suppressed"
    topSectionTestId="list-item-suppressed-top"
    leftImageTestId="list-item-suppressed-left"
    rightImageTestId="list-item-suppressed-right"
    centerTextTestId="list-item-suppressed-center"
    suppressRoleAndTabindex
    ariaSelected={true}
    onitemclick={handleSuppressedItemClick}
  />
  <output data-pw="list-item-suppressed-clicks">{suppressedItemClicks}</output>
</div>

<h3>Narrow fit</h3>
<!-- The first case below overflows its 320px frame on purpose. At a phone width that overflow
     would widen the whole page, so the frame sits in a scroll region that activates only while
     it overflows the column. -->
<div class="demo-scroll">
  <div class="fit-frame" data-pw="list-item-fit-frame">
    <p class="fit-caption">No tokens: a long value pushes the label out of the row</p>
    <div class="fit-case" data-pw="list-item-fit-default">
      <ListItem label="Email ID" topSectionTestId="list-item-fit-default-top">
        {#snippet leftContent()}<span class="fit-icon"></span>{/snippet}
        {#snippet rightContent()}<span class="fit-value">{longValue}</span>{/snippet}
      </ListItem>
    </div>

    <p class="fit-caption">Label floor and shrinkable right cell: the value truncates</p>
    <div class="fit-case fit-row" data-pw="list-item-fit-row">
      <ListItem label="Email ID" topSectionTestId="list-item-fit-row-top">
        {#snippet leftContent()}<span class="fit-icon"></span>{/snippet}
        {#snippet rightContent()}<span class="fit-value">{longValue}</span>{/snippet}
      </ListItem>
    </div>

    <p class="fit-caption">Same tokens, short value: it stays flush right</p>
    <div class="fit-case fit-row" data-pw="list-item-fit-row-short">
      <ListItem label="Email ID" topSectionTestId="list-item-fit-row-short-top">
        {#snippet leftContent()}<span class="fit-icon"></span>{/snippet}
        {#snippet rightContent()}<span class="fit-value">Paid</span>{/snippet}
      </ListItem>
    </div>

    <p class="fit-caption">Stacked: left, center and right cells in DOM order</p>
    <div class="fit-case fit-stack" data-pw="list-item-fit-stack">
      <ListItem
        label="Email ID"
        rightContentText="Verified"
        topSectionTestId="list-item-fit-stack-top"
      >
        {#snippet leftContent()}<span class="fit-icon"></span>{/snippet}
      </ListItem>
    </div>

    <p class="fit-caption">Stacked with an expanded accordion</p>
    <div class="fit-case fit-stack" data-pw="list-item-fit-stack-accordion">
      <ListItem
        label="Email ID"
        rightContentText="Verified"
        useAccordion
        expand
        topSectionTestId="list-item-fit-stack-accordion-top"
      >
        {#snippet leftContent()}<span class="fit-icon"></span>{/snippet}
        {#snippet bottomContent()}
          <div class="fit-body" data-pw="list-item-fit-stack-accordion-body">Expanded details</div>
        {/snippet}
      </ListItem>
    </div>

    <p class="fit-caption">Stacked while loading</p>
    <div class="fit-case fit-stack" data-pw="list-item-fit-stack-loading">
      <ListItem
        label="Email ID"
        showLoader
        showRightContentLoader
        topSectionTestId="list-item-fit-stack-loading-top"
      >
        {#snippet leftContent()}<span class="fit-icon"></span>{/snippet}
      </ListItem>
    </div>

    <p class="fit-caption">Stacked with only left and right content</p>
    <div class="fit-case fit-stack" data-pw="list-item-fit-stack-empty">
      <ListItem topSectionTestId="list-item-fit-stack-empty-top">
        {#snippet leftContent()}<span class="fit-icon"></span>{/snippet}
        {#snippet rightContent()}<span class="fit-value">Paid</span>{/snippet}
      </ListItem>
    </div>

    <p class="fit-caption">Nested items inherit the tokens; a per-instance reset opts one out</p>
    <div class="fit-case fit-stack" data-pw="list-item-fit-stack-nested">
      <ListItem
        label="Outer"
        useAccordion
        expand
        suppressRoleAndTabindex
        topSectionTestId="list-item-fit-stack-nested-outer-top"
      >
        {#snippet bottomContent()}
          <ListItem
            label="Inherits"
            rightContentText="stacked"
            suppressRoleAndTabindex
            topSectionTestId="list-item-fit-stack-nested-inherit-top"
          />
          <div class="fit-reset">
            <ListItem
              label="Reset"
              rightContentText="row"
              suppressRoleAndTabindex
              topSectionTestId="list-item-fit-stack-nested-reset-top"
            />
          </div>
        {/snippet}
      </ListItem>
    </div>
  </div>
</div>

<style>
  .fit-frame {
    width: var(--fit-frame-width, 320px);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .fit-caption {
    margin: 12px 0 0;
    font-size: 12px;
  }

  .fit-case {
    --list-item-padding: 12px 16px;
    --list-item-border: 1px solid #c8ccd2;
    --list-item-top-section-align-items: center;
    --list-item-top-section-gap: 8px;
    --list-item-center-text-padding: 0px;
  }

  .fit-row {
    --list-item-center-content-min-width: 4.5rem;
    --list-item-right-content-min-width: 0;
  }

  .fit-stack {
    --list-item-top-section-flex-direction: column;
    --list-item-top-section-align-items: stretch;
    --list-item-top-section-gap: 16px;
  }

  .fit-reset {
    --list-item-top-section-flex-direction: row;
  }

  .fit-icon {
    display: block;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #86898d;
  }

  .fit-value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
  }

  .fit-body {
    padding-top: 8px;
    font-size: 12px;
  }
</style>
