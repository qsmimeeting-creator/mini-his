import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { QueueTable, QueueTab } from '../components/common/QueueTable';
import { Visit } from '../types';
import { VaccineInjectionModal } from '../components/common/VaccineInjectionModal';
import { formatDoseNumber, getInjectionOrderKey, getPendingInjectionOrders, omitUndefinedFields } from '../utils/orderWorkflow';

export default function Injection() {
  const { updateVisitStatus, setModalConfig, activeVisitId, setActiveVisitId, visits } = useAppContext();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  // Handle active visit from navigation
  React.useEffect(() => {
    if (activeVisitId) {
      const visit = visits.find(v => v.id === activeVisitId);
      if (visit && (visit.status === 'INJECTION_PENDING' || visit.status === 'INJECTION_IN_PROGRESS')) {
        setSelectedVisit(visit);
      }
      setActiveVisitId(null); // Clear it after use
    }
  }, [activeVisitId, visits, setActiveVisitId]);

  const handleCallQueue = async (visit: Visit) => {
    try {
      await updateVisitStatus(visit.id, 'INJECTION_IN_PROGRESS');
      setSelectedVisit(visit);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInjection = (visit: Visit) => {
    setSelectedVisit(visit);
  };

  const onSaveInjection = async (data: any) => {
    if (selectedVisit) {
      try {
        const existingRecords = Array.isArray(selectedVisit.data?.injectionRecords) ? selectedVisit.data.injectionRecords : [];
        const newRecords = Array.isArray(data?.injectionRecords) ? data.injectionRecords : [];
        if (newRecords.length === 0) {
          setModalConfig({
            isOpen: true,
            type: 'alert',
            title: 'ไม่มีรายการใหม่',
            message: 'ไม่มีรายการวัคซีนใหม่ที่ต้องบันทึกฉีด'
          });
          return;
        }

        const existingKeys = new Set(existingRecords.map((record: any, index: number) => getInjectionOrderKey(record, index)));
        const uniqueNewRecords = newRecords.filter((record: any, index: number) => {
          const key = getInjectionOrderKey(record, existingRecords.length + index);
          if (existingKeys.has(key)) return false;
          existingKeys.add(key);
          return true;
        });

        if (uniqueNewRecords.length === 0) {
          setModalConfig({
            isOpen: true,
            type: 'alert',
            title: 'บันทึกแล้ว',
            message: 'รายการวัคซีนชุดนี้ถูกบันทึกฉีดไว้แล้ว'
          });
          return;
        }

        await updateVisitStatus(selectedVisit.id, 'COMPLETED', omitUndefinedFields({
          ...data,
          injectionRecords: [...existingRecords, ...uniqueNewRecords],
          injectedAt: data?.injectedAt || new Date().toISOString(),
        }));
      
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'ฉีดวัคซีนสำเร็จ',
        message: (
          <div className="space-y-3 mt-2">
            <p className="text-gray-700 text-base">บันทึกการฉีดวัคซีนสำหรับ <span className="font-bold text-blue-700">{selectedVisit.patientName}</span> เรียบร้อยแล้ว</p>
          </div>
        )
      });
      
        setSelectedVisit(null);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const renderVaccineInfo = (v: Visit) => {
    const orders = getPendingInjectionOrders(v);
    return (
      <div className="bg-blue-50 p-2.5 rounded-md border border-blue-100">
        <div className="font-medium text-blue-800 text-sm">
          {orders.map((o: any) => `${o.name}${(o.doseNumber || o.doseLabel) ? ` (${formatDoseNumber(o.doseNumber, o.doseLabel)})` : ''}`).join(', ') || 'ไม่มีรายการวัคซีนใหม่ที่ต้องบันทึกฉีด'}
        </div>
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
                  {(record.doseNumber || record.doseLabel) && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{formatDoseNumber(record.doseNumber, record.doseLabel)}</span>}
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
