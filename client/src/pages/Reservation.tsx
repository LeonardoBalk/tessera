import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Nav } from '../components/Nav'
import { useAuth } from '../context/AuthContext'
import { createBooking, fetchEventById, type TesseraEvent } from '../services/api'
import { formatEventDate } from '../utils/formatEventDate'
import styles from './Reservation.module.css'

export function Reservation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, accessToken, loading: authLoading } = useAuth()

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

  useEffect(() => {
    if (authLoading || !id) return
    if (!user) {
      navigate('/entrar', { state: { from: `/eventos/${id}/reservar` } })
    }
  }, [authLoading, user, id, navigate])

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

  if (!event || authLoading || !user) {
    return (
      <div>
        <Nav />
      </div>
    )
  }

  if (user.role !== 'customer') {
    return (
      <div>
        <Nav />
        <div className={styles.message}>
          <p>Só contas de cliente podem reservar ingressos.</p>
          <Link to={`/eventos/${event.id}`}>Voltar para o evento</Link>
        </div>
      </div>
    )
  }

  if (event.type !== 'general_admission') {
    return (
      <div>
        <Nav />
        <div className={styles.message}>
          <p>Reserva com mapa de assentos ainda não está disponível para este evento.</p>
          <Link to={`/eventos/${event.id}`}>Voltar para o evento</Link>
        </div>
      </div>
    )
  }

  const total = quantity * event.price

  async function handleContinue() {
    if (!accessToken) return
    setError(null)
    setSubmitting(true)

    try {
      const booking = await createBooking(event!.id, quantity, accessToken)
      navigate(`/reservas/${booking.id}/pagamento`, { state: { booking, event } })
    } catch {
      setError('Não foi possível reservar, tente uma quantidade menor ou volte mais tarde.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Nav />

      <div className={styles.page}>
        <Link to={`/eventos/${event.id}`} className={styles.back}>
          <Icon name="chevron_left" size={20} color="currentColor" />
          Voltar
        </Link>

        <div className={styles.header}>
          <h1 className={styles.title}>{event.title}</h1>
          <div className={styles.meta}>
            {formatEventDate(event.event_date)}
            {event.venue_name ? ` · ${event.venue_name}` : ''}
          </div>
        </div>

        <div className={styles.card}>
          <span className={styles.label}>Quantidade</span>
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

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>
                {quantity} {quantity === 1 ? 'ingresso' : 'ingressos'}
              </span>
              <span>{event.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cada</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="button" className={styles.continue} onClick={handleContinue} disabled={submitting}>
            {submitting ? 'Reservando...' : 'Continuar para pagamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
