<script lang="ts">
  import { base } from '$app/paths';
  import BrandLoader from '$lib/BrandLoader/BrandLoader.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Feedback & Status</span>
  <h1>BrandLoader</h1>
</div>

<div class="demo-row">
  <BrandLoader
    brandLogoURL="{base}/demo-media/placeholder-square.svg"
    brandText="Loading"
    subText="Please wait..."
    testId="brand-loader-default-demo"
  />
</div>

<h2>Sized Instances (--brand-loader-width / --brand-loader-height)</h2>
<p>
  <code>--loader-width</code>/<code>--loader-height</code> are also independently read by the
  <code>Loader</code> component (with a 20px default there, vs 100vw/100vh here). The namespaced
  <code>--brand-loader-width</code>/<code>--brand-loader-height</code> variables are the collision-free,
  preferred way to size a constrained instance; the legacy shared names still work as a fallback for existing
  overrides.
</p>
<div class="demo-row" style="gap: 24px; flex-wrap: wrap; align-items: flex-start;">
  <div class="loader-demo-frame brand-loader-legacy-demo">
    <p class="loader-demo-caption">Legacy: --loader-width / --loader-height</p>
    <BrandLoader
      brandLogoURL="https://picsum.photos/64/64?random=41"
      brandText="Loading"
      testId="brand-loader-legacy-demo"
    />
  </div>
  <div class="loader-demo-frame brand-loader-namespaced-demo">
    <p class="loader-demo-caption">Preferred: --brand-loader-width / --brand-loader-height</p>
    <BrandLoader
      brandLogoURL="https://picsum.photos/64/64?random=42"
      brandText="Loading"
      testId="brand-loader-namespaced-demo"
    />
  </div>
  <div class="loader-demo-frame brand-loader-precedence-demo">
    <p class="loader-demo-caption">Both set: namespaced wins</p>
    <BrandLoader
      brandLogoURL="https://picsum.photos/64/64?random=43"
      brandText="Loading"
      testId="brand-loader-precedence-demo"
    />
  </div>
</div>

<style>
  .loader-demo-frame {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .loader-demo-caption {
    margin: 0;
    font-size: 12px;
    color: var(--doc-text-secondary, #6b7280);
  }

  .brand-loader-legacy-demo {
    --loader-width: 320px;
    --loader-height: 180px;
  }

  .brand-loader-namespaced-demo {
    --brand-loader-width: 320px;
    --brand-loader-height: 180px;
  }

  .brand-loader-precedence-demo {
    /* Namespaced vars should win over the legacy fallback when both are set. */
    --loader-width: 999px;
    --loader-height: 999px;
    --brand-loader-width: 240px;
    --brand-loader-height: 140px;
  }
</style>
