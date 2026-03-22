import React from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { Vaccine } from '../../types';

interface VaccineTableProps {
  vaccines: Vaccine[];
  onEdit: (vaccine: Vaccine) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export const VaccineTable: React.FC<VaccineTableProps> = ({ vaccines, onEdit, onDelete, onAdd }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-semibold text-gray-800">รายการวัคซีนทั้งหมด</h3>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          เพิ่มวัคซีนใหม่
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <th className="p-4 font-medium">รหัส/ชื่อวัคซีน</th>
              <th className="p-4 font-medium">Lot No.</th>
              <th className="p-4 font-medium">คงเหลือ</th>
              <th className="p-4 font-medium">ราคา (บาท)</th>
              <th className="p-4 font-medium text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {vaccines.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">ไม่มีข้อมูลวัคซีนในระบบ</td>
              </tr>
            ) : (
              vaccines.map((v) => (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{v.name}</div>
                    <div className="text-xs text-gray-500">{v.id}</div>
                  </td>
                  <td className="p-4 text-gray-600 font-mono">{v.lot}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${v.stock < 30 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {v.stock} Dose
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{v.price.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onEdit(v)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="แก้ไข"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(v.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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
