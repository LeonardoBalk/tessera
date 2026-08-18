import { Router } from 'express'
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js'
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
