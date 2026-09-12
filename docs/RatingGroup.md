# RatingGroup

A star rating input. `value` (bindable, 0 by default) is clamped to `[0, max]` and, unless `allowHalf` is set, rounded to the nearest whole star before it is ever painted or read back through ARIA -- a non-finite or out-of-range value never reaches the DOM as `NaN` or an overflowed star count. The whole group is a single `role="slider"` element and a single tab stop: arrow keys, `Home`/`End`, and clicking a star all set the value, and `readonly` (read but not settable) and `disabled` (removed from the tab order) are distinct states. `name`/`required` participate in a native form through a hidden `<input type="number">`, the same pattern `Checkbox` uses for its own hidden control.

## Usage

```svelte
<script>
  import { RatingGroup } from '@juspay/svelte-ui-components';

  let value = $state(3);
</script>

<RatingGroup bind:value ariaLabel="Rate this product" />
```

## Props

| Prop      | Type                                                               | Required | Default | Description                                                                                                                                                                                                                                                                                  |
| --------- | ------------------------------------------------------------------ | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value     | `number`                                                           | No       | `0`     | Current rating. Bindable, like `Checkbox.checked` and `Slider.value`. Clamped to `[0, max]` and, unless `allowHalf` is set, rounded to the nearest whole star. A non-finite or out-of-range value is clamped/sanitized rather than let through -- see Accessibility below.                   |
| max       | `number`                                                           | No       | `5`     | Number of stars in the group. Must be a finite, positive number; a zero, negative, or non-finite `max` renders no stars at all rather than a broken or infinite row.                                                                                                                         |
| disabled  | `boolean`                                                          | No       | `false` | Removes the group from the tab order (`tabindex="-1"`) and blocks clicks and keyboard input. Excluded from form submission.                                                                                                                                                                  |
| readonly  | `boolean`                                                          | No       | `false` | Read but not settable: the group stays a tab stop and keeps following `value` from outside, but clicking a star or pressing an arrow key no longer changes it. Distinct from `disabled`.                                                                                                     |
| allowHalf | `boolean`                                                          | No       | `false` | Allows landing on the half star between two whole ones -- the left half of a star click sets the half value, the right half sets the whole star, and arrow keys move in 0.5 steps instead of 1.                                                                                              |
| ariaLabel | `string`                                                           | No       | `-`     | Accessible name for the `role="slider"` element. Falls back to `"Rating"`. The current value is announced separately through `aria-valuetext`.                                                                                                                                               |
| testId    | `string`                                                           | No       | `-`     | Value for the data-pw attribute, used for end-to-end testing selectors. Each star gets its own `{testId}-star-{n}` (1-based), and the hidden native input gets `{testId}-native-input`.                                                                                                      |
| classes   | `string`                                                           | No       | `-`     | CSS class string applied to the component's top-level element.                                                                                                                                                                                                                               |
| star      | `Snippet<[{ index: number; state: 'empty' \| 'half' \| 'full' }]>` | No       | `-`     | Custom rendering for a single star, given its 0-based `index` and fill `state`. Falls back to a themeable default star icon.                                                                                                                                                                 |
| name      | `string`                                                           | No       | `-`     | Submits the current rating under this name via a hidden native `<input type="number">`. Omitted entirely while disabled, or while unrated (`0`) -- a number input cannot itself express "explicitly zero" vs. "never touched", so `0` is treated as the empty state for submission purposes. |
| required  | `boolean`                                                          | No       | `false` | Blocks submission while the rating is unset (`0`), the same way an unchecked required `Checkbox` does. Invalid focus lands on the group itself, since the hidden native input is deliberately not a tab stop.                                                                                |
| form      | `string`                                                           | No       | `-`     | `id` of a form elsewhere in the same document, for a group rendered outside it. Unavailable through `<sui-rating-group>`, whose hidden input sits in a shadow root and cannot reach a form in the host document.                                                                             |
| onchange  | `(value: number) => void`                                          | No       | `-`     | Fired whenever an interaction (click, arrow key, Home/End) actually changes the sanitized value -- not fired for a no-op, such as pressing `ArrowRight` while already at `max`.                                                                                                              |

## Accessibility

