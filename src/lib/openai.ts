import OpenAI from 'openai';

let client: OpenAI | null = null;

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

export function getOpenAIModel(): string {
  const raw = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  return raw.replace(/^["']|["']$/g, '');
}

/**
 * Same JSON chat call used by writing marking and extra mini questions.
 */
export async function createJsonCompletion(input: {
  temperature: number;
  system: string;
  user: unknown;
}): Promise<string> {
  const client = getOpenAIClient();
  const model = getOpenAIModel();
  const completion = await client.chat.completions.create({
    model,
    temperature: input.temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: input.system },
      {
        role: 'user',
        content:
          typeof input.user === 'string'
            ? input.user
            : JSON.stringify(input.user, null, 2),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('OpenAI returned empty content');
  }
  return raw;
}
