export type NavItem = {
  name: string;
  slug: string;
};

export type NavGroup = {
  category: string;
  items: NavItem[];
};

export const componentNav: NavGroup[] = [
  {
    category: 'Layout & Containers',
    items: [
      { name: 'Card', slug: 'card' },
      { name: 'Browser', slug: 'browser' },
      { name: 'Phone', slug: 'phone' },
      { name: 'IframeViewer', slug: 'iframe-viewer' },
      { name: 'Book', slug: 'book' },
      { name: 'Resizable', slug: 'resizable' }
    ]
  },
  {
    category: 'Navigation',
    items: [
      { name: 'Breadcrumb', slug: 'breadcrumb' },
      { name: 'Tabs', slug: 'tabs' },
      { name: 'Stepper', slug: 'stepper' },
      { name: 'Pagination', slug: 'pagination' },
      { name: 'Scroller', slug: 'scroller' },
      { name: 'Toolbar', slug: 'toolbar' }
    ]
  },
  {
    category: 'Form Controls',
    items: [
      { name: 'Input', slug: 'input' },
      { name: 'InputButton', slug: 'input-button' },
      { name: 'Checkbox', slug: 'checkbox' },
      { name: 'Radio', slug: 'radio' },
      { name: 'Toggle', slug: 'toggle' },
      { name: 'Select', slug: 'select' },
      { name: 'Combobox', slug: 'combobox' },
      { name: 'Slider', slug: 'slider' },
      { name: 'Calendar', slug: 'calendar' },
      { name: 'DateRangePicker', slug: 'date-range-picker' },
      { name: 'Choicebox', slug: 'choicebox' },
      { name: 'Color Picker', slug: 'color-picker' },
      { name: 'SplitInput', slug: 'split-input' },
      { name: 'ChipInput', slug: 'chip-input' },
      { name: 'FileDropzoneTrigger', slug: 'file-dropzone-trigger' },
      { name: 'FileInput', slug: 'file-input' }
    ]
  },
  {
    category: 'Buttons & Actions',
    items: [
      { name: 'Button', slug: 'button' },
      { name: 'SplitButton', slug: 'split-button' },
      { name: 'Pill', slug: 'pill' },
      { name: 'KeyboardInput', slug: 'keyboard-input' }
    ]
  },
  {
    category: 'Data Display',
    items: [
      { name: 'Table', slug: 'table' },
      { name: 'Accordion', slug: 'accordion' },
      { name: 'ListItem', slug: 'list-item' },
      { name: 'KeyValue', slug: 'key-value' },
      { name: 'GridItem', slug: 'grid-item' },
      { name: 'CheckListItem', slug: 'check-list-item' },
      { name: 'Badge', slug: 'badge' },
      { name: 'Status', slug: 'status' },
      { name: 'IconStack', slug: 'icon-stack' },
      { name: 'Snippet', slug: 'snippet' },
      { name: 'RelativeTime', slug: 'relative-time' },
      { name: 'EmptyState', slug: 'empty-state' },
      { name: 'DeltaIndicator', slug: 'delta-indicator' }
    ]
  },
  {
    category: 'Data Visualization',
    items: [
      { name: 'StatCard', slug: 'stat-card' },
      { name: 'ProportionBar', slug: 'proportion-bar' },
      { name: 'LineChart', slug: 'line-chart' },
      { name: 'AreaChart', slug: 'area-chart' },
      { name: 'BarChart', slug: 'bar-chart' },
      { name: 'PieChart', slug: 'pie-chart' },
      { name: 'SankeyChart', slug: 'sankey-chart' },
      { name: 'DualAxisBarChart', slug: 'dual-axis-bar-chart' },
      { name: 'FunnelChart', slug: 'funnel-chart' }
    ]
  },
  {
    category: 'Feedback & Status',
    items: [
      { name: 'Toast', slug: 'toast' },
      { name: 'Banner', slug: 'banner' },
      { name: 'Progress', slug: 'progress' },
      { name: 'Gauge', slug: 'gauge' },
      { name: 'Loader', slug: 'loader' },
      { name: 'BrandLoader', slug: 'brand-loader' },
      { name: 'LoadingDots', slug: 'loading-dots' },
      { name: 'Shimmer', slug: 'shimmer' },
      { name: 'SoundKit', slug: 'sound-kit' }
    ]
  },
  {
    category: 'Overlays',
    items: [
      { name: 'Modal', slug: 'modal' },
      { name: 'Sheet', slug: 'sheet' },
      { name: 'Menu', slug: 'menu' },
      { name: 'ContextMenu', slug: 'context-menu' },
      { name: 'CommandMenu', slug: 'command-menu' },
      { name: 'Tooltip', slug: 'tooltip' }
    ]
  },
  {
    category: 'Media',
    items: [
      { name: 'Avatar', slug: 'avatar' },
      { name: 'Icon', slug: 'icon' },
      { name: 'Img', slug: 'img' }
    ]
  },
  {
    category: 'Chat',
    items: [
      { name: 'Chat', slug: 'chat' },
      { name: 'ChatMessage', slug: 'chat-message' },
      { name: 'ChatMessageList', slug: 'chat-message-list' },
      { name: 'ChatComposer', slug: 'chat-composer' },
      { name: 'SpeechToText', slug: 'speech-to-text' },
      { name: 'ChatHeader', slug: 'chat-header' },
      { name: 'ChatToolStatus', slug: 'chat-tool-status' },
      { name: 'ToolCallLog', slug: 'tool-call-log' },
      { name: 'ChatSuggestions', slug: 'chat-suggestions' },
      { name: 'ChatBubble', slug: 'chat-bubble' },
      { name: 'HITL', slug: 'hitl' },
      { name: 'ThinkingIndicator', slug: 'thinking-indicator' },
      { name: 'TaskList', slug: 'task-list' },
      { name: 'TypewriterText', slug: 'typewriter-text' },
      { name: 'Chat compositions', slug: 'chat-compositions' }
    ]
  },
  {
    category: 'Theming',
    items: [{ name: 'ThemeSwitcher', slug: 'theme-switcher' }]
  }
];

export const firstSlug = componentNav[0].items[0].slug;
