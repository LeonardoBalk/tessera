import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Nav } from '../components/Nav'
import { useAuth } from '../context/AuthContext'
import { fetchMyTickets, type TesseraTicket } from '../services/api'
import { formatEventDate } from '../utils/formatEventDate'
import styles from './MyTickets.module.css'

type StatusTab = 'valid' | 'used' | 'canceled'

const TABS: { key: StatusTab; label: string }[] = [
  { key: 'valid', label: 'Válidos' },
  { key: 'used', label: 'Utilizados' },
  { key: 'canceled', label: 'Cancelados' },
]

const PAGE_SIZE = 10

export function MyTickets() {
  const navigate = useNavigate()
  const { user, accessToken, loading: authLoading } = useAuth()

  const [tickets, setTickets] = useState<TesseraTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [activeTab, setActiveTab] = useState<StatusTab>('valid')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/entrar', { state: { from: '/ingressos' } })
      return
    }

    if (user.role !== 'customer' || !accessToken) {
      setLoadingTickets(false)
      return
    }

    fetchMyTickets(accessToken)
      .then(setTickets)
      .catch(() => setLoadError(true))
      .finally(() => setLoadingTickets(false))
  }, [authLoading, user, accessToken, navigate])

  const filteredTickets = useMemo(() => tickets.filter((ticket) => ticket.status === activeTab), [tickets, activeTab])
  const visibleTickets = filteredTickets.slice(0, visibleCount)
  const hasMore = filteredTickets.length > visibleTickets.length

  function selectTab(tab: StatusTab) {
    setActiveTab(tab)
    setVisibleCount(PAGE_SIZE)
  }

  if (authLoading || !user || loadingTickets) {
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
          <p>Só contas de cliente têm ingressos.</p>
          <Link to="/">Voltar para a home</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Nav />

      <div className={styles.page}>
        <h1 className={styles.title}>Meus ingressos</h1>

        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
              onClick={() => selectTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loadError && <p className={styles.error}>Não foi possível carregar seus ingressos.</p>}

        {!loadError && filteredTickets.length === 0 && (
          <p className={styles.empty}>Nenhum ingresso {TABS.find((tab) => tab.key === activeTab)?.label.toLowerCase()}.</p>
        )}

        <div className={styles.list}>
          {visibleTickets.map((ticket) => (
            <div key={ticket.id} className={styles.card}>
              <div className={styles.thumb}>
                {ticket.events?.image_url && <img src={ticket.events.image_url} alt="" />}
              </div>

              <div className={styles.info}>
                <div className={styles.eventTitle}>{ticket.events?.title}</div>

                <div className={styles.metaRow}>
                  <Icon name="schedule" size={16} color="var(--color-text-muted)" />
                  <span>{ticket.events ? formatEventDate(ticket.events.event_date) : ''}</span>
                </div>

                {ticket.events?.venue_name && (
                  <div className={styles.metaRow}>
                    <Icon name="location_on" size={16} color="var(--color-text-muted)" />
                    <span>
                      {ticket.events.venue_name}
                      {ticket.events.venue_city ? ` · ${ticket.events.venue_city}` : ''}
                    </span>
                  </div>
                )}
              </div>

              <Link to={`/ingressos/${ticket.id}`} className={styles.accessButton}>
                Ver ingresso
              </Link>
            </div>
          ))}
        </div>

        {hasMore && (
          <button type="button" className={styles.loadMore} onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
            Ver mais
          </button>
        )}
      </div>
    </div>
  )
}
