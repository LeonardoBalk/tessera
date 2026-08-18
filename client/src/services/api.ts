const API_URL = import.meta.env.VITE_API_URL

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
