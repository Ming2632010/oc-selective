import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildDecodeGuide,
  defaultPurposes,
  gradeDecode,
  parseDecodeGuide,
} from './decode-guide';

describe('buildDecodeGuide', () => {
  it('builds three-option decode chips from a narrative prompt', () => {
    const guide = buildDecodeGuide({
      prompt_type: 'narrative',
      title: 'The empty seat',
      description:
        'Look at the picture. Write a narrative about what happens when you read the note.',
      decode_topic: 'what happens when you read the note and take the empty bus seat',
    });
    assert.equal(guide.form, 'narrative');
    assert.equal(guide.formLabel, 'Narrative');
    assert.equal(guide.formOptions.length, 3);
    assert.ok(guide.formOptions.includes('Narrative'));
    assert.ok(guide.topicOptions.includes(guide.topic));
    assert.ok(guide.audienceOptions.includes(guide.audience));
    assert.deepEqual(
      gradeDecode(guide, {
        formLabel: 'Narrative',
        topic: guide.topic,
        audience: guide.audience,
      }),
      { form: true, topic: true, audience: true },
    );
  });

  it('parses stored JSON and rejects junk', () => {
    const guide = buildDecodeGuide({
      prompt_type: 'email',
      title: 'Group project meeting',
      description: 'Write an email to your teacher.',
    });
    assert.deepEqual(parseDecodeGuide(JSON.stringify(guide)), guide);
    assert.equal(parseDecodeGuide({ hello: true }), null);
  });
});

describe('defaultPurposes', () => {
  it('maps text types to a primary job', () => {
    assert.deepEqual(defaultPurposes('explanation'), ['inform']);
    assert.deepEqual(defaultPurposes('speech'), ['persuade']);
    assert.deepEqual(defaultPurposes('narrative'), ['narrate']);
  });
});
