import React from 'react';

const FormHeader = ({ 
  title, 
  subtitle, 
  icon, 
  isEdit, 
  onCancel, 
  onSave, 
  saveText = 'LƯU HỒ SƠ' 
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-end border-b border-outline-variant/40 pb-6 mb-8 gap-4">
      <div>
        <h2 className="font-headline text-4xl font-black tracking-tight bg-gradient-to-r from-[#6b0f0d] to-amber-600 bg-clip-text text-transparent">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body text-sm text-on-surface-variant mt-3 italic flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#6b0f0d]">{icon}</span>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex gap-3 font-body text-xs font-bold tracking-widest">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl border-2 border-[#6b0f0d]/20 text-[#6b0f0d] hover:bg-[#6b0f0d]/5 hover:border-[#6b0f0d]/40 transition-all uppercase cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          onClick={onSave}
          className="px-8 py-2.5 rounded-xl bg-[#6b0f0d] text-[#ffe7b0] hover:bg-[#520a08] shadow-lg shadow-[#6b0f0d]/20 hover:-translate-y-0.5 flex items-center gap-2 transition-all active:scale-95 uppercase border border-[#ffe7b0]/25 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">save</span>
          {isEdit ? 'CẬP NHẬT' : saveText}
        </button>
      </div>
    </div>
  );
};

export default FormHeader;
