interface SparklineProps {
  data: Array<{ status: 'success' | 'error' | 'unknown' }>;
  width?: number;
  height?: number;
}

export default function Sparkline({ data, width = 60, height = 16 }: SparklineProps) {
  if (!data || data.length === 0) return null;

  const points = data.slice(-7); // last 7
  const spacing = width / Math.max(points.length - 1, 1);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block">
      {points.map((p, i) => {
        const cx = i * spacing;
        const cy = height / 2;
        const color = p.status === 'success' ? '#00C853' : p.status === 'error' ? '#EE0000' : '#666';
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={2.5}
            fill={color}
            className="sparkline-dot"
          />
        );
      })}
    </svg>
  );
}
