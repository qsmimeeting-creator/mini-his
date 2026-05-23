import React from 'react';
import { Syringe } from 'lucide-react';
import { buildVaccineHistoryRows, VACCINE_HISTORY_COLUMNS } from '../../utils/orderWorkflow';

interface VaccineHistoryTableProps {
  records: any[];
  emptyMessage?: string;
}

const formatRecordDate = (record: any) => {
  const value = record.injectedAt || record.visitDate || record.timestamp;
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('th-TH');
  } catch (error) {
    return String(value);
  }
};

const renderRecord = (record: any, index: number) => (
  <div key={record.orderId || `${record.vaccineId || record.vaccineName}-${index}`} className="rounded-md bg-white/70 px-2 py-1.5 text-center">
    <div className="text-sm font-semibold text-gray-900">{formatRecordDate(record) || '-'}</div>
  </div>
);

export const VaccineHistoryTable: React.FC<VaccineHistoryTableProps> = ({ records, emptyMessage = 'ยังไม่มีประวัติการฉีดวัคซีนสำเร็จ' }) => {
  const rows = buildVaccineHistoryRows(records);

  if (rows.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
        <Syringe size={32} className="mx-auto mb-2 opacity-20" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-300 bg-white">
      <table className="min-w-[920px] w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-900">
            <th className="border border-gray-300 px-4 py-3 text-center text-base font-bold w-[260px]">ชื่อวัคซีน</th>
            {VACCINE_HISTORY_COLUMNS.map(column => (
              <th key={column.key} className="border border-gray-300 px-3 py-3 text-center text-base font-bold min-w-[130px]">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.key} className="align-top">
              <td className="border border-gray-300 px-4 py-4 text-center">
                <div className="font-semibold text-gray-900">{row.vaccineName}</div>
              </td>
              {VACCINE_HISTORY_COLUMNS.map(column => (
                <td key={column.key} className="border border-gray-300 px-2 py-3 bg-gray-50/30">
                  <div className="space-y-2">
                    {row.cells[column.key].length > 0
                      ? row.cells[column.key].map(renderRecord)
                      : <span className="block text-center text-gray-300">-</span>}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
