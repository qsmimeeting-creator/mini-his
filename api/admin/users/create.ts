import {
  adminAuth,
  adminDb,
  buildDisplayName,
  getRequestBody,
  normalizeRoles,
  normalizeUsername,
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

type CreateUserBody = {
  username: string;
  password: string;
  email: string;
  firstname: string;
  surname: string;
  role?: string;
  roles: string[];
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, message: 'Method not allowed' });
    return;
  }

  try {
    const actor = await verifyAdminRequest(req);
    const body = getRequestBody<CreateUserBody>(req.body);
    const username = String(body.username || '').trim();
    const normalizedUsername = normalizeUsername(username);
    const password = String(body.password || '');
    const email = String(body.email || '').trim();
    const firstname = String(body.firstname || '').trim();
    const surname = String(body.surname || '').trim();
    const requestedRoles = normalizeRoles(body.roles);
    const roles = requestedRoles.length > 0 ? requestedRoles : normalizeRoles([body.role]);

    if (!username || !normalizedUsername || !password || !email || !firstname || !surname || roles.length === 0) {
      res.status(400).json({ ok: false, message: 'กรุณากรอกข้อมูลผู้ใช้งานให้ครบถ้วน' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ ok: false, message: 'Password ต้องมีอย่างน้อย 6 ตัวอักษร' });
      return;
    }

    const usernameRef = adminDb().collection('usernames').doc(normalizedUsername);
    if ((await usernameRef.get()).exists) {
      res.status(409).json({ ok: false, message: 'Username นี้ถูกใช้งานแล้ว' });
      return;
    }

    const displayName = buildDisplayName(firstname, surname);
    const now = new Date().toISOString();
    let createdUid = '';

    try {
      const authUser = await adminAuth().createUser({
        email,
        password,
        displayName,
        disabled: false,
      });
      createdUid = authUser.uid;

      await adminDb().collection('userRoles').doc(authUser.uid).set({
        uid: authUser.uid,
        username,
        email,
        firstname,
        surname,
        displayName,
        roles,
        active: true,
        mustChangePassword: true,
        createdAt: now,
        updatedAt: now,
        updatedBy: actor.uid,
      });

      await usernameRef.set({
        uid: authUser.uid,
        email,
        username,
        createdAt: now,
        updatedAt: now,
      });

      await writeAuditLog('user.create', authUser.uid, actor, { username, roles });
      res.status(200).json({ ok: true, uid: authUser.uid });
    } catch (error) {
      if (createdUid) {
        await adminAuth().deleteUser(createdUid).catch(() => undefined);
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(error?.statusCode || 500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'ไม่สามารถสร้างผู้ใช้งานได้',
    });
  }
}
