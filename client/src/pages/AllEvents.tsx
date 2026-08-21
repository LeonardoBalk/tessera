import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EventCard } from '../components/EventCard'
import { Icon } from '../components/Icon'
import { LoadingState } from '../components/LoadingState'
import { PageLayout } from '../components/PageLayout'
import { fetchPublishedEvents, type TesseraEvent } from '../services/api'
import { matchesCategory } from '../utils/matchesCategory'
import styles from './AllEvents.module.css'

const CATEGORIES = ['Shows', 'Teatro', 'Esportes', 'Outros']

type SortOption = 'date' | 'price_asc' | 'price_desc'
type OpenFilter = 'city' | 'category' | 'date' | 'price' | null

function formatShortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function FilterDropdown({
  label,
  active,
  isOpen,
  onToggle,
  children,
}: {
  label: string
  active: boolean
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className={styles.filterWrapper}>
      <button
        type="button"
        className={`${styles.filterPill} ${active ? styles.filterPillActive : ''}`}
        onClick={onToggle}
      >
        <span>{label}</span>
        <Icon name="expand_more" size={18} color={active ? 'var(--color-primary)' : 'var(--color-text)'} />
      </button>
      {isOpen && <div className={styles.filterPanel}>{children}</div>}
    </div>
  )
}

export function AllEvents() {
  const [searchParams] = useSearchParams()

  const [events, setEvents] = useState<TesseraEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [searchText, setSearchText] = useState(searchParams.get('q') ?? '')
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('categoria'))
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null)

  useEffect(() => {
    fetchPublishedEvents()
      .then(setEvents)
      .catch(() => setLoadError(true))
      .finally(() => setLoadingEvents(false))
  }, [])

  useEffect(() => {
    setSearchText(searchParams.get('q') ?? '')
  }, [searchParams])

  useEffect(() => {
    setSelectedCategory(searchParams.get('categoria'))
  }, [searchParams])

  const cities = useMemo(
    () => Array.from(new Set(events.map((event) => event.venue_city).filter((city): city is string => Boolean(city)))),
    [events],
  )

  const filteredEvents = useMemo(() => {
    const needle = searchText.trim().toLowerCase()
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null
    const priceLimit = maxPrice.trim() ? Number(maxPrice) : null

    return events.filter((event) => {
      if (selectedCity && event.venue_city !== selectedCity) return false
      if (selectedCategory && !matchesCategory(event.category, selectedCategory)) return false
      if (needle) {
        const haystack = `${event.title} ${event.venue_name ?? ''} ${event.venue_city ?? ''}`.toLowerCase()
        if (!haystack.includes(needle)) return false
      }

      const eventDate = new Date(event.event_date)
      if (from && eventDate < from) return false
      if (to && eventDate > to) return false
      if (priceLimit !== null && event.price > priceLimit) return false

      return true
    })
  }, [events, searchText, selectedCity, selectedCategory, dateFrom, dateTo, maxPrice])

  const sortedEvents = useMemo(() => {
    const list = [...filteredEvents]
    if (sortBy === 'date') list.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    if (sortBy === 'price_asc') list.sort((a, b) => a.price - b.price)
    if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price)
    return list
  }, [filteredEvents, sortBy])

  const isFiltering = Boolean(
    searchText.trim() || selectedCity || selectedCategory || dateFrom || dateTo || maxPrice.trim(),
  )

  function clearFilters() {
    setSearchText('')
    setSelectedCity(null)
    setSelectedCategory(null)
    setDateFrom('')
    setDateTo('')
    setMaxPrice('')
  }

  function toggleFilter(filter: OpenFilter) {
    setOpenFilter((current) => (current === filter ? null : filter))
  }

  return (
    <PageLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>Todos os eventos</h1>

        <div className={styles.searchBar}>
          <Icon name="search" size={18} color="var(--color-text-muted)" />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Buscar eventos..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>

        <div className={styles.cityWrapper}>
          <button type="button" className={styles.cityPill} onClick={() => toggleFilter('city')}>
            <Icon name="location_on" size={18} color="var(--color-primary)" />
            <span>{selectedCity ?? 'Todas as cidades'}</span>
            <Icon name="expand_more" size={18} color="var(--color-primary)" />
          </button>

          {openFilter === 'city' && (
            <div className={styles.filterPanel}>
              <button
                type="button"
                className={styles.optionButton}
                onClick={() => {
                  setSelectedCity(null)
                  setOpenFilter(null)
                }}
              >
                Todas as cidades
              </button>
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  className={styles.optionButton}
                  onClick={() => {
                    setSelectedCity(city)
                    setOpenFilter(null)
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.secondaryFilterRow}>
        <span className={styles.filterLabel}>Filtrar por</span>

        <FilterDropdown
          label={selectedCategory ?? 'Categoria'}
          active={Boolean(selectedCategory)}
          isOpen={openFilter === 'category'}
          onToggle={() => toggleFilter('category')}
        >
          <button
            type="button"
            className={styles.optionButton}
            onClick={() => {
              setSelectedCategory(null)
              setOpenFilter(null)
            }}
          >
            Todas as categorias
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={styles.optionButton}
              onClick={() => {
                setSelectedCategory(category)
                setOpenFilter(null)
              }}
            >
              {category}
            </button>
          ))}
        </FilterDropdown>

        <FilterDropdown
          label={
            dateFrom && dateTo
              ? `${formatShortDate(dateFrom)} - ${formatShortDate(dateTo)}`
              : dateFrom
                ? `A partir de ${formatShortDate(dateFrom)}`
                : dateTo
                  ? `Até ${formatShortDate(dateTo)}`
                  : 'Data'
          }
          active={Boolean(dateFrom || dateTo)}
          isOpen={openFilter === 'date'}
          onToggle={() => toggleFilter('date')}
        >
          <label className={styles.panelField}>
            <span>De</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label className={styles.panelField}>
            <span>Até</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
        </FilterDropdown>

        <FilterDropdown
          label={maxPrice.trim() ? `Até R$ ${maxPrice}` : 'Preço'}
          active={Boolean(maxPrice.trim())}
          isOpen={openFilter === 'price'}
          onToggle={() => toggleFilter('price')}
        >
          <label className={styles.panelField}>
            <span>Até</span>
            <input
              type="number"
              min="0"
              placeholder="R$"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </label>
        </FilterDropdown>

        <div className={styles.sortWrapper}>
          <span className={styles.filterLabel}>Ordenar por</span>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
          >
            <option value="date">Data</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
          </select>
        </div>
      </div>

      <div className={styles.showcase}>
        <div className={styles.showcaseHeader}>
          {!loadingEvents && <span className={styles.count}>{sortedEvents.length} eventos encontrados</span>}
          {isFiltering && (
            <button type="button" className={styles.clearFilters} onClick={clearFilters}>
              Limpar filtros
            </button>
          )}
        </div>

        {loadingEvents && <LoadingState />}

        {!loadingEvents && loadError && <p className={styles.error}>Não foi possível carregar os eventos.</p>}

        {!loadingEvents && !loadError && sortedEvents.length === 0 && (
          <p className={styles.empty}>Nenhum evento encontrado.</p>
        )}

        {!loadingEvents && (
          <div className={styles.grid}>
            {sortedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
