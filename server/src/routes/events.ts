import { Router } from 'express'
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js'
import { supabase } from '../services/supabase.js'

const router = Router()

const EVENT_TYPES = ['seated', 'general_admission']

router.post('/', authMiddleware, requireRole('organizer'), async (req, res) => {
  const {
    sourceEventId,
    title,
    imageUrl,
    venueName,
    venueCity,
    eventDate,
    location,
    description,
    category,
    type,
    price,
    totalCapacity,
  } = req.body

  if (
    !title ||
    !eventDate ||
    !EVENT_TYPES.includes(type) ||
    typeof price !== 'number' ||
    price <= 0 ||
    !Number.isInteger(totalCapacity) ||
    totalCapacity <= 0
  ) {
    res.status(400).json({ error: 'missing or invalid required fields' })
    return
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      source_event_id: sourceEventId ?? null,
      title,
      image_url: imageUrl ?? null,
      venue_name: venueName ?? null,
      venue_city: venueCity ?? null,
      event_date: eventDate,
      location: location ?? null,
      description: description ?? null,
      category: category ?? null,
      type,
      price,
      total_capacity: totalCapacity,
      organizer_id: req.auth?.userId,
    })
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: 'failed to create event' })
    return
  }

  res.status(201).json(data)
})

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('event_date', { ascending: true })

  if (error) {
    res.status(500).json({ error: 'failed to list events' })
    return
  }

  res.json(data)
})

router.get('/mine', authMiddleware, requireRole('organizer'), async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', req.auth?.userId)
    .order('created_at', { ascending: false })

  if (error) {
    res.status(500).json({ error: 'failed to list events' })
    return
  }

  res.json(data)
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (error) {
    res.status(404).json({ error: 'event not found' })
    return
  }

  res.json(data)
})

router.patch('/:id', authMiddleware, requireRole('organizer'), async (req, res) => {
  const { data: existingEvent, error: fetchError } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', req.params.id)
    .single()

  if (fetchError || !existingEvent) {
    res.status(404).json({ error: 'event not found' })
    return
  }

  if (existingEvent.organizer_id !== req.auth?.userId) {
    res.status(403).json({ error: 'not the organizer of this event' })
    return
  }

  const {
    title,
    imageUrl,
    venueName,
    venueCity,
    eventDate,
    location,
    description,
    category,
    price,
    totalCapacity,
    status,
  } = req.body

  if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
    res.status(400).json({ error: 'invalid price' })
    return
  }

  if (totalCapacity !== undefined && (!Number.isInteger(totalCapacity) || totalCapacity <= 0)) {
    res.status(400).json({ error: 'invalid totalCapacity' })
    return
  }

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (imageUrl !== undefined) updates.image_url = imageUrl
  if (venueName !== undefined) updates.venue_name = venueName
  if (venueCity !== undefined) updates.venue_city = venueCity
  if (eventDate !== undefined) updates.event_date = eventDate
  if (location !== undefined) updates.location = location
  if (description !== undefined) updates.description = description
  if (category !== undefined) updates.category = category
  if (price !== undefined) updates.price = price
  if (totalCapacity !== undefined) updates.total_capacity = totalCapacity
  if (status !== undefined) updates.status = status

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) {
    res.status(500).json({ error: 'failed to update event' })
    return
  }

  res.json(data)
})

export default router
