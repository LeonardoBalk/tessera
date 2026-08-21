import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LoadingState } from '../components/LoadingState'
import { PageLayout } from '../components/PageLayout'
import { useAuth } from '../context/AuthContext'
import { createBooking, fetchEventById, type TesseraEvent } from '../services/api'
import { formatEventDate } from '../utils/formatEventDate'
import styles from './EventDetail.module.css'

export function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, accessToken } = useAuth()

  const [event, setEvent] = useState<TesseraEvent | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchEventById(id)
      .then(setEvent)
      .catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return (
      <PageLayout>
        <div className={styles.message}>
          <p>Evento não encontrado.</p>
          <Link to="/">Voltar para a home</Link>
        </div>
      </PageLayout>
    )
  }

  if (!event) {
    return (
      <PageLayout>
        <LoadingState />
      </PageLayout>
    )
  }

  const total = quantity * event.price

  async function handleContinue() {
    if (!id) return

    if (!user) {
      navigate('/entrar', { state: { from: `/eventos/${id}` } })
      return
    }

    if (user.role !== 'customer') {
      setError('Só contas de cliente podem comprar ingressos.')
      return
    }

    if (!accessToken) return

    setError(null)
    setSubmitting(true)

    try {
      const booking = await createBooking(id, quantity, accessToken)
      navigate(`/reservas/${booking.id}/pagamento`, { state: { booking, event } })
    } catch {
      setError('Não foi possível reservar, tente uma quantidade menor ou volte mais tarde. Este evento pode ter sido esgotado.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageLayout>
      <div className={styles.page}>
        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          <Icon name="chevron_left" size={20} color="currentColor" />
          Voltar
        </button>

        <div className={styles.layout}>
          <div className={styles.top}>
            <div className={styles.hero}>
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className={styles.heroImage} />
              ) : (
                <div className={styles.heroFallback} />
              )}
            </div>

            <div className={styles.info}>
              {event.category && <div className={styles.category}>{event.category}</div>}
              <h1 className={styles.title}>{event.title}</h1>

              <div className={styles.metaRow}>
                <Icon name="schedule" size={18} color="var(--color-text-muted)" />
                <span>{formatEventDate(event.event_date)}</span>
              </div>

              {(event.venue_name || event.venue_city) && (
                <div className={styles.metaRow}>
                  <Icon name="location_on" size={18} color="var(--color-text-muted)" />
                  <span>
                    {event.venue_name}
                    {event.venue_name && event.venue_city ? ' · ' : ''}
                    {event.venue_city}
                  </span>
                </div>
              )}
            </div>
          </div>

          <aside className={styles.ticketCard}>
            <h2 className={styles.ticketCardTitle}>Selecione os ingressos</h2>

            {event.type !== 'general_admission' ? (
              <p className={styles.ticketHint}>
                Reserva com mapa de assentos ainda não está disponível para este evento.
              </p>
            ) : (
              <>
                <div className={styles.ticketRow}>
                  <div>
                    <div className={styles.ticketType}>Ingresso geral</div>
                    <div className={styles.ticketPrice}>
                      {event.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cada
                    </div>
                  </div>
                  <div className={styles.stepper}>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span className={styles.quantity}>{quantity}</span>
                    <button type="button" onClick={() => setQuantity((q) => q + 1)}>
                      +
                    </button>
                  </div>
                </div>

                <div className={styles.totalRow}>
                  <span>Total</span>
                  <span className={styles.totalValue}>
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <button type="button" className={styles.cta} onClick={handleContinue} disabled={submitting}>
                  {submitting ? 'Reservando...' : 'Comprar ingresso'}
                </button>
              </>
            )}
          </aside>

          <div className={styles.sections}>
            {event.description && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Sobre</h2>
                <p className={styles.description}>{event.description}</p>
              </div>
            )}

            {event.location && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Local do evento</h2>
                <p className={styles.location}>{event.location}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
