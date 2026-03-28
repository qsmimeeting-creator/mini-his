import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { QueueTable, QueueTab } from '../components/common/QueueTable';
import { Visit } from '../types';
import { Activity, Thermometer, Heart, Weight, Scale, CheckCircle2 } from 'lucide-react';
import { DoctorOrderModal } from '../components/common/DoctorOrderModal';

export default function Doctor() {
  const { vaccines, updateVisitStatus, setModalConfig, activeVisitId, setActiveVisitId, visits } = useAppContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  // Handle active visit from navigation
  React.useEffect(() => {
    if (activeVisitId) {
      const visit = visits.find(v => v.id === activeVisitId);
      if (visit && (visit.status === 'DOCTOR_PENDING' || visit.status === 'DOCTOR_IN_PROGRESS')) {
        setSelectedVisit(visit);
        setIsModalOpen(true);
      }
      setActiveVisitId(null); // Clear it after use
    }
  }, [activeVisitId, visits, setActiveVisitId]);

  const handleCallQueue = async (visit: Visit) => {
    await updateVisitStatus(visit.id, 'DOCTOR_IN_PROGRESS');
    openOrderModal(visit);
  };

  const openOrderModal = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsModalOpen(true);
  };

  const handleConfirmOrder = async (selectedVaccineIds: string[], additionalData: { doctorNote: string, diagnosis: string }) => {
    if (!selectedVisit || selectedVaccineIds.length === 0) return;

    const orders = selectedVaccineIds.map(id => vaccines.find(v => v.id === id)).filter(Boolean);
    
    try {
      await updateVisitStatus(selectedVisit.id, 'POST_DOCTOR_PENDING', { 
        orders, 
        ...additionalData,
        orderedAt: new Date().toISOString() 
      });
      
      const totalAmount = orders.reduce((sum, o) => sum + (o?.price || 0), 0);
      
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'สั่งวัคซีนสำเร็จ',
        message: (
          <div className="space-y-4 mt-2">
            <p className="text-gray-700">แพทย์สั่งจ่ายวัคซีนให้กับผู้ป่วยเรียบร้อยแล้ว ส่งต่อไปยังพยาบาลหลังพบแพทย์เพื่อตรวจสอบ</p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase border-b border-gray-200 pb-2 mb-2">รายการวัคซีนที่สั่งจ่าย</div>
              {orders.map((o, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <span className="font-medium text-gray-800">{o?.name}</span>
                  <span className="text-blue-600 font-bold whitespace-nowrap ml-4">฿{o?.price.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">ยอดรวมทั้งสิ้น</span>
                <span className="font-bold text-lg text-emerald-600">฿{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsModalOpen(false);
      setSelectedVisit(null);
    }
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
        <span className="flex items-center gap-1"><Scale size={10} /> {v.data?.bmi || '-'}</span>
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
            <div className="font-medium text-emerald-600 flex items-center gap-1">
              <CheckCircle2 size={12} />
              สั่งจ่ายแล้ว
            </div>
            <div className="truncate max-w-[150px]">วัคซีน: {orders.map((o: any) => o.name).join(', ')}</div>
            <div className="text-[10px] italic">เวลา: {new Date(v.data?.orderedAt).toLocaleTimeString('th-TH')}</div>
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
        <DoctorOrderModal 
          visit={selectedVisit}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmOrder}
        />
      )}
    </div>
  );
}
