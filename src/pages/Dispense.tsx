import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { QueueTable, QueueTab } from '../components/common/QueueTable';
import { Visit } from '../types';

export default function Dispense() {
  const { vaccines, updateVisitStatus, updateVaccineStock, setModalConfig } = useAppContext();

  const handleCallQueue = async (visit: Visit) => {
    await updateVisitStatus(visit.id, 'DISPENSE_IN_PROGRESS');
    handleDispense(visit);
  };

  const handleDispense = (visit: Visit) => {
    const orders = visit.data?.orders || [];
    
    const outOfStock = orders.filter((o: any) => {
      const v = vaccines.find(vac => vac.id === o.id);
      return !v || v.stock <= 0;
    });

    if (outOfStock.length > 0) {
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'ข้อผิดพลาด: สต็อกไม่เพียงพอ',
        message: `ไม่สามารถจัดยาได้เนื่องจากสต็อกวัคซีนต่อไปนี้ในคลังหมด:\n${outOfStock.map((o: any) => o.name).join(', ')}`
      });
      return;
    }

    const orderNames = orders.map((o: any) => o.name).join(', ');
    const lots = orders.map((o: any) => {
      const v = vaccines.find(vac => vac.id === o.id);
      return v?.lot || '-';
    }).join(', ');

    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'ยืนยันการจัดยาและตัดสต็อก',
      message: `ยืนยันการตัดสต็อกวัคซีน:\n${orderNames}\nLot: ${lots}`,
      onConfirm: () => {
        orders.forEach((o: any) => {
          const v = vaccines.find(vac => vac.id === o.id);
          if (v) {
            updateVaccineStock(v.id, v.stock - 1);
          }
        });
        updateVisitStatus(visit.id, 'INJECTION_PENDING', { 
          dispensedLots: lots, 
          dispensedAt: new Date().toLocaleTimeString('th-TH') 
        });
      }
    });
  };

  const renderOrderInfo = (v: Visit) => {
    const orders = v.data?.orders || [];
    return (
      <div>
        <div className="font-medium text-gray-900">{orders.map((o: any) => o.name).join(', ')}</div>
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
      onAction: handleDispense
    },
    {
      id: 'completed',
      label: 'คิวที่เสร็จสิ้น',
      filter: (v) => !!v.data?.dispensedAt,
      renderExtraColumn: (v) => {
        const orders = v.data?.orders || [];
        return (
          <div className="text-xs text-gray-500">
            <div>วัคซีน: {orders.map((o: any) => o.name).join(', ')}</div>
            <div>Lot: {v.data?.dispensedLots}</div>
            <div>เวลา: {v.data?.dispensedAt}</div>
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
    </div>
  );
}
