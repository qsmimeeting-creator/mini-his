import React from 'react';
import { Users } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const QueueSummary = () => {
  const { visits } = useAppContext();

  const groups = [
    { label: 'คัดกรอง/ซักประวัติ', statuses: ['SCREENING_PENDING', 'SCREENING_IN_PROGRESS'], color: 'bg-blue-100 text-blue-700' },
    { label: 'ห้องตรวจแพทย์', statuses: ['DOCTOR_PENDING', 'DOCTOR_IN_PROGRESS'], color: 'bg-indigo-100 text-indigo-700' },
    { label: 'พยาบาลหลังพบแพทย์', statuses: ['POST_DOCTOR_PENDING', 'POST_DOCTOR_IN_PROGRESS'], color: 'bg-violet-100 text-violet-700' },
    { label: 'การเงิน', statuses: ['PAYMENT_PENDING', 'PAYMENT_IN_PROGRESS'], color: 'bg-amber-100 text-amber-700' },
    { label: 'ห้องจ่ายยา/คลัง', statuses: ['DISPENSE_PENDING', 'DISPENSE_IN_PROGRESS'], color: 'bg-orange-100 text-orange-700' },
    { label: 'ห้องฉีดยา', statuses: ['INJECTION_PENDING', 'INJECTION_IN_PROGRESS'], color: 'bg-sky-100 text-sky-700' },
    { label: 'เสร็จสิ้น', statuses: ['COMPLETED'], color: 'bg-emerald-100 text-emerald-700' },
  ];

  const getCount = (statuses: string[]) => {
    return visits.filter(v => statuses.includes(v.status)).length;
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm z-10 relative">
      <div className="px-6 py-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 min-w-max">
          {groups.map(group => (
            <div key={group.label} className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-100 min-w-[160px]">
              <div className={`p-2 rounded-full ${group.color.split(' ')[0]}`}>
                <Users size={16} className={group.color.split(' ')[1]} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{group.label}</p>
                <p className="text-lg font-bold text-gray-800 leading-tight">{getCount(group.statuses)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
