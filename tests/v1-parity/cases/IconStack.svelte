<script context="module">
  export const cases = [
    { name: 'empty' },
    { name: 'one-image' },
    { name: 'two-images' },
    { name: 'many-images' },
    { name: 'mixed-image-svg' },
    { name: 'one-text' },
    { name: 'many-text' },
    { name: 'long-text' },
    { name: 'mixed-image-and-text' },
    { name: 'text-then-image' },
    { name: 'ten-icons-narrow' },
    { name: 'themed' },
    { name: 'style-props-icon' },
    { name: 'style-props-text' },
    { name: 'align-items' },
    { name: 'no-overlap-margin' }
  ];
</script>

<script>
  import { IconStack } from 'sui-v1-under-test';
  import { png, svg } from './_kit.js';
  export let name;
  const img = (content) => ({ type: 'image', content });
  const txt = (content) => ({ type: 'text', content });
  const ten = Array.from({ length: 10 }, (_, i) => (i % 2 ? txt(`+${i}`) : img(i % 4 ? png : svg)));
</script>

{#if name === 'empty'}
  <IconStack icons={[]} />
  <p>after</p>
{:else if name === 'one-image'}
  <IconStack icons={[img(png)]} />
{:else if name === 'two-images'}
  <IconStack icons={[img(png), img(svg)]} />
{:else if name === 'many-images'}
  <IconStack icons={[img(png), img(svg), img(png), img(svg), img(png)]} />
{:else if name === 'mixed-image-svg'}
  <IconStack icons={[img(svg), img(svg), img(png)]} />
{:else if name === 'one-text'}
  <IconStack icons={[txt('+3')]} />
{:else if name === 'many-text'}
  <IconStack icons={[txt('A'), txt('B'), txt('C'), txt('+9')]} />
{:else if name === 'long-text'}
  <IconStack icons={[txt('Longer label overflow'), txt('')]} />
{:else if name === 'mixed-image-and-text'}
  <IconStack icons={[img(png), img(svg), txt('+4')]} />
{:else if name === 'text-then-image'}
  <IconStack icons={[txt('+2'), img(png)]} />
{:else if name === 'ten-icons-narrow'}
  <div style="width: 200px; overflow: hidden; border: 1px solid #111827">
    <IconStack icons={ten} />
  </div>
{:else if name === 'themed'}
  <div class="themed">
    <IconStack icons={[img(png), img(svg), txt('+5')]} />
  </div>
{:else if name === 'style-props-icon'}
  <IconStack
    icons={[img(png), img(svg), img(png)]}
    --stack-container-margin="12px"
    --stack-icon-width="48px"
    --stack-icon-height="48px"
    --stack-icon-bg="#fef3c7"
    --stack-icon-radius="10px"
    --stack-icon-margin="0px 0px 0px -20px"
    --stack-icon-border="2px solid #b45309"
    --stack-icon-shadow="0 4px 8px #00000066"
    --stack-img-width="30px"
    --stack-img-height="30px"
  />
{:else if name === 'style-props-text'}
  <IconStack
    icons={[txt('+7'), txt('AB')]}
    --text-conatiner-width="48px"
    --text-conatiner-height="48px"
    --stack-icon-width="48px"
    --stack-icon-height="48px"
    --text-color="#be123c"
    --text-size="20px"
    --text-weight="700"
    --text-align="left"
  />
{:else if name === 'align-items'}
  <IconStack
    icons={[img(png), txt('+1')]}
    --stack-icon-align-items="flex-start"
    --stack-icon-justify-content="flex-end"
    --text-container-align-items="flex-end"
    --text-container-justify-content="flex-start"
    --stack-icon-width="56px"
    --stack-icon-height="56px"
  />
{:else if name === 'no-overlap-margin'}
  <IconStack icons={[img(png), img(svg), txt('+1')]} --stack-icon-margin="0px 8px 0px 0px" />
{/if}

<style>
  .themed {
    --stack-container-margin: 4px 8px;
    --stack-icon-width: 40px;
    --stack-icon-height: 40px;
    --stack-icon-bg: #ecfdf5;
    --stack-icon-radius: 8px;
    --stack-icon-margin: 0px 0px 0px -10px;
    --stack-icon-border: 1px solid #047857;
    --stack-icon-shadow: none;
    --stack-img-width: 24px;
    --stack-img-height: 24px;
    --text-conatiner-width: 40px;
    --text-conatiner-height: 40px;
    --text-color: #047857;
    --text-size: 15px;
    --text-weight: 700;
  }
</style>
