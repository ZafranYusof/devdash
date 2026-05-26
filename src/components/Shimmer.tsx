interface ShimmerProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

export default function Shimmer({ className = '', width, height, rounded }: ShimmerProps) {
  return (
    <div
      className={`shimmer ${rounded ? 'rounded-full' : ''} ${className}`}
      style={{ width, height }}
    />
  );
}

export function ShimmerCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-4 ${className}`}>
      <div className="shimmer h-4 w-1/3 mb-3" />
      <div className="shimmer h-3 w-full mb-2" />
      <div className="shimmer h-3 w-2/3" />
    </div>
  );
}

export function ShimmerList({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="shimmer h-10 w-full" />
      ))}
    </div>
  );
}

export function ShimmerGrid({ cols = 4, rows = 1, className = '' }: { cols?: number; rows?: number; className?: string }) {
  return (
    <div className={`grid gap-3 ${className}`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} className="shimmer h-20 rounded-lg" />
      ))}
    </div>
  );
}
