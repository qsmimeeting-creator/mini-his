import React, { useState } from 'react';
import { X, Syringe, MapPin, Navigation, Info } from 'lucide-react';
import { Visit } from '../../types';

interface VaccineInjectionModalProps {
  visit: Visit;
  onClose: () => void;
  onSave: (data: any) => void;
}

interface InjectionRecord {
  vaccineId: string;
  vaccineName: string;
  lot: string;
  route: string;
  site: string;
  note: string;
}

export const VaccineInjectionModal: React.FC<VaccineInjectionModalProps> = ({ visit, onClose, onSave }) => {
  const orders = visit.data?.orders || [];
  const dispensedLots = visit.data?.dispensedLots || '';
  const lotsArray = dispensedLots.split(',').map((l: string) => l.trim());

  const [injectionRecords, setInjectionRecords] = useState<InjectionRecord[]>(
    orders.map((o: any, index: number) => ({
      vaccineId: o.id,
      vaccineName: o.name,
      lot: lotsArray[index] || lotsArray[0] || '',
      route: 'IM',
      site: 'ต้นแขนซ้าย',
      note: '',
    }))
  );

  const handleUpdateRecord = (index: number, field: keyof InjectionRecord, value: string) => {
    const newRecords = [...injectionRecords];
    newRecords[index] = { ...newRecords[index], [field]: value };
    setInjectionRecords(newRecords);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      injectionRecords,
      injectedAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Syringe size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">บันทึกการฉีดวัคซีน</h3>
              <p className="text-xs text-gray-500">ผู้ป่วย: {visit.patientName} | VN: {visit.vn}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2 mb-4">
            <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">กรุณาระบุรายละเอียดการฉีดสำหรับวัคซีนแต่ละรายการ</p>
          </div>

          <div className="space-y-6">
            {injectionRecords.map((record, index) => (
              <div key={index} className="p-5 border border-gray-200 rounded-xl space-y-5 bg-white shadow-sm hover:border-emerald-200 transition-colors">
                <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xl text-gray-900">{record.vaccineName}</h4>
                    <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 inline-block">
                      Lot: {record.lot}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">รายการที่ {index + 1}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Route Selection */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <Navigation size={14} className="text-blue-500" />
                      วิธีการฉีด (Route)
                    </label>
                    <select 
                      value={record.route}
                      onChange={e => handleUpdateRecord(index, 'route', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                    >
                      <option value="IM">กล้ามเนื้อ (IM)</option>
                      <option value="SC">ชั้นไขมัน (SC)</option>
                      <option value="ID">ชั้นผิวหนัง (ID)</option>
                      <option value="Oral">กิน (Oral)</option>
                      <option value="Nasal">พ่นจมูก (Nasal)</option>
                    </select>
                  </div>

                  {/* Site Selection */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <MapPin size={14} className="text-blue-500" />
                      ตำแหน่งที่ฉีด (Site)
                    </label>
                    <select 
                      value={record.site}
                      onChange={e => handleUpdateRecord(index, 'site', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                    >
                      <option value="ต้นแขนซ้าย">ต้นแขนซ้าย</option>
                      <option value="ต้นแขนขวา">ต้นแขนขวา</option>
                      <option value="ต้นขาซ้าย">ต้นขาซ้าย</option>
                      <option value="ต้นขาขวา">ต้นขาขวา</option>
                      <option value="สะโพกซ้าย">สะโพกซ้าย</option>
                      <option value="สะโพกขวา">สะโพกขวา</option>
                      <option value="ช่องปาก">ช่องปาก</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">หมายเหตุ (หมายเหตุ)</label>
                  <input 
                    type="text"
                    value={record.note}
                    onChange={e => handleUpdateRecord(index, 'note', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="ระบุหมายเหตุสำหรับวัคซีนรายการนี้..."
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              className="px-8 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors"
            >
              ยืนยันการฉีดวัคซีน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
