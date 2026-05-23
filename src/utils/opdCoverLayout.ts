export const OPD_COVER_FIELDS = [
  'hn',
  'fullName',
  'age',
  'gender',
  'idNumber',
  'birthDate',
  'occupation',
  'address',
  'addressAdministrative',
  'phone',
  'underlyingDisease',
  'drugAllergy'
] as const;

export type OpdCoverField = typeof OPD_COVER_FIELDS[number];
export type OpdCoverFontWeight = 'regular' | 'bold';

export type OpdCoverFieldLayout = {
  x: number;
  y: number;
  size: number;
  maxWidth: number;
  lineHeight?: number;
  fontWeight?: OpdCoverFontWeight;
};

export type OpdCoverLayout = Record<OpdCoverField, OpdCoverFieldLayout>;

export const OPD_COVER_FIELD_LABELS: Record<OpdCoverField, string> = {
  hn: 'HN',
  fullName: 'ชื่อ-นามสกุล',
  age: 'อายุ',
  gender: 'เพศ',
  idNumber: 'เลขบัตร/Passport',
  birthDate: 'วันเกิด',
  occupation: 'อาชีพ',
  address: 'ที่อยู่',
  addressAdministrative: 'ที่อยู่ บรรทัดที่ 2',
  phone: 'โทรศัพท์',
  underlyingDisease: 'โรคประจำตัว',
  drugAllergy: 'การแพ้ยา'
};

export const DEFAULT_OPD_COVER_LAYOUT: OpdCoverLayout = {
  hn: { x: 482, y: 850, size: 14, maxWidth: 86, fontWeight: 'bold' },
  fullName: { x: 120, y: 706, size: 12, maxWidth: 292, lineHeight: 15, fontWeight: 'bold' },
  age: { x: 468, y: 706, size: 11, maxWidth: 82, lineHeight: 14, fontWeight: 'bold' },
  gender: { x: 98, y: 678, size: 12, maxWidth: 44, fontWeight: 'bold' },
  idNumber: { x: 304, y: 678, size: 11, maxWidth: 106, fontWeight: 'bold' },
  birthDate: { x: 463, y: 678, size: 11, maxWidth: 98, fontWeight: 'bold' },
  occupation: { x: 122, y: 650, size: 12, maxWidth: 410, fontWeight: 'bold' },
  address: { x: 122, y: 621, size: 11, maxWidth: 392, lineHeight: 15, fontWeight: 'bold' },
  addressAdministrative: { x: 122, y: 606, size: 11, maxWidth: 392, lineHeight: 15, fontWeight: 'bold' },
  phone: { x: 122, y: 565, size: 12, maxWidth: 260, fontWeight: 'bold' },
  underlyingDisease: { x: 160, y: 536, size: 12, maxWidth: 330, fontWeight: 'bold' },
  drugAllergy: { x: 142, y: 508, size: 12, maxWidth: 350, fontWeight: 'bold' }
};

const numberOrDefault = (value: unknown, fallback: number) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const cloneOpdCoverLayout = (layout: OpdCoverLayout = DEFAULT_OPD_COVER_LAYOUT): OpdCoverLayout =>
  OPD_COVER_FIELDS.reduce((acc, field) => {
    acc[field] = { ...layout[field] };
    return acc;
  }, {} as OpdCoverLayout);

export const normalizeOpdCoverLayout = (layout?: unknown): OpdCoverLayout => {
  const source = (layout && typeof layout === 'object') ? layout as Record<string, Partial<OpdCoverFieldLayout>> : {};

  return OPD_COVER_FIELDS.reduce((acc, field) => {
    const defaults = DEFAULT_OPD_COVER_LAYOUT[field];
    const value = source[field] || {};
    const fontWeight = value.fontWeight === 'regular' || value.fontWeight === 'bold'
      ? value.fontWeight
      : defaults.fontWeight;

    acc[field] = {
      x: numberOrDefault(value.x, defaults.x),
      y: numberOrDefault(value.y, defaults.y),
      size: numberOrDefault(value.size, defaults.size),
      maxWidth: numberOrDefault(value.maxWidth, defaults.maxWidth),
      ...(value.lineHeight !== undefined || defaults.lineHeight !== undefined
        ? { lineHeight: numberOrDefault(value.lineHeight, defaults.lineHeight ?? defaults.size + 4) }
        : {}),
      fontWeight
    };
    return acc;
  }, {} as OpdCoverLayout);
};

export const getOpdCoverLayoutSignature = (layout?: unknown) =>
  JSON.stringify(normalizeOpdCoverLayout(layout));
