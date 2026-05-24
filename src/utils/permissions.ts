import type { UserRole } from '../types';

export type AppAction =
  | 'registerPatient'
  | 'updatePatient'
  | 'deletePatient'
  | 'openVisit'
  | 'updateVisit'
  | 'voidVisit'
  | 'rewindVisit'
  | 'editCompletedDose'
  | 'updateStock'
  | 'manageVaccine'
  | 'resetSystem'
  | 'updateOpdCoverLayout'
  | 'exportAuditLog'
  | 'manageUsers'
  | 'changeOwnPassword';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  register: 'Register',
  nurse: 'Nurse',
  doctor: 'Doctor',
  cashier: 'Cashier',
  stock: 'Stock',
  report: 'Report',
};

const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/registration': ['admin', 'register'],
  '/screening': ['admin', 'nurse'],
  '/doctor': ['admin', 'doctor'],
  '/post-doctor': ['admin', 'nurse'],
  '/cashier': ['admin', 'cashier'],
  '/dispense': ['admin', 'stock'],
  '/injection': ['admin', 'nurse'],
  '/data-management': ['admin', 'report'],
  '/vaccine-inventory': ['admin', 'stock'],
  '/visit-history': ['admin', 'nurse', 'doctor'],
  '/user-management': ['admin'],
};

const ACTION_ROLES: Record<AppAction, UserRole[]> = {
  registerPatient: ['admin', 'register'],
  updatePatient: ['admin', 'register', 'nurse'],
  deletePatient: ['admin'],
  openVisit: ['admin', 'register'],
  updateVisit: ['admin', 'nurse', 'doctor', 'cashier', 'stock'],
  voidVisit: ['admin', 'nurse'],
  rewindVisit: ['admin', 'nurse'],
  editCompletedDose: ['admin', 'doctor'],
  updateStock: ['admin', 'stock'],
  manageVaccine: ['admin', 'stock'],
  resetSystem: ['admin'],
  updateOpdCoverLayout: ['admin'],
  exportAuditLog: ['admin', 'report'],
  manageUsers: ['admin'],
  changeOwnPassword: ['admin', 'register', 'nurse', 'doctor', 'cashier', 'stock', 'report'],
};

export const normalizeRoles = (roles: unknown): UserRole[] => {
  if (!Array.isArray(roles)) return [];
  return roles.filter((role): role is UserRole =>
    ['admin', 'register', 'nurse', 'doctor', 'cashier', 'stock', 'report'].includes(String(role))
  );
};

export const hasAnyRole = (userRoles: UserRole[], allowedRoles: UserRole[]) =>
  userRoles.includes('admin') || allowedRoles.some(role => userRoles.includes(role));

export const canAccessRouteWithRoles = (userRoles: UserRole[], path: string) => {
  if (path === '/' || path === '') return true;
  const allowedRoles = ROUTE_ROLES[path];
  if (!allowedRoles) return false;
  return hasAnyRole(userRoles, allowedRoles);
};

export const canPerformActionWithRoles = (userRoles: UserRole[], action: AppAction) =>
  hasAnyRole(userRoles, ACTION_ROLES[action] || []);

export const getDefaultRouteForRoles = (userRoles: UserRole[]) => {
  const route = Object.entries(ROUTE_ROLES).find(([, allowedRoles]) =>
    hasAnyRole(userRoles, allowedRoles)
  );
  return route?.[0] || '/';
};

export const getRouteRoles = (path: string) => ROUTE_ROLES[path] || [];
