import { createHmac, timingSafeEqual } from 'node:crypto'

function hashFor(ticketId: string, eventId: string) {
  return createHmac('sha256', process.env.QR_SIGNING_SECRET ?? '')
    .update(`${ticketId}.${eventId}`)
    .digest('hex')
}

export function signQrPayload(ticketId: string, eventId: string) {
  return `${ticketId}.${eventId}.${hashFor(ticketId, eventId)}`
}

export function verifyQrPayload(payload: string) {
  const [ticketId, eventId, hash] = payload.split('.')
  if (!ticketId || !eventId || !hash) return null

  const expected = Buffer.from(hashFor(ticketId, eventId))
  const received = Buffer.from(hash)

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null
  }

  return { ticketId, eventId }
}
