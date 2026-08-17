import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TesseraEvent } from '../services/api'
import { formatEventDate } from '../utils/formatEventDate'
import { Icon } from './Icon'
import styles from './SearchBar.module.css'

interface SearchBarProps {
  searchText: string
  onSearchChange: (value: string) => void
  searchResults: TesseraEvent[]
}

export function SearchBar({ searchText, onSearchChange, searchResults }: SearchBarProps) {
  const [searchFocused, setSearchFocused] = useState(false)

  const showResults = searchFocused && searchText.trim() !== ''

  return (
    <div className={styles.row}>
      <div className={styles.searchWrapper}>
        <div className={styles.searchField}>
          <Icon name="search" size={20} color="var(--color-primary)" />
          <input
            type="text"
            placeholder="Buscar eventos, artistas, locais..."
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {showResults && (
          <div className={styles.resultsPanel} onMouseDown={(event) => event.preventDefault()}>
            {searchResults.length === 0 ? (
              <div className={styles.resultsEmpty}>Nenhum resultado para &quot;{searchText}&quot;</div>
            ) : (
              searchResults.map((event) => (
                <Link
                  key={event.id}
                  to={`/eventos/${event.id}`}
                  className={styles.resultItem}
                  onClick={() => setSearchFocused(false)}
                >
                  <div className={styles.resultThumb}>
                    {event.image_url && <img src={event.image_url} alt="" />}
                  </div>
                  <div className={styles.resultInfo}>
                    <div className={styles.resultTitle}>{event.title}</div>
                    <div className={styles.resultMeta}>
                      {formatEventDate(event.event_date)}
                      {event.venue_city ? ` · ${event.venue_city}` : ''}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
