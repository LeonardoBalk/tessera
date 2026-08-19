import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LoadingState } from '../components/LoadingState'
import { PageLayout } from '../components/PageLayout'
import { useAuth } from '../context/AuthContext'
import { fetchMyEvents, type TesseraEvent } from '../services/api'
import { formatEventDate } from '../utils/formatEventDate'
import styles from './OrganizerEvents.module.css'

const STATUS_LABEL: Record<TesseraEvent['status'], string> = {
  published: 'Publicado',
  closed: 'Fechado',
}

export function OrganizerEvents() {
  const navigate = useNavigate()
  const { user, accessToken, loading: authLoading } = useAuth()

  const [events, setEvents] = useState<TesseraEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/entrar', { state: { from: '/organizador/eventos' } })
      return
    }

    if (user.role !== 'organizer' || !accessToken) {
      setLoadingEvents(false)
      return
    }

    fetchMyEvents(accessToken)
      .then(setEvents)
      .catch(() => setLoadError(true))
      .finally(() => setLoadingEvents(false))
  }, [authLoading, user, accessToken, navigate])

  if (authLoading || !user || loadingEvents) {
    return (
      <PageLayout>
        <LoadingState />
      </PageLayout>
    )
  }

  if (user.role !== 'organizer') {
    return (
      <PageLayout>
        <div className={styles.message}>
          <p>Só contas de organizador têm eventos.</p>
          <Link to="/">Voltar para a home</Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Meus eventos</h1>
          <Link to="/organizador/eventos/novo" className={styles.createButton}>
            <Icon name="add" size={18} color="#ffffff" />
            Criar evento
          </Link>
        </div>

        {loadError && <p className={styles.error}>Não foi possível carregar seus eventos.</p>}

        {!loadError && events.length === 0 && (
          <p className={styles.empty}>Você ainda não criou nenhum evento.</p>
        )}

        <div className={styles.list}>
          {events.map((event) => (
            <div key={event.id} className={styles.card}>
              <div className={styles.thumb}>{event.image_url && <img src={event.image_url} alt="" />}</div>

              <div className={styles.info}>
                <div className={styles.eventTitle}>{event.title}</div>
                <div className={styles.metaRow}>
                  <Icon name="schedule" size={16} color="var(--color-text-muted)" />
                  <span>{formatEventDate(event.event_date)}</span>
                </div>
                {event.venue_name && (
                  <div className={styles.metaRow}>
                    <Icon name="location_on" size={16} color="var(--color-text-muted)" />
                    <span>
                      {event.venue_name}
                      {event.venue_city ? ` · ${event.venue_city}` : ''}
                    </span>
                  </div>
                )}
              </div>

              <span className={`${styles.status} ${styles[event.status]}`}>{STATUS_LABEL[event.status]}</span>

              <Link to={`/organizador/eventos/${event.id}/editar`} className={styles.editButton}>
                Editar
              </Link>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
