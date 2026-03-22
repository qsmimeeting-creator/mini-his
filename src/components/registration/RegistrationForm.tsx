import React from 'react';
import { Plus, User, Heart } from 'lucide-react';

interface RegistrationFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isSubmitting: boolean;
  errors: { cid?: string; dob?: string };
  setErrors: React.Dispatch<React.SetStateAction<{ cid?: string; dob?: string }>>;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmit, isSubmitting, errors, setErrors }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <form onSubmit={onSubmit} className="space-y-8">
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
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">วัน/เดือน/ปีเกิด <span className="text-red-500">*</span></label>
              <input name="birthDate" type="date" required className={`w-full border ${errors.dob ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md px-3 py-2 text-sm focus:ring-2 outline-none text-gray-600`} />
              {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">เลขประจำตัวประชาชน <span className="text-red-500">*</span></label>
              <input name="citizenId" required className={`w-full border ${errors.cid ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-md px-3 py-2 text-sm focus:ring-2 outline-none`} placeholder="เลข 13 หลัก" />
              {errors.cid && <p className="text-red-500 text-xs mt-1">{errors.cid}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Passport No.</label>
              <input name="passportNo" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เลขหนังสือเดินทาง" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">สัญชาติ</label>
              <input name="nationality" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="สัญชาติ" defaultValue="ไทย" />
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์มือถือ <span className="text-red-500">*</span></label>
              <input name="phone" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="08X-XXX-XXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
              <input name="email" type="email" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="example@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ประเภทการชำระเงิน</label>
              <select name="paymentType" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="เงินสด">เงินสด</option>
                <option value="โอนเงิน">โอนเงิน</option>
                <option value="บัตรเครดิต">บัตรเครดิต</option>
                <option value="สิทธิสวัสดิการ">สิทธิสวัสดิการ</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ที่อยู่</label>
              <input name="addressLine1" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="บ้านเลขที่, หมู่บ้าน, ถนน" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ตำบล/แขวง</label>
              <input name="subDistrict" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">อำเภอ/เขต</label>
              <input name="district" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">จังหวัด</label>
              <input name="province" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสไปรษณีย์</label>
              <input name="postalCode" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ผู้ติดต่อฉุกเฉิน</label>
              <input name="emergencyContactName" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ชื่อ-นามสกุล" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์ติดต่อฉุกเฉิน</label>
              <input name="emergencyContactPhone" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="08X-XXX-XXXX" />
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
  );
};
