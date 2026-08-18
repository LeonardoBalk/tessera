import { Router } from 'express'
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js'
import { verifyQrPayload } from '../services/qrSigner.js'
import { supabase } from '../services/supabase.js'

const router = Router()

router.get('/mine', authMiddleware, requireRole('customer'), async (req, res) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*, events(title, image_url, event_date, venue_name, venue_city)')
    .eq('customer_id', req.auth?.userId)
    .order('created_at', { ascending: false })

  if (error) {
    res.status(500).json({ error: 'failed to list tickets' })
    return
  }

  res.json(data)
})

router.post('/validate', authMiddleware, requireRole('gate_staff'), async (req, res) => {
  const { payload, eventId } = req.body

  if (!payload || !eventId) {
    res.status(400).json({ error: 'missing payload or eventId' })
    return
  }

  const decoded = verifyQrPayload(payload)
  if (!decoded) {
    res.json({ result: 'invalid' })
    return
  }

  const { data: validated } = await supabase
    .from('tickets')
    .update({ status: 'used', validated_at: new Date().toISOString(), validated_by: req.auth?.userId })
    .eq('id', decoded.ticketId)
    .eq('event_id', eventId)
    .eq('status', 'valid')
    .select('id, customer_id')
    .single()

  if (validated) {
    const { data: holder } = await supabase
      .from('users')
      .select('name')
      .eq('id', validated.customer_id)
      .single()

    res.json({ result: 'valid', holderName: holder?.name ?? null })
    return
  }

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, event_id, status')
    .eq('id', decoded.ticketId)
    .single()

  if (!ticket) {
    res.json({ result: 'invalid' })
    return
  }

  if (ticket.event_id !== eventId) {
    res.json({ result: 'wrong_event' })
    return
  }

  res.json({ result: 'already_used' })
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('id, status, qr_payload, events(title, image_url, event_date, venue_name, venue_city)')
    .eq('id', req.params.id)
    .single()

  if (error) {
    res.status(404).json({ error: 'ticket not found' })
    return
  }

  res.json(data)
})

export default router
