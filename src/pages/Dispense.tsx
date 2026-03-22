import React, { useState } from 'react';
import { CheckCircle, CheckCircle2, Package, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { QueueTable, QueueTab } from '../components/common/QueueTable';
import { Visit } from '../types';
import { DispenseModal } from '../components/common/DispenseModal';

export default function Dispense() {
  const { vaccines, updateVisitStatus, updateVaccineStock, setModalConfig } = useAppContext();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const handleCallQueue = async (visit: Visit) => {
    await updateVisitStatus(visit.id, 'DISPENSE_IN_PROGRESS');
    setSelectedVisit(visit);
  };

  const handleDispenseConfirm = async (visit: Visit, dispenseData: any) => {
    try {
      const orders = visit.data?.orders || [];
      
      // Update stock for each vaccine
      orders.forEach((o: any) => {
        const v = vaccines.find(vac => vac.id === o.id);
        if (v) {
          updateVaccineStock(v.id, v.stock - 1);
        }
      });

      await updateVisitStatus(visit.id, 'INJECTION_PENDING', dispenseData);
      
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'จัดเตรียมสำเร็จ',
        message: `จัดเตรียมวัคซีนสำหรับ ${visit.patientName} เรียบร้อยแล้ว\nส่งต่อไปยังจุดฉีดวัคซีน`
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
        <div className="font-medium text-gray-900 text-sm truncate max-w-[200px]">
          {orders.map((o: any) => o.name).join(', ')}
        </div>
        <div className="text-xs text-green-600 mt-1 flex items-center gap-1 font-medium bg-green-50 px-2 py-0.5 rounded-md w-fit border border-green-200">
          <CheckCircle size={12}/> ชำระเงินเรียบร้อย
        </div>
      </div>
    );
  };

  const tabs: QueueTab[] = [
    {
      id: 'waiting',
      label: 'รอเรียกคิว',
      filter: (v) => v.status === 'DISPENSE_PENDING',
      renderExtraColumn: renderOrderInfo,
      actionLabel: 'เรียกคิว',
      onAction: handleCallQueue
    },
    {
      id: 'in_progress',
      label: 'กำลังดำเนินการ',
      filter: (v) => v.status === 'DISPENSE_IN_PROGRESS',
      renderExtraColumn: renderOrderInfo,
      actionLabel: 'จัดวัคซีน & ตัดสต็อก',
      onAction: (v) => setSelectedVisit(v)
    },
    {
      id: 'completed',
      label: 'คิวที่เสร็จสิ้น',
      filter: (v) => !!v.data?.dispensedAt,
      renderExtraColumn: (v) => {
        const orders = v.data?.orders || [];
        return (
          <div className="text-xs text-gray-500">
            <div className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 size={12} />
              จัดเตรียมแล้ว
            </div>
            <div className="text-[10px] italic">Lot: {v.data?.dispensedLots}</div>
            <div className="text-[10px] italic">เวลา: {new Date(v.data?.dispensedAt).toLocaleTimeString('th-TH')}</div>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SectionTitle title="ห้องจ่ายยา / คลัง" subtitle="จัดเตรียมวัคซีนและตัดสต็อก" />
      <QueueTable 
        title="รายการจัดเตรียมวัคซีน" 
        tabs={tabs}
      />

      {selectedVisit && (
        <DispenseModal 
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onConfirm={(dispenseData) => handleDispenseConfirm(selectedVisit, dispenseData)}
        />
      )}
    </div>
  );
}
