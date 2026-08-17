import { useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { useAuth } from '../context/AuthContext'
import { payBooking, type TesseraBooking, type TesseraEvent } from '../services/api'
import styles from './Payment.module.css'

interface LocationState {
  booking: TesseraBooking
  event: TesseraEvent
}

export function Payment() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const location = useLocation()
  const { accessToken } = useAuth()

  const state = location.state as LocationState | null

  const [cardNumber, setCardNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<'paid' | 'declined' | null>(null)

  if (!state) {
    return (
      <div>
        <Nav />
        <div className={styles.message}>
          <p>Não encontramos os dados dessa reserva.</p>
          <Link to="/">Voltar para a home</Link>
        </div>
      </div>
    )
  }

  const { booking, event } = state
  const total = (booking.quantity ?? 1) * event.price

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault()
    setError(null)

    if (!accessToken || !bookingId) return

    setSubmitting(true)
    try {
      const updated = await payBooking(bookingId, cardNumber, accessToken)
      setResult(updated.status === 'paid' ? 'paid' : 'declined')
    } catch {
      setError('Não foi possível processar o pagamento.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result === 'paid') {
    return (
      <div>
        <Nav />
        <div className={styles.resultPage}>
          <div className={`${styles.resultCard} ${styles.success}`}>
            <h1>Pagamento aprovado</h1>
            <p>Seu ingresso para {event.title} foi gerado com o código QR.</p>
            <Link to="/" className={styles.resultLink}>
              Voltar para a home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (result === 'declined') {
    return (
      <div>
        <Nav />
        <div className={styles.resultPage}>
          <div className={`${styles.resultCard} ${styles.declined}`}>
            <h1>Pagamento recusado</h1>
            <p>Não foi possível aprovar o pagamento com esse cartão.</p>
            <Link to={`/eventos/${event.id}/reservar`} className={styles.resultLink}>
              Tentar novamente
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Nav />

      <div className={styles.page}>
        <h1 className={styles.title}>Pagamento</h1>

        <div className={styles.summary}>
          <span>{event.title}</span>
          <span>
            {booking.quantity} {booking.quantity === 1 ? 'ingresso' : 'ingressos'}
          </span>
          <span className={styles.total}>
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            Número do cartão
            <input
              value={cardNumber}
              onChange={(changeEvent) => setCardNumber(changeEvent.target.value)}
              placeholder="0000 0000 0000 0000"
              required
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? 'Processando...' : 'Pagar'}
          </button>
        </form>
      </div>
    </div>
  )
}
