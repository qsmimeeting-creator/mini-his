export interface Patient {
  id: string;
  hn: string;
  name: string; // Full name for display
  title: string;
  firstName: string;
  lastName: string;
  titleEn?: string;
  firstNameEn?: string;
  lastNameEn?: string;
  birthDate: string; // dob
  age?: number;
  gender: string;
  citizenId: string; // cid
  passportNo?: string;
  nationality?: string;
  phone: string;
  email?: string;
  addressLine1?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  drugAllergy?: string;
  foodAllergy?: string;
  vaccineAllergy?: string;
  underlyingDisease?: string;
  currentMedication?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  specialNote?: string;
  insuranceType?: string;
  companyName?: string;
  billingNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThaiIdCardFormData {
  citizenId: string;
  title: string;
  firstName: string;
  lastName: string;
  titleEn?: string;
  firstNameEn?: string;
  lastNameEn?: string;
  birthDate: string;
  gender: 'male' | 'female' | '';
  nationality: 'ไทย';
  addressLine1?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

export type ThaiIdCardReadResponse =
  | { ok: true; data: ThaiIdCardFormData }
  | { ok: false; code: string; message: string };

export interface Visit {
  id: string;
  vn: string;
  patientId: string;
  patientName: string;
  status: VisitStatus;
  timestamp: string;
  visitType: string;
  servicePoint?: string;
  chiefComplaint?: string;
  registeredBy?: string;
  data: {
    // Screening
    bp?: string;
    bpSystolic?: number;
    bpDiastolic?: number;
    temp?: number;
    pulse?: number;
    respRate?: number;
    rr?: number;
    weight?: number;
    height?: number;
    bmi?: number;
    q1?: string;
    q2?: string;
    q3?: string;
    screenedAt?: string;
    screenedBy?: string;
    screeningNote?: string;
    
    // Doctor
    doctorNote?: string;
    assessment?: string;
    diagnosis?: string;
    orders?: any[];
    orderedAt?: string;
    orderedBy?: string;
    postDoctorVerifiedAt?: string;
    
    // Cashier
    paidAt?: string;
    paidBy?: string;
    paymentMethod?: string;
    amountPaid?: number;
    totalAmount?: number;
    paymentRecords?: any[];
    
    // Dispense
    dispensedAt?: string;
    dispensedBy?: string;
    dispensedLots?: string;
    dispensedItems?: any[];
    
    // Injection
    injectedAt?: string;
    injectedBy?: string;
    injectionSite?: string;
    injectionRoute?: string;
    injectionSide?: string;
    actualDose?: string;
    nextAppointmentDate?: string;
    nextVaccineName?: string;
    injectionRecords?: any[];
  };
}

export type DoseLabel = 'เข็มกระตุ้น' | 'ไม่ระบุเข็ม';
export type PaymentStatus = 'unpaid' | 'paid';
export type DispenseStatus = 'pending' | 'dispensed';

export interface VaccineOrder {
  id: string;
  orderId: string;
  name: string;
  price: number;
  quantity: number;
  doseNumber?: 1 | 2 | 3;
  doseLabel?: DoseLabel | string;
  paymentStatus?: PaymentStatus;
  paymentRecordId?: string;
  dispenseStatus?: DispenseStatus;
  orderedAt?: string;
  lot?: string;
  genericName?: string;
  unit?: string;
}

export interface PaymentRecord {
  id: string;
  paidAt: string;
  paymentMethod: string;
  receivedAmount: number;
  change: number;
  totalAmount: number;
  orderIds: string[];
}

export interface DispensedItem {
  orderId: string;
  id: string;
  name: string;
  lot: string;
  quantity: number;
  doseNumber?: 1 | 2 | 3;
  doseLabel?: DoseLabel | string;
}

export interface InjectionRecord {
  orderId?: string;
  vaccineId: string;
  vaccineName: string;
  quantity?: number;
  doseNumber?: 1 | 2 | 3;
  doseLabel?: DoseLabel | string;
  lot: string;
  route: string;
  site: string;
  note?: string;
  injectedAt?: string;
}

export interface AuditLogEntry {
  id?: string;
  action: string;
  targetType: 'patient' | 'visit' | 'vaccine' | 'system' | 'opdCoverLayout' | 'user';
  targetId: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  createdAt: string;
  details?: Record<string, any>;
}

export type UserRole = 'admin' | 'register' | 'nurse' | 'doctor' | 'cashier' | 'stock' | 'report';

export interface UserRoleProfile {
  uid: string;
  username?: string;
  email?: string;
  firstname?: string;
  surname?: string;
  displayName?: string;
  roles: UserRole[];
  active: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export type VisitStatus = 
  | 'SCREENING_PENDING' 
  | 'SCREENING_IN_PROGRESS' 
  | 'DOCTOR_PENDING' 
  | 'DOCTOR_IN_PROGRESS' 
  | 'POST_DOCTOR_PENDING'
  | 'POST_DOCTOR_IN_PROGRESS'
  | 'PAYMENT_PENDING' 
  | 'PAYMENT_IN_PROGRESS' 
  | 'DISPENSE_PENDING' 
  | 'DISPENSE_IN_PROGRESS' 
  | 'INJECTION_PENDING' 
  | 'INJECTION_IN_PROGRESS' 
  | 'COMPLETED' 
  | 'VOID';

export interface Vaccine {
  id: string;
  name: string;
  genericName?: string;
  brandName?: string;
  manufacturer?: string;
  type: string;
  lot: string;
  receivedDate: string;
  expiryDate: string;
  unitCost: number;
  price: number; // sellingPrice
  stock: number;
  reorderLevel: number;
  unit: string;
  updatedAt?: string;
}
