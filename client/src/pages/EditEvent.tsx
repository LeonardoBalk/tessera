import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { LoadingState } from '../components/LoadingState'
import { PageLayout } from '../components/PageLayout'
import { useAuth } from '../context/AuthContext'
import { fetchEventById, updateEvent, type TesseraEvent } from '../services/api'
import styles from './EditEvent.module.css'

export function EditEvent() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, accessToken, loading: authLoading } = useAuth()

  const [event, setEvent] = useState<TesseraEvent | null>(null)
  const [notFound, setNotFound] = useState(false)

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
  const [status, setStatus] = useState<TesseraEvent['status']>('published')

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchEventById(id)
      .then((data) => {
        setEvent(data)
        setTitle(data.title)
        setImageUrl(data.image_url ?? '')
        setVenueName(data.venue_name ?? '')
        setVenueCity(data.venue_city ?? '')
        setEventDate(new Date(data.event_date).toISOString().slice(0, 16))
        setLocation(data.location ?? '')
        setDescription(data.description ?? '')
        setCategory(data.category ?? '')
        setPrice(String(data.price))
        setTotalCapacity(String(data.total_capacity))
        setStatus(data.status)
      })
      .catch(() => setNotFound(true))
  }, [id])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/entrar', { state: { from: `/organizador/eventos/${id}/editar` } })
    }
  }, [authLoading, user, id, navigate])

  if (notFound) {
    return (
      <PageLayout>
        <div className={styles.message}>
          <p>Evento não encontrado.</p>
          <Link to="/organizador/eventos">Voltar para meus eventos</Link>
        </div>
      </PageLayout>
    )
  }

  if (authLoading || !user || !event) {
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
          <p>Só contas de organizador podem editar eventos.</p>
          <Link to="/">Voltar para a home</Link>
        </div>
      </PageLayout>
    )
  }

  if (event.organizer_id !== user.id) {
    return (
      <PageLayout>
        <div className={styles.message}>
          <p>Esse evento não é seu.</p>
          <Link to="/organizador/eventos">Voltar para meus eventos</Link>
        </div>
      </PageLayout>
    )
  }

  async function handleSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault()
    if (!accessToken || !id) return

    setFormError(null)
    setSaved(false)

    const priceValue = Number(price)
    const capacityValue = Number(totalCapacity)

    if (!title.trim() || !eventDate || !(priceValue > 0) || !Number.isInteger(capacityValue) || capacityValue <= 0) {
      setFormError('Preencha título, data, preço e capacidade corretamente.')
      return
    }

    setSubmitting(true)

    try {
      const updated = await updateEvent(
        id,
        {
          title: title.trim(),
          imageUrl: imageUrl.trim() || null,
          venueName: venueName.trim() || null,
          venueCity: venueCity.trim() || null,
          eventDate: new Date(eventDate).toISOString(),
          location: location.trim() || null,
          description: description.trim() || null,
          category: category.trim() || null,
          price: priceValue,
          totalCapacity: capacityValue,
          status,
        },
        accessToken,
      )
      setEvent(updated)
      setSaved(true)
    } catch {
      setFormError('Não foi possível salvar as alterações.')
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

        <h1 className={styles.title}>Editar evento</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            Status
            <select value={status} onChange={(changeEvent) => setStatus(changeEvent.target.value as TesseraEvent['status'])}>
              <option value="published">Publicado</option>
              <option value="closed">Fechado</option>
            </select>
          </label>

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
            <textarea value={description} onChange={(changeEvent) => setDescription(changeEvent.target.value)} rows={4} />
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
          {saved && <p className={styles.saved}>Alterações salvas.</p>}

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </PageLayout>
  )
}
