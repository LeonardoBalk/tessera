import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Nav } from './Nav'
import styles from './PageLayout.module.css'

export function PageLayout({ children }: { children?: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Nav />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  )
}
