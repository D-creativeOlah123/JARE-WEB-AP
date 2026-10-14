import styles from './Band.module.css';

/**
 * Band — full-bleed section wrapper that locks a 1180px inner container
 * and paints a light or dark surface based on `tone`.
 *
 *   <Band tone="dark" id="hero" labelledBy="hero-title">
 *     ...
 *   </Band>
 *
 * On dark theme the "light" tone maps to `--color-bg-elev` so the page
 * still alternates visually.
 *
 * @param {object} props
 * @param {'dark'|'light'} [props.tone='light']
 * @param {string} [props.as='section']
 * @param {string} [props.id]
 * @param {string} [props.labelledBy]        aria-labelledby target
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export default function Band({
  tone = 'light',
  as: Tag = 'section',
  id,
  labelledBy,
  className = '',
  children,
  ...rest
}) {
  const toneClass = tone === 'dark' ? styles.dark : styles.light;
  return (
    <Tag
      id={id}
      aria-labelledby={labelledBy}
      className={`${styles.band} ${toneClass} ${className}`}
      {...rest}
    >
      <div className={styles.inner}>{children}</div>
    </Tag>
  );
}
