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
      { name: 'Book', slug: 'book' }
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
      { name: 'GridItem', slug: 'grid-item' },
      { name: 'CheckListItem', slug: 'check-list-item' },
      { name: 'Badge', slug: 'badge' },
      { name: 'Status', slug: 'status' },
      { name: 'IconStack', slug: 'icon-stack' },
      { name: 'Snippet', slug: 'snippet' },
      { name: 'RelativeTime', slug: 'relative-time' },
      { name: 'EmptyState', slug: 'empty-state' }
    ]
  },
  {
    category: 'Data Visualization',
    items: [
      { name: 'LineChart', slug: 'line-chart' },
      { name: 'AreaChart', slug: 'area-chart' },
      { name: 'BarChart', slug: 'bar-chart' },
      { name: 'PieChart', slug: 'pie-chart' },
      { name: 'SankeyChart', slug: 'sankey-chart' }
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
      { name: 'Shimmer', slug: 'shimmer' }
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
    category: 'Theming',
    items: [{ name: 'ThemeSwitcher', slug: 'theme-switcher' }]
  }
];

export const firstSlug = componentNav[0].items[0].slug;
