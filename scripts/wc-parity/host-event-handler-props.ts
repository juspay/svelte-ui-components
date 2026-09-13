/**
 * Event-handler IDL attributes that already exist on `HTMLElement`. Declaring
 * one as a custom-element prop replaces the host's own accessor, so
 * `element.onclick = fn` sets this library's prop instead of registering a DOM
 * handler. On `sui-checkbox` and `sui-toggle` that is not just a shadowed
 * accessor but a changed signature: their `onclick` is typed
 * `(checked: boolean) => void`, so the assignment receives a boolean where every
 * other element in the document hands back a `MouseEvent`.
 *
 * Deliberately NOT folded into `HOST_RESERVED_PROPS` (scripts/wc-parity/prop-parity.ts).
 * That set is *excluded* from the parity requirement, so putting these there would stop
 * a wrapper that simply forgot to declare `onclick` from being reported missing —
 * masking the exact class of gap that suite exists to catch. These get recorded
 * separately instead: existing declarations are listed, and a new one fails.
 *
 * This is the platform's whole set, not the subset this library happens to use.
 * The first version listed only the 25 names currently declared somewhere, which
 * reads as thorough and is not: a guard built from present usage cannot fail on
 * a name nobody has used yet, so a wrapper adding `oncontextmenu` or `ondblclick`
 * tomorrow would have walked straight past the check whose entire job is to catch
 * that. Reviewed and corrected before merge.
 *
 * Enumerated in Chromium rather than curated by hand: every `on*` own-property
 * name reachable by walking `HTMLElement.prototype`'s chain — 114 of them,
 * through Element, Node and EventTarget. That is the same "ask the browser, do
 * not reason about it" method the ARIAMixin list in prop-parity.ts was built
 * with, and it is why `onselect` is here (a genuine host accessor) while
 * `onopen`, `ondismiss`, `onretry` and the library's other 80-odd bespoke
 * handler names are not: they collide with nothing.
 *
 * **Enumerate with touch support on.** Four of the 114 — `ontouchstart`,
 * `ontouchend`, `ontouchmove`, `ontouchcancel` — are only defined when the
 * browser reports touch, so a plain desktop context reports 110 and quietly
 * omits them. The first version of this list was built that way and missed all
 * four, while `Button.wc.svelte` was already declaring two: asking the browser
 * is only better than reasoning if you ask a browser configured like the ones
 * consumers use. Playwright's `hasTouch: true` is what makes the difference:
 *
 *   without touch -> []
 *   with touch    -> ontouchstart, ontouchend, ontouchmove, ontouchcancel
 *
 * Re-enumerate if a browser adds handlers. A name missing from this list is not
 * flagged, so the list being complete is what the guard rests on.
 *
 * Lives in its own file, separate from the rest of prop-parity.ts, because it
 * is the one piece of that module's data a browser-bundled module needs too:
 * src/wc/dispatch.ts (built for consumers by vite.config.wc.ts) reads this same
 * set to decide whether a callback prop may dispatch a same-named DOM event.
 * prop-parity.ts imports `readdirSync`/`readFileSync` and
 * `svelte/compiler`, none of which can be bundled for the browser, so the
 * constant has to live somewhere neither side of that boundary drags the other
 * one's dependencies in. This file imports nothing and assumes no DOM lib, so
 * both scripts/wc-parity/tsconfig.json (no DOM) and tsconfig.wc.json (DOM) can
 * check it without conflict.
 */
export const HOST_EVENT_HANDLER_PROPS: ReadonlySet<string> = new Set([
  'onabort',
  'onanimationcancel',
  'onanimationend',
  'onanimationiteration',
  'onanimationstart',
  'onauxclick',
  'onbeforecopy',
  'onbeforecut',
  'onbeforeinput',
  'onbeforematch',
  'onbeforepaste',
  'onbeforetoggle',
  'onbeforexrselect',
  'onblur',
  'oncancel',
  'oncanplay',
  'oncanplaythrough',
  'onchange',
  'onclick',
  'onclose',
  'oncommand',
  'oncontentvisibilityautostatechange',
  'oncontextlost',
  'oncontextmenu',
  'oncontextrestored',
  'oncopy',
  'oncuechange',
  'oncut',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'ondurationchange',
  'onemptied',
  'onended',
  'onerror',
  'onfocus',
  'onformdata',
  'onfullscreenchange',
  'onfullscreenerror',
  'ongotpointercapture',
  'oninput',
  'oninvalid',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onload',
  'onloadeddata',
  'onloadedmetadata',
  'onloadstart',
  'onlostpointercapture',
  'onmousedown',
  'onmouseenter',
  'onmouseleave',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onmousewheel',
  'onpaste',
  'onpause',
  'onplay',
  'onplaying',
  'onpointercancel',
  'onpointerdown',
  'onpointerenter',
  'onpointerleave',
  'onpointermove',
  'onpointerout',
  'onpointerover',
  'onpointerrawupdate',
  'onpointerup',
  'onprogress',
  'onratechange',
  'onreset',
  'onresize',
  'onscroll',
  'onscrollend',
  'onscrollsnapchange',
  'onscrollsnapchanging',
  'onsearch',
  'onsecuritypolicyviolation',
  'onseeked',
  'onseeking',
  'onselect',
  'onselectionchange',
  'onselectstart',
  'onslotchange',
  'onstalled',
  'onsubmit',
  'onsuspend',
  'ontimeupdate',
  'ontoggle',
  'ontouchcancel',
  'ontouchend',
  'ontouchmove',
  'ontouchstart',
  'ontransitioncancel',
  'ontransitionend',
  'ontransitionrun',
  'ontransitionstart',
  'onvolumechange',
  'onwaiting',
  'onwebkitanimationend',
  'onwebkitanimationiteration',
  'onwebkitanimationstart',
  'onwebkitfullscreenchange',
  'onwebkitfullscreenerror',
  'onwebkittransitionend',
  'onwheel'
]);
