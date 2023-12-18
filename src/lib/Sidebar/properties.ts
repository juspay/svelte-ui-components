export type SidebarProperties = {
  items: SidebarProperty[] | null;
};

type SidebarProperty = {
  icon: string | null;
  label: string | null;
};

export const defaultSidebarProperties: SidebarProperties = {
  items: []
};
