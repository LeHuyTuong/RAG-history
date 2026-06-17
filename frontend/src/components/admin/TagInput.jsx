import {  useState  } from 'react';
import { getTagStyle } from '../../utils/tagUtils';

const TagInput = ({ tags, availableTags, onAddTag, onRemoveTag, label = "Phân loại" }) => {
  const [tagInput, setTagInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const safeTags = tags || [];

  const getLabel = (t) => t.label || t.name;
  const getCategory = (t) => t.category || t.type || 'Khác';

  const filteredTags = (availableTags || []).filter(t =>
    getLabel(t).toLowerCase().includes(tagInput.toLowerCase()) &&
    !safeTags.find(existing => existing.toLowerCase().replace(/\s+/g, '') === getLabel(t).toLowerCase().replace(/\s+/g, ''))
  );

  const handleAdd = (tagName) => {
    if (!tagName.trim()) return;
    onAddTag(tagName.trim());
    setTagInput('');
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-outline-variant/40 relative z-20">
      <p className="font-body text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
        <span className="material-symbols-outlined text-[14px]">label</span> {label}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {safeTags.map(t => {
          const style = getTagStyle(t);
          return (
            <span key={t} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border font-body flex items-center gap-1.5 shadow-sm transition-all hover:-translate-y-0.5 cursor-default ${style}`}>
              #{t}
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveTag(t); }}
                className="material-symbols-outlined text-[14px] opacity-50 hover:opacity-100 hover:text-rose-500 transition-all rounded-full"
              >
                cancel
              </button>
            </span>
          );
        })}
      </div>

      <div className="relative pt-1">
        <div className="flex items-center gap-2 border-b border-outline-variant/60 py-2 focus-within:border-primary transition-colors">
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">search</span>
          <input
            className="w-full bg-transparent text-xs font-bold font-body outline-none placeholder:text-outline-variant/60 placeholder:font-normal"
            placeholder="Tìm hoặc thêm mới..."
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tagInput) {
                e.preventDefault();
                if (filteredTags.length > 0) {
                  handleAdd(getLabel(filteredTags[0]));
                } else {
                  handleAdd(tagInput);
                }
              }
            }}
          />
        </div>
        
        {showSuggestions && filteredTags.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white border border-outline-variant/60 shadow-xl max-h-60 overflow-y-auto rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            {filteredTags.map(t => (
              <div
                key={t.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAdd(getLabel(t));
                }}
                className="px-4 py-3 hover:bg-surface-low cursor-pointer flex justify-between items-center transition-colors border-b border-outline-variant/20 last:border-0"
              >
                <span className="font-body text-sm font-bold text-on-surface">{getLabel(t)}</span>
                <span className={`text-[9px] px-2.5 py-1 rounded-md border uppercase font-bold tracking-widest ${t.color || getTagStyle(getCategory(t))}`}>
                  {getCategory(t)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagInput;
