/**
 * Props used to render each shared component from BOTH libraries.
 *
 * One fixture drives both sides, which is the whole point: any visual
 * difference is then attributable to the component, never to the inputs. A
 * component absent here renders bare, which is a legitimate comparison for the
 * ones whose defaults are the interesting case.
 *
 * Kept deliberately minimal. A fixture that exercises every prop would compare
 * two elaborate compositions and make a one-pixel border change impossible to
 * see; these render each component in its most ordinary state.
 */
export type Fixture = Readonly<Record<string, unknown>>;

/**
 * Barrel exports that are not components. Both libraries export a controller
 * class and some utilities alongside the components, and a class throws
 * "cannot be invoked without 'new'" when rendered. Excluding them by name keeps
 * that out of the failure column, where it would read as a parity defect.
 */
export const NON_COMPONENTS: ReadonlySet<string> = new Set([
  'ChatController',
  'validateInput',
  'lockBodyScroll',
  'unlockBodyScroll'
]);

export const FIXTURES: Readonly<Record<string, Fixture>> = {
  Accordion: { expand: true },
  // Empty collections rather than populated ones: these components read
  // `.length` on a required array at mount, so the fixture only has to satisfy
  // the contract. Populating them would compare two bespoke compositions.
  Book: { pages: [] },
  Carousel: { views: [] },
  Chat: { messages: [] },
  ChatMessageList: { messages: [] },
  // Requires a nested `inputProperties` object, not a flat prop set — it reads
  // `inputProperties.label` at render.
  InputButton: { inputProperties: { value: '', label: 'Coupon code' } },
  Avatar: { text: 'SS' },
  Badge: { label: '3' },
  Banner: { text: 'Your session expires in five minutes.', visible: true },
  Button: { text: 'Continue' },
  Calendar: {},
  Checkbox: { checked: true, text: 'Remember this device' },
  CheckListItem: { label: 'Verify email', checked: true },
  Choicebox: { options: [{ label: 'Card', value: 'card' }] },
  ChatBubble: { open: true, label: 'Assistant' },
  ChatComposer: { placeholder: 'Ask anything' },
  ChatHeader: { title: 'Support' },
  ChatMessage: { content: 'How can I help?' },
  ChatSuggestions: { suggestions: ['Track my order', 'Return an item'] },
  ChatToolStatus: { label: 'Searching orders', status: 'running' },
  ColorPicker: { value: '#1d5c72' },
  Combobox: { items: [{ label: 'Bangalore', value: 'blr' }], value: '' },
  CommandMenu: { open: false, items: [] },
  ContextMenu: { items: [{ label: 'Copy', value: 'copy' }] },
  Gauge: { value: 62 },
  GridItem: { label: 'Payments' },
  Icon: { name: 'search' },
  IconStack: { icons: [] },
  Img: { src: '', alt: 'sample' },
  Input: { value: '', placeholder: 'Email address', label: 'Email' },
  KeyboardInput: { keys: ['Cmd', 'K'] },
  ListItem: { label: 'Order #10482' },
  Loader: {},
  LoadingDots: {},
  Menu: { items: [{ label: 'Settings', value: 'settings' }], open: false },
  Modal: { open: false },
  Pagination: { total: 10, current: 3 },
  Phone: { value: '' },
  Pill: { label: 'Refunded' },
  Progress: { value: 40 },
  Radio: { checked: true, label: 'Standard delivery' },
  RelativeTime: { date: '2026-09-01T09:30:00.000Z' },
  Scroller: {},
  Select: { options: [{ label: 'India', value: 'in' }], value: '' },
  Sheet: { open: false },
  Shimmer: {},
  Slider: { value: 40, min: 0, max: 100 },
  Snippet: { code: 'pnpm add @juspay/svelte-ui-components' },
  SplitButton: { text: 'Save' },
  SplitInput: { length: 4 },
  Stepper: { steps: [{ label: 'Cart' }, { label: 'Pay' }], current: 1 },
  Table: { columns: [], rows: [] },
  Tabs: { tabs: [{ label: 'Overview', value: 'o' }], value: 'o' },
  ThemeSwitcher: {},
  Toast: { message: 'Saved', visible: true },
  Toggle: { checked: true, text: 'Dark mode' },
  Toolbar: { showBackButton: false },
  Tooltip: { content: 'More detail' }
};
