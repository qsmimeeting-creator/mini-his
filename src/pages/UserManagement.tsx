import React, { useMemo, useState } from 'react';
import { Edit3, KeyRound, RefreshCw, Save, UserPlus, Users, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { UserPermission, UserRole, UserRoleProfile } from '../types';
import {
  getDefaultPermissionsForRoles,
  MENU_PERMISSION_LABELS,
  MENU_PERMISSION_OPTIONS,
  normalizePermissions,
  ROLE_LABELS,
} from '../utils/permissions';

const ROLE_OPTIONS: UserRole[] = ['admin', 'register', 'nurse', 'doctor', 'cashier', 'stock', 'report'];

type UserAccessForm = {
  uid?: string;
  username: string;
  password: string;
  email: string;
  firstname: string;
  surname: string;
  roles: UserRole[];
  permissions: UserPermission[];
  active: boolean;
};

const createEmptyForm = (): UserAccessForm => {
  const roles: UserRole[] = ['register'];
  return {
    username: '',
    password: '',
    email: '',
    firstname: '',
    surname: '',
    roles,
    permissions: getDefaultPermissionsForRoles(roles),
    active: true,
  };
};

const normalizeSelectedRoles = (roles: UserRole[]) =>
  ROLE_OPTIONS.filter(role => roles.includes(role));

const getProfileRoles = (profile: UserRoleProfile): UserRole[] =>
  normalizeSelectedRoles(profile.roles || []);

const getProfilePermissions = (profile: UserRoleProfile): UserPermission[] => {
  const permissions = normalizePermissions(profile.permissions);
  return permissions.length > 0 ? permissions : getDefaultPermissionsForRoles(getProfileRoles(profile));
};

const createFormFromProfile = (profile: UserRoleProfile): UserAccessForm => ({
  uid: profile.uid,
  username: profile.username || '',
  password: '',
  email: profile.email || '',
  firstname: profile.firstname || '',
  surname: profile.surname || '',
  roles: getProfileRoles(profile),
  permissions: getProfilePermissions(profile),
  active: profile.active,
});

const mergeSuggestedPermissions = (currentPermissions: UserPermission[], roles: UserRole[]) =>
  normalizePermissions([...currentPermissions, ...getDefaultPermissionsForRoles(roles)]);

type BadgeListProps<T extends string> = {
  values: T[];
  labels: Record<T, string>;
  color?: 'blue' | 'emerald';
  limit?: number;
};

function BadgeList<T extends string>({ values, labels, color = 'blue', limit = 4 }: BadgeListProps<T>) {
  if (values.length === 0) {
    return <span className="text-xs font-bold text-red-600">ยังไม่กำหนด</span>;
  }

  const visibleValues = values.slice(0, limit);
  const hiddenCount = Math.max(values.length - visibleValues.length, 0);
  const classes = color === 'emerald'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : 'bg-blue-50 text-blue-700 border-blue-100';

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleValues.map(value => (
        <span key={value} className={`rounded-full px-2 py-0.5 text-xs font-bold border ${classes}`}>
          {labels[value]}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-bold text-gray-500">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

type CheckboxGridProps<T extends string> = {
  values: T[];
  options: T[];
  labels: Record<T, string>;
  onChange: (values: T[]) => void;
};

function CheckboxGrid<T extends string>({ values, options, labels, onChange }: CheckboxGridProps<T>) {
  const toggleValue = (value: T) => {
    const nextValues = values.includes(value)
      ? values.filter(selectedValue => selectedValue !== value)
      : [...values, value];
    onChange(options.filter(option => nextValues.includes(option)));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {options.map(option => (
        <label key={option} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <input
            type="checkbox"
            checked={values.includes(option)}
            onChange={() => toggleValue(option)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>{labels[option]}</span>
        </label>
      ))}
    </div>
  );
}

type UserAccessModalProps = {
  form: UserAccessForm;
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (updates: Partial<UserAccessForm>) => void;
  onSubmit: (event: React.FormEvent) => void;
};

function UserAccessModal({ form, isSubmitting, onClose, onChange, onSubmit }: UserAccessModalProps) {
  const isEditing = Boolean(form.uid);

  const handleRolesChange = (roles: UserRole[]) => {
    onChange({
      roles,
      permissions: mergeSuggestedPermissions(form.permissions, roles),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">{isEditing ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</h2>
            <p className="text-sm text-gray-500">กำหนดข้อมูลบัญชี ตำแหน่งงาน และสิทธิ์เมนู</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <section>
            <h3 className="mb-3 text-sm font-black text-gray-700">ข้อมูลผู้ใช้งาน</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <input required disabled={isEditing} className="rounded-lg border px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" placeholder="Username" value={form.username} onChange={e => onChange({ username: e.target.value })} />
              {!isEditing && (
                <input required className="rounded-lg border px-3 py-2" placeholder="Password" type="password" minLength={6} value={form.password} onChange={e => onChange({ password: e.target.value })} />
              )}
              <input required className="rounded-lg border px-3 py-2" placeholder="Email" type="email" value={form.email} onChange={e => onChange({ email: e.target.value })} />
              <input required className="rounded-lg border px-3 py-2" placeholder="Firstname" value={form.firstname} onChange={e => onChange({ firstname: e.target.value })} />
              <input required className="rounded-lg border px-3 py-2" placeholder="Surname" value={form.surname} onChange={e => onChange({ surname: e.target.value })} />
              <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-semibold text-gray-700">
                <input type="checkbox" checked={form.active} onChange={e => onChange({ active: e.target.checked })} />
                ใช้งานบัญชีนี้
              </label>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-gray-700">ตำแหน่งงาน</h3>
                <button type="button" onClick={() => handleRolesChange([])} className="text-xs font-bold text-gray-400 hover:text-gray-700">ล้าง</button>
              </div>
              <div className="mb-3">
                <BadgeList values={form.roles} labels={ROLE_LABELS} />
              </div>
              <CheckboxGrid values={form.roles} options={ROLE_OPTIONS} labels={ROLE_LABELS} onChange={handleRolesChange} />
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-gray-700">สิทธิ์เมนู</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => onChange({ permissions: getDefaultPermissionsForRoles(form.roles) })} className="text-xs font-bold text-blue-600 hover:text-blue-800">ตามตำแหน่งงาน</button>
                  <button type="button" onClick={() => onChange({ permissions: MENU_PERMISSION_OPTIONS })} className="text-xs font-bold text-emerald-600 hover:text-emerald-800">เลือกทั้งหมด</button>
                  <button type="button" onClick={() => onChange({ permissions: [] })} className="text-xs font-bold text-gray-400 hover:text-gray-700">ล้าง</button>
                </div>
              </div>
              <div className="mb-3">
                <BadgeList values={form.permissions} labels={MENU_PERMISSION_LABELS} color="emerald" limit={5} />
              </div>
              <CheckboxGrid values={form.permissions} options={MENU_PERMISSION_OPTIONS} labels={MENU_PERMISSION_LABELS} onChange={permissions => onChange({ permissions })} />
            </div>
          </section>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2 font-bold text-gray-700 hover:bg-gray-200">
            ยกเลิก
          </button>
          <button disabled={isSubmitting || form.roles.length === 0 || form.permissions.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50">
            <Save size={18} />
            {isEditing ? 'บันทึก' : 'สร้างผู้ใช้งาน'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function UserManagement() {
  const {
    user,
    userProfiles,
    createUserAccount,
    updateUserAccount,
    resetUserPassword,
    setModalConfig,
  } = useAppContext();
  const [accessForm, setAccessForm] = useState<UserAccessForm | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedUsers = useMemo(() => [...userProfiles].sort((a, b) =>
    String(a.username || a.email || '').localeCompare(String(b.username || b.email || ''))
  ), [userProfiles]);

  const showAlert = (title: string, message: string) => {
    setModalConfig({ isOpen: true, type: 'alert', title, message });
  };

  const validateAccess = (roles: UserRole[], permissions: UserPermission[]) => {
    if (roles.length === 0) {
      showAlert('กรุณาเลือกตำแหน่งงาน', 'ผู้ใช้งานต้องมีอย่างน้อย 1 ตำแหน่งงาน');
      return false;
    }
    if (permissions.length === 0) {
      showAlert('กรุณาเลือกสิทธิ์เมนู', 'ผู้ใช้งานต้องมีอย่างน้อย 1 เมนูที่สามารถเข้าใช้งานได้');
      return false;
    }
    return true;
  };

  const handleSubmitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessForm) return;

    const roles = normalizeSelectedRoles(accessForm.roles);
    const permissions = normalizePermissions(accessForm.permissions);
    if (!validateAccess(roles, permissions)) return;

    setIsSubmitting(true);
    try {
      if (accessForm.uid) {
        await updateUserAccount(accessForm.uid, {
          email: accessForm.email,
          firstname: accessForm.firstname,
          surname: accessForm.surname,
          roles,
          permissions,
          active: accessForm.active,
        });
        showAlert('บันทึกผู้ใช้งานสำเร็จ', 'ข้อมูลผู้ใช้งานถูกอัปเดตแล้ว');
      } else {
        await createUserAccount({
          username: accessForm.username,
          password: accessForm.password,
          email: accessForm.email,
          firstname: accessForm.firstname,
          surname: accessForm.surname,
          roles,
          permissions,
        });
        showAlert('สร้างผู้ใช้งานสำเร็จ', 'ผู้ใช้ใหม่สามารถเข้าสู่ระบบด้วย Username/Password ที่กำหนด และจะถูกบังคับให้เปลี่ยนรหัสผ่านครั้งแรก');
      }
      setAccessForm(null);
    } catch (error) {
      showAlert(accessForm.uid ? 'ไม่สามารถบันทึกผู้ใช้งานได้' : 'ไม่สามารถสร้างผู้ใช้งานได้', error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
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
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black text-gray-900">
            <Users className="text-blue-600" />
            จัดการผู้ใช้งาน
          </h1>
          <p className="mt-1 text-gray-500">จัดการบัญชี ตำแหน่งงาน และสิทธิ์เมนูของผู้ใช้งานในระบบ</p>
        </div>
        <button onClick={() => setAccessForm(createEmptyForm())} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white shadow-sm hover:bg-blue-700">
          <UserPlus size={18} />
          เพิ่มผู้ใช้งาน
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">ผู้ใช้งาน</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">ตำแหน่งงาน</th>
                <th className="px-4 py-3 text-left">สิทธิ์เมนู</th>
                <th className="px-4 py-3 text-left">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedUsers.map(profile => {
                const roles = getProfileRoles(profile);
                const permissions = getProfilePermissions(profile);
                const fullName = [profile.firstname, profile.surname].filter(Boolean).join(' ') || profile.displayName || '-';
                return (
                  <tr key={profile.uid} className="align-middle hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <div className="font-black text-gray-900">{profile.username || '-'}</div>
                      <div className="text-xs text-gray-500">{fullName}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{profile.email || '-'}</td>
                    <td className="px-4 py-3 min-w-[190px]">
                      <BadgeList values={roles} labels={ROLE_LABELS} limit={3} />
                    </td>
                    <td className="px-4 py-3 min-w-[280px]">
                      <BadgeList values={permissions} labels={MENU_PERMISSION_LABELS} color="emerald" limit={4} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${profile.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {profile.active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                        {profile.mustChangePassword && <div className="text-xs font-bold text-amber-600">ต้องเปลี่ยนรหัส</div>}
                        {profile.uid === user?.uid && <div className="text-xs text-blue-600">บัญชีของคุณ</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button disabled={isSubmitting} onClick={() => setAccessForm(createFormFromProfile(profile))} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                          <Edit3 size={16} />
                          แก้ไข
                        </button>
                        <button disabled={isSubmitting} onClick={() => handleResetPassword(profile)} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50">
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
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    <RefreshCw className="mx-auto mb-2 text-gray-300" />
                    ยังไม่มีข้อมูลผู้ใช้งาน หรือกำลังโหลดข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {accessForm && (
        <UserAccessModal
          form={accessForm}
          isSubmitting={isSubmitting}
          onClose={() => setAccessForm(null)}
          onChange={updates => setAccessForm(current => current ? { ...current, ...updates } : current)}
          onSubmit={handleSubmitForm}
        />
      )}
    </div>
  );
}
