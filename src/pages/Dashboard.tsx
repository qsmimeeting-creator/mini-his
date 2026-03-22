import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { Vaccine } from '../types';

export default function Dashboard() {
  const { vaccines, addVaccine, updateVaccine, deleteVaccine, setModalConfig } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<Vaccine | null>(null);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    lot: '',
    stock: 0,
    price: 0
  });

  const handleOpenModal = (vaccine?: Vaccine) => {
    if (vaccine) {
      setEditingVaccine(vaccine);
      setFormData({
        id: vaccine.id,
        name: vaccine.name,
        lot: vaccine.lot,
        stock: vaccine.stock,
        price: vaccine.price
      });
    } else {
      setEditingVaccine(null);
      setFormData({
        id: `V${Date.now().toString().slice(-4)}`,
        name: '',
        lot: '',
        stock: 0,
        price: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVaccine(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVaccine) {
        await updateVaccine(editingVaccine.id, formData);
      } else {
        await addVaccine(formData);
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = (id: string) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'ยืนยันการลบ',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบวัคซีนนี้ออกจากคลัง?',
      onConfirm: () => deleteVaccine(id)
    });
  };

  return (
    <div className="space-y-6">
      <SectionTitle title="จัดการคลังวัคซีน" subtitle="เพิ่ม ลบ หรือแก้ไขข้อมูลวัคซีนในระบบ" />
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-semibold text-gray-800">รายการวัคซีนทั้งหมด</h3>
          <button 
            onClick={() => handleOpenModal()}
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
                          onClick={() => handleOpenModal(v)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="แก้ไข"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(v.id)}
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

      {/* Vaccine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{editingVaccine ? 'แก้ไขข้อมูลวัคซีน' : 'เพิ่มวัคซีนใหม่'}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
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
                  onClick={handleCloseModal}
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
      )}
    </div>
  );
}
