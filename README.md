# Svelte UI Components

This library provides a collection of reusable UI components built with [Svelte](https://svelte.dev/).

## Installation

This library is publish on npm & can be installed via any npm client.
Use the following command to install the library.

```bash
npm install @juspay/svelte-ui-components
```

## Usage

The library contains a collection of components that can be imported & used in your svelte project.

### Available components

- Accordion
- Badge
- Banner
- Brand Loader (aka Splash Screen )
- Button
- Carousel
- Checkbox / Checklist Item
- Icon
- Input
- Input with attached Button
- List Item
- Loader
- Modal
- Select
- Status Screen
- Table
- Toggle
- Toolbar

All of the components can be easily imported from the 'svelte-ui-components' package.

#### Example: Importing component from the package

```svelte
<script lang="ts">
  import { Button, defaultButtonProperties } from '@juspay/svelte-ui-components';
</script>

<Button properties={{ ...defaultButtonProperties, text: 'Click' }} />
```

### Customizing the components

Each component comes with a set of configuration options that can be used to customize the component.
There are two ways to customize the component.

1. Using css variables:

   - All the components have exposed css variables for all the properties available.
   - The css variables can be used to customize the component.

2. Using props:

   - All the components have exposed props for dynamic values/variables.
   - The props can be used to customize the component.

#### Example: Customizing the component

```svelte
<script lang="ts">
  import {
    Button,
    type ButtonProperties,
    defaultButtonProperties
  } from '@juspay/svelte-ui-components';

  const buttonProperties: ButtonProperties = {
    ...defaultButtonProperties,
    text: 'Submit'
  };

  function handleSubmitClick() {
    // handle click
  }
</script>

<div class="form">
  <Button properties={buttonProperties} on:click={handleSubmitClick} />
</div>

<style>
  .form {
    --button-color: black;
    --button-text-color: white;
    /* Other styling values */
  }
</style>
```

### Contributing

- Clone the repository
- Install dependencies using `pnpm install`
- Make changes to the components
- Run tests using `pnpm run test`
- Commit the changes
- Push the changes
- Create a pull request

### Todo Items

- [ ] Add demo support
- [ ] Add documentation for all components
- [ ] Add more components
- [ ] Add tests
