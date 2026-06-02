import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  User
} from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, runTransaction, getDoc } from 'firebase/firestore';
import { AuditLogEntry, Patient, UserPermission, UserRole, UserRoleProfile, Visit, Vaccine } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { removeUndefinedDeep } from '../utils/firestoreData';
import {
  DEFAULT_OPD_COVER_LAYOUT,
  normalizeOpdCoverLayout,
  type OpdCoverLayout
} from '../utils/opdCoverLayout';
import { getLocalDateKey } from '../utils/visitDate';
import { getOrderKey, getOrderQuantity, omitUndefinedFields } from '../utils/orderWorkflow';
import {
  AppAction,
  canAccessRouteWithAccess,
  canPerformActionWithRoles,
  normalizeRoles,
  resolvePermissionsForRoles,
} from '../utils/permissions';

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
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  changeOwnPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  userRole: UserRoleProfile | null;
  userRoles: UserRole[];
  userPermissions: UserPermission[];
  userProfiles: UserRoleProfile[];
  isRoleReady: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccessRoute: (path: string) => boolean;
  canPerformAction: (action: AppAction) => boolean;
  requireAction: (action: AppAction, message?: string) => boolean;
  patients: Patient[];
  visits: Visit[];
  vaccines: Vaccine[];
  auditLogs: AuditLogEntry[];
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
  dispenseVisitWithStock: (visitId: string, dispenseData: any, orders: any[]) => Promise<void>;
  addVaccine: (vaccine: Vaccine) => Promise<void>;
  updateVaccine: (vaccineId: string, vaccineData: Partial<Vaccine>) => Promise<void>;
  deleteVaccine: (vaccineId: string) => Promise<void>;
  voidVisit: (visitId: string) => Promise<void>;
  resetSystem: () => Promise<void>;
  updateOpdCoverLayout: (layout: OpdCoverLayout) => Promise<void>;
  resetOpdCoverLayout: () => Promise<void>;
  createUserAccount: (data: CreateUserAccountInput) => Promise<void>;
  updateUserAccount: (uid: string, data: UpdateUserAccountInput) => Promise<void>;
  resetUserPassword: (uid: string, password: string) => Promise<void>;
}

export type CreateUserAccountInput = {
  username: string;
  password: string;
  email: string;
  firstname: string;
  surname: string;
  roles: UserRole[];
  permissions: UserPermission[];
};

