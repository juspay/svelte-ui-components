# Avatar

A circular avatar component that displays a user's profile image or falls back to generated initials when no image is available or the image fails to load. Commonly used in user profiles, comment sections, and contact lists.

## Usage

```svelte
<script>
  import { Avatar } from '@juspay/svelte-ui-components';
</script>

<!-- With image -->
<Avatar src="https://example.com/photo.jpg" alt="Jane Doe" name="Jane Doe" />

<!-- Initials fallback (no src provided) -->
<Avatar alt="Jane Doe" name="Jane Doe" size="large" />
```

## Props

| Prop    | Type         | Required | Default    | Description                                                                                                                                                                                                                |
| ------- | ------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| alt     | `string`     | Yes      | `-`        | Alt text for the avatar image. Used for accessibility.                                                                                                                                                                     |
| src     | `string`     | No       | `-`        | URL of the avatar image. When omitted or when the image fails to load, initials derived from `name` are displayed instead.                                                                                                 |
| name    | `string`     | No       | `-`        | Full name used to generate initials for the fallback display. Initials are formed from the first letter of the first word and the first letter of the last word.                                                           |
| size    | `AvatarSize` | No       | `'medium'` | Controls the avatar dimensions. One of `'small'`, `'medium'`, or `'large'`. Actual pixel sizes are controlled via CSS variables.                                                                                           |
| testId  | `string`     | No       | `-`        | Value applied to the `data-pw` attribute for Playwright test selectors.                                                                                                                                                    |
| classes | `string`     | No       | `-`        | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides (e.g., `.btn-primary { --button-color: #0070f3; }`) and pass them to create variant styles. |

## Events

| Event   | Type                          | Description                                                                                  |
| ------- | ----------------------------- | -------------------------------------------------------------------------------------------- |
| onclick | `(event: MouseEvent) => void` | Fires when the avatar is clicked. Useful for opening a profile view or triggering an action. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                    | Default   | CSS Property     | Description                                                                    |
| --------------------------- | --------- | ---------------- | ------------------------------------------------------------------------------ |
| `--avatar-small-width`      | `32px`    | width            | Width of the avatar when size is `'small'`.                                    |
| `--avatar-small-height`     | `32px`    | height           | Height of the avatar when size is `'small'`.                                   |
| `--avatar-medium-width`     | `40px`    | width            | Width of the avatar when size is `'medium'`.                                   |
| `--avatar-medium-height`    | `40px`    | height           | Height of the avatar when size is `'medium'`.                                  |
| `--avatar-large-width`      | `56px`    | width            | Width of the avatar when size is `'large'`.                                    |
| `--avatar-large-height`     | `56px`    | height           | Height of the avatar when size is `'large'`.                                   |
| `--avatar-border-radius`    | `50%`     | border-radius    | Corner rounding of the avatar. Defaults to a full circle.                      |
| `--avatar-border`           | `none`    | border           | Border around the avatar container.                                            |
| `--avatar-box-shadow`       | `none`    | box-shadow       | Shadow effect around the avatar container.                                     |
| `--avatar-cursor`           | `default` | cursor           | Cursor style when hovering over the avatar.                                    |
| `--avatar-object-fit`       | `cover`   | object-fit       | How the avatar image fills its container.                                      |
| `--avatar-background`       | `#e0e0e0` | background-color | Background color shown behind initials when no image is displayed.             |
| `--avatar-text-color`       | `#555555` | color            | Text color of the initials.                                                    |
| `--avatar-small-font-size`  | `12px`    | font-size        | Font size of initials when size is `'small'`.                                  |
| `--avatar-medium-font-size` | `14px`    | font-size        | Font size of initials when size is `'medium'`.                                 |
| `--avatar-large-font-size`  | `20px`    | font-size        | Font size of initials when size is `'large'`.                                  |
| `--avatar-font-weight`      | `600`     | font-weight      | Font weight of the initials text.                                              |
| `--avatar-font-family`      | `inherit` | font-family      | Font family of the initials text.                                              |
| `--avatar-hover-opacity`    | `1`       | opacity          | Opacity of the avatar on hover. Set below 1 to create a hover feedback effect. |

## Type Reference

```typescript
type AvatarSize = 'small' | 'medium' | 'large';
```
