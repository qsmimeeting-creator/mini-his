import React, { useState } from 'react';
import { Users, FileText, ChevronRight, Search, Trash2, Eye } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { th } from 'date-fns/locale';
import { Visit } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { PatientDetailsModal } from './PatientDetailsModal';

export interface QueueTab {
  id: string;
  label: string;
  filter: (visit: Visit) => boolean;
  actionLabel?: string;
  onAction?: (visit: Visit) => void | React.ReactNode;
  renderExtraColumn?: (visit: Visit) => React.ReactNode;
  showVoid?: boolean;
}

export const QueueTable = ({ title, tabs }: { 
  title: string, 
  tabs: QueueTab[]
}) => {
  const { visits, patients, voidVisit, setModalConfig } = useAppContext();
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  
  const handleVoid = (visit: Visit) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'ยืนยันการยกเลิก',
      message: `คุณต้องการยกเลิกการรับบริการของ ${visit.patientName} ใช่หรือไม่?`,
      onConfirm: async () => {
        try {
          await voidVisit(visit.id);
          setModalConfig({
            isOpen: true,
            type: 'alert',
            title: 'สำเร็จ',
            message: 'ยกเลิกการรับบริการเรียบร้อยแล้ว'
          });
        } catch (error) {
          setModalConfig({
            isOpen: true,
            type: 'alert',
            title: 'เกิดข้อผิดพลาด',
            message: 'ไม่สามารถยกเลิกการรับบริการได้'
          });
        }
      }
    });
  };

  const filteredVisits = visits.filter(v => {
    const matchesTab = activeTab.filter(v);
    if (!matchesTab) return false;
    
    if (!searchTerm) return true;
    
    const patient = patients.find(p => p.id === v.patientId);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      v.patientName.toLowerCase().includes(searchLower) ||
      v.vn.toLowerCase().includes(searchLower) ||
      (patient && patient.hn.toLowerCase().includes(searchLower)) ||
      (patient && patient.cid && patient.cid.includes(searchTerm))
    );
  });

  const formatTime = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      if (isValid(date)) {
        return format(date, 'HH:mm', { locale: th });
      }
      return timestamp;
    } catch (e) {
      return timestamp;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <FileText size={18} className="text-blue-600"/>
          {title}
        </h3>
        
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="ค้นหา HN, ชื่อ, VN..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          />
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50/50 overflow-x-auto">
        {tabs.map(tab => {
          const count = visits.filter(tab.filter).length;
          const isActive = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span className={`py-0.5 px-2 rounded-full text-xs ${
                isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        {filteredVisits.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-gray-400">
            <Users size={40} className="mb-3 text-gray-300"/>
            <p>ไม่มีรายการคิวผู้ป่วยในขณะนี้</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="p-4 font-medium whitespace-nowrap">เวลา</th>
                <th className="p-4 font-medium">ข้อมูลผู้ป่วย</th>
                <th className="p-4 font-medium">สถานะ</th>
                {activeTab.renderExtraColumn && <th className="p-4 font-medium">รายละเอียด</th>}
                {activeTab.onAction && <th className="p-4 font-medium text-right">การจัดการ</th>}
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredVisits.map((v) => (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 text-gray-500">{formatTime(v.timestamp)}</td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{v.patientName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">VN: {v.vn} | {patients.find(p=>p.id === v.patientId)?.hn}</div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={v.status} />
                  </td>
                  {activeTab.renderExtraColumn && <td className="p-4">{activeTab.renderExtraColumn(v)}</td>}
                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button 
                        onClick={() => setSelectedPatientId(v.patientId)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="ดูรายละเอียดผู้ป่วย"
                      >
                        <Eye size={18} />
                      </button>
                      {v.status !== 'COMPLETED' && v.status !== 'VOID' && (
                        <button 
                          onClick={() => handleVoid(v)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="ยกเลิกการรับบริการ (Void)"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      {activeTab.onAction && (
                        <>
                          {activeTab.actionLabel ? (
                            <button 
                              onClick={() => activeTab.onAction!(v)}
                              className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                            >
                              {activeTab.actionLabel} <ChevronRight size={16}/>
                            </button>
                          ) : (
                            activeTab.onAction(v)
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedPatientId && (
        <PatientDetailsModal 
          patientId={selectedPatientId} 
          onClose={() => setSelectedPatientId(null)} 
        />
      )}
    </div>
  );
};