The root element is `role="slider"`, a single tab stop (`tabindex="0"`, `-1` while `disabled`), with `aria-valuemin="0"`, `aria-valuemax` set to `max`, and `aria-valuenow` set to the sanitized current value. `aria-valuetext` reads e.g. `"3 out of 5 stars"` or, with `allowHalf`, `"3.5 out of 5 stars"`, so assistive technology hears the rating in words rather than a bare number. `aria-label` names the control itself (`"Rating"` by default), kept separate from `aria-valuetext` so the name and the value are not announced redundantly.

Keyboard: `ArrowRight`/`ArrowUp` increase the value by one step (`0.5` when `allowHalf`, otherwise `1`), `ArrowLeft`/`ArrowDown` decrease it, `Home` jumps to `0`, and `End` jumps to `max`. Every one of these **clamps rather than wraps** -- pressing `ArrowRight` at `max` stays at `max`, it does not jump to `0`. A modified arrow key (`Ctrl`/`Meta`/`Alt`/`Shift` held) is left alone, so a browser or OS shortcut built on the same key keeps working while the group holds focus.

`readonly` keeps the group in the tab order and its ARIA value live, but neither clicks nor keyboard input change it (`aria-readonly="true"`). `disabled` removes it from the tab order entirely (`aria-disabled="true"`, `tabindex="-1"`) and blocks both interactions.

Individual stars are presentational (`aria-hidden="true"`) -- the group as a whole carries the name, role and value, matching the WAI-ARIA slider pattern rather than exposing `max` separately-focusable controls. Clicking a star still works for pointer and touch users; it also focuses the group itself (the nearest focusable ancestor), so a click immediately hands off to keyboard control.

A non-finite (`NaN`, `Infinity`) or out-of-range `value` is sanitized before it ever reaches `aria-valuenow`, the star visuals, or the hidden form input -- `NaN` reads as `0`, and `+Infinity`/`-Infinity` clamp to `max`/`0` respectively, the same direction a very large or very small finite number would clamp to. An invalid `max` (zero, negative, or non-finite) renders zero stars and a `0`/`0` ARIA range instead of a broken or infinite row, mirroring `Progress`'s guard against an unusable `value`/`max` pair.

## CSS Variables

Override these custom properties to theme the component.

| Variable                              | Default                             | CSS Property  | Description                                                        |
| ------------------------------------- | ----------------------------------- | ------------- | ------------------------------------------------------------------ |
| `--rating-group-display`              | `inline-flex`                       | display       | Display mode of the root element.                                  |
| `--rating-group-gap`                  | `2px`                               | gap           | Gap between stars.                                                 |
| `--rating-group-cursor`               | `pointer`                           | cursor        | Cursor over the group in its normal (enabled, non-readonly) state. |
| `--rating-group-border-radius`        | `var(--radius, 4px)`                | border-radius | Corner rounding used by the focus ring.                            |
| `--rating-group-focus-ring`           | `0 0 0 3px rgba(33, 150, 243, 0.3)` | box-shadow    | Focus ring shown on `:focus-visible`.                              |
| `--rating-group-disabled-opacity`     | `0.4`                               | opacity       | Opacity of the whole group while disabled.                         |
| `--rating-group-disabled-cursor`      | `not-allowed`                       | cursor        | Cursor over the group while disabled.                              |
| `--rating-group-readonly-cursor`      | `default`                           | cursor        | Cursor over the group while readonly.                              |
| `--rating-group-star-size`            | `24px`                              | width, height | Size of each star icon.                                            |
| `--rating-group-star-hover-transform` | `scale(1.1)`                        | transform     | Hover affordance on a single star, while enabled and not readonly. |
| `--rating-group-star-empty-color`     | `#d1d5db`                           | color         | Color of the unfilled portion of a star (the default icon).        |
| `--rating-group-star-filled-color`    | `#f5a623`                           | color         | Color of the filled portion of a star (the default icon).          |

## Web Component

Tag: `<sui-rating-group>`

```html
<sui-rating-group value="3" max="5" aria-label="Rate this product"></sui-rating-group>
```

`aria-label` is exposed as the `ratingGroupAriaLabel` JavaScript property (not `ariaLabel`, which `ARIAMixin` already defines on every `HTMLElement`) -- the HTML attribute is unaffected. `allowHalf` reflects as the `allow-half` attribute. The hidden native input lives in the shadow root, so `form` (an external form's `id`) does not work through the custom element -- place the `<sui-rating-group>` inside the `<form>` itself instead.
