import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { QueueTable, QueueTab } from '../components/common/QueueTable';
import { Visit } from '../types';
import { CheckCircle, CheckCircle2, ClipboardList } from 'lucide-react';
import { PostDoctorModal } from '../components/common/PostDoctorModal';

export default function PostDoctor() {
  const { updateVisitStatus, setModalConfig } = useAppContext();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const handleCallQueue = async (visit: Visit) => {
    await updateVisitStatus(visit.id, 'POST_DOCTOR_IN_PROGRESS');
    setSelectedVisit(visit);
  };

  const handleComplete = async (visit: Visit) => {
    try {
      await updateVisitStatus(visit.id, 'PAYMENT_PENDING', {
        postDoctorVerifiedAt: new Date().toISOString()
      });
      
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'ตรวจสอบสำเร็จ',
        message: `ตรวจสอบความถูกต้องสำหรับ ${visit.patientName} เรียบร้อยแล้ว\nส่งต่อไปยังจุดชำระเงิน`
      });
      setSelectedVisit(null);
    } catch (error) {
      console.error(error);
    }
  };

  const renderOrderInfo = (v: Visit) => {
    const orders = v.data?.orders || [];
    return (
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 mb-1">วัคซีนที่สั่ง</span>
        <div className="flex flex-wrap gap-1">
          {orders.map((o: any, i: number) => (
            <span key={i} className="inline-flex bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-medium border border-blue-100">
              {o.name}
            </span>
          ))}
          {orders.length === 0 && <span className="text-xs text-gray-400">-</span>}
        </div>
      </div>
    );
  };

  const tabs: QueueTab[] = [
    {
      id: 'waiting',
      label: 'รอตรวจสอบ',
      filter: (v) => v.status === 'POST_DOCTOR_PENDING',
      renderExtraColumn: renderOrderInfo,
      actionLabel: 'เรียกคิว',
      onAction: handleCallQueue
    },
    {
      id: 'in_progress',
      label: 'กำลังดำเนินการ',
      filter: (v) => v.status === 'POST_DOCTOR_IN_PROGRESS',
      renderExtraColumn: renderOrderInfo,
      actionLabel: 'ยืนยันความถูกต้อง',
      onAction: (v) => setSelectedVisit(v)
    },
    {
      id: 'completed',
      label: 'ตรวจสอบแล้ว',
      filter: (v) => !!v.data?.postDoctorVerifiedAt,
      renderExtraColumn: (v) => (
        <div className="text-xs text-gray-500">
          <div className="flex items-center gap-1 text-green-600 font-medium">
            <CheckCircle size={12} />
            ตรวจสอบแล้ว
          </div>
          <div className="text-[10px] italic">เวลา: {new Date(v.data?.postDoctorVerifiedAt).toLocaleTimeString('th-TH')}</div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SectionTitle title="ห้องหลังพบแพทย์" subtitle="ตรวจสอบความถูกต้องของข้อมูลก่อนชำระเงิน" />
      <QueueTable 
        title="รายการรอตรวจสอบ" 
        tabs={tabs}
      />

      {selectedVisit && (
        <PostDoctorModal 
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onConfirm={() => handleComplete(selectedVisit)}
        />
      )}
    </div>
  );
}
