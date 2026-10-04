export const PRIMARY_SIDEBAR_WIDTH = 256;
export const PRIMARY_SIDEBAR_COLLAPSED_WIDTH = 64;

export function getPrimarySidebarWidth(collapsed: boolean) {
  return collapsed ? PRIMARY_SIDEBAR_COLLAPSED_WIDTH : PRIMARY_SIDEBAR_WIDTH;
}
