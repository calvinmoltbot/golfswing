export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function callOpenRouterJson<T>({
  model,
  messages
}: {
  model: string;
  messages: ChatMessage[];
}): Promise<T> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('Missing OPENROUTER_API_KEY');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
      'X-Title': process.env.OPENROUTER_TITLE || 'Golf Swing Analyzer'
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (!content || typeof content !== 'string') {
    throw new Error('No message content returned from OpenRouter');
  }

  return JSON.parse(content) as T;
}
