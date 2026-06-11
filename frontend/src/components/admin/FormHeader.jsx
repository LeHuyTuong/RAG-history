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
        <h2 className="font-headline text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body text-sm text-on-surface-variant mt-3 italic flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">{icon}</span>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex gap-3 font-body text-xs font-bold tracking-widest">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all uppercase"
        >
          Hủy bỏ
        </button>
        <button
          onClick={onSave}
          className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 flex items-center gap-2 transition-all active:scale-95 uppercase"
        >
          <span className="material-symbols-outlined text-sm">save</span>
          {isEdit ? 'CẬP NHẬT' : saveText}
        </button>
      </div>
    </div>
  );
};

export default FormHeader;
