import React from 'react';
import { X } from 'lucide-react';
import { Patient } from '../../types';

interface EditPatientModalProps {
  editingPatient: Patient;
  editForm: Partial<Patient>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<Patient>>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  editingPatient,
  editForm,
  setEditForm,
  onClose,
  onSubmit
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">แก้ไขข้อมูลผู้ป่วย</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">คำนำหน้า</label>
              <select 
                value={editForm.title}
                onChange={e => setEditForm({...editForm, title: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
                <option value="เด็กชาย">เด็กชาย</option>
                <option value="เด็กหญิง">เด็กหญิง</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
              <input 
                value={editForm.firstName}
                onChange={e => setEditForm({...editForm, firstName: e.target.value})}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
              <input 
                value={editForm.lastName}
                onChange={e => setEditForm({...editForm, lastName: e.target.value})}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เพศ</label>
              <select 
                value={editForm.gender}
                onChange={e => setEditForm({...editForm, gender: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัวประชาชน</label>
              <input 
                value={editForm.cid}
                onChange={e => setEditForm({...editForm, cid: e.target.value})}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วัน/เดือน/ปีเกิด</label>
              <input 
                type="date"
                value={editForm.dob}
                onChange={e => setEditForm({...editForm, dob: e.target.value})}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
              <input 
                value={editForm.phone}
                onChange={e => setEditForm({...editForm, phone: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <input 
                type="email"
                value={editForm.email}
                onChange={e => setEditForm({...editForm, email: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ประวัติการแพ้ยา</label>
            <textarea 
              value={editForm.allergies}
              onChange={e => setEditForm({...editForm, allergies: e.target.value})}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
