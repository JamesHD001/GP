import { ROUTES } from '../config/routeConfig';

export function findRouteByPath(path) {
  let match = ROUTES.find((r) => r.path === path);
  if (match) return match;
  match = ROUTES.find((r) => path.startsWith(r.path));
  return match || null;
}

/**
 * Check whether a role has a specific permission on a route.
 * - role: 'admin' | 'instructor' | 'leader'
 * - permission: string, e.g. 'view', 'edit', 'print'
 * - routeOrPath: route object or path string
 */
export function hasPermission(role, permission, routeOrPath) {
  const route = typeof routeOrPath === 'string' ? findRouteByPath(routeOrPath) : routeOrPath;
  if (!route) return false;
  // Role must be allowed for route
  if (!route.allowedRoles || !route.allowedRoles.includes(role)) return false;
  // Permission must be declared on route
  if (!route.permissions || !route.permissions.includes(permission)) return false;
  return true;
}

export default { findRouteByPath, hasPermission };
