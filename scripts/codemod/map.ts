/**
 * Casing-only prop pairs between this library (SUI) and its fork
 * `polymorph-ui-components` (poly). Poly renamed synthesized event props to
 * all-lowercase; these are the props whose names differ ONLY in case between
 * the two libraries.
 *
 * Derived mechanically (not copied from docs): the `$props()` destructure of
 * every component exported by both `src/lib/index.ts` (SUI @ release) and
 * `dist/index.js` of polymorph-ui-components@0.7.0 was parsed with
 * `svelte/compiler`, and a pair was accepted only when
 * `lower(suiName) === lower(polyName)`, the names differ, and neither side
 * also declares the other side's spelling (which would make a rewrite
 * ambiguous or unnecessary). Cross-checked against each component's
 * `properties.ts` / `properties.d.ts`.
 *
 * Deliberately excluded (same event, different word — a semantic rename, not
 * a casing pair; these need a human):
 *   Gallery:     poly `onclose`  vs SUI `onDismiss`,  poly `onchange` vs SUI `onIndexChange`
 *   MediaUpload: poly `onchange` vs SUI `onFilesChange`, poly `onerror` vs SUI `onRejected`
 * Props spelled identically on both sides (e.g. `onkeydown` on ListItem or
 * Modal) are intentionally absent: they need no rewrite. `onkeydown` on Input
 * IS listed because SUI's Input only accepts `onKeyDown`.
 */

export type PropPair = {
  readonly component: string;
  readonly sui: string;
  readonly poly: string;
};

export const SUI_PACKAGE = '@juspay/svelte-ui-components';
export const POLY_PACKAGE = 'polymorph-ui-components';

export const PROP_PAIRS: ReadonlyArray<PropPair> = [
  { component: 'Gallery', sui: 'onDeleteClick', poly: 'ondeleteclick' },
  { component: 'Gallery', sui: 'onEditClick', poly: 'oneditclick' },
  { component: 'Gallery', sui: 'onImageClick', poly: 'onimageclick' },
  { component: 'Gallery', sui: 'onOpen', poly: 'onopen' },
  { component: 'Input', sui: 'onBlur', poly: 'onblur' },
  { component: 'Input', sui: 'onClick', poly: 'onclick' },
  { component: 'Input', sui: 'onFocus', poly: 'onfocus' },
  { component: 'Input', sui: 'onFocusout', poly: 'onfocusout' },
  { component: 'Input', sui: 'onInput', poly: 'oninput' },
  { component: 'Input', sui: 'onKeyDown', poly: 'onkeydown' },
  { component: 'Input', sui: 'onPaste', poly: 'onpaste' },
  { component: 'Input', sui: 'onStateChange', poly: 'onstatechange' },
  { component: 'ListItem', sui: 'oncenterTextClick', poly: 'oncentertextclick' },
  { component: 'ListItem', sui: 'onitemClick', poly: 'onitemclick' },
  { component: 'ListItem', sui: 'onleftImageClick', poly: 'onleftimageclick' },
  { component: 'ListItem', sui: 'onrightImageClick', poly: 'onrightimageclick' },
  { component: 'ListItem', sui: 'ontopSectionClick', poly: 'ontopsectionclick' },
  { component: 'MediaUpload', sui: 'onRemove', poly: 'onremove' },
  { component: 'Modal', sui: 'onheaderLeftImageClick', poly: 'onheaderleftimageclick' },
  { component: 'Modal', sui: 'onheaderRightImageClick', poly: 'onheaderrightimageclick' },
  { component: 'Modal', sui: 'onoverlayClick', poly: 'onoverlayclick' },
  { component: 'Modal', sui: 'onprimaryButtonClick', poly: 'onprimarybuttonclick' },
  { component: 'Modal', sui: 'onsecondaryButtonClick', poly: 'onsecondarybuttonclick' },
  { component: 'Stepper', sui: 'onhandleStepClick', poly: 'onhandlestepclick' },
  { component: 'Table', sui: 'onRowClick', poly: 'onrowclick' },
  { component: 'Table', sui: 'onSort', poly: 'onsort' },
  { component: 'Toast', sui: 'onToastHide', poly: 'ontoasthide' },
  { component: 'Toolbar', sui: 'onbackClick', poly: 'onbackclick' }
];

export type Direction = 'to-sui' | 'to-poly';

export type DirectionConfig = {
  readonly fromPackage: string;
  readonly toPackage: string;
  /** component name -> (source prop name -> target prop name) */
  readonly renames: ReadonlyMap<string, ReadonlyMap<string, string>>;
  /** every source prop name across all components, for unresolved-tag warnings */
  readonly allFromProps: ReadonlySet<string>;
};

export function directionConfig(direction: Direction): DirectionConfig {
  const renames = new Map<string, Map<string, string>>();
  const allFromProps = new Set<string>();
  for (const pair of PROP_PAIRS) {
    const from = direction === 'to-sui' ? pair.poly : pair.sui;
    const to = direction === 'to-sui' ? pair.sui : pair.poly;
    const table = renames.get(pair.component) ?? new Map<string, string>();
    table.set(from, to);
    renames.set(pair.component, table);
    allFromProps.add(from);
  }
  return {
    fromPackage: direction === 'to-sui' ? POLY_PACKAGE : SUI_PACKAGE,
    toPackage: direction === 'to-sui' ? SUI_PACKAGE : POLY_PACKAGE,
    renames,
    allFromProps
  };
}
