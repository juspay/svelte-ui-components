<script lang="ts">
  import SankeyChart from '$lib/SankeyChart/SankeyChart.svelte';

  const simpleNodes = [
    { id: 'source-a', label: 'Source A' },
    { id: 'source-b', label: 'Source B' },
    { id: 'process-1', label: 'Process 1' },
    { id: 'process-2', label: 'Process 2' },
    { id: 'output', label: 'Output' }
  ];

  const simpleLinks = [
    { source: 'source-a', target: 'process-1', value: 40 },
    { source: 'source-a', target: 'process-2', value: 20 },
    { source: 'source-b', target: 'process-1', value: 30 },
    { source: 'source-b', target: 'process-2', value: 10 },
    { source: 'process-1', target: 'output', value: 70 },
    { source: 'process-2', target: 'output', value: 30 }
  ];

  const trafficNodes = [
    { id: 'google', label: 'Google', color: '#4285f4' },
    { id: 'direct', label: 'Direct', color: '#34a853' },
    { id: 'social', label: 'Social', color: '#ea4335' },
    { id: 'landing', label: 'Landing Page', color: '#fbbc05' },
    { id: 'pricing', label: 'Pricing', color: '#4e79a7' },
    { id: 'docs', label: 'Documentation', color: '#76b7b2' },
    { id: 'signup', label: 'Sign Up', color: '#59a14f' },
    { id: 'bounce', label: 'Bounce', color: '#bab0ac' }
  ];

  const trafficLinks = [
    { source: 'google', target: 'landing', value: 50 },
    { source: 'google', target: 'pricing', value: 20 },
    { source: 'google', target: 'docs', value: 15 },
    { source: 'direct', target: 'landing', value: 30 },
    { source: 'direct', target: 'pricing', value: 25 },
    { source: 'social', target: 'landing', value: 20 },
    { source: 'social', target: 'docs', value: 10 },
    { source: 'landing', target: 'signup', value: 45 },
    { source: 'landing', target: 'bounce', value: 55 },
    { source: 'pricing', target: 'signup', value: 35 },
    { source: 'pricing', target: 'bounce', value: 10 },
    { source: 'docs', target: 'signup', value: 15 },
    { source: 'docs', target: 'bounce', value: 10 }
  ];

  // Dense payment flow — tiny values would collapse without minLinkWidth
  const paymentNodes = [
    { id: 'card', label: 'Card', color: '#6366f1' },
    { id: 'upi', label: 'UPI', color: '#22c55e' },
    { id: 'wallet', label: 'Wallet', color: '#f59e0b' },
    { id: 'success', label: 'Success', color: '#10b981' },
    { id: 'pending', label: 'Pending', color: '#f97316' },
    { id: 'failed', label: 'Failed', color: '#ef4444' }
  ];

  const paymentLinks = [
    { source: 'card', target: 'success', value: 820 },
    { source: 'card', target: 'pending', value: 5 },
    { source: 'card', target: 'failed', value: 3 },
    { source: 'upi', target: 'success', value: 940 },
    { source: 'upi', target: 'pending', value: 2 },
    { source: 'upi', target: 'failed', value: 1 },
    { source: 'wallet', target: 'success', value: 310 },
    { source: 'wallet', target: 'pending', value: 4 },
    { source: 'wallet', target: 'failed', value: 2 }
  ];
</script>

<div class="page-header">
  <span class="category-badge">Data Visualization</span>
  <h1>SankeyChart</h1>
</div>

<h3>Simple Flow</h3>
<div class="demo-row">
  <SankeyChart nodes={simpleNodes} links={simpleLinks} />
</div>

<h3>With Values</h3>
<div class="demo-row">
  <SankeyChart nodes={simpleNodes} links={simpleLinks} showValues />
</div>

<h3>Website Traffic Flow</h3>
<div class="demo-row">
  <SankeyChart nodes={trafficNodes} links={trafficLinks} />
</div>

<h3>dataLabelOffsetX — Extra breathing room between nodes and labels (offset: 30px)</h3>
<div class="demo-row">
  <SankeyChart nodes={simpleNodes} links={simpleLinks} dataLabelOffsetX={30} />
</div>

<h3>
  minLinkWidth — Tiny flows stay visible (minLinkWidth: 3, payment data with near-zero failure
  rates)
</h3>
<div class="demo-row">
  <SankeyChart nodes={paymentNodes} links={paymentLinks} minLinkWidth={3} showValues />
</div>

<h3>disableDimOnHover — All nodes stay at full opacity when hovering</h3>
<div class="demo-row">
  <SankeyChart nodes={trafficNodes} links={trafficLinks} disableDimOnHover />
</div>

<h3>Combined — minLinkWidth + dataLabelOffsetX + disableDimOnHover</h3>
<div class="demo-row">
  <SankeyChart
    nodes={paymentNodes}
    links={paymentLinks}
    minLinkWidth={3}
    dataLabelOffsetX={30}
    disableDimOnHover
    showValues
  />
</div>
