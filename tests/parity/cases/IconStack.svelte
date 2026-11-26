<script module>
  export const cases = [
    { name: 'empty-icons', allowBlank: true },
    { name: 'single-image' },
    { name: 'single-text' },
    { name: 'three-images' },
    { name: 'three-text' },
    { name: 'mixed' },
    { name: 'many-icons' },
    { name: 'text-long' },
    { name: 'text-empty' },
    { name: 'text-overflow-plus-n' },
    { name: 'image-svg' },
    { name: 'testid' },
    { name: 'classes' },
    { name: 'css-icon-vars' },
    { name: 'css-text-vars' },
    { name: 'css-image-size' },
    { name: 'css-container-margin' },
    { name: 'css-overlap-margin' },
    { name: 'css-align-vars' },
    { name: 'stacked-order' },
    { name: 'in-narrow-container' }
  ];
</script>

<script>
  import { IconStack } from 'sui-under-test';
  import { png, svg } from './_kit.js';
  let { name } = $props();
  const img = (c) => ({ type: 'image', content: c });
  const txt = (c) => ({ type: 'text', content: c });
</script>

{#if name === 'empty-icons'}
  <IconStack icons={[]} />
{:else if name === 'single-image'}
  <IconStack icons={[img(png)]} />
{:else if name === 'single-text'}
  <IconStack icons={[txt('AB')]} />
{:else if name === 'three-images'}
  <IconStack icons={[img(png), img(svg), img(png)]} />
{:else if name === 'three-text'}
  <IconStack icons={[txt('A'), txt('B'), txt('C')]} />
{:else if name === 'mixed'}
  <IconStack icons={[img(png), txt('+3'), img(svg), txt('Z')]} />
{:else if name === 'many-icons'}
  <IconStack icons={[img(png), img(svg), img(png), img(svg), img(png), img(svg), txt('+9')]} />
{:else if name === 'text-long'}
  <IconStack icons={[txt('Longer label here'), txt('Another long one')]} />
{:else if name === 'text-empty'}
  <IconStack icons={[txt(''), img(png)]} />
{:else if name === 'text-overflow-plus-n'}
  <IconStack icons={[img(png), img(svg), txt('+12')]} />
{:else if name === 'image-svg'}
  <IconStack icons={[img(svg), img(svg)]} />
{:else if name === 'testid'}
  <IconStack icons={[img(png), txt('2')]} testId="stack-a" />
{:else if name === 'classes'}
  <IconStack icons={[img(png), txt('2')]} classes="stack-x" />
{:else if name === 'css-icon-vars'}
  <div
    style="--stack-icon-width: 48px; --stack-icon-height: 48px; --stack-icon-bg: #fef3c7; --stack-icon-radius: 10px; --stack-icon-border: 2px solid #f59e0b; --stack-icon-shadow: 0 4px 8px #00000066; --stack-icon-margin: 0 0 0 -8px;"
  >
    <IconStack icons={[txt('A'), txt('B'), txt('C')]} />
  </div>
{:else if name === 'css-text-vars'}
  <div style="--text-color: #b91c1c; --text-size: 20px; --text-weight: 800; --text-align: right">
    <IconStack icons={[txt('X'), txt('YY')]} />
  </div>
{:else if name === 'css-image-size'}
  <div
    style="--stack-img-width: 24px; --stack-img-height: 24px; --stack-icon-width: 40px; --stack-icon-height: 40px"
  >
    <IconStack icons={[img(png), img(svg)]} />
  </div>
{:else if name === 'css-container-margin'}
  <div style="--stack-container-margin: 20px 0 0 40px">
    <IconStack icons={[img(png), img(svg)]} />
  </div>
{:else if name === 'css-overlap-margin'}
  <div style="--stack-icon-margin: 0 0 0 4px">
    <IconStack icons={[img(png), img(svg), txt('+1')]} />
  </div>
{:else if name === 'css-align-vars'}
  <div
    style="--stack-icon-align-items: flex-start; --stack-icon-justify-content: flex-start; --text-container-align-items: flex-end; --text-container-justify-content: flex-end; --text-conatiner-width: 20px; --text-conatiner-height: 20px"
  >
    <IconStack icons={[txt('A'), txt('B')]} />
  </div>
{:else if name === 'stacked-order'}
  <div style="--stack-icon-margin: 0 0 0 -24px; --stack-icon-bg: #bfdbfe">
    <IconStack icons={[txt('1'), txt('2'), txt('3'), txt('4')]} />
  </div>
{:else if name === 'in-narrow-container'}
  <div style="width: 80px; overflow: hidden; border: 1px dashed #94a3b8">
    <IconStack icons={[img(png), img(svg), img(png), img(svg)]} />
  </div>
{/if}
