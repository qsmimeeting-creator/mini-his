import React from 'react';

export const SectionTitle = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-6 flex items-center justify-between">
    <div>
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);
