/**
 * Callback props whose PRESENCE the component reads, not just their invocation.
 *
 * The dispatch rule passes a dispatcher function for every declared, non-colliding
 * callback prop so that a listener-only consumer is served (see src/wc/dispatch.ts).
 * For most props that is invisible to the component: it calls the callback when
 * something happens and does not care whether one was supplied.
 *
 * These do care. Each one appears in its component as
 * `typeof <prop> === 'function'` and decides real behaviour from the answer -- whether a
 * control renders at all, whether an element becomes a button, whether the built-in
 * action runs or the consumer's replaces it. An unconditional dispatcher is a function,
 * so it made every one of those checks true inside the custom element: `<sui-gallery>`
 * rendered edit and delete for a consumer who wired neither, `<sui-chat-composer>` showed
 * voice and attach, `<sui-attachment-chip-row>` turned every chip into a labelled
 * `<button>`, `<sui-list-item>` became a tab stop with no behaviour, and
 * `<sui-pie-chart>`'s legend stopped expanding because PieChart read a supplied
 * `onlegendmore` as "the consumer owns this control".
 *
 * So for these, and only these, the dispatcher is included ONLY when the consumer has
 * actually assigned the callback -- read reactively, so assigning it after mount still
 * works. The consequence is deliberate and worth stating plainly: on these 31 props a
 * consumer who ONLY calls addEventListener gets no event, because there is no way to
 * serve them without also telling the component a callback exists. Presence is the
 * component's contract; the event is a convenience layered over it, and where the two
 * conflict the contract wins.
 *
 * `scripts/wc-parity/prop-parity.ts` re-derives this list from source and fails if it
 * drifts -- a new presence check, or a stale entry, is an error rather than a silent
 * behaviour change.
 */
export const PRESENCE_GATED_CALLBACKS: ReadonlySet<string> = new Set([
  // AttachmentChipRow
  'sui-attachment-chip-row:onopenfile',
  'sui-attachment-chip-row:onopenimage',
  'sui-attachment-chip-row:onopenvideo',
  'sui-attachment-chip-row:onremovefile',
  'sui-attachment-chip-row:onremoveimage',
  'sui-attachment-chip-row:onremovevideo',
  // Chat
  'sui-chat:onsuggestion',
  // ChatComposer
  'sui-chat-composer:onaction',
  'sui-chat-composer:onattach',
  'sui-chat-composer:onattachclick',
  'sui-chat-composer:onvoice',
  // ChatMessage
  'sui-chat-message:onfeedback',
  'sui-chat-message:onretry',
  // ChatMessageList
  'sui-chat-message-list:onfeedback',
  'sui-chat-message-list:onretry',
  // Gallery
  'sui-gallery:ondeleteclick',
  'sui-gallery:oneditclick',
  'sui-gallery:onimageclick',
  // ListItem
  'sui-list-item:oncentertextclick',
  'sui-list-item:onleftimageclick',
  'sui-list-item:onrightimageclick',
  'sui-list-item:ontopsectionclick',
  // Modal
  'sui-modal:ondismiss',
  'sui-modal:onheaderleftimageclick',
  'sui-modal:onoverlayclick',
  // PieChart
  'sui-pie-chart:onlegendmore',
  // Scroller
  'sui-scroller:onscrollposition',
  // Sheet
  'sui-sheet:onafterclose',
  'sui-sheet:onafteropen',
  // Table
  'sui-table:onrowclick',
  'sui-table:onsearchchange'
]);
