import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import authRouter from './routes/auth.js'
import eventsRouter from './routes/events.js'
import ticketmasterRouter from './routes/ticketmaster.js'

const app = express()
const port = process.env.PORT ?? 3333

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/catalog', ticketmasterRouter)
app.use('/api/auth', authRouter)
app.use('/api/events', eventsRouter)

app.listen(port, () => {
  console.log(`tessera server listening on port ${port}`)
})
