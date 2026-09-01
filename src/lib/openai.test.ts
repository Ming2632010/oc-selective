import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractJsonText, modelAllowsTemperature } from './openai';

describe('extractJsonText', () => {
  it('unwraps fenced JSON', () => {
    const raw = '```json\n{"questions":[]}\n```';
    assert.equal(extractJsonText(raw), '{"questions":[]}');
  });

  it('keeps the object when the model adds a short preface', () => {
    const raw = 'Here you go:\n{"questions":[{"skill":"format"}]}\nThanks';
    assert.equal(
      extractJsonText(raw),
      '{"questions":[{"skill":"format"}]}',
    );
  });
});

describe('modelAllowsTemperature', () => {
  it('keeps sampling for gpt-4o-mini and gpt-5-chat', () => {
    assert.equal(modelAllowsTemperature('gpt-4o-mini'), true);
    assert.equal(modelAllowsTemperature('gpt-5-chat-latest'), true);
  });

  it('omits temperature for reasoning models that reject it', () => {
    assert.equal(modelAllowsTemperature('gpt-5-mini'), false);
    assert.equal(modelAllowsTemperature('o3-mini'), false);
  });
});
