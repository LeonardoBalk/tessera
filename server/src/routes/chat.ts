import { Router } from 'express'
import { extractEventFilters, generateClarificationReply, generateSuggestionReply } from '../services/gemini.js'
import { supabase } from '../services/supabase.js'

const router = Router()

router.post('/suggest', async (req, res) => {
  const { message } = req.body

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'missing message' })
    return
  }

  let filters
  try {
    filters = await extractEventFilters(message)
  } catch {
    res.status(502).json({ error: 'ai service unavailable' })
    return
  }

  const hasCriteria = Boolean(
    filters.category || filters.city || filters.dateFrom || filters.dateTo || typeof filters.maxPrice === 'number',
  )

  if (!hasCriteria) {
    let clarification: string
    try {
      clarification = await generateClarificationReply(message)
    } catch {
      res.status(502).json({ error: 'ai service unavailable' })
      return
    }

    res.json({ message: clarification, events: [] })
    return
  }

  let query = supabase.from('events').select('*').eq('status', 'published')

  if (filters.category) query = query.ilike('category', `%${filters.category}%`)
  if (filters.city) query = query.ilike('venue_city', `%${filters.city}%`)
  if (typeof filters.maxPrice === 'number') query = query.lte('price', filters.maxPrice)

  if (filters.dateFrom) {
    query = query.gte('event_date', `${filters.dateFrom}T00:00:00Z`)
  }

  if (filters.dateTo) {
    const exclusiveEnd = new Date(`${filters.dateTo}T00:00:00Z`)
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1)
    query = query.lt('event_date', exclusiveEnd.toISOString())
  }

  const { data: events, error } = await query.order('event_date', { ascending: true })

  if (error) {
    res.status(500).json({ error: 'failed to search events' })
    return
  }

  let reply: string
  try {
    reply = await generateSuggestionReply(
      message,
      (events ?? []).map((event) => event.title),
    )
  } catch {
    res.status(502).json({ error: 'ai service unavailable' })
    return
  }

  res.json({ message: reply, events: events ?? [] })
})

export default router
