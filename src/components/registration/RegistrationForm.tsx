import React from 'react';
import { Plus, User, Heart } from 'lucide-react';
import {
  searchAddressBySubDistrict,
  searchAddressByDistrict,
  searchAddressByProvince,
  searchAddressByPostalCode
} from 'thai-address-universal';
import { formatThaiPhone } from '../../utils/formatters';

interface RegistrationFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isSubmitting: boolean;
  errors: { cid?: string; dob?: string; passport?: string };
  setErrors: React.Dispatch<React.SetStateAction<{ cid?: string; dob?: string; passport?: string }>>;
  onCheckDuplicate: (type: 'cid' | 'passport', value: string) => Promise<boolean>;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ 
  onSubmit, 
  isSubmitting, 
  errors, 
  setErrors,
  onCheckDuplicate
}) => {
  const [isForeigner, setIsForeigner] = React.useState(false);
  const [cidChecked, setCidChecked] = React.useState(false);
  const [passportChecked, setPassportChecked] = React.useState(false);
  const [idValue, setIdValue] = React.useState('');
  const [isChecking, setIsChecking] = React.useState(false);
  const [birthDate, setBirthDate] = React.useState({ day: '', month: '', year: '' });
  const [age, setAge] = React.useState('');
  const [title, setTitle] = React.useState('นาย');
  const [otherTitle, setOtherTitle] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [phoneType, setPhoneType] = React.useState<'mobile' | 'home'>('mobile');
  const [phone, setPhone] = React.useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState('');
  const [nationality, setNationality] = React.useState('ไทย');

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (['นาย', 'เด็กชาย'].includes(title)) {
      setGender('male');
    } else if (['นาง', 'นางสาว', 'เด็กหญิง'].includes(title)) {
      setGender('female');
    } else {
      setGender('');
    }
  }, [title]);
  React.useEffect(() => {
    if (phone) {
      setPhone(formatThaiPhone(phone, phoneType));
    }
  }, [phoneType]);

  const [addressSuggestions, setAddressSuggestions] = React.useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState<string | null>(null);

  const isoBirthDate = React.useMemo(() => {
    if (birthDate.day && birthDate.month && birthDate.year && birthDate.year.length === 4) {
      const gregorianYear = parseInt(birthDate.year) - 543;
      const month = birthDate.month.padStart(2, '0');
      const day = birthDate.day.padStart(2, '0');
      return `${gregorianYear}-${month}-${day}`;
    }
    return '';
  }, [birthDate]);

  const [addressForm, setAddressForm] = React.useState({
    subDistrict: '',
    district: '',
    province: '',
    postalCode: ''
  });

  const handleAddressChange = async (field: string, value: string) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
    
    if (value.length >= 2) {
      let results: any[] = [];
      try {
        if (field === 'subDistrict') {
          results = await searchAddressBySubDistrict(value);
        } else if (field === 'district') {
          results = await searchAddressByDistrict(value);
        } else if (field === 'province') {
          results = await searchAddressByProvince(value);
        } else if (field === 'postalCode') {
          results = await searchAddressByPostalCode(value);
        }
      } catch (error) {
        console.error("Error searching address:", error);
      }
      
      const mappedResults = results.slice(0, 20).map(item => ({
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
    setAddressForm({
      subDistrict: item.subDistrict,
      district: item.district,
      province: item.province,
      postalCode: item.postalCode
    });
    setAddressSuggestions([]);
    setShowSuggestions(null);
  };

  const validateThaiID = (id: string) => {
    if (!/^\d{13}$/.test(id)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(id.charAt(i)) * (13 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(id.charAt(12));
  };

  const handleCheck = async () => {
    if (!idValue) {
      setErrors(prev => ({ ...prev, [isForeigner ? 'passport' : 'cid']: `กรุณาระบุ${isForeigner ? ' Passport No.' : 'เลขประจำตัวประชาชน'}` }));
      return;
    }

    if (!isForeigner && !validateThaiID(idValue)) {
      setErrors(prev => ({ ...prev, cid: 'เลขประจำตัวประชาชนไม่ถูกต้องตามรูปแบบ' }));
      return;
    }

    setIsChecking(true);
    const isDuplicate = await onCheckDuplicate(isForeigner ? 'passport' : 'cid', idValue);
    setIsChecking(false);

    if (isDuplicate) {
      setErrors(prev => ({ ...prev, [isForeigner ? 'passport' : 'cid']: `${isForeigner ? 'Passport No.' : 'เลขประจำตัวประชาชน'}นี้มีในระบบแล้ว` }));
      if (isForeigner) setPassportChecked(false); else setCidChecked(false);
    } else {
      setErrors(prev => {
        const { cid, passport, ...rest } = prev;
        return rest;
      });
      if (isForeigner) setPassportChecked(true); else setCidChecked(true);
    }
  };

  const isChecked = isForeigner ? passportChecked : cidChecked;
  const hasError = isForeigner ? !!errors.passport : !!errors.cid;
  const errorMessage = isForeigner ? errors.passport : errors.cid;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <form onSubmit={onSubmit} className="space-y-8">
        <input type="hidden" name="birthDate" value={isoBirthDate} />
        {/* Identification Section - MOVED TO TOP */}
        <div className="space-y-4 bg-blue-50/30 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 text-blue-800 font-bold border-b border-blue-100 pb-2">
            <User size={20} />
            <span>ข้อมูลยืนยันตัวตน (Identification)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-gray-700">
                  {isForeigner ? 'Passport No.' : 'เลขประจำตัวประชาชน'} <span className="text-red-500">*</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                  <input 
                    type="checkbox" 
                    checked={isForeigner}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsForeigner(checked);
                      setNationality(checked ? '' : 'ไทย');
                      setIdValue('');
                      setCidChecked(false);
                      setPassportChecked(false);
                      setErrors(prev => {
                        const { cid, passport, ...rest } = prev;
                        return rest;
                      });
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                  />
                  <span className="text-xs font-black text-gray-700">ชาวต่างชาติ</span>
                </label>
              </div>
              <div className="flex gap-2">
                <input 
                  name={isForeigner ? "passportNo" : "citizenId"} 
                  required 
                  value={idValue}
                  maxLength={isForeigner ? 20 : 13}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!isForeigner) {
                      // Only allow numbers for Citizen ID
                      if (/^\d*$/.test(val)) {
                        setIdValue(val);
                        setCidChecked(false);
                      }
                    } else {
                      setIdValue(val);
                      setPassportChecked(false);
                    }
                  }}
                  className={`flex-1 border-2 ${hasError ? 'border-red-500 focus:ring-red-500' : isChecked ? 'border-green-500 focus:ring-green-500' : 'border-blue-200 focus:ring-blue-500'} rounded-lg px-4 py-2.5 text-base font-medium focus:ring-2 outline-none bg-white`} 
                  placeholder={isForeigner ? "กรอกเลขหนังสือเดินทาง" : "กรอกเลข 13 หลัก (ตัวเลขเท่านั้น)"} 
                />
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={isChecking || !idValue}
                  className={`px-6 py-2.5 text-sm font-black rounded-lg border-2 transition-all duration-200 ${
                    isChecked 
                      ? 'bg-green-600 text-white border-green-600' 
                      : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:shadow-md active:scale-95'
                  }`}
                >
                  {isChecking ? '...' : isChecked ? 'ตรวจสอบแล้ว' : 'ตรวจสอบ'}
                </button>
              </div>
              {errorMessage && <p className="text-red-500 text-xs mt-1 font-bold">{errorMessage}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">สัญชาติ</label>
              <input 
                name="nationality" 
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                placeholder="ระบุสัญชาติ" 
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Personal Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100 pb-2">
            <User size={18} />
            <span>ข้อมูลส่วนตัว</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">คำนำหน้า <span className="text-red-500">*</span></label>
              <select name="title" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
                <option value="เด็กชาย">เด็กชาย</option>
                <option value="เด็กหญิง">เด็กหญิง</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
              {title === 'อื่นๆ' && (
                <input name="otherTitle" required value={otherTitle} onChange={(e) => setOtherTitle(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ระบุคำนำหน้า" />
              )}
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
              <select name="gender" required value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">กรุณาเลือก</option>
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">วัน/เดือน/ปีเกิด (พ.ศ.) <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select name="birthDay" required value={birthDate.day} onChange={(e) => setBirthDate({...birthDate, day: e.target.value})} className={`flex-1 border ${errors.dob ? 'border-red-500' : 'border-gray-300'} rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none`}>
                  <option value="">วัน</option>
                  {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
                <select name="birthMonth" required value={birthDate.month} onChange={(e) => setBirthDate({...birthDate, month: e.target.value})} className={`flex-1 border ${errors.dob ? 'border-red-500' : 'border-gray-300'} rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none`}>
                  <option value="">เดือน</option>
                  {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <input name="birthYear" required maxLength={4} value={birthDate.year} onChange={(e) => setBirthDate({...birthDate, year: e.target.value.replace(/\D/g, '')})} className={`flex-1 border ${errors.dob ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none`} placeholder="ปี พ.ศ." />
              </div>
              {errors.dob && <p className="text-red-500 text-xs mt-1 font-bold">{errors.dob}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">อายุ (ปี)</label>
              <div className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-700 font-medium h-[38px] flex items-center">
                {age ? `${age}` : '-'}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  {phoneType === 'mobile' ? 'เบอร์โทรศัพท์มือถือ' : 'เบอร์โทรศัพท์บ้าน'} <span className="text-red-500">*</span>
                  <span className="ml-2 text-[10px] text-gray-400 font-normal">
                    ({(phone || '').replace(/\D/g, '').length}/{phoneType === 'mobile' ? '10' : '9'})
                  </span>
                </label>
                <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setPhoneType('mobile')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                      phoneType === 'mobile' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    มือถือ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneType('home')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                      phoneType === 'home' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    บ้าน
                  </button>
                </div>
              </div>
              <input 
                name="phone" 
                required 
                value={phone}
                onChange={(e) => setPhone(formatThaiPhone(e.target.value, phoneType))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder={phoneType === 'mobile' ? "08X-XXX-XXXX" : "02-XXX-XXXX"} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
              <input name="email" type="email" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="example@email.com" />
            </div>
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100 pb-2">
            <User size={18} />
            <span>ข้อมูลการติดต่อ</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ที่อยู่</label>
              <input name="addressLine1" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="บ้านเลขที่, หมู่บ้าน, ถนน" />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ตำบล/แขวง</label>
              <input 
                name="subDistrict" 
                value={addressForm.subDistrict}
                onChange={(e) => handleAddressChange('subDistrict', e.target.value)}
                autoComplete="off"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              {showSuggestions === 'subDistrict' && addressSuggestions.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {addressSuggestions.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => selectAddress(item)}
                      className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      {item.subDistrict} › {item.district} › {item.province} ({item.postalCode})
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">อำเภอ/เขต</label>
              <input 
                name="district" 
                value={addressForm.district}
                onChange={(e) => handleAddressChange('district', e.target.value)}
                autoComplete="off"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              {showSuggestions === 'district' && addressSuggestions.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {addressSuggestions.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => selectAddress(item)}
                      className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      {item.subDistrict} › {item.district} › {item.province} ({item.postalCode})
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">จังหวัด</label>
              <input 
                name="province" 
                value={addressForm.province}
                onChange={(e) => handleAddressChange('province', e.target.value)}
                autoComplete="off"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              {showSuggestions === 'province' && addressSuggestions.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {addressSuggestions.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => selectAddress(item)}
                      className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      {item.subDistrict} › {item.district} › {item.province} ({item.postalCode})
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสไปรษณีย์</label>
              <input 
                name="postalCode" 
                value={addressForm.postalCode}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                autoComplete="off"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              {showSuggestions === 'postalCode' && addressSuggestions.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {addressSuggestions.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => selectAddress(item)}
                      className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      {item.subDistrict} › {item.district} › {item.province} ({item.postalCode})
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ผู้ติดต่อฉุกเฉิน</label>
              <input name="emergencyContactName" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ชื่อ-นามสกุล ผู้ติดต่อฉุกเฉิน" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                เบอร์ติดต่อฉุกเฉิน
                <span className="ml-2 text-[10px] text-gray-400 font-normal">
                  ({(emergencyContactPhone || '').replace(/\D/g, '').length}/10)
                </span>
              </label>
              <input 
                name="emergencyContactPhone" 
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(formatThaiPhone(e.target.value, 'mobile'))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="08X-XXX-XXXX" 
              />
            </div>
          </div>
        </div>

        {/* Health Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100 pb-2">
            <Heart size={18} />
            <span>ข้อมูลสุขภาพ</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ประวัติการแพ้ยา</label>
              <textarea name="drugAllergy" rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="หากไม่มีให้เว้นว่างไว้"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ประวัติการแพ้อาหาร</label>
              <textarea name="foodAllergy" rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="หากไม่มีให้เว้นว่างไว้"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ประวัติการแพ้วัคซีน</label>
              <textarea name="vaccineAllergy" rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="หากไม่มีให้เว้นว่างไว้"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">โรคประจำตัว</label>
              <textarea name="underlyingDisease" rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="หากไม่มีให้เว้นว่างไว้"></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ยาที่ใช้ประจำ</label>
              <textarea name="currentMedication" rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="หากไม่มีให้เว้นว่างไว้"></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button 
            type="reset" 
            onClick={() => {
              setErrors({});
              setIdValue('');
              setBirthDate({ day: '', month: '', year: '' });
              setAge('');
              setTitle('นาย');
              setOtherTitle('');
              setPhone('');
              setEmergencyContactPhone('');
              setNationality('ไทย');
              setAddressForm({
                subDistrict: '',
                district: '',
                province: '',
                postalCode: ''
              });
              setCidChecked(false);
              setPassportChecked(false);
            }} 
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 mr-3"
          >
            ล้างข้อมูล
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting || (idValue && !isChecked)}
            className={`px-6 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 shadow-sm transition-colors ${
              (isSubmitting || (idValue && !isChecked)) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
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
  );
};
