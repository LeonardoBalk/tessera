import { Icon } from './Icon'
import styles from './CategoryShelf.module.css'

const CATEGORIES = [
  { label: 'Shows', icon: 'music_note' },
  { label: 'Teatro', icon: 'theater_comedy' },
  { label: 'Esportes', icon: 'sports_soccer' },
  { label: 'Outros', icon: 'grid_view' },
]

interface CategoryShelfProps {
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
}

export function CategoryShelf({ selectedCategory, onSelectCategory }: CategoryShelfProps) {
  return (
    <div className={styles.shelf}>
      <h2 className={styles.title}>Explore por categorias</h2>
      <div className={styles.row}>
        {CATEGORIES.map((category) => {
          const isActive = selectedCategory === category.label
          return (
            <button
              key={category.label}
              type="button"
              className={styles.item}
              onClick={() => onSelectCategory(isActive ? null : category.label)}
            >
              <div className={`${styles.iconBox} ${isActive ? styles.iconBoxActive : ''}`}>
                <Icon name={category.icon} size={26} color="var(--color-primary)" />
              </div>
              <span>{category.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
