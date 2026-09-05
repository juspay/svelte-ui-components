/**
 * DESIGN_PRINCIPLES.md §3: every event prop is `on` followed by the event
 * name in lowercase — `onclick`, `onrowclick`, `onoverlayclick` — whether the
 * browser fires the event or the component invents it. One rule, so a consumer
 * never has to know which kind an event is, and the spelling a fork consumer
 * already uses works here unchanged.
 *
 * A handful of shared components had renamed an event for clarity while the
 * fork kept the plainer name; being a drop-in for those consumers means the
 * fork's name is the canonical one and the clearer name is the alias.
 */
export const CANONICAL_OVERRIDES: ReadonlyMap<string, string> = new Map([
  // Stepper carried two names for one event; the fork's is the survivor.
  ['Stepper::onstepclick', 'onhandlestepclick'],
  ['Stepper::onStepClick', 'onhandlestepclick'],
  ['Stepper::onhandleStepClick', 'onhandlestepclick'],
  ['Stepper::onHandleStepClick', 'onhandlestepclick'],
  ['Gallery::onDismiss', 'onclose'],
  ['Gallery::onIndexChange', 'onchange'],
  ['MediaUpload::onFilesChange', 'onchange'],
  ['MediaUpload::onRejected', 'onerror']
]);

export function canonicalEventName(component: string, prop: string): string {
  return CANONICAL_OVERRIDES.get(`${component}::${prop}`) ?? `on${prop.slice(2).toLowerCase()}`;
}

export type DerivedName =
  /** Already the canonical spelling; nothing to rename. */
  | { readonly kind: 'ok'; readonly target: string }
  /** Carries an uppercase letter, or a name the fork spells differently. */
  | { readonly kind: 'rename'; readonly target: string }
  /** Not an event prop at all. */
  | { readonly kind: 'unresolved'; readonly candidates: readonly string[] };

export function deriveEventName(prop: string, component = ''): DerivedName {
  if (!prop.startsWith('on') || prop.length <= 2) {
    return { kind: 'unresolved', candidates: [] };
  }
  const target = canonicalEventName(component, prop);
  return target === prop ? { kind: 'ok', target } : { kind: 'rename', target };
}
