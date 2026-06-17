const FilterBar = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface-low p-4 rounded-t-xl border border-outline-variant flex flex-wrap items-center gap-4 border-b-0 ${className}`}>
      {children}
    </div>
  );
};

const FilterSelect = ({ label, options, value, onChange, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-outline-variant rounded-md font-body text-sm text-on-surface-variant ${className}`}>
      <span>{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="bg-transparent border-none py-0 cursor-pointer outline-none font-body text-sm"
      >
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

const FilterInput = ({ label, placeholder, value, onChange, type = 'text', className = '' }) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-outline-variant rounded-md font-body text-sm text-on-surface-variant ${className}`}>
      <span>{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="bg-transparent border-none outline-none py-0 w-24 text-sm placeholder:italic font-body"
      />
    </div>
  );
};

export { FilterBar, FilterSelect, FilterInput };