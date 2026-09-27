// @vitest-environment jsdom
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import HITL from './HITL.svelte';

const body = createRawSnippet(() => ({ render: () => '<p class="own-body">my own body</p>' }));

// countdownSeconds={0}: no interval, so nothing here depends on timers.
const base = { confirmationId: 'c1', title: 'Deploy', countdownSeconds: 0 };

const placeholder = (container: HTMLElement): string | null =>
  container.querySelector('.parameter-value')?.textContent ?? null;

// A card with nothing to list shows "No parameters". Supplying `children` is
// not a reason to hide it -- `children` predates `showEmptyParameters`, so an
// existing children-only consumer must render exactly as it always did. Only
// the explicit opt-out (or a `questions` card) hides it.
describe('HITL "No parameters" placeholder', () => {
  it('shows by default with nothing to list', () => {
    const { container } = render(HITL, { props: base });
    expect(placeholder(container)).toBe('No parameters');
  });

  it('still shows when only children is supplied', () => {
    const { container } = render(HITL, { props: { ...base, children: body } });
    expect(placeholder(container)).toBe('No parameters');
    expect(container.querySelector('.own-body')).not.toBeNull();
  });

  it('is hidden by showEmptyParameters={false}', () => {
    const { container } = render(HITL, {
      props: { ...base, children: body, showEmptyParameters: false }
    });
    expect(container.querySelector('.params')).toBeNull();
    expect(container.querySelector('.own-body')).not.toBeNull();
  });

  it('is hidden when the card asks questions', () => {
    const { container } = render(HITL, {
      props: {
        ...base,
        questions: [{ question: 'Which?', options: [{ label: 'A' }, { label: 'B' }] }]
      }
    });
    expect(container.querySelector('.params')).toBeNull();
  });

  it('never replaces real sections', () => {
    const { container } = render(HITL, {
      props: {
        ...base,
        showEmptyParameters: false,
        sections: [{ label: 'Target', value: 'prod' }]
      }
    });
    expect(placeholder(container)).toBe('prod');
  });

  it('covers functionArguments that are all hidden, too', () => {
    const functionArguments = { action: 'deploy' };
    const shown = render(HITL, { props: { ...base, functionArguments } });
    expect(placeholder(shown.container)).toBe('No parameters');

    const hidden = render(HITL, {
      props: { ...base, functionArguments, showEmptyParameters: false }
    });
    expect(hidden.container.querySelector('.params')).toBeNull();
  });
});

// -- the decisions a card can settle as -------------------------------------
// Settling is async (the mic is restored first), so each assertion waits for
// onconfirm rather than reading it straight after the click.

const COMPLETION = '.completion';

describe('HITL confirm and cancel', () => {
  it('shows both buttons by default', () => {
    const { getByRole } = render(HITL, { props: base });
    expect(getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(getByRole('button', { name: 'Confirm' })).toBeTruthy();
  });

  it('showCancel={false} removes the cancel button and keeps confirm', () => {
    const { queryByRole } = render(HITL, { props: { ...base, showCancel: false } });
    expect(queryByRole('button', { name: 'Cancel' })).toBeNull();
    expect(queryByRole('button', { name: 'Confirm' })).not.toBeNull();
  });

  it('showConfirm={false} removes the confirm button and keeps cancel', () => {
    const { queryByRole } = render(HITL, { props: { ...base, showConfirm: false } });
    expect(queryByRole('button', { name: 'Confirm' })).toBeNull();
    expect(queryByRole('button', { name: 'Cancel' })).not.toBeNull();
  });

  // The event keeps its original three keys: value / message / answers appear
  // only when an extra action or an answer settled the card.
  it('emits exactly {confirmationId, action, approved} for a plain confirm', async () => {
    const onconfirm = vi.fn();
    const { getByRole } = render(HITL, { props: { ...base, onconfirm } });
    await fireEvent.click(getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(onconfirm).toHaveBeenCalledTimes(1));
    expect(onconfirm.mock.calls[0][0]).toStrictEqual({
      confirmationId: 'c1',
      action: 'approved',
      approved: true
    });
  });

  it('emits exactly {confirmationId, action, approved} for a plain cancel', async () => {
    const onconfirm = vi.fn();
    const { getByRole } = render(HITL, { props: { ...base, onconfirm } });
    await fireEvent.click(getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onconfirm).toHaveBeenCalledTimes(1));
    expect(onconfirm.mock.calls[0][0]).toStrictEqual({
      confirmationId: 'c1',
      action: 'rejected',
      approved: false
    });
  });
});

