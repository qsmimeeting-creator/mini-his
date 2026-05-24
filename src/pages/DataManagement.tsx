import React, { useState, useMemo } from 'react';
import { 
  Download, Search, Filter, Calendar, 
  TrendingUp, Users, CheckCircle, XCircle,
  FileSpreadsheet, Eye, Settings, AlertTriangle, Trash2
} from 'lucide-react';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, isValid } from 'date-fns';
import * as XLSX from 'xlsx';
import { useAppContext } from '../context/AppContext';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import { PatientDetailsModal } from '../components/common/PatientDetailsModal';
import { getOrderQuantity } from '../utils/orderWorkflow';
import { MINI_HIS_APP_VERSION } from '../utils/version';
import type { AuditLogEntry, Patient, Visit } from '../types';

type ReportRow = Record<string, string | number>;

const dash = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};

const formatDateValue = (value?: string) => {
  if (!value) return '-';
  try {
    const date = parseISO(value);
    return isValid(date) ? format(date, 'yyyy-MM-dd') : value;
  } catch (error) {
    return value;
  }
};

const formatTimeValue = (value?: string) => {
  if (!value) return '-';
  try {
    const date = parseISO(value);
    return isValid(date) ? format(date, 'HH:mm:ss') : '-';
  } catch (error) {
    return '-';
  }
};

const formatDisplayDateTime = (value?: string) => {
  if (!value) return '-';
  try {
    const date = parseISO(value);
    return isValid(date) ? format(date, 'dd/MM/yyyy HH:mm') : value;
  } catch (error) {
    return value;
  }
};

const calculateAge = (birthDate?: string) => {
  if (!birthDate) return '-';
  try {
    const birth = parseISO(birthDate);
    if (!isValid(birth)) return '-';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age.toString() : '-';
  } catch (error) {
    return '-';
  }
};

const formatGender = (gender?: string) => {
  if (gender === 'male') return 'ชาย';
  if (gender === 'female') return 'หญิง';
  return dash(gender);
};

const getPatientForVisit = (visit: Visit, patients: Patient[]) =>
  patients.find(patient => patient.id === visit.patientId);

