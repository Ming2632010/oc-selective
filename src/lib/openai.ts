import OpenAI from 'openai';

let client: OpenAI | null = null;

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  if (!client) {
    client = new OpenAI({
      apiKey,
      timeout: 25_000,
      maxRetries: 1,
    });
  }

  return client;
}

export function getOpenAIModel(): string {
  const raw = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  return raw.replace(/^["']|["']$/g, '');
}

/**
 * GPT-5 / o-series reasoning models reject a non-default temperature.
 * gpt-5-chat still accepts sampling params.
 */
export function modelAllowsTemperature(model: string): boolean {
  const name = model.toLowerCase();
  if (name.includes('gpt-5-chat')) return true;
  if (/^gpt-5($|-)/.test(name)) return false;
  if (/^(o1|o3|o4)(-|$)/.test(name)) return false;
  return true;
}

export function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const objectStart = candidate.indexOf('{');
  const objectEnd = candidate.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    return candidate.slice(objectStart, objectEnd + 1);
  }
  const arrayStart = candidate.indexOf('[');
  const arrayEnd = candidate.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return candidate.slice(arrayStart, arrayEnd + 1);
  }
  return candidate;
}

function errorText(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error);
  const record = error as {
    message?: unknown;
    error?: { message?: unknown };
  };
  return [record.message, record.error?.message]
    .filter((part) => typeof part === 'string')
    .join(' ');
}

type ChatParams = {
  model: string;
  messages: { role: 'system' | 'user'; content: string }[];
  temperature?: number;
  response_format?: { type: 'json_object' };
};

async function completeJson(params: ChatParams): Promise<string> {
  const completion = await getOpenAIClient().chat.completions.create(params);
  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('OpenAI returned empty content');
  }
  return extractJsonText(raw);
}

/**
 * Same JSON chat call used by writing marking and extra mini questions.
 */
export async function createJsonCompletion(input: {
  temperature: number;
  system: string;
  user: unknown;
}): Promise<string> {
  const model = getOpenAIModel();
  const messages: ChatParams['messages'] = [
    { role: 'system', content: input.system },
    {
      role: 'user',
      content:
        typeof input.user === 'string'
          ? input.user
          : JSON.stringify(input.user, null, 2),
    },
  ];

  const params: ChatParams = {
    model,
    messages,
    response_format: { type: 'json_object' },
  };
  if (modelAllowsTemperature(model)) {
    params.temperature = input.temperature;
  }

  try {
    return await completeJson(params);
  } catch (error) {
    const text = errorText(error);
    const retry: ChatParams = { ...params };
    let changed = false;
    if (/temperature/i.test(text) && retry.temperature !== undefined) {
      delete retry.temperature;
      changed = true;
    }
    if (/response_format|json_object/i.test(text) && retry.response_format) {
      delete retry.response_format;
      changed = true;
    }
    if (!changed) throw error;
    console.error('[openai] retrying chat completion without rejected params:', text);
    return completeJson(retry);
  }
}
