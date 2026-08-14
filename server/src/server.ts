import cors from 'cors'
import 'dotenv/config'
import express from 'express'

const app = express()
const port = process.env.PORT ?? 3333

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => {
  console.log(`tessera server listening on port ${port}`)
})
