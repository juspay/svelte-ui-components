<script>
  export let properties = { label: 'B', color: '#b91c1c' };
</script>

<div class="slide" style="background: {properties.color};">
  <span>{properties.label}</span>
</div>

<style>
  .slide {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fef3c7;
    font: 700 24px sans-serif;
  }
</style>
