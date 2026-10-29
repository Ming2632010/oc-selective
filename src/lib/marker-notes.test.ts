import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  annotationSegments,
  buildMarkerNotesHeuristic,
  combineRemoteMarkerNotes,
  inferPhotoKind,
  isFormConventionLine,
  isGreetingAccuracyFalsePositive,
  markerNotesFromUnknown,
  normalizeMarkerNotes,
  photoTaskCardCopy,
} from './marker-notes';
import { stimulusFocusFor } from './stimulus-focus';

describe('buildMarkerNotesHeuristic', () => {
  it('marks spelling, missing apostrophes, and keeps the student’s own sentences for rewrites', () => {
    const content =
      'The gardian opened the gate. I dont stop. Dust hung in the air.';
    const notes = buildMarkerNotesHeuristic({
      content,
      promptType: 'narrative',
      hintPoints: ['Open with a hook and set the scene clearly'],
    });
    const kinds = notes.annotations.map((row) => row.kind);
    assert.ok(kinds.includes('spelling'));
    assert.ok(kinds.includes('punctuation'));
    assert.ok(notes.annotations.some((row) => row.quote.toLowerCase() === 'gardian'));
    assert.ok(notes.rewrites.some((row) => row.original.includes('gardian')));
    assert.match(notes.summary, /Set A/);
    assert.match(notes.summary, /Set B/);
  });

  it('flags a short narrative as under-developed Selective content', () => {
    const content =
      'The handle turned. Dust hung in the air. I ran out with a glowing jar in my pocket.';
    const notes = buildMarkerNotesHeuristic({
      content,
      promptType: 'narrative',
      hintPoints: [
        'Open with a hook and set the scene clearly',
        'Build tension through the middle with vivid detail',
        'Resolve the story with a satisfying or surprising ending',
      ],
    });
    assert.ok(notes.annotations.some((row) => row.kind === 'content'));
    assert.ok(notes.rewrites.length >= 2);
    assert.ok(notes.rewrites[0].improved.length > notes.rewrites[0].original.length);
    const improved = notes.rewrites.map((row) => row.improved);
    assert.equal(new Set(improved).size, improved.length);
    assert.ok(notes.next_steps.some((row) => /hint/i.test(row) || /paragraph/i.test(row) || /160/i.test(row)));
    assert.equal(notes.annotations.filter((row) => row.kind === 'sentence').length <= 1, true);
  });

  it('marks a short empty-seat draft with one content note, exact errors, and one-sentence rewrites', () => {
    const content =
      'I sat down. The seat was empty. I dont know wich way to look. It was very nice and then I got scared. The train moved.';
    const notes = buildMarkerNotesHeuristic({
      content,
      promptType: 'narrative',
      promptTitle: 'The empty seat',
      hintPoints: [
        'Open with a hook and set the scene clearly',
        'Build tension through the middle with vivid detail',
        'Resolve the story with a satisfying or surprising ending',
      ],
    });
    assert.equal(notes.version, 9);
    assert.match(notes.summary, /TrialSeed mark-up/);
    assert.equal(/teacher/i.test(notes.summary), false);
    assert.equal(notes.annotations.filter((row) => row.kind === 'content').length, 1);
    assert.equal(notes.annotations.filter((row) => row.kind === 'sentence').length, 0);
    assert.ok(notes.annotations.some((row) => row.quote.toLowerCase() === 'dont'));
    assert.ok(notes.annotations.some((row) => row.quote.toLowerCase() === 'wich'));
    assert.ok(
      notes.annotations.some((row) => /very nice|nice/i.test(row.quote) && row.kind === 'vocabulary'),
    );
    const look = notes.rewrites.find((row) => /look/i.test(row.original));
    assert.ok(look);
    assert.match(look?.improved ?? '', /don't/i);
    assert.match(look?.improved ?? '', /which/i);
    assert.equal(/\.\s+[A-Z]/.test(look?.improved ?? ''), false);
    assert.equal(new Set(notes.rewrites.map((row) => row.improved)).size, notes.rewrites.length);
    for (const row of notes.rewrites) {
      assert.match(row.improved, /[.!?]$/);
      assert.notEqual(row.improved.toLowerCase(), row.original.toLowerCase());
    }
    const vocabRewrite = notes.rewrites.find((row) => /very nice|got scared/i.test(row.original));
    assert.ok(vocabRewrite);
    assert.match(vocabRewrite?.improved ?? '', /still|calm|fear|froze/i);
    assert.ok(notes.rewrites.some((row) => /sat down on the empty seat/i.test(row.improved)));
    assert.equal(notes.next_steps.filter((row) => /Cover this task hint/i.test(row)).length <= 1, true);
    assert.match(notes.annotations.find((row) => row.kind === 'content')?.suggestion ?? '', /seat|train/i);
  });

  it('rewrites a locked-door sketch from the student’s own lines without a nonsense comparison', () => {
    const content = 'The handle turned. Dust hung in the air. I ran out with a glowing jar in my pocket.';
    const notes = buildMarkerNotesHeuristic({
      content,
      promptType: 'narrative',
      promptTitle: 'The locked door',
    });
    const dust = notes.rewrites.find((row) => /dust/i.test(row.original));
    assert.ok(dust);
    assert.match(dust?.improved ?? '', /Dust hung in the air/i);
    assert.equal(/more than the handle/i.test(dust?.improved ?? ''), false);
  });

  it('names the overturned letterbox when an After the storm cleanup misses the picture', () => {
    const content = [
      'BOOM! A storm was raging outside. Mia got scared, so she hid in her bed.',
      'The next morning she made breakfast, then checked her backyard. Some of her small flower plants were knocked down because of the hail and heavy rain.',
      'Then Mia looked outside. A tree was on the floor and leaves were scattered across the grass. She swept the road and drove to buy new flowers for her garden.',
      'Mia felt happy that she grew new plants and that she helped the environment after the storm.',
    ].join(' ');
    const notes = buildMarkerNotesHeuristic({
      content,
      promptType: 'narrative',
      promptTitle: 'After the storm',
      hintPoints: [
        'Show the street after the storm with precise detail',
        'Introduce a discovery that changes the character’s plan',
        'Resolve the discovery without starting a new story',
      ],
      stimulusFocus: stimulusFocusFor('/stimuli/after-the-storm.jpg', 'After the storm'),
    });
    assert.ok(
      notes.annotations.some(
        (row) => row.kind === 'content' && /letterbox/i.test(`${row.issue} ${row.suggestion}`),
      ),
    );
    assert.match(notes.next_steps[0] ?? '', /overturned letterbox/i);
    assert.ok(notes.next_steps.some((row) => /envelope/i.test(row) && /plan/i.test(row)));
    assert.match(notes.summary, /overturned letterbox/i);
    assert.equal(/add more detail/i.test(notes.next_steps.join(' ')), false);
  });

  it('does not tell a news report to change a character’s morning plan', () => {
    const notes = buildMarkerNotesHeuristic({
      content:
        'Yesterday a container opened on the beach and party things went everywhere. People came to look. The beach was messy.',
      promptType: 'news_report',
      promptTitle: 'Chaos on the beach',
      hintPoints: [
        'Explain clearly what has happened',
        'Describe the impact on the beach and the sea',
        'Include comments from different people',
      ],
    });
    assert.ok(notes.next_steps.some((row) => /hint/i.test(row)));
    assert.equal(/morning plan|scattered envelopes/i.test(notes.next_steps.join(' ')), false);
    assert.ok(notes.next_steps.some((row) => /news report|who\/where\/when|quote/i.test(row)));
  });

  it('does not mark Dear Diary, or a sign-off as missing a full stop', () => {
    const content = [
      'Dear Diary,',
      'The bus ride was so fun I nearly dropped my hat.',
      '',
      'From Stella',
      'OXOXX',
    ].join('\n');
    const notes = buildMarkerNotesHeuristic({
      content,
      promptType: 'diary_entry',
    });
    assert.equal(
      notes.annotations.some(
        (row) =>
          /dear diary|from stella|oxoxx/i.test(row.quote) &&
          (row.kind === 'punctuation' || row.kind === 'sentence'),
      ),
      false,
    );
    assert.equal(
      notes.rewrites.some((row) => isFormConventionLine(row.original)),
      false,
    );
  });

  it('still flags a real sentence that ends with a comma', () => {
    const content = 'The handle turned, and I waited by the locked door for a long time,';
    const notes = buildMarkerNotesHeuristic({
      content,
      promptType: 'narrative',
    });
    assert.ok(
      notes.annotations.some(
        (row) => row.kind === 'punctuation' && /full stop|exclamation/i.test(row.issue),
      ),
    );
  });

  it('gives content-change advice on a long event-list diary', () => {
    const content = [
      'Dear Diary,',
      'I just have to share this hilarious carnival! So first the day started as even the bus ride was so fun! The guy named Ben was extremely funny and even the sun was jealous.',
      '',
      'After we arrived at the sports carnival I played a game called Spot It! But instead of birds I looked for about 10 minutes and I looked a little anxious until she tried a stopwatch.',
      '',
      'Then we ate lunch and I had a peanut butter and banana sandwich which are my FAVOURITES! I gobbled it up in an instant and asked Zoe for her funniest joke because I was definitely in the mood to laugh. She said "Sorry not right now I am just eating some jellybeans!" And boy I laughed so hard people around me stare.',
      '',
      'At the end of the day we all hopped on the bus again and had another roast battle but it went by like a bullet train!',
      '',
      'From Stella',
      'OXOXX',
    ].join('\n');
    const notes = buildMarkerNotesHeuristic({
      content,
      promptType: 'diary_entry',
      promptTitle: 'Sports carnival',
    });
    assert.ok(notes.annotations.some((row) => row.kind === 'content'));
    assert.ok(
      notes.annotations.some(
        (row) =>
          row.kind === 'content' &&
          /moment|cut|event|timetable/i.test(`${row.issue} ${row.suggestion}`),
      ),
    );
    assert.ok(
      notes.annotations.some(
        (row) =>
          row.kind === 'structure' &&
          /close|last paragraph|felt/i.test(`${row.issue} ${row.suggestion}`),
      ),
    );
    assert.ok(notes.next_steps.some((row) => /Set A content/i.test(row)));
    assert.ok(notes.next_steps.some((row) => /Set A organisation/i.test(row)));
    assert.match(notes.summary, /what you chose to write about/);
    assert.equal(
      notes.annotations.some(
        (row) =>
          /dear diary|from stella|oxoxx/i.test(row.quote) &&
          (row.kind === 'punctuation' || row.kind === 'sentence'),
      ),
      false,
    );
    const contentIndex = notes.next_steps.findIndex((row) => /Set A content/i.test(row));
    const proofIndex = notes.next_steps.findIndex((row) => /Set B/i.test(row));
    if (contentIndex >= 0 && proofIndex >= 0) {
      assert.ok(contentIndex < proofIndex);
    }
  });
});

describe('isFormConventionLine', () => {
  it('treats diary greetings and sign-offs as form conventions', () => {
    assert.equal(isFormConventionLine('Dear Diary,'), true);
    assert.equal(isFormConventionLine('Dear Mum,'), true);
    assert.equal(isFormConventionLine('From Stella'), true);
    assert.equal(isFormConventionLine('Yours sincerely'), true);
    assert.equal(isFormConventionLine('OXOXX'), true);
    assert.equal(isFormConventionLine('Dear Diary, I just have to share this hilarious carnival!'), false);
    assert.equal(isFormConventionLine('The bus ride was so fun I nearly dropped my hat.'), false);
  });
});

describe('normalizeMarkerNotes', () => {
  it('attaches quotes to character offsets in the student writing', () => {
    const content = 'The handle turned. Dust hung in the air.';
    const notes = normalizeMarkerNotes(
      {
        summary: 'A marker note.',
        strengths: ['Clear first image'],
        next_steps: ['Add the middle'],
        annotations: [
          {
            kind: 'vocabulary',
            quote: 'turned',
            issue: 'A more precise verb would help.',
            suggestion: 'Try hesitated, or stuck.',
          },
        ],
        rewrites: [
          {
            original: 'The handle turned.',
            improved: 'The handle hesitated, then turned.',
            why: 'Set A rewards a hook.',
            set: 'A',
          },
        ],
      },
      content,
    );
    assert.equal(notes.annotations[0].start, content.indexOf('turned'));
    assert.equal(content.slice(notes.annotations[0].start, notes.annotations[0].end), 'turned');
  });

  it('drops incomplete remote notes', () => {
    const notes = normalizeMarkerNotes({ annotations: [{ kind: 'spelling' }] }, 'Hello.');
    assert.equal(notes.annotations.length, 0);
  });

  it('keeps the question read from a custom-task photo', () => {
    const notes = normalizeMarkerNotes(
      {
        summary: 'The writing did not answer the photo question.',
        photo_question: 'Write a news report about this playground.',
        task_match: 'no',
      },
      'I like pizza.',
    );
    assert.equal(notes.photo_question, 'Write a news report about this playground.');
    assert.equal(notes.task_match, 'no');
  });

  it('keeps a picture-stimulus description from a custom-task photo', () => {
    const notes = normalizeMarkerNotes(
      {
        summary: 'The writing did not use the photo.',
        photo_kind: 'stimulus',
        photo_question: 'A wet playground with empty swings after rain.',
        task_match: 'no',
      },
      'I like pizza.',
    );
    assert.equal(notes.photo_kind, 'stimulus');
    assert.equal(notes.photo_question, 'A wet playground with empty swings after rain.');
    assert.equal(notes.task_match, 'no');
  });
});

describe('markerNotesFromUnknown', () => {
  it('keeps unread photo-match notes even without a copied question', () => {
    const notes = markerNotesFromUnknown({ task_match: 'unread' }, 'I like pizza.');
    assert.equal(notes?.task_match, 'unread');
  });
});

describe('combineRemoteMarkerNotes', () => {
  it('keeps local spelling notes when the model also comments', () => {
    const content = 'The gardian opened the gate.';
    const local = buildMarkerNotesHeuristic({ content, promptType: 'narrative' });
    const combined = combineRemoteMarkerNotes(content, local, {
      summary: 'Model summary.',
      strengths: ['You started in the moment.'],
      rewrites: [
        {
          original: 'The gardian opened the gate.',
          improved: 'The guardian eased the iron gate open.',
          why: 'Correct the spelling and add a precise verb.',
        },
      ],
    });
    assert.equal(combined.summary, 'Model summary.');
    assert.ok(combined.annotations.some((row) => row.kind === 'spelling'));
    assert.equal(combined.rewrites[0].improved.includes('guardian'), true);
  });

  it('keeps the photo question from the remote marker notes', () => {
    const content = 'I like pizza.';
    const local = buildMarkerNotesHeuristic({ content, promptType: 'news_report' });
    const combined = combineRemoteMarkerNotes(content, local, {
      summary: 'The writing did not answer the photo question.',
      photo_question: 'Write a news report about this playground.',
      task_match: 'no',
    });
    assert.equal(combined.photo_question, 'Write a news report about this playground.');
    assert.equal(combined.task_match, 'no');
  });

  it('drops a remote Dear Diary punctuation note and keeps Set A content advice first', () => {
    const content = [
      'Dear Diary,',
      'I just have to share this hilarious carnival! So first the day started as even the bus ride was so fun! The guy named Ben was extremely funny and even the sun was jealous.',
      '',
      'After we arrived at the sports carnival I played a game called Spot It! But instead of birds I looked for about 10 minutes and I looked a little anxious until she tried a stopwatch.',
      '',
      'Then we ate lunch and I had a peanut butter and banana sandwich which are my FAVOURITES! I gobbled it up in an instant and asked Zoe for her funniest joke because I was definitely in the mood to laugh.',
      '',
      'At the end of the day we all hopped on the bus again and had another roast battle but it went by like a bullet train!',
      '',
      'From Stella',
    ].join('\n');
    const local = buildMarkerNotesHeuristic({ content, promptType: 'diary_entry' });
    const combined = combineRemoteMarkerNotes(content, local, {
      summary: 'Model summary.',
      next_steps: [
        'Proofread once for Set B: spelling, capitals, apostrophes, and full stops.',
        'Split the long sentence about lunch.',
      ],
      annotations: [
        {
          kind: 'punctuation',
          quote: 'Dear Diary,',
          issue: 'Set B punctuation: this sentence has no clear full stop, question mark, or exclamation mark.',
          suggestion: 'Finish the sentence so Set B can be marked cleanly.',
        },
        {
          kind: 'sentence',
          quote: 'Dear Diary,',
          issue: 'Set B sentence control: several very short sentences in a row can sound choppy.',
          suggestion: 'Keep one short line for impact, then join the next idea.',
        },
      ],
      rewrites: [
        {
          original: 'Dear Diary,',
          improved: 'Dear Diary.',
          why: 'Finish the greeting with a full stop.',
        },
      ],
    });
    assert.equal(
      combined.annotations.some(
        (row) => /dear diary/i.test(row.quote) && (row.kind === 'punctuation' || row.kind === 'sentence'),
      ),
      false,
    );
    assert.equal(combined.rewrites.some((row) => /dear diary/i.test(row.original)), false);
    assert.ok(combined.annotations.some((row) => row.kind === 'content'));
    assert.ok(combined.next_steps.some((row) => /Set A content/i.test(row)));
    const contentIndex = combined.next_steps.findIndex((row) => /Set A content/i.test(row));
    const proofIndex = combined.next_steps.findIndex((row) => /Set B/i.test(row));
    if (contentIndex >= 0 && proofIndex >= 0) {
      assert.ok(contentIndex < proofIndex);
    }
  });

  it('keeps a picture-stimulus description from the remote marker notes', () => {
    const content = 'I like pizza.';
    const local = buildMarkerNotesHeuristic({ content, promptType: 'narrative' });
    const combined = combineRemoteMarkerNotes(content, local, {
      summary: 'The writing did not use the photo.',
      photo_kind: 'stimulus',
      photo_question: 'A wet playground with empty swings after rain.',
      task_match: 'no',
    });
    assert.equal(combined.photo_kind, 'stimulus');
    assert.equal(combined.photo_question, 'A wet playground with empty swings after rain.');
    assert.equal(combined.task_match, 'no');
  });
});

describe('annotationSegments', () => {
  it('splits the script so highlighted spans keep their note index', () => {
    const content = 'The gardian opened the gate.';
    const notes = buildMarkerNotesHeuristic({ content, promptType: 'narrative' });
    const spelling = notes.annotations.find((row) => row.kind === 'spelling');
    assert.ok(spelling);
    const segments = annotationSegments(content, notes.annotations);
    const marked = segments.find((row) => row.text === 'gardian');
    assert.ok(marked);
    assert.equal(marked?.kind, 'spelling');
    assert.equal(typeof marked?.noteIndex, 'number');
  });

  it('expands a partial-word annotation so rendered markup cannot split a word', () => {
    const content = 'After the Storm';
    const segments = annotationSegments(content, [
      {
        kind: 'punctuation',
        start: 3,
        end: 5,
        quote: 'er',
        issue: 'Test annotation',
        suggestion: 'Test suggestion',
      },
    ]);
    assert.deepEqual(
      segments.map((segment) => segment.text),
      ['After', ' the Storm'],
    );
    assert.equal(segments[0]?.kind, 'punctuation');
  });
});

describe('photoTaskCardCopy', () => {
  it('uses question wording for a photographed written task', () => {
    const card = photoTaskCardCopy({
      photo_kind: 'question',
      photo_question: 'Write a news report about this playground.',
      task_match: 'no',
    });
    assert.equal(card?.heading, 'Question from the photo');
    assert.equal(card?.body, 'Write a news report about this playground.');
    assert.match(card?.verdict?.text ?? '', /does not answer that question/);
  });

  it('uses picture wording when the photo is a stimulus, not a written question', () => {
    const card = photoTaskCardCopy({
      photo_kind: 'stimulus',
      photo_question: 'A wet playground with empty swings after rain.',
      task_match: 'no',
    });
    assert.equal(card?.heading, 'What the photo shows');
    assert.equal(card?.body, 'A wet playground with empty swings after rain.');
    assert.match(card?.verdict?.text ?? '', /not based on that photo/);
  });

  it('treats a scene description as a picture task when photo_kind is missing', () => {
    const card = photoTaskCardCopy({
      photo_question: 'An empty seat on a quiet train, with no one sitting there.',
      task_match: 'no',
    });
    assert.equal(card?.heading, 'What the photo shows');
    assert.match(card?.verdict?.text ?? '', /not based on that photo/);
  });

  it('does not call an unread photo a visible scene', () => {
    const card = photoTaskCardCopy({ task_match: 'unread' });
    assert.equal(card?.heading, 'From the photo');
    assert.match(card?.fallback ?? '', /could not copy a question or describe the picture/);
  });
});

describe('isGreetingAccuracyFalsePositive', () => {
  it('only drops greeting notes about missing terminal punctuation', () => {
    assert.equal(
      isGreetingAccuracyFalsePositive(
        {
          kind: 'punctuation',
          quote: 'Dear Diary,',
          issue: 'Set B punctuation: this sentence has no clear full stop, question mark, or exclamation mark.',
          suggestion: 'Finish the sentence.',
        },
        'Dear Diary,\nThe bus was fun.',
      ),
      true,
    );
    assert.equal(
      isGreetingAccuracyFalsePositive(
        {
          kind: 'spelling',
          quote: 'Diary',
          issue: 'Set B spelling: check this word.',
          suggestion: 'Write “Diary”.',
        },
        'Dear Diary,\nThe bus was fun.',
      ),
      false,
    );
  });
});

const CARNIVAL_HINTS = [
  'Set the scene for how the day began',
  'Describe a tense or funny moment during an event',
  'Reflect on your feelings at the end of the day',
];

const CARNIVAL_DRAFT_1 = [
  'Dear Diary,',
  'Today was our school sports carnival. It started very early. When we arrived at the oval, everyone was wearing their house colours and cheering loudly. I was in the blue house and I felt really excited.',
  '',
  'The day began with the marching. Our house chanted the loudest. Then the races started. I was in the 100-metre sprint. When the starter gun went off, I ran as fast as I could. I was coming second, but then the boy next to me tripped and fell.',
  '',
  'I wanted to stop and help him, but I kept running because I wanted to win points for my house.',
  '',
  'At the end of the day, I was very tired. My house came third overall. We did not win the trophy, but we had a lot of fun.',
].join('\n');

const CARNIVAL_DRAFT_3 = [
  'Dear Diary,',
  'It was a chilly Friday morning when the sports carnival began.',
  'As we marched onto the oval in our vibrant house colours, the air buzzed with excitement, and I could hear the rhythmic clapping from the crowd.',
  'I felt a rush of adrenaline coursing through me.',
  '',
  'Then came the 100-metre sprint. As the starter gun fired, I dashed forward. I was coming second, but as I sprinted ahead, I saw the boy next to me stumble and fall heavily onto the track.',
  'In that moment, I wrestled with a difficult decision: should I stop to help him, risking my chance to earn points for my house, or should I keep running and hope he was okay?',
  'I edged past him and kept running.',
  '',
  'By the end of the day, exhaustion washed over me, and my legs felt like jelly. Our house came third overall. We didn\'t win the trophy, but as I looked at my teammates, I felt a deep sense of pride. I was proud not just of my own race, but of how our whole house cheered for each other until the very end.',
  'I will never forget the moment I had to choose between winning and helping a friend.',
].join('\n');

describe('sports carnival diary mark-up', () => {
  it('does not say a covered opening hint is still missing, and does not flag went off', () => {
    const notes = buildMarkerNotesHeuristic({
      content: CARNIVAL_DRAFT_1,
      promptType: 'diary_entry',
      promptTitle: 'Sports carnival day',
      hintPoints: CARNIVAL_HINTS,
    });
    assert.equal(notes.next_steps.some((row) => /still missing/i.test(row)), false);
    assert.equal(
      notes.annotations.some((row) => row.quote.toLowerCase() === 'went'),
      false,
    );
  });

  it('does not treat a focused race diary as a full-day timetable', () => {
    const notes = buildMarkerNotesHeuristic({
      content: CARNIVAL_DRAFT_3,
      promptType: 'diary_entry',
      promptTitle: 'Sports carnival day',
      hintPoints: CARNIVAL_HINTS,
    });
    const blob = [
      notes.summary,
      ...notes.next_steps,
      ...notes.strengths,
      ...notes.annotations.map((row) => `${row.issue} ${row.suggestion}`),
    ].join('\n');
    assert.equal(/cut two smaller|full-day timetable|lists lots of things/i.test(blob), false);
    assert.equal(/mark will rise when that idea is developed/i.test(blob), false);
    assert.equal(
      notes.annotations.some((row) => row.quote.toLowerCase() === 'very'),
      false,
    );
  });

  it('drops a remote timetable note on a focused later draft', () => {
    const local = buildMarkerNotesHeuristic({
      content: CARNIVAL_DRAFT_3,
      promptType: 'diary_entry',
      hintPoints: CARNIVAL_HINTS,
    });
    const combined = combineRemoteMarkerNotes(
      CARNIVAL_DRAFT_3,
      local,
      {
        summary: 'Keep one moment and cut smaller events.',
        next_steps: [
          'Set A content: Keep the moment that mattered most. Cut two smaller events so that scene has room.',
          'Add more detail about how the day began, such as specific activities or feelings as you arrived.',
        ],
        annotations: [
          {
            kind: 'content',
            quote: 'Then came the 100-metre sprint.',
            issue:
              'Set A content: this diary lists lots of things that happened. Selective markers reward one moment shown clearly, not a full-day timetable.',
            suggestion: 'Keep the moment that mattered most. Cut two smaller events so that scene has room.',
          },
          {
            kind: 'vocabulary',
            quote: 'very',
            issue: 'Set A vocabulary: “very” is a general word.',
            suggestion: 'Cut “very” and choose a stronger adjective (still, uneasy, frantic).',
          },
        ],
      },
      { promptType: 'diary_entry', hintPoints: CARNIVAL_HINTS },
    );
    assert.equal(
      combined.annotations.some((row) => /lists lots|cut two smaller/i.test(`${row.issue} ${row.suggestion}`)),
      false,
    );
    assert.equal(combined.annotations.some((row) => row.quote.toLowerCase() === 'very'), false);
    assert.equal(combined.next_steps.some((row) => /cut two smaller|how the day began/i.test(row)), false);
  });
});

describe('inferPhotoKind', () => {
  it('treats copied task wording as a question and a scene as a stimulus', () => {
    assert.equal(inferPhotoKind('Write a news report about this playground.'), 'question');
    assert.equal(inferPhotoKind('What happened at the night market?'), 'question');
    assert.equal(inferPhotoKind('An empty seat on a quiet train, with no one sitting there.'), 'stimulus');
  });
});
