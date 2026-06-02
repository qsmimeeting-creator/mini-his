import {
  adminAuth,
  adminDb,
  buildDisplayName,
  countActiveAdmins,
  getRequestBody,
  normalizeRoles,
  verifyAdminRequest,
  writeAuditLog,
} from '../_firebaseAdmin.js';

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  status: (statusCode: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
};

type UpdateUserBody = {
  uid: string;
  email: string;
  firstname: string;
  surname: string;
  role?: string;
  roles: string[];
  active: boolean;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    res.status(405).json({ ok: false, message: 'Method not allowed' });
    return;
  }

  try {
    const actor = await verifyAdminRequest(req);
    const body = getRequestBody<UpdateUserBody>(req.body);
    const uid = String(body.uid || '').trim();
    const email = String(body.email || '').trim();
    const firstname = String(body.firstname || '').trim();
    const surname = String(body.surname || '').trim();
    const requestedRoles = normalizeRoles(body.roles);
    const roles = requestedRoles.length > 0 ? requestedRoles : normalizeRoles([body.role]);
    const active = body.active === true;

    if (!uid || !email || !firstname || !surname || roles.length === 0) {
      res.status(400).json({ ok: false, message: 'กรุณากรอกข้อมูลผู้ใช้งานให้ครบถ้วน' });
      return;
    }

    const currentSnap = await adminDb().collection('userRoles').doc(uid).get();
    if (!currentSnap.exists) {
      res.status(404).json({ ok: false, message: 'ไม่พบผู้ใช้งานนี้' });
      return;
    }
    const current = currentSnap.data() || {};
    const isCurrentAdmin = Array.isArray(current.roles) && current.roles.includes('admin') && current.active === true;
    const willRemainAdmin = roles.includes('admin') && active;
    if (isCurrentAdmin && !willRemainAdmin && await countActiveAdmins(uid) === 0) {
      res.status(400).json({ ok: false, message: 'ไม่สามารถปิดหรือเปลี่ยนสิทธิ์ Admin คนสุดท้ายได้' });
      return;
    }
    if (uid === actor.uid && isCurrentAdmin && !willRemainAdmin && await countActiveAdmins(uid) === 0) {
      res.status(400).json({ ok: false, message: 'ไม่สามารถปิดสิทธิ์ Admin ของตัวเองเมื่อเป็น Admin คนสุดท้ายได้' });
      return;
    }

    const displayName = buildDisplayName(firstname, surname);
    const now = new Date().toISOString();

    await adminAuth().updateUser(uid, {
      email,
      displayName,
      disabled: !active,
    });

    await adminDb().collection('userRoles').doc(uid).set({
      ...current,
      uid,
      email,
      firstname,
      surname,
      displayName,
      roles,
      active,
      updatedAt: now,
      updatedBy: actor.uid,
    }, { merge: true });

    if (current.username) {
      await adminDb().collection('usernames').doc(String(current.username).trim().toLowerCase()).set({
        uid,
        email,
        username: current.username,
        updatedAt: now,
      }, { merge: true });
    }

    await writeAuditLog('user.update', uid, actor, { roles, active });
    res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(error?.statusCode || 500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'ไม่สามารถแก้ไขผู้ใช้งานได้',
    });
  }
}
