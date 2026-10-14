import Spinner from '../Spinner';
import styles from './Button.module.css';

/**
 * Button — the single source for Jara buttons.
 *
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.loading=false]      replaces iconLeft with a spinner, disables the button
 * @param {boolean} [props.fullWidth=false]
 * @param {React.ElementType} [props.iconLeft]
 * @param {React.ElementType} [props.iconRight]
 * @param {string}  [props.as='button']        pass `as="a"` or `as="Link"` for anchor-style buttons
 * @param {string}  [props.className]
 * @param {boolean} [props.disabled=false]
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  iconLeft: IconLeft,
  iconRight: IconRight,
  as: Comp = 'button',
  className = '',
  disabled = false,
  children,
  ...rest
}) {
  const cls = [
    styles.btn,
    styles[`v_${variant}`],
    styles[`s_${size}`],
    fullWidth ? styles.full : '',
    loading   ? styles.loading : '',
    className,
    'btn-lift',
  ].filter(Boolean).join(' ');

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const spinnerSize = iconSize;

  return (
    <Comp
      {...rest}
      className={cls}
      disabled={Comp === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
    >
      {loading
        ? <Spinner size={spinnerSize} />
        : IconLeft && <IconLeft size={iconSize} aria-hidden="true" />}
      <span className={styles.label}>{children}</span>
      {IconRight && !loading && <IconRight size={iconSize} aria-hidden="true" />}
    </Comp>
  );
}
