import { afterEach, describe, expect, it } from 'vitest';
import { labelRootOf, readReferencedText, watchReferencedText } from './label-reference';

const mounted: Element[] = [];

const mount = <T extends Element>(element: T, parent: Node = document.body): T => {
  parent.appendChild(element);
  mounted.push(element);
  return element;
};

const labelled = (id: string, text: string): HTMLSpanElement => {
  const span = document.createElement('span');
  span.id = id;
  span.textContent = text;
  return mount(span);
};

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  for (const element of mounted.splice(0)) {
    element.remove();
  }
});

describe('readReferencedText', () => {
  it('joins the text of every id that exists, in id order, with whitespace collapsed', () => {
    labelled('a', ' Ship\n  to ');
    labelled('b', 'country');

    expect(readReferencedText(document, 'a b')).toBe('Ship to country');
    expect(readReferencedText(document, 'b a')).toBe('country Ship to');
  });

  it('skips an id that is missing and is undefined when nothing resolves', () => {
    labelled('a', 'Country');

    expect(readReferencedText(document, 'missing a')).toBe('Country');
    expect(readReferencedText(document, 'missing')).toBeUndefined();
    expect(readReferencedText(document, '   ')).toBeUndefined();
    expect(readReferencedText(document, undefined)).toBeUndefined();
  });

  it('is undefined for a label with no text', () => {
    labelled('empty', '   ');

    expect(readReferencedText(document, 'empty')).toBeUndefined();
  });

  it('resolves against a shadow root, not only the document', () => {
    const host = mount(document.createElement('div'));
    const shadow = host.attachShadow({ mode: 'open' });
    const span = document.createElement('span');
    span.id = 'inner';
    span.textContent = 'Inside the shadow';
    shadow.appendChild(span);

    expect(readReferencedText(shadow, 'inner')).toBe('Inside the shadow');
    expect(readReferencedText(document, 'inner')).toBeUndefined();
  });
});

describe('labelRootOf', () => {
  it('recognizes a document from a different realm after adoption', () => {
    const iframe = mount(document.createElement('iframe'));
    const foreign = iframe.contentDocument;
    expect(foreign).not.toBeNull();
    if (foreign === null) throw new Error('The frame document must exist');
    const node = document.createElement('div');
    foreign.body.appendChild(node);
    expect(labelRootOf(node)).toBe(foreign);
  });
  it('is the document for a light-DOM host and the shadow root for a nested one', () => {
    const light = mount(document.createElement('div'));
    expect(labelRootOf(light)).toBe(document);

    const outer = mount(document.createElement('div'));
    const shadow = outer.attachShadow({ mode: 'open' });
    const nested = document.createElement('div');
    shadow.appendChild(nested);
    expect(labelRootOf(nested)).toBe(shadow);
  });

  it('is null for a host that is not in a document or shadow root', () => {
    expect(labelRootOf(document.createElement('div'))).toBeNull();
  });
});

