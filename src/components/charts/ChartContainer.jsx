import { useState, useRef, useEffect } from 'react';

export default function ChartContainer({ height = 288, children }) {
  const ref = useRef(null);
  const [dims, setDims] = useState({ width: 0, height });

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        if (w > 0) setDims({ width: w, height });
      }
    });
    ro.observe(ref.current);
    // initial measurement
    const w = Math.floor(ref.current.getBoundingClientRect().width);
    if (w > 0) setDims({ width: w, height });
    return () => ro.disconnect();
  }, [height]);

  return (
    <div ref={ref} style={{ width: '100%', height, position: 'relative' }}>
      {dims.width > 0 && children(dims.width, dims.height)}
    </div>
  );
}
