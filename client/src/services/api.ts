const API_URL = import.meta.env.VITE_API_URL.replace(/\/+$/, '')

export interface TesseraEvent {
  id: string
  source_event_id: string | null
  title: string
  image_url: string | null
  venue_name: string | null
  venue_city: string | null
  event_date: string
  location: string | null
  description: string | null
  category: string | null
  type: 'seated' | 'general_admission'
  price: number
  total_capacity: number
  organizer_id: string
  status: 'published' | 'closed'
  created_at: string
}

export interface OrganizerEventSummary extends TesseraEvent {
  sold_quantity: number
  has_bookings: boolean
}

export interface TesseraBooking {
  id: string
  event_id: string
  customer_id: string
  quantity: number | null
  status: 'pending' | 'paid' | 'declined' | 'canceled'
  expires_at: string | null
  created_at: string
}

export interface TesseraTicket {
  id: string
  booking_id: string
  status: 'valid' | 'used' | 'canceled'
  qr_payload: string
  validated_at: string | null
  events: {
    title: string
    image_url: string | null
    event_date: string
    venue_name: string | null
    venue_city: string | null
  } | null
}

export type TicketValidationResult = 'valid' | 'invalid' | 'already_used' | 'wrong_event'

export interface CatalogSearchResult {
  sourceEventId: string
  title: string
  imageUrl: string | null
  venueName: string | null
  venueCity: string | null
  eventDate: string | null
  category: string | null
}

export interface EventInput {
  sourceEventId?: string | null
  title: string
  imageUrl?: string | null
  venueName?: string | null
  venueCity?: string | null
  eventDate: string
  location?: string | null
  description?: string | null
  category?: string | null
  type: 'seated' | 'general_admission'
  price: number
  totalCapacity: number
}

export interface AiSearchResponse {
  message: string
  events: TesseraEvent[]
}

export async function fetchPublishedEvents(): Promise<TesseraEvent[]> {
  const response = await fetch(`${API_URL}/api/events`)

  if (!response.ok) {
    throw new Error('failed to load events')
  }

  return response.json()
}

export async function fetchEventById(id: string): Promise<TesseraEvent> {
  const response = await fetch(`${API_URL}/api/events/${id}`)

  if (!response.ok) {
    throw new Error('event not found')
  }

  return response.json()
}

export async function createBooking(
  eventId: string,
  quantity: number,
  accessToken: string,
): Promise<TesseraBooking> {
  const response = await fetch(`${API_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ eventId, quantity }),
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.error ?? 'failed to create booking')
  }

  return body
}

export async function cancelBooking(bookingId: string, accessToken: string): Promise<TesseraBooking> {
  const response = await fetch(`${API_URL}/api/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.error ?? 'failed to cancel booking')
  }

  return body
}

export async function fetchMyTickets(accessToken: string): Promise<TesseraTicket[]> {
  const response = await fetch(`${API_URL}/api/tickets/mine`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('failed to load tickets')
  }

  return response.json()
}

export async function fetchTicketById(id: string): Promise<TesseraTicket> {
  const response = await fetch(`${API_URL}/api/tickets/${id}`)

  if (!response.ok) {
    throw new Error('ticket not found')
  }

  return response.json()
}

export async function validateTicket(
  payload: string,
  eventId: string,
  accessToken: string,
): Promise<{ result: TicketValidationResult; holderName: string | null }> {
  const response = await fetch(`${API_URL}/api/tickets/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ payload, eventId }),
  })

  if (!response.ok) {
    throw new Error('failed to validate ticket')
  }

  return response.json()
}

export async function searchCatalog(
  keyword: string,
  city: string,
  accessToken: string,
): Promise<CatalogSearchResult[]> {
  const params = new URLSearchParams()
  if (keyword) params.set('keyword', keyword)
  if (city) params.set('city', city)

  const response = await fetch(`${API_URL}/api/catalog/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('failed to search catalog')
  }

  const body = await response.json()
  return body.events
}

export async function fetchMyEvents(accessToken: string): Promise<OrganizerEventSummary[]> {
  const response = await fetch(`${API_URL}/api/events/mine`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('failed to load events')
  }

  return response.json()
}

export async function createEvent(input: EventInput, accessToken: string): Promise<TesseraEvent> {
  const response = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.error ?? 'failed to create event')
  }

  return body
}

export async function updateEvent(
  id: string,
  input: Partial<EventInput> & { status?: 'published' | 'closed' },
  accessToken: string,
): Promise<TesseraEvent> {
  const response = await fetch(`${API_URL}/api/events/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.error ?? 'failed to update event')
  }

  return body
}

export async function deleteEvent(id: string, accessToken: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? 'failed to delete event')
  }
}

export async function suggestEvents(message: string): Promise<AiSearchResponse> {
  const response = await fetch(`${API_URL}/api/chat/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    throw new Error('failed to get suggestions')
  }

  return response.json()
}

export async function payBooking(
  bookingId: string,
  cardNumber: string,
  accessToken: string,
): Promise<TesseraBooking> {
  const response = await fetch(`${API_URL}/api/bookings/${bookingId}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ cardNumber }),
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.error ?? 'failed to process payment')
  }

  return body
}
