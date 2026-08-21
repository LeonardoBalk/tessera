import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LoadingState } from '../components/LoadingState'
import { PageLayout } from '../components/PageLayout'
import { useAuth } from '../context/AuthContext'
import { createEvent, searchCatalog, type CatalogSearchResult } from '../services/api'
import { formatEventDate } from '../utils/formatEventDate'
import styles from './CreateEvent.module.css'

export function CreateEvent() {
  const navigate = useNavigate()
  const { user, accessToken, loading: authLoading } = useAuth()

  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [results, setResults] = useState<CatalogSearchResult[]>([])

  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [venueName, setVenueName] = useState('')
  const [venueCity, setVenueCity] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [totalCapacity, setTotalCapacity] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/entrar', { state: { from: '/organizador/eventos/novo' } })
    }
  }, [authLoading, user, navigate])

  if (authLoading || !user) {
    return (
      <PageLayout>
        <LoadingState />
      </PageLayout>
    )
  }

  if (user.role !== 'organizer') {
    return (
      <PageLayout>
        <div className={styles.message}>
          <p>Só contas de organizador podem criar eventos.</p>
          <Link to="/">Voltar para a home</Link>
        </div>
      </PageLayout>
    )
  }

  async function handleSearch(searchEvent: FormEvent) {
    searchEvent.preventDefault()
    if (!accessToken) return

    setSearchError(null)
    setSearching(true)

    try {
      const data = await searchCatalog(keyword, city, accessToken)
      setResults(data)
    } catch {
      setSearchError('Não foi possível buscar no catálogo.')
    } finally {
      setSearching(false)
    }
  }

  function applyResult(result: CatalogSearchResult) {
    setTitle(result.title)
    setImageUrl(result.imageUrl ?? '')
    setVenueName(result.venueName ?? '')
    setVenueCity(result.venueCity ?? '')
    setCategory(result.category ?? '')
    if (result.eventDate) {
      setEventDate(new Date(result.eventDate).toISOString().slice(0, 16))
    }
  }

  async function handleSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault()
    if (!accessToken) return

    setFormError(null)

    const priceValue = Number(price)
    const capacityValue = Number(totalCapacity)

    if (!title.trim() || !eventDate || !(priceValue > 0) || !Number.isInteger(capacityValue) || capacityValue <= 0) {
      setFormError('Preencha título, data, preço e capacidade corretamente.')
      return
    }

    setSubmitting(true)

    try {
      const created = await createEvent(
        {
          title: title.trim(),
          imageUrl: imageUrl.trim() || null,
          venueName: venueName.trim() || null,
          venueCity: venueCity.trim() || null,
          eventDate: new Date(eventDate).toISOString(),
          location: location.trim() || null,
          description: description.trim() || null,
          category: category.trim() || null,
          type: 'general_admission',
          price: priceValue,
          totalCapacity: capacityValue,
        },
        accessToken,
      )
      navigate(`/organizador/eventos/${created.id}/editar`)
    } catch {
      setFormError('Não foi possível criar o evento.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageLayout>
      <div className={styles.page}>
        <Link to="/organizador/eventos" className={styles.back}>
          <Icon name="chevron_left" size={20} color="currentColor" />
          Meus eventos
        </Link>

        <h1 className={styles.title}>Criar evento</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Buscar no catálogo</h2>
          <p className={styles.sectionHint}>Encontre um evento real e use como base, ou pule direto pro formulário.</p>

          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              value={keyword}
              onChange={(changeEvent) => setKeyword(changeEvent.target.value)}
              placeholder="Palavra-chave (ex: Rock in Rio)"
            />
            <input
              value={city}
              onChange={(changeEvent) => setCity(changeEvent.target.value)}
              placeholder="Cidade (opcional)"
            />
            <button type="submit" className={styles.searchButton} disabled={searching}>
                   <Icon name="search" size={20} color="var(--color-background)" />
            </button>
          </form>

          {searchError && <p className={styles.error}>{searchError}</p>}

          {results.length > 0 && (
            <div className={styles.results}>
              {results.map((result) => (
                <button
                  key={result.sourceEventId}
                  type="button"
                  className={styles.resultItem}
                  onClick={() => applyResult(result)}
                >
                  <div className={styles.resultThumb}>
                    {result.imageUrl && <img src={result.imageUrl} alt="" />}
                  </div>
                  <div>
                    <div className={styles.resultTitle}>{result.title}</div>
                    <div className={styles.resultMeta}>
                      {result.eventDate ? formatEventDate(result.eventDate) : ''}
                      {result.venueCity ? ` · ${result.venueCity}` : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Detalhes do evento</h2>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.field}>
              Título
              <input value={title} onChange={(changeEvent) => setTitle(changeEvent.target.value)} required />
            </label>

            <label className={styles.field}>
              Imagem (URL)
              <input value={imageUrl} onChange={(changeEvent) => setImageUrl(changeEvent.target.value)} />
            </label>

            <div className={styles.fieldRow}>
              <label className={styles.field}>
                Local
                <input value={venueName} onChange={(changeEvent) => setVenueName(changeEvent.target.value)} />
              </label>
              <label className={styles.field}>
                Cidade
                <input value={venueCity} onChange={(changeEvent) => setVenueCity(changeEvent.target.value)} />
              </label>
            </div>

            <label className={styles.field}>
              Data e hora
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(changeEvent) => setEventDate(changeEvent.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              Endereço
              <input value={location} onChange={(changeEvent) => setLocation(changeEvent.target.value)} />
            </label>

            <label className={styles.field}>
              Categoria
              <input value={category} onChange={(changeEvent) => setCategory(changeEvent.target.value)} />
            </label>

            <label className={styles.field}>
              Descrição
              <textarea
                value={description}
                onChange={(changeEvent) => setDescription(changeEvent.target.value)}
                rows={4}
              />
            </label>

            <div className={styles.fieldRow}>
              <label className={styles.field}>
                Preço (R$)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(changeEvent) => setPrice(changeEvent.target.value)}
                  required
                />
              </label>
              <label className={styles.field}>
                Capacidade total
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={totalCapacity}
                  onChange={(changeEvent) => setTotalCapacity(changeEvent.target.value)}
                  required
                />
              </label>
            </div>

            {formError && <p className={styles.error}>{formError}</p>}

            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? 'Criando...' : 'Criar evento'}
            </button>
          </form>
        </section>
      </div>
    </PageLayout>
  )
}
