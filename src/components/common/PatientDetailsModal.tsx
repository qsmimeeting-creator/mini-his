import React from 'react';
import { X, User, Calendar, CreditCard, History, Syringe, Activity } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatDoseNumber, getCompletedInjectionRecords } from '../../utils/orderWorkflow';
import { VaccineHistoryTable } from './VaccineHistoryTable';
import { format, parseISO, isValid } from 'date-fns';
import { th } from 'date-fns/locale';

interface PatientDetailsModalProps {
  patientId: string;
  onClose: () => void;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({ patientId, onClose }) => {
  const { patients, visits } = useAppContext();
  
  const patient = patients.find(p => p.id === patientId);
  const patientVisits = visits
    .filter(v => v.patientId === patientId && v.status === 'COMPLETED')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (!patient) return null;

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isValid(date)) {
        const day = format(date, 'dd', { locale: th });
        const month = format(date, 'MMMM', { locale: th });
        const year = date.getFullYear() + 543;
        return `${day} ${month} ${year}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const calculateAge = (birthDateStr: string) => {
    try {
      const birthDate = parseISO(birthDateStr);
      if (!isValid(birthDate)) return null;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return null;
    }
  };

  const displayAge = patient.age || calculateAge(patient.birthDate);

  const completedVaccineRecords = patientVisits.flatMap(visit =>
    getCompletedInjectionRecords(visit).map((record: any) => ({
      ...record,
      visitDate: visit.data?.injectedAt || visit.timestamp,
      vn: visit.vn,
    }))
  );

  const formatDateTime = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isValid(date)) {
        return format(date, 'dd/MM/yyyy HH:mm', { locale: th });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">รายละเอียดผู้ป่วย</h3>
              <p className="text-xs text-gray-500">HN: {patient.hn}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Personal Info */}
          <section>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard size={14} />
              ข้อมูลส่วนตัว
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="space-y-1">
                <span className="text-xs text-gray-500">ชื่อ-นามสกุล</span>
                <p className="font-semibold text-gray-900">{patient.title} {patient.firstName} {patient.lastName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">ชื่อ-นามสกุล (EN)</span>
                <p className="font-semibold text-gray-900">
                  {patient.titleEn || patient.firstNameEn || patient.lastNameEn 
                    ? `${patient.titleEn || ''} ${patient.firstNameEn || ''} ${patient.lastNameEn || ''}`.trim()
                    : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">เลขประจำตัวประชาชน / Passport</span>
                <p className="font-semibold text-gray-900">{patient.citizenId || patient.passportNo || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">วัน/เดือน/ปีเกิด</span>
                <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-400" />
                  {formatDate(patient.birthDate)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">อายุ / เพศ</span>
                <p className="font-semibold text-gray-900">{displayAge || '-'} ปี / {patient.gender === 'male' ? 'ชาย' : 'หญิง'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">สัญชาติ</span>
                <p className="font-semibold text-gray-900">{patient.nationality || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">เบอร์โทรศัพท์</span>
                <p className="font-semibold text-gray-900">
                  {patient.phone || '-'}
                  {patient.phone?.startsWith('02') ? ' (บ้าน)' : patient.phone ? ' (มือถือ)' : ''}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">อีเมล</span>
                <p className="font-semibold text-gray-900">{patient.email || '-'}</p>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <span className="text-xs text-gray-500">ที่อยู่</span>
                <p className="font-semibold text-gray-900">
                  {patient.addressLine1} {patient.subDistrict} {patient.district} {patient.province} {patient.postalCode}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">ผู้ติดต่อฉุกเฉิน</span>
                <p className="font-semibold text-gray-900">{patient.emergencyContactName || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">เบอร์ติดต่อฉุกเฉิน</span>
                <p className="font-semibold text-gray-900">{patient.emergencyContactPhone || '-'}</p>
              </div>
            </div>
          </section>

          {/* Health Info */}
          <section>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity size={14} />
              ข้อมูลสุขภาพ
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <span className="text-xs text-red-500 font-bold uppercase">ประวัติการแพ้ยา</span>
                <p className="font-semibold text-red-700 mt-1">{patient.drugAllergy || 'ไม่มีประวัติการแพ้'}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <span className="text-xs text-orange-500 font-bold uppercase">ประวัติการแพ้อาหาร</span>
                <p className="font-semibold text-orange-700 mt-1">{patient.foodAllergy || 'ไม่มีประวัติการแพ้'}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <span className="text-xs text-amber-500 font-bold uppercase">ประวัติการแพ้วัคซีน</span>
                <p className="font-semibold text-amber-700 mt-1">{patient.vaccineAllergy || 'ไม่มีประวัติการแพ้'}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <span className="text-xs text-blue-500 font-bold uppercase">โรคประจำตัว</span>
                <p className="font-semibold text-blue-700 mt-1">{patient.underlyingDisease || '-'}</p>
              </div>
              <div className="sm:col-span-2 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <span className="text-xs text-indigo-500 font-bold uppercase">ยาที่ใช้ประจำ</span>
                <p className="font-semibold text-indigo-700 mt-1">{patient.currentMedication || '-'}</p>
              </div>
            </div>
          </section>

          {/* Vaccination History */}
          <section>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History size={14} />
              ประวัติการรับบริการและฉีดวัคซีน
            </h4>
            
            <VaccineHistoryTable records={completedVaccineRecords} emptyMessage="ไม่พบประวัติการฉีดวัคซีน" />
            <div className="hidden">
            {patientVisits.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                <Syringe size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">ไม่พบประวัติการฉีดวัคซีน</p>
              </div>
            ) : (
              <div className="space-y-3">
                {patientVisits.map((visit) => {
                  const completedVaccines = getCompletedInjectionRecords(visit);
                  return (
                  <div key={visit.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">VN: {visit.vn}</span>
                        <p className="text-xs text-gray-500 mt-1">{formatDateTime(visit.timestamp)}</p>
                      </div>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">เสร็จสิ้น</span>
                    </div>
                    
                    {completedVaccines.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase">วัคซีนที่ได้รับ:</p>
                        <div className="flex flex-wrap gap-2">
                          {completedVaccines.map((record: any, idx: number) => (
                            <div key={record.orderId || `${record.vaccineId}-${idx}`} className="bg-white border border-gray-200 rounded-lg p-2 flex items-center gap-2 shadow-sm">
                              <Syringe size={14} className="text-emerald-500" />
                              <div>
                                <p className="text-xs font-bold text-gray-800">{record.vaccineName || record.name || '-'}</p>
                                {(record.doseNumber || record.doseLabel) && <p className="text-[10px] text-blue-600">{formatDoseNumber(record.doseNumber, record.doseLabel)}</p>}
                                <p className="text-[10px] text-gray-500">Lot: {record.lot || 'N/A'}</p>
                                {(record.route || record.site) && (
                                  <p className="text-[10px] text-blue-600 font-medium">
                                    {record.route || '-'} | {record.site || '-'}
                                  </p>
                                )}
                                {record.note && <p className="text-[10px] text-gray-500">{record.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                        ยังไม่มีประวัติการฉีดวัคซีนสำเร็จ
                      </div>
                    )}
                    
                    {visit.data?.vitals && (
                      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-4 gap-2 text-[10px]">
                        <div className="text-gray-500">BP: <span className="text-gray-900 font-medium">{visit.data.vitals.bp || '-'}</span></div>
                        <div className="text-gray-500">PR: <span className="text-gray-900 font-medium">{visit.data.vitals.pr || '-'}</span></div>
                        <div className="text-gray-500">Temp: <span className="text-gray-900 font-medium">{visit.data.vitals.temp || '-'}</span></div>
                        <div className="text-gray-500">Weight: <span className="text-gray-900 font-medium">{visit.data.vitals.weight || '-'}</span></div>
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
