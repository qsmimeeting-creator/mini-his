import React, { useState, useEffect } from 'react';
import { X, Activity, ClipboardCheck, Scale } from 'lucide-react';
import { Visit, VisitStatus } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { PatientSummaryBar } from './PatientSummaryBar';

interface ScreeningModalProps {
  visit: Visit;
  onClose: () => void;
  onSave: (data: any, nextStatus: VisitStatus) => void;
}

export const ScreeningModal: React.FC<ScreeningModalProps> = ({ visit, onClose, onSave }) => {
  const { patients } = useAppContext();
  const patient = patients.find(p => p.id === visit.patientId);

  const [screeningNote, setScreeningNote] = useState(visit.data?.screeningNote || '');
  const nextStatus: VisitStatus = 'DOCTOR_PENDING';

  const [formData, setFormData] = useState({
    temp: visit.data?.temp || '',
    pulse: visit.data?.pulse || '',
    bpSys: visit.data?.bpSys || '',
    bpDia: visit.data?.bpDia || '',
    weight: visit.data?.weight || '',
    height: visit.data?.height || '',
    spo2: visit.data?.spo2 || '',
    bmi: visit.data?.bmi || '',
    rr: visit.data?.rr || '',
    q1: visit.data?.q1 || 'no',
    q2: visit.data?.q2 || 'no',
    q3: visit.data?.q3 || 'no',
    screeningNote: visit.data?.screeningNote || '',
  });

  // Calculate BMI
  useEffect(() => {
    if (formData.weight && formData.height) {
      const w = parseFloat(formData.weight);
      const h = parseFloat(formData.height) / 100; // cm to m
      if (w > 0 && h > 0) {
        const bmiValue = (w / (h * h)).toFixed(2);
        setFormData(prev => ({ ...prev, bmi: bmiValue }));
      }
    }
  }, [formData.weight, formData.height]);

  const getVitalWarnings = () => {
    const warnings = [];
    if (formData.bpSys || formData.bpDia) {
      const sys = parseInt(formData.bpSys) || 0;
      const dia = parseInt(formData.bpDia) || 0;
      if (sys > 140 || dia > 90) {
        warnings.push('ความดันโลหิตสูงกว่าเกณฑ์มาตรฐาน (BP > 140/90)');
      } else if ((sys > 0 && sys < 90) || (dia > 0 && dia < 60)) {
        warnings.push('ความดันโลหิตต่ำกว่าเกณฑ์มาตรฐาน (BP < 90/60)');
      }
    }
    
    if (formData.pulse) {
      const pulse = parseInt(formData.pulse);
      if (pulse > 100) {
        warnings.push('ชีพจรเต้นเร็วกว่าเกณฑ์มาตรฐาน (Pulse > 100)');
      } else if (pulse > 0 && pulse < 60) {
        warnings.push('ชีพจรเต้นช้ากว่าเกณฑ์มาตรฐาน (Pulse < 60)');
      }
    }
    
    return warnings;
  };

  const vitalWarnings = getVitalWarnings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      screeningNote,
      bp: formData.bpSys && formData.bpDia ? `${formData.bpSys}/${formData.bpDia}` : '',
      screenedAt: new Date().toISOString()
    }, nextStatus);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-xl text-gray-800">บันทึกการคัดกรอง</h3>
            <p className="text-sm text-gray-500">VN: {visit.vn} | คิวที่: {visit.queueNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {patient && <PatientSummaryBar patient={patient} visit={visit} />}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Vital Signs Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100 pb-2">
                <Activity size={18} />
                <span>สัญญาณชีพ (VITAL SIGNS)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">ความดันโลหิต (BP) <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      required
                      value={formData.bpSys}
                      onChange={e => setFormData({...formData, bpSys: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="120"
                    />
                    <span className="text-gray-400">/</span>
                    <input 
                      type="number"
                      required
                      value={formData.bpDia}
                      onChange={e => setFormData({...formData, bpDia: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="80"
                    />
                    <span className="text-gray-400 text-xs whitespace-nowrap">mmHg</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">ชีพจร (Pulse) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input 
                      type="number"
                      required
                      value={formData.pulse}
                      onChange={e => setFormData({...formData, pulse: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                      placeholder="80"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">bpm</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">อัตราการหายใจ (RR)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={formData.rr}
                      onChange={e => setFormData({...formData, rr: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                      placeholder="20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">/min</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">อุณหภูมิ (Temp)</label>
                  <div className="relative">
                    <input 
                      type="number" step="0.1"
                      value={formData.temp}
                      onChange={e => setFormData({...formData, temp: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-8"
                      placeholder="36.5"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">°C</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">น้ำหนัก (Weight)</label>
                  <div className="relative">
                    <input 
                      type="number" step="0.1"
                      value={formData.weight}
                      onChange={e => setFormData({...formData, weight: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-8"
                      placeholder="60.5"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">kg</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">ส่วนสูง (Height)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={formData.height}
                      onChange={e => setFormData({...formData, height: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-8"
                      placeholder="170"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">cm</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">BMI</label>
                  <div className="relative">
                    <input 
                      type="text"
                      readOnly
                      value={formData.bmi}
                      className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm font-bold text-blue-600 outline-none"
                      placeholder="-"
                    />
                    <Scale size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">ออกซิเจน (SpO2)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={formData.spo2}
                      onChange={e => setFormData({...formData, spo2: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-6"
                      placeholder="98"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                  </div>
                </div>
              </div>
              
              {vitalWarnings.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
                    <Activity size={16} />
                    <span>แจ้งเตือนค่าสัญญาณชีพผิดปกติ</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {vitalWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Questionnaire Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-700 font-semibold border-b border-gray-100 pb-2">
                <ClipboardCheck size={18} />
                <span>แบบสอบถามก่อนรับวัคซีน</span>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                  <span className="text-sm text-gray-700">1. ปัจจุบันมีอาการเจ็บป่วย หรือมีไข้สูงหรือไม่?</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="q1" value="no" checked={formData.q1 === 'no'} onChange={e => setFormData({...formData, q1: e.target.value})} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">ไม่มี</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="q1" value="yes" checked={formData.q1 === 'yes'} onChange={e => setFormData({...formData, q1: e.target.value})} className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">มี</span>
                    </label>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                  <span className="text-sm text-gray-700">2. กำลังตั้งครรภ์ หรือให้นมบุตรหรือไม่? (เฉพาะสตรี)</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="q2" value="no" checked={formData.q2 === 'no'} onChange={e => setFormData({...formData, q2: e.target.value})} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">ไม่ใช่</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="q2" value="yes" checked={formData.q2 === 'yes'} onChange={e => setFormData({...formData, q2: e.target.value})} className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-600">ใช่</span>
                    </label>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                  <span className="text-sm text-gray-700">3. เคยมีประวัติแพ้วัคซีน หรือส่วนประกอบของวัคซีนอย่างรุนแรงหรือไม่?</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="q3" value="no" checked={formData.q3 === 'no'} onChange={e => setFormData({...formData, q3: e.target.value})} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">ไม่เคย</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="q3" value="yes" checked={formData.q3 === 'yes'} onChange={e => setFormData({...formData, q3: e.target.value})} className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">เคย</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Note Section */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">บันทึกเพิ่มเติม (ถ้ามี)</label>
              <textarea 
                rows={3}
                value={screeningNote}
                onChange={e => setScreeningNote(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="ระบุอาการเบื้องต้น หรือบันทึกอื่นๆ..."
              />
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
                className="px-8 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md transition-colors"
              >
                บันทึกข้อมูลคัดกรอง
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
