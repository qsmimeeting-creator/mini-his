import type { UserPermission, UserRole } from '../types';

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

export const MENU_PERMISSION_LABELS: Record<UserPermission, string> = {
  registration: 'จุดลงทะเบียน',
  screening: 'คัดกรอง / ซักประวัติ',
  doctor: 'ห้องตรวจแพทย์',
  postDoctor: 'พยาบาลหลังพบแพทย์',
  cashier: 'การเงิน',
  dispense: 'ห้องจ่ายยา / คลัง',
  injection: 'ห้องฉีดยา',
  dataManagement: 'จัดการข้อมูล',
  vaccineInventory: 'จัดการวัคซีน',
  visitHistory: 'ค้นหาและแก้ไขงาน',
  userManagement: 'จัดการผู้ใช้งาน',
};

export const MENU_PERMISSION_OPTIONS: UserPermission[] = [
  'registration',
  'screening',
  'doctor',
  'postDoctor',
  'cashier',
  'dispense',
  'injection',
  'dataManagement',
  'vaccineInventory',
  'visitHistory',
  'userManagement',
];

const VALID_ROLES: UserRole[] = ['admin', 'register', 'nurse', 'doctor', 'cashier', 'stock', 'report'];
const VALID_PERMISSIONS: UserPermission[] = MENU_PERMISSION_OPTIONS;

const ROUTE_PERMISSIONS: Record<string, UserPermission> = {
  '/registration': 'registration',
  '/screening': 'screening',
  '/doctor': 'doctor',
  '/post-doctor': 'postDoctor',
  '/cashier': 'cashier',
  '/dispense': 'dispense',
  '/injection': 'injection',
  '/data-management': 'dataManagement',
  '/vaccine-inventory': 'vaccineInventory',
  '/visit-history': 'visitHistory',
  '/user-management': 'userManagement',
};

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  admin: MENU_PERMISSION_OPTIONS,
  register: ['registration'],
  nurse: ['screening', 'postDoctor', 'injection', 'visitHistory'],
  doctor: ['doctor', 'visitHistory'],
  cashier: ['cashier'],
  stock: ['dispense', 'vaccineInventory'],
  report: ['dataManagement'],
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
  return Array.from(new Set(roles.map(role => String(role || '').trim().toLowerCase() as UserRole)))
    .filter((role): role is UserRole => VALID_ROLES.includes(role));
};

export const normalizePermissions = (permissions: unknown): UserPermission[] => {
  if (!Array.isArray(permissions)) return [];
  return Array.from(new Set(permissions.map(permission => String(permission || '').trim() as UserPermission)))
    .filter((permission): permission is UserPermission => VALID_PERMISSIONS.includes(permission));
};

export const getDefaultPermissionsForRoles = (roles: UserRole[]) =>
  normalizePermissions(roles.flatMap(role => ROLE_DEFAULT_PERMISSIONS[role] || []));

export const resolvePermissionsForRoles = (roles: UserRole[], permissions: unknown) => {
  const normalizedPermissions = normalizePermissions(permissions);
  return normalizedPermissions.length > 0 ? normalizedPermissions : getDefaultPermissionsForRoles(roles);
};

export const hasAnyRole = (userRoles: UserRole[], allowedRoles: UserRole[]) =>
  userRoles.includes('admin') || allowedRoles.some(role => userRoles.includes(role));

export const hasPermission = (userRoles: UserRole[], userPermissions: UserPermission[], permission: UserPermission) =>
  userRoles.includes('admin') || userPermissions.includes(permission);

export const canAccessRouteWithAccess = (userRoles: UserRole[], userPermissions: UserPermission[], path: string) => {
  if (path === '/' || path === '') return true;
  const permission = ROUTE_PERMISSIONS[path];
  if (!permission) return false;
  return hasPermission(userRoles, userPermissions, permission);
};

export const canAccessRouteWithRoles = (userRoles: UserRole[], path: string) =>
  canAccessRouteWithAccess(userRoles, getDefaultPermissionsForRoles(userRoles), path);

export const canPerformActionWithRoles = (userRoles: UserRole[], action: AppAction) =>
  hasAnyRole(userRoles, ACTION_ROLES[action] || []);

export const getDefaultRouteForAccess = (userRoles: UserRole[], userPermissions: UserPermission[]) => {
  const route = Object.entries(ROUTE_PERMISSIONS).find(([, permission]) =>
    hasPermission(userRoles, userPermissions, permission)
  );
  return route?.[0] || '/';
};

export const getDefaultRouteForRoles = (userRoles: UserRole[]) =>
  getDefaultRouteForAccess(userRoles, getDefaultPermissionsForRoles(userRoles));

export const getRoutePermission = (path: string) => ROUTE_PERMISSIONS[path];
