import OpenAI from 'openai';

let client: OpenAI | null = null;

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
