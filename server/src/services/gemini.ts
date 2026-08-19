const MODEL = 'gemini-3.6-flash'

interface EventFilters {
  category: string | null
  city: string | null
  dateFrom: string | null
  dateTo: string | null
  maxPrice: number | null
}

async function generateContent(prompt: string, responseSchema?: object) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        ...(responseSchema && {
          generationConfig: { responseMimeType: 'application/json', responseSchema },
        }),
      }),
    },
  )

  if (!response.ok) {
    throw new Error('gemini request failed')
  }

  const body = await response.json()
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error('gemini returned no content')
  }

  return text
}

export async function extractEventFilters(message: string): Promise<EventFilters> {
  const today = new Date().toISOString().slice(0, 10)
  const prompt = `Hoje é ${today}. Extraia filtros de busca de eventos da frase do usuário abaixo. Nunca invente nomes de eventos ou dados que não estejam na frase, extraia só o que foi pedido. Se um filtro não aparecer, retorne null pra ele. Se a frase mencionar um período de tempo (um dia específico, "hoje", um fim de semana, um mês inteiro), calcule o intervalo de datas correspondente e retorne em dateFrom e dateTo, ambos no formato "AAAA-MM-DD", cobrindo do primeiro ao último dia desse período. Se for um único dia, dateFrom e dateTo devem ser iguais.

Frase: "${message}"`

  const text = await generateContent(prompt, {
    type: 'OBJECT',
    properties: {
      category: { type: 'STRING', nullable: true },
      city: { type: 'STRING', nullable: true },
      dateFrom: { type: 'STRING', nullable: true },
      dateTo: { type: 'STRING', nullable: true },
      maxPrice: { type: 'NUMBER', nullable: true },
    },
  })

  return JSON.parse(text)
}

export async function generateClarificationReply(message: string) {
  const prompt = `O usuário escreveu "${message}" numa busca de eventos, mas a frase não tem nenhum critério de busca reconhecível (categoria, cidade, data ou preço). Escreva de 1 a 2 frases curtas pedindo pra ele descrever que tipo de evento procura, em que cidade, data ou faixa de preço. Em português, sem clichê de assistente de IA, sem travessão.`

  const text = await generateContent(prompt)
  return text.trim()
}

export async function generateSuggestionReply(message: string, eventTitles: string[]) {
  const prompt = eventTitles.length
    ? `O usuário buscou eventos com a frase: "${message}". A busca já filtrou os eventos corretamente no banco de dados e encontrou estes: ${eventTitles.join(', ')}. Escreva de 1 a 2 frases curtas confirmando esse resultado pro usuário. Não analise nem comente se os eventos batem com os critérios da busca, isso já está garantido. Não repita os critérios em detalhe. Em português, sem clichê de assistente de IA, sem travessão.`
    : `O usuário buscou eventos com a frase: "${message}". A busca não encontrou nenhum evento no banco de dados com esses critérios. Escreva de 1 a 2 frases curtas avisando isso pro usuário, em português, sem clichê de assistente de IA, sem travessão.`

  const text = await generateContent(prompt)
  return text.trim()
}
