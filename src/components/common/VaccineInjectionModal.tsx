import React, { useState } from 'react';
import { X, Syringe, MapPin, Navigation, Info, CheckCircle2 } from 'lucide-react';
import { Visit } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { PatientSummaryBar } from './PatientSummaryBar';

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
  const { patients } = useAppContext();
  const patient = patients.find(p => p.id === visit.patientId);
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shadow-sm">
              <Syringe size={20} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-800">บันทึกการฉีดวัคซีน (Vaccine Administration)</h3>
              <p className="text-sm text-gray-500">VN: {visit.vn} | คิวที่: {visit.queueNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {patient && <PatientSummaryBar patient={patient} visit={visit} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
              <Info size={20} className="text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700 leading-relaxed">
                <p className="font-bold mb-1">คำแนะนำการบันทึก:</p>
                <p>กรุณาระบุตำแหน่งและวิธีการฉีดให้ถูกต้องตามมาตรฐานการพยาบาล เพื่อใช้เป็นข้อมูลอ้างอิงและติดตามผลข้างเคียงที่อาจเกิดขึ้น</p>
              </div>
            </div>

            <div className="space-y-6">
              {injectionRecords.map((record, index) => (
                <div key={index} className="p-6 border border-gray-200 rounded-2xl space-y-6 bg-white shadow-sm hover:border-emerald-200 transition-all">
                  <div className="flex justify-between items-start border-b border-gray-50 pb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                          {index + 1}
                        </span>
                        <h4 className="font-bold text-2xl text-gray-900">{record.vaccineName}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 font-bold">
                          LOT: {record.lot}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Route Selection */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <Navigation size={16} className="text-blue-500" />
                        วิธีการฉีด (Route)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['IM', 'SC', 'ID', 'Oral', 'Nasal'].map(route => (
                          <button
                            key={route}
                            type="button"
                            onClick={() => handleUpdateRecord(index, 'route', route)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                              record.route === route
                                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:bg-gray-50'
                            }`}
                          >
                            {route}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Site Selection */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <MapPin size={16} className="text-blue-500" />
                        ตำแหน่งที่ฉีด (Site)
                      </label>
                      <select 
                        value={record.site}
                        onChange={e => handleUpdateRecord(index, 'site', e.target.value)}
                        className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-white shadow-sm transition-all"
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
                    <label className="block text-sm font-bold text-gray-700">หมายเหตุเพิ่มเติม</label>
                    <textarea 
                      rows={2}
                      value={record.note}
                      onChange={e => handleUpdateRecord(index, 'note', e.target.value)}
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder="ระบุหมายเหตุ (ถ้ามี)..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button 
                type="button"
                onClick={onClose}
                className="px-8 py-3 text-sm font-bold text-gray-700 bg-white border-2 border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all"
              >
                ยกเลิก
              </button>
              <button 
                type="submit"
                className="px-12 py-3 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
              >
                <CheckCircle2 size={20} />
                ยืนยันการฉีดวัคซีนและปิดรายการ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
