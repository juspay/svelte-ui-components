import { expect, test } from '@playwright/test';

test.describe('ChatComposer — async onsubmit and independent per-control disable', () => {
  // #526: an onsubmit resolving to `false` must leave the draft (value +
  // attachments) exactly as it was, instead of the unconditional clear the
  // composer applied before. This drives the actual component through its
  // real async path (a genuine setTimeout-based promise on the demo page),
  // not just the extracted `shouldApplyClear` unit under test elsewhere.
  test('a failed async send keeps the typed draft; a successful one clears it', async ({
    page
  }) => {
    await page.goto('/components/chat-composer');

    const input = page.getByTestId('async-submit-input');
    const send = page.getByTestId('async-submit-send');
    const failToggle = page.getByTestId('async-submit-fail-toggle');

    // Failure path: the draft must survive the resolved `false`.
    await failToggle.check();
    await input.fill('this send will fail');
    await send.click();
    await expect(page.getByTestId('async-submit-sent')).toHaveCount(0);
    // `sendDisabled` is bound to the pending flag, so the send button only
    // re-enables once the 300ms fakeSend actually settles — waiting on it
    // here is what makes the value check below prove the clear was
    // genuinely skipped, rather than merely not-yet-applied because the
    // promise hadn't resolved yet.
    await expect(send).toBeEnabled();
    await expect(input).toHaveValue('this send will fail');

    // Success path: the same input, unblocked, clears as normal.
    await failToggle.uncheck();
    await send.click();
    await expect(page.getByTestId('async-submit-sent')).toHaveText('this send will fail');
    await expect(input).toHaveValue('');
  });

  // #526: a rejected `onsubmit` promise must keep the draft exactly like a
  // resolved `false` does — ChatComposer.svelte catches the rejection and
  // never calls the clearing logic (see submitResult.ts). This drives the
  // real rejection path (an actual thrown error inside the demo's fakeSend),
  // not just the resolved-`false` branch the previous test covers.
  test('a rejected async send keeps the typed draft, same as a resolved false', async ({
    page
  }) => {
    await page.goto('/components/chat-composer');

    const input = page.getByTestId('async-submit-input');
    const send = page.getByTestId('async-submit-send');
    const rejectToggle = page.getByTestId('async-submit-reject-toggle');

    await rejectToggle.check();
    await input.fill('this send will reject');
    await send.click();
    await expect(page.getByTestId('async-submit-sent')).toHaveCount(0);
    // Wait for the 300ms fakeSend (and its rejection) to actually settle
    // before asserting the draft — same reasoning as the failure-path test.
    await expect(send).toBeEnabled();
    await expect(input).toHaveValue('this send will reject');
  });

  // #526: sendDisabled must gate only the send button — the textarea and any
  // other control stay interactive. Proven here by typing into the input
  // while a send is in flight (sendDisabled is bound to the pending flag).
  test('sendDisabled bound to a pending flag blocks only the send button', async ({ page }) => {
    await page.goto('/components/chat-composer');

    const input = page.getByTestId('async-submit-input');
    const send = page.getByTestId('async-submit-send');

    await input.fill('checking the pending gate');
    await send.click();
    await expect(send).toBeDisabled();
    // The textarea keeps taking input while the send is in flight.
    await input.fill('checking the pending gate, still typing');
    await expect(input).toBeEnabled();
    await expect(send).toBeEnabled();
  });

  // #526: textDisabled / voiceDisabled each gate one control independently,
  // with the other control (and the shared `disabled` prop, left `false`
  // throughout this demo) left untouched.
  test('textDisabled and voiceDisabled each gate only their own control', async ({ page }) => {
    await page.goto('/components/chat-composer');

    const input = page.getByTestId('per-control-disable-input');
    const voice = page.getByTestId('per-control-disable-voice');
    const textToggle = page.getByTestId('per-control-disable-text-toggle');
    const voiceToggle = page.getByTestId('per-control-disable-voice-toggle');

    await expect(input).toBeEnabled();
    await expect(voice).toBeEnabled();

    // Disable the textarea only: voice stays clickable.
    await textToggle.check();
    await expect(input).toBeDisabled();
    await expect(voice).toBeEnabled();
    await voice.click();
    await expect(page.getByTestId('per-control-disable-voice-count')).toHaveText(
      'Voice activations: 1'
    );

    // Re-enable the textarea, disable voice instead: textarea stays usable.
    await textToggle.uncheck();
    await voiceToggle.check();
    await expect(input).toBeEnabled();
    await expect(voice).toBeDisabled();
    await input.fill('voice is off, typing still works');
    await expect(input).toHaveValue('voice is off, typing still works');
  });
});
