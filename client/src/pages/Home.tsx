import { useEffect, useMemo, useState } from 'react'
import { CategoryShelf } from '../components/CategoryShelf'
import { EventCard } from '../components/EventCard'
import { FeaturedCarousel } from '../components/FeaturedCarousel'
import { Nav } from '../components/Nav'
import { SearchBar } from '../components/SearchBar'
import { fetchPublishedEvents, type TesseraEvent } from '../services/api'
import { matchesCategory } from '../utils/matchesCategory'
import styles from './Home.module.css'

export function Home() {
  const [events, setEvents] = useState<TesseraEvent[]>([])
  const [loadError, setLoadError] = useState(false)

  const [searchText, setSearchText] = useState('')
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

  const searchResults = useMemo(() => {
    const needle = searchText.trim().toLowerCase()
    if (!needle) return []

    return events
      .filter((event) => {
        const haystack = `${event.title} ${event.venue_name ?? ''} ${event.venue_city ?? ''}`.toLowerCase()
        return haystack.includes(needle)
      })
      .slice(0, 6)
  }, [events, searchText])

  const isFiltering = Boolean(selectedCategory)

  function clearFilters() {
    setSearchText('')
    setSelectedCategory(null)
  }

  return (
    <div>
      <Nav />
      <SearchBar searchText={searchText} onSearchChange={setSearchText} searchResults={searchResults} />

      <FeaturedCarousel events={events.slice(0, 5)} />

      <div className={styles.categoryRow}>
        <CategoryShelf selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      </div>

      <div className={styles.showcase}>
        <div className={styles.showcaseHeader}>
          <h2>Eventos</h2>
          {isFiltering ? (
            <button type="button" className={styles.clearFilters} onClick={clearFilters}>
              Limpar filtros
            </button>
          ) : (
            <a href="/eventos">Ver tudo</a>
          )}
        </div>

        {loadError && <p className={styles.error}>Não foi possível carregar os eventos.</p>}

        {!loadError && filteredEvents.length === 0 && (
          <p className={styles.empty}>
            {isFiltering ? 'Nenhum evento encontrado com esses filtros.' : 'Nenhum evento publicado ainda.'}
          </p>
        )}

        <div className={styles.grid}>
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  )
}
