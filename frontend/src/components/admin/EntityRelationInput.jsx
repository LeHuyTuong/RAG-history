import {  useState  } from 'react';

const EntityRelationInput = ({
  entities,
  availableEntities,
  type = 'location',
  label = 'Di tích liên quan',
  icon = 'location_on',
  itemIcon = 'location_on',
  placeholder = 'Gõ & Enter để thêm...',
  onAdd,
  onRemove
}) => {
  const [inputVal, setInputVal] = useState('');
  const safeEntities = entities || [];
  const datalistId = `datalist-${type}`;

  const getLabel = (e) => (e && (e.name || e.title)) ? (e.name || e.title) : '';
  const getSubLabel = (e) => (e && (e.type || e.title || e.dynasty)) ? (e.type || e.title || e.dynasty) : '';

  const handleChange = (e) => {
    const val = e.target.value;
    setInputVal(val);

    // Auto-add if it matches an option in the datalist exactly
    const isExactMatch = (availableEntities || []).some(ent => getLabel(ent) === val);
    if (isExactMatch && val.trim()) {
      const exists = safeEntities.some(ent => (typeof ent === 'object' ? ent.name : ent) === val.trim());
      if (!exists) {
        onAdd(val.trim());
      }
      setInputVal('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const val = e.target.value.trim();
      const exists = safeEntities.some(ent => (typeof ent === 'object' ? ent.name : ent) === val);
      if (!exists) {
        onAdd(val);
      }
      setInputVal('');
    }
  };

  return (
    <div className="space-y-3 pt-4 border-t border-outline-variant/40 first:border-0 first:pt-0">
      <p className="font-body text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
        <span className="material-symbols-outlined text-[14px]">{icon}</span> {label}
      </p>

      <div className={type === 'character' ? "space-y-2" : "flex flex-wrap gap-2"}>
        {safeEntities.length === 0 ? (
          <span className="text-[10px] font-bold text-on-surface-variant italic">Chưa liên kết</span>
        ) : (
          safeEntities.map((ent, idx) => {
            const isObject = typeof ent === 'object';
            const entityName = isObject ? ent.name : ent;
            const entityRelation = isObject ? ent.relation : '';

            if (type === 'character') {
              return (
                <div key={entityName || idx} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-outline-variant/60 shadow-sm hover:border-primary/50 transition-all group">
                  <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-lg text-primary shrink-0">
                    <span className="material-symbols-outlined text-sm">{itemIcon}</span>
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-xs font-bold text-on-surface truncate">{entityName}</span>
                    {isObject && (
                      <input
                        type="text"
                        value={entityRelation}
                        onChange={(e) => onAdd({ name: entityName, relation: e.target.value }, true)}
                        placeholder="Mối quan hệ..."
                        className="text-[10px] text-on-surface-variant bg-transparent border-b border-outline-variant/30 focus:border-primary outline-none mt-0.5"
                      />
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(ent); }}
                    className="material-symbols-outlined text-[16px] text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all mr-1 shrink-0"
                  >
                    close
                  </button>
                </div>
              );
            }
            return (
              <span key={entityName || idx} className="inline-flex items-center gap-1 bg-surface-low/50 text-on-surface px-3 py-1.5 rounded-xl text-[10px] font-bold border border-outline-variant/60 shadow-sm group">
                {entityName}
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(ent); }}
                  className="material-symbols-outlined text-[14px] opacity-50 hover:opacity-100 hover:text-red-500 transition-all ml-1"
                >
                  close
                </button>
              </span>
            );
          })
        )}
      </div>

      <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 flex items-center mt-2">
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant ml-2">add</span>
        <input
          type="text"
          list={datalistId}
          className="w-full bg-transparent border-none px-2 py-1.5 text-[11px] font-bold text-on-surface outline-none placeholder:text-outline-variant/60 placeholder:font-normal"
          placeholder={placeholder}
          value={inputVal}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <datalist id={datalistId}>
          {(availableEntities || []).map((e, idx) => (
            <option key={e.id || idx} value={getLabel(e)}>{getSubLabel(e)}</option>
          ))}
        </datalist>
      </div>
    </div>
  );
};

export default EntityRelationInput;
