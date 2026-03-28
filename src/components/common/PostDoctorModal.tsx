import React, { useState } from 'react';
import { X, CheckCircle2, ClipboardList, AlertCircle, Send } from 'lucide-react';
import { Visit, VisitStatus } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { PatientSummaryBar } from './PatientSummaryBar';
import { DestinationSelector } from './DestinationSelector';

interface PostDoctorModalProps {
  visit: Visit;
  onClose: () => void;
  onConfirm: (nextStatus: VisitStatus) => void;
}

export const PostDoctorModal: React.FC<PostDoctorModalProps> = ({ visit, onClose, onConfirm }) => {
  const { patients } = useAppContext();
  const patient = patients.find(p => p.id === visit.patientId);
  const orders = visit.data?.orders || [];
  const [nextStatus, setNextStatus] = useState<VisitStatus>('PAYMENT_PENDING');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-xl text-gray-800">ตรวจสอบความถูกต้อง (Post-Doctor Verification)</h3>
            <p className="text-sm text-gray-500">VN: {visit.vn} | คิวที่: {visit.queueNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {patient && <PatientSummaryBar patient={patient} visit={visit} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Order Summary */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100 pb-2">
                <ClipboardList size={18} />
                <span>รายการวัคซีนที่สั่ง</span>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-2 text-left">รายการ</th>
                      <th className="px-4 py-2 text-right">ราคา</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium text-gray-800">{order.name}</td>
                        <td className="px-4 py-3 text-right text-blue-600 font-bold">฿{order.price.toLocaleString()}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-gray-400 italic">ไม่มีรายการสั่งจ่าย</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-blue-50 font-bold">
                    <tr>
                      <td className="px-4 py-3 text-gray-700">รวมทั้งสิ้น</td>
                      <td className="px-4 py-3 text-right text-blue-700 text-lg">
                        ฿{orders.reduce((sum: number, o: any) => sum + o.price, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Right: Verification Checklist */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold border-b border-gray-100 pb-2">
                <CheckCircle2 size={18} />
                <span>รายการตรวจสอบ (Checklist)</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="mt-0.5 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} />
                  </div>
                  <p className="text-sm text-emerald-800">ตรวจสอบชื่อ-นามสกุล และ HN ของผู้ป่วยถูกต้องตรงกัน</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="mt-0.5 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} />
                  </div>
                  <p className="text-sm text-emerald-800">ตรวจสอบรายการวัคซีนที่สั่งจ่าย ถูกต้องตามแผนการรักษา</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="mt-0.5 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} />
                  </div>
                  <p className="text-sm text-emerald-800">ตรวจสอบประวัติการแพ้ และข้อควรระวังเรียบร้อยแล้ว</p>
                </div>
                
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                  <AlertCircle className="text-amber-600 shrink-0" size={24} />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>หมายเหตุ:</strong> เมื่อกดยืนยัน ข้อมูลจะถูกส่งไปยังจุดชำระเงิน (Cashier) เพื่อดำเนินการออกใบแจ้งหนี้และรับชำระเงินต่อไป
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1 w-full">
            <DestinationSelector 
              selectedDestination={nextStatus}
              onChange={setNextStatus}
            />
          </div>
          <div className="flex gap-3 shrink-0">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              onClick={() => onConfirm(nextStatus)}
              className="px-10 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors flex items-center gap-2"
            >
              <CheckCircle2 size={18} />
              ยืนยันความถูกต้อง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
