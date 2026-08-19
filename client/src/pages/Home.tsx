import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AiChat } from '../components/AiChat'
import { CategoryShelf } from '../components/CategoryShelf'
import { EventCard } from '../components/EventCard'
import { FeaturedCarousel } from '../components/FeaturedCarousel'
import { PageLayout } from '../components/PageLayout'
import { fetchPublishedEvents, type TesseraEvent } from '../services/api'
import { matchesCategory } from '../utils/matchesCategory'
import styles from './Home.module.css'

export function Home() {
  const [events, setEvents] = useState<TesseraEvent[]>([])
  const [loadError, setLoadError] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchPublishedEvents()
      .then(setEvents)
      .catch(() => setLoadError(true))
  }, [])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (selectedCategory && !matchesCategory(event.category, selectedCategory)) return false
      return true
    })
  }, [events, selectedCategory])

  const isFiltering = Boolean(selectedCategory)
  const displayedEvents = isFiltering ? filteredEvents : filteredEvents.slice(0, 8)

  function clearFilters() {
    setSelectedCategory(null)
  }

  return (
    <PageLayout>
      <FeaturedCarousel events={events.slice(0, 5)} />

      <div className={styles.categoryRow}>
        <CategoryShelf selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      </div>

      <AiChat />

      <div className={styles.showcase}>
        <div className={styles.showcaseHeader}>
          <h2>Eventos</h2>
          {isFiltering ? (
            <button type="button" className={styles.clearFilters} onClick={clearFilters}>
              Limpar filtros
            </button>
          ) : (
            <Link to="/eventos">Ver tudo</Link>
          )}
        </div>

        {loadError && <p className={styles.error}>Não foi possível carregar os eventos.</p>}

        {!loadError && displayedEvents.length === 0 && (
          <p className={styles.empty}>
            {isFiltering ? 'Nenhum evento encontrado com esses filtros.' : 'Nenhum evento publicado ainda.'}
          </p>
        )}

        <div className={styles.grid}>
          {displayedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
