const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function formatEventDate(isoDate: string) {
  const date = new Date(isoDate)
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
}
