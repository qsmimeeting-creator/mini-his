import React, { useState } from 'react';
import { VisitStatus, Patient } from '../../types';
import { Send, X } from 'lucide-react';

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
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(nextStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">เปิดการรับบริการ (Open Visit)</h3>
            <p className="text-sm text-gray-500">สร้าง Visit ใหม่สำหรับผู้รับบริการ</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-600 mb-1">ผู้รับบริการ</p>
            <p className="text-lg font-bold text-blue-900">{patient.name}</p>
            <p className="text-xs text-blue-500 mt-1">HN: {patient.hn}</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
};
