import { Visit, Vaccine } from '../types';
import { removeUndefinedDeep } from './firestoreData';

export type PaymentStatus = 'unpaid' | 'paid';
export type DispenseStatus = 'pending' | 'dispensed';

export type OrderDraft = {
  id: string;
  doseNumber?: number;
  doseLabel?: string;
  quantity?: number;
};

export const VACCINE_HISTORY_COLUMNS = [
  { key: 'dose1', label: 'เข็มที่ 1' },
  { key: 'dose2', label: 'เข็มที่ 2' },
  { key: 'dose3', label: 'เข็มที่ 3' },
  { key: 'booster', label: 'เข็มกระตุ้น' },
  { key: 'unspecified', label: 'ไม่ระบุเข็ม' },
] as const;

export type VaccineHistoryColumnKey = typeof VACCINE_HISTORY_COLUMNS[number]['key'];

export const getOrderKey = (order: any, index = 0) =>
  String(order?.orderId || order?.id || `order-${index}`);

export const getOrderQuantity = (order: any) => {
  const quantity = Number(order?.quantity);
  return Number.isFinite(quantity) && quantity > 0 ? Math.max(1, Math.floor(quantity)) : 1;
};

export const getOrderLineTotal = (order: any) =>
  (Number(order?.price) || 0) * getOrderQuantity(order);

export const getDoseSelectionValue = (item: any) => {
  if (item?.doseLabel) {
    return String(item.doseLabel).startsWith('เข็มที่ ')
      ? String(item.doseLabel).replace('เข็มที่ ', '')
      : String(item.doseLabel);
  }
  if (item?.doseNumber !== undefined && item?.doseNumber !== null && item?.doseNumber !== '') {
    return String(item.doseNumber);
  }
  return '';
};

export const getNumericDoseValue = (item: any) => {
  const dose = Number(item?.doseNumber);
  return dose >= 1 && dose <= 3 ? String(dose) : '';
};

export const applyDoseSelection = <T extends Record<string, any>>(item: T, selectedDose: string) => {
  const { doseNumber, doseLabel, ...rest } = item;
  const isNumericDose = /^\d+$/.test(selectedDose);
  return omitUndefinedFields({
    ...rest,
    ...(isNumericDose ? { doseNumber: Number(selectedDose) } : {}),
    ...(!isNumericDose && selectedDose ? { doseLabel: selectedDose } : {}),
  }) as Partial<T>;
};

export const isOrderPaid = (order: any, visit?: Visit) => {
  if (order?.paymentStatus === 'paid') return true;
  if (order?.paymentStatus === 'unpaid') return false;
  return Boolean(visit?.data?.paidAt);
};

export const isOrderDispensed = (order: any, visit?: Visit) => {
  if (order?.dispenseStatus === 'dispensed') return true;
  if (order?.dispenseStatus === 'pending') return false;
  return Boolean(visit?.data?.dispensedAt);
};

export const getUnpaidOrders = (visit: Visit) =>
  (visit.data?.orders || []).filter((order: any) => !isOrderPaid(order, visit));

export const getPaidOrders = (visit: Visit) =>
  (visit.data?.orders || []).filter((order: any) => isOrderPaid(order, visit));

export const getPendingDispenseOrders = (visit: Visit) =>
  (visit.data?.orders || []).filter((order: any) => !isOrderDispensed(order, visit));

export const getInjectionOrderKey = (item: any, index = 0) =>
  String(item?.orderId || item?.id || item?.vaccineId || `order-${index}`);

export const hasInjectionRecordForOrder = (order: any, index: number, records: any[] = []) => {
  const orderKey = getOrderKey(order, index);
  return records.some((record: any) => {
    if (record?.orderId && record.orderId === orderKey) return true;
    return record?.vaccineId === order?.id &&
      record?.doseNumber === order?.doseNumber &&
      record?.doseLabel === order?.doseLabel;
  });
};

export const getPendingInjectionOrders = (visit: Visit) => {
  const records = Array.isArray(visit.data?.injectionRecords) ? visit.data.injectionRecords : [];
  return (visit.data?.orders || []).filter((order: any, index: number) =>
    !hasInjectionRecordForOrder(order, index, records)
  );
};

export const findDispensedItemForOrder = (visit: Visit, order: any, index = 0) => {
  const orderKey = getOrderKey(order, index);
  const dispensedItems = Array.isArray(visit.data?.dispensedItems) ? visit.data.dispensedItems : [];
  return [...dispensedItems].reverse().find((item: any, itemIndex: number) => {
    if (getInjectionOrderKey(item, itemIndex) === orderKey) return true;
    return item?.id === order?.id &&
      item?.doseNumber === order?.doseNumber &&
      item?.doseLabel === order?.doseLabel;
  });
};

