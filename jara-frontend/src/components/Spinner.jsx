/** Inline spinner. Inherits `currentColor` — set `style.color` to theme it. */
export default function Spinner({ size = 20, style = {}, ariaLabel = 'Loading' }) {
  return (
    <span
      className="spinner"
      role="status"
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, Math.round(size / 10)),
        display: 'inline-block',
        verticalAlign: '-3px',
        ...style,
      }}
    />
  );
}
