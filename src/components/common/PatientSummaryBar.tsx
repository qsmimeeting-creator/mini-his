import React, { useState } from 'react';
import { User, AlertCircle, Calendar, CreditCard, Edit2 } from 'lucide-react';
import { Patient, Visit } from '../../types';
import { format, parseISO, isValid, differenceInYears } from 'date-fns';
import { th } from 'date-fns/locale';
import { HealthInfoModal } from './HealthInfoModal';

interface PatientSummaryBarProps {
  patient: Patient;
  visit?: Visit;
}

export const PatientSummaryBar: React.FC<PatientSummaryBarProps> = ({ patient, visit }) => {
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  const calculateAge = (dob: string) => {
    try {
      const date = parseISO(dob);
      if (isValid(date)) {
        return differenceInYears(new Date(), date);
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const age = patient.age || (patient.birthDate ? calculateAge(patient.birthDate) : null);

  const hasAllergies = patient.drugAllergy || patient.foodAllergy || patient.vaccineAllergy;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="flex flex-col md:flex-row">
        {/* Left Side: Basic Info */}
        <div className="flex-1 p-4 flex items-center gap-4 border-r border-gray-100">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <User size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                {patient.title}{patient.firstName} {patient.lastName}
              </h2>
              <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                HN: {patient.hn}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                {patient.gender === 'male' ? 'ชาย' : 'หญิง'}
              </span>
              <span className="flex items-center gap-1">
                อายุ: {age || '-'} ปี
              </span>
              <span className="flex items-center gap-1">
                <CreditCard size={14} />
                {patient.citizenId || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Visit Info */}
        {visit && (
          <div className="flex-1 p-4 flex items-center gap-4 border-r border-gray-100 bg-gray-50/30">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Visit Info</span>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                  VN: {visit.vn}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700 mt-0.5">
                {visit.visitType} | {visit.servicePoint || 'OPD'}
              </p>
              <p className="text-[10px] text-gray-400">
                เข้ารับบริการเมื่อ: {format(parseISO(visit.timestamp), 'dd/MM/yyyy HH:mm', { locale: th })}
              </p>
            </div>
          </div>
        )}

        {/* Right Side: Allergy Alert */}
        <div 
          onClick={() => setIsHealthModalOpen(true)}
          className={`flex-1 p-4 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity relative group ${hasAllergies ? 'bg-red-50 animate-pulse' : 'bg-emerald-50/30'}`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${hasAllergies ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <AlertCircle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase ${hasAllergies ? 'text-red-500' : 'text-emerald-600'}`}>
                Allergy Alert / ข้อควรระวัง
              </span>
              <Edit2 size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${hasAllergies ? 'text-red-400' : 'text-emerald-400'}`} />
            </div>
            <p className={`text-sm font-bold truncate ${hasAllergies ? 'text-red-700' : 'text-emerald-700'}`}>
              {hasAllergies ? [patient.drugAllergy, patient.foodAllergy, patient.vaccineAllergy].filter(Boolean).join(', ') : 'ไม่มีประวัติการแพ้'}
            </p>
          </div>
        </div>
      </div>

      {isHealthModalOpen && (
        <HealthInfoModal 
          patient={patient} 
          onClose={() => setIsHealthModalOpen(false)} 
        />
      )}
    </div>
  );
};
