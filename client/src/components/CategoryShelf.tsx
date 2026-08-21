import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import styles from './CategoryShelf.module.css'

const CATEGORIES = [
  { label: 'Shows', icon: 'music_note' },
  { label: 'Teatro', icon: 'theater_comedy' },
  { label: 'Esportes', icon: 'sports_soccer' },
  { label: 'Outros', icon: 'grid_view' },
]

export function CategoryShelf() {
  return (
    <div className={styles.shelf}>
      <h2 className={styles.title}>Explore por categorias</h2>
      <div className={styles.row}>
        {CATEGORIES.map((category) => (
          <Link key={category.label} to={`/eventos?categoria=${category.label}`} className={styles.item}>
            <div className={styles.iconBox}>
              <Icon name={category.icon} size={26} color="var(--color-primary)" />
            </div>
            <span>{category.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
