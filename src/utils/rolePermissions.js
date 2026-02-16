// Centralized role -> permission mappings for dashboard widgets and UI features
export const ROLE_PERMISSIONS = {
  admin: ['view', 'create', 'edit', 'delete', 'print', 'mark', 'manage'],
  instructor: ['view', 'mark', 'print'],
  leader: ['view', 'print'],
};

export function roleHasPermission(role, permission) {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

export default { ROLE_PERMISSIONS, roleHasPermission };
