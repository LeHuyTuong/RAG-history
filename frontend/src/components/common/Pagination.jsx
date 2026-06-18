import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="mt-16 flex justify-center items-center gap-4 relative z-10 w-full pb-8">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`w-10 h-10 rounded-sm border flex items-center justify-center transition-all bg-[#fffdf8] 
          ${currentPage === 1 ? 'border-[#d99b4a]/40 text-[#6b0f0d]/40 cursor-not-allowed' : 'border-[#d99b4a]/60 text-[#6b0f0d] hover:bg-[#d99b4a]/20 cursor-pointer'}`}
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      {pages.map((page, idx) => (
        page === '...' ? (
          <span key={`dots-${idx}`} className="text-[#6b0f0d] font-body tracking-widest px-2">...</span>
        ) : (
          <button 
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-sm font-bold text-[13px] transition-all
              ${currentPage === page 
                ? 'bg-[#6b0f0d] text-[#ffe7b0] shadow-lg border border-[#6b0f0d]' 
                : 'border border-[#d99b4a]/60 text-[#6b0f0d] hover:bg-[#d99b4a]/20 bg-[#fffdf8]'}`}
          >
            {page}
          </button>
        )
      ))}

      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`w-10 h-10 rounded-sm border flex items-center justify-center transition-all bg-[#fffdf8] 
          ${currentPage === totalPages ? 'border-[#d99b4a]/40 text-[#6b0f0d]/40 cursor-not-allowed' : 'border-[#d99b4a]/60 text-[#6b0f0d] hover:bg-[#d99b4a]/20 cursor-pointer'}`}
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
};

export default Pagination;
