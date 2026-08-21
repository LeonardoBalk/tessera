import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AiChat } from '../components/AiChat'
import { CategoryShelf } from '../components/CategoryShelf'
import { EventCard } from '../components/EventCard'
import { FeaturedCarousel } from '../components/FeaturedCarousel'
import { LoadingState } from '../components/LoadingState'
import { PageLayout } from '../components/PageLayout'
import { SearchBar } from '../components/SearchBar'
import { fetchPublishedEvents, type TesseraEvent } from '../services/api'
import styles from './Home.module.css'

export function Home() {
  const [events, setEvents] = useState<TesseraEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetchPublishedEvents()
      .then(setEvents)
      .catch(() => setLoadError(true))
      .finally(() => setLoadingEvents(false))
  }, [])

  const searchResults = useMemo(() => {
    const needle = searchText.trim().toLowerCase()
    if (!needle) return []

    return events.filter((event) => {
      const haystack = `${event.title} ${event.venue_name ?? ''} ${event.venue_city ?? ''}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [events, searchText])

  const displayedEvents = events.slice(0, 8)

  return (
    <PageLayout>
      <SearchBar searchText={searchText} onSearchChange={setSearchText} searchResults={searchResults} />

      <FeaturedCarousel events={events.slice(0, 5)} />

      <div className={styles.categoryRow}>
        <CategoryShelf />
      </div>

      <AiChat />

      <div className={styles.showcase}>
        <div className={styles.showcaseHeader}>
          <h2>Eventos</h2>
          <Link to="/eventos">Ver tudo</Link>
        </div>

        {loadingEvents && <LoadingState />}

        {!loadingEvents && loadError && <p className={styles.error}>Não foi possível carregar os eventos.</p>}

        {!loadingEvents && !loadError && displayedEvents.length === 0 && (
          <p className={styles.empty}>Nenhum evento publicado ainda.</p>
        )}

        {!loadingEvents && (
          <div className={styles.grid}>
            {displayedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
