const TableActions = ({ onEdit, onDelete, onArchive, extraActions }) => {
  return (
    <div className="flex justify-end gap-2">
      {onEdit && (
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-500 hover:text-white hover:shadow-md hover:-translate-y-0.5 rounded-lg transition-all duration-300"
          title="Chỉnh sửa"
        >
          <span className="material-symbols-outlined text-[18px]">edit_note</span>
        </button>
      )}
      {onArchive && (
        <button
          onClick={onArchive}
          className="w-8 h-8 flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-500 hover:text-white hover:shadow-md hover:-translate-y-0.5 rounded-lg transition-all duration-300"
          title="Lưu trữ"
        >
          <span className="material-symbols-outlined text-[18px]">archive</span>
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-500 hover:text-white hover:shadow-md hover:-translate-y-0.5 rounded-lg transition-all duration-300"
          title="Xóa bỏ"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      )}
      {extraActions && extraActions}
    </div>
  );
};

export default TableActions;
