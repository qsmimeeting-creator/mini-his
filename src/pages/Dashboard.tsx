import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { Vaccine } from '../types';
import { VaccineTable } from '../components/vaccine/VaccineTable';
import { VaccineModal } from '../components/vaccine/VaccineModal';

export default function Dashboard() {
  const { vaccines, addVaccine, updateVaccine, deleteVaccine, setModalConfig } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<Vaccine | null>(null);
  
  const handleOpenModal = (vaccine?: Vaccine) => {
    setEditingVaccine(vaccine || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVaccine(null);
  };

  const handleSubmit = async (formData: any) => {
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
      
      <VaccineTable 
        vaccines={vaccines}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        onAdd={() => handleOpenModal()}
      />

      <VaccineModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingVaccine={editingVaccine}
      />
    </div>
  );
}
