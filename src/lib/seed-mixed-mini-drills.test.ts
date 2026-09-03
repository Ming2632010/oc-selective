import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { markMiniItem } from './mark-mini-item';
import { parseMiniPrompt, publicMiniPrompt } from './mini-item-kinds';
import { SEED_EXTRA_MINI_DRILLS } from './seed-extra-mini-drills';
import { SEED_MINI_DRILLS } from './seed-mini-drills';
import { SEED_MIXED_MINI_DRILLS } from './seed-mixed-mini-drills';

describe('mixed mini bank', () => {
  it('stores eight mixed items for each unit', () => {
    assert.equal(SEED_MIXED_MINI_DRILLS.length, 88);
    for (let unit = 1; unit <= 11; unit += 1) {
      const inUnit = SEED_MIXED_MINI_DRILLS.filter((drill) => drill.module_id === unit);
      assert.equal(inUnit.length, 8, `unit ${unit}`);
      const kinds = inUnit.map((drill) => drill.item_kind).sort();
      assert.deepEqual(kinds, [
        'order',
        'order',
        'rewrite',
        'rewrite',
        'short_write',
        'short_write',
        'spelling',
        'spelling',
      ]);
    }
  });

  it('uses unique slugs across all mini banks', () => {
    const slugs = [
      ...SEED_MINI_DRILLS.map((drill) => drill.slug),
      ...SEED_EXTRA_MINI_DRILLS.map((drill) => drill.slug),
      ...SEED_MIXED_MINI_DRILLS.map((drill) => drill.slug),
    ];
    assert.equal(new Set(slugs).size, slugs.length);
  });

  it('keeps answers out of the public prompt', () => {
    const spelling = SEED_MIXED_MINI_DRILLS.find((drill) => drill.item_kind === 'spelling');
    assert.ok(spelling);
    const publicPrompt = publicMiniPrompt(spelling.item_kind, spelling.prompt);
    assert.equal('accepted' in publicPrompt, false);
    assert.ok(publicPrompt.misspelled);

    const order = SEED_MIXED_MINI_DRILLS.find((drill) => drill.item_kind === 'order');
    assert.ok(order);
    const publicOrder = publicMiniPrompt(order.item_kind, order.prompt);
    assert.equal('sentences' in publicOrder, false);
    assert.ok(Array.isArray(publicOrder.shuffled));
  });

  it('marks each seeded sample or accepted spelling as correct', () => {
    for (const drill of SEED_MIXED_MINI_DRILLS) {
      const prompt = parseMiniPrompt(drill.item_kind, drill.prompt);
      if (drill.item_kind === 'spelling' && 'accepted' in prompt) {
        const result = markMiniItem({
          kind: 'spelling',
          correctIndex: 0,
          answerText: prompt.accepted[0],
          prompt,
          explanation: drill.explanation,
        });
        assert.equal(result.isCorrect, true, drill.slug);
      } else if (drill.item_kind === 'order' && 'sentences' in prompt) {
        const answerOrder = prompt.sentences.map((line) => prompt.shuffled.indexOf(line));
        const result = markMiniItem({
          kind: 'order',
          correctIndex: 0,
          answerOrder,
          prompt,
          explanation: drill.explanation,
        });
        assert.equal(result.isCorrect, true, drill.slug);
        assert.ok(
          prompt.shuffled.length === prompt.sentences.length &&
            new Set(prompt.shuffled).size === prompt.sentences.length,
          drill.slug,
        );
      } else if (
        (drill.item_kind === 'rewrite' || drill.item_kind === 'short_write') &&
        'sample' in prompt
      ) {
        const result = markMiniItem({
          kind: drill.item_kind,
          correctIndex: 0,
          answerText: prompt.sample,
          prompt,
          explanation: drill.explanation,
        });
        assert.equal(result.isCorrect, true, `${drill.slug}: ${result.checks.filter((c) => !c.passed).map((c) => c.label).join('; ')}`);
      }
    }
  });
});
