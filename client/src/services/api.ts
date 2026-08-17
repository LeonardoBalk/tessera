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
