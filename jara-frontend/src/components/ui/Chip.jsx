import styles from './Chip.module.css';

/**
 * Chip — small inline label. Three variants, optional leading icon,
 * optional "selected" state (acts as a toggle button when `onSelect` set).
 *
 * @param {object} props
 * @param {'neutral'|'brand'|'success'|'danger'|'warning'|'info'} [props.variant='neutral']
 * @param {React.ElementType} [props.iconLeft]
 * @param {boolean} [props.selected=false]
 * @param {()=>void} [props.onSelect]       when set, renders as an interactive button
 */
export default function Chip({
  variant = 'neutral',
  iconLeft: IconLeft,
  selected = false,
  onSelect,
  children,
  className = '',
  ...rest
}) {
  const cls = [
    styles.chip,
    styles[`v_${variant}`],
    selected ? styles.selected : '',
    onSelect ? styles.interactive : '',
    className,
  ].filter(Boolean).join(' ');

  if (onSelect) {
    return (
      <button type="button" className={cls} onClick={onSelect} aria-pressed={selected} {...rest}>
        {IconLeft && <IconLeft size={12} aria-hidden="true" />}
        {children}
      </button>
    );
  }
  return (
    <span className={cls} {...rest}>
      {IconLeft && <IconLeft size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}
