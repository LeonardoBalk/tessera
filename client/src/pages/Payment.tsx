import { useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
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
      <PageLayout>
        <div className={styles.message}>
          <p>Não encontramos os dados dessa reserva.</p>
          <Link to="/">Voltar para a home</Link>
        </div>
      </PageLayout>
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
      <PageLayout>
        <div className={styles.resultPage}>
          <div className={`${styles.resultCard} ${styles.success}`}>
            <h1>Pagamento aprovado</h1>
            <p>Seu ingresso para {event.title} foi gerado com o código QR.</p>
            <Link to="/" className={styles.resultLink}>
              Voltar para a home
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (result === 'declined') {
    return (
      <PageLayout>
        <div className={styles.resultPage}>
          <div className={`${styles.resultCard} ${styles.declined}`}>
            <h1>Pagamento recusado</h1>
            <p>Não foi possível aprovar o pagamento com esse cartão.</p>
            <Link to={`/eventos/${event.id}`} className={styles.resultLink}>
              Tentar novamente
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>{event.title}</h1>
          <p className={styles.orderNumber}>Pedido {booking.id.slice(0, 8).toUpperCase()}</p>
        </div>

        <div className={styles.layout}>
          <form id="payment-form" onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Informações do pagamento</h2>

              <label className={styles.field}>
                Número do cartão
                <input
                  value={cardNumber}
                  onChange={(changeEvent) => setCardNumber(changeEvent.target.value)}
                  placeholder="0000 0000 0000 0000"
                  required
                />
              </label>

              <p className={styles.hint}>
                Pagamento simulado: qualquer número aprova, exceto 0000000000000002, que simula recusa.
              </p>
            </div>

            {error && <p className={styles.error}>{error}</p>}
          </form>

          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>Resumo do pedido</h2>

            <div className={styles.summaryRow}>
              <span>
                {booking.quantity}x {event.title}
              </span>
              <span>{event.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>

            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>

            <button type="submit" form="payment-form" className={styles.submit} disabled={submitting}>
              {submitting ? 'Processando...' : 'Finalizar compra'}
            </button>
          </aside>
        </div>
      </div>
    </PageLayout>
  )
}
