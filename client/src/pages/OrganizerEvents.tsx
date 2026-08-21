import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LoadingState } from '../components/LoadingState'
import { PageLayout } from '../components/PageLayout'
import { useAuth } from '../context/AuthContext'
import { deleteEvent, fetchMyEvents, type OrganizerEventSummary, type TesseraEvent } from '../services/api'
import { formatEventDate } from '../utils/formatEventDate'
import styles from './OrganizerEvents.module.css'

const STATUS_LABEL: Record<TesseraEvent['status'], string> = {
  published: 'Publicado',
  closed: 'Fechado',
}

export function OrganizerEvents() {
  const navigate = useNavigate()
  const { user, accessToken, loading: authLoading } = useAuth()

  const [events, setEvents] = useState<OrganizerEventSummary[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!openMenuId) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest(`[data-menu-id="${openMenuId}"]`)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  async function handleDelete(eventId: string) {
    if (!accessToken) return

    setOpenMenuId(null)
    setDeleteError(null)
    setDeletingId(eventId)

    try {
      await deleteEvent(eventId, accessToken)
      setEvents((current) => current.filter((event) => event.id !== eventId))
    } catch {
      setDeleteError('Não foi possível excluir esse evento.')
    } finally {
      setDeletingId(null)
    }
  }

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
        {deleteError && <p className={styles.error}>{deleteError}</p>}

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

                <div className={styles.sales}>
                  <div className={styles.salesRow}>
                    <Icon name="confirmation_number" size={16} color="var(--color-text-muted)" />
                    <span>
                      {event.sold_quantity} de {event.total_capacity} vendidos
                    </span>
                  </div>
                  <div className={styles.salesBar}>
                    <div
                      className={styles.salesBarFill}
                      style={{ width: `${Math.min(100, (event.sold_quantity / event.total_capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <span className={`${styles.status} ${styles[event.status]}`}>{STATUS_LABEL[event.status]}</span>

              <Link to={`/organizador/eventos/${event.id}/editar`} className={styles.editButton}>
                Editar
              </Link>

              <div className={styles.menuWrapper} data-menu-id={event.id}>
                <button
                  type="button"
                  className={styles.menuButton}
                  aria-expanded={openMenuId === event.id}
                  onClick={() => setOpenMenuId((current) => (current === event.id ? null : event.id))}
                >
                  <Icon name="more_vert" size={20} color="var(--color-text-muted)" />
                </button>

                {openMenuId === event.id && (
                  <div className={styles.menuPanel}>
                    {event.has_bookings ? (
                      <button
                        type="button"
                        className={styles.menuDeleteButton}
                        disabled
                        title="Não é possível excluir: já existem reservas para este evento"
                      >
                        Excluir evento
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.menuDeleteButton}
                        disabled={deletingId === event.id}
                        onClick={() => handleDelete(event.id)}
                      >
                        {deletingId === event.id ? 'Excluindo...' : 'Excluir evento'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
