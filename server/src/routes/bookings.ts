import { Router } from 'express'
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js'
import { supabase } from '../services/supabase.js'

const router = Router()

const DECLINED_CARD_NUMBER = '0000000000000002'

router.post('/', authMiddleware, requireRole('customer'), async (req, res) => {
  const { eventId, quantity } = req.body

  if (!eventId || !Number.isInteger(quantity) || quantity < 1) {
    res.status(400).json({ error: 'missing or invalid eventId/quantity' })
    return
  }

  const { data, error } = await supabase.rpc('book_general_admission', {
    p_event_id: eventId,
    p_customer_id: req.auth?.userId,
    p_quantity: quantity,
  })

  if (error) {
    res.status(409).json({ error: error.message })
    return
  }

  res.status(201).json(data)
})

router.get('/mine', authMiddleware, requireRole('customer'), async (req, res) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, events(title, event_date, venue_name)')
    .eq('customer_id', req.auth?.userId)
    .order('created_at', { ascending: false })

  if (error) {
    res.status(500).json({ error: 'failed to list bookings' })
    return
  }

  res.json(data)
})

router.post('/:id/pay', authMiddleware, requireRole('customer'), async (req, res) => {
  const { cardNumber } = req.body

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, event_id, customer_id, quantity, status')
    .eq('id', req.params.id)
    .single()

  if (fetchError || !booking) {
    res.status(404).json({ error: 'booking not found' })
    return
  }

  if (booking.customer_id !== req.auth?.userId) {
    res.status(403).json({ error: 'not the owner of this booking' })
    return
  }

  const nextStatus = cardNumber === DECLINED_CARD_NUMBER ? 'declined' : 'paid'

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: nextStatus })
    .eq('id', req.params.id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .select()
    .single()

  if (error || !data) {
    res.status(409).json({ error: 'booking is not pending payment or has expired' })
    return
  }

  res.json(data)
})

export default router
