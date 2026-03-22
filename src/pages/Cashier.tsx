import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { QueueTable, QueueTab } from '../components/common/QueueTable';
import { Visit } from '../types';
import { CashierModal } from '../components/common/CashierModal';
import { CheckCircle2, Receipt } from 'lucide-react';

export default function Cashier() {
  const { updateVisitStatus, setModalConfig } = useAppContext();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const handleCallQueue = async (visit: Visit) => {
    await updateVisitStatus(visit.id, 'PAYMENT_IN_PROGRESS');
    setSelectedVisit(visit);
  };

  const handlePaymentComplete = async (visit: Visit, paymentData: any) => {
    try {
      await updateVisitStatus(visit.id, 'DISPENSE_PENDING', { 
        ...paymentData,
        paidAt: new Date().toISOString()
      });
      
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'ชำระเงินสำเร็จ',
        message: `รับชำระเงินสำหรับ ${visit.patientName} เรียบร้อยแล้ว\nส่งต่อไปยังจุดจ่ายยาและฉีดวัคซีน`
      });
      setSelectedVisit(null);
    } catch (error) {
      console.error(error);
    }
  };

  const renderOrderInfo = (v: Visit) => {
    const orders = v.data?.orders || [];
    const totalPrice = orders.reduce((sum: number, o: any) => sum + o.price, 0);
    return (
      <div className="flex flex-col">
        <div className="font-medium text-gray-800 text-sm truncate max-w-[200px]">
          {orders.map((o: any) => o.name).join(', ')}
        </div>
        <div className="text-red-600 font-bold mt-1 text-sm flex items-center gap-1">
          <Receipt size={14} />
          ยอดรวม: ฿{totalPrice.toLocaleString()}
        </div>
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
      onAction: (v) => setSelectedVisit(v)
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
            <div className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 size={12} />
              ชำระแล้ว: ฿{totalPrice.toLocaleString()}
            </div>
            <div className="text-[10px] italic">เวลา: {new Date(v.data?.paidAt).toLocaleTimeString('th-TH')}</div>
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

      {selectedVisit && (
        <CashierModal 
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onConfirm={(paymentData) => handlePaymentComplete(selectedVisit, paymentData)}
        />
      )}
    </div>
  );
}
