import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BONUS_EXAM_PROMPTS } from './seed-bonus-exams';
import { isExamStyleKind, SEED_PROMPTS } from './seed-prompts';
import { UNITS, unitsByGroup } from './units';

describe('writing prompt bank', () => {
  it('gives every unit three practice tasks and one term-review test', () => {
    for (const unit of UNITS) {
      const inUnit = SEED_PROMPTS.filter((p) => p.module_id === unit.id);
      const practice = inUnit.filter((p) => (p.kind ?? 'practice') === 'practice');
      const tests = inUnit.filter((p) => p.kind === 'test');
      assert.equal(practice.length, 3, `unit ${unit.id} practice`);
      assert.equal(tests.length, 1, `unit ${unit.id} test`);
      assert.ok(
        tests.every((p) => p.prompt_type === unit.type),
        `unit ${unit.id} test type`,
      );
      assert.ok(
        practice.every((p) => p.prompt_type === unit.type),
        `unit ${unit.id} practice type`,
      );
    }
  });

  it('matches term-review count to the number of units in each group', () => {
    for (const group of ['Creative', 'Informative', 'Persuasive'] as const) {
      const unitIds = new Set(unitsByGroup(group).map((u) => u.id));
      const tests = SEED_PROMPTS.filter(
        (p) => p.kind === 'test' && unitIds.has(p.module_id),
      );
      assert.equal(tests.length, unitIds.size, group);
    }
  });

  it('uses unique titles across the bank', () => {
    const titles = SEED_PROMPTS.map((p) => p.title);
    assert.equal(new Set(titles).size, titles.length);
  });

  it('attaches image or quote stimuli to some papers', () => {
    const withImage = SEED_PROMPTS.filter((p) => p.stimulus_image);
    const withQuote = SEED_PROMPTS.filter((p) => p.stimulus_quote);
    assert.ok(withImage.length >= 4, 'image stimuli');
    assert.ok(withQuote.length >= 3, 'quote stimuli');
    assert.ok(withImage.some((p) => p.kind === 'practice'));
    assert.ok(withImage.some((p) => p.kind === 'test'));
  });

  it('keeps six original bonus exam papers out of the unit banks', () => {
    assert.equal(BONUS_EXAM_PROMPTS.length, 6);
    assert.ok(BONUS_EXAM_PROMPTS.every((p) => p.kind === 'bonus'));
    assert.ok(BONUS_EXAM_PROMPTS.every((p) => p.module_id === 12));
    assert.ok(BONUS_EXAM_PROMPTS.every((p) => p.time_limit_minutes === 30));
    const titles = BONUS_EXAM_PROMPTS.map((p) => p.title.toLowerCase());
    const banned = ['superhero', '2099', 'shipping container', 'on the loose', 'film making'];
    assert.ok(
      banned.every((word) => titles.every((title) => !title.includes(word))),
      'bonus titles stay original',
    );
    const types = BONUS_EXAM_PROMPTS.map((p) => p.prompt_type).sort();
    assert.deepEqual(types, [
      'diary_entry',
      'email',
      'narrative',
      'news_report',
      'news_report',
      'speech',
    ]);
    assert.equal(isExamStyleKind('bonus'), true);
    assert.equal(isExamStyleKind('test'), true);
    assert.equal(isExamStyleKind('practice'), false);
  });

  it('includes mixed-purpose jobs on some practice and some tests', () => {
    const mixed = SEED_PROMPTS.filter((p) => (p.purposes?.length ?? 0) >= 2);
    assert.ok(mixed.some((p) => (p.kind ?? 'practice') === 'practice'));
    assert.ok(mixed.some((p) => p.kind === 'test'));
    assert.ok(mixed.some((p) => p.purpose_note));
  });
});
