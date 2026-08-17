import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TesseraEvent } from '../services/api'
import { formatEventDate } from '../utils/formatEventDate'
import { Icon } from './Icon'
import styles from './FeaturedCarousel.module.css'

export function FeaturedCarousel({ events }: { events: TesseraEvent[] }) {
  const [slideIndex, setSlideIndex] = useState(0)

  if (events.length === 0) {
    return null
  }

  const count = events.length
  const mainSlide = events[slideIndex]
  const sideLeft = events[(slideIndex - 1 + count) % count]
  const sideRight = events[(slideIndex + 1) % count]

  const nextSlide = () => setSlideIndex((index) => (index + 1) % count)
  const prevSlide = () => setSlideIndex((index) => (index - 1 + count) % count)

  return (
    <div className={styles.wrapper}>
      <div className={styles.stage}>
        {count > 1 && (
          <div className={styles.side}>
            {sideLeft.image_url && <img src={sideLeft.image_url} alt="" />}
          </div>
        )}

        <Link to={`/eventos/${mainSlide.id}`} className={styles.main}>
          {mainSlide.image_url ? (
            <img src={mainSlide.image_url} alt={mainSlide.title} />
          ) : (
            <div className={styles.mainFallback} />
          )}
          <div className={styles.gradient} />
          <div className={styles.mainCaption}>
            <div className={styles.mainTitle}>{mainSlide.title}</div>
            <div className={styles.mainMeta}>
              {formatEventDate(mainSlide.event_date)}
              {mainSlide.venue_name ? ` · ${mainSlide.venue_name}` : ''}
            </div>
          </div>
        </Link>

        {count > 1 && (
          <div className={styles.side}>
            {sideRight.image_url && <img src={sideRight.image_url} alt="" />}
          </div>
        )}

        {count > 1 && (
          <>
            <button type="button" className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prevSlide}>
              <Icon name="chevron_left" size={20} />
            </button>
            <button type="button" className={`${styles.arrow} ${styles.arrowRight}`} onClick={nextSlide}>
              <Icon name="chevron_right" size={20} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className={styles.dots}>
          {events.map((event, index) => (
            <div
              key={event.id}
              className={styles.dot}
              style={{ background: index === slideIndex ? 'var(--color-primary)' : 'var(--color-border)' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
