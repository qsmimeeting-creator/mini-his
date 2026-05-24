import {
  adminAuth,
  adminDb,
  buildDisplayName,
  hasAnyAdmin,
  normalizeUsername,
  writeAuditLog,
} from './_firebaseAdmin';

type ApiRequest = {
  method?: string;
};

type ApiResponse = {
  status: (statusCode: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, message: 'Method not allowed' });
    return;
  }

  try {
    if (await hasAnyAdmin()) {
      res.status(409).json({ ok: false, message: 'มี Admin อยู่แล้ว ไม่สามารถสร้าง Admin เริ่มต้นซ้ำได้' });
      return;
    }

    const username = 'Admin';
    const normalizedUsername = normalizeUsername(username);
    const email = 'admin@clinic.local';
    const firstname = 'Admin';
    const surname = 'Clinic';
    const password = 'Clinic';
    const displayName = buildDisplayName(firstname, surname);
    const now = new Date().toISOString();

    let authUser;
    try {
      authUser = await adminAuth().createUser({
        email,
        password,
        displayName,
        disabled: false,
      });
    } catch (error: any) {
      if (error?.code !== 'auth/email-already-exists') throw error;
      authUser = await adminAuth().getUserByEmail(email);
      await adminAuth().updateUser(authUser.uid, { password, displayName, disabled: false });
    }

    await adminDb().collection('userRoles').doc(authUser.uid).set({
      uid: authUser.uid,
      username,
      email,
      firstname,
      surname,
      displayName,
      roles: ['admin'],
      active: true,
      mustChangePassword: true,
      createdAt: now,
      updatedAt: now,
      updatedBy: 'bootstrap',
    });

    await adminDb().collection('usernames').doc(normalizedUsername).set({
      uid: authUser.uid,
      email,
      username,
      createdAt: now,
      updatedAt: now,
    });

    await writeAuditLog('user.bootstrapAdmin', authUser.uid, null, { username });
    res.status(200).json({ ok: true, username, email });
  } catch (error) {
    console.error('Bootstrap admin error:', error);
    res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'ไม่สามารถสร้าง Admin เริ่มต้นได้',
    });
  }
}
