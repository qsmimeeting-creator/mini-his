import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Activity, Stethoscope, CheckCircle, 
  CreditCard, Pill, Syringe, BarChart3, Database 
} from 'lucide-react';

interface MenuCardProps {
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  path: string;
}

const MenuCard: React.FC<MenuCardProps> = ({ title, subtitle, icon: Icon, color, path }) => {
  const navigate = useNavigate();
  
  return (
    <button 
      onClick={() => navigate(path)}
      className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 text-left flex flex-col h-full"
    >
      <div className={`p-3 rounded-xl ${color} text-white w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={28} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2">{subtitle}</p>
      <div className="mt-auto pt-4 flex items-center text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
        เข้าสู่ระบบงาน 
        <span className="ml-1">→</span>
      </div>
    </button>
  );
};

export default function Home() {
  const menus = [
    {
      title: 'จุดลงทะเบียน',
      subtitle: 'ลงทะเบียนผู้ป่วยใหม่ ค้นหาประวัติ และเปิด Visit การรักษา',
      icon: Plus,
      color: 'bg-blue-600',
      path: '/registration'
    },
    {
      title: 'คัดกรอง / ซักประวัติ',
      subtitle: 'วัดสัญญาณชีพ ชั่งน้ำหนัก วัดส่วนสูง และซักประวัติเบื้องต้น',
      icon: Activity,
      color: 'bg-emerald-600',
      path: '/screening'
    },
    {
      title: 'ห้องตรวจแพทย์',
      subtitle: 'ตรวจวินิจฉัย และสั่งจ่ายวัคซีนโดยแพทย์ผู้เชี่ยวชาญ',
      icon: Stethoscope,
      color: 'bg-indigo-600',
      path: '/doctor'
    },
    {
      title: 'พยาบาลหลังพบแพทย์',
      subtitle: 'ตรวจสอบคำสั่งแพทย์ และให้คำแนะนำก่อนชำระเงิน',
      icon: CheckCircle,
      color: 'bg-teal-600',
      path: '/post-doctor'
    },
    {
      title: 'การเงิน',
      subtitle: 'ตรวจสอบค่าใช้จ่าย ออกใบเสร็จ และรับชำระเงิน',
      icon: CreditCard,
      color: 'bg-amber-600',
      path: '/cashier'
    },
    {
      title: 'ห้องจ่ายยา / คลัง',
      subtitle: 'จ่ายวัคซีนตามใบสั่ง และจัดการสต็อกวัคซีนในคลัง',
      icon: Pill,
      color: 'bg-purple-600',
      path: '/dispense'
    },
    {
      title: 'ห้องฉีดยา',
      subtitle: 'ให้บริการฉีดวัคซีน และบันทึกข้อมูลการฉีด',
      icon: Syringe,
      color: 'bg-rose-600',
      path: '/injection'
    },
    {
      title: 'จัดการข้อมูล',
      subtitle: 'รายงานสถิติ และข้อมูลภาพรวมของระบบ',
      icon: BarChart3,
      color: 'bg-slate-700',
      path: '/data-management'
    },
    {
      title: 'จัดการคลังวัคซีน',
      subtitle: 'เพิ่ม แก้ไข และตรวจสอบรายการวัคซีนทั้งหมด',
      icon: Database,
      color: 'bg-cyan-600',
      path: '/vaccine-inventory'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-4">ยินดีต้อนรับสู่ระบบ Mini HIS</h1>
        <p className="text-gray-500 text-lg">กรุณาเลือกเมนูหลักตามหน้าที่ความรับผิดชอบของคุณ</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.map((menu, index) => (
          <MenuCard key={index} {...menu} />
        ))}
      </div>
    </div>
  );
}
