import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

export const CustomModal = () => {
  const { modalConfig, setModalConfig } = useAppContext();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (modalConfig.isOpen) {
      setInputValue(modalConfig.defaultValue || '');
    }
  }, [modalConfig.isOpen, modalConfig.defaultValue]);

  if (!modalConfig.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{modalConfig.title}</h3>
        <p className="text-sm text-gray-600 mb-5 whitespace-pre-line leading-relaxed">{modalConfig.message}</p>
        
        {modalConfig.type === 'prompt' && (
          <input 
            autoFocus
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 outline-none"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
        )}

        <div className="flex justify-end gap-3 mt-2">
          {modalConfig.type !== 'alert' && (
            <button 
              onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
          )}
          <button 
            onClick={() => {
              if (modalConfig.onConfirm) {
                modalConfig.onConfirm(modalConfig.type === 'prompt' ? inputValue : undefined);
              }
              setModalConfig({ ...modalConfig, isOpen: false });
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors"
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
};
