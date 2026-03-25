export interface Patient {
  id: string;
  hn: string;
  name: string; // Full name for display
  title: string;
  firstName: string;
  lastName: string;
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
    
    // Post Doctor
    postDoctorVerifiedAt?: string;
    postDoctorVerifiedBy?: string;
    
    // Cashier
    paidAt?: string;
    paidBy?: string;
    paymentMethod?: string;
    amountPaid?: number;
    totalAmount?: number;
    
    // Dispense
    dispensedAt?: string;
    dispensedBy?: string;
    dispensedLots?: string;
    
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
