import styles from './Img.module.css';

/**
 * Img — a photo slot with LQIP, srcset, intrinsic sizing, and a graceful
 * "no file yet" placeholder.
 *
 * Expected input shape (from `data/landingImages.js`):
 *   {
 *     base:          'hero-01-market-card',
 *     dir:           'landing' | 'app',
 *     widths:        [640, 1280, 1920],
 *     width, height: intrinsic pixel size (prevents CLS)
 *     alt:           string
 *     objectPosition: '50% 40%'   // optional focal-point tuning
 *     lqip:          data-URI (24px blurred preview)
 *     available:     boolean      // false → render the duotone placeholder
 *     formats:       ['webp'] | ['avif','webp']    // optional
 *   }
 *
 * Caller usage:
 *   <Img image={images.hero1} aspect="16/9" priority />
 *
 * `priority` adds fetchpriority="high" + eager loading for the LCP image.
 * All other calls default to lazy + async decode.
 *
 * @param {object} props
 * @param {object} props.image
 * @param {string} [props.aspect]       CSS aspect-ratio, e.g. "16/9"
 * @param {boolean}[props.priority]
 * @param {string} [props.className]
 * @param {string} [props.sizes]        <picture> sizes attribute
 */
export default function Img({
  image,
  aspect,
  priority = false,
  className = '',
  sizes = '(min-width: 1180px) 1180px, 100vw',
  ...rest
}) {
  const style = {
    aspectRatio: aspect || `${image.width} / ${image.height}`,
    backgroundImage: image.lqip ? `url("${image.lqip}")` : undefined,
    '--photo-focal': image.objectPosition || '50% 50%',
  };

  // No file on disk yet → render the duotone placeholder.
  if (!image.available) {
    return (
      <figure
        className={`${styles.wrap} ${styles.placeholder} ${className}`}
        style={style}
        role="img"
        aria-label={image.alt || ''}
        {...rest}
      >
        <span className={styles.placeholderLabel}>{image.alt || image.base}</span>
      </figure>
    );
  }

  const dir = image.dir || 'landing';
  const widths = image.widths || [640, 1280, 1920];
  const formats = image.formats || ['webp'];

  // Build one <source> per format with a comma-separated srcset.
  const sources = formats.map((fmt) => {
    const srcset = widths
      .map((w) => `/images/${dir}/${image.base}-${w}.${fmt} ${w}w`)
      .join(', ');
    return { fmt, srcset };
  });

  const fallbackSrc = `/images/${dir}/${image.base}-${widths[widths.length - 1]}.webp`;

  return (
    <picture className={`${styles.wrap} ${className}`} style={style} {...rest}>
      {sources.map(({ fmt, srcset }) => (
        <source
          key={fmt}
          type={fmt === 'avif' ? 'image/avif' : 'image/webp'}
          srcSet={srcset}
          sizes={sizes}
        />
      ))}
      <img
        src={fallbackSrc}
        alt={image.alt || ''}
        width={image.width}
        height={image.height}
        className={styles.img}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchpriority={priority ? 'high' : 'auto'}
        style={{ objectPosition: image.objectPosition || '50% 50%' }}
      />
    </picture>
  );
}
