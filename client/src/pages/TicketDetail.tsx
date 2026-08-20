import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Icon } from '../components/Icon'
import { LoadingState } from '../components/LoadingState'
import { PageLayout } from '../components/PageLayout'
import { fetchTicketById, type TesseraTicket } from '../services/api'
import { formatEventDate } from '../utils/formatEventDate'
import styles from './TicketDetail.module.css'

const STATUS_LABEL: Record<TesseraTicket['status'], string> = {
  valid: 'Válido',
  used: 'Utilizado',
  canceled: 'Cancelado',
}

export function TicketDetail() {
  const { id } = useParams<{ id: string }>()

  const [ticket, setTicket] = useState<TesseraTicket | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchTicketById(id)
      .then(setTicket)
      .catch(() => setNotFound(true))
  }, [id])

  async function handleShare() {
    const shareUrl = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title: ticket?.events?.title ?? 'Meu ingresso', url: shareUrl })
      } catch {}
      return
    }

    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleCopyCode() {
    if (!ticket) return
    await navigator.clipboard.writeText(ticket.qr_payload)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  if (notFound) {
    return (
      <PageLayout>
        <div className={styles.message}>
          <p>Ingresso não encontrado.</p>
          <Link to="/">Voltar para a home</Link>
        </div>
      </PageLayout>
    )
  }

  if (!ticket) {
    return (
      <PageLayout>
        <LoadingState />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className={styles.page}>
        <div className={styles.card}>
          <span className={`${styles.status} ${styles[ticket.status]}`}>{STATUS_LABEL[ticket.status]}</span>

          <h1 className={styles.title}>{ticket.events?.title}</h1>
          <div className={styles.meta}>
            {ticket.events ? formatEventDate(ticket.events.event_date) : ''}
            {ticket.events?.venue_name ? ` · ${ticket.events.venue_name}` : ''}
          </div>

          <div className={`${styles.qrWrapper} ${ticket.status !== 'valid' ? styles.qrDimmed : ''}`}>
            <QRCodeSVG value={ticket.qr_payload} size={220} />
            {ticket.status !== 'valid' && (
              <span className={`${styles.stamp} ${styles[ticket.status]}`}>{STATUS_LABEL[ticket.status]}</span>
            )}
          </div>

          {ticket.status === 'valid' ? (
            <p className={styles.hint}>Apresente esse código na entrada do evento.</p>
          ) : (
            <p className={styles.hint}>
              {ticket.status === 'canceled'
                ? 'Este ingresso foi cancelado e não pode ser utilizado.'
                : 'Este ingresso já foi utilizado nesse evento.'}
            </p>
          )}

          {ticket.status === 'valid' && (
            <div className={styles.codeBox}>
              <span className={styles.codeLabel}>Código do ingresso (caso o QR não possa ser lido)</span>
              <div className={styles.codeRow}>
                <code className={styles.code}>{ticket.qr_payload}</code>
                <button type="button" className={styles.copyCodeButton} onClick={handleCopyCode}>
                  <Icon name={codeCopied ? 'check' : 'content_copy'} size={16} color="var(--color-text-muted)" />
                </button>
              </div>
            </div>
          )}

          {ticket.status === 'valid' && (
            <button type="button" className={styles.shareButton} onClick={handleShare}>
              <Icon name="share" size={18} color="var(--color-primary)" />
              {copied ? 'Link copiado!' : 'Compartilhar ingresso'}
            </button>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
