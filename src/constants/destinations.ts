import { VisitStatus } from "../types";

export interface Destination {
  value: VisitStatus;
  label: string;
  color: string;
}

export const DESTINATIONS: Destination[] = [
  { value: 'SCREENING_PENDING', label: 'ส่งไปคัดกรอง', color: 'blue' },
  { value: 'DOCTOR_PENDING', label: 'ส่งพบแพทย์', color: 'indigo' },
  { value: 'POST_DOCTOR_PENDING', label: 'ส่งตรวจสอบหลังพบแพทย์', color: 'purple' },
  { value: 'PAYMENT_PENDING', label: 'ส่งชำระเงิน', color: 'emerald' },
  { value: 'DISPENSE_PENDING', label: 'ส่งรับยา/วัคซีน', color: 'amber' },
  { value: 'INJECTION_PENDING', label: 'ส่งฉีดวัคซีน', color: 'rose' },
  { value: 'COMPLETED', label: 'เสร็จสิ้นบริการ', color: 'gray' },
];
