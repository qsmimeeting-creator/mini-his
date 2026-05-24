import {
  adminAuth,
  adminDb,
  getRequestBody,
  verifyAdminRequest,
  writeAuditLog,
} from '../_firebaseAdmin';

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

type ResetPasswordBody = {
  uid: string;
  password: string;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, message: 'Method not allowed' });
    return;
  }

  try {
    const actor = await verifyAdminRequest(req);
    const body = getRequestBody<ResetPasswordBody>(req.body);
    const uid = String(body.uid || '').trim();
    const password = String(body.password || '');

    if (!uid || !password) {
      res.status(400).json({ ok: false, message: 'กรุณาระบุผู้ใช้และรหัสผ่านใหม่' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ ok: false, message: 'Password ต้องมีอย่างน้อย 6 ตัวอักษร' });
      return;
    }

    await adminAuth().updateUser(uid, { password });
    await adminDb().collection('userRoles').doc(uid).set({
      mustChangePassword: true,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.uid,
    }, { merge: true });

    await writeAuditLog('user.resetPassword', uid, actor);
    res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(error?.statusCode || 500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'ไม่สามารถ reset password ได้',
    });
  }
}
