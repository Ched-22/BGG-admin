const ROUTE_KEY = 'bgg-admin-route';
const FILTER_KEY = 'bgg-admin-pending-filter';

const VALID_PAGES = new Set([
  'dashboard',
  'tasks',
  'task-detail',
  'calendar',
  'customers',
  'vehicles',
  'technicians',
  'quotes',
  'stock',
  'services',
  'finance',
  'profile',
]);

const DEFAULT_ROUTE = { page: 'dashboard' };

export function getStoredRoute() {
  try {
    const raw = sessionStorage.getItem(ROUTE_KEY);
    if (!raw) return DEFAULT_ROUTE;
    const route = JSON.parse(raw);
    if (!route?.page || !VALID_PAGES.has(route.page)) return DEFAULT_ROUTE;
    if (route.page === 'task-detail' && !route.taskId) {
      return { page: 'tasks' };
    }
    return {
      page: route.page,
      ...(route.taskId ? { taskId: route.taskId } : {}),
      ...(route.customerId ? { customerId: route.customerId } : {}),
    };
  } catch {
    return DEFAULT_ROUTE;
  }
}

export function storeRoute(route) {
  if (!route?.page || !VALID_PAGES.has(route.page)) return;
  const payload = {
    page: route.page,
    ...(route.taskId ? { taskId: route.taskId } : {}),
    ...(route.customerId ? { customerId: route.customerId } : {}),
  };
  sessionStorage.setItem(ROUTE_KEY, JSON.stringify(payload));
}

export function getStoredPendingFilter() {
  try {
    const raw = sessionStorage.getItem(FILTER_KEY);
    return raw != null ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storePendingFilter(filter) {
  if (filter == null) {
    sessionStorage.removeItem(FILTER_KEY);
    return;
  }
  sessionStorage.setItem(FILTER_KEY, JSON.stringify(filter));
}

export function clearStoredNavigation() {
  sessionStorage.removeItem(ROUTE_KEY);
  sessionStorage.removeItem(FILTER_KEY);
}
