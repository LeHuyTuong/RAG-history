import { useNavigate } from 'react-router-dom';

const PageHeader = ({ 
  title, 
  subtitle, 
  actionLabel, 
  actionHref, 
  actionIcon = 'add',
  onActionClick 
}) => {
  const navigate = useNavigate();
  
  const handleActionClick = () => {
    if (onActionClick) {
      onActionClick();
    } else if (actionHref) {
      navigate(actionHref);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-low to-white border border-outline-variant/30 p-8 shadow-sm mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <span className="material-symbols-outlined text-[150px] leading-none">{actionIcon}</span>
      </div>
      
      <div className="relative z-10">
        <h2 className="font-headline text-4xl lg:text-5xl text-primary font-bold italic tracking-tight mb-3">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      
      {(actionLabel || actionHref) && (
        <button
          onClick={handleActionClick}
          className="relative z-10 bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary-container hover:-translate-y-1 active:scale-95 shadow-md hover:shadow-lg font-body font-bold uppercase text-[11px] tracking-widest transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">{actionIcon}</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default PageHeader;