import React from 'react';
import { FileText, RotateCcw, Save } from 'lucide-react';
import {
  cloneOpdCoverLayout,
  getOpdCoverLayoutSignature,
  OPD_COVER_FIELD_LABELS,
  OPD_COVER_FIELDS,
  normalizeOpdCoverLayout,
  type OpdCoverField,
  type OpdCoverFieldLayout,
  type OpdCoverLayout
} from '../../utils/opdCoverLayout';

interface OpdCoverSettingsProps {
  layout: OpdCoverLayout;
  onSave: (layout: OpdCoverLayout) => Promise<void>;
  onReset: () => Promise<void>;
  onPreview: (layout: OpdCoverLayout) => Promise<void>;
}

const numericFields: Array<keyof Pick<OpdCoverFieldLayout, 'x' | 'y' | 'size' | 'maxWidth' | 'lineHeight'>> = [
  'x',
  'y',
  'size',
  'maxWidth',
  'lineHeight'
];

const numericLabels: Record<typeof numericFields[number], string> = {
  x: 'X',
  y: 'Y',
  size: 'ขนาด',
  maxWidth: 'กว้างสุด',
  lineHeight: 'ระยะบรรทัด'
};

export const OpdCoverSettings: React.FC<OpdCoverSettingsProps> = ({
  layout,
  onSave,
  onReset,
  onPreview
}) => {
  const [draftLayout, setDraftLayout] = React.useState<OpdCoverLayout>(() => cloneOpdCoverLayout(layout));
  const [isDirty, setIsDirty] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const layoutSignature = getOpdCoverLayoutSignature(layout);

  React.useEffect(() => {
    if (!isDirty) {
      setDraftLayout(cloneOpdCoverLayout(layout));
    }
  }, [isDirty, layoutSignature, layout]);

  const updateNumericField = (field: OpdCoverField, key: typeof numericFields[number], value: string) => {
    const numericValue = Number(value);
    setIsDirty(true);
    setDraftLayout(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: Number.isFinite(numericValue) ? numericValue : 0
      }
    }));
  };

  const updateFontWeight = (field: OpdCoverField, fontWeight: 'regular' | 'bold') => {
    setIsDirty(true);
    setDraftLayout(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        fontWeight
      }
    }));
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      await onPreview(normalizeOpdCoverLayout(draftLayout));
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const normalizedLayout = normalizeOpdCoverLayout(draftLayout);
      await onSave(normalizedLayout);
      setDraftLayout(cloneOpdCoverLayout(normalizedLayout));
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      await onReset();
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-800">ตั้งค่าหน้าปก OPD</h3>
          <p className="text-xs text-gray-500 mt-1">X/Y ใช้หน่วย PDF point โดยจุดเริ่มอยู่มุมซ้ายล่างของหน้า A4</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing || isSaving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 text-sm font-medium disabled:opacity-50"
          >
            <FileText size={16} />
            {isPreviewing ? 'กำลังสร้าง...' : 'ดูตัวอย่าง PDF'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isPreviewing || isSaving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
          >
            <RotateCcw size={16} />
            คืนค่าเริ่มต้น
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPreviewing || isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-white text-gray-500 border-b border-gray-200">
            <tr>
              <th className="p-3 font-medium min-w-[150px]">ข้อมูล</th>
              {numericFields.map(field => (
                <th key={field} className="p-3 font-medium min-w-[110px]">{numericLabels[field]}</th>
              ))}
              <th className="p-3 font-medium min-w-[120px]">ตัวอักษร</th>
            </tr>
          </thead>
          <tbody>
            {OPD_COVER_FIELDS.map(field => {
              const item = draftLayout[field];
              return (
                <tr key={field} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-semibold text-gray-800">{OPD_COVER_FIELD_LABELS[field]}</td>
                  {numericFields.map(key => (
                    <td key={key} className="p-3">
                      <input
                        type="number"
                        step={key === 'size' ? 0.5 : 1}
                        value={key === 'lineHeight' ? item.lineHeight ?? item.size + 4 : item[key]}
                        onChange={(event) => updateNumericField(field, key, event.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                  ))}
                  <td className="p-3">
                    <select
                      value={item.fontWeight || 'bold'}
                      onChange={(event) => updateFontWeight(field, event.target.value as 'regular' | 'bold')}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="bold">หนา</option>
                      <option value="regular">ปกติ</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
