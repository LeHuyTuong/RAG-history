import React from 'react';

const StatsGrid = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-full h-32 flex items-center justify-center text-on-surface-variant font-body text-sm bg-surface-low/50 rounded-2xl border border-outline-variant/60 animate-pulse">
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  if (!stats || stats.length === 0) return null;

  // Premium gradients array for 6 stats cards
  const gradients = [
    'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 shadow-indigo-500/5',
    'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5',
    'from-rose-500/10 to-rose-500/5 border-rose-500/20 shadow-rose-500/5',
    'from-amber-500/10 to-amber-500/5 border-amber-500/20 shadow-amber-500/5',
    'from-sky-500/10 to-sky-500/5 border-sky-500/20 shadow-sky-500/5',
    'from-fuchsia-500/10 to-fuchsia-500/5 border-fuchsia-500/20 shadow-fuchsia-500/5'
  ];

  const iconColors = [
    'text-indigo-600 bg-indigo-500/10 shadow-indigo-500/20',
    'text-emerald-600 bg-emerald-500/10 shadow-emerald-500/20',
    'text-rose-600 bg-rose-500/10 shadow-rose-500/20',
    'text-amber-600 bg-amber-500/10 shadow-amber-500/20',
    'text-sky-600 bg-sky-500/10 shadow-sky-500/20',
    'text-fuchsia-600 bg-fuchsia-500/10 shadow-fuchsia-500/20'
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {stats.map((stat, idx) => {
        const hoverShadows = [
          'hover:shadow-indigo-500/15 hover:border-indigo-500/40',
          'hover:shadow-emerald-500/15 hover:border-emerald-500/40',
          'hover:shadow-rose-500/15 hover:border-rose-500/40',
          'hover:shadow-amber-500/15 hover:border-amber-500/40',
          'hover:shadow-sky-500/15 hover:border-sky-500/40',
          'hover:shadow-fuchsia-500/15 hover:border-fuchsia-500/40'
        ];

        return (
          <div 
            key={idx} 
            className={`relative overflow-hidden bg-gradient-to-br bg-white/85 ${gradients[idx % gradients.length]} border backdrop-blur-xl p-6 rounded-[2rem] transition-all duration-500 hover:-translate-y-1.5 group ${hoverShadows[idx % hoverShadows.length]}`}
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>
            <div className="absolute -right-10 -top-10 w-28 h-28 bg-white/60 rounded-full blur-3xl group-hover:bg-white/80 transition-colors pointer-events-none"></div>
            
            <div className="flex items-center justify-between relative z-10 gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <p className="text-on-surface-variant font-body text-[10px] lg:text-[11px] font-bold uppercase tracking-wider truncate opacity-85" title={stat.title || stat.label}>
                  {stat.title || stat.label}
                </p>
                <h3 className="text-3xl lg:text-[2.2rem] leading-none font-headline text-on-surface font-black tracking-tight mt-1 group-hover:scale-105 transition-transform origin-left">
                  {stat.value}
                </h3>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0 ${iconColors[idx % iconColors.length]} group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3`}>
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
            </div>
            
            {/* Decorative bottom line */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-10 w-full group-hover:opacity-30 transition-opacity"></div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsGrid;
