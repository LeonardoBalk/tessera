import styles from './Icon.module.css'

interface IconProps {
  name: string
  size?: number
  color?: string
}

export function Icon({ name, size = 24, color }: IconProps) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined ${styles.icon}`} style={{ fontSize: size, color }}>
      {name}
    </span>
  )
}
