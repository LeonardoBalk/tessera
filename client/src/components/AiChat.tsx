import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { suggestEvents, type TesseraEvent } from '../services/api'
import { formatEventDate } from '../utils/formatEventDate'
import styles from './AiChat.module.css'

interface ChatTurn {
  id: string
  question: string
  reply: string
  events: TesseraEvent[]
}

const SUGGESTIONS = ['Shows esse mês', 'Até R$100', 'Teatro']

export function AiChat() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function ask(question: string) {
    if (!question.trim() || loading) return

    setMessage('')
    setLoading(true)
    setError(null)

    try {
      const response = await suggestEvents(question.trim())
      setTurns((current) => [
        ...current,
        { id: crypto.randomUUID(), question: question.trim(), reply: response.message, events: response.events },
      ])
    } catch {
      setError('Não foi possível processar sua busca agora.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault()
    ask(message)
  }

  return (
    <>
      <button type="button" className={styles.fab} onClick={() => setOpen((current) => !current)}>
        <Icon name={open ? 'close' : 'auto_awesome'} size={24} color="#ffffff" />
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <Icon name="auto_awesome" size={20} color="#ffffff" />
            <span>Assistente Tessera</span>
          </div>

          <div className={styles.messages}>
            {turns.length === 0 && (
              <div className={styles.intro}>
                <p>Oi! Descreva o evento que você procura e eu te ajudo a encontrar.</p>
                <div className={styles.suggestions}>
                  {SUGGESTIONS.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => ask(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((turn) => (
              <div key={turn.id} className={styles.turn}>
                <div className={styles.question}>{turn.question}</div>
                <div className={styles.reply}>{turn.reply}</div>

                {turn.events.length > 0 && (
                  <div className={styles.results}>
                    {turn.events.map((event) => (
                      <Link key={event.id} to={`/eventos/${event.id}`} className={styles.resultItem}>
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
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && <div className={styles.typing}>Pensando...</div>}
            {error && <div className={styles.error}>{error}</div>}
          </div>

          <form onSubmit={handleSubmit} className={styles.inputRow}>
            <input
              value={message}
              onChange={(changeEvent) => setMessage(changeEvent.target.value)}
              placeholder="Digite uma mensagem"
            />
            <button type="submit" disabled={loading}>
              <Icon name="send" size={18} color="#ffffff" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
