import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { QueueTable, QueueTab } from '../components/common/QueueTable';
import { Visit } from '../types';

export default function Cashier() {
  const { updateVisitStatus, setModalConfig } = useAppContext();

  const handleCallQueue = async (visit: Visit) => {
    await updateVisitStatus(visit.id, 'PAYMENT_IN_PROGRESS');
    handlePayment(visit);
  };

  const handlePayment = (visit: Visit) => {
    const orders = visit.data?.orders || [];
    const totalPrice = orders.reduce((sum: number, o: any) => sum + o.price, 0);

    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'ยืนยันการรับชำระเงิน',
      message: `ยืนยันการรับชำระเงิน ยอดรวม ${totalPrice.toLocaleString()} บาท?`,
      onConfirm: () => {
        updateVisitStatus(visit.id, 'DISPENSE_PENDING', { paidAt: new Date().toLocaleTimeString('th-TH') });
      }
    });
  };

  const renderOrderInfo = (v: Visit) => {
    const orders = v.data?.orders || [];
    const totalPrice = orders.reduce((sum: number, o: any) => sum + o.price, 0);
    return (
      <div>
        <div className="font-medium text-gray-800">{orders.map((o: any) => o.name).join(', ')}</div>
        <div className="text-red-600 font-bold mt-1 text-sm">ยอดรวม: ฿{totalPrice.toLocaleString()}</div>
      </div>
    );
  };

  const tabs: QueueTab[] = [
    {
      id: 'waiting',
      label: 'รอเรียกคิว',
      filter: (v) => v.status === 'PAYMENT_PENDING',
      renderExtraColumn: renderOrderInfo,
      actionLabel: 'เรียกคิว',
      onAction: handleCallQueue
    },
    {
      id: 'in_progress',
      label: 'กำลังดำเนินการ',
      filter: (v) => v.status === 'PAYMENT_IN_PROGRESS',
      renderExtraColumn: renderOrderInfo,
      actionLabel: 'รับชำระเงิน',
      onAction: handlePayment
    },
    {
      id: 'completed',
      label: 'คิวที่เสร็จสิ้น',
      filter: (v) => !!v.data?.paidAt,
      renderExtraColumn: (v) => {
        const orders = v.data?.orders || [];
        const totalPrice = orders.reduce((sum: number, o: any) => sum + o.price, 0);
        return (
          <div className="text-xs text-gray-500">
            <div>ยอดชำระ: ฿{totalPrice.toLocaleString()}</div>
            <div>เวลา: {v.data?.paidAt}</div>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SectionTitle title="การเงิน" subtitle="ตรวจสอบรายการและรับชำระเงิน" />
      <QueueTable 
        title="รายการชำระเงิน" 
        tabs={tabs}
      />
    </div>
  );
}