describe('watchReferencedText', () => {
  it('follows the host into another root and observes that root’s later label changes', async () => {
    labelled('moving', 'Outside country');
    const control = mount(document.createElement('div'));
    const outer = mount(document.createElement('div'));
    const shadow = outer.attachShadow({ mode: 'open' });
    const innerLabel = document.createElement('span');
    innerLabel.id = 'moving';
    innerLabel.textContent = 'Inside country';
    shadow.appendChild(innerLabel);
    const seen: Array<string | undefined> = [];
    const stop = watchReferencedText(
      document,
      'moving',
      (text) => seen.push(text),
      () => labelRootOf(control)
    );
    expect(seen.at(-1)).toBe('Outside country');
    shadow.appendChild(control);
    await tick();
    expect(seen.at(-1)).toBe('Inside country');
    innerLabel.textContent = 'Updated inside country';
    await tick();
    expect(seen.at(-1)).toBe('Updated inside country');
    stop();
  });
  it('reports the current text immediately', () => {
    labelled('l', 'Country');
    const seen: Array<string | undefined> = [];

    const stop = watchReferencedText(document, 'l', (text) => seen.push(text));
    stop();

    expect(seen).toEqual(['Country']);
  });

  it('reports undefined and watches nothing when there are no ids', () => {
    const seen: Array<string | undefined> = [];

    const stop = watchReferencedText(document, '  ', (text) => seen.push(text));
    stop();

    expect(seen).toEqual([undefined]);
  });

  it('follows an edit to the label text', async () => {
    const label = labelled('l', 'Country');
    const seen: Array<string | undefined> = [];
    const stop = watchReferencedText(document, 'l', (text) => seen.push(text));

    label.textContent = 'Nation';
    await tick();
    stop();

    expect(seen.at(-1)).toBe('Nation');
  });

  it('picks up a label that is rendered after the element', async () => {
    const seen: Array<string | undefined> = [];
    const stop = watchReferencedText(document, 'late', (text) => seen.push(text));
    expect(seen).toEqual([undefined]);

    labelled('late', 'Arrived later');
    await tick();
    stop();

    expect(seen.at(-1)).toBe('Arrived later');
  });

  it('follows a label that is replaced by a new element with the same id', async () => {
    const original = labelled('l', 'Old');
    const seen: Array<string | undefined> = [];
    const stop = watchReferencedText(document, 'l', (text) => seen.push(text));

    original.remove();
    labelled('l', 'New');
    await tick();
    stop();

    expect(seen.at(-1)).toBe('New');
  });

  it('stops reporting once stopped', async () => {
    const label = labelled('l', 'Country');
    const seen: Array<string | undefined> = [];
    const stop = watchReferencedText(document, 'l', (text) => seen.push(text));
    stop();
    const before = seen.length;

    label.textContent = 'Changed after stop';
    await tick();

    expect(seen).toHaveLength(before);
  });
  it('keeps observing a prior root through a detached interval and later reconnect', async () => {
    const label = labelled('reconnect', 'Country');
    const host = mount(document.createElement('div'));
    const seen: Array<string | undefined> = [];
    const stop = watchReferencedText(
      document,
      'reconnect',
      (text) => seen.push(text),
      () => labelRootOf(host)
    );
    host.remove();
    await tick();
    expect(seen.at(-1)).toBeUndefined();
    document.body.appendChild(host);
    await tick();
    expect(seen.at(-1)).toBe('Country');
    label.textContent = 'Updated country';
    await tick();
    expect(seen.at(-1)).toBe('Updated country');
    stop();
  });

  it('rechecks a native observer reconnect into another shadow root in the same delivery', async () => {
    labelled('checkpoint', 'Outside country');
    const host = mount(document.createElement('div'));
    const outer = mount(document.createElement('div'));
    const shadow = outer.attachShadow({ mode: 'open' });
    const innerLabel = document.createElement('span');
    innerLabel.id = 'checkpoint';
    innerLabel.textContent = 'Inside country';
    shadow.appendChild(innerLabel);
    const seen: Array<string | undefined> = [];
    const stop = watchReferencedText(
      document,
      'checkpoint',
      (text) => seen.push(text),
      () => labelRootOf(host)
    );
    const reconnect = new MutationObserver((records) => {
      if (records.some((record) => Array.from(record.removedNodes).includes(host))) {
        reconnect.disconnect();
        shadow.appendChild(host);
      }
    });
    reconnect.observe(document.body, { childList: true });
    host.remove();
    await tick();
    expect(seen.at(-1)).toBe('Inside country');
    innerLabel.textContent = 'Updated inside country';
    await tick();
    expect(seen.at(-1)).toBe('Updated inside country');
    stop();
  });

  it('does not reactivate or report when stopped with a reconnect check queued', async () => {
    const label = labelled('stopped-reconnect', 'Country');
    const host = mount(document.createElement('div'));
    const seen: Array<string | undefined> = [];
    const stop = watchReferencedText(
      document,
      'stopped-reconnect',
      (text) => seen.push(text),
      () => labelRootOf(host)
    );
    let lengthAtStop = 0;
    const reconnect = new MutationObserver((records) => {
      if (records.some((record) => Array.from(record.removedNodes).includes(host))) {
        reconnect.disconnect();
        stop();
        lengthAtStop = seen.length;
        document.body.appendChild(host);
      }
    });
    reconnect.observe(document.body, { childList: true });
    host.remove();
    await tick();
    label.textContent = 'After stop';
    await tick();
    expect(lengthAtStop).toBeGreaterThan(0);
    expect(seen).toHaveLength(lengthAtStop);
  });
});
