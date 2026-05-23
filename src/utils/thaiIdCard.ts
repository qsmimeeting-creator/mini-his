import { searchAddressBySubDistrict } from 'thai-address-universal';
import type { ThaiIdCardFormData } from '../types';

export interface ThaiIdCardRawData {
  citizenID?: string;
  citizenId?: string;
  titleTH?: string;
  firstNameTH?: string;
  lastNameTH?: string;
  titleEN?: string;
  firstNameEN?: string;
  lastNameEN?: string;
  dateOfBirth?: string;
  birthday?: string;
  gender?: string;
  address?: string;
}

interface ParsedThaiAddress {
  addressLine1?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

const THAI_ADMIN_PREFIXES = /^(ตำบล|ต\.|แขวง|อำเภอ|อ\.|เขต|จังหวัด|จ\.)/;

const cleanText = (value?: string) =>
  (value || '').replace(/#/g, ' ').replace(/\s+/g, ' ').trim();

const normalizeAddressToken = (value?: string) =>
  cleanText(value).replace(THAI_ADMIN_PREFIXES, '').trim();

const normalizeBirthDate = (value?: string) => {
  const cleaned = cleanText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  if (/^\d{8}$/.test(cleaned)) {
    let year = Number(cleaned.slice(0, 4));
    if (year > 2400) year -= 543;
    return `${year.toString().padStart(4, '0')}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  }

  return '';
};

const mapGender = (value?: string): 'male' | 'female' | '' => {
  const normalized = cleanText(value).toLowerCase();
  if (['male', 'm', '1', 'ชาย'].includes(normalized)) return 'male';
  if (['female', 'f', '2', 'หญิง'].includes(normalized)) return 'female';
  return '';
};

const extractAddressPart = (address: string, pattern: RegExp) => {
  const match = address.match(pattern);
  return match?.[1] ? normalizeAddressToken(match[1]) : undefined;
};

export const parseThaiIdCardAddress = async (rawAddress?: string): Promise<ParsedThaiAddress> => {
  const address = cleanText(rawAddress);
  if (!address) return {};

  const subDistrict = extractAddressPart(address, /(?:ตำบล|ต\.|แขวง)\s*([^\s]+)/);
  const district = extractAddressPart(address, /(?:อำเภอ|อ\.|เขต)\s*([^\s]+)/);
  const province = extractAddressPart(address, /(?:จังหวัด|จ\.)\s*([^\s]+)/);
  const subDistrictIndex = address.search(/(?:ตำบล|ต\.|แขวง)/);
  const addressLine1 = cleanText(subDistrictIndex >= 0 ? address.slice(0, subDistrictIndex) : address);

  let officialAddress: ParsedThaiAddress = {};
  if (subDistrict) {
    try {
      const results = await searchAddressBySubDistrict(subDistrict);
      const exactMatches = results.filter((item: any) => {
        const itemSubDistrict = normalizeAddressToken(item.sub_district);
        const itemDistrict = normalizeAddressToken(item.district);
        const itemProvince = normalizeAddressToken(item.province);

        return (
          itemSubDistrict === subDistrict &&
          (!district || itemDistrict === district) &&
          (!province || itemProvince === province)
        );
      });

      if (exactMatches.length === 1) {
        const match = exactMatches[0] as any;
        officialAddress = {
          subDistrict: match.sub_district,
          district: match.district,
          province: match.province,
          postalCode: String(match.postal_code || '')
        };
      }
    } catch (error) {
      console.error('Error matching Thai ID card address:', error);
    }
  }

  return {
    addressLine1,
    subDistrict: officialAddress.subDistrict || subDistrict,
    district: officialAddress.district || district,
    province: officialAddress.province || province,
    postalCode: officialAddress.postalCode || ''
  };
};

export const normalizeThaiIdCardData = async (raw: ThaiIdCardRawData): Promise<ThaiIdCardFormData> => {
  const address = await parseThaiIdCardAddress(raw.address);

  return {
    citizenId: cleanText(raw.citizenID || raw.citizenId).replace(/\D/g, ''),
    title: cleanText(raw.titleTH),
    firstName: cleanText(raw.firstNameTH),
    lastName: cleanText(raw.lastNameTH),
    titleEn: cleanText(raw.titleEN),
    firstNameEn: cleanText(raw.firstNameEN),
    lastNameEn: cleanText(raw.lastNameEN),
    birthDate: normalizeBirthDate(raw.dateOfBirth || raw.birthday),
    gender: mapGender(raw.gender),
    nationality: 'ไทย',
    ...address
  };
};
