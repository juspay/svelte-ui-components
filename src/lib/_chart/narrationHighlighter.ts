import type { ChartHighlightAPI } from './highlight';

/**
 * Drives a chart's highlight from a growing narration transcript.
 *
 * `LineChart`, `BarChart` and `PieChart` hand back a `ChartHighlightAPI` from
 * `onChartReady`, described there as being "for imperative point highlighting
 * from external orchestrators (e.g. voice narration sync, step-through
 * animations)". The socket shipped; the plug did not, so the obvious consumer —
 * an assistant speaking over a chart — hand-rolled it, together with a registry
 * of charts and a store of pending highlights.
 *
 * None of that is needed here. `getCategories()` is already the label list a
 * registry would have duplicated, and `highlight(null)` is already the clear
 * path, so this holds one `ChartHighlightAPI` and nothing else. Passing the API
 * straight in also removes a race the registry version had to work around: a
 * registry keyed by chart identity has to tolerate `onChartReady` firing before
 * the chart is registered, which is a window that does not exist when the
 * caller simply hands over the object it was given.
 *
 * ```ts
 * let highlighter: NarrationHighlighter | null = null;
 *
 * <LineChart {data} onChartReady={(chart) => {
 *   highlighter = createNarrationHighlighter({ chart });
 * }} />
 *
 * // as each transcript chunk arrives
 * highlighter?.processText(transcriptSoFar);
 * // when the assistant starts a new answer
 * highlighter?.reset();
 * ```
 */
export type NarrationHighlighterOptions = {
  /** The API handed to `onChartReady` by the chart being narrated. */
  chart: ChartHighlightAPI;
  /** Milliseconds a highlight stays up before clearing. Defaults to `2000`. */
  autoClearMs?: number;
  /** Match category labels case-sensitively. Defaults to `false`. */
  caseSensitive?: boolean;
  /**
   * Replaces the built-in matching rule. Receives the narration and one
   * category label, already lower-cased unless `caseSensitive` is set.
   *
   * The default matches a label only as a whole word. Substring matching is
   * available through this hook — `(narration, category) =>
   * narration.includes(category)` — but is a poor default: category labels are
   * frequently ordinary words like `Other`, `All` or `None`, especially when
   * they come from a model's tool output rather than a curated list, and a
   * substring rule fires `Other` on `otherwise` and `others`.
   *
   * Whole-word matching narrows that surface; it does not close it. In "on the
   * other hand", `other` is genuinely a standalone word, so the label still
   * matches and no lexical rule could decide otherwise without reading the
   * sentence. A caller who cannot curate labels should require something
   * stronger here, and should `reset()` between turns so a mis-fire cannot
   * outlive one answer.
   */
  match?: (narration: string, category: string) => boolean;
};

export type NarrationHighlighter = {
  /**
   * Reads the transcript so far and highlights the first not-yet-seen category
   * it names. Returns that category's index, or `null` when the narration named
   * nothing new.
   *
   * Safe to call on every chunk: the transcript is expected to grow, and a
   * category already highlighted this turn is not highlighted again.
   */
  processText: (narration: string) => number | null;
  /**
   * Starts a new turn: clears the highlight and forgets which categories have
   * fired, so they can fire again for the next answer.
   */
  reset: () => void;
  /**
   * Cancels a pending auto-clear. Call from the owner's teardown.
   *
   * Deliberately does not call into the chart: teardown ordering is the
   * caller's, and the chart may already be gone.
   */
  destroy: () => void;
};

const DEFAULT_AUTO_CLEAR_MS = 2000;

/** Letters, digits and underscore, so a label is matched only as a whole word. */
const WORD_CHARACTER = /[\p{L}\p{N}_]/u;

/**
 * `charAt` rather than indexing: out of range it returns `''`, which is not a
 * word character, so the string's edges need no special case.
 */
const isWordCharacter = (character: string): boolean => WORD_CHARACTER.test(character);

