import React from 'react';

const FormHeader = ({
  title,
  subtitle,
  icon,
  isEdit,
  onCancel,
  onSave,
  loading,
  saveText: overrideSaveText,
  status, // 'draft', 'published', 'hidden', etc.
  contentType, // 'article', 'entity', 'setting', etc.
  hideSave,
  hideCancel
}) => {
  let computedSaveText = isEdit ? 'CẬP NHẬT' : 'LƯU HỒ SƠ';
  const st = status ? status.toLowerCase() : '';

  if (st === 'draft' || st === 'bản nháp') {
    computedSaveText = 'LƯU BẢN NHÁP';
  } else if (st === 'published' || st === 'công khai' || !st) {
    if (contentType === 'article') {
      computedSaveText = 'XUẤT BẢN';
    } else {
      computedSaveText = 'LƯU HỒ SƠ';
    }
  }

  const finalSaveText = overrideSaveText || computedSaveText;

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
        {!hideCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl border-2 border-[#6b0f0d]/20 text-[#6b0f0d] hover:bg-[#6b0f0d]/5 hover:border-[#6b0f0d]/40 transition-all uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy bỏ
          </button>
        )}
        {!hideSave && (
          <button
            onClick={onSave}
            disabled={loading}
            className="px-8 py-2.5 rounded-xl bg-[#6b0f0d] text-[#ffe7b0] hover:bg-[#520a08] shadow-lg shadow-[#6b0f0d]/20 hover:-translate-y-0.5 flex items-center gap-2 transition-all active:scale-95 uppercase border border-[#ffe7b0]/25 cursor-pointer disabled:opacity-50 disabled:hover:-translate-y-0 disabled:active:scale-100 disabled:cursor-wait"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-[#ffe7b0] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="material-symbols-outlined text-sm">save</span>
            )}
            {finalSaveText}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormHeader;
