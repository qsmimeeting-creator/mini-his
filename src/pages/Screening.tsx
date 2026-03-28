import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { QueueTable, QueueTab } from '../components/common/QueueTable';
import { Visit } from '../types';
import { ScreeningModal } from '../components/common/ScreeningModal';

export default function Screening() {
  const { updateVisitStatus, activeVisitId, setActiveVisitId, visits } = useAppContext();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  // Handle active visit from navigation
  React.useEffect(() => {
    if (activeVisitId) {
      const visit = visits.find(v => v.id === activeVisitId);
      if (visit && (visit.status === 'SCREENING_PENDING' || visit.status === 'SCREENING_IN_PROGRESS')) {
        setSelectedVisit(visit);
      }
      setActiveVisitId(null); // Clear it after use
    }
  }, [activeVisitId, visits, setActiveVisitId]);

  const handleCallQueue = async (visit: Visit) => {
    await updateVisitStatus(visit.id, 'SCREENING_IN_PROGRESS');
    setSelectedVisit(visit);
  };

  const handleScreening = (visit: Visit) => {
    setSelectedVisit(visit);
  };

  const onSaveScreening = async (data: any) => {
    if (selectedVisit) {
      await updateVisitStatus(selectedVisit.id, 'DOCTOR_PENDING', data);
      setSelectedVisit(null);
    }
  };

  const tabs: QueueTab[] = [
    {
      id: 'waiting',
      label: 'รอเรียกคิว',
      filter: (v) => v.status === 'SCREENING_PENDING',
      actionLabel: 'เรียกคิว',
      onAction: handleCallQueue
    },
    {
      id: 'in_progress',
      label: 'กำลังดำเนินการ',
      filter: (v) => v.status === 'SCREENING_IN_PROGRESS',
      actionLabel: 'บันทึกคัดกรอง',
      onAction: handleScreening
    },
    {
      id: 'completed',
      label: 'คิวที่เสร็จสิ้น',
      filter: (v) => !!v.data?.screenedAt,
      renderExtraColumn: (v) => (
        <div className="text-xs text-gray-500 space-y-1">
          <div className="font-medium text-blue-600">BP: {v.data?.bp} mmHg</div>
          <div className="grid grid-cols-2 gap-x-2">
            <span>T: {v.data?.temp}°C</span>
            <span>P: {v.data?.pulse}</span>
            <span>W: {v.data?.weight}kg</span>
            <span>H: {v.data?.height}cm</span>
          </div>
          <div className="text-[10px] text-gray-400 italic">เวลา: {new Date(v.data?.screenedAt).toLocaleTimeString('th-TH')}</div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SectionTitle title="คัดกรอง / ซักประวัติ" subtitle="บันทึกสัญญาณชีพพื้นฐานก่อนเข้าพบแพทย์" />
      <QueueTable 
        title="รายการคัดกรอง" 
        tabs={tabs}
      />

      {selectedVisit && (
        <ScreeningModal 
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onSave={onSaveScreening}
        />
      )}
    </div>
  );
}
