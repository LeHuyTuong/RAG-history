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

  // Premium gradients array
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
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${stats.length <= 2 ? 'xl:grid-cols-4' : ''}`}>
      {stats.map((stat, idx) => {
        return (
          <div key={idx} className={`relative overflow-hidden bg-gradient-to-br bg-white/80 ${gradients[idx % gradients.length]} border backdrop-blur-xl p-8 rounded-[2rem] transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 group`}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] mix-blend-overlay"></div>
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/60 rounded-full blur-3xl group-hover:bg-white/80 transition-colors pointer-events-none"></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex flex-col gap-1">
                <p className="text-on-surface-variant font-body text-[11px] font-bold uppercase tracking-widest opacity-80">
                  {stat.title || stat.label}
                </p>
                <h3 className="text-[2.5rem] leading-none font-headline text-on-surface font-black tracking-tight mt-1 group-hover:scale-105 transition-transform origin-left">
                  {stat.value}
                </h3>
                {stat.sub && (
                  <p className="text-[10px] text-emerald-600 mt-4 flex items-center gap-1 font-bold bg-emerald-50 w-fit px-2 py-1 rounded-md border border-emerald-100">
                    <span className="material-symbols-outlined text-[12px]">trending_up</span> {stat.sub}
                  </p>
                )}
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${iconColors[idx % iconColors.length]} group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3`}>
                <span className="material-symbols-outlined text-3xl">{stat.icon}</span>
              </div>
            </div>
            
            {/* Decorative bottom line */}
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-10 w-full group-hover:opacity-30 transition-opacity"></div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsGrid;
