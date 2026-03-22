import React, { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { Patient } from '../types';
import { PatientDetailsModal } from '../components/common/PatientDetailsModal';
import { RegistrationForm } from '../components/registration/RegistrationForm';
import { PatientMasterList } from '../components/registration/PatientMasterList';
import { EditPatientModal } from '../components/registration/EditPatientModal';

export default function Registration() {
  const { patients, registerPatient, updatePatient, deletePatient, openVisit, setModalConfig } = useAppContext();
  const [errors, setErrors] = useState<{ cid?: string; dob?: string; passport?: string }>({});
  const [activeTab, setActiveTab] = useState<'register' | 'master'>('register');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState<Partial<Patient>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(5);

  // Reset display limit when search term or tab changes
  React.useEffect(() => {
    setDisplayLimit(5);
  }, [searchTerm, activeTab]);

  const sortedPatients = [...patients].sort((a, b) => b.id.localeCompare(a.id));

  const filteredPatients = sortedPatients.filter(p => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) ||
      p.hn.toLowerCase().includes(searchLower) ||
      (p.cid && p.cid.includes(searchTerm))
    );
  });

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const title = formData.get('title') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const gender = formData.get('gender') as string;
    const citizenId = formData.get('citizenId') as string;
    const birthDate = formData.get('birthDate') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const passportNo = formData.get('passportNo') as string;
    const nationality = formData.get('nationality') as string;
    const paymentType = formData.get('paymentType') as string;
    const addressLine1 = formData.get('addressLine1') as string;
    const subDistrict = formData.get('subDistrict') as string;
    const district = formData.get('district') as string;
    const province = formData.get('province') as string;
    const postalCode = formData.get('postalCode') as string;
    const emergencyContactName = formData.get('emergencyContactName') as string;
    const emergencyContactPhone = formData.get('emergencyContactPhone') as string;
    const drugAllergy = formData.get('drugAllergy') as string;
    const foodAllergy = formData.get('foodAllergy') as string;
    const vaccineAllergy = formData.get('vaccineAllergy') as string;
    const underlyingDisease = formData.get('underlyingDisease') as string;
    const currentMedication = formData.get('currentMedication') as string;

    const name = `${title}${firstName} ${lastName}`;

    const newErrors: { cid?: string; dob?: string; passport?: string } = {};

    // Validate CID (13 digits)
    if (citizenId && !/^\d{13}$/.test(citizenId)) {
      newErrors.cid = 'เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก';
    }

    // Validate DOB (not in future)
    if (!birthDate) {
      newErrors.dob = 'กรุณาระบุวันเกิด';
    } else {
      const selectedDate = new Date(birthDate);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.dob = 'วันเกิดห้ามเป็นวันที่ในอนาคต';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'ข้อมูลไม่ถูกต้อง',
        message: Object.values(newErrors).join('\n')
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const newPatient = await registerPatient({
        name,
        title,
        firstName,
        lastName,
        gender,
        citizenId,
        birthDate,
        phone,
        email,
        passportNo,
        nationality,
        paymentType,
        addressLine1,
        subDistrict,
        district,
        province,
        postalCode,
        emergencyContactName,
        emergencyContactPhone,
        drugAllergy,
        foodAllergy,
        vaccineAllergy,
        underlyingDisease,
        currentMedication
      });
      
      await openVisit(newPatient);
      
      // Reset form
      form.reset();
      
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'ลงทะเบียนสำเร็จ',
        message: `ลงทะเบียนผู้ป่วยและเปิด Visit ใหม่เรียบร้อยแล้ว\nHN: ${newPatient.hn}`
      });
    } catch (error) {
      console.error('Registration error:', error);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถลงทะเบียนผู้ป่วยได้ กรุณาลองใหม่อีกครั้ง'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenVisit = async (patient: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await openVisit(patient);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'เปิด Visit สำเร็จ',
        message: `เปิด Visit ใหม่สำหรับ ${patient.name} เรียบร้อยแล้ว`
      });
    } catch (error) {
      console.error('Open visit error:', error);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถเปิด Visit ได้ กรุณาลองใหม่อีกครั้ง'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setEditForm({ ...patient });
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    const fullName = `${editForm.title}${editForm.firstName} ${editForm.lastName}`;
    const updatedData = { ...editForm, name: fullName };

    try {
      await updatePatient(editingPatient.id, updatedData);
      setEditingPatient(null);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'สำเร็จ',
        message: 'แก้ไขข้อมูลผู้ป่วยเรียบร้อยแล้ว'
      });
    } catch (error) {
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถแก้ไขข้อมูลได้'
      });
    }
  };

  const handleDeletePatient = (patient: Patient) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'ยืนยันการลบ',
      message: `คุณต้องการลบข้อมูลผู้ป่วย ${patient.name} ใช่หรือไม่?`,
      onConfirm: async () => {
        try {
          await deletePatient(patient.id);
          setModalConfig({
            isOpen: true,
            type: 'alert',
            title: 'สำเร็จ',
            message: 'ลบข้อมูลผู้ป่วยเรียบร้อยแล้ว'
          });
        } catch (error) {
          setModalConfig({
            isOpen: true,
            type: 'alert',
            title: 'เกิดข้อผิดพลาด',
            message: 'ไม่สามารถลบข้อมูลได้'
          });
        }
      }
    });
  };

  const handleCheckDuplicate = async (type: 'cid' | 'passport', value: string): Promise<boolean> => {
    // We check against the local patients state which is synced with Firestore
    if (type === 'cid') {
      return patients.some(p => p.citizenId === value);
    } else {
      return patients.some(p => p.passportNo === value);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SectionTitle title="ลงทะเบียนผู้รับบริการ" subtitle="เพิ่มประวัติผู้ป่วยใหม่ หรือค้นหาข้อมูลเพื่อเปิด Visit" />
      
      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('register')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'register'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <UserPlus size={18} />
          ลงทะเบียนผู้รับบริการ
        </button>
        <button
          onClick={() => setActiveTab('master')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'master'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Users size={18} />
          รายชื่อผู้ป่วยที่ลงทะเบียนแล้ว (Master Data)
        </button>
      </div>

      {activeTab === 'register' && (
        <RegistrationForm 
          onSubmit={handleRegister}
          isSubmitting={isSubmitting}
          errors={errors}
          setErrors={setErrors}
          onCheckDuplicate={handleCheckDuplicate}
        />
      )}
      
      {activeTab === 'master' && (
        <PatientMasterList 
          filteredPatients={filteredPatients}
          displayLimit={displayLimit}
          setDisplayLimit={setDisplayLimit}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onView={setSelectedPatientId}
          onEdit={handleEdit}
          onDelete={handleDeletePatient}
          onOpenVisit={handleOpenVisit}
        />
      )}

      {editingPatient && (
        <EditPatientModal 
          editingPatient={editingPatient}
          editForm={editForm}
          setEditForm={setEditForm}
          onClose={() => setEditingPatient(null)}
          onSubmit={handleUpdatePatient}
        />
      )}

      {selectedPatientId && (
        <PatientDetailsModal 
          patientId={selectedPatientId} 
          onClose={() => setSelectedPatientId(null)} 
        />
      )}
    </div>
  );
}
