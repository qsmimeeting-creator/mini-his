import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, History, RotateCcw, XCircle, User, ArrowRight, Activity, Stethoscope, Syringe, Save } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Visit, VisitStatus } from '../types';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { SectionTitle } from '../components/common/SectionTitle';
import { applyDoseSelection, formatDoseNumber, getDoseSelectionValue, getNumericDoseValue, getOrderKey, getOrderQuantity, getCompletedInjectionRecords, omitUndefinedFields } from '../utils/orderWorkflow';
import { VaccineHistoryTable } from '../components/common/VaccineHistoryTable';
import { isVisitToday } from '../utils/visitDate';

const STATUS_LABELS: Record<VisitStatus, { label: string, color: string, step: number }> = {
  'SCREENING_PENDING': { label: 'รอคัดกรอง', color: 'bg-blue-100 text-blue-700', step: 1 },
  'SCREENING_IN_PROGRESS': { label: 'กำลังคัดกรอง', color: 'bg-blue-50 text-blue-600', step: 1 },
  'DOCTOR_PENDING': { label: 'รอพบแพทย์', color: 'bg-indigo-100 text-indigo-700', step: 2 },
  'DOCTOR_IN_PROGRESS': { label: 'กำลังพบแพทย์', color: 'bg-indigo-50 text-indigo-600', step: 2 },
  'POST_DOCTOR_PENDING': { label: 'รอพยาบาลหลังพบแพทย์', color: 'bg-violet-100 text-violet-700', step: 3 },
  'POST_DOCTOR_IN_PROGRESS': { label: 'กำลังตรวจสอบโดยพยาบาล', color: 'bg-violet-50 text-violet-600', step: 3 },
  'PAYMENT_PENDING': { label: 'รอชำระเงิน', color: 'bg-amber-100 text-amber-700', step: 4 },
  'PAYMENT_IN_PROGRESS': { label: 'กำลังชำระเงิน', color: 'bg-amber-50 text-amber-600', step: 4 },
  'DISPENSE_PENDING': { label: 'รอจ่ายยา', color: 'bg-emerald-100 text-emerald-700', step: 5 },
  'DISPENSE_IN_PROGRESS': { label: 'กำลังจ่ายยา', color: 'bg-emerald-50 text-emerald-600', step: 5 },
  'INJECTION_PENDING': { label: 'รอฉีดยา', color: 'bg-cyan-100 text-cyan-700', step: 6 },
  'INJECTION_IN_PROGRESS': { label: 'กำลังฉีดยา', color: 'bg-cyan-50 text-cyan-600', step: 6 },
  'COMPLETED': { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700', step: 7 },
  'VOID': { label: 'ยกเลิก', color: 'bg-red-100 text-red-700', step: 0 }
};

const STEPS = [
  { id: 'SCREENING_PENDING', label: 'จุดคัดกรอง', path: '/screening' },
  { id: 'DOCTOR_PENDING', label: 'ห้องตรวจแพทย์', path: '/doctor' },
  { id: 'POST_DOCTOR_PENDING', label: 'พยาบาลหลังพบแพทย์', path: '/post-doctor' },
  { id: 'PAYMENT_PENDING', label: 'การเงิน', path: '/cashier' },
  { id: 'DISPENSE_PENDING', label: 'ห้องจ่ายยา', path: '/dispense' },
  { id: 'INJECTION_PENDING', label: 'ห้องฉีดยา', path: '/injection' },
  { id: 'COMPLETED', label: 'เสร็จสิ้น', path: '/' }
];

const DOSE_OPTIONS = ['1', '2', '3', 'เข็มกระตุ้น', 'ไม่ระบุเข็ม'];

export default function VisitHistory() {
  const { visits, patients, updateVisitStatus, setModalConfig, setActiveVisitId } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const navigate = useNavigate();

  const filteredVisits = useMemo(() => {
    const todayVisits = visits.filter(v => isVisitToday(v.timestamp));
    if (!searchTerm) return todayVisits.slice(0, 20);
    const lower = searchTerm.toLowerCase();
    return todayVisits.filter(v => 
      v.patientName.toLowerCase().includes(lower) || 
      v.vn.toLowerCase().includes(lower) ||
      v.patientId.toLowerCase().includes(lower)
    ).slice(0, 50);
  }, [visits, searchTerm]);

  const handleRewind = (visit: Visit, targetStatus: VisitStatus) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'ยืนยันการย้อนขั้นตอน',
      message: `คุณต้องการย้อนขั้นตอนของ ${visit.patientName} (${visit.vn}) ไปยัง "${STATUS_LABELS[targetStatus].label}" ใช่หรือไม่?`,
      onConfirm: async () => {
        try {
          await updateVisitStatus(visit.id, targetStatus);
          
          // Set active visit ID and navigate to the relevant page
          const targetStep = STEPS.find(s => s.id === targetStatus);
          if (targetStep && targetStep.path) {
            setActiveVisitId(visit.id);
            navigate(targetStep.path);
          } else {
            setModalConfig({
              isOpen: true,
              type: 'alert',
              title: 'สำเร็จ',
              message: 'ย้อนขั้นตอนเรียบร้อยแล้ว'
            });
          }
          
          if (selectedVisit?.id === visit.id) {
            setSelectedVisit(prev => prev ? { ...prev, status: targetStatus } : null);
          }
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const formatDateTime = (isoString: string) => {
    try {
      return format(parseISO(isoString), 'dd/MM/yyyy HH:mm', { locale: th });
    } catch (e) {
      return isoString;
    }
  };

  const getUsedNumericDosesForOrder = (visit: Visit, targetOrder: any, targetIndex: number) => {
    const targetKey = `${visit.id}:${getOrderKey(targetOrder, targetIndex)}:${targetIndex}`;
    return visits
      .filter(v => v.patientId === visit.patientId && v.status !== 'VOID')
      .flatMap(v => (v.data?.orders || []).map((order: any, index: number) => ({ visit: v, order, index })))
      .filter(({ visit: itemVisit, order, index }) =>
        order?.id === targetOrder?.id &&
        `${itemVisit.id}:${getOrderKey(order, index)}:${index}` !== targetKey
      )
      .reduce((acc: Set<string>, { order }) => {
        const dose = getNumericDoseValue(order);
        if (dose) acc.add(dose);
        return acc;
      }, new Set<string>());
  };

  const handleDoseEdit = async (visit: Visit, orderIndex: number, selectedDose: string) => {
    const orders = Array.isArray(visit.data?.orders) ? visit.data.orders : [];
    const targetOrder = orders[orderIndex];
    if (!targetOrder || !selectedDose) return;

    const usedDoses = getUsedNumericDosesForOrder(visit, targetOrder, orderIndex);
    if (/^\d+$/.test(selectedDose) && usedDoses.has(selectedDose)) {
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'ไม่สามารถแก้เข็มได้',
        message: 'วัคซีนรายการนี้เคยมีเข็มเลขนี้แล้ว กรุณาเลือกเข็มอื่น'
      });
      return;
    }

    const targetOrderKey = getOrderKey(targetOrder, orderIndex);
    const previousDose = getDoseSelectionValue(targetOrder);
    const matchLinkedItem = (item: any) => {
      if (item?.orderId && item.orderId === targetOrderKey) return true;
      const sameVaccine = item?.id === targetOrder.id || item?.vaccineId === targetOrder.id;
      return sameVaccine && getDoseSelectionValue(item) === previousDose;
    };

    const updatedOrders = orders.map((order: any, index: number) => {
      if (index !== orderIndex) return omitUndefinedFields(order);
      return applyDoseSelection({
        ...order,
        orderId: targetOrderKey,
        quantity: getOrderQuantity(order),
      }, selectedDose);
    });

    const updateLinkedDose = (items: any[] = []) => items.map((item: any) => {
      if (!matchLinkedItem(item)) return omitUndefinedFields(item);
      return applyDoseSelection({
        ...item,
        orderId: item.orderId || targetOrderKey,
        quantity: getOrderQuantity(item),
      }, selectedDose);
    });

    const updatedData: any = omitUndefinedFields({
      ...visit.data,
      orders: updatedOrders,
      dispensedItems: updateLinkedDose(Array.isArray(visit.data?.dispensedItems) ? visit.data.dispensedItems : []),
      injectionRecords: updateLinkedDose(Array.isArray(visit.data?.injectionRecords) ? visit.data.injectionRecords : []),
    });

    try {
      await updateVisitStatus(visit.id, visit.status, updatedData);
      setSelectedVisit({ ...visit, data: updatedData });
      setModalConfig({
        isOpen: true,
        type: 'alert',
        title: 'บันทึกเข็มเรียบร้อย',
        message: 'แก้ไขเข็มของรายการวัคซีนแล้ว โดยไม่เปลี่ยนยอดเงินหรือสต็อก'
      });
    } catch (error) {
      console.error(error);
    }
  };

  const renderDoseEditor = (visit: Visit) => {
    const orders = Array.isArray(visit.data?.orders) ? visit.data.orders : [];
    if (orders.length === 0) return null;

    return (
      <section className="bg-white rounded-2xl p-6 border border-gray-200">
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Save size={16} />
          แก้ไขเข็มที่ของรายการวัคซีน
        </h4>
        <div className="space-y-3">
          {orders.map((order: any, index: number) => {
            const usedDoses = getUsedNumericDosesForOrder(visit, order, index);
            const currentDose = getDoseSelectionValue(order);
            return (
              <div key={`${getOrderKey(order, index)}-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 items-center rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{order.name || '-'}</p>
                  <p className="text-xs text-gray-500">
                    {formatDoseNumber(order.doseNumber, order.doseLabel) || 'ไม่ระบุเข็ม'} | {getOrderQuantity(order)} dose
                  </p>
                </div>
                <select
                  value={currentDose}
                  onChange={e => handleDoseEdit(visit, index, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">เลือกเข็ม</option>
                  {DOSE_OPTIONS.map(option => (
                    <option key={option} value={option} disabled={/^\d+$/.test(option) && usedDoses.has(option) && option !== currentDose}>
                      {option}{/^\d+$/.test(option) && usedDoses.has(option) && option !== currentDose ? ' (เคยสั่งแล้ว)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderCompletedVaccines = (visit: Visit) => {
    const completedVaccines = getCompletedInjectionRecords(visit);
    const completedVaccineRecords = completedVaccines.map((record: any) => ({
      ...record,
      visitDate: visit.data?.injectedAt || visit.timestamp,
      vn: visit.vn,
    }));
    return (
      <section className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
        <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Syringe size={16} />
          วัคซีนที่ฉีดสำเร็จแล้ว
        </h4>
        <VaccineHistoryTable records={completedVaccineRecords} />
        <div className="hidden">
        {completedVaccines.length === 0 ? (
          <div className="text-sm text-emerald-700 bg-white border border-emerald-100 rounded-xl px-4 py-3">
            ยังไม่มีประวัติการฉีดวัคซีนสำเร็จ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedVaccines.map((record: any, index: number) => (
              <div key={record.orderId || `${record.vaccineId}-${index}`} className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                    <Syringe size={16} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-gray-900">{record.vaccineName || record.name || '-'}</p>
                    {(record.doseNumber || record.doseLabel) && (
                      <p className="text-[11px] text-blue-600 font-medium">{formatDoseNumber(record.doseNumber, record.doseLabel)}</p>
                    )}
                    <p className="text-[11px] text-gray-500">Lot: {record.lot || '-'}</p>
                    {(record.route || record.site) && (
                      <p className="text-[11px] text-emerald-700 font-medium">{record.route || '-'} | {record.site || '-'}</p>
                    )}
                    {record.note && <p className="text-[11px] text-gray-500">{record.note}</p>}
                    {visit.data?.injectedAt && <p className="text-[10px] text-gray-400">เวลาฉีด: {formatDateTime(visit.data.injectedAt)}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <SectionTitle 
        title="ค้นหาและแก้ไขงาน" 
        subtitle="ค้นหาประวัติการรับบริการเพื่อแก้ไขข้อมูลหรือย้อนขั้นตอนการทำงาน" 
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ป่วย, VN, หรือ HN..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">วัน-เวลา</th>
                <th className="px-6 py-4">VN</th>
                <th className="px-6 py-4">ผู้ป่วย</th>
                <th className="px-6 py-4">สถานะปัจจุบัน</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <History size={48} className="mx-auto mb-3 opacity-20" />
                    <p>ไม่พบข้อมูลการรับบริการ</p>
                  </td>
                </tr>
              ) : (
                filteredVisits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDateTime(visit.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        {visit.vn}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User size={16} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{visit.patientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_LABELS[visit.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[visit.status]?.label || visit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedVisit(visit)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="ดูรายละเอียดและแก้ไข"
                      >
                        <ArrowRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-gray-900/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">รายละเอียด Visit: {selectedVisit.vn}</h3>
                  <p className="text-xs text-gray-500">{selectedVisit.patientName} | {formatDateTime(selectedVisit.timestamp)}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVisit(null)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Current Status & Rewind Options */}
              <section className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-1">สถานะปัจจุบัน</h4>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${STATUS_LABELS[selectedVisit.status]?.color}`}>
                      {STATUS_LABELS[selectedVisit.status]?.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-600 font-medium">ขั้นตอนล่าสุด</p>
                    <p className="text-sm font-bold text-blue-800">{STEPS.find(s => s.id === selectedVisit.status)?.label || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase">ย้อนขั้นตอนการทำงานไปยัง:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STEPS.filter(step => {
                      const currentStep = STATUS_LABELS[selectedVisit.status]?.step || 0;
                      const targetStep = STATUS_LABELS[step.id as VisitStatus]?.step || 0;
                      return targetStep < currentStep && step.id !== 'COMPLETED';
                    }).map((step) => (
                      <button
                        key={step.id}
                        onClick={() => handleRewind(selectedVisit, step.id as VisitStatus)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-blue-200 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all shadow-sm"
                      >
                        <RotateCcw size={14} />
                        {step.label}
                      </button>
                    ))}
                    {selectedVisit.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleRewind(selectedVisit, 'INJECTION_PENDING')}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-blue-200 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all shadow-sm"
                      >
                        <RotateCcw size={14} />
                        ห้องฉีดยา
                      </button>
                    )}
                  </div>
                  {STEPS.filter(step => {
                    const currentStep = STATUS_LABELS[selectedVisit.status]?.step || 0;
                    const targetStep = STATUS_LABELS[step.id as VisitStatus]?.step || 0;
                    return targetStep < currentStep && step.id !== 'COMPLETED';
                  }).length === 0 && selectedVisit.status !== 'COMPLETED' && (
                    <p className="text-xs text-gray-400 italic">ไม่สามารถย้อนขั้นตอนได้มากกว่านี้</p>
                  )}
                </div>
              </section>

              {/* Visit Data Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity size={16} />
                    ข้อมูลคัดกรอง
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">ความดันโลหิต</p>
                        <p className="text-sm font-bold">{selectedVisit.data.bp || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">อุณหภูมิ</p>
                        <p className="text-sm font-bold">{selectedVisit.data.temp ? `${selectedVisit.data.temp} °C` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">น้ำหนัก</p>
                        <p className="text-sm font-bold">{selectedVisit.data.weight ? `${selectedVisit.data.weight} kg` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">ส่วนสูง</p>
                        <p className="text-sm font-bold">{selectedVisit.data.height ? `${selectedVisit.data.height} cm` : '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope size={16} />
                    การวินิจฉัยและสั่งยา
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">การวินิจฉัย</p>
                      <p className="text-sm font-bold">{selectedVisit.data.diagnosis || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">รายการที่สั่ง</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedVisit.data.orders?.map((o: any, i: number) => (
                          <span key={i} className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-md font-medium">
                            {o.name}
                          </span>
                        )) || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {renderDoseEditor(selectedVisit)}

              {renderCompletedVaccines(selectedVisit)}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedVisit(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
