const fs = require('fs');
const content = fs.readFileSync('src/assets/vietnam.svg', 'utf8');
const match = content.match(/<path d=\"([^\"]+)\"/);
if (match) {
  const pathD = match[1].replace(/\n/g, ' ');
  const code = `import React from 'react';

export default function VietnamMap({ className }) {
  return (
    <svg viewBox="0 0 1024 1024" className={className}>
      <g transform="translate(0,1024) scale(0.1,-0.1)" fill="#fcf9ee" stroke="#6b0f0d" strokeWidth="20">
        <path d="${pathD}" />
      </g>
    </svg>
  );
}
`;
  fs.writeFileSync('src/components/VietnamMap.jsx', code);
  console.log('VietnamMap.jsx created successfully.');
} else {
  console.log('Failed to match path.');
}
