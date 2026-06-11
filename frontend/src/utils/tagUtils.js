export const getTagStyle = (tagName) => {
  if (!tagName) return 'bg-surface-variant/30 text-on-surface-variant border-outline-variant/50';
  const palettes = [
    'bg-amber-50 text-amber-700 border-amber-200',
    'bg-rose-50 text-rose-700 border-rose-200',
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'bg-sky-50 text-sky-700 border-sky-200',
    'bg-purple-50 text-purple-700 border-purple-200',
    'bg-teal-50 text-teal-700 border-teal-200',
    'bg-cyan-50 text-cyan-700 border-cyan-200',
    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    'bg-orange-50 text-orange-700 border-orange-200',
    'bg-indigo-50 text-indigo-700 border-indigo-200',
    'bg-pink-50 text-pink-700 border-pink-200',
  ];
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palettes[Math.abs(hash) % palettes.length];
};
