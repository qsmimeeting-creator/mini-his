import React, { useState } from 'react';
import { Edit, Plus, Trash2, UserPlus, Users, X, Eye, Heart, Phone, CreditCard, Calendar, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SectionTitle } from '../components/common/SectionTitle';
import { Patient } from '../types';
import { PatientDetailsModal } from '../components/common/PatientDetailsModal';

export default function Registration() {
  const { patients, registerPatient, updatePatient, deletePatient, openVisit, setModalConfig } = useAppContext();
  const [errors, setErrors] = useState<{ cid?: string; dob?: string }>({});
  const [activeTab, setActiveTab] = useState<'register' | 'master'>('register');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState<Partial<Patient>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const filteredPatients = patients.filter(p => {
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
    const cid = formData.get('cid') as string;
    const dob = formData.get('dob') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const allergies = formData.get('allergies') as string;

    const name = `${title}${firstName} ${lastName}`;

    const newErrors: { cid?: string; dob?: string } = {};

    // Validate CID (13 digits)
    if (!/^\d{13}$/.test(cid)) {
      newErrors.cid = 'เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก';
    }

    // Validate DOB (not in future)
    if (!dob) {
      newErrors.dob = 'กรุณาระบุวันเกิด';
    } else {
      const selectedDate = new Date(dob);
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
        hn: `HN-${Math.floor(Math.random() * 100000)}`,
        name,
        title,
        firstName,
        lastName,
        gender,
        cid,
        dob,
        phone,
        email,
        allergies
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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleRegister} className="space-y-8">
            {/* Personal Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100 pb-2">
                <User size={18} />
                <span>ข้อมูลส่วนตัว</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">คำนำหน้า <span className="text-red-500">*</span></label>
                  <select name="title" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="เด็กชาย">เด็กชาย</option>
                    <option value="เด็กหญิง">เด็กหญิง</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ <span className="text-red-500">*</span></label>
                  <input name="firstName" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ชื่อจริง" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">นามสกุล <span className="text-red-500">*</span></label>
                  <input name="lastName" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="นามสกุล" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">เพศ <span className="text-red-500">*</span></label>
                  <select name="gender" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">วัน/เดือน/ปีเกิด <span className="text-red-500">*</span></label>
                  <input name="dob" type="date" required className={`w-full border ${errors.dob ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md px-3 py-2 text-sm focus:ring-2 outline-none text-gray-600`} />
                  {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">เลขประจำตัวประชาชน <span className="text-red-500">*</span></label>
                  <input name="cid" required className={`w-full border ${errors.cid ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md px-3 py-2 text-sm focus:ring-2 outline-none`} placeholder="เลข 13 หลัก" />
                  {errors.cid && <p className="text-red-500 text-xs mt-1">{errors.cid}</p>}
                </div>
              </div>
            </div>

            {/* Health & Contact Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100 pb-2">
                <Heart size={18} />
                <span>ข้อมูลสุขภาพและการติดต่อ</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์มือถือ</label>
                  <input name="phone" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="08X-XXX-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
                  <input name="email" type="email" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="example@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ประวัติการแพ้ยา / แพ้อาหาร</label>
                <textarea name="allergies" rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="หากไม่มีให้เว้นว่างไว้ (ระบบจะบันทึกว่าปฏิเสธการแพ้ยา)"></textarea>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="reset" onClick={() => setErrors({})} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 mr-3">
                ล้างข้อมูล
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`px-6 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 shadow-sm transition-colors ${
                  isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={16}/>
                )}
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกและส่งตรวจ'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {activeTab === 'master' && (
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
                  filteredPatients.map(p => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium text-blue-600">{p.hn}</td>
                      <td className="p-4">{p.name}</td>
                      <td className="p-4 text-gray-500">{p.cid}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setSelectedPatientId(p.id)} 
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="ดูรายละเอียดผู้ป่วย"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => handleEdit(p)} 
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeletePatient(p)} 
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="ลบข้อมูล"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleOpenVisit(p)} 
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
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">แก้ไขข้อมูลผู้ป่วย</h3>
              <button onClick={() => setEditingPatient(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdatePatient} className="p-6 space-y-6">
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
                  onClick={() => setEditingPatient(null)}
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
