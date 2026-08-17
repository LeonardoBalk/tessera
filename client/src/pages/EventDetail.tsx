import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Nav } from '../components/Nav'
import { fetchEventById, type TesseraEvent } from '../services/api'
import { formatEventDate } from '../utils/formatEventDate'
import styles from './EventDetail.module.css'

export function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [event, setEvent] = useState<TesseraEvent | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchEventById(id)
      .then(setEvent)
      .catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return (
      <div>
        <Nav />
        <div className={styles.message}>
          <p>Evento não encontrado.</p>
          <Link to="/">Voltar para a home</Link>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div>
        <Nav />
      </div>
    )
  }

  return (
    <div>
      <Nav />

      <div className={styles.page}>
        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          <Icon name="chevron_left" size={20} color="currentColor" />
          Voltar
        </button>

        <div className={styles.hero}>
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className={styles.heroImage} />
          ) : (
            <div className={styles.heroFallback} />
          )}
        </div>

        <div className={styles.content}>
          {event.category && <div className={styles.category}>{event.category}</div>}
          <h1 className={styles.title}>{event.title}</h1>

          <div className={styles.meta}>
            <span>{formatEventDate(event.event_date)}</span>
            {event.venue_name && <span> · {event.venue_name}</span>}
            {event.venue_city && <span>, {event.venue_city}</span>}
          </div>

          {event.location && <p className={styles.location}>{event.location}</p>}

          {event.description && <p className={styles.description}>{event.description}</p>}

          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>A partir de</span>
            <span className={styles.price}>
              {event.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <Link to={`/eventos/${event.id}/reservar`} className={styles.cta}>
            Comprar ingresso
          </Link>
        </div>
      </div>
    </div>
  )
}