/**
 * True when `needle` appears in `haystack` bounded by non-word characters.
 *
 * Written as a scan rather than a `RegExp` for two reasons: a category label is
 * caller data and would have to be escaped, and `\b` is defined over ASCII word
 * characters, so it mismatches labels like `Café` or `北区`. Lookbehind would
 * solve the second but is not available everywhere this library runs.
 */
const occursAsWord = (haystack: string, needle: string): boolean => {
  for (let from = 0; from <= haystack.length - needle.length; ) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) {
      return false;
    }
    const before = at === 0 ? '' : haystack.charAt(at - 1);
    const after = haystack.charAt(at + needle.length);
    if (!isWordCharacter(before) && !isWordCharacter(after)) {
      return true;
    }
    from = at + 1;
  }
  return false;
};

/**
 * The type says `number`, but a plain-JS or web-component caller can pass
 * anything. `NaN` reaches `setTimeout` as an immediate fire, clearing the
 * highlight before it has been seen, so an unusable delay degrades to the
 * default rather than breaking the affordance it controls.
 */
const resolveAutoClearMs = (value: number | null): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_AUTO_CLEAR_MS;
  }
  return value;
};

/**
 * A category label paired with its position in the chart's own array. Kept
 * together rather than filtering to a plain `string[]`: `chart.highlight`
 * takes an index into the ORIGINAL categories, so once an invalid entry is
 * dropped, a filtered array's index no longer agrees with the chart's.
 */
type ReadCategory = {
  readonly label: string;
  readonly sourceIndex: number;
};

/** `getCategories` is the chart's, and a torn-down chart can throw or return junk. */
const readCategories = (chart: ChartHighlightAPI): readonly ReadCategory[] => {
  try {
    const categories = chart.getCategories();
    if (!Array.isArray(categories)) {
      return [];
    }
    return categories.flatMap((category, sourceIndex) =>
      typeof category === 'string' ? [{ label: category, sourceIndex }] : []
    );
  } catch {
    return [];
  }
};

export const createNarrationHighlighter = (
  options: NarrationHighlighterOptions
): NarrationHighlighter => {
  const { chart, caseSensitive = false, match } = options;
  const autoClearMs = resolveAutoClearMs(options.autoClearMs ?? null);

  const fired = new Set<number>();
  let clearTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelPendingClear = (): void => {
    if (clearTimer !== null) {
      clearTimeout(clearTimer);
      clearTimer = null;
    }
  };

  const matches = (narration: string, category: string): boolean =>
    match ? match(narration, category) : occursAsWord(narration, category);

  return {
    processText: (narration) => {
      if (typeof narration !== 'string' || narration.length === 0) {
        return null;
      }

      const haystack = caseSensitive ? narration : narration.toLowerCase();
      const categories = readCategories(chart);

      /*
       * Longest label wins. `Q1` is a whole-word match inside `Q1 Europe`, so
       * taking the first hit would highlight the broader slice while the
       * narration is naming the narrower one. Ties keep the earlier index,
       * which makes the choice stable across calls.
       */
      let bestIndex: number | null = null;
      let bestLength = 0;

      categories.forEach(({ label, sourceIndex }) => {
        if (label.length === 0 || fired.has(sourceIndex) || label.length <= bestLength) {
          return;
        }
        const needle = caseSensitive ? label : label.toLowerCase();
        if (matches(haystack, needle)) {
          bestIndex = sourceIndex;
          bestLength = label.length;
        }
      });

      if (bestIndex === null) {
        return null;
      }

      fired.add(bestIndex);
      cancelPendingClear();
      chart.highlight(bestIndex);
      clearTimer = setTimeout(() => {
        clearTimer = null;
        chart.highlight(null);
      }, autoClearMs);

      return bestIndex;
    },

    reset: () => {
      cancelPendingClear();
      fired.clear();
      chart.highlight(null);
    },

    destroy: cancelPendingClear
  };
};
