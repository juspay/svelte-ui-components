<script lang="ts" context="module">
  export const prerender = true;
</script>

<div class="loader" />

<style>
  .loader {
    font-size: var(--loader-font-size, 10px);
    text-indent: var(--loader-text-indent, -9999em);
    width: var(--loader-width, 20px);
    height: var(--loader-height, 20px);
    border-radius: var(--loader-border-radius, 50%);
    background: var(--loader-foreground);
    background: -moz-linear-gradient(
      left,
      var(--loader-foreground) 10%,
      var(--loader-foreground-end) 42%
    );
    background: -webkit-linear-gradient(
      left,
      var(--loader-foreground) 10%,
      var(--loader-foreground-end) 42%
    );
    background: -o-linear-gradient(
      left,
      var(--loader-foreground) 10%,
      var(--loader-foreground-end) 42%
    );
    background: -ms-linear-gradient(
      left,
      var(--loader-foreground) 10%,
      var(--loader-foreground-end) 42%
    );
    background: linear-gradient(
      to right,
      var(--loader-foreground) 10%,
      var(--loader-foreground-end) 42%
    );
    position: relative;
    -webkit-animation: load3 1.4s infinite linear;
    animation: load3 1.4s infinite linear;
    -webkit-transform: translateZ(0);
    -ms-transform: translateZ(0);
    transform: translateZ(0);
  }
  .loader:before {
    width: var(--loader-before-width, 10px);
    height: var(--loader-before-height, 10px);
    background: var(--loader-foreground);
    border-radius: var(--loader-before-border-radius, 100% 0 0 0);
    position: var(--loader-before-position, absolute);
    top: var(--loader-before-top, 0);
    left: var(--loader-before-left, 0);
    content: '';
  }
  .loader:after {
    background: var(--loader-background);
    width: var(--loader-after-width, 15px);
    height: var(--loader-after-height, 15px);
    border-radius: var(--loader-after-border-radius, 50%);
    content: '';
    margin: var(--loader-after-margin, auto);
    position: var(--loader-after-position, absolute);
    top: var(--loader-after-top, 0);
    left: var(--loader-after-left, 0);
    bottom: var(--loader-after-bottom, 0);
    right: var(--loader-after-right, 0);
  }
  @-webkit-keyframes load3 {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  @keyframes load3 {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
</style>
