import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dropdown } from '../components/Dropdown'
import { Icon } from '../components/Icon'
import { LoadingState } from '../components/LoadingState'
import { PageLayout } from '../components/PageLayout'
import { useAuth } from '../context/AuthContext'
import {
  fetchPublishedEvents,
  validateTicket,
  type TesseraEvent,
  type TicketValidationResult,
} from '../services/api'
import styles from './GateValidation.module.css'

const RESULT_LABEL: Record<TicketValidationResult, string> = {
  valid: 'Ingresso válido',
  invalid: 'Ingresso inválido',
  already_used: 'Ingresso já utilizado',
  wrong_event: 'Ingresso de outro evento',
}

const SCANNER_ELEMENT_ID = 'gate-qr-scanner'

export function GateValidation() {
  const navigate = useNavigate()
  const { user, accessToken, loading: authLoading } = useAuth()

  const [events, setEvents] = useState<TesseraEvent[]>([])
  const [eventId, setEventId] = useState('')
  const [payload, setPayload] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ result: TicketValidationResult; holderName: string | null } | null>(null)

  const [scannerActive, setScannerActive] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/entrar', { state: { from: '/portaria' } })
    }
  }, [authLoading, user, navigate])

  useEffect(() => {
    fetchPublishedEvents().then((data) => {
      setEvents(data)
      setEventId((current) => current || data[0]?.id || '')
    })
  }, [])

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [])

  async function submitValidation(payloadValue: string) {
    if (!accessToken || !eventId || !payloadValue.trim()) return

    setError(null)
    setSubmitting(true)

    try {
      const response = await validateTicket(payloadValue.trim(), eventId, accessToken)
      setResult(response)
    } catch {
      setError('Não foi possível validar, tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  async function stopScanner() {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (scanner) {
      await scanner.stop().catch(() => {})
    }
    setScannerActive(false)
  }

  async function startScanner() {
    setScannerError(null)
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        (decodedText) => {
          setPayload(decodedText)
          stopScanner()
          submitValidation(decodedText)
        },
        () => {},
      )
      setScannerActive(true)
    } catch {
      setScannerError('Não foi possível acessar a câmera.')
      scannerRef.current = null
    }
  }

  if (authLoading || !user) {
    return (
      <PageLayout>
        <LoadingState />
      </PageLayout>
    )
  }

  if (user.role !== 'gate_staff') {
    return (
      <PageLayout>
        <div className={styles.message}>
          <p>Só contas de portaria podem validar ingressos.</p>
          <Link to="/">Voltar para a home</Link>
        </div>
      </PageLayout>
    )
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault()
    await submitValidation(payload)
  }

  async function scanAnother() {
    setResult(null)
    setPayload('')
  }

  if (result) {
    const isValid = result.result === 'valid'
    return (
      <PageLayout>
        <div className={styles.resultPage}>
          <div className={`${styles.resultCard} ${styles[result.result]}`}>
            <div className={styles.resultIcon}>
              <Icon
                name={isValid ? 'check_circle' : 'cancel'}
                size={32}
                color={isValid ? 'var(--color-success)' : 'var(--color-danger)'}
              />
            </div>
            <h1>{RESULT_LABEL[result.result]}</h1>
            {result.holderName && <p>{result.holderName}</p>}
            <button type="button" className={styles.resultButton} onClick={scanAnother}>
              Validar outro ingresso
            </button>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className={styles.page}>
        <h1 className={styles.title}>Portaria</h1>

        <div className={styles.card}>
          <div className={styles.field}>
            Evento
            <Dropdown
              value={eventId}
              disabled={scannerActive}
              onChange={setEventId}
              options={events.map((event) => ({ value: event.id, label: event.title }))}
            />
          </div>

          <div className={styles.scannerSection}>
            <div id={SCANNER_ELEMENT_ID} className={styles.scannerRegion} hidden={!scannerActive} />

            {scannerError && <p className={styles.error}>{scannerError}</p>}

            <button
              type="button"
              className={styles.scannerButton}
              onClick={scannerActive ? stopScanner : startScanner}
            >
              <Icon name="qr_code_scanner" size={18} color="var(--color-primary)" />
              {scannerActive ? 'Parar scanner' : 'Iniciar scanner'}
            </button>
          </div>

          <div className={styles.divider}>
            <span>ou</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.field}>
              Código do ingresso
              <input
                value={payload}
                onChange={(changeEvent) => setPayload(changeEvent.target.value)}
                placeholder="Cole ou digite o código"
                required
              />
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submit} disabled={submitting || !eventId}>
              {submitting ? 'Validando...' : 'Validar'}
            </button>
          </form>
        </div>
      </div>
    </PageLayout>
  )
}
