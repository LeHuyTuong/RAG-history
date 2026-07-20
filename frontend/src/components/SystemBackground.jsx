import DongSonDrumIcon from './DongSonDrumIcon';

const SystemBackground = ({ backgroundUrl, tintClassName = 'bg-[#fbf6e8]/82', fallbackColor = 'text-[#6b0f0d]' }) => {
  if (backgroundUrl) {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
        <div className={`absolute inset-0 ${tintClassName}`} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center opacity-[0.03]">
      <DongSonDrumIcon className={`w-[150vw] h-[150vw] ${fallbackColor} animate-[spin_120s_linear_infinite]`} />
    </div>
  );
};

export default SystemBackground;
