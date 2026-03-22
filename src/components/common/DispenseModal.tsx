import React from 'react';
import { X, Package, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Visit } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { PatientSummaryBar } from './PatientSummaryBar';

interface DispenseModalProps {
  visit: Visit;
  onClose: () => void;
  onConfirm: (dispenseData: any) => void;
}

export const DispenseModal: React.FC<DispenseModalProps> = ({ visit, onClose, onConfirm }) => {
  const { patients, vaccines } = useAppContext();
  const patient = patients.find(p => p.id === visit.patientId);
  const orders = visit.data?.orders || [];

  const dispenseItems = orders.map((order: any) => {
    const vaccine = vaccines.find(v => v.id === order.id);
    return {
      ...order,
      stock: vaccine?.stock || 0,
      lot: vaccine?.lot || '-',
      expiryDate: vaccine?.expiryDate || '-',
      isOutOfStock: !vaccine || vaccine.stock <= 0
    };
  });

  const hasOutOfStock = dispenseItems.some(item => item.isOutOfStock);

  const handleConfirm = () => {
    if (hasOutOfStock) return;
    
    onConfirm({
      dispensedLots: dispenseItems.map(i => i.lot).join(', '),
      dispensedAt: new Date().toISOString(),
      items: dispenseItems.map(i => ({
        id: i.id,
        name: i.name,
        lot: i.lot
      }))
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-xl text-gray-800">จัดเตรียมวัคซีน (Dispensing)</h3>
            <p className="text-sm text-gray-500">VN: {visit.vn} | คิวที่: {visit.queueNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {patient && <PatientSummaryBar patient={patient} visit={visit} />}

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100 pb-2">
              <Package size={18} />
              <span>รายการวัคซีนที่ต้องจัดเตรียม</span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3 text-left">ชื่อวัคซีน</th>
                    <th className="px-4 py-3 text-center">Lot Number</th>
                    <th className="px-4 py-3 text-center">วันหมดอายุ</th>
                    <th className="px-4 py-3 text-center">คงเหลือในคลัง</th>
                    <th className="px-4 py-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dispenseItems.map((item, idx) => (
                    <tr key={idx} className={item.isOutOfStock ? 'bg-red-50' : ''}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase">{item.genericName || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-blue-600 font-bold">{item.lot}</td>
                      <td className="px-4 py-4 text-center text-gray-600">{item.expiryDate}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`font-bold ${item.stock < 10 ? 'text-red-600' : 'text-gray-700'}`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                            <AlertTriangle size={10} /> สินค้าหมด
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            <CheckCircle2 size={10} /> พร้อมจัด
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasOutOfStock && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start">
                <AlertTriangle className="text-red-600 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-red-800">ไม่สามารถดำเนินการได้</p>
                  <p className="text-xs text-red-700">มีวัคซีนบางรายการที่สต็อกไม่เพียงพอ กรุณาตรวจสอบคลังสินค้าหรือแจ้งแพทย์เพื่อเปลี่ยนรายการ</p>
                </div>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
              <Info className="text-blue-600 shrink-0" size={20} />
              <div className="text-xs text-blue-800 space-y-1">
                <p className="font-bold">คำแนะนำการจัดเตรียม:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>ตรวจสอบชื่อวัคซีนและ Lot Number ให้ตรงกับระบบ</li>
                  <li>ตรวจสอบวันหมดอายุ (Expiry Date) ก่อนนำจ่ายทุกครั้ง</li>
                  <li>รักษาอุณหภูมิของวัคซีนตามมาตรฐาน (Cold Chain)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            onClick={handleConfirm}
            disabled={hasOutOfStock}
            className="px-10 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Package size={18} />
            ยืนยันการจัดยาและตัดสต็อก
          </button>
        </div>
      </div>
    </div>
  );
};
