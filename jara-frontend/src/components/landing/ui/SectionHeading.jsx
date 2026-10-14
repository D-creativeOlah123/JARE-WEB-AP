import styles from './SectionHeading.module.css';

/**
 * SectionHeading — small eyebrow + a big H2 where one phrase is italic,
 * optionally followed by a one-line sub.
 *
 *   <SectionHeading
 *     id="savings-title"
 *     eyebrow="Savings & Ajo"
 *     title="Save alone."
 *     italic="Save together."
 *     sub="Jara makes rotating pools painless and personal goals automatic."
 *   />
 *
 * The italic phrase renders inside a Fraunces-italic span, matching the
 * existing landing hero gradient treatment. The whole heading is the
 * `aria-labelledby` target for the surrounding Band.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.italic]
 * @param {string} [props.eyebrow]
 * @param {string} [props.sub]
 * @param {string} [props.id]
 * @param {'left'|'center'} [props.align='left']
 */
export default function SectionHeading({
  title,
  italic,
  eyebrow,
  sub,
  id,
  align = 'left',
}) {
  return (
    <header className={`${styles.wrap} ${align === 'center' ? styles.center : ''}`}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h2 id={id} className={styles.title}>
        {title}
        {italic && (
          <>
            {' '}
            <span className={styles.italic}>{italic}</span>
          </>
        )}
      </h2>
      {sub && <p className={styles.sub}>{sub}</p>}
    </header>
  );
}
