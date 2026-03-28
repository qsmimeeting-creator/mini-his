import React, { useState } from 'react';
import { X, Activity, Thermometer, Heart, Weight, Scale, CheckCircle2, ClipboardList, AlertTriangle, Search, Filter, Send } from 'lucide-react';
import { Visit, Vaccine, VisitStatus } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { PatientSummaryBar } from './PatientSummaryBar';
import { DestinationSelector } from './DestinationSelector';

interface DoctorOrderModalProps {
  visit: Visit;
  onClose: () => void;
  onConfirm: (selectedVaccines: string[], additionalData: { doctorNote: string, diagnosis: string }, nextStatus: VisitStatus) => void;
}

export const DoctorOrderModal: React.FC<DoctorOrderModalProps> = ({ visit, onClose, onConfirm }) => {
  const { vaccines, patients } = useAppContext();
  const [selectedVaccines, setSelectedVaccines] = useState<string[]>(() => {
    // If there are existing orders, pre-select them
    if (visit.data?.orders && Array.isArray(visit.data.orders)) {
      return visit.data.orders.map((o: any) => o.id).filter(Boolean);
    }
    return [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [doctorNote, setDoctorNote] = useState(visit.data?.doctorNote || '');
  const [diagnosis, setDiagnosis] = useState(visit.data?.diagnosis || '');
  const [nextStatus, setNextStatus] = useState<VisitStatus>('POST_DOCTOR_PENDING');
  
  const patient = patients.find(p => p.id === visit.patientId);

  const vaccineTypes = Array.from(new Set(vaccines.map(v => v.type))).filter(Boolean);

  const filteredVaccines = vaccines.filter(vac => {
    const matchesSearch = vac.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (vac.genericName && vac.genericName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || vac.type === selectedType;
    return matchesSearch && matchesType;
  });

  const toggleVaccine = (id: string) => {
    setSelectedVaccines(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(selectedVaccines, { doctorNote, diagnosis }, nextStatus);
  };

  if (!patient) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shadow-sm">
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-800">พิจารณาสั่งจ่ายวัคซีน (Doctor Consultation)</h3>
              <p className="text-sm text-gray-500">VN: {visit.vn} | คิวที่: {visit.queueNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <PatientSummaryBar patient={patient} visit={visit} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Screening & Vitals */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2 text-blue-700 font-bold border-b border-gray-50 pb-2">
                  <Activity size={18} />
                  <span>ข้อมูลคัดกรองเบื้องต้น</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Blood Pressure</p>
                    <div className="flex items-center gap-2">
                      <Heart size={14} className="text-red-500" />
                      <span className="text-lg font-bold text-gray-800">{visit.data?.bp || '-'}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Temperature</p>
                    <div className="flex items-center gap-2">
                      <Thermometer size={14} className="text-orange-500" />
                      <span className="text-lg font-bold text-gray-800">{visit.data?.temp || '-'}°C</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Pulse Rate</p>
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-blue-500" />
                      <span className="text-lg font-bold text-gray-800">{visit.data?.pulse || '-'}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">BMI</p>
                    <div className="flex items-center gap-2">
                      <Scale size={14} className="text-emerald-500" />
                      <span className="text-lg font-bold text-emerald-600">{visit.data?.bmi || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">แบบสอบถามคัดกรอง</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">มีไข้หรือป่วยในวันนี้:</span>
                      <span className={`font-bold px-2 py-0.5 rounded ${visit.data?.q1 === 'yes' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {visit.data?.q1 === 'yes' ? 'มี' : 'ไม่มี'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">ตั้งครรภ์หรือให้นมบุตร:</span>
                      <span className={`font-bold px-2 py-0.5 rounded ${visit.data?.q2 === 'yes' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {visit.data?.q2 === 'yes' ? 'ใช่' : 'ไม่ใช่'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">เคยแพ้วัคซีนรุนแรง:</span>
                      <span className={`font-bold px-2 py-0.5 rounded ${visit.data?.q3 === 'yes' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {visit.data?.q3 === 'yes' ? 'เคย' : 'ไม่เคย'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selected Vaccines List */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-blue-500" />
                      รายการที่เลือก ({selectedVaccines.length})
                    </p>
                    {selectedVaccines.length > 0 && (
                      <span className="text-xs font-bold text-blue-600">
                        ฿{selectedVaccines.reduce((sum, id) => sum + (vaccines.find(v => v.id === id)?.price || 0), 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {selectedVaccines.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400">ยังไม่ได้เลือกวัคซีน</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {selectedVaccines.map(id => {
                        const vac = vaccines.find(v => v.id === id);
                        if (!vac) return null;
                        return (
                          <div key={id} className="flex justify-between items-start p-2.5 bg-blue-50/50 border border-blue-100 rounded-lg text-sm group">
                            <div className="flex flex-col pr-2">
                              <span className="font-bold text-gray-800 leading-tight">{vac.name}</span>
                              <span className="text-[10px] text-gray-500">{vac.genericName || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-bold text-blue-600">฿{vac.price.toLocaleString()}</span>
                              <button 
                                onClick={(e) => { e.preventDefault(); toggleVaccine(id); }}
                                className="text-[10px] text-red-500 hover:text-red-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ลบออก
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor's Notes & Diagnosis */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-blue-700 font-bold border-b border-gray-50 pb-2">
                  <ClipboardList size={18} />
                  <span>บันทึกการตรวจและวินิจฉัย</span>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase">การวินิจฉัย (Diagnosis)</label>
                    <input 
                      type="text"
                      value={diagnosis}
                      onChange={e => setDiagnosis(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="เช่น ไข้หวัด, ปวดศีรษะ..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase">บันทึกเพิ่มเติม (Doctor's Note)</label>
                    <textarea 
                      rows={3}
                      value={doctorNote}
                      onChange={e => setDoctorNote(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="ระบุรายละเอียดการตรวจ..."
                    />
                  </div>
                </div>
              </div>

              {/* Destination Selection */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <DestinationSelector 
                  selectedDestination={nextStatus}
                  onChange={setNextStatus}
                />
              </div>
            </div>

            {/* Right: Vaccine Selection */}
            <div className="lg:col-span-2 space-y-4 flex flex-col h-[600px]">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-blue-600" />
                  เลือกวัคซีนที่ต้องการสั่งจ่าย
                </h4>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  ทั้งหมด {filteredVaccines.length} รายการ
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อวัคซีน..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                {vaccineTypes.length > 0 && (
                  <div className="relative min-w-[150px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white transition-all"
                    >
                      <option value="all">ทุกประเภท</option>
                      {vaccineTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto p-1 flex-1 content-start">
                {filteredVaccines.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-gray-500 flex flex-col items-center">
                    <Search size={48} className="text-gray-300 mb-4" />
                    <p className="text-lg font-medium">ไม่พบวัคซีนที่ค้นหา</p>
                    <p className="text-sm">ลองค้นหาด้วยคำอื่น หรือเลือกประเภทอื่น</p>
                  </div>
                ) : (
                  filteredVaccines.map(vac => (
                  <label 
                    key={vac.id} 
                    className={`group relative flex flex-col p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                      selectedVaccines.includes(vac.id) 
                        ? 'bg-blue-50 border-blue-500 shadow-md shadow-blue-100' 
                        : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedVaccines.includes(vac.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
                      }`}>
                        {selectedVaccines.includes(vac.id) && <CheckCircle2 size={16} className="text-white" />}
                      </div>
                      <span className="text-lg font-bold text-blue-600">฿{vac.price.toLocaleString()}</span>
                    </div>

                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={selectedVaccines.includes(vac.id)}
                      onChange={() => toggleVaccine(vac.id)}
                    />
                    
                    <div className="space-y-1">
                      <div className="font-bold text-gray-900 leading-tight group-hover:text-blue-700 transition-colors">{vac.name}</div>
                      <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{vac.genericName || 'N/A'}</div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Lot Number</span>
                        <span className="text-xs font-mono font-bold text-gray-700">{vac.lot}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">คงเหลือ</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          vac.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {vac.stock} {vac.unit || 'โดส'}
                        </span>
                      </div>
                    </div>

                    {vac.stock <= 0 && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
                        <div className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                          <AlertTriangle size={14} />
                          สินค้าหมด
                        </div>
                      </div>
                    )}
                  </label>
                )))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase">เลือกแล้ว</span>
              <span className="text-lg font-bold text-blue-600">{selectedVaccines.length} รายการ</span>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase">ยอดรวมประมาณการ</span>
              <span className="text-lg font-bold text-emerald-600">
                ฿{selectedVaccines.reduce((sum, id) => sum + (vaccines.find(v => v.id === id)?.price || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-8 py-3 text-sm font-bold text-gray-700 bg-white border-2 border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all"
            >
              ยกเลิก
            </button>
            <button 
              onClick={handleSubmit}
              disabled={selectedVaccines.length === 0}
              className="px-12 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle2 size={20} />
              ยืนยันการสั่งวัคซีน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
