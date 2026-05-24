import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  Stethoscope,
  CreditCard,
  Pill,
  Syringe,
  Database,
  Plus,
  Menu,
  X,
  LogIn,
  BarChart3,
  RotateCcw,
  CheckCircle,
  UserCog,
  KeyRound,
} from 'lucide-react';

import { useAppContext } from './context/AppContext';
import { CustomModal } from './components/common/CustomModal';
import { QueueSummary } from './components/common/QueueSummary';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import Screening from './pages/Screening';
import Doctor from './pages/Doctor';
import PostDoctor from './pages/PostDoctor';
import Cashier from './pages/Cashier';
import Dispense from './pages/Dispense';
import Injection from './pages/Injection';
import DataManagement from './pages/DataManagement';
import VisitHistory from './pages/VisitHistory';
import UserManagement from './pages/UserManagement';
import { getDefaultRouteForRoles } from './utils/permissions';

type SidebarItemProps = {
  icon: any;
  label: string;
  isActive: boolean;
  onClick: () => void;
};

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 border-l-4 ${
      isActive
        ? 'bg-blue-50 text-blue-700 border-blue-600'
        : 'text-gray-600 hover:bg-gray-50 border-transparent hover:text-blue-600'
    }`}
  >
    <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
    {label}
  </button>
);

const AccessDenied = ({ user, logout }: { user: any; logout: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 max-w-xl w-full text-center space-y-4">
      <div className="mx-auto w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
        <X size={28} />
      </div>
      <h1 className="text-2xl font-black text-gray-900">ไม่มีสิทธิ์ใช้งานระบบ</h1>
      <p className="text-gray-600">บัญชีนี้ยังไม่มี role หรือถูกปิดการใช้งาน กรุณาติดต่อ Admin เพื่อกำหนดสิทธิ์</p>
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 text-left">
        <div>UID: {user?.uid || '-'}</div>
        <div>Email: {user?.email || '-'}</div>
      </div>
      <button onClick={logout} className="px-5 py-2.5 rounded-lg bg-gray-900 text-white font-bold hover:bg-gray-800">
        ออกจากระบบ
      </button>
    </div>
  </div>
);

const LoginScreen = () => {
  const { login, setModalConfig } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showAlert = (title: string, message: string) => {
    setModalConfig({ isOpen: true, type: 'alert', title, message });
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (error) {
      showAlert('เข้าสู่ระบบไม่สำเร็จ', error instanceof Error ? error.message : 'กรุณาตรวจสอบ Username/Password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <CustomModal />
      <form onSubmit={handleLogin} className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 max-w-md w-full space-y-5">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Syringe size={28} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-4">Mini HIS</h1>
          <p className="text-gray-500 mt-1">เข้าสู่ระบบด้วย Username และ Password</p>
        </div>
        <label className="block">
          <span className="text-sm font-bold text-gray-700">Username</span>
          <input value={username} onChange={e => setUsername(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" autoComplete="username" required />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-gray-700">Password</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" autoComplete="current-password" required />
        </label>
        <button disabled={isSubmitting} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white font-bold px-5 py-3 hover:bg-blue-700 disabled:opacity-50">
          <LogIn size={18} />
          {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
};

const ForcePasswordChange = () => {
  const { changeOwnPassword, logout, userRole, setModalConfig } = useAppContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setModalConfig({ isOpen: true, type: 'alert', title: 'Password ไม่ตรงกัน', message: 'กรุณายืนยัน Password ใหม่ให้ตรงกัน' });
      return;
    }
    setIsSubmitting(true);
    try {
      await changeOwnPassword(currentPassword, newPassword);
      setModalConfig({ isOpen: true, type: 'alert', title: 'เปลี่ยนรหัสผ่านสำเร็จ', message: 'คุณสามารถใช้งานระบบต่อได้แล้ว' });
    } catch (error) {
      setModalConfig({ isOpen: true, type: 'alert', title: 'ไม่สามารถเปลี่ยนรหัสผ่านได้', message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <CustomModal />
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 max-w-md w-full space-y-5">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <KeyRound size={28} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-4">ต้องเปลี่ยนรหัสผ่าน</h1>
          <p className="text-gray-500 mt-1">{userRole?.username || userRole?.email || 'บัญชีผู้ใช้'} ต้องตั้งรหัสผ่านใหม่ก่อนใช้งาน</p>
        </div>
        <input className="w-full rounded-lg border border-gray-300 px-4 py-3" type="password" placeholder="Password เดิม" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
        <input className="w-full rounded-lg border border-gray-300 px-4 py-3" type="password" placeholder="Password ใหม่" minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
        <input className="w-full rounded-lg border border-gray-300 px-4 py-3" type="password" placeholder="ยืนยัน Password ใหม่" minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        <button disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 text-white font-bold px-5 py-3 hover:bg-blue-700 disabled:opacity-50">
          {isSubmitting ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
        </button>
        <button type="button" onClick={logout} className="w-full rounded-lg bg-gray-100 text-gray-700 font-bold px-5 py-3 hover:bg-gray-200">
          ออกจากระบบ
        </button>
      </form>
    </div>
  );
};

const ProtectedRoute = ({ path, children }: { path: string; children: React.ReactNode }) => {
  const { canAccessRoute, userRoles } = useAppContext();
  if (!canAccessRoute(path)) {
    return <Navigate to={getDefaultRouteForRoles(userRoles)} replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const { user, isAuthReady, isRoleReady, userRole, userRoles, logout, canAccessRoute } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === '/' || location.pathname === '';

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">กำลังโหลด...</div>;
  }

  if (!user) return <LoginScreen />;

  if (!isRoleReady) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">กำลังตรวจสอบสิทธิ์...</div>;
  }

  if (userRoles.length === 0) {
    return <AccessDenied user={user} logout={logout} />;
  }

  if (userRole?.mustChangePassword) {
    return <ForcePasswordChange />;
  }

  if (isHomePage) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 overflow-auto">
        <CustomModal />
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-12 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3 text-blue-700 font-black text-2xl tracking-tight">
            <Syringe className="text-blue-600" size={32} />
            Mini HIS
          </div>
        </header>
        <main className="p-6 md:p-12">
          <Home />
        </main>
      </div>
    );
  }

  const sidebarItems = [
    { path: '/registration', icon: Plus, label: 'จุดลงทะเบียน' },
    { path: '/screening', icon: Activity, label: 'คัดกรอง / ซักประวัติ' },
    { path: '/doctor', icon: Stethoscope, label: 'ห้องตรวจแพทย์' },
    { path: '/post-doctor', icon: CheckCircle, label: 'พยาบาลหลังพบแพทย์' },
    { path: '/cashier', icon: CreditCard, label: 'การเงิน' },
    { path: '/dispense', icon: Pill, label: 'ห้องจ่ายยา / คลัง' },
    { path: '/injection', icon: Syringe, label: 'ห้องฉีดยา' },
    { path: '/data-management', icon: BarChart3, label: 'จัดการข้อมูล' },
    { path: '/vaccine-inventory', icon: Database, label: 'จัดการวัคซีน' },
    { path: '/visit-history', icon: RotateCcw, label: 'ค้นหาและแก้ไขงาน' },
    { path: '/user-management', icon: UserCog, label: 'จัดการผู้ใช้งาน' },
  ].filter(item => canAccessRoute(item.path));

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <CustomModal />
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-20 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xl tracking-tight cursor-pointer" onClick={() => navigate('/')}>
            <Syringe className="text-blue-600" size={24} />
            Mini HIS
          </div>
          <button className="lg:hidden text-gray-400 hover:text-gray-600" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">เมนูหลัก</p>
          <nav className="space-y-1">
            {sidebarItems.map(item => (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                isActive={location.pathname === item.path}
                onClick={() => { navigate(item.path); setIsSidebarOpen(false); }}
              />
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-0 shadow-sm">
          <button className="text-gray-500 hover:text-gray-700 lg:hidden" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden md:block text-sm text-gray-500">{userRole?.displayName || userRole?.username || user.email}</span>
            <button onClick={logout} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200">
              ออกจากระบบ
            </button>
          </div>
        </header>

        <QueueSummary />

        <main className="flex-1 overflow-auto p-6 md:p-8">
          <Routes>
            <Route path="/vaccine-inventory" element={<ProtectedRoute path="/vaccine-inventory"><Dashboard /></ProtectedRoute>} />
            <Route path="/registration" element={<ProtectedRoute path="/registration"><Registration /></ProtectedRoute>} />
            <Route path="/screening" element={<ProtectedRoute path="/screening"><Screening /></ProtectedRoute>} />
            <Route path="/doctor" element={<ProtectedRoute path="/doctor"><Doctor /></ProtectedRoute>} />
            <Route path="/post-doctor" element={<ProtectedRoute path="/post-doctor"><PostDoctor /></ProtectedRoute>} />
            <Route path="/cashier" element={<ProtectedRoute path="/cashier"><Cashier /></ProtectedRoute>} />
            <Route path="/dispense" element={<ProtectedRoute path="/dispense"><Dispense /></ProtectedRoute>} />
            <Route path="/injection" element={<ProtectedRoute path="/injection"><Injection /></ProtectedRoute>} />
            <Route path="/data-management" element={<ProtectedRoute path="/data-management"><DataManagement /></ProtectedRoute>} />
            <Route path="/visit-history" element={<ProtectedRoute path="/visit-history"><VisitHistory /></ProtectedRoute>} />
            <Route path="/user-management" element={<ProtectedRoute path="/user-management"><UserManagement /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={getDefaultRouteForRoles(userRoles)} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
