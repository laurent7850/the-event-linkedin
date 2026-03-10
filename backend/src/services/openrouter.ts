import { logger } from '../utils/logger';

interface GenerationResult {
  content: string;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  cost?: number;
}

export async function generateContent(
  systemPrompt: string,
  userPrompt: string
): Promise<GenerationResult> {
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4-20250514';
  const temperature = parseFloat(process.env.OPENROUTER_TEMPERATURE || '0.7');
  const maxTokens = parseInt(process.env.OPENROUTER_MAX_TOKENS || '2000', 10);
  const timeout = parseInt(process.env.OPENROUTER_TIMEOUT_MS || '30000', 10);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'https://the-event.be',
        'X-Title': 'The Event LinkedIn Generator',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const errText = await resp.text();
      logger.error('OpenRouter API error', { status: resp.status });
      throw new Error(`OpenRouter error: ${resp.status}`);
    }

    const data: any = await resp.json();
    const choice = data.choices?.[0];
    if (!choice?.message?.content) {
      throw new Error('Empty response from OpenRouter');
    }

    return {
      content: choice.message.content,
      model: data.model || model,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost: data.usage?.total_cost,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`OpenRouter request timed out after ${timeout}ms`);
    }
    throw err;
  }
}
