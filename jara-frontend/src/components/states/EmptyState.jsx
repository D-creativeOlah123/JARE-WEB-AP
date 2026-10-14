import { Link } from 'react-router-dom';
import Img from '../landing/ui/Img';
import styles from './EmptyState.module.css';

/**
 * EmptyState — illustrated empty slot with a title, one-line body, and
 * optional primary action.
 *
 *   <EmptyState
 *     image={appImages.emptyFirstGoal}
 *     title="Start your first goal"
 *     body="Set a target, Jara auto-saves for you."
 *     cta={{ label: 'Create goal', to: '/my-jara/new' }}
 *   />
 *
 * @param {object} props
 * @param {object} [props.image]    entry from `data/appImages.js`; omit for icon-only
 * @param {React.ElementType} [props.icon]
 * @param {string} props.title
 * @param {string} [props.body]
 * @param {{label:string,to?:string,onClick?:()=>void}} [props.cta]
 */
export default function EmptyState({ image, icon: Icon, title, body, cta, className = '' }) {
  return (
    <section className={`${styles.wrap} ${className}`}>
      {image ? (
        <div className={styles.illustration}>
          <Img image={image} aspect="1/1" className={styles.illustrationImg} />
        </div>
      ) : Icon ? (
        <div className={styles.icon}><Icon size={22} /></div>
      ) : null}

      <h3 className={styles.title}>{title}</h3>
      {body && <p className={styles.body}>{body}</p>}

      {cta && (
        cta.to ? (
          <Link to={cta.to} className={`${styles.cta} btn-lift`}>{cta.label}</Link>
        ) : (
          <button type="button" onClick={cta.onClick} className={`${styles.cta} btn-lift`}>
            {cta.label}
          </button>
        )
      )}
    </section>
  );
}
