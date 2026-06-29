import React from 'react';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className = ''
}) => {
  if (totalItems === 0) return null;

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      
      if (start === 1) {
        end = maxVisible;
      } else if (end === totalPages) {
        start = totalPages - maxVisible + 1;
      }
      
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-outline-variant bg-surface-low/30 font-body text-xs text-on-surface-variant ${className}`}>
      {/* Information text */}
      <div className="flex items-center gap-2">
        <span className="opacity-80">Hiển thị</span>
        <span className="font-bold text-on-surface">{startIdx}-{endIdx}</span>
        <span className="opacity-80">trong tổng số</span>
        <span className="font-bold text-[#6b0f0d]">{totalItems}</span>
        <span className="opacity-80">bản ghi</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Items per page selector */}
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="opacity-80">Số hàng:</span>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-outline-variant/60 rounded-lg font-bold text-on-surface outline-none cursor-pointer focus:border-[#6b0f0d] transition-all"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[16px] text-on-surface-variant">expand_more</span>
            </div>
          </div>
        )}

        {/* Page Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-outline-variant/60 hover:bg-[#6b0f0d]/10 hover:text-[#6b0f0d] transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          {getPageNumbers().map(p => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all border cursor-pointer ${currentPage === p ? 'bg-[#6b0f0d] border-[#6b0f0d] text-[#ffe7b0] shadow-sm' : 'border-outline-variant/60 hover:bg-[#6b0f0d]/10 hover:text-[#6b0f0d]'}`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-outline-variant/60 hover:bg-[#6b0f0d]/10 hover:text-[#6b0f0d] transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
