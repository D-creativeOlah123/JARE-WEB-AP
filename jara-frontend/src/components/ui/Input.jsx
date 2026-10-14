import { forwardRef, useId } from 'react';
import styles from './Input.module.css';

/**
 * Input — labelled text input with error state + helper text.
 *
 *   <Input label="Full name" value={v} onChange={e => set(e.target.value)}
 *          error={errors.fullName} helper="Nigerian official name" />
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} [props.helper]
 * @param {string} [props.error]       when set, flips the field red and links `aria-describedby`
 * @param {React.ElementType} [props.iconLeft]
 * @param {React.ElementType} [props.iconRight]
 * @param {string} [props.id]
 * @param {boolean} [props.fullWidth=true]
 */
const Input = forwardRef(function Input(
  {
    label,
    helper,
    error,
    iconLeft: IconLeft,
    iconRight: IconRight,
    id,
    fullWidth = true,
    className = '',
    ...rest
  },
  ref,
) {
  const uid = useId();
  const inputId = id || `in-${uid}`;
  const helperId = `${inputId}-helper`;
  const errorId  = `${inputId}-error`;

  const wrapCls = [
    styles.wrap,
    fullWidth ? styles.full : '',
    error     ? styles.wrapError : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapCls}>
      <label htmlFor={inputId} className={styles.label}>{label}</label>
      <div className={styles.field}>
        {IconLeft && <IconLeft size={16} className={styles.iconLeft} aria-hidden="true" />}
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helper ? helperId : undefined}
          {...rest}
        />
        {IconRight && <IconRight size={16} className={styles.iconRight} aria-hidden="true" />}
      </div>
      {error
        ? <p id={errorId}  className={styles.error}>{error}</p>
        : helper
          ? <p id={helperId} className={styles.helper}>{helper}</p>
          : null}
    </div>
  );
});

export default Input;
