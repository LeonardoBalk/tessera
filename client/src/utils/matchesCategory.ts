const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Shows: ['música', 'musica', 'show', 'rock', 'pop', 'mpb', 'sertanejo', 'forró', 'forro'],
  Teatro: ['teatro', 'peça', 'peca'],
  Esportes: ['esporte', 'sport', 'futebol'],
  Outros: ['variado', 'diverso', 'miscel'],
}

export function matchesCategory(rawCategory: string | null, shelfLabel: string) {
  if (!rawCategory) return false
  const normalized = rawCategory.toLowerCase()
  const keywords = CATEGORY_KEYWORDS[shelfLabel] ?? []
  return keywords.some((keyword) => normalized.includes(keyword))
}
