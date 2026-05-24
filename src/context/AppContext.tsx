import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User, signInAnonymously } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { Patient, Visit, Vaccine } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { removeUndefinedDeep } from '../utils/firestoreData';
import {
  DEFAULT_OPD_COVER_LAYOUT,
  normalizeOpdCoverLayout,
  type OpdCoverLayout
} from '../utils/opdCoverLayout';
import { getLocalDateKey } from '../utils/visitDate';

interface ModalConfig {
  isOpen: boolean;
  type: string;
  title: string;
  message: React.ReactNode;
  defaultValue?: string;
  onConfirm?: (val?: string) => void;
}

interface AppContextType {
  user: User | null;
  isAuthReady: boolean;
  login: () => void;
  logout: () => void;
  patients: Patient[];
  visits: Visit[];
  vaccines: Vaccine[];
  opdCoverLayout: OpdCoverLayout;
  modalConfig: ModalConfig;
  setModalConfig: (config: ModalConfig) => void;
  activeVisitId: string | null;
  setActiveVisitId: (id: string | null) => void;
  registerPatient: (patient: Omit<Patient, 'id' | 'hn'>) => Promise<Patient>;
  updatePatient: (patientId: string, patientData: Partial<Patient>) => Promise<void>;
  deletePatient: (patientId: string) => Promise<void>;
  openVisit: (patient: Patient) => Promise<boolean>;
  updateVisitStatus: (visitId: string, newStatus: string, additionalData?: any) => Promise<void>;
  updateVaccineStock: (vaccineId: string, newStock: number) => Promise<void>;
  addVaccine: (vaccine: Vaccine) => Promise<void>;
  updateVaccine: (vaccineId: string, vaccineData: Partial<Vaccine>) => Promise<void>;
  deleteVaccine: (vaccineId: string) => Promise<void>;
  voidVisit: (visitId: string) => Promise<void>;
  resetSystem: () => Promise<void>;
  updateOpdCoverLayout: (layout: OpdCoverLayout) => Promise<void>;
  resetOpdCoverLayout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [opdCoverLayout, setOpdCoverLayout] = useState<OpdCoverLayout>(DEFAULT_OPD_COVER_LAYOUT);
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false, type: '', title: '', message: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    const unsubPatients = onSnapshot(collection(db, 'patients'), (snapshot) => {
      setPatients(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'patients'));

    const unsubVisits = onSnapshot(collection(db, 'visits'), (snapshot) => {
      setVisits(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Visit)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'visits'));

    const unsubVaccines = onSnapshot(collection(db, 'vaccines'), (snapshot) => {
      const vacs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Vaccine));
      if (vacs.length === 0) {
        const INITIAL_VACCINES: Vaccine[] = [
          { 
            id: 'V01', 
            name: 'Influenza (4-strain)', 
            genericName: 'Influenza Vaccine',
            manufacturer: 'Sanofi Pasteur',
            type: 'Inactivated',
            price: 850, 
            unitCost: 450,
            stock: 50, 
            reorderLevel: 10,
            unit: 'Dose',
            lot: 'LOT-FLU-2026A',
            receivedDate: new Date().toISOString(),
            expiryDate: '2027-12-31T23:59:59Z'
          },
          { 
            id: 'V02', 
            name: 'HPV (9-valent)', 
            genericName: 'Human Papillomavirus Vaccine',
            manufacturer: 'MSD',
            type: 'Recombinant',
            price: 6500, 
            unitCost: 4800,
            stock: 20, 
            reorderLevel: 5,
            unit: 'Dose',
            lot: 'LOT-HPV-2026B',
            receivedDate: new Date().toISOString(),
            expiryDate: '2028-06-30T23:59:59Z'
          },
          { 
            id: 'V03', 
            name: 'Hepatitis B', 
            genericName: 'Hepatitis B Vaccine',
            manufacturer: 'GSK',
            type: 'Recombinant',
            price: 600, 
            unitCost: 250,
            stock: 100, 
            reorderLevel: 20,
            unit: 'Dose',
            lot: 'LOT-HEPB-2026C',
            receivedDate: new Date().toISOString(),
            expiryDate: '2027-09-15T23:59:59Z'
          }
        ];
        INITIAL_VACCINES.forEach(v => {
          setDoc(doc(db, 'vaccines', v.id), removeUndefinedDeep(v)).catch(e => handleFirestoreError(e, OperationType.CREATE, `vaccines/${v.id}`));
        });
      } else {
        setVaccines(vacs);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'vaccines'));

