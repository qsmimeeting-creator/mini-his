import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { QueueTable, QueueTab } from '../components/common/QueueTable';
import { Visit } from '../types';
import { CashierModal } from '../components/common/CashierModal';
import { CheckCircle2, Receipt } from 'lucide-react';
import { getOrderKey, getOrderLineTotal, getOrderQuantity, getUnpaidOrders, isOrderPaid, omitUndefinedFields } from '../utils/orderWorkflow';

export default function Cashier() {
  const { updateVisitStatus, setModalConfig, activeVisitId, setActiveVisitId, visits } = useAppContext();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  // Handle active visit from navigation
  React.useEffect(() => {
    if (activeVisitId) {
      const visit = visits.find(v => v.id === activeVisitId);
      if (visit && (visit.status === 'PAYMENT_PENDING' || visit.status === 'PAYMENT_IN_PROGRESS')) {
        setSelectedVisit(visit);
      }
      setActiveVisitId(null); // Clear it after use
    }
  }, [activeVisitId, visits, setActiveVisitId]);

  const handleCallQueue = async (visit: Visit) => {
    try {
      await updateVisitStatus(visit.id, 'PAYMENT_IN_PROGRESS');
      setSelectedVisit(visit);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePaymentComplete = async (visit: Visit, paymentData: any) => {
    try {
      const paidAt = new Date().toISOString();
      const pendingOrders = getUnpaidOrders(visit);
      if (pendingOrders.length === 0) {
        setModalConfig({
          isOpen: true,
          type: 'alert',
          title: 'ไม่มีรายการค้างชำระ',
          message: 'Visit นี้ไม่มีรายการวัคซีนที่ต้องชำระเพิ่ม'
        });
        setSelectedVisit(null);
        return;
      }

      const paymentRecordId = `PAY-${Date.now()}`;
      const pendingOrderIds = new Set(pendingOrders.map((order: any, index: number) => getOrderKey(order, index)));
      const orders = (visit.data?.orders || []).map((order: any, index: number) => {
        const orderKey = getOrderKey(order, index);
        if (pendingOrderIds.has(orderKey)) {
          return omitUndefinedFields({
            ...order,
            orderId: orderKey,
            paymentStatus: 'paid',
            paymentRecordId,
          });
        }
        if (isOrderPaid(order, visit)) {
          return omitUndefinedFields({
            ...order,
            orderId: orderKey,
            paymentStatus: 'paid',
          });
        }
        return omitUndefinedFields(order);
      });
      const paymentRecord = {
        id: paymentRecordId,
        paidAt,
        paymentMethod: paymentData.paymentMethod,
        receivedAmount: paymentData.receivedAmount,
        change: paymentData.change,
        totalAmount: paymentData.totalAmount,
        orderIds: Array.from(pendingOrderIds),
      };

      await updateVisitStatus(visit.id, 'DISPENSE_PENDING', { 
        ...paymentData,
        orders,
        paymentRecords: [...(visit.data?.paymentRecords || []), paymentRecord],
        paidAt
      });
      
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'ชำระเงินสำเร็จ',
        message: (
          <div className="space-y-3 mt-2">
            <p className="text-gray-700 text-base">รับชำระเงินสำหรับ <span className="font-bold text-blue-700">{visit.patientName}</span> เรียบร้อยแล้ว</p>
          </div>
        )
      });
      setSelectedVisit(null);
    } catch (error) {
      console.error(error);
    }
  };

  const renderOrderInfo = (v: Visit) => {
    const orders = getUnpaidOrders(v);
    const totalPrice = orders.reduce((sum: number, o: any) => sum + getOrderLineTotal(o), 0);
    return (
      <div className="flex flex-col">
        <div className="font-medium text-gray-800 text-sm truncate max-w-[200px]">
          {orders.map((o: any) => `${o.name}${getOrderQuantity(o) > 1 ? ` x${getOrderQuantity(o)}` : ''}`).join(', ') || 'ไม่มีรายการค้างชำระ'}
        </div>
        <div className="text-red-600 font-bold mt-1 text-sm flex items-center gap-1">
          <Receipt size={14} />
          ยอดค้างชำระ: ฿{totalPrice.toLocaleString()}
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
      filter: (v) => !!v.data?.paidAt && v.status !== 'PAYMENT_PENDING' && v.status !== 'PAYMENT_IN_PROGRESS',
      renderExtraColumn: (v) => {
        const latestPayment = v.data?.paymentRecords?.[v.data.paymentRecords.length - 1];
        const totalPrice = latestPayment?.totalAmount ?? v.data?.totalAmount ?? 0;
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
