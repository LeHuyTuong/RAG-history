const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  icon = 'delete_forever',
  iconColor = 'text-red-600',
  confirmLabel = 'XÁC NHẬN',
  cancelLabel = 'HỦY BỎ',
  confirmColor = 'bg-red-600 hover:bg-red-700',
  onConfirm,
  children,
  size = 'md'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose}></div>
      <div className={`relative bg-white w-full ${sizeClasses[size]} rounded-xl shadow-2xl border-t-4 border-red-600 p-8 text-center animate-in fade-in zoom-in duration-300`}>
        {icon && (
          <span className={`material-symbols-outlined ${iconColor} text-5xl mb-4`}>
            {icon}
          </span>
        )}
        {title && (
          <h3 className="font-headline text-2xl text-on-surface font-bold mb-2">
            {title}
          </h3>
        )}
        {description && (
          <p className="font-body text-sm text-on-surface-variant mb-8 leading-relaxed">
            {description}
          </p>
        )}
        {children}
        <div className="flex gap-4 font-body text-[11px] font-bold tracking-widest mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-outline rounded-lg hover:bg-surface-low transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 text-white rounded-lg shadow-md transition-all ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const ActionModal = ({ 
  isOpen, 
  onClose, 
  type, 
  item, 
  onConfirm,
  title,
  description,
  icon
}) => {
  const isDelete = type === 'delete';
  const isArchive = type === 'archive';
  const isLock = type === 'lock';

  const defaultIcon = isDelete ? 'delete_forever' : isArchive ? 'archive' : isLock ? 'block' : 'help';
  const defaultIconColor = isDelete ? 'text-red-600' : isArchive ? 'text-primary' : isLock ? 'text-red-600' : 'text-primary';
  const defaultConfirmColor = isDelete ? 'bg-red-600 hover:bg-red-700' : isArchive ? 'bg-primary hover:bg-primary-container' : isLock ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-container';
  const defaultConfirmLabel = isDelete ? 'XÓA NGAY' : isArchive ? 'LƯU TRỮ' : isLock ? 'KHÓA' : 'XÁC NHẬN';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (isDelete ? 'Xác nhận xóa vĩnh viễn?' : isArchive ? 'Xác nhận đưa vào lưu trữ?' : isLock ? 'Khóa tài khoản?' : 'Xác nhận thao tác?')}
      description={description || `Bạn có chắc chắn muốn ${isDelete ? 'xóa' : isArchive ? 'lưu trữ' : isLock ? 'khóa' : 'thực hiện'} ${item?.name || item?.title || 'bản ghi này'}?`}
      icon={icon || defaultIcon}
      iconColor={defaultIconColor}
      confirmLabel={defaultConfirmLabel}
      confirmColor={defaultConfirmColor}
      onConfirm={onConfirm}
    />
  );
};

export { Modal, ActionModal };