import {  useRef  } from 'react';

const ImageUpload = ({ previewUrl, onImageChange, onRemove, label = 'Ảnh bìa', hint = 'Tải lên' }) => {
  const fileInputRef = useRef(null);

  const removeImage = (e) => {
    e.stopPropagation();
    onRemove();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4 pt-4 border-t border-outline-variant/40 relative z-10">
      <p className="font-body text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
        <span className="material-symbols-outlined text-[14px]">image</span> {label}
      </p>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={onImageChange}
      />
      <div
        onClick={() => fileInputRef.current.click()}
        className="relative aspect-video bg-surface-low/50 border border-dashed border-primary/40 rounded-2xl flex flex-col items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-300 group overflow-hidden"
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-sm">
              <span className="text-white font-body text-[11px] font-bold uppercase tracking-widest">Thay đổi</span>
              <button
                onClick={removeImage}
                className="p-2.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 hover:scale-110 transition-all shadow-lg"
                title="Xóa ảnh"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-xl text-primary">add_photo_alternate</span>
            </div>
            <span className="font-body text-[10px] font-bold uppercase tracking-wider text-primary">{hint}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
