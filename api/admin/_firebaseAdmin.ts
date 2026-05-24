import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { UserRole, UserRoleProfile } from '../../src/types';

type ApiRequest = {
  headers?: Record<string, string | string[] | undefined>;
};

const VALID_ROLES: UserRole[] = ['admin', 'register', 'nurse', 'doctor', 'cashier', 'stock', 'report'];
const DEFAULT_FIREBASE_PROJECT_ID = 'gen-lang-client-0797723893';
const DEFAULT_FIRESTORE_DATABASE_ID = 'ai-studio-77f96820-f2f6-47dc-be85-ff5a5b58b155';
const normalizeRoles = (roles: unknown): UserRole[] => {
  if (!Array.isArray(roles)) return [];
  return roles.filter((role): role is UserRole =>
    VALID_ROLES.includes(String(role) as UserRole)
  );
};

const getHeader = (req: ApiRequest, name: string) => {
  const found = Object.entries(req.headers || {}).find(([key]) => key.toLowerCase() === name.toLowerCase());
  const value = found?.[1];
  return Array.isArray(value) ? value[0] : value;
};

const getPrivateKey = () => {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  return key ? key.replace(/\\n/g, '\n') : undefined;
};

const getServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin service account env vars');
  }

  return { projectId, clientEmail, privateKey };
};

const getAdminApp = (): App => {
  if (getApps().length > 0) return getApps()[0]!;
  return initializeApp({
    credential: cert(getServiceAccount()),
    projectId: process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID,
  });
};

export const adminAuth = () => getAuth(getAdminApp());

export const adminDb = () => {
  const databaseId = process.env.FIREBASE_FIRESTORE_DATABASE_ID || DEFAULT_FIRESTORE_DATABASE_ID;
  return (getFirestore as any)(getAdminApp(), databaseId);
};

export const normalizeUsername = (username: unknown) =>
  String(username || '').trim().toLowerCase();

export const normalizeRole = (role: unknown): UserRole | null => {
  const value = String(role || '').trim().toLowerCase() as UserRole;
  return VALID_ROLES.includes(value) ? value : null;
};

export const getRequestBody = <T extends Record<string, unknown>>(body: unknown): Partial<T> => {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Partial<T>;
    } catch {
      return {};
    }
  }
  return body && typeof body === 'object' ? body as Partial<T> : {};
};

export const verifyAdminRequest = async (req: ApiRequest) => {
  const authorization = getHeader(req, 'authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) throw Object.assign(new Error('Missing ID token'), { statusCode: 401 });

  const decoded = await adminAuth().verifyIdToken(token);
  const roleSnap = await adminDb().collection('userRoles').doc(decoded.uid).get();
  if (!roleSnap.exists) throw Object.assign(new Error('User role not found'), { statusCode: 403 });

  const roleData = roleSnap.data() as UserRoleProfile;
  const roles = normalizeRoles(roleData.roles);
  if (roleData.active !== true || !roles.includes('admin')) {
    throw Object.assign(new Error('Admin role required'), { statusCode: 403 });
  }

  return {
    uid: decoded.uid,
    email: decoded.email,
    displayName: roleData.displayName || `${roleData.firstname || ''} ${roleData.surname || ''}`.trim() || decoded.email,
    role: { ...roleData, roles },
  };
};

export const writeAuditLog = async (
  action: string,
  targetId: string,
  actor: { uid?: string; email?: string; displayName?: string } | null,
  details: Record<string, unknown> = {}
) => {
  await adminDb().collection('auditLogs').add({
    action,
    targetType: 'user',
    targetId,
    actorId: actor?.uid || 'system',
    actorName: actor?.displayName || actor?.email || 'System',
    actorEmail: actor?.email || null,
    createdAt: new Date().toISOString(),
    details,
  });
};

export const countActiveAdmins = async (excludeUid?: string) => {
  const snap = await adminDb()
    .collection('userRoles')
    .where('roles', 'array-contains', 'admin')
    .where('active', '==', true)
    .get();

  return snap.docs.filter((doc: any) => doc.id !== excludeUid).length;
};

export const hasAnyAdmin = async () => {
  const snap = await adminDb().collection('userRoles').where('roles', 'array-contains', 'admin').limit(1).get();
  return !snap.empty;
};

export const buildDisplayName = (firstname?: unknown, surname?: unknown) =>
  [String(firstname || '').trim(), String(surname || '').trim()].filter(Boolean).join(' ');
