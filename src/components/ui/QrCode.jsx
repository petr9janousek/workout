import { useEffect, useState } from 'react';
import { pack } from '../../data/transfer.js';

// Shows `data` as a QR code for another phone to scan (see ScanCode).
// Black on white whatever the theme, with the white margin scanners need.
// The QR library loads only when a code is first shown.
export default function QrCode({ data, label }) {
  const [code, setCode] = useState(null); // { size, path }

  useEffect(() => {
    let current = true;
    Promise.all([pack(data), import('qrcode-generator')]).then(([bytes, { default: qrcode }]) => {
      const qr = qrcode(0, 'L'); // smallest code that fits; L = least error correction, fewest squares
      qr.addData(String.fromCharCode(...bytes), 'Byte');
      qr.make();
      const size = qr.getModuleCount();
      let path = '';
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (!qr.isDark(y, x)) continue;
          let run = 1; // one rectangle per run of dark squares
          while (x + run < size && qr.isDark(y, x + run)) run++;
          path += `M${x} ${y}h${run}v1h-${run}z`;
          x += run - 1;
        }
      }
      if (current) setCode({ size, path });
    });
    return () => {
      current = false;
    };
  }, [data]);

  if (!code) return <div className="qr qr-loading" aria-label="Making the code…" />;
  const m = 4; // margin, in squares
  return (
    <svg className="qr" viewBox={`${-m} ${-m} ${code.size + 2 * m} ${code.size + 2 * m}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect x={-m} y={-m} width={code.size + 2 * m} height={code.size + 2 * m} fill="#fff" />
      <path d={code.path} fill="#000" />
    </svg>
  );
}
