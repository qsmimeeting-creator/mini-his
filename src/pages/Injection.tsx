import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { QueueTable, QueueTab } from '../components/common/QueueTable';
import { Visit } from '../types';

export default function Injection() {
  const { updateVisitStatus, setModalConfig } = useAppContext();

  const handleCallQueue = async (visit: Visit) => {
    await updateVisitStatus(visit.id, 'INJECTION_IN_PROGRESS');
    handleInjection(visit);
  };

  const handleInjection = (visit: Visit) => {
    const orders = visit.data?.orders || [];
    const orderNames = orders.map((o: any) => o.name).join(', ');

    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'ยืนยันการบริหารวัคซีน',
      message: `ยืนยันว่าได้ทำการฉีดวัคซีน:\n${orderNames}\nLot: ${visit.data?.dispensedLots} ให้ผู้ป่วยแล้ว?`,
      onConfirm: () => {
        updateVisitStatus(visit.id, 'COMPLETED', { injectedAt: new Date().toLocaleTimeString('th-TH') });
      }
    });
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
        const orders = v.data?.orders || [];
        return (
          <div className="text-xs text-gray-500">
            <div className="font-medium text-emerald-700">{orders.map((o: any) => o.name).join(', ')}</div>
            <div className="font-mono">Lot: {v.data?.dispensedLots}</div>
            <div>เวลาฉีด: {v.data?.injectedAt}</div>
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
    </div>
  );
}
