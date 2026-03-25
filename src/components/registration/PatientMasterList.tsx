import React from 'react';
import { Edit, Trash2, Eye, Plus } from 'lucide-react';
import { Patient } from '../../types';

interface PatientMasterListProps {
  filteredPatients: Patient[];
  displayLimit: number;
  setDisplayLimit: React.Dispatch<React.SetStateAction<number>>;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onView: (id: string) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onOpenVisit: (patient: Patient) => void;
}

export const PatientMasterList: React.FC<PatientMasterListProps> = ({
  filteredPatients,
  displayLimit,
  setDisplayLimit,
  searchTerm,
  setSearchTerm,
  onView,
  onEdit,
  onDelete,
  onOpenVisit
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="font-semibold text-gray-800">รายชื่อผู้ป่วยที่ลงทะเบียนแล้ว</h3>
        <div className="relative w-full max-w-xs">
          <input 
            type="text" 
            placeholder="ค้นหา HN, ชื่อ, เลขบัตร..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-white text-gray-600 border-b border-gray-200">
              <th className="p-4 font-medium">HN</th>
              <th className="p-4 font-medium">ชื่อ-นามสกุล</th>
              <th className="p-4 font-medium">เลขบัตรประชาชน</th>
              <th className="p-4 font-medium text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">ไม่พบข้อมูลผู้ป่วย</td>
              </tr>
            ) : (
              filteredPatients.slice(0, displayLimit).map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-blue-600">{p.hn}</td>
                  <td className="p-4">{p.name}</td>
                  <td className="p-4 text-gray-500">{p.citizenId || p.passportNo || '-'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onView(p.id)} 
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="ดูรายละเอียดผู้ป่วย"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => onEdit(p)} 
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => onDelete(p)} 
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="ลบข้อมูล"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        onClick={() => onOpenVisit(p)} 
                        className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md shadow-sm"
                      >
                        เปิด Visit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filteredPatients.length > displayLimit && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
          <button 
            onClick={() => setDisplayLimit(prev => prev + 5)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 mx-auto"
          >
            <Plus size={16} />
            แสดงเพิ่มเติม (อีก 5 รายการ)
          </button>
        </div>
      )}
    </div>
  );
};
