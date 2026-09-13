<script lang="ts">
  import type { BrandLoaderProperties } from './properties';

  let { brandLogoURL, brandText, subText, classes, testId }: BrandLoaderProperties = $props();
</script>

<div
  class="background {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <div class="loader">
    <img src={brandLogoURL} alt="" />
    <div class="text">{brandText}</div>
    {#if typeof subText === 'string' && subText.length > 0}
      <div class="sub-text">{subText}</div>
    {/if}
    <div class="lds-ellipsis">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
</div>

<style>
  .background {
    height: var(--loader-background-height, auto);
    width: var(--loader-background-width, auto);
    /* Caps the splash against whatever box it was placed in. min-width:0 is
       required as well: as a flex item this would otherwise refuse to shrink
       below the 100vw min-content of .loader inside it, and the cap would
       resolve against a width .loader had itself dictated. */
    max-width: 100%;
    min-width: 0;
    border-radius: var(--loader-background-border-radius, 0px);
  }

  .loader {
    /* --loader-height/--loader-width are also independently read by the
       unrelated Loader component (with a 20px default there, vs 100vh/100vw
       here), so a consumer setting either name in a scope containing both
       components would size them identically. --brand-loader-* is the
       namespaced, collision-free override point; the legacy --loader-*
       names are kept as a fallback so existing consumer overrides keep
       working unchanged. */
    height: var(--brand-loader-height, var(--loader-height, 100vh));
    width: var(--brand-loader-width, var(--loader-width, 100vw));
    border-radius: var(--loader-background-border-radius, 0px);
    /* The 100vw/100vh default above is the full-screen splash case. An embedded
       instance must never exceed the box it was placed in: this is a centring
       flex container, so overflowing it centres the logo on the viewport rather
       than on the container and the content visibly drifts to one side. */
    max-width: 100%;
    max-height: 100%;
    display: flex;
    justify-content: var(--loader-justify-content, center);
    align-items: var(--loader-align-items, center);
    flex-direction: var(--loader-flex-direction, column);
  }

  .loader img {
    height: var(--loader-img-height, 40px);
    width: var(--loader-img-width, 71px);
  }

  .text {
    font-size: var(--loader-text-font-size, 22px);
    padding: var(--loader-text-padding, 16px 0px);
    /* The frosted overlay below is only ~20% opaque, so its painted colour is
       mostly whatever page sits behind it. A splash screen is far more often
       hosted on a light page than over dark imagery, so the readable-by-default
       choice is a dark tone here; --loader-text-color stays the override point
       for the over-dark-imagery look (e.g. --loader-text-color: white). */
    color: var(--loader-text-color, #333333);
    font-family: var(--loader-text-font, inherit);
  }

  .sub-text {
    font-size: var(--loader-sub-text-font-size, 12px);
    margin: var(--loader-sub-text-margin, 16px);
    /* Previously unset, so it silently inherited whatever colour the host page
       happened to have -- legible by accident on this doc site, invisible or
       wrong wherever that assumption didn't hold. Same reasoning as .text: a
       muted dark tone reads on the default light backdrop. */
    color: var(--loader-sub-text-color, #52525b);
  }

  /* `.background` used to declare `animation: animateBackground ...` here, but
     `@keyframes animateBackground` has never existed anywhere in this repo --
     confirmed back to 8801087c, the commit that introduced BrandLoader (Nov
     2023). It referenced nothing and so never animated anything; this was
     dead from day one, not a regression, and no prior design for what it
     should look like ever shipped, so it is removed rather than reconstructed.
     The `prefers-reduced-motion` override below is left in place as a guard:
     if a real indefinite animation is ever added to `.background`, that guard
     already stops it. */
  @supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none)) {
    .loader {
      background-color: var(--loader-background-color, #ffffff33);
      -webkit-backdrop-filter: blur(var(--loader-webkit-backdrop-filter, 50px));
      backdrop-filter: blur(var(--loader-backdrop-blur, 50px));
    }
  }

  .lds-ellipsis {
    display: var(--loader-ellipsis-display, inline-block);
    position: var(--loader-ellipsis-position, relative);
    width: var(--loader-ellipsis-width, 80px);
    height: var(--loader-ellipsis-height, 80px);
  }
  .lds-ellipsis div {
    display: var(--loader-ellipsis-div-display, inherit);
    position: var(--loader-ellipsis-div-position, absolute);
    top: var(--loader-ellipsis-div-top, 5px);
    width: var(--loader-ellipsis-div-width, 13px);
    height: var(--loader-ellipsis-div-height, 13px);
    border-radius: var(--loader-ellipsis-div-border-radius, 50%);
    background: var(--loader-dot-color, #3a4550);
    animation-timing-function: var(--loader-ellipsis-animation-timing, cubic-bezier(0, 1, 1, 0));
  }
  .lds-ellipsis div:nth-child(1) {
    left: 8px;
    animation: lds-ellipsis1
      var(--brand-loader-ellipsis-animation-duration, var(--motion-duration, 0.6s)) infinite;
  }
  .lds-ellipsis div:nth-child(2) {
    left: 8px;
    animation: lds-ellipsis2
      var(--brand-loader-ellipsis-animation-duration, var(--motion-duration, 0.6s)) infinite;
  }
  .lds-ellipsis div:nth-child(3) {
    left: 32px;
    animation: lds-ellipsis2
      var(--brand-loader-ellipsis-animation-duration, var(--motion-duration, 0.6s)) infinite;
  }
  .lds-ellipsis div:nth-child(4) {
    left: 56px;
    animation: lds-ellipsis3
      var(--brand-loader-ellipsis-animation-duration, var(--motion-duration, 0.6s)) infinite;
  }
  @keyframes lds-ellipsis1 {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes lds-ellipsis3 {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }
  @keyframes lds-ellipsis2 {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(24px, 0);
    }
  }
  /* An indefinite animation is the case this preference exists for: it never
     ends, so a user who asked the OS to minimise motion gets a permanent loop.
     The animation stops, but the element must still read as "busy" -- a guard
     that leaves nothing on screen, or leaves a frame that means something else,
     is worse than the motion it removed. This block lives in the component's own
     <style> because that is the only stylesheet that reaches inside the shadow
     root a custom-element consumer gets. */
  @media (prefers-reduced-motion: reduce) {
    .background {
      -webkit-animation: none;
      animation: none;
    }

    /* Each dot's animation is declared on a `:nth-child()` selector, which
       outranks a bare `.lds-ellipsis div` rule and comes later, so the guard
       has to name them at the same specificity or it is silently overridden. */
    .lds-ellipsis div:nth-child(1),
    .lds-ellipsis div:nth-child(2),
    .lds-ellipsis div:nth-child(3),
    .lds-ellipsis div:nth-child(4) {
      /* Two of the four dots animate scale (one in, one out) and two translate.
         With the animations stopped every transform resolves to its identity,
         so all four sit at their `left` offsets at full size. */
      animation: none;
      transform: none;
    }

    .lds-ellipsis div:nth-child(1) {
      /* The scale-in dot shares `left: 8px` with the second one, so at rest the
         two occupy the same spot and the row reads as three dots with one drawn
         twice. Dropping it leaves three, evenly spaced at 8/32/56. */
      display: none;
    }
  }
</style>
