import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

/**
 * Select — native <select> wrapped so the arrow stays plum-coloured
 * across browsers.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {Array<{value:string,label:string}>} props.options
 * @param {string} [props.helper]
 * @param {string} [props.error]
 * @param {boolean} [props.fullWidth=true]
 */
const Select = forwardRef(function Select(
  { label, options, helper, error, fullWidth = true, id, className = '', ...rest },
  ref,
) {
  const uid = useId();
  const inputId = id || `sel-${uid}`;
  const helperId = `${inputId}-helper`;
  const errorId  = `${inputId}-error`;

  const wrapCls = [
    styles.wrap,
    fullWidth ? styles.full : '',
    error ? styles.wrapError : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapCls}>
      <label htmlFor={inputId} className={styles.label}>{label}</label>
      <div className={styles.field}>
        <select
          ref={ref}
          id={inputId}
          className={styles.select}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helper ? helperId : undefined}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={16} className={styles.chev} aria-hidden="true" />
      </div>
      {error
        ? <p id={errorId} className={styles.error}>{error}</p>
        : helper
          ? <p id={helperId} className={styles.helper}>{helper}</p>
          : null}
    </div>
  );
});

export default Select;
