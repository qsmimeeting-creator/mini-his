import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Patient } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface HealthInfoModalProps {
  patient: Patient;
  onClose: () => void;
}

export const HealthInfoModal: React.FC<HealthInfoModalProps> = ({ patient, onClose }) => {
  const { updatePatient, setModalConfig } = useAppContext();
  const [formData, setFormData] = useState({
    drugAllergy: patient.drugAllergy || '',
    foodAllergy: patient.foodAllergy || '',
    vaccineAllergy: patient.vaccineAllergy || '',
    underlyingDisease: patient.underlyingDisease || '',
    currentMedication: patient.currentMedication || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updatePatient(patient.id, formData);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'บันทึกสำเร็จ',
        message: 'อัปเดตข้อมูลสุขภาพเรียบร้อยแล้ว'
      });
      onClose();
    } catch (error) {
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถบันทึกข้อมูลได้'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg shadow-sm">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-red-800">แก้ไขข้อมูลสุขภาพ / การแพ้</h3>
              <p className="text-sm text-red-600">{patient.firstName} {patient.lastName} (HN: {patient.hn})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-red-400 hover:text-red-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="health-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">ประวัติแพ้ยา</label>
              <input 
                type="text"
                value={formData.drugAllergy}
                onChange={e => setFormData({...formData, drugAllergy: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="ระบุประวัติแพ้ยา (ถ้ามี)"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">ประวัติแพ้อาหาร</label>
              <input 
                type="text"
                value={formData.foodAllergy}
                onChange={e => setFormData({...formData, foodAllergy: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="ระบุประวัติแพ้อาหาร (ถ้ามี)"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">ประวัติแพ้วัคซีน</label>
              <input 
                type="text"
                value={formData.vaccineAllergy}
                onChange={e => setFormData({...formData, vaccineAllergy: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="ระบุประวัติแพ้วัคซีน (ถ้ามี)"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">โรคประจำตัว</label>
              <input 
                type="text"
                value={formData.underlyingDisease}
                onChange={e => setFormData({...formData, underlyingDisease: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="ระบุโรคประจำตัว (ถ้ามี)"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">ยาที่ใช้ประจำ</label>
              <input 
                type="text"
                value={formData.currentMedication}
                onChange={e => setFormData({...formData, currentMedication: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="ระบุยาที่ใช้ประจำ (ถ้ามี)"
              />
            </div>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            type="submit"
            form="health-form"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </div>
    </div>
  );
};
