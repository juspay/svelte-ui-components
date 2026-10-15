# Link

A semantic anchor primitive for navigation and editorial links. It renders a real
`a href` without layout wrappers or imposed appearance. Button-styled actions can
continue to use `Button href`. Host token recipes style the link itself.

```svelte
<Link href="/integrations" classes="commerce-explore">Explore</Link>
```

## Props

| Prop          | Type                                       | Default  | Description                                         |
| ------------- | ------------------------------------------ | -------- | --------------------------------------------------- |
| `href`        | `string`                                   | required | Crawlable navigation destination                    |
| `target`      | `string`                                   | unset    | Native browsing context                             |
| `rel`         | `string`                                   | unset    | Defaults to `noopener noreferrer` for `_blank`      |
| `classes`     | `string`                                   | unset    | Classes on the anchor                               |
| `testId`      | `string`                                   | unset    | `data-pw` on the anchor                             |
| `element`     | `HTMLAnchorElement \| null`                | `null`   | Bindable native reference for Svelte                |
| `nativeAttrs` | `Omit<HTMLAnchorAttributes, managed keys>` | unset    | ARIA, download, routing and other native attributes |
| `children`    | `Snippet`                                  | unset    | Link content                                        |

## Events

`onclick` and `onkeydown` receive the native events. Calling `preventDefault()`
retains normal browser semantics, including application-owned navigation handling.

## Web Component

`<sui-link href="/integrations">Explore</sui-link>` supplies its content through
the default slot. Native callbacks remain native; no duplicate synthetic click or
keydown event is dispatched.

Web-component pre-default hooks use `onlinkclick` / `linkclick` and
`onlinkkeydown` / `linkkeydown`. These preserve the native host's `onclick` and
`onkeydown` accessors. Svelte consumers keep `onclick` and `onkeydown`.
