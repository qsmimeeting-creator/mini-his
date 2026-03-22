import React from 'react';
import { Edit, Trash2, Plus, Package, AlertCircle, Calendar } from 'lucide-react';
import { Vaccine } from '../../types';

interface VaccineTableProps {
  vaccines: Vaccine[];
  onEdit: (vaccine: Vaccine) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export const VaccineTable: React.FC<VaccineTableProps> = ({ vaccines, onEdit, onDelete, onAdd }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-6 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Package size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">รายการวัคซีนในคลัง</h3>
            <p className="text-xs text-gray-500">จัดการข้อมูลและจำนวนคงเหลือของวัคซีน</p>
          </div>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={18} />
          เพิ่มวัคซีนใหม่
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-400 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
              <th className="p-4 pl-6">ชื่อวัคซีน / ชื่อสามัญ</th>
              <th className="p-4">ผู้ผลิต / ประเภท</th>
              <th className="p-4">Lot No. / วันหมดอายุ</th>
              <th className="p-4">คงเหลือ / จุดสั่งซื้อ</th>
              <th className="p-4">ราคาขาย (บาท)</th>
              <th className="p-4 pr-6 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vaccines.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Package size={40} className="opacity-20" />
                    <p>ไม่มีข้อมูลวัคซีนในระบบ</p>
                  </div>
                </td>
              </tr>
            ) : (
              vaccines.map((v) => (
                <tr key={v.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{v.name}</div>
                    <div className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{v.genericName || 'N/A'}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-gray-700 font-medium">{v.manufacturer || '-'}</div>
                    <div className="text-[10px] text-gray-400">{v.type || '-'}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded inline-block mb-1">{v.lot}</div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <Calendar size={10} />
                      {v.expiryDate ? new Date(v.expiryDate).toLocaleDateString('th-TH') : '-'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold w-fit ${
                        v.stock <= (v.reorderLevel || 10) ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {v.stock} {v.unit || 'Dose'}
                      </span>
                      {v.stock <= (v.reorderLevel || 10) && (
                        <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold">
                          <AlertCircle size={10} />
                          ควรสั่งเพิ่ม (Min: {v.reorderLevel || 10})
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-blue-600 text-base">฿{v.price.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 italic">ทุน: ฿{v.unitCost?.toLocaleString() || '-'}</div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(v)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                        title="แก้ไข"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(v.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                        title="ลบ"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