export type UpdateUserAccountInput = {
  email: string;
  firstname: string;
  surname: string;
  roles: UserRole[];
  permissions: UserPermission[];
  active: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userRole, setUserRole] = useState<UserRoleProfile | null>(null);
  const [userProfiles, setUserProfiles] = useState<UserRoleProfile[]>([]);
  const [isRoleReady, setIsRoleReady] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [opdCoverLayout, setOpdCoverLayout] = useState<OpdCoverLayout>(DEFAULT_OPD_COVER_LAYOUT);
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false, type: '', title: '', message: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setUserRole(null);
      setIsRoleReady(!u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    setIsRoleReady(false);
    const unsubscribe = onSnapshot(doc(db, 'userRoles', user.uid), (snapshot) => {
      if (!snapshot.exists()) {
        setUserRole(null);
        setIsRoleReady(true);
        return;
      }

      const data = snapshot.data();
      const displayName = data.displayName || [data.firstname, data.surname].filter(Boolean).join(' ') || user.displayName || undefined;
      const roles = normalizeRoles(data.roles);
      setUserRole({
        uid: user.uid,
        username: data.username,
        email: data.email || user.email || undefined,
        firstname: data.firstname,
        surname: data.surname,
        displayName,
        roles,
        permissions: resolvePermissionsForRoles(roles, data.permissions),
        active: data.active === true,
        mustChangePassword: data.mustChangePassword === true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      });
      setIsRoleReady(true);
    }, (error) => {
      console.error('Error loading user role:', error);
      setUserRole(null);
      setIsRoleReady(true);
    });

    return () => unsubscribe();
  }, [user]);

  const userRoles = userRole?.active ? userRole.roles : [];
  const userPermissions = userRole?.active ? userRole.permissions || [] : [];

  const hasRole = (roles: UserRole | UserRole[]) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return userRoles.includes('admin') || allowedRoles.some(role => userRoles.includes(role));
  };

  const canAccessRoute = (path: string) => canAccessRouteWithAccess(userRoles, userPermissions, path);

  const canPerformAction = (action: AppAction) => canPerformActionWithRoles(userRoles, action);

  const showPermissionDenied = (message?: string) => {
    setModalConfig({
      isOpen: true,
      type: 'alert',
      title: 'ไม่มีสิทธิ์ดำเนินการ',
      message: message || 'บัญชีผู้ใช้นี้ไม่มีสิทธิ์สำหรับการทำรายการนี้ กรุณาติดต่อผู้ดูแลระบบ'
    });
  };

  const requireAction = (action: AppAction, message?: string) => {
    if (canPerformAction(action)) return true;
    showPermissionDenied(message);
    return false;
  };

  useEffect(() => {
    if (!isAuthReady || !user || !isRoleReady || userRoles.length === 0) return;

    const unsubPatients = onSnapshot(collection(db, 'patients'), (snapshot) => {
      setPatients(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'patients'));

    const unsubVisits = onSnapshot(collection(db, 'visits'), (snapshot) => {
      setVisits(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Visit)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'visits'));

    const unsubVaccines = onSnapshot(collection(db, 'vaccines'), (snapshot) => {
      const vacs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Vaccine));
      if (vacs.length === 0 && canPerformActionWithRoles(userRoles, 'manageVaccine')) {
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

    const unsubAuditLogs = canPerformActionWithRoles(userRoles, 'exportAuditLog')
      ? onSnapshot(collection(db, 'auditLogs'), (snapshot) => {
          setAuditLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuditLogEntry)));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'auditLogs'))
      : () => setAuditLogs([]);

    return () => {
      unsubPatients();
      unsubVisits();
      unsubVaccines();
      unsubOpdCoverLayout();
      unsubAuditLogs();
    };
  }, [isAuthReady, user, isRoleReady, userRoles.join('|')]);

  useEffect(() => {
    if (!isAuthReady || !user || !isRoleReady || !canPerformActionWithRoles(userRoles, 'manageUsers')) {
      setUserProfiles([]);
      return;
    }

    return onSnapshot(collection(db, 'userRoles'), (snapshot) => {
      setUserProfiles(snapshot.docs.map(d => {
        const data = d.data();
        const roles = normalizeRoles(data.roles);
        return {
          uid: d.id,
          username: data.username,
          email: data.email,
          firstname: data.firstname,
          surname: data.surname,
          displayName: data.displayName || [data.firstname, data.surname].filter(Boolean).join(' '),
          roles,
          permissions: resolvePermissionsForRoles(roles, data.permissions),
          active: data.active === true,
          mustChangePassword: data.mustChangePassword === true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy,
        } as UserRoleProfile;
      }));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'userRoles'));
  }, [isAuthReady, user, isRoleReady, userRoles.join('|'), userPermissions.join('|')]);

  const buildAuditLog = (
    action: string,
    targetType: AuditLogEntry['targetType'],
    targetId: string,
    details: Record<string, any> = {}
  ): AuditLogEntry => removeUndefinedDeep({
    action,
    targetType,
    targetId,
    actorId: user?.uid,
    actorName: user?.displayName || user?.email || 'System',
    actorEmail: user?.email || undefined,
    createdAt: new Date().toISOString(),
    details
  });

  const writeAuditLog = async (
    action: string,
    targetType: AuditLogEntry['targetType'],
    targetId: string,
    details: Record<string, any> = {}
  ) => {
    try {
      await setDoc(doc(collection(db, 'auditLogs')), buildAuditLog(action, targetType, targetId, details));
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  };

  const login = async (username: string, password: string) => {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername || !password) throw new Error('กรุณากรอก Username และ Password');

    const usernameSnapshot = await getDoc(doc(db, 'usernames', normalizedUsername));
    if (!usernameSnapshot.exists()) {
      throw new Error('ไม่พบ Username นี้ในระบบ');
    }

    const email = usernameSnapshot.data().email;
    if (!email) throw new Error('บัญชีนี้ยังไม่มี Email สำหรับเข้าสู่ระบบ');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const changeOwnPassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) throw new Error('ไม่พบข้อมูลผู้ใช้งานปัจจุบัน');
    if (newPassword.length < 6) throw new Error('Password ใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
    if (!requireAction('changeOwnPassword')) throw new Error('PERMISSION_DENIED');

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    await updateDoc(doc(db, 'userRoles', user.uid), removeUndefinedDeep({
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    }));
    await writeAuditLog('user.changeOwnPassword', 'user', user.uid);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const registerPatient = async (patientData: Omit<Patient, 'id' | 'hn'>) => {
    if (!requireAction('registerPatient')) throw new Error('PERMISSION_DENIED');
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
      await writeAuditLog('patient.register', 'patient', id, { hn });
      return newPatient;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `patients/${id}`);
      throw error;
    }
  };

  const updatePatient = async (patientId: string, patientData: Partial<Patient>) => {
    if (!requireAction('updatePatient')) throw new Error('PERMISSION_DENIED');
    try {
      await updateDoc(doc(db, 'patients', patientId), removeUndefinedDeep(patientData));
      await writeAuditLog('patient.update', 'patient', patientId, { fields: Object.keys(patientData) });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `patients/${patientId}`);
      throw error;
    }
  };

  const deletePatient = async (patientId: string) => {
    if (!requireAction('deletePatient')) throw new Error('PERMISSION_DENIED');
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'patients', patientId));
      await writeAuditLog('patient.delete', 'patient', patientId);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `patients/${patientId}`);
      throw error;
    }
  };

  const openVisit = async (patient: Patient) => {
    if (!requireAction('openVisit')) return false;
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
      await writeAuditLog('visit.open', 'visit', id, { vn, patientId: patient.id });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `visits/${id}`);
      return false;
    }
  };

  const updateVisitStatus = async (visitId: string, newStatus: string, additionalData: any = {}) => {
    if (!requireAction('updateVisit')) throw new Error('PERMISSION_DENIED');
    const visit = visits.find(v => v.id === visitId);
    if (!visit) return;
    try {
      await updateDoc(doc(db, 'visits', visitId), removeUndefinedDeep({
        status: newStatus,
        data: { ...visit.data, ...additionalData }
      }));
      await writeAuditLog('visit.updateStatus', 'visit', visitId, {
        fromStatus: visit.status,
        toStatus: newStatus,
        dataKeys: Object.keys(additionalData || {})
      });
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
    if (!requireAction('updateStock')) throw new Error('PERMISSION_DENIED');
    try {
      await updateDoc(doc(db, 'vaccines', vaccineId), removeUndefinedDeep({ stock: newStock }));
      await writeAuditLog('vaccine.updateStock', 'vaccine', vaccineId, { newStock });
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
    if (!requireAction('manageVaccine')) throw new Error('PERMISSION_DENIED');
    try {
      await setDoc(doc(db, 'vaccines', vaccine.id), removeUndefinedDeep(vaccine));
      await writeAuditLog('vaccine.add', 'vaccine', vaccine.id, { name: vaccine.name, stock: vaccine.stock });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `vaccines/${vaccine.id}`);
      throw error;
    }
  };

  const updateVaccine = async (vaccineId: string, vaccineData: Partial<Vaccine>) => {
    if (!requireAction('manageVaccine')) throw new Error('PERMISSION_DENIED');
    try {
      await updateDoc(doc(db, 'vaccines', vaccineId), removeUndefinedDeep(vaccineData));
      await writeAuditLog('vaccine.update', 'vaccine', vaccineId, { fields: Object.keys(vaccineData) });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vaccines/${vaccineId}`);
      throw error;
    }
  };

  const deleteVaccine = async (vaccineId: string) => {
    if (!requireAction('manageVaccine')) throw new Error('PERMISSION_DENIED');
    try {
      // In a real app we might want to soft delete or check for dependencies
      // For this HIS app, we'll do a simple delete for now
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'vaccines', vaccineId));
      await writeAuditLog('vaccine.delete', 'vaccine', vaccineId);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vaccines/${vaccineId}`);
      throw error;
    }
  };

  const voidVisit = async (visitId: string) => {
    if (!requireAction('voidVisit')) throw new Error('PERMISSION_DENIED');
    try {
      await updateDoc(doc(db, 'visits', visitId), removeUndefinedDeep({ status: 'VOID' }));
      await writeAuditLog('visit.void', 'visit', visitId);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `visits/${visitId}`);
      throw error;
    }
  };

  const resetSystem = async () => {
    if (!requireAction('resetSystem')) throw new Error('PERMISSION_DENIED');
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
      await writeAuditLog('system.reset', 'system', 'resetSystem', {
        deletedVisits: visitSnapshot.docs.length,
        deletedPatients: patientSnapshot.docs.length
      });
      
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
    if (!requireAction('updateOpdCoverLayout')) throw new Error('PERMISSION_DENIED');
    try {
      await setDoc(doc(db, 'metadata', 'opdCoverLayout'), removeUndefinedDeep({
        layout: normalizeOpdCoverLayout(layout),
        updatedAt: new Date().toISOString()
      }), { merge: true });
      await writeAuditLog('opdCoverLayout.update', 'opdCoverLayout', 'metadata/opdCoverLayout');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'metadata/opdCoverLayout');
      throw error;
    }
  };

  const resetOpdCoverLayout = async () => {
    await updateOpdCoverLayout(DEFAULT_OPD_COVER_LAYOUT);
  };

  const dispenseVisitWithStock = async (visitId: string, dispenseData: any, orders: any[]) => {
    if (!requireAction('updateStock')) throw new Error('PERMISSION_DENIED');
    const visitRef = doc(db, 'visits', visitId);
    const items = Array.isArray(dispenseData?.items) ? dispenseData.items : [];

    try {
      await runTransaction(db, async (transaction) => {
        const visitSnap = await transaction.get(visitRef);
        if (!visitSnap.exists()) throw new Error('VISIT_NOT_FOUND');

        const currentVisit = { id: visitSnap.id, ...visitSnap.data() } as Visit;
        const vaccineDocs = await Promise.all(items.map(async (item: any) => {
          const vaccineRef = doc(db, 'vaccines', item.id);
          const vaccineSnap = await transaction.get(vaccineRef);
          if (!vaccineSnap.exists()) throw new Error(`VACCINE_NOT_FOUND:${item.id}`);
          return { item, vaccineRef, vaccine: vaccineSnap.data() as Vaccine };
        }));

        vaccineDocs.forEach(({ item, vaccineRef, vaccine }) => {
          const quantity = getOrderQuantity(item);
          const currentStock = Number(vaccine.stock || 0);
          if (currentStock < quantity) {
            throw new Error(`STOCK_NOT_ENOUGH:${item.name || item.id}`);
          }
          transaction.update(vaccineRef, removeUndefinedDeep({ stock: currentStock - quantity }));
        });

        const nextData = removeUndefinedDeep({
          ...currentVisit.data,
          ...dispenseData,
          orders,
          dispensedItems: [
            ...(Array.isArray(currentVisit.data?.dispensedItems) ? currentVisit.data.dispensedItems : []),
            ...items.map((item: any, index: number) => omitUndefinedFields({
              ...item,
              orderId: item.orderId || getOrderKey(item, index),
              quantity: getOrderQuantity(item)
            }))
          ],
        });

        transaction.update(visitRef, removeUndefinedDeep({
          status: 'INJECTION_PENDING',
          data: nextData
        }));

        transaction.set(doc(collection(db, 'auditLogs')), buildAuditLog('visit.dispenseWithStock', 'visit', visitId, {
          itemCount: items.length,
          orderIds: items.map((item: any) => item.orderId || item.id),
          quantities: items.map((item: any) => ({ id: item.id, quantity: getOrderQuantity(item) }))
        }));
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `visits/${visitId}`);
      throw error;
    }
  };

  const callAdminApi = async (path: string, method: string, body: Record<string, any>) => {
    if (!requireAction('manageUsers')) throw new Error('PERMISSION_DENIED');
    if (!user) throw new Error('AUTH_REQUIRED');

    const token = await user.getIdToken();
    const response = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.message || 'ไม่สามารถดำเนินการจัดการผู้ใช้งานได้');
    }
    return data;
  };

  const createUserAccount = async (data: CreateUserAccountInput) => {
    await callAdminApi('/api/admin/users/create', 'POST', data);
  };

  const updateUserAccount = async (uid: string, data: UpdateUserAccountInput) => {
    await callAdminApi('/api/admin/users/update', 'PATCH', { uid, ...data });
  };

  const resetUserPassword = async (uid: string, password: string) => {
    await callAdminApi('/api/admin/users/reset-password', 'POST', { uid, password });
  };

  return (
    <AppContext.Provider value={{
      user, isAuthReady, login, logout, changeOwnPassword,
      userRole, userRoles, userPermissions, userProfiles, isRoleReady, hasRole, canAccessRoute, canPerformAction, requireAction,
      patients, visits, vaccines, auditLogs, opdCoverLayout,
      activeVisitId, setActiveVisitId,
      modalConfig, setModalConfig,
      registerPatient, updatePatient, deletePatient, openVisit, updateVisitStatus, updateVaccineStock, dispenseVisitWithStock,
      addVaccine, updateVaccine, deleteVaccine, voidVisit, resetSystem,
      updateOpdCoverLayout, resetOpdCoverLayout,
      createUserAccount, updateUserAccount, resetUserPassword
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
