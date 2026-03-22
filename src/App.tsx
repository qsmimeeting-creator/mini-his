import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, Stethoscope, CreditCard, Pill, Syringe, 
  Database, Plus, Search, Bell, Menu, X, LogOut, LogIn, CheckCircle, BarChart3
} from 'lucide-react';

import { useAppContext } from './context/AppContext';
import { CustomModal } from './components/common/CustomModal';
import { QueueSummary } from './components/common/QueueSummary';

// Pages
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import Screening from './pages/Screening';
import Doctor from './pages/Doctor';
import PostDoctor from './pages/PostDoctor';
import Cashier from './pages/Cashier';
import Dispense from './pages/Dispense';
import Injection from './pages/Injection';
import DataManagement from './pages/DataManagement';

const SidebarItem = ({ path, icon: Icon, label, isActive, onClick }: { path: string, icon: any, label: string, isActive: boolean, onClick: () => void }) => {
  return (
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
};

export default function App() {
  const { user, isAuthReady, login, logout } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">กำลังโหลด...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <CustomModal />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xl tracking-tight">
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
            <SidebarItem path="/registration" icon={Plus} label="จุดลงทะเบียน" isActive={location.pathname === '/registration'} onClick={() => { navigate('/registration'); setIsSidebarOpen(false); }} />
            <SidebarItem path="/screening" icon={Activity} label="คัดกรอง / ซักประวัติ" isActive={location.pathname === '/screening'} onClick={() => { navigate('/screening'); setIsSidebarOpen(false); }} />
            <SidebarItem path="/doctor" icon={Stethoscope} label="ห้องตรวจแพทย์" isActive={location.pathname === '/doctor'} onClick={() => { navigate('/doctor'); setIsSidebarOpen(false); }} />
            <SidebarItem path="/post-doctor" icon={CheckCircle} label="พยาบาลหลังพบแพทย์" isActive={location.pathname === '/post-doctor'} onClick={() => { navigate('/post-doctor'); setIsSidebarOpen(false); }} />
            <SidebarItem path="/cashier" icon={CreditCard} label="การเงิน" isActive={location.pathname === '/cashier'} onClick={() => { navigate('/cashier'); setIsSidebarOpen(false); }} />
            <SidebarItem path="/dispense" icon={Pill} label="ห้องจ่ายยา / คลัง" isActive={location.pathname === '/dispense'} onClick={() => { navigate('/dispense'); setIsSidebarOpen(false); }} />
            <SidebarItem path="/injection" icon={Syringe} label="ห้องฉีดยา" isActive={location.pathname === '/injection'} onClick={() => { navigate('/injection'); setIsSidebarOpen(false); }} />
            <SidebarItem path="/data-management" icon={BarChart3} label="จัดการข้อมูล" isActive={location.pathname === '/data-management'} onClick={() => { navigate('/data-management'); setIsSidebarOpen(false); }} />
            <SidebarItem path="/" icon={Database} label="จัดการวัคซีน" isActive={location.pathname === '/' || location.pathname === ''} onClick={() => { navigate('/'); setIsSidebarOpen(false); }} />
          </nav>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-0 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <button className="text-gray-500 hover:text-gray-700 lg:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-gray-500 hover:text-gray-700">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Global Queue Summary */}
        <QueueSummary />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/screening" element={<Screening />} />
            <Route path="/doctor" element={<Doctor />} />
            <Route path="/post-doctor" element={<PostDoctor />} />
            <Route path="/cashier" element={<Cashier />} />
            <Route path="/dispense" element={<Dispense />} />
            <Route path="/injection" element={<Injection />} />
            <Route path="/data-management" element={<DataManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