export const getCompletedInjectionRecords = (visit: Visit) => {
  const records = Array.isArray(visit.data?.injectionRecords) ? visit.data.injectionRecords : [];
  if (records.length > 0) {
    return records.map((record: any) => omitUndefinedFields({
      ...record,
      vaccineName: record.vaccineName || record.name,
    }));
  }

  if (visit.status !== 'COMPLETED') return [];

  const orders = Array.isArray(visit.data?.orders) ? visit.data.orders : [];
  const lotsArray = (visit.data?.dispensedLots || '').split(',').map((lot: string) => lot.trim()).filter(Boolean);
  return orders.map((order: any, index: number) => {
    const dispensedItem = findDispensedItemForOrder(visit, order, index);
    return omitUndefinedFields({
      orderId: getOrderKey(order, index),
      vaccineId: order.id,
      vaccineName: order.name,
      quantity: getOrderQuantity(order),
      ...(order.doseNumber !== undefined ? { doseNumber: order.doseNumber } : {}),
      ...(order.doseLabel ? { doseLabel: order.doseLabel } : {}),
      lot: dispensedItem?.lot || lotsArray[index] || lotsArray[0] || '',
      route: (visit.data as any)?.route || (visit.data as any)?.injectionRoute || '',
      site: (visit.data as any)?.site || (visit.data as any)?.injectionSite || '',
      note: '',
    });
  });
};

export const getVaccineHistoryColumnKey = (record: any): VaccineHistoryColumnKey => {
  const doseNumber = Number(record?.doseNumber);
  if (doseNumber >= 1 && doseNumber <= 3) return `dose${doseNumber}` as VaccineHistoryColumnKey;
  if (record?.doseLabel === 'เข็มกระตุ้น') return 'booster';
  return 'unspecified';
};

export const buildVaccineHistoryRows = (records: any[]) => {
  const rowMap = new Map<string, {
    key: string;
    vaccineName: string;
    cells: Record<VaccineHistoryColumnKey, any[]>;
  }>();

  records.forEach((record: any, index: number) => {
    const rowKey = String(record?.vaccineId || record?.vaccineName || record?.name || `vaccine-${index}`);
    const existing = rowMap.get(rowKey);
    const row = existing || {
      key: rowKey,
      vaccineName: record?.vaccineName || record?.name || '-',
      cells: VACCINE_HISTORY_COLUMNS.reduce((acc, column) => {
        acc[column.key] = [];
        return acc;
      }, {} as Record<VaccineHistoryColumnKey, any[]>),
    };

    const columnKey = getVaccineHistoryColumnKey(record);
    const current = row.cells[columnKey][0];
    const recordTime = Date.parse(record?.injectedAt || record?.visitDate || record?.timestamp || '');
    const currentTime = Date.parse(current?.injectedAt || current?.visitDate || current?.timestamp || '');
    if (!current || (Number.isFinite(recordTime) && (!Number.isFinite(currentTime) || recordTime >= currentTime))) {
      row.cells[columnKey] = [record];
    }
    rowMap.set(rowKey, row);
  });

  return Array.from(rowMap.values());
};

export const normalizePaidOrder = (order: any, visit: Visit, index = 0) => removeUndefinedDeep({
  ...order,
  orderId: getOrderKey(order, index),
  paymentStatus: 'paid' as PaymentStatus,
  dispenseStatus: isOrderDispensed(order, visit) ? ('dispensed' as DispenseStatus) : order.dispenseStatus,
});

export const omitUndefinedFields = <T extends Record<string, any>>(data: T) =>
  removeUndefinedDeep(data) as Partial<T>;

export const buildUnpaidOrder = (
  vaccine: Vaccine,
  draft: OrderDraft,
  existingOrder: any | undefined,
  orderedAt: string,
  index: number
) => omitUndefinedFields({
  ...vaccine,
  ...existingOrder,
  ...vaccine,
  orderId: existingOrder?.orderId || `${vaccine.id}-${Date.now()}-${index}`,
  ...(draft.doseNumber !== undefined ? { doseNumber: draft.doseNumber } : {}),
  ...(draft.doseLabel ? { doseLabel: draft.doseLabel } : {}),
  quantity: getOrderQuantity(draft.quantity !== undefined ? draft : existingOrder),
  paymentStatus: 'unpaid' as PaymentStatus,
  dispenseStatus: 'pending' as DispenseStatus,
  orderedAt: existingOrder?.orderedAt || orderedAt,
});

export const formatDoseNumber = (doseNumber?: number | string, doseLabel?: string) => {
  if (doseLabel) return doseLabel;
  if (doseNumber === undefined || doseNumber === null || doseNumber === '') return '';
  return `เข็มที่ ${doseNumber}`;
};