describe('HITL extra actions', () => {
  it('a side action calls onSelect and never settles the card', async () => {
    const onSelect = vi.fn();
    const onconfirm = vi.fn();
    const { container, getByRole } = render(HITL, {
      props: { ...base, onconfirm, actions: [{ label: 'Peek', onSelect }] }
    });
    await fireEvent.click(getByRole('button', { name: 'Peek' }));
    await tick();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onconfirm).not.toHaveBeenCalled();
    expect(container.querySelector(COMPLETION)).toBeNull();
    expect(getByRole('button', { name: 'Confirm' })).toBeTruthy();
  });

  it('a decision action settles as settleAs and carries its value', async () => {
    const onconfirm = vi.fn();
    const { container, getByRole } = render(HITL, {
      props: {
        ...base,
        onconfirm,
        actions: [
          {
            kind: 'decision',
            label: 'Auto-accept edits',
            settleAs: 'approved',
            value: 'acceptEdits'
          }
        ]
      }
    });
    await fireEvent.click(getByRole('button', { name: 'Auto-accept edits' }));
    await waitFor(() => expect(onconfirm).toHaveBeenCalledTimes(1));
    expect(onconfirm.mock.calls[0][0]).toStrictEqual({
      confirmationId: 'c1',
      action: 'approved',
      approved: true,
      value: 'acceptEdits'
    });
    expect(container.querySelector(COMPLETION)).not.toBeNull();
  });
});

