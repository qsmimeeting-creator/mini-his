import React, { useState, useEffect } from 'react';
import { X, User, CreditCard, MapPin, Heart } from 'lucide-react';
import { Patient } from '../../types';
import {
  searchAddressBySubDistrict,
  searchAddressByDistrict,
  searchAddressByProvince,
  searchAddressByPostalCode
} from 'thai-address-universal';
import { formatThaiPhone } from '../../utils/formatters';

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
  const [phoneType, setPhoneType] = useState<'mobile' | 'home'>(
    editForm.phone?.startsWith('02') ? 'home' : 'mobile'
  );
  const [isForeigner, setIsForeigner] = useState(!!editForm.passportNo && !editForm.citizenId);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);
  const [title, setTitle] = useState(editForm.title || 'นาย');
  const [otherTitle, setOtherTitle] = useState('');
  const [age, setAge] = useState('');
  const [birthDate, setBirthDate] = useState({
    day: '',
    month: '',
    year: ''
  });

  // Initialize birthDate parts and title from editForm
  useEffect(() => {
    if (editForm.birthDate) {
      const [year, month, day] = editForm.birthDate.split('-');
      setBirthDate({
        day: parseInt(day).toString(),
        month: parseInt(month).toString(),
        year: (parseInt(year) + 543).toString()
      });
    }
    
    const standardTitles = ['นาย', 'นาง', 'นางสาว', 'เด็กชาย', 'เด็กหญิง'];
    if (editForm.title && !standardTitles.includes(editForm.title)) {
      setTitle('อื่นๆ');
      setOtherTitle(editForm.title);
    } else {
      setTitle(editForm.title || 'นาย');
    }
    
    setIsForeigner(!!editForm.passportNo && !editForm.citizenId);
  }, [editingPatient]);

  useEffect(() => {
    if (birthDate.day && birthDate.month && birthDate.year) {
      const birth = new Date(parseInt(birthDate.year) - 543, parseInt(birthDate.month) - 1, parseInt(birthDate.day));
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge.toString());
    } else {
      setAge('');
    }
  }, [birthDate]);

  // Update editForm.title when title or otherTitle change
  useEffect(() => {
    const finalTitle = title === 'อื่นๆ' ? otherTitle : title;
    if (finalTitle !== editForm.title) {
      setEditForm(prev => ({ ...prev, title: finalTitle }));
    }
  }, [title, otherTitle]);

  // Update editForm.birthDate when parts change
  useEffect(() => {
    if (birthDate.day && birthDate.month && birthDate.year && birthDate.year.length === 4) {
      const gregorianYear = parseInt(birthDate.year) - 543;
      const month = birthDate.month.padStart(2, '0');
      const day = birthDate.day.padStart(2, '0');
      const isoDate = `${gregorianYear}-${month}-${day}`;
      if (isoDate !== editForm.birthDate) {
        setEditForm(prev => ({ ...prev, birthDate: isoDate }));
      }
    }
  }, [birthDate]);

  useEffect(() => {
    if (editForm.phone) {
      setEditForm(prev => ({ ...prev, phone: formatThaiPhone(prev.phone || '', phoneType) }));
    }
  }, [phoneType]);

  const handleAddressChange = async (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    
    if (value.length >= 2) {
      let results: any[] = [];
      try {
        if (field === 'subDistrict') results = await searchAddressBySubDistrict(value);
        else if (field === 'district') results = await searchAddressByDistrict(value);
        else if (field === 'province') results = await searchAddressByProvince(value);
        else if (field === 'postalCode') results = await searchAddressByPostalCode(value);
      } catch (error) {
        console.error("Error searching address:", error);
      }
      
      const mappedResults = results.slice(0, 10).map(item => ({
        subDistrict: item.sub_district,
        district: item.district,
        province: item.province,
        postalCode: item.postal_code
      }));
      
      setAddressSuggestions(mappedResults);
      setShowSuggestions(field);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(null);
    }
  };

  const selectAddress = (item: any) => {
    setEditForm(prev => ({
      ...prev,
      subDistrict: item.subDistrict,
      district: item.district,
      province: item.province,
      postalCode: item.postalCode
    }));
    setAddressSuggestions([]);
    setShowSuggestions(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">แก้ไขข้อมูลผู้ป่วย</h3>
              <p className="text-xs text-gray-500">HN: {editingPatient.hn}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Identification */}
          <section className="space-y-4 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-800 font-bold border-b border-blue-100 pb-2">
              <CreditCard size={20} />
              <span>ข้อมูลยืนยันตัวตน (Identification)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-gray-700">
                    {isForeigner ? 'Passport No.' : 'เลขประจำตัวประชาชน'}
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                    <input 
                      type="checkbox" 
                      checked={isForeigner}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsForeigner(checked);
                        setEditForm(prev => ({ 
                          ...prev, 
                          nationality: checked ? '' : 'ไทย' 
                        }));
                      }}
                      className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                    />
                    <span className="text-[10px] font-bold text-gray-700">ชาวต่างชาติ</span>
                  </label>
                </div>
                <input 
                  value={isForeigner ? editForm.passportNo : editForm.citizenId}
                  onChange={e => setEditForm(prev => ({ 
                    ...prev, 
                    [isForeigner ? 'passportNo' : 'citizenId']: e.target.value 
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={isForeigner ? "กรอกเลขหนังสือเดินทาง" : "กรอกเลข 13 หลัก"}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">สัญชาติ</label>
                <input 
                  value={editForm.nationality}
                  onChange={e => setEditForm({...editForm, nationality: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </section>

          {/* Personal Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100 pb-2">
              <User size={18} />
              <span>ข้อมูลส่วนตัว</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำนำหน้า</label>
                <select 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                  <option value="เด็กชาย">เด็กชาย</option>
                  <option value="เด็กหญิง">เด็กหญิง</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
                {title === 'อื่นๆ' && (
                  <input 
                    value={otherTitle}
                    onChange={e => setOtherTitle(e.target.value)}
                    placeholder="ระบุคำนำหน้า"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
                <input 
                  value={editForm.firstName}
                  onChange={e => setEditForm({...editForm, firstName: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                <input 
                  value={editForm.lastName}
                  onChange={e => setEditForm({...editForm, lastName: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เพศ</label>
                <select 
                  value={editForm.gender}
                  onChange={e => setEditForm({...editForm, gender: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">วัน/เดือน/ปีเกิด (พ.ศ.)</label>
                <div className="flex gap-2">
                  <select 
                    value={birthDate.day} 
                    onChange={(e) => setBirthDate({...birthDate, day: e.target.value})} 
                    className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">วัน</option>
                    {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                  <select 
                    value={birthDate.month} 
                    onChange={(e) => setBirthDate({...birthDate, month: e.target.value})} 
                    className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">เดือน</option>
                    {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                  <input 
                    maxLength={4} 
                    value={birthDate.year} 
                    onChange={(e) => setBirthDate({...birthDate, year: e.target.value.replace(/\D/g, '')})} 
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="ปี พ.ศ." 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อายุ (ปี)</label>
                <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 font-medium h-[38px] flex items-center">
                  {age ? `${age}` : '-'}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {phoneType === 'mobile' ? 'เบอร์โทรศัพท์มือถือ' : 'เบอร์โทรศัพท์บ้าน'}
                    <span className="ml-2 text-[10px] text-gray-400 font-normal">
                      ({(editForm.phone || '').replace(/\D/g, '').length}/{phoneType === 'mobile' ? '10' : '9'})
                    </span>
                  </label>
                  <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 scale-90 origin-right">
                    <button
                      type="button"
                      onClick={() => setPhoneType('mobile')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                        phoneType === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      มือถือ
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoneType('home')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                        phoneType === 'home' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      บ้าน
                    </button>
                  </div>
                </div>
                <input 
                  value={editForm.phone}
                  onChange={e => setEditForm({...editForm, phone: formatThaiPhone(e.target.value, phoneType)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={phoneType === 'mobile' ? "08X-XXX-XXXX" : "02-XXX-XXXX"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                <input 
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </section>

          {/* Contact Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100 pb-2">
              <MapPin size={18} />
              <span>ข้อมูลการติดต่อ</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
                <input 
                  value={editForm.addressLine1}
                  onChange={e => setEditForm({...editForm, addressLine1: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล/แขวง</label>
                <input 
                  value={editForm.subDistrict}
                  onChange={e => handleAddressChange('subDistrict', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {showSuggestions === 'subDistrict' && addressSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {addressSuggestions.map((item, idx) => (
                      <div key={idx} onClick={() => selectAddress(item)} className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">
                        {item.subDistrict} › {item.district} › {item.province}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ/เขต</label>
                <input 
                  value={editForm.district}
                  onChange={e => handleAddressChange('district', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {showSuggestions === 'district' && addressSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {addressSuggestions.map((item, idx) => (
                      <div key={idx} onClick={() => selectAddress(item)} className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">
                        {item.subDistrict} › {item.district} › {item.province}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
                <input 
                  value={editForm.province}
                  onChange={e => handleAddressChange('province', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {showSuggestions === 'province' && addressSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {addressSuggestions.map((item, idx) => (
                      <div key={idx} onClick={() => selectAddress(item)} className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer">
                        {item.subDistrict} › {item.district} › {item.province}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์</label>
                <input 
                  value={editForm.postalCode}
                  onChange={e => setEditForm({...editForm, postalCode: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ผู้ติดต่อฉุกเฉิน</label>
                <input 
                  value={editForm.emergencyContactName}
                  onChange={e => setEditForm({...editForm, emergencyContactName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เบอร์ติดต่อฉุกเฉิน
                  <span className="ml-2 text-[10px] text-gray-400 font-normal">
                    ({(editForm.emergencyContactPhone || '').replace(/\D/g, '').length}/10)
                  </span>
                </label>
                <input 
                  value={editForm.emergencyContactPhone}
                  onChange={e => setEditForm({...editForm, emergencyContactPhone: formatThaiPhone(e.target.value, 'mobile')})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </section>

          {/* Health Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100 pb-2">
              <Heart size={18} />
              <span>ข้อมูลสุขภาพ</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประวัติการแพ้ยา</label>
                <textarea 
                  value={editForm.drugAllergy}
                  onChange={e => setEditForm({...editForm, drugAllergy: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประวัติการแพ้อาหาร</label>
                <textarea 
                  value={editForm.foodAllergy}
                  onChange={e => setEditForm({...editForm, foodAllergy: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประวัติการแพ้วัคซีน</label>
                <textarea 
                  value={editForm.vaccineAllergy}
                  onChange={e => setEditForm({...editForm, vaccineAllergy: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">โรคประจำตัว</label>
                <textarea 
                  value={editForm.underlyingDisease}
                  onChange={e => setEditForm({...editForm, underlyingDisease: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ยาที่ใช้ประจำ</label>
                <textarea 
                  value={editForm.currentMedication}
                  onChange={e => setEditForm({...editForm, currentMedication: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </section>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            onClick={(e) => onSubmit(e)}
            className="px-8 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            บันทึกการแก้ไข
          </button>
        </div>
      </div>
    </div>
  );
};
