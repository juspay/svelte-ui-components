import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNarrationHighlighter } from './narrationHighlighter';
import type { ChartHighlightAPI } from './highlight';

/**
 * `LineChart`/`BarChart`/`PieChart` already hand back a `ChartHighlightAPI`
 * from `onChartReady`, documented as being "for imperative point highlighting
 * from external orchestrators (e.g. voice narration sync)". This is that
 * orchestrator: it watches a growing narration transcript and highlights the
 * slice being talked about.
 *
 * The matching rule is the part worth testing hardest. Categories are not
 * curated — a caller feeding a generative UI passes whatever labels the model
 * emitted — so `"Other"`, `"None"` and `"All"` are ordinary category names, and
 * a substring rule fires `"Other"` on "on the other hand". Because a category
 * only fires once per turn, that wrong highlight then sticks for the rest of
 * the narration.
 */

type Recorder = {
  api: ChartHighlightAPI;
  calls: (number | null)[];
};

const chartWith = (categories: string[]): Recorder => {
  const calls: (number | null)[] = [];
  return {
    calls,
    api: {
      highlight: (index) => {
        calls.push(index);
      },
      getCategories: () => categories,
      type: 'donut-chart'
    }
  };
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('matching', () => {
  it('highlights the category the narration names, and reports its index', () => {
    const chart = chartWith(['Revenue', 'Costs', 'Profit']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    expect(highlighter.processText('Looking at costs for the quarter')).toBe(1);
    expect(chart.calls).toEqual([1]);
  });

  it('reports null and highlights nothing when no category is named', () => {
    const chart = chartWith(['Revenue', 'Costs']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    expect(highlighter.processText('Here is the overall picture')).toBeNull();
    expect(chart.calls).toEqual([]);
  });

  it('does not fire "Other" on "otherwise" or "others"', () => {
    // What the whole-word default actually buys. A substring rule fires `Other`
    // on any word containing it, and the once-per-turn guard then locks that
    // wrong slice in for the rest of the narration.
    //
    // Deliberately the ONLY category. An earlier version of this case also had
    // `Retail` present and asserted `Retail` won -- which passed under a
    // substring rule too, because longest-match-wins picked the six-character
    // label over the five-character one. It asserted the tie-break, not the
    // matcher, and a mutation to substring matching went green through it.
    const chart = chartWith(['Other']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    expect(highlighter.processText('otherwise the quarter was flat')).toBeNull();
    expect(highlighter.processText('others were flat too')).toBeNull();
    expect(chart.calls).toEqual([]);
  });

  it('DOES fire on a common-word label used as an ordinary word — the known limit', () => {
    // Pinned rather than hidden. In "on the other hand", `other` is genuinely a
    // standalone word, so whole-word matching matches it and no lexical rule
    // could do otherwise without understanding the sentence. Whole-word
    // narrows the collision surface; it does not eliminate it for labels that
    // are ordinary English words.
    //
    // A caller who cannot curate labels -- categories arriving from a model's
    // tool output, say -- should pass `match` and require something stronger,
    // or reset between turns so a mis-fire cannot outlive one answer.
    const chart = chartWith(['Other']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    expect(highlighter.processText('on the other hand, things are flat')).toBe(0);
  });

  it('still fires a category that is genuinely named alongside a near-miss word', () => {
    const chart = chartWith(['Other', 'Retail']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    expect(highlighter.processText('otherwise, retail is flat')).toBe(1);
    expect(chart.calls).toEqual([1]);
  });

  it('matches a category that is a whole word regardless of surrounding punctuation', () => {
    const chart = chartWith(['Other']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    expect(highlighter.processText('everything else lands in "Other".')).toBe(0);
  });

  it('prefers the longest matching category when several match', () => {
    // "Q1" is a substring of "Q1 Europe" as a word too, so first-match-wins
    // would highlight the wrong, less specific slice.
    const chart = chartWith(['Q1', 'Q1 Europe']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    expect(highlighter.processText('Q1 Europe led the region')).toBe(1);
    expect(chart.calls).toEqual([1]);
  });

  it('ignores case by default and respects it when asked', () => {
    const insensitive = chartWith(['Revenue']);
    expect(
      createNarrationHighlighter({ chart: insensitive.api }).processText('REVENUE climbed')
    ).toBe(0);

    const sensitive = chartWith(['Revenue']);
    expect(
      createNarrationHighlighter({ chart: sensitive.api, caseSensitive: true }).processText(
        'REVENUE climbed'
      )
    ).toBeNull();
  });

  it('takes a caller-supplied matcher, which can restore substring behaviour', () => {
    const chart = chartWith(['Other']);
    const highlighter = createNarrationHighlighter({
      chart: chart.api,
      match: (narration, category) => narration.includes(category)
    });

    expect(highlighter.processText('on the other hand')).toBe(0);
  });

  it('skips an empty category label rather than matching everything', () => {
    const chart = chartWith(['', 'Retail']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    expect(highlighter.processText('anything at all')).toBeNull();
  });
});

describe('once per turn', () => {
  it('fires a category once, however many times the narration repeats it', () => {
    const chart = chartWith(['Revenue']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    expect(highlighter.processText('revenue')).toBe(0);
    expect(highlighter.processText('revenue rose, revenue again')).toBeNull();
    expect(chart.calls).toEqual([0]);
  });

  it('lets a later category fire after an earlier one already did', () => {
    const chart = chartWith(['Revenue', 'Costs']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    expect(highlighter.processText('revenue rose')).toBe(0);
    expect(highlighter.processText('revenue rose and costs fell')).toBe(1);
    expect(chart.calls).toEqual([0, 1]);
  });

  it('reset clears the fired set and the highlight, for a new turn', () => {
    const chart = chartWith(['Revenue']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    highlighter.processText('revenue');
    highlighter.reset();
    expect(chart.calls).toEqual([0, null]);

    expect(highlighter.processText('revenue')).toBe(0);
  });
});

describe('auto-clear', () => {
  it('clears the highlight after the default delay', () => {
    const chart = chartWith(['Revenue']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    highlighter.processText('revenue');
    expect(chart.calls).toEqual([0]);

    vi.advanceTimersByTime(1999);
    expect(chart.calls).toEqual([0]);
    vi.advanceTimersByTime(1);
    expect(chart.calls).toEqual([0, null]);
  });

  it('honours a caller-supplied delay', () => {
    const chart = chartWith(['Revenue']);
    const highlighter = createNarrationHighlighter({ chart: chart.api, autoClearMs: 500 });

    highlighter.processText('revenue');
    vi.advanceTimersByTime(500);
    expect(chart.calls).toEqual([0, null]);
  });

  it('restarts the delay when a new category fires', () => {
    const chart = chartWith(['Revenue', 'Costs']);
    const highlighter = createNarrationHighlighter({ chart: chart.api, autoClearMs: 1000 });

    highlighter.processText('revenue');
    vi.advanceTimersByTime(900);
    highlighter.processText('revenue and costs');
    vi.advanceTimersByTime(900);
    // The first highlight's clear must not fire while the second is showing.
    expect(chart.calls).toEqual([0, 1]);
    vi.advanceTimersByTime(100);
    expect(chart.calls).toEqual([0, 1, null]);
  });

  it('falls back to the default when the delay is unusable', () => {
    // A plain-JS or web-component caller can pass anything. NaN reaches
    // setTimeout as an immediate fire, which would clear the highlight before
    // it was seen.
    const chart = chartWith(['Revenue']);
    const highlighter = createNarrationHighlighter({ chart: chart.api, autoClearMs: Number.NaN });

    highlighter.processText('revenue');
    vi.advanceTimersByTime(1999);
    expect(chart.calls).toEqual([0]);
    vi.advanceTimersByTime(1);
    expect(chart.calls).toEqual([0, null]);
  });

  it('destroy cancels a pending clear without touching the chart', () => {
    const chart = chartWith(['Revenue']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    highlighter.processText('revenue');
    highlighter.destroy();
    vi.advanceTimersByTime(5000);
    expect(chart.calls).toEqual([0]);
  });
});

describe('hostile input from an untyped caller', () => {
  it('survives getCategories throwing', () => {
    const api: ChartHighlightAPI = {
      highlight: () => {},
      getCategories: () => {
        throw new Error('chart torn down');
      },
      type: 'bar-chart'
    };

    expect(createNarrationHighlighter({ chart: api }).processText('revenue')).toBeNull();
  });

  it('survives getCategories returning something that is not a string list', () => {
    const api = {
      highlight: () => {},
      getCategories: () => null,
      type: 'bar-chart'
    } as unknown as ChartHighlightAPI;

    expect(createNarrationHighlighter({ chart: api }).processText('revenue')).toBeNull();
  });

  it('reports null rather than throwing when the narration is not a string', () => {
    const chart = chartWith(['Revenue']);
    const highlighter = createNarrationHighlighter({ chart: chart.api });

    expect(highlighter.processText(null as unknown as string)).toBeNull();
    expect(chart.calls).toEqual([]);
  });

  it("preserves each category's original index when an invalid entry is dropped", () => {
    // A plain-JS or web-component caller can hand back an array the type
    // signature disallows. Filtering it down to a string-only list before
    // indexing would shift `Revenue` from index 1 to 0, and `chart.highlight`
    // would light up the wrong slice.
    const calls: (number | null)[] = [];
    const api = {
      highlight: (index: number | null) => {
        calls.push(index);
      },
      getCategories: () => [null, 'Revenue'],
      type: 'bar-chart'
    } as unknown as ChartHighlightAPI;
    const highlighter = createNarrationHighlighter({ chart: api });

    expect(highlighter.processText('revenue climbed')).toBe(1);
    expect(calls).toEqual([1]);
  });
});
