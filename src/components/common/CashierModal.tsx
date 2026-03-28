import React, { useState } from 'react';
import { X, CreditCard, Receipt, CheckCircle2, Wallet } from 'lucide-react';
import { Visit, VisitStatus } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { PatientSummaryBar } from './PatientSummaryBar';

interface CashierModalProps {
  visit: Visit;
  onClose: () => void;
  onConfirm: (paymentData: any, nextStatus: VisitStatus) => void;
}

export const CashierModal: React.FC<CashierModalProps> = ({ visit, onClose, onConfirm }) => {
  const { patients } = useAppContext();
  const patient = patients.find(p => p.id === visit.patientId);
  const orders = visit.data?.orders || [];
  const totalAmount = orders.reduce((sum: number, o: any) => sum + o.price, 0);

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const nextStatus: VisitStatus = 'DISPENSE_PENDING';

  const change = parseFloat(receivedAmount) - totalAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      paymentMethod,
      totalAmount,
      receivedAmount: parseFloat(receivedAmount),
      change: change > 0 ? change : 0,
      paidAt: new Date().toISOString()
    }, nextStatus);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-xl text-gray-800">รับชำระเงิน (Payment)</h3>
            <p className="text-sm text-gray-500">VN: {visit.vn} | คิวที่: {visit.queueNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {patient && <PatientSummaryBar patient={patient} visit={visit} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Invoice Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100 pb-2">
                <Receipt size={18} />
                <span>รายละเอียดค่าใช้จ่าย</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-2 text-left">รายการ</th>
                      <th className="px-4 py-2 text-right">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-gray-700">{order.name}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">฿{order.price.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50/50 font-bold divide-y divide-blue-100">
                    <tr>
                      <td className="px-4 py-3 text-gray-600">รวมเงินทั้งสิ้น</td>
                      <td className="px-4 py-3 text-right text-blue-700 text-xl">฿{totalAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 font-medium">สิทธิการรักษา: {patient?.paymentType || 'เงินสด'}</p>
              </div>
            </div>

            {/* Right: Payment Form */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold border-b border-gray-100 pb-2">
                <CreditCard size={18} />
                <span>บันทึกการชำระเงิน</span>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">ช่องทางการชำระเงิน</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', label: 'เงินสด', icon: Wallet },
                      { id: 'transfer', label: 'โอนเงิน', icon: CheckCircle2 },
                      { id: 'card', label: 'บัตรเครดิต', icon: CreditCard }
                    ].map(method => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          paymentMethod === method.id 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-emerald-200 hover:bg-gray-50'
                        }`}
                      >
                        <method.icon size={20} className="mb-1" />
                        <span className="text-xs font-bold">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">จำนวนเงินที่รับมา (บาท)</label>
                    <input
                      type="number"
                      required
                      autoFocus
                      value={receivedAmount}
                      onChange={e => setReceivedAmount(e.target.value)}
                      className="w-full text-2xl font-bold px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-right"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                    <span className="text-gray-600 font-medium">เงินทอน</span>
                    <span className={`text-2xl font-bold ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      ฿{(change > 0 ? change : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!receivedAmount || parseFloat(receivedAmount) < totalAmount}
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  <CheckCircle2 size={24} />
                  ยืนยันการรับชำระเงิน
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
