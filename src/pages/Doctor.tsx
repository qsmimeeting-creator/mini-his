import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { QueueTable, QueueTab } from '../components/common/QueueTable';
import { Visit } from '../types';
import { Activity, AlertTriangle, Thermometer, Heart, Weight, Ruler, Droplets } from 'lucide-react';

export default function Doctor() {
  const { vaccines, patients, updateVisitStatus, setModalConfig } = useAppContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [selectedVaccines, setSelectedVaccines] = useState<string[]>([]);

  const handleCallQueue = async (visit: Visit) => {
    await updateVisitStatus(visit.id, 'DOCTOR_IN_PROGRESS');
    openOrderModal(visit);
  };

  const openOrderModal = (visit: Visit) => {
    setSelectedVisit(visit);
    setSelectedVaccines([]);
    setIsModalOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedVisit || selectedVaccines.length === 0) return;

    const orders = selectedVaccines.map(id => vaccines.find(v => v.id === id)).filter(Boolean);
    
    try {
      await updateVisitStatus(selectedVisit.id, 'POST_DOCTOR_PENDING', { 
        orders, 
        orderedAt: new Date().toLocaleTimeString('th-TH') 
      });
      
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'สั่งวัคซีนสำเร็จ',
        message: `แพทย์สั่งจ่ายวัคซีน ${orders.map(o => o?.name).join(', ')} ให้กับผู้ป่วยเรียบร้อยแล้ว\nส่งต่อไปยังห้องหลังพบแพทย์เพื่อตรวจสอบ`
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsModalOpen(false);
      setSelectedVisit(null);
    }
  };

  const toggleVaccine = (id: string) => {
    setSelectedVaccines(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const renderScreeningInfo = (v: Visit) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1 text-xs font-medium text-blue-700">
        <Activity size={12} />
        <span>BP: {v.data?.bp || '-'}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><Thermometer size={10} /> {v.data?.temp || '-'}°C</span>
        <span className="flex items-center gap-1"><Heart size={10} /> {v.data?.pulse || '-'}</span>
        <span className="flex items-center gap-1"><Weight size={10} /> {v.data?.weight || '-'}kg</span>
        <span className="flex items-center gap-1"><Droplets size={10} /> {v.data?.spo2 || '-'}%</span>
      </div>
    </div>
  );

  const tabs: QueueTab[] = [
    {
      id: 'waiting',
      label: 'รอเรียกคิว',
      filter: (v) => v.status === 'DOCTOR_PENDING',
      renderExtraColumn: renderScreeningInfo,
      actionLabel: 'เรียกคิว',
      onAction: handleCallQueue
    },
    {
      id: 'in_progress',
      label: 'กำลังดำเนินการ',
      filter: (v) => v.status === 'DOCTOR_IN_PROGRESS',
      renderExtraColumn: renderScreeningInfo,
      actionLabel: 'สั่งวัคซีน',
      onAction: openOrderModal
    },
    {
      id: 'completed',
      label: 'คิวที่เสร็จสิ้น',
      filter: (v) => !!v.data?.orderedAt,
      renderExtraColumn: (v) => {
        const orders = v.data?.orders || [];
        return (
          <div className="text-xs text-gray-500">
            <div>วัคซีน: {orders.map((o: any) => o.name).join(', ')}</div>
            <div>เวลา: {v.data?.orderedAt}</div>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      <SectionTitle title="ห้องตรวจแพทย์" subtitle="พิจารณาสั่งจ่ายวัคซีน" />
      <QueueTable 
        title="รายการพบแพทย์" 
        tabs={tabs}
      />

      {isModalOpen && selectedVisit && (
        <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">สั่งจ่ายวัคซีน</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <AlertTriangle size={20} className="hidden" /> {/* Placeholder for layout if needed */}
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Patient Info Summary */}
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase">ผู้ป่วย</p>
                  <p className="font-bold text-gray-900">{selectedVisit.patientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600 font-bold uppercase">VN / HN</p>
                  <p className="text-sm font-medium text-gray-700">{selectedVisit.vn} / {patients.find(p => p.id === selectedVisit.patientId)?.hn}</p>
                </div>
              </div>

              {/* Allergy Alert Bar */}
              {patients.find(p => p.id === selectedVisit.patientId)?.allergies && (
                <div className="bg-red-600 text-white p-3 rounded-lg flex items-center gap-3 shadow-md animate-pulse">
                  <AlertTriangle size={24} className="shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-80">คำเตือน: ประวัติการแพ้ยา / แพ้อาหาร</p>
                    <p className="text-sm font-bold leading-tight">{patients.find(p => p.id === selectedVisit.patientId)?.allergies}</p>
                  </div>
                </div>
              )}

              {/* Vital Signs Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">BP</p>
                  <p className="text-sm font-bold text-gray-900">{selectedVisit.data?.bp || '-'}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Temp</p>
                  <p className="text-sm font-bold text-gray-900">{selectedVisit.data?.temp || '-'}°C</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Pulse</p>
                  <p className="text-sm font-bold text-gray-900">{selectedVisit.data?.pulse || '-'}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">SpO2</p>
                  <p className="text-sm font-bold text-gray-900">{selectedVisit.data?.spo2 || '-'}%</p>
                </div>
              </div>

              {/* Vaccine Selection */}
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">เลือกวัคซีนที่ต้องการสั่งจ่าย:</p>
                <div className="space-y-2 border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto bg-white">
                  {vaccines.map(vac => (
                    <label key={vac.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedVaccines.includes(vac.id) ? 'bg-blue-50 border-blue-200 border' : 'hover:bg-gray-50 border border-transparent'}`}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={selectedVaccines.includes(vac.id)}
                        onChange={() => toggleVaccine(vac.id)}
                      />
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-sm">{vac.name}</div>
                        <div className="text-xs text-gray-500">คงเหลือ: {vac.stock} | ฿{vac.price.toLocaleString()}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleConfirmOrder}
                disabled={selectedVaccines.length === 0}
                className="px-8 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยืนยันการสั่งวัคซีน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
