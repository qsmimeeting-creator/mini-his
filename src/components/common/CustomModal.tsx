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
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{modalConfig.title}</h3>
        <div className="text-base text-gray-600 mb-8 whitespace-pre-line leading-relaxed">{modalConfig.message}</div>
        
        {modalConfig.type === 'prompt' && (
          <input 
            autoFocus
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-6 outline-none"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
          />
        )}

        <div className="flex justify-end gap-3 mt-4">
          {modalConfig.type !== 'alert' && (
            <button 
              onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
              className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
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
            className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
};
