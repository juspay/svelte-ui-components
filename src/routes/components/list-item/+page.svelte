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
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>ListItem</h1>
</div>

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
