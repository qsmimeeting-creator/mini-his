import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { QueueTable, QueueTab } from '../components/common/QueueTable';
import { Visit } from '../types';
import { VaccineInjectionModal } from '../components/common/VaccineInjectionModal';

export default function Injection() {
  const { updateVisitStatus } = useAppContext();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const handleCallQueue = async (visit: Visit) => {
    await updateVisitStatus(visit.id, 'INJECTION_IN_PROGRESS');
    setSelectedVisit(visit);
  };

  const handleInjection = (visit: Visit) => {
    setSelectedVisit(visit);
  };

  const onSaveInjection = async (data: any) => {
    if (selectedVisit) {
      await updateVisitStatus(selectedVisit.id, 'COMPLETED', data);
      setSelectedVisit(null);
    }
  };

  const renderVaccineInfo = (v: Visit) => {
    const orders = v.data?.orders || [];
    return (
      <div className="bg-blue-50 p-2.5 rounded-md border border-blue-100">
        <div className="font-medium text-blue-800 text-sm">{orders.map((o: any) => o.name).join(', ')}</div>
        <div className="text-xs text-blue-600 font-mono mt-1 bg-white px-1.5 py-0.5 rounded border border-blue-100 inline-block">Lot: {v.data?.dispensedLots}</div>
      </div>
    );
  };

  const tabs: QueueTab[] = [
    {
      id: 'waiting',
      label: 'รอเรียกคิว',
      filter: (v) => v.status === 'INJECTION_PENDING',
      renderExtraColumn: renderVaccineInfo,
      actionLabel: 'เรียกคิว',
      onAction: handleCallQueue
    },
    {
      id: 'in_progress',
      label: 'กำลังดำเนินการ',
      filter: (v) => v.status === 'INJECTION_IN_PROGRESS',
      renderExtraColumn: renderVaccineInfo,
      actionLabel: 'บันทึกฉีด (เสร็จสิ้น)',
      onAction: handleInjection
    },
    {
      id: 'completed',
      label: 'คิวที่เสร็จสิ้น',
      filter: (v) => v.status === 'COMPLETED',
      renderExtraColumn: (v) => {
        const records = v.data?.injectionRecords || [];
        return (
          <div className="text-xs text-gray-500 space-y-2">
            {records.map((record: any, idx: number) => (
              <div key={idx} className="border-l-2 border-emerald-500 pl-2 py-0.5">
                <div className="font-medium text-emerald-700">{record.vaccineName}</div>
                <div className="flex gap-2 text-[10px] mt-0.5">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Route: {record.route}</span>
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Site: {record.site}</span>
                </div>
              </div>
            ))}
            <div className="text-[10px] text-gray-400 italic pt-1">เวลาฉีด: {new Date(v.data?.injectedAt).toLocaleTimeString('th-TH')}</div>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SectionTitle title="ห้องฉีดยา" subtitle="บริหารวัคซีนและปิดรายการ (Close Visit)" />
      <QueueTable 
        title="รายการฉีดวัคซีน" 
        tabs={tabs}
      />

      {selectedVisit && (
        <VaccineInjectionModal 
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onSave={onSaveInjection}
        />
      )}
    </div>
  );
}
