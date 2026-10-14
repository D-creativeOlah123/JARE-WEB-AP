/**
 * Skeleton — animated placeholder for loading state.
 * Uses the `.skeleton` class from global.css so theme swap is automatic.
 */
export default function Skeleton({
  width = '100%',
  height = 12,
  radius = 8,
  style = {},
  className = '',
}) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{
        width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
        display: 'block',
        ...style,
      }}
    />
  );
}

export function SkeletonRow({ gap = 8, count = 3, widths = ['80%', '60%', '40%'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} width={widths[i % widths.length]} height={12} />
      ))}
    </div>
  );
}