    const unsubOpdCoverLayout = onSnapshot(doc(db, 'metadata', 'opdCoverLayout'), (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : null;
      setOpdCoverLayout(normalizeOpdCoverLayout(data?.layout));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'metadata/opdCoverLayout'));

    return () => {
      unsubPatients();
      unsubVisits();
      unsubVaccines();
      unsubOpdCoverLayout();
    };
  }, [isAuthReady]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const registerPatient = async (patientData: Omit<Patient, 'id' | 'hn'>) => {
    const id = `P${Date.now()}`;
    const now = new Date();
    const beYear = (now.getFullYear() + 543).toString().slice(-2);
    
    const counterRef = doc(db, 'metadata', 'counters');
    
    try {
      const hn = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nextSeq = 1;
        
        if (counterDoc.exists()) {
          const data = counterDoc.data();
          if (data.lastHnYear === beYear) {
            nextSeq = (data.lastHnSeq || 0) + 1;
          }
        }
        
        transaction.set(counterRef, {
          lastHnYear: beYear,
          lastHnSeq: nextSeq
        }, { merge: true });
        
        const seqStr = nextSeq.toString().padStart(5, '0');
        return `${beYear}${seqStr}`;
      });

      const newPatient = { 
        id, 
        hn, 
        ...patientData,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      await setDoc(doc(db, 'patients', id), removeUndefinedDeep(newPatient));
      return newPatient;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `patients/${id}`);
      throw error;
    }
  };

  const updatePatient = async (patientId: string, patientData: Partial<Patient>) => {
    try {
      await updateDoc(doc(db, 'patients', patientId), removeUndefinedDeep(patientData));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `patients/${patientId}`);
      throw error;
    }
  };

  const deletePatient = async (patientId: string) => {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'patients', patientId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `patients/${patientId}`);
      throw error;
    }
  };

  const openVisit = async (patient: Patient) => {
    const now = new Date();
    const todayKey = getLocalDateKey(now);
    
    // Check if patient already has a visit today (excluding VOID)
    const existingVisit = visits.find(v => 
      v.patientId === patient.id && 
      getLocalDateKey(v.timestamp) === todayKey &&
      v.status !== 'VOID'
    );

    if (existingVisit) {
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'ไม่สามารถเปิดการรับบริการได้',
        message: (
          <div className="space-y-2">
            <p className="text-red-600 font-bold">ผู้ป่วยรายนี้มีการเปิดการรับบริการแล้วในวันนี้</p>
            <p className="text-sm text-gray-600">VN: {existingVisit.vn}</p>
            <p className="text-sm text-gray-600">สถานะปัจจุบัน: {existingVisit.status}</p>
            <p className="text-xs text-gray-500 mt-2 italic">* 1 คน สามารถใช้เลข VN ได้เพียง 1 เลขต่อวันเท่านั้น</p>
          </div>
        )
      });
      return false;
    }

    const id = `V${Date.now()}`;
    const timestamp = now.toISOString();
    
    // Calculate next VN sequence for today
    const todayVisits = visits.filter(v => getLocalDateKey(v.timestamp) === todayKey);
    const nextVnSeq = todayVisits.length + 1;
    const vn = `VN-${String(nextVnSeq).padStart(5, '0')}`;

    const newVisit: Visit = {
      id,
      vn,
      patientId: patient.id,
      patientName: patient.name,
      status: 'SCREENING_PENDING',
      timestamp,
      visitType: 'Vaccination',
      servicePoint: 'OPD',
      registeredBy: user?.displayName || user?.email || 'System',
      data: {}
    };
    try {
      await setDoc(doc(db, 'visits', id), removeUndefinedDeep(newVisit));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `visits/${id}`);
      return false;
    }
  };

  const updateVisitStatus = async (visitId: string, newStatus: string, additionalData: any = {}) => {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;
    try {
      await updateDoc(doc(db, 'visits', visitId), removeUndefinedDeep({
        status: newStatus,
        data: { ...visit.data, ...additionalData }
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `visits/${visitId}`);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
      });
      throw error;
    }
  };

  const updateVaccineStock = async (vaccineId: string, newStock: number) => {
    try {
      await updateDoc(doc(db, 'vaccines', vaccineId), removeUndefinedDeep({ stock: newStock }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vaccines/${vaccineId}`);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
      });
      throw error;
    }
  };

  const addVaccine = async (vaccine: Vaccine) => {
    try {
      await setDoc(doc(db, 'vaccines', vaccine.id), removeUndefinedDeep(vaccine));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `vaccines/${vaccine.id}`);
      throw error;
    }
  };

  const updateVaccine = async (vaccineId: string, vaccineData: Partial<Vaccine>) => {
    try {
      await updateDoc(doc(db, 'vaccines', vaccineId), removeUndefinedDeep(vaccineData));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vaccines/${vaccineId}`);
      throw error;
    }
  };

  const deleteVaccine = async (vaccineId: string) => {
    try {
      // In a real app we might want to soft delete or check for dependencies
      // For this HIS app, we'll do a simple delete for now
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'vaccines', vaccineId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vaccines/${vaccineId}`);
      throw error;
    }
  };

  const voidVisit = async (visitId: string) => {
    try {
      await updateDoc(doc(db, 'visits', visitId), removeUndefinedDeep({ status: 'VOID' }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `visits/${visitId}`);
      throw error;
    }
  };

  const resetSystem = async () => {
    try {
      const { deleteDoc, getDocs, collection } = await import('firebase/firestore');
      
      // 1. Delete all visits
      const visitSnapshot = await getDocs(collection(db, 'visits'));
      const visitDeletes = visitSnapshot.docs.map(d => deleteDoc(doc(db, 'visits', d.id)));
      
      // 2. Delete all patients
      const patientSnapshot = await getDocs(collection(db, 'patients'));
      const patientDeletes = patientSnapshot.docs.map(d => deleteDoc(doc(db, 'patients', d.id)));
      
      // 3. Reset counters
      const counterRef = doc(db, 'metadata', 'counters');
      const resetCounter = setDoc(counterRef, removeUndefinedDeep({
        lastHnYear: '',
        lastHnSeq: 0
      }), { merge: true });

      await Promise.all([...visitDeletes, ...patientDeletes, resetCounter]);
      
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'รีเซ็ตระบบสำเร็จ',
        message: 'ข้อมูลผู้ป่วยและประวัติการรับบริการทั้งหมดถูกลบเรียบร้อยแล้ว'
      });
    } catch (error) {
      console.error('Reset system error:', error);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถรีเซ็ตระบบได้ กรุณาลองใหม่อีกครั้ง'
      });
    }
  };

  const updateOpdCoverLayout = async (layout: OpdCoverLayout) => {
    try {
      await setDoc(doc(db, 'metadata', 'opdCoverLayout'), removeUndefinedDeep({
        layout: normalizeOpdCoverLayout(layout),
        updatedAt: new Date().toISOString()
      }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'metadata/opdCoverLayout');
      throw error;
    }
  };

  const resetOpdCoverLayout = async () => {
    await updateOpdCoverLayout(DEFAULT_OPD_COVER_LAYOUT);
  };

  return (
    <AppContext.Provider value={{
      user, isAuthReady, login, logout,
      patients, visits, vaccines, opdCoverLayout,
      activeVisitId, setActiveVisitId,
      modalConfig, setModalConfig,
      registerPatient, updatePatient, deletePatient, openVisit, updateVisitStatus, updateVaccineStock,
      addVaccine, updateVaccine, deleteVaccine, voidVisit, resetSystem,
      updateOpdCoverLayout, resetOpdCoverLayout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
