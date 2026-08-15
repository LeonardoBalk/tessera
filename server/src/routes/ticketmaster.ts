import { Router } from 'express'
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.js'

interface TicketmasterImage {
  url: string
  ratio?: string
  width?: number
}

interface TicketmasterVenue {
  name?: string
  city?: { name?: string }
}

interface TicketmasterClassification {
  segment?: { name?: string }
}

interface TicketmasterEvent {
  id: string
  name: string
  images?: TicketmasterImage[]
  dates?: { start?: { localDate?: string; dateTime?: string } }
  classifications?: TicketmasterClassification[]
  _embedded?: { venues?: TicketmasterVenue[] }
}

interface TicketmasterSearchResponse {
  _embedded?: { events?: TicketmasterEvent[] }
}

interface CatalogEvent {
  sourceEventId: string
  title: string
  imageUrl: string | null
  venueName: string | null
  venueCity: string | null
  eventDate: string | null
  category: string | null
}

const router = Router()

function pickImage(images: TicketmasterImage[] = []) {
  const widescreen = images.find((image) => image.ratio === '16_9' && (image.width ?? 0) >= 640)
  return widescreen?.url ?? images[0]?.url ?? null
}

function toCatalogEvent(event: TicketmasterEvent): CatalogEvent {
  const venue = event._embedded?.venues?.[0]
  return {
    sourceEventId: event.id,
    title: event.name,
    imageUrl: pickImage(event.images),
    venueName: venue?.name ?? null,
    venueCity: venue?.city?.name ?? null,
    eventDate: event.dates?.start?.dateTime ?? event.dates?.start?.localDate ?? null,
    category: event.classifications?.[0]?.segment?.name ?? null,
  }
}

router.get('/search', authMiddleware, requireRole('organizer'), async (req, res) => {
  const keyword = req.query.keyword?.toString()
  const city = req.query.city?.toString()

  const params = new URLSearchParams({
    apikey: process.env.TICKETMASTER_API_KEY ?? '',
    countryCode: 'BR',
    locale: 'pt-br',
  })
  if (keyword) params.set('keyword', keyword)
  if (city) params.set('city', city)

  const ticketmasterResponse = await fetch(
    `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`,
  )

  if (!ticketmasterResponse.ok) {
    res.status(502).json({ error: 'ticketmaster catalog unavailable' })
    return
  }

  const payload: TicketmasterSearchResponse = await ticketmasterResponse.json()
  const events = (payload._embedded?.events ?? []).map(toCatalogEvent)

  res.json({ events })
})

export default router
