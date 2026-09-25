export const PRIMARY_SIDEBAR_WIDTH = 256;
export const PRIMARY_SIDEBAR_COLLAPSED_WIDTH = 64;
export const PROJECT_SIDEBAR_WIDTH = 244;

export function getPrimarySidebarWidth(collapsed: boolean) {
  return collapsed ? PRIMARY_SIDEBAR_COLLAPSED_WIDTH : PRIMARY_SIDEBAR_WIDTH;
}

export function getSidebarOffset({
  collapsed,
  isProjectRoute,
}: {
  collapsed: boolean;
  isProjectRoute: boolean;
}) {
  return (
    getPrimarySidebarWidth(collapsed) +
    (isProjectRoute ? PROJECT_SIDEBAR_WIDTH : 0)
  );
}
