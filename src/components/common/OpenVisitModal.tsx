import React, { useState } from 'react';
import { CustomModal } from './CustomModal';
import { VisitStatus, Patient } from '../../types';
import { Send } from 'lucide-react';

interface OpenVisitModalProps {
  patient: Patient;
  onClose: () => void;
  onConfirm: (nextStatus: VisitStatus) => Promise<void>;
}

export const OpenVisitModal: React.FC<OpenVisitModalProps> = ({
  patient,
  onClose,
  onConfirm
}) => {
  const nextStatus: VisitStatus = 'SCREENING_PENDING';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(nextStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomModal
      isOpen={true}
      onClose={onClose}
      title="เปิดการรับบริการ (Open Visit)"
      zIndex="z-[80]"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-600 mb-1">ผู้ป่วย</p>
          <p className="text-lg font-bold text-blue-900">{patient.name}</p>
          <p className="text-xs text-blue-500 mt-1">HN: {patient.hn}</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            ยืนยันเปิด Visit
          </button>
        </div>
      </div>
    </CustomModal>
  );
};
