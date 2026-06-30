import React from 'react';

const DongSonDrumIcon = ({ className = "w-full h-full", color = "currentColor" }) => {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Outer circles */}
      <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="1.5"/>
      <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="0.5"/>
      <circle cx="50" cy="50" r="43" fill="none" stroke={color} strokeWidth="0.5"/>
      
      {/* Middle concentric circles */}
      <circle cx="50" cy="50" r="36" fill="none" stroke={color} strokeWidth="1"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke={color} strokeWidth="0.5"/>
      
      {/* Inner circles */}
      <circle cx="50" cy="50" r="26" fill="none" stroke={color} strokeWidth="1"/>
      <circle cx="50" cy="50" r="24" fill="none" stroke={color} strokeWidth="0.5"/>
      
      {/* Central star (14 point sun) */}
      <path 
        d="M 50 35 L 53 45 L 63 41 L 56 49 L 65 53 L 55 55 L 59 64 L 52 58 L 47 67 L 45 58 L 36 62 L 42 54 L 33 49 L 43 47 L 39 38 L 47 44 Z" 
        fill={color} 
      />
      
      {/* Decorative dots/lines between circles */}
      <g stroke={color} strokeWidth="0.5">
        {[...Array(24)].map((_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const x1 = 50 + 28 * Math.cos(angle);
          const y1 = 50 + 28 * Math.sin(angle);
          const x2 = 50 + 32 * Math.cos(angle);
          const y2 = 50 + 32 * Math.sin(angle);
          return <line key={`l1-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      
      {/* Stylized Chim Lạc (birds) - simplified abstract representation */}
      <g fill={color} opacity="0.8">
        {[...Array(4)].map((_, i) => {
          const angle = (i * 90 * Math.PI) / 180;
          return (
            <g key={`b-${i}`} transform={`rotate(${i * 90}, 50, 50)`}>
              <path d="M 50 8 C 55 8, 58 12, 60 10 C 58 14, 52 14, 50 12 Z" />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default DongSonDrumIcon;