describe('HITL ask-for-text action', () => {
  const ask = {
    kind: 'ask-for-text',
    label: 'Deny with instructions\u2026',
    settleAs: 'rejected',
    value: 'other',
    submitLabel: 'Send',
    backLabel: 'Back'
  } as const;

  const open = async (onconfirm = vi.fn()) => {
    const utils = render(HITL, { props: { ...base, onconfirm, actions: [ask] } });
    await fireEvent.click(utils.getByRole('button', { name: ask.label }));
    await tick();
    return { ...utils, onconfirm };
  };

  it('opens a reply box in place of the action row, with Send disabled while empty', async () => {
    const { container, getByRole, queryByRole } = await open();
    expect(container.querySelector('.reply-box')).not.toBeNull();
    expect(queryByRole('button', { name: 'Confirm' })).toBeNull();
    expect((getByRole('button', { name: 'Send' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('settles with the typed text as `message` when Send is pressed', async () => {
    const { getByRole, onconfirm } = await open();
    await fireEvent.input(getByRole('textbox'), { target: { value: 'use staging' } });
    await tick();
    await fireEvent.click(getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onconfirm).toHaveBeenCalledTimes(1));
    expect(onconfirm.mock.calls[0][0]).toStrictEqual({
      confirmationId: 'c1',
      action: 'rejected',
      approved: false,
      value: 'other',
      message: 'use staging'
    });
  });

  it('sends on Enter in the one-line box', async () => {
    const { getByRole, onconfirm } = await open();
    const box = getByRole('textbox');
    await fireEvent.input(box, { target: { value: 'try again' } });
    await tick();
    await fireEvent.keyDown(box, { key: 'Enter' });
    await waitFor(() => expect(onconfirm).toHaveBeenCalledTimes(1));
    expect(onconfirm.mock.calls[0][0]).toMatchObject({ message: 'try again' });
  });

  it('Back closes the box without settling', async () => {
    const { container, getByRole, onconfirm } = await open();
    await fireEvent.click(getByRole('button', { name: 'Back' }));
    await tick();
    expect(container.querySelector('.reply-box')).toBeNull();
    expect(getByRole('button', { name: 'Confirm' })).toBeTruthy();
    expect(onconfirm).not.toHaveBeenCalled();
    expect(container.querySelector(COMPLETION)).toBeNull();
  });
});

describe('HITL questions', () => {
  const single = [
    {
      header: 'Release',
      question: 'Ship it now?',
      options: [{ label: 'ship it' }, { label: 'hold off' }]
    }
  ];
  const multi = [
    {
      question: 'Which regions?',
      multiSelect: true,
      options: [{ label: 'us-east' }, { label: 'eu-west' }]
    }
  ];
  const pressed = (node: HTMLElement): string | null => node.getAttribute('aria-pressed');

  it('answerOnSelect settles a single-select question the moment an option is clicked', async () => {
    const onconfirm = vi.fn();
    const { getByRole, queryByRole } = render(HITL, {
      props: { ...base, onconfirm, questions: single, answerOnSelect: true }
    });
    expect(pressed(getByRole('button', { name: 'ship it' }))).toBeNull();
    expect(queryByRole('button', { name: 'Send answers' })).toBeNull();
    await fireEvent.click(getByRole('button', { name: 'ship it' }));
    await waitFor(() => expect(onconfirm).toHaveBeenCalledTimes(1));
    expect(onconfirm.mock.calls[0][0]).toStrictEqual({
      confirmationId: 'c1',
      action: 'approved',
      approved: true,
      answers: [{ header: 'Release', question: 'Ship it now?', picks: ['ship it'] }]
    });
  });

  it('questionsSettleAs decides how answering settles the card', async () => {
    const onconfirm = vi.fn();
    const { getByRole } = render(HITL, {
      props: {
        ...base,
        onconfirm,
        questions: single,
        answerOnSelect: true,
        questionsSettleAs: 'rejected'
      }
    });
    await fireEvent.click(getByRole('button', { name: 'hold off' }));
    await waitFor(() => expect(onconfirm).toHaveBeenCalledTimes(1));
    expect(onconfirm.mock.calls[0][0]).toMatchObject({ action: 'rejected', approved: false });
  });

  it('without answerOnSelect, options toggle and Send answers waits for a pick', async () => {
    const onconfirm = vi.fn();
    const { getByRole } = render(HITL, { props: { ...base, onconfirm, questions: single } });
    const send = getByRole('button', { name: 'Send answers' }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);

    await fireEvent.click(getByRole('button', { name: 'ship it' }));
    await tick();
    expect(pressed(getByRole('button', { name: 'ship it' }))).toBe('true');
    expect(onconfirm).not.toHaveBeenCalled();
    expect(send.disabled).toBe(false);

    await fireEvent.click(send);
    await waitFor(() => expect(onconfirm).toHaveBeenCalledTimes(1));
    expect(onconfirm.mock.calls[0][0].answers).toStrictEqual([
      { header: 'Release', question: 'Ship it now?', picks: ['ship it'] }
    ]);
  });

  it('a multi-select question still needs Send answers under answerOnSelect', async () => {
    const onconfirm = vi.fn();
    const { getByRole } = render(HITL, {
      props: { ...base, onconfirm, questions: multi, answerOnSelect: true }
    });
    await fireEvent.click(getByRole('button', { name: 'us-east' }));
    await fireEvent.click(getByRole('button', { name: 'eu-west' }));
    await tick();
    expect(onconfirm).not.toHaveBeenCalled();
    expect(pressed(getByRole('button', { name: 'us-east' }))).toBe('true');

    await fireEvent.click(getByRole('button', { name: 'Send answers' }));
    await waitFor(() => expect(onconfirm).toHaveBeenCalledTimes(1));
    expect(onconfirm.mock.calls[0][0].answers).toStrictEqual([
      { question: 'Which regions?', picks: ['us-east', 'eu-west'] }
    ]);
  });
});
