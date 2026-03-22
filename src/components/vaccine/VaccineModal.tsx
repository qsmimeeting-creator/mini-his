import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Vaccine } from '../../types';

interface VaccineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  editingVaccine: Vaccine | null;
}

export const VaccineModal: React.FC<VaccineModalProps> = ({ isOpen, onClose, onSubmit, editingVaccine }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    lot: '',
    stock: 0,
    price: 0
  });

  useEffect(() => {
    if (editingVaccine) {
      setFormData({
        id: editingVaccine.id,
        name: editingVaccine.name,
        lot: editingVaccine.lot,
        stock: editingVaccine.stock,
        price: editingVaccine.price
      });
    } else {
      setFormData({
        id: `V${Date.now().toString().slice(-4)}`,
        name: '',
        lot: '',
        stock: 0,
        price: 0
      });
    }
  }, [editingVaccine, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">{editingVaccine ? 'แก้ไขข้อมูลวัคซีน' : 'เพิ่มวัคซีนใหม่'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ชื่อวัคซีน</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="เช่น Influenza (4-strain)"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">รหัสวัคซีน</label>
              <input 
                type="text" 
                required
                disabled={!!editingVaccine}
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lot Number</label>
              <input 
                type="text" 
                required
                value={formData.lot}
                onChange={(e) => setFormData({...formData, lot: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="LOT-XXX-XXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">จำนวนคงเหลือ</label>
              <input 
                type="number" 
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ราคา (บาท)</label>
              <input 
                type="number" 
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
