# Migrating to 4.0.0

4.0.0 removes every event-prop spelling that 3.x deprecated. One event, one
prop name, lowercase throughout — the rule `DESIGN_PRINCIPLES.md` §3 states and
that 3.x could only half-apply while the old names still had to work.

Nothing else about your components changes. If you already ran the codemod on
3.x, you are done; this release deletes names you have stopped using.

## Do this

```sh
npx sui-codemod ./src
```

It rewrites the 190 renamed props across your `.svelte` files, in place. Run it
against a clean working tree so `git diff` shows you exactly what moved, and see
`--dry-run` first if you would rather read the change before taking it:

```sh
npx sui-codemod --dry-run ./src
```

The codemod is component-aware. It rewrites `onClick` on `<Toggle>` because
that is a prop this library renamed, and leaves `onClick` on your own
components alone.

### "Lowercase throughout" means props, not every callback

The rule governs **props you write on a tag**. Callback keys inside a config
object you build are a different thing — they are members of a value, not
attributes — and they were never deprecated, so 4.0.0 does not touch them and
neither does the codemod. They stay camelCase:

| Where                          | Keys that stay camelCase                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `TableColumn`                  | `onToggle`, `onSelect`, `onInput`, `onButtonClick`, `onPrimaryAction`, `onMenuAction` |
| `TableCheckboxSelectionConfig` | `onSelectionChange`                                                                   |
| `TablePaginationConfig`        | `onPageChange`, `onPageSizeChange`, `onLoadMore`                                      |
| `ComboboxAction`               | `onClick`                                                                             |

```svelte
<!-- onrowclick is a prop and was renamed; onToggle is a key in a value and was not. -->
<Table onrowclick={fn} columns={[{ id: 'a', onToggle: fn }]} />
```

So `<Table>` legitimately shows both spellings at once. If you expected
`onselectionchange` and did not find it, this is why.

### What it cannot do for you

Two shapes need a hand, and the codemod reports them rather than guessing:

- **Spread props.** `<Input {...inputEventProperties} />` hides the prop names
  from the rewriter, so a `WARN` line names the file and you rename the keys in
  the object yourself.
- **Dynamic components.** A tag it cannot resolve back to an import is
  reported, not rewritten.

## If you skip the codemod

An old spelling is now simply an unknown prop. Svelte does not error on one, so
your handler stops running and nothing announces it. In TypeScript the compiler
catches it — the prop is gone from the component's `Properties` type — which is
the loudest signal available and worth leaning on.

3.x warned once per prop in dev for exactly this reason. That warning is gone
with the props it described.

## Custom elements

The same rename applies to `<sui-*>` elements, whose declarations followed the
components. `element.onClick = fn` set an accessor that reached the component
in 3.x; in 4.0.0 that property is no longer declared, so the assignment lands
on a plain expando and never arrives. Use the lowercase name.

`addEventListener` is unaffected. It always went through the DOM rather than
through a declared prop, and still does.

## One correction worth calling out

`<Chat>` is the single component whose 3.x deprecation pointed the wrong way.
It shipped `onscrollstate` marked `@deprecated` in favour of `onScrollState`,
which inverts the rule every other component follows. That happened because the
prop borrowed its type by indexed access (`ChatMessageListProperties['onscrollstate']`)
rather than declaring a function inline, and the lint gate only recognised
inline function types as events, so the backwards tag was never flagged. The
gate now understands that shape.

4.0.0 resolves it the way the rule says: **`onscrollstate` is the prop, and
`onScrollState` is removed.** If you followed Chat's 3.x notice and moved to
`onScrollState`, move back — you are the one consumer group this release asks
to change in the opposite direction, and the codemod does not cover it because
the backwards pair was never in its table.

## Two props are removed outright, not renamed

The codemod cannot help with these, because there is nothing to rewrite them to.

**`<Table onCellChange>` / `<Table oncellchange>` is gone.** Table accepted it
so a call site could type-check a handler, and never called it — 3.x's own
`docs/Table.md` said so and pointed at the real pattern. A prop that does
nothing is worse than no prop, because it reads like wiring. The replacement is
unchanged and is what you were already meant to do: close over your handler
inside the `cell` snippet, which runs in your scope.

```svelte
<Table tableData={rows} tableHeaders={['Name', 'Score']}>
  {#snippet cell(value, rowIndex, colIndex)}
    <Input
      value={String(value ?? '')}
      oninput={(next) => handleCellChange(rowIndex, colIndex, next)}
    />
  {/snippet}
</Table>
```

**`children` is no longer declared on `<sui-chat-bubble>`, `<sui-draggable>` and
`<sui-resizable>`.** It never did anything — slotted content reaches a custom
element through the light DOM — and declaring it cost those elements their
`element.children` collection, which returned undefined instead of an
HTMLCollection. Removing the declaration gives it back. Put your content in the
element as you always did.