const getPatientFullName = (patient?: Patient, visit?: Visit) => {
  if (!patient) return dash(visit?.patientName);
  return dash(`${patient.title || ''} ${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patient.name);
};

const getPatientEnglishName = (patient?: Patient) => {
  if (!patient) return '-';
  const name = `${patient.titleEn || ''} ${patient.firstNameEn || ''} ${patient.lastNameEn || ''}`.trim();
  return dash(name);
};

const getPatientAddress = (patient?: Patient) => {
  if (!patient) return '-';
  return dash([
    patient.addressLine1,
    patient.subDistrict,
    patient.district,
    patient.province,
    patient.postalCode
  ].filter(Boolean).join(' '));
};

const getVisitVaccines = (visit: Visit) => {
  const injectionRecords = Array.isArray(visit.data?.injectionRecords) ? visit.data.injectionRecords : [];
  if (injectionRecords.length > 0) return injectionRecords;

  const orders = Array.isArray(visit.data?.orders) ? visit.data.orders : [];
  if (orders.length > 0) {
    const lots = (visit.data?.dispensedLots || '').split(',').map((lot: string) => lot.trim()).filter(Boolean);
    return orders.map((order: any, index: number) => ({
      vaccineId: order.id,
      vaccineName: order.name,
      doseNumber: order.doseNumber,
      doseLabel: order.doseLabel,
      quantity: getOrderQuantity(order),
      lot: lots[index] || lots[0] || '',
      route: '',
      site: '',
      note: ''
    }));
  }

  return [{}];
};

const getVaccineSummary = (visit: Visit) => {
  const records = getVisitVaccines(visit);
  const names = records
    .map((record: any) => record.vaccineName || record.name)
    .filter(Boolean);
  return names.length > 0 ? names.join(', ') : '-';
};

const buildReportRows = (filteredVisits: Visit[], patients: Patient[]): ReportRow[] => {
  return filteredVisits.flatMap(visit => {
    const patient = getPatientForVisit(visit, patients);
    const vaccines = getVisitVaccines(visit);

    return vaccines.map((vaccine: any) => ({
      VN: dash(visit.vn),
      'วันที่รับบริการ': formatDateValue(visit.timestamp),
      'เวลา': formatTimeValue(visit.timestamp),
      'สถานะ': STATUS_LABELS[visit.status] || visit.status,
      'จุดบริการ': dash(visit.servicePoint),
      'ผู้ลงทะเบียน': dash(visit.registeredBy),
      HN: dash(patient?.hn),
      'ชื่อ-นามสกุล': getPatientFullName(patient, visit),
      'ชื่อ-นามสกุล (EN)': getPatientEnglishName(patient),
      'เลขบัตรประชาชน/Passport': dash(patient?.citizenId || patient?.passportNo),
      'วันเกิด': formatDateValue(patient?.birthDate),
      'อายุ': patient?.age?.toString() || calculateAge(patient?.birthDate),
      'เพศ': formatGender(patient?.gender),
      'สัญชาติ': dash(patient?.nationality),
      'โทรศัพท์': dash(patient?.phone),
      'อีเมล': dash(patient?.email),
      'ที่อยู่': getPatientAddress(patient),
      'ชื่อวัคซีน': dash(vaccine.vaccineName || vaccine.name),
      'เข็มที่': dash(vaccine.doseLabel || vaccine.doseNumber),
      'จำนวน dose': dash(vaccine.quantity || 1),
      Lot: dash(vaccine.lot),
      Route: dash(vaccine.route),
      Site: dash(vaccine.site),
      'หมายเหตุการฉีด': dash(vaccine.note),
      'เวลาฉีด': formatDisplayDateTime(visit.data?.injectedAt),
      'วันนัดครั้งถัดไป': formatDateValue(visit.data?.nextAppointmentDate),
      'วัคซีนครั้งถัดไป': dash(visit.data?.nextVaccineName)
    }));
  });
};

const exportToExcel = (rows: ReportRow[], metadata: { startDate: string; endDate: string; visitCount: number }) => {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [
    'VN', 'วันที่รับบริการ', 'เวลา', 'สถานะ', 'จุดบริการ', 'ผู้ลงทะเบียน', 'HN', 'ชื่อ-นามสกุล',
    'ชื่อ-นามสกุล (EN)', 'เลขบัตรประชาชน/Passport', 'วันเกิด', 'อายุ', 'เพศ', 'สัญชาติ',
    'โทรศัพท์', 'อีเมล', 'ที่อยู่', 'ชื่อวัคซีน', 'เข็มที่', 'จำนวน dose', 'Lot', 'Route', 'Site', 'หมายเหตุการฉีด',
    'เวลาฉีด', 'วันนัดครั้งถัดไป', 'วัคซีนครั้งถัดไป'
  ];

  const sheetData = [
    ['รายงานผู้รับบริการและประวัติการรับวัคซีน'],
    [`ช่วงวันที่: ${metadata.startDate} ถึง ${metadata.endDate}`],
    [`วันที่ดาวน์โหลด: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`],
    [`จำนวน Visit: ${metadata.visitCount} | จำนวนแถวรายงาน: ${rows.length}`],
    [],
    headers,
    ...rows.map(row => headers.map(header => row[header] ?? '-'))
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(headers.length - 1, 0) } }
  ];
  worksheet['!cols'] = headers.map(header => ({
    wch: Math.min(Math.max(header.length + 6, 14), header === 'ที่อยู่' ? 48 : 28)
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานผู้รับบริการ');
  XLSX.writeFile(workbook, `report_${metadata.startDate}_to_${metadata.endDate}.xlsx`);
};

const exportAuditLogsToExcel = (logs: AuditLogEntry[]) => {
  const rows = logs
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(log => ({
      'วันที่เวลา': formatDisplayDateTime(log.createdAt),
      Action: log.action,
      'ประเภทข้อมูล': log.targetType,
      'รหัสข้อมูล': log.targetId,
      'ผู้ใช้งาน': log.actorName || log.actorEmail || '-',
      Email: log.actorEmail || '-',
      'รายละเอียด': JSON.stringify(log.details || {})
    }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 28 }, { wch: 16 }, { wch: 24 }, { wch: 24 }, { wch: 28 }, { wch: 60 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Log');
  XLSX.writeFile(workbook, `audit_logs_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
};

export default function DataManagement() {
  const { visits, patients, auditLogs, resetSystem, setModalConfig } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState('all');
  const [vaccineFilter, setVaccineFilter] = useState('all');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const vaccineOptions = useMemo(() => {
    const names = visits
      .flatMap(visit => getVisitVaccines(visit))
      .map((vaccine: any) => vaccine.vaccineName || vaccine.name)
      .filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [visits]);

  // Filtered data
  const filteredVisits = useMemo(() => {
    return visits.filter(visit => {
      const patient = getPatientForVisit(visit, patients);
      let visitDate;
      try {
        visitDate = parseISO(visit.timestamp);
        if (!isValid(visitDate)) return false;
      } catch (e) {
        return false;
      }

      const isWithinDate = isWithinInterval(visitDate, {
        start: startOfDay(parseISO(startDate)),
        end: endOfDay(parseISO(endDate))
      });

      const matchesSearch = 
        visit.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.vn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient?.hn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient?.citizenId || '').includes(searchTerm) ||
        (patient?.passportNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient?.phone || '').replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''));
      const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
      const matchesVaccine = vaccineFilter === 'all' || getVisitVaccines(visit)
        .some((vaccine: any) => (vaccine.vaccineName || vaccine.name) === vaccineFilter);

      return isWithinDate && matchesSearch && matchesStatus && matchesVaccine;
    });
  }, [visits, patients, startDate, endDate, searchTerm, statusFilter, vaccineFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredVisits.length;
    const completed = filteredVisits.filter(v => v.status === 'COMPLETED').length;
    const voided = filteredVisits.filter(v => v.status === 'VOID').length;
    const inProgress = total - completed - voided;

    return { total, completed, voided, inProgress };
  }, [filteredVisits]);

  const reportRows = useMemo(() => buildReportRows(filteredVisits, patients), [filteredVisits, patients]);

  const handleExportToExcel = () => {
    exportToExcel(reportRows, {
      startDate,
      endDate,
      visitCount: filteredVisits.length
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการข้อมูลและรายงาน</h1>
          <p className="text-gray-500">ตรวจสอบข้อมูล กรองรายงาน และดาวน์โหลดข้อมูลสรุปผล</p>
          <p className="text-xs text-gray-400 mt-1">Mini HIS version {MINI_HIS_APP_VERSION}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportToExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium"
          >
            <Download size={18} />
            ดาวน์โหลดรายงาน (Excel)
          </button>
          <button
            onClick={() => exportAuditLogsToExcel(auditLogs)}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium"
          >
            <Download size={18} />
            Audit Log
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
          <Filter size={18} className="text-blue-600" />
          ตัวกรองข้อมูล
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">วันที่เริ่มต้น</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">วันที่สิ้นสุด</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">ค้นหารายชื่อ / VN / HN / เลขบัตร / โทรศัพท์</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ, VN, HN, เลขบัตร, เบอร์โทร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">สถานะ</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">ทุกสถานะ</option>
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">วัคซีน</label>
            <select
              value={vaccineFilter}
              onChange={(e) => setVaccineFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">ทุกวัคซีน</option>
              {vaccineOptions.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Users size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">ผู้รับบริการทั้งหมด</span>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-400 mt-1">ในช่วงเวลาที่เลือก</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">เสร็จสิ้นแล้ว</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
          <div className="text-xs text-gray-400 mt-1">({stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">กำลังดำเนินการ</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
          <div className="text-xs text-gray-400 mt-1">รอรับบริการขั้นตอนต่างๆ</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <XCircle size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">ยกเลิกบริการ</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.voided}</div>
          <div className="text-xs text-gray-400 mt-1">รายการที่ถูก Void</div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <FileSpreadsheet size={20} className="text-emerald-600" />
            รายการผู้รับบริการ
          </div>
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            พบ {filteredVisits.length} รายการ
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">VN</th>
                <th className="px-6 py-4">HN</th>
                <th className="px-6 py-4">ชื่อ-นามสกุล</th>
                <th className="px-6 py-4">เลขบัตร/Passport</th>
                <th className="px-6 py-4">โทรศัพท์</th>
                <th className="px-6 py-4">วัคซีน</th>
                <th className="px-6 py-4">วันเวลาที่รับบริการ</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVisits.length > 0 ? (
                filteredVisits.map((visit) => {
                  const patient = getPatientForVisit(visit, patients);
                  return (
                    <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm font-bold text-blue-600">{visit.vn}</td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-600">{patient?.hn || '-'}</td>
                      <td className="px-6 py-4 font-medium min-w-[180px]">{getPatientFullName(patient, visit)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{patient?.citizenId || patient?.passportNo || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{patient?.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 min-w-[220px]">{getVaccineSummary(visit)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDisplayDateTime(visit.timestamp)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${STATUS_COLORS[visit.status]}`}>
                          {STATUS_LABELS[visit.status] || visit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedPatientId(visit.patientId)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="ดูรายละเอียดผู้ป่วย"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    ไม่พบข้อมูลในช่วงเวลาที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Maintenance */}
      <div className="bg-red-50 rounded-xl border border-red-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="font-bold text-red-900">การดูแลรักษาระบบ (System Maintenance)</h3>
            <p className="text-sm text-red-700">จัดการข้อมูลพื้นฐานและล้างข้อมูลระบบ</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-red-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-500 mt-1 shrink-0" size={20} />
            <div>
              <p className="font-bold text-gray-800">ล้างข้อมูลทั้งหมด (Factory Reset)</p>
              <p className="text-xs text-gray-500">ลบรายชื่อผู้ป่วย ประวัติการรับบริการ และรีเซ็ตเลข HN ทั้งหมด (ไม่สามารถกู้คืนได้)</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setModalConfig({
                isOpen: true,
                type: 'prompt',
                title: 'ยืนยันการล้างข้อมูลทั้งหมด',
                message: 'การล้างข้อมูลไม่สามารถกู้คืนได้ หากต้องการดำเนินการต่อให้พิมพ์ RESET',
                defaultValue: '',
                onConfirm: (value) => {
                  if ((value || '').trim() === 'RESET') {
                    void resetSystem();
                    return;
                  }
                  setModalConfig({
                    isOpen: true,
                    type: 'alert',
                    title: 'ยกเลิกการล้างข้อมูล',
                    message: 'ข้อความยืนยันไม่ถูกต้อง ระบบยังไม่ลบข้อมูลใด ๆ'
                  });
                }
              });
            }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg transition-colors shadow-sm font-bold text-sm"
          >
            <Trash2 size={18} />
            ล้างข้อมูลระบบ
          </button>
        </div>
      </div>

      {selectedPatientId && (
        <PatientDetailsModal 
          patientId={selectedPatientId} 
          onClose={() => setSelectedPatientId(null)} 
        />
      )}
    </div>
  );
}
