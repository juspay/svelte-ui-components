import { describe, expect, it } from 'vitest';
import { configCallbackNames, planDocRenames, rewriteDoc } from './rename-doc-usages.ts';

// Names that also appear as callback keys on config objects, so are
// ambiguous in prose; `planDocRenames` derives the real set from src/lib.
const AMBIGUOUS: ReadonlySet<string> = new Set(['onToggle', 'onClick']);

describe('rewriteDoc', () => {
  it('rewrites a component tag carrying the deprecated attribute, in any doc', () => {
    const out = rewriteDoc(
      'docs/Anything.md',
      '<Toggle checked={false} onClick={(v) => v} />',
      AMBIGUOUS
    );
    expect(out).toBe('<Toggle checked={false} onclick={(v) => v} />');
  });

  it('survives an arrow inside an earlier attribute and expands shorthand', () => {
    const out = rewriteDoc(
      'docs/Anything.md',
      '<Chat allowCopy onRetry={() => chat.retry()} {onSend}>',
      AMBIGUOUS
    );
    expect(out).toBe('<Chat allowCopy onretry={() => chat.retry()} onsend={onSend}>');
  });

  it('rewrites property access on a custom element', () => {
    const out = rewriteDoc('docs/Chat.md', 'Set `.onSend` via JS: `el.onSend = fn`', AMBIGUOUS);
    expect(out).toBe('Set `.onsend` via JS: `el.onsend = fn`');
  });

  it('rewrites a name that only ever names a prop, in prose and prop tables anywhere', () => {
    const out = rewriteDoc(
      'docs/Chat.md',
      '| onOverlayClick | fn |\nThe `onOverlayClick` callback fires.',
      AMBIGUOUS
    );
    expect(out).toBe('| onoverlayclick | fn |\nThe `onoverlayclick` callback fires.');
  });

  it("leaves a config-object callback key alone in another component's prose", () => {
    // `onToggle` is a key on a TableColumn; config keys keep their spelling,
    // and a Table doc mentioning it must not be rewritten just because
    // Accordion deprecates the same spelling as a prop.
    const text = 'Set `onToggle` on the column.\n| onToggle | `() => void` |';
    expect(rewriteDoc('docs/Table.md', text, AMBIGUOUS)).toBe(text);
  });

  it('rewrites an ambiguous name inside the doc of the component that deprecates it as a prop', () => {
    const out = rewriteDoc(
      'docs/Toggle.md',
      'The `onClick` event returns the state.\n| onClick | fn |',
      AMBIGUOUS
    );
    expect(out).toBe('The `onclick` event returns the state.\n| onclick | fn |');
  });

  it('lowercases Input the same way as everything else', () => {
    const out = rewriteDoc(
      'docs/Input.md',
      '| onInput | fn |\n<Input onBlur={() => {}} />',
      AMBIGUOUS
    );
    expect(out).toBe('| oninput | fn |\n<Input onblur={() => {}} />');
  });
});

describe('the reference docs', () => {
  it('treats a headless controller option as ambiguous, not as a component prop', () => {
    // `onError` is a deprecated prop on Input/Table AND a live option on
    // SpeechToTextOptions/ChatOptions, which live in types.ts. Scanning only
    // properties.ts missed the second kind, so a bare prose mention in any doc
    // was rewritten as though it were the deprecated prop -- which is why
    // SpeechSynthesisOptions had to misspell its own callback to get past this.
    const ambiguous = configCallbackNames(process.cwd());
    expect(ambiguous.has('onError')).toBe(true);

    const doc = 'The `onError` option fires when synthesis fails.\n';
    expect(rewriteDoc('/x/docs/SpeechSynthesis.md', doc, ambiguous)).toBe(doc);
  });

  it('never recommend a spelling the library deprecates', () => {
    // docs/ is what the MCP server serves to consumers: a deprecated name
    // here is an instruction to use something 4.0.0 removes.
    expect(planDocRenames(process.cwd()).map((item) => item.file)).toEqual([]);
  });
});
