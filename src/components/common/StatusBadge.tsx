import React from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../../constants';

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${STATUS_COLORS[status] || 'bg-gray-100 border-gray-200'}`}>
    {STATUS_LABELS[status] || status}
  </span>
);
