import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User, signInAnonymously } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { Patient, Visit, Vaccine } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestore';

interface ModalConfig {
  isOpen: boolean;
  type: string;
  title: string;
  message: string;
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
  modalConfig: ModalConfig;
  setModalConfig: (config: ModalConfig) => void;
  registerPatient: (patient: Omit<Patient, 'id' | 'hn'>) => Promise<Patient>;
  updatePatient: (patientId: string, patientData: Partial<Patient>) => Promise<void>;
  deletePatient: (patientId: string) => Promise<void>;
  openVisit: (patient: Patient) => Promise<void>;
  updateVisitStatus: (visitId: string, newStatus: string, additionalData?: any) => Promise<void>;
  updateVaccineStock: (vaccineId: string, newStock: number) => Promise<void>;
  addVaccine: (vaccine: Vaccine) => Promise<void>;
  updateVaccine: (vaccineId: string, vaccineData: Partial<Vaccine>) => Promise<void>;
  deleteVaccine: (vaccineId: string) => Promise<void>;
  voidVisit: (visitId: string) => Promise<void>;
  resetSystem: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false, type: '', title: '', message: ''
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
        const INITIAL_VACCINES = [
          { id: 'V01', name: 'Influenza (4-strain)', price: 850, stock: 50, lot: 'LOT-FLU-2026A' },
          { id: 'V02', name: 'HPV (9-valent)', price: 6500, stock: 20, lot: 'LOT-HPV-2026B' },
          { id: 'V03', name: 'Hepatitis B', price: 600, stock: 100, lot: 'LOT-HEPB-2026C' }
        ];
        INITIAL_VACCINES.forEach(v => {
          setDoc(doc(db, 'vaccines', v.id), v).catch(e => handleFirestoreError(e, OperationType.CREATE, `vaccines/${v.id}`));
        });
      } else {
        setVaccines(vacs);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'vaccines'));

    return () => {
      unsubPatients();
      unsubVisits();
      unsubVaccines();
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

      const newPatient = { id, hn, ...patientData };
      await setDoc(doc(db, 'patients', id), newPatient);
      return newPatient;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `patients/${id}`);
      throw error;
    }
  };

  const updatePatient = async (patientId: string, patientData: Partial<Patient>) => {
    try {
      await updateDoc(doc(db, 'patients', patientId), patientData);
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
    const id = `V${Date.now()}`;
    const newVisit: Visit = {
      id,
      vn: `VN-${Math.floor(Math.random() * 100000)}`,
      patientId: patient.id,
      patientName: patient.name,
      status: 'SCREENING_PENDING',
      timestamp: new Date().toISOString(),
      data: {}
    };
    try {
      await setDoc(doc(db, 'visits', id), newVisit);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `visits/${id}`);
    }
  };

  const updateVisitStatus = async (visitId: string, newStatus: string, additionalData: any = {}) => {
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;
    try {
      await updateDoc(doc(db, 'visits', visitId), {
        status: newStatus,
        data: { ...visit.data, ...additionalData }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `visits/${visitId}`);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
      });
    }
  };

  const updateVaccineStock = async (vaccineId: string, newStock: number) => {
    try {
      await updateDoc(doc(db, 'vaccines', vaccineId), { stock: newStock });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vaccines/${vaccineId}`);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'เกิดข้อผิดพลาด',
        message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
      });
    }
  };

  const addVaccine = async (vaccine: Vaccine) => {
    try {
      await setDoc(doc(db, 'vaccines', vaccine.id), vaccine);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `vaccines/${vaccine.id}`);
      throw error;
    }
  };

  const updateVaccine = async (vaccineId: string, vaccineData: Partial<Vaccine>) => {
    try {
      await updateDoc(doc(db, 'vaccines', vaccineId), vaccineData);
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
      await updateDoc(doc(db, 'visits', visitId), { status: 'VOID' });
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
      const resetCounter = setDoc(counterRef, {
        lastHnYear: '',
        lastHnSeq: 0
      }, { merge: true });

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

  return (
    <AppContext.Provider value={{
      user, isAuthReady, login, logout,
      patients, visits, vaccines,
      modalConfig, setModalConfig,
      registerPatient, updatePatient, deletePatient, openVisit, updateVisitStatus, updateVaccineStock,
      addVaccine, updateVaccine, deleteVaccine, voidVisit, resetSystem
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
