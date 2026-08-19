import styles from './LoadingState.module.css'

export function LoadingState() {
  return (
    <div className={styles.loading}>
      <span className={styles.spinner} />
    </div>
  )
}