## Custom-element properties that collided with the platform

Twenty-four declarations used names the browser already defines on every
element: `title`, `id`, `role`, `hidden`, and the `aria*` accessors ARIAMixin
provides. Declaring them replaced the platform's accessor.

**The attributes are unchanged.** `<sui-card title="Sales">` works exactly as
before, because each declaration now pins the attribute it already observed.
What moved is the JavaScript property name, which is the collision itself:

```js
element.title = 'Sales'; // 3.x: set the component prop. 4.0.0: the tooltip.
element.cardTitle = 'Sales'; // 4.0.0: the component prop.
```

The new name is the component name followed by the old one —
`cardTitle`, `inputId`, `bannerRole`, `buttonAriaLabel`, `badgeHidden`, and so
on. If you only ever set these as HTML attributes, nothing changes for you.

## The full list

190 renames across 67 components.

<!-- The table below is generated from LEGACY_PAIRS, which is the same table
     the codemod reads. Regenerate rather than hand-edit. -->

| Component           | Legacy prop               | Corrected prop            |
| ------------------- | ------------------------- | ------------------------- |
| Accordion           | `onToggle`                | `ontoggle`                |
| AreaChart           | `onPointClick`            | `onpointclick`            |
| AreaChart           | `onPointHover`            | `onpointhover`            |
| AttachmentChipRow   | `onOpenFile`              | `onopenfile`              |
| AttachmentChipRow   | `onOpenImage`             | `onopenimage`             |
| AttachmentChipRow   | `onOpenVideo`             | `onopenvideo`             |
| AttachmentChipRow   | `onRemoveFile`            | `onremovefile`            |
| AttachmentChipRow   | `onRemoveImage`           | `onremoveimage`           |
| AttachmentChipRow   | `onRemoveVideo`           | `onremovevideo`           |
| Banner              | `onDismiss`               | `ondismiss`               |
| BarChart            | `onBarClick`              | `onbarclick`              |
| BarChart            | `onBarHover`              | `onbarhover`              |
| BarChart            | `onChartReady`            | `onchartready`            |
| Book                | `onPageChange`            | `onpagechange`            |
| Calendar            | `onMonthChange`           | `onmonthchange`           |
| Calendar            | `onRangeSelect`           | `onrangeselect`           |
| Calendar            | `onSelect`                | `onselect`                |
| Chat                | `onAttach`                | `onattach`                |
| Chat                | `onClose`                 | `onclose`                 |
| Chat                | `onFeedback`              | `onfeedback`              |
| Chat                | `onRetry`                 | `onretry`                 |
| Chat                | `onSend`                  | `onsend`                  |
| Chat                | `onStop`                  | `onstop`                  |
| Chat                | `onSuggestion`            | `onsuggestion`            |
| Chat                | `onVoice`                 | `onvoice`                 |
| ChatBubble          | `onClose`                 | `onclose`                 |
| ChatBubble          | `onOpen`                  | `onopen`                  |
| ChatBubble          | `onToggle`                | `ontoggle`                |
| ChatComposer        | `onAction`                | `onaction`                |
| ChatComposer        | `onAttach`                | `onattach`                |
| ChatComposer        | `onAttachClick`           | `onattachclick`           |
| ChatComposer        | `onOpenRichFile`          | `onopenrichfile`          |
| ChatComposer        | `onOpenRichImage`         | `onopenrichimage`         |
| ChatComposer        | `onOpenRichVideo`         | `onopenrichvideo`         |
| ChatComposer        | `onRemoveRichFile`        | `onremoverichfile`        |
| ChatComposer        | `onRemoveRichImage`       | `onremoverichimage`       |
| ChatComposer        | `onRemoveRichVideo`       | `onremoverichvideo`       |
| ChatComposer        | `onStop`                  | `onstop`                  |
| ChatComposer        | `onSubmit`                | `onsubmit`                |
| ChatComposer        | `onVoice`                 | `onvoice`                 |
| ChatHeader          | `onClose`                 | `onclose`                 |
| ChatMessage         | `onCopy`                  | `oncopy`                  |
| ChatMessage         | `onFeedback`              | `onfeedback`              |
| ChatMessage         | `onRetry`                 | `onretry`                 |
| ChatMessageList     | `onFeedback`              | `onfeedback`              |
| ChatMessageList     | `onRetry`                 | `onretry`                 |
| ChatMessageList     | `onScrollState`           | `onscrollstate`           |
| ChatSuggestions     | `onSelect`                | `onselect`                |
| Checkbox            | `onClick`                 | `onclick`                 |
| CheckListItem       | `onClick`                 | `onclick`                 |
| ChipInput           | `onAdd`                   | `onadd`                   |
| ChipInput           | `onChange`                | `onchange`                |
| ChipInput           | `onDismiss`               | `ondismiss`               |
| ChipInput           | `onEdit`                  | `onedit`                  |
| Choicebox           | `onClick`                 | `onclick`                 |
| ColorPicker         | `onChange`                | `onchange`                |
| ColorPicker         | `onInput`                 | `oninput`                 |
| Combobox            | `onAdd`                   | `onadd`                   |
| Combobox            | `onChange`                | `onchange`                |
| Combobox            | `onClose`                 | `onclose`                 |
| Combobox            | `onCreate`                | `oncreate`                |
| Combobox            | `onInput`                 | `oninput`                 |
| Combobox            | `onOpen`                  | `onopen`                  |
| Combobox            | `onRemove`                | `onremove`                |
| Combobox            | `onSelect`                | `onselect`                |
| CommandMenu         | `onClose`                 | `onclose`                 |
| CommandMenu         | `onSelect`                | `onselect`                |
| ContextMenu         | `onClose`                 | `onclose`                 |
| ContextMenu         | `onOpen`                  | `onopen`                  |
| ContextMenu         | `onSelect`                | `onselect`                |
| DateRangePicker     | `onApply`                 | `onapply`                 |
| DateRangePicker     | `onApplyCompare`          | `onapplycompare`          |
| DateRangePicker     | `onApplySingle`           | `onapplysingle`           |
| DateRangePicker     | `onCancel`                | `oncancel`                |
| DateRangePicker     | `onClear`                 | `onclear`                 |
| DateRangePicker     | `onOpenToggle`            | `onopentoggle`            |
| Draggable           | `onMove`                  | `onmove`                  |
| Draggable           | `onMoveEnd`               | `onmoveend`               |
| Draggable           | `onMoveStart`             | `onmovestart`             |
| DualAxisBarChart    | `onBarClick`              | `onbarclick`              |
| FileDropzoneTrigger | `onClick`                 | `onclick`                 |
| FileInput           | `onError`                 | `onerror`                 |
| FileInput           | `onFiles`                 | `onfiles`                 |
| FunnelChart         | `onStageClick`            | `onstageclick`            |
| FunnelChart         | `onStageHover`            | `onstagehover`            |
| Gallery             | `onDeleteClick`           | `ondeleteclick`           |
| Gallery             | `onDismiss`               | `onclose`                 |
| Gallery             | `onEditClick`             | `oneditclick`             |
| Gallery             | `onImageClick`            | `onimageclick`            |
| Gallery             | `onIndexChange`           | `onchange`                |
| Gallery             | `onOpen`                  | `onopen`                  |
| HITL                | `onConfirm`               | `onconfirm`               |
| HITL                | `onMicToggle`             | `onmictoggle`             |
| IframeViewer        | `onMessage`               | `onmessage`               |
| Img                 | `onError`                 | `onerror`                 |
| Input               | `onBlur`                  | `onblur`                  |
| Input               | `onClick`                 | `onclick`                 |
| Input               | `onFocus`                 | `onfocus`                 |
| Input               | `onFocusout`              | `onfocusout`              |
| Input               | `onInput`                 | `oninput`                 |
| Input               | `onKeyDown`               | `onkeydown`               |
| Input               | `onLeftIconClick`         | `onlefticonclick`         |
| Input               | `onPaste`                 | `onpaste`                 |
| Input               | `onRightIconClick`        | `onrighticonclick`        |
| Input               | `onStateChange`           | `onstatechange`           |
| LineChart           | `onChartReady`            | `onchartready`            |
| LineChart           | `onPointClick`            | `onpointclick`            |
| LineChart           | `onPointHover`            | `onpointhover`            |
| ListItem            | `oncenterTextClick`       | `oncentertextclick`       |
| ListItem            | `onCenterTextClick`       | `oncentertextclick`       |
| ListItem            | `onitemClick`             | `onitemclick`             |
| ListItem            | `onItemClick`             | `onitemclick`             |
| ListItem            | `onleftImageClick`        | `onleftimageclick`        |
| ListItem            | `onLeftImageClick`        | `onleftimageclick`        |
| ListItem            | `onrightImageClick`       | `onrightimageclick`       |
| ListItem            | `onRightImageClick`       | `onrightimageclick`       |
| ListItem            | `ontopSectionClick`       | `ontopsectionclick`       |
| ListItem            | `onTopSectionClick`       | `ontopsectionclick`       |
| LottiePlayer        | `onComplete`              | `oncomplete`              |
| LottiePlayer        | `onError`                 | `onerror`                 |
| MediaPlayer         | `onVolumeChange`          | `onvolumechange`          |
| MediaUpload         | `onFilesChange`           | `onchange`                |
| MediaUpload         | `onRejected`              | `onerror`                 |
| MediaUpload         | `onRemove`                | `onremove`                |
| Menu                | `onClose`                 | `onclose`                 |
| Menu                | `onOpen`                  | `onopen`                  |
| Menu                | `onSelect`                | `onselect`                |
| Modal               | `onClose`                 | `onclose`                 |
| Modal               | `onheaderLeftImageClick`  | `onheaderleftimageclick`  |
| Modal               | `onHeaderLeftImageClick`  | `onheaderleftimageclick`  |
| Modal               | `onheaderRightImageClick` | `onheaderrightimageclick` |
| Modal               | `onHeaderRightImageClick` | `onheaderrightimageclick` |
| Modal               | `onoverlayClick`          | `onoverlayclick`          |
| Modal               | `onOverlayClick`          | `onoverlayclick`          |
| Modal               | `onprimaryButtonClick`    | `onprimarybuttonclick`    |
| Modal               | `onPrimaryButtonClick`    | `onprimarybuttonclick`    |
| Modal               | `onsecondaryButtonClick`  | `onsecondarybuttonclick`  |
| Modal               | `onSecondaryButtonClick`  | `onsecondarybuttonclick`  |
| Pagination          | `onChange`                | `onchange`                |
| Pagination          | `onLoadMore`              | `onloadmore`              |
| PieChart            | `onChartReady`            | `onchartready`            |
| PieChart            | `onSliceClick`            | `onsliceclick`            |
| PieChart            | `onSliceHover`            | `onslicehover`            |
| Pill                | `onDismiss`               | `ondismiss`               |
| Radio               | `onChange`                | `onchange`                |
| Resizable           | `onResize`                | `onresize`                |
| Resizable           | `onResizeEnd`             | `onresizeend`             |
| Resizable           | `onResizeStart`           | `onresizestart`           |
| SankeyChart         | `onLinkClick`             | `onlinkclick`             |
| SankeyChart         | `onLinkHover`             | `onlinkhover`             |
| SankeyChart         | `onNodeClick`             | `onnodeclick`             |
| SankeyChart         | `onNodeHover`             | `onnodehover`             |
| Scroller            | `onScrollPosition`        | `onscrollposition`        |
| Select              | `onChange`                | `onchange`                |
| Select              | `onClose`                 | `onclose`                 |
| Select              | `onOpen`                  | `onopen`                  |
| Sheet               | `onAfterClose`            | `onafterclose`            |
| Sheet               | `onAfterOpen`             | `onafteropen`             |
| Sheet               | `onClose`                 | `onclose`                 |
| Slider              | `onChange`                | `onchange`                |
| Slider              | `onInput`                 | `oninput`                 |
| Snippet             | `onCopy`                  | `oncopy`                  |
| SplitButton         | `onSelect`                | `onselect`                |
| SplitInput          | `onChange`                | `onchange`                |
| SplitInput          | `onComplete`              | `oncomplete`              |
| SplitInput          | `onInput`                 | `oninput`                 |
| StatCard            | `onCheckboxChange`        | `oncheckboxchange`        |
| Status              | `onbuttonClick`           | `onbuttonclick`           |
| Status              | `onButtonClick`           | `onbuttonclick`           |
| Step                | `onClick`                 | `onclick`                 |
| Stepper             | `onhandleStepClick`       | `onhandlestepclick`       |
| Stepper             | `onHandleStepClick`       | `onhandlestepclick`       |
| Stepper             | `onstepclick`             | `onhandlestepclick`       |
| Stepper             | `onStepClick`             | `onhandlestepclick`       |
| Table               | `onRowClick`              | `onrowclick`              |
| Table               | `onSearchChange`          | `onsearchchange`          |
| Table               | `onSort`                  | `onsort`                  |
| Tabs                | `onChange`                | `onchange`                |
| Tabs                | `onKeyChange`             | `onkeychange`             |
| TaskList            | `onRetry`                 | `onretry`                 |
| ThemeSwitcher       | `onChange`                | `onchange`                |
| ThinkingIndicator   | `onRowSelect`             | `onrowselect`             |
| ThinkingIndicator   | `onSettled`               | `onsettled`               |
| ThinkingIndicator   | `onToggle`                | `ontoggle`                |
| Toast               | `onToastHide`             | `ontoasthide`             |
| Toggle              | `onClick`                 | `onclick`                 |
| Toolbar             | `onbackClick`             | `onbackclick`             |
| Toolbar             | `onBackClick`             | `onbackclick`             |
| ToolCallLog         | `onChipClick`             | `onchipclick`             |
| TypewriterText      | `onProgress`              | `onprogress`              |
