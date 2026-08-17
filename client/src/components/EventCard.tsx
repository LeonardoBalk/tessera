import { Link } from 'react-router-dom'
import type { TesseraEvent } from '../services/api'
import { formatEventDate } from '../utils/formatEventDate'
import styles from './EventCard.module.css'

export function EventCard({ event }: { event: TesseraEvent }) {
  return (
    <Link to={`/eventos/${event.id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className={styles.image} />
        ) : (
          <div className={styles.imageFallback} />
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          {formatEventDate(event.event_date)}
          {event.venue_city ? ` · ${event.venue_city}` : ''}
        </div>
        <div className={styles.title}>{event.title}</div>
        {event.category && <div className={styles.category}>{event.category}</div>}
      </div>
    </Link>
  )
}
