import React, { useMemo, useState } from 'react';
import { KeyRound, RefreshCw, Save, UserPlus, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { UserRole, UserRoleProfile } from '../types';
import { ROLE_LABELS } from '../utils/permissions';

const ROLE_OPTIONS: UserRole[] = ['admin', 'register', 'nurse', 'doctor', 'cashier', 'stock', 'report'];

const emptyCreateForm = {
  username: '',
  password: '',
  email: '',
  firstname: '',
  surname: '',
  role: 'register' as UserRole,
};

const getPrimaryRole = (profile: UserRoleProfile): UserRole =>
  profile.roles[0] || 'register';

export default function UserManagement() {
  const {
    user,
    userProfiles,
    createUserAccount,
    updateUserAccount,
    resetUserPassword,
    setModalConfig,
  } = useAppContext();
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editing, setEditing] = useState<Record<string, {
    email: string;
    firstname: string;
    surname: string;
    role: UserRole;
    active: boolean;
  }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedUsers = useMemo(() => [...userProfiles].sort((a, b) =>
    String(a.username || a.email || '').localeCompare(String(b.username || b.email || ''))
  ), [userProfiles]);

  const showAlert = (title: string, message: string) => {
    setModalConfig({ isOpen: true, type: 'alert', title, message });
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await createUserAccount(createForm);
      setCreateForm(emptyCreateForm);
      showAlert('สร้างผู้ใช้งานสำเร็จ', 'ผู้ใช้ใหม่สามารถเข้าสู่ระบบด้วย Username/Password ที่กำหนด และจะถูกบังคับให้เปลี่ยนรหัสผ่านครั้งแรก');
    } catch (error) {
      showAlert('ไม่สามารถสร้างผู้ใช้งานได้', error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEditForm = (profile: UserRoleProfile) => editing[profile.uid] || {
    email: profile.email || '',
    firstname: profile.firstname || '',
    surname: profile.surname || '',
    role: getPrimaryRole(profile),
    active: profile.active,
  };

  const setEditValue = (profile: UserRoleProfile, updates: Partial<ReturnType<typeof getEditForm>>) => {
    setEditing(prev => ({
      ...prev,
      [profile.uid]: {
        ...getEditForm(profile),
        ...updates,
      },
    }));
  };

  const handleSave = async (profile: UserRoleProfile) => {
    const form = getEditForm(profile);
    setIsSubmitting(true);
    try {
      await updateUserAccount(profile.uid, form);
      setEditing(prev => {
        const next = { ...prev };
        delete next[profile.uid];
        return next;
      });
      showAlert('บันทึกผู้ใช้งานสำเร็จ', 'ข้อมูลผู้ใช้งานถูกอัปเดตแล้ว');
    } catch (error) {
      showAlert('ไม่สามารถบันทึกผู้ใช้งานได้', error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = (profile: UserRoleProfile) => {
    setModalConfig({
      isOpen: true,
      type: 'prompt',
      title: `Reset password: ${profile.username || profile.email}`,
      message: 'กรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร ผู้ใช้จะต้องเปลี่ยนรหัสผ่านอีกครั้งหลังเข้าสู่ระบบ',
      defaultValue: '',
      onConfirm: async (value?: string) => {
        if (!value || value.length < 6) {
          showAlert('Password ไม่ถูกต้อง', 'Password ต้องมีอย่างน้อย 6 ตัวอักษร');
          return;
        }
        try {
          await resetUserPassword(profile.uid, value);
          showAlert('Reset password สำเร็จ', 'ผู้ใช้ต้องเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งถัดไป');
        } catch (error) {
          showAlert('ไม่สามารถ reset password ได้', error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
        }
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <Users className="text-blue-600" />
          จัดการผู้ใช้งาน
        </h1>
        <p className="text-gray-500 mt-1">สร้างบัญชี Username/Password และกำหนดสิทธิ์ของแต่ละตำแหน่งงาน</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <UserPlus size={20} className="text-blue-600" />
          เพิ่มผู้ใช้งานใหม่
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <input required className="border rounded-lg px-3 py-2" placeholder="Username" value={createForm.username} onChange={e => setCreateForm({ ...createForm, username: e.target.value })} />
          <input required className="border rounded-lg px-3 py-2" placeholder="Password" type="password" minLength={6} value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} />
          <input required className="border rounded-lg px-3 py-2" placeholder="Email" type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
          <input required className="border rounded-lg px-3 py-2" placeholder="Firstname" value={createForm.firstname} onChange={e => setCreateForm({ ...createForm, firstname: e.target.value })} />
          <input required className="border rounded-lg px-3 py-2" placeholder="Surname" value={createForm.surname} onChange={e => setCreateForm({ ...createForm, surname: e.target.value })} />
          <select className="border rounded-lg px-3 py-2" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value as UserRole })}>
            {ROLE_OPTIONS.map(role => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
          </select>
        </div>
        <div className="mt-4 flex justify-end">
          <button disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white font-bold px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
            <UserPlus size={18} />
            สร้างผู้ใช้งาน
          </button>
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Username</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Firstname</th>
                <th className="text-left px-4 py-3">Surname</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">สถานะ</th>
                <th className="text-right px-4 py-3">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedUsers.map(profile => {
                const form = getEditForm(profile);
                return (
                  <tr key={profile.uid} className="align-top">
                    <td className="px-4 py-3 font-bold text-gray-900">{profile.username || '-'}</td>
                    <td className="px-4 py-3"><input className="border rounded-lg px-2 py-1 w-56" value={form.email} onChange={e => setEditValue(profile, { email: e.target.value })} /></td>
                    <td className="px-4 py-3"><input className="border rounded-lg px-2 py-1 w-40" value={form.firstname} onChange={e => setEditValue(profile, { firstname: e.target.value })} /></td>
                    <td className="px-4 py-3"><input className="border rounded-lg px-2 py-1 w-40" value={form.surname} onChange={e => setEditValue(profile, { surname: e.target.value })} /></td>
                    <td className="px-4 py-3">
                      <select className="border rounded-lg px-2 py-1" value={form.role} onChange={e => setEditValue(profile, { role: e.target.value as UserRole })}>
                        {ROLE_OPTIONS.map(role => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 space-y-2">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={form.active} onChange={e => setEditValue(profile, { active: e.target.checked })} />
                        <span>{form.active ? 'ใช้งาน' : 'ปิดใช้งาน'}</span>
                      </label>
                      {profile.mustChangePassword && <div className="text-xs text-amber-600 font-bold">ต้องเปลี่ยนรหัสผ่าน</div>}
                      {profile.uid === user?.uid && <div className="text-xs text-blue-600">บัญชีของคุณ</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button disabled={isSubmitting} onClick={() => handleSave(profile)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50">
                          <Save size={16} />
                          บันทึก
                        </button>
                        <button disabled={isSubmitting} onClick={() => handleResetPassword(profile)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 disabled:opacity-50">
                          <KeyRound size={16} />
                          Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    <RefreshCw className="mx-auto mb-2 text-gray-300" />
                    ยังไม่มีข้อมูลผู้ใช้งาน หรือกำลังโหลดข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
