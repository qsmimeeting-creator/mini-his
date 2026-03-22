export interface Patient {
  id: string;
  hn: string;
  name: string; // Full name for display
  title: string;
  firstName: string;
  lastName: string;
  gender: string;
  cid: string;
  dob: string;
  phone: string;
  email: string;
  allergies: string;
}

export interface Visit {
  id: string;
  vn: string;
  patientId: string;
  patientName: string;
  status: string;
  timestamp: string;
  data: any;
}

export interface Vaccine {
  id: string;
  name: string;
  price: number;
  stock: number;
  lot: string;
}
