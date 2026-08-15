import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { supabase } from '../services/supabase.js'

const router = Router()

router.get('/me', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, name')
    .eq('id', req.auth?.userId)
    .single()

  if (error) {
    res.status(404).json({ error: 'user not found' })
    return
  }

  res.json(data)
})

export default router
