/**
 * Mutual exclusion and arrow-key roving for `Choicebox`es that share a `name`.
 *
 * A native radio group is a browser behaviour rather than a component one: the
 * browser finds the other `<input type="radio">`s carrying the same name and
 * unchecks them. Choicebox's selection lives in a per-instance `selected` prop,
 * so nothing was doing that job -- two cards a consumer thought of as one group
 * could both be selected, and a keyboard user tabbed through every card instead
 * of arrowing between them, which is not how a radio group behaves.
 *
 * Membership is keyed by name AND by root node, so two forms on one page that
 * both use `name="plan"` stay separate groups and a card inside a shadow root
 * does not join one in the document. That is narrower than the platform, which
 * scopes a radio group to the owning form; form ownership is not readable from
 * a card that may not be inside a form at all, and the root node is the closest
 * boundary that always exists.
 *
 * The registry is imperative on purpose. Roving tabindex is a property of the
 * WHOLE group -- the single tab stop moves when any member's selection or
 * disabled state changes -- and a per-instance `$derived` cannot observe a
 * sibling's props. Each member re-registers whenever its own inputs change,
 * which is what re-runs the group-wide recalculation below.
 */

export type ChoiceboxGroupMember = {
  readonly element: HTMLElement;
  /**
   * Snapshots taken when the member registered, NOT live reads: Choicebox
   * re-registers whenever either value changes, and that re-registration is what
   * recalculates the group. So a `refreshRoving` running in the same tick as a
   * `setSelected` sees the pre-change answer and is corrected a moment later by
   * the re-registration it caused.
   */
  readonly isSelected: () => boolean;
  readonly isDisabled: () => boolean;
  /** Writes the member's own bindable `selected` prop. */
  readonly setSelected: (next: boolean) => void;
  /** Fires the member's `onclick`, so a group move reports like a click. */
  readonly notify: (next: boolean) => void;
};

type Registration = ChoiceboxGroupMember & { readonly name: string };

const registry = new Set<Registration>();

/** Members of `member`'s group, in DOM order. */
function groupOf(member: Registration): Registration[] {
  const root = member.element.getRootNode();
  return [...registry]
    .filter((other) => other.name === member.name && other.element.getRootNode() === root)
    .sort((a, b) =>
      (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
        ? -1
        : 1
    );
}

/**
 * One tab stop per group, on the selected card -- or on the first enabled card
 * while nothing is selected, which is what keeps an untouched group reachable
 * by Tab at all.
 */
function refreshRoving(group: readonly Registration[]): void {
  const enabled = group.filter((candidate) => !candidate.isDisabled());
  const tabbable = enabled.find((candidate) => candidate.isSelected()) ?? enabled.at(0) ?? null;
  for (const member of group) {
    member.element.tabIndex = member.isDisabled() ? -1 : member === tabbable ? 0 : -1;
  }
}

/**
 * Adds a card to the group named `name`. Returns the function that removes it
 * again; both ends recalculate the group's tab stop, so a card unmounting while
 * it held the tab stop hands it on rather than leaving the group unreachable.
 */
export function joinChoiceboxGroup(name: string, member: ChoiceboxGroupMember): () => void {
  const registration: Registration = { ...member, name };
  registry.add(registration);
  refreshRoving(groupOf(registration));
  return () => {
    registry.delete(registration);
    refreshRoving(groupOf(registration));
  };
}

/** The registration this element was added under, or null when ungrouped. */
function registrationFor(element: HTMLElement): Registration | null {
  for (const candidate of registry) {
    if (candidate.element === element) {
      return candidate;
    }
  }
  return null;
}

/**
 * Selects one card and deselects the rest, the way checking a native radio
 * unchecks its group. Siblings are told through `setSelected` so a consumer
 * binding `selected` on each card sees the change, and through `notify` so a
 * consumer listening on `onclick` is not left believing a deselected card is
 * still selected.
 */
export function selectExclusively(element: HTMLElement): void {
  const registration = registrationFor(element);
  if (registration === null) {
    return;
  }
  const group = groupOf(registration);
  for (const member of group) {
    if (member === registration || !member.isSelected()) {
      continue;
    }
    member.setSelected(false);
    member.notify(false);
  }
  registration.setSelected(true);
  refreshRoving(group);
}

export type GroupStep = 'next' | 'previous' | 'first' | 'last';

/**
 * Arrow-key movement inside a radio group. Moving selects, which is what a
 * native radio group does and what makes the group usable without a mouse: the
 * arrow keys are the only way to change the choice once Tab has entered it.
 *
 * Returns false when the element is not in a group, so the caller can leave the
 * key alone rather than swallowing it.
 */
export function moveWithinChoiceboxGroup(element: HTMLElement, step: GroupStep): boolean {
  const registration = registrationFor(element);
  if (registration === null) {
    return false;
  }
  const enabled = groupOf(registration).filter((candidate) => !candidate.isDisabled());
  if (enabled.length === 0) {
    return false;
  }
  const current = enabled.indexOf(registration);
  if (current === -1) {
    return false;
  }
  const target =
    step === 'first'
      ? enabled.at(0)
      : step === 'last'
        ? enabled.at(-1)
        : // Wraps, like a native radio group: arrowing past the last member
          // returns to the first rather than stopping dead.
          enabled.at((current + (step === 'next' ? 1 : -1) + enabled.length) % enabled.length);
  if (typeof target === 'undefined' || target === registration) {
    return true;
  }
  selectExclusively(target.element);
  target.notify(true);
  target.element.focus();
  return true;
}
