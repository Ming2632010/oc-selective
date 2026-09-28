import { createJsonCompletion, isOpenAIConfigured } from '@/lib/openai';
import {
  buildMarkerNotesHeuristic,
  combineRemoteMarkerNotes,
  isPhotoKind,
  isTaskMatch,
  inferPhotoKind,
  type MarkerNotes,
  type PhotoKind,
  type TaskMatch,
} from '@/lib/marker-notes';

export type ScoresBreakdown = {
  structure: number;
  vocabulary: number;
  audience: number;
  grammar: number;
};

export type ScoringResult = {
  score_set_a: number;
  score_set_b: number;
  overall_score: number;
  scores_breakdown: ScoresBreakdown;
  ai_feedback: string;
  marker_notes: MarkerNotes;
  checked_hint_1: boolean;
  checked_hint_2: boolean;
  checked_hint_3: boolean;
  word_count: number;
};

type ScoreInput = {
  content: string;
  hintPoints: string[];
  promptType: string;
  promptTitle?: string;
  promptDescription?: string;
  examStyle?: boolean;
  promptImage?: { mimeType: string; bytes: Buffer } | null;
};

const SELECTIVE_MARKING_CRITERIA = `
NSW Selective High School Placement Test — Writing (practice marking guide)

Task conditions:
- One extended writing task (about 30 minutes)
- Form may be email, diary entry, newspaper report, advice sheet, story, etc.
- Assess how well the student selects, develops and organises ideas and communicates them effectively

Overall scale used in this product (single-examiner practice scale):
- overall_score: integer 0–25
- score_set_a: integer 0–15 (content, organisation, vocabulary/style for purpose)
- score_set_b: integer 0–10 (accuracy, control of grammar/spelling/punctuation, and task completion including hint coverage)
- overall_score MUST equal score_set_a + score_set_b

Four-dimension breakdown (each integer 0–5):
1) structure — organisation, paragraphing, logical development, clear opening/ending suited to the form
2) vocabulary — precise, varied word choice; register suited to audience and purpose
3) audience — sustained awareness of reader/purpose/form conventions (e.g. report voice, diary voice, email purpose, advice tone)
4) grammar — sentence control, punctuation, spelling, tense consistency

Score calibration — use the full range; do not compress clearly different work
into the same score:
- 23–25: Reserve for an exceptional response. It shows original, insightful
  thinking; sophisticated and precise vocabulary; a deliberate, controlled
  structure; sustained form/audience control; and nearly flawless grammar,
  spelling and punctuation. Award 25 only extremely rarely, for a response
  that would stand out among the strongest students in NSW.
- 18–22: A solid, well-written response with clear strengths, but identifiable
  room to improve: for example, one under-developed paragraph, some generic
  vocabulary, a less deliberate structural choice, or minor accuracy slips.
- 12–17: A basic response with noticeable weaknesses, such as limited detail,
  repetitive sentence patterns, unclear or uneven structure, weak form control,
  or several grammar, spelling or punctuation errors.
- 0–11: A very brief, off-task, severely under-developed, or seriously
  inaccurate response.

Set A and Set B calibration:
- Set A 14–15 and Set B 9–10 are available for truly outstanding work in that
  criterion; do not artificially cap either set below its maximum.
- Set A 11–13 and Set B 7–8 fit solid work with limited, specific room to improve.
- Set A 7–10 and Set B 4–6 fit basic work with noticeable weaknesses.
- Use lower scores where the response is very weak, very brief, off-task, or
  shows severe gaps.
- Judge Set B for genuine accuracy and sentence-control errors. Do not penalise
  acceptable narrative style choices, such as an intentionally short independent
  clause joined with “and”, when they are clear and effective in context.

Also judge whether each of the three hint points is clearly covered in the student writing.

Script mark-up (required):
- Highlight exact phrases from the student writing (spelling, punctuation, sentence control, structure/form, vocabulary, content).
- Do not stamp every short sentence with the same “too short” note. One content comment for an under-developed piece is enough.
- Give a better version of 2–4 of the student’s weakest sentences. Keep that sentence’s idea. Fix spelling in the rewrite. Prefer one developed sentence, not a second new sentence.
- Tie every comment to Set A (content, form, organisation, vocabulary/style) or Set B (sentences, punctuation, spelling).
- Write for a Year 5–6 student in Australian English. Be specific to their words, not generic.
- In student-facing text, say TrialSeed feedback or TrialSeed mark-up. Never call it a teacher mark.
`.trim();

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function wordCount(text: string): number {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  return parts.length;
}

function hintCovered(content: string, hint: string): boolean {
  const hay = content.toLowerCase();
  const keywords = hint
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 6);

  if (keywords.length === 0) {
    return hay.length > 80;
  }

  const hits = keywords.filter((k) => hay.includes(k)).length;
  return hits >= Math.min(2, keywords.length);
}

function normalizeResult(
  partial: Partial<ScoringResult> & {
    scores_breakdown?: Partial<ScoresBreakdown>;
  },
  content: string,
  notes: MarkerNotes,
): ScoringResult {
  const wc = typeof partial.word_count === 'number' ? partial.word_count : wordCount(content);

  const structure = clamp(Number(partial.scores_breakdown?.structure ?? 0), 0, 5);
  const vocabulary = clamp(Number(partial.scores_breakdown?.vocabulary ?? 0), 0, 5);
  const audience = clamp(Number(partial.scores_breakdown?.audience ?? 0), 0, 5);
  const grammar = clamp(Number(partial.scores_breakdown?.grammar ?? 0), 0, 5);

  let score_set_a = clamp(Number(partial.score_set_a ?? structure + vocabulary + audience), 0, 15);
  let score_set_b = clamp(Number(partial.score_set_b ?? grammar * 2), 0, 10);
  let overall_score = clamp(
    Number(partial.overall_score ?? score_set_a + score_set_b),
    0,
    25,
  );

  // Keep product invariant: overall = A + B when possible
  if (score_set_a + score_set_b !== overall_score) {
    overall_score = clamp(score_set_a + score_set_b, 0, 25);
  }

  return applyPhotoTaskMatch({
    score_set_a,
    score_set_b,
    overall_score,
    scores_breakdown: { structure, vocabulary, audience, grammar },
    ai_feedback:
      typeof partial.ai_feedback === 'string' && partial.ai_feedback.trim()
        ? partial.ai_feedback.trim()
        : 'Feedback unavailable.',
    marker_notes: notes,
    checked_hint_1: Boolean(partial.checked_hint_1),
    checked_hint_2: Boolean(partial.checked_hint_2),
    checked_hint_3: Boolean(partial.checked_hint_3),
    word_count: wc,
  });
}

/** When a photo question is readable, off-task writing cannot keep a high Set A. */
export function applyPhotoTaskMatch(result: ScoringResult): ScoringResult {
  const match = result.marker_notes.task_match;
  if (match !== 'no' && match !== 'partial') return result;

  const breakdown = { ...result.scores_breakdown };
  const maxSetA = match === 'no' ? 6 : 10;
  if (match === 'no') {
    breakdown.audience = Math.min(breakdown.audience, 1);
    breakdown.structure = Math.min(breakdown.structure, 3);
    breakdown.vocabulary = Math.min(breakdown.vocabulary, 2);
  } else {
    breakdown.audience = Math.min(breakdown.audience, 3);
    breakdown.structure = Math.min(breakdown.structure, 4);
    breakdown.vocabulary = Math.min(breakdown.vocabulary, 3);
  }
  const score_set_a = clamp(
    Math.min(
      result.score_set_a,
      maxSetA,
      breakdown.structure + breakdown.vocabulary + breakdown.audience,
    ),
    0,
    15,
  );
  const overall_score = clamp(score_set_a + result.score_set_b, 0, 25);
  return {
    ...result,
    score_set_a,
    overall_score,
    scores_breakdown: breakdown,
  };
}

function photoFieldsFromParsed(parsed: {
  photo_question?: unknown;
  task_match?: unknown;
  photo_kind?: unknown;
  marker_notes?: unknown;
}): { photo_question?: string; task_match?: TaskMatch; photo_kind?: PhotoKind } {
  const notes =
    parsed.marker_notes && typeof parsed.marker_notes === 'object' && !Array.isArray(parsed.marker_notes)
      ? (parsed.marker_notes as Record<string, unknown>)
      : {};
  const questionRaw = notes.photo_question ?? parsed.photo_question;
  const photo_question = typeof questionRaw === 'string' ? questionRaw.trim().slice(0, 2_000) : '';
  const task_match = isTaskMatch(notes.task_match) ? notes.task_match : isTaskMatch(parsed.task_match) ? parsed.task_match : undefined;
  const photo_kind = isPhotoKind(notes.photo_kind)
    ? notes.photo_kind
    : isPhotoKind(parsed.photo_kind)
      ? parsed.photo_kind
      : undefined;
  return {
    ...(photo_question ? { photo_question } : {}),
    ...(task_match ? { task_match } : {}),
    ...(photo_kind ? { photo_kind } : {}),
  };
}

/**
 * Lightweight heuristic scorer used as fallback when OpenAI is unavailable.
 */
export function scoreWritingAttemptHeuristic(input: ScoreInput): ScoringResult {
  const content = input.content ?? '';
  const wc = wordCount(content);
  const hints = [...input.hintPoints, '', '', ''].slice(0, 3);
  const checked = hints.map((hint) => (hint ? hintCovered(content, hint) : false));
  const hintScore = checked.filter(Boolean).length;

  let lengthScore = 0;
  if (wc >= 220) lengthScore = 5;
  else if (wc >= 160) lengthScore = 4;
  else if (wc >= 110) lengthScore = 3;
  else if (wc >= 70) lengthScore = 2;
  else if (wc >= 40) lengthScore = 1;

  const hasParagraphs =
    (content.match(/\n\s*\n/g) ?? []).length >= 1 || content.includes('\n');
  const hasTitleLike =
    /news_report|advice_sheet|advertisement/.test(input.promptType) &&
    /[A-Z][A-Z\s]{6,}/.test(content.slice(0, 80));
  const audienceCue =
    /dear |subject:|dear diary|welcome|report|according to|said/i.test(content) ||
    input.promptType === 'diary_entry';

  const structure = clamp(2 + (hasParagraphs ? 2 : 0) + hintScore, 0, 5);
  const vocabulary = clamp(1 + lengthScore * 0.6 + (wc > 140 ? 1 : 0), 0, 5);
  const audience = clamp(
    1 + (audienceCue ? 2 : 0) + (hasTitleLike ? 1 : 0) + hintScore * 0.5,
    0,
    5,
  );
  const grammar = clamp(2 + (wc > 60 ? 1 : 0) + (content.includes('.') ? 1 : 0), 0, 5);

  const score_set_a = clamp(structure + vocabulary + audience, 0, 15);
  const score_set_b = clamp(grammar + hintScore + Math.floor(lengthScore / 2), 0, 10);
  const overall_score = clamp(score_set_a + score_set_b, 0, 25);

  const covered = checked
    .map((ok, i) => (ok ? `✓ Hint ${i + 1} covered` : `✗ Hint ${i + 1} not clearly covered`))
    .join('\n');

  const examStyle = Boolean(input.examStyle);
  const ai_feedback = [
    `Overall ${overall_score}/25 (Set A ${score_set_a}/15, Set B ${score_set_b}/10).`,
    '(Heuristic fallback scoring — OpenAI unavailable.)',
    wc < 100
      ? 'Your response is quite short for a 30-minute selective task — aim to develop each idea with detail and examples.'
      : wc > 280
        ? 'Strong length. Tighten any repetition so every sentence earns its place.'
        : 'Length is in a solid practice range. Keep building precise detail.',
    hasParagraphs
      ? 'Organisation shows paragraphing — keep using clear sections for each idea.'
      : 'Try clearer paragraph breaks so structure and audience purpose stand out.',
    examStyle
      ? 'On the day there is one sitting and no second draft. Check that you answered the question, kept the right form, and left time to proofread.'
      : ['Hint checklist:', covered, 'Next draft: strengthen any missing hint, polish word choice, and re-check opening/closing for audience.'].join('\n'),
  ].join('\n');

  const notes = buildMarkerNotesHeuristic({
    content,
    promptType: input.promptType,
    promptTitle: input.promptTitle,
    hintPoints: input.hintPoints,
    examStyle: input.examStyle,
    wordCount: wc,
  });
  const marker_notes = input.promptImage
    ? { ...notes, task_match: 'unread' as const }
    : notes;

  return {
    score_set_a,
    score_set_b,
    overall_score,
    scores_breakdown: { structure, vocabulary, audience, grammar },
    ai_feedback: notes.summary || ai_feedback,
    marker_notes,
    checked_hint_1: checked[0] ?? false,
    checked_hint_2: checked[1] ?? false,
    checked_hint_3: checked[2] ?? false,
    word_count: wc,
  };
}

async function scoreWithOpenAI(input: ScoreInput): Promise<ScoringResult> {
  const hints = [...input.hintPoints, '', '', ''].slice(0, 3);
  const wc = wordCount(input.content);

  const raw = await createJsonCompletion({
    temperature: 0.2,
    system: [
      'You mark NSW Selective writing practice for TrialSeed.',
      'Circle exact errors, give one overall development note if the piece is a sketch, and rewrite the student’s own weakest sentences.',
      'Student-facing comments must say TrialSeed feedback or TrialSeed mark-up, never a teacher mark.',
      'Score consistently against Set A (content, form, organisation, vocabulary/style) and Set B (sentences, punctuation, spelling).',
      'Return ONLY valid JSON matching the required schema.',
      '',
      SELECTIVE_MARKING_CRITERIA,
      input.examStyle
        ? 'This is a one-sitting exam-style paper. Do not mention hint points or a next draft. Comment on task, form, and accuracy only.'
        : '',
      input.promptImage
        ? [
            'A parent photo is attached. You MUST look at the photo before you mark.',
            '1. Decide photo_kind: "question" if the photo contains a written writing task; "stimulus" if it is a picture, scene, or object with no written task (the student should write from what they see).',
            '2. If photo_kind is "question", copy every readable word of that task into photo_question. Do not invent a nicer prompt.',
            '3. If photo_kind is "stimulus", put a short factual description of what is visible into photo_question (who, where, what is happening, key objects). Do not invent a writing question the parent did not set. Use any typed prompt_description as extra instruction for form or audience.',
            '4. Use task_match "unread" only when the photo is too blurry or dark to see either the words or a usable scene.',
            '5. Judge the writing against the photo, not a generic piece of this form.',
            '   - question: does the writing answer that written task?',
            '   - stimulus: is the writing clearly about what is in the photo? A well-written piece that never uses the people, place, or objects in the picture is task_match "no".',
            '6. task_match must be "yes", "partial", "no", or "unread".',
            '7. If task_match is "no", Set A must be 0–6, purpose & form (audience) 0–1, organisation 0–3, and vocabulary 0–2. Do not reward an unrelated piece for sounding like a news report or story.',
            '8. If task_match is "partial", Set A must be 10 or below, purpose & form 0–3, organisation 0–4, and vocabulary 0–3.',
            '9. In the summary, name what the photo showed or asked, and say whether the writing used it.',
          ].join('\n')
        : '',
    ].filter(Boolean).join('\n'),
    image: input.promptImage ?? null,
    user: {
      prompt_type: input.promptType,
      prompt_title: input.promptTitle ?? null,
      prompt_description: input.promptDescription ?? null,
      prompt_has_photo: Boolean(input.promptImage),
      hint_points: input.examStyle ? [] : hints,
      exam_style: Boolean(input.examStyle),
      word_count: wc,
      student_writing: input.content,
      required_json_schema: {
        photo_kind: input.promptImage
          ? '"question" if the photo has a written task, "stimulus" if the student should write from the picture'
          : 'omit',
        photo_question: input.promptImage
          ? 'string: the written task copied from the photo, or a short description of the picture'
          : 'string: empty',
        task_match: input.promptImage
          ? '"yes" | "partial" | "no" | "unread"'
          : 'omit',
        score_set_a: 'integer 0-15',
        score_set_b: 'integer 0-10',
        overall_score: 'integer 0-25 (= score_set_a + score_set_b)',
        scores_breakdown: {
          structure: 'integer 0-5',
          vocabulary: 'integer 0-5',
          audience: 'integer 0-5',
          grammar: 'integer 0-5',
        },
        ai_feedback: input.examStyle
          ? 'string: 3-6 short paragraphs with strengths and gaps for a one-sitting paper; do not mention hints or a next draft'
          : 'string: 3-6 short paragraphs with strengths, gaps, and next-draft advice',
        marker_notes: {
          summary: 'string: 3-5 sentences of TrialSeed feedback naming Set A and Set B gaps; never call it a teacher mark',
          photo_kind: input.promptImage
            ? '"question" | "stimulus"'
            : 'omit',
          photo_question: input.promptImage
            ? 'string: same copied task or picture description'
            : 'omit',
          task_match: input.promptImage
            ? '"yes" | "partial" | "no" | "unread"'
            : 'omit',
          strengths: ['string: what this sitting already does well'],
          next_steps: ['string: what to change next, tied to Set A or Set B'],
          annotations: [
            {
              kind: 'spelling|punctuation|sentence|structure|vocabulary|content',
              quote: 'exact substring copied from student_writing',
              issue: 'what is wrong, naming Set A or Set B',
              suggestion: 'how to fix that phrase',
            },
          ],
          rewrites: [
            {
              original: 'a full sentence copied from student_writing',
              improved: 'one stronger sentence that keeps their idea, fixes accuracy, and adds one concrete detail from their scene',
              why: 'why a Selective marker would prefer the rewrite',
              set: 'A or B',
            },
          ],
        },
        checked_hint_1: 'boolean',
        checked_hint_2: 'boolean',
        checked_hint_3: 'boolean',
        word_count: 'integer',
      },
    },
  });

  const parsed = JSON.parse(raw) as Partial<ScoringResult> & {
    scores_breakdown?: Partial<ScoresBreakdown>;
    marker_notes?: unknown;
    photo_question?: unknown;
    task_match?: unknown;
    photo_kind?: unknown;
  };
  const local = buildMarkerNotesHeuristic({
    content: input.content,
    promptType: input.promptType,
    promptTitle: input.promptTitle,
    hintPoints: input.hintPoints,
    examStyle: input.examStyle,
    wordCount: wc,
  });
  let notes = combineRemoteMarkerNotes(input.content, local, {
    ...(parsed.marker_notes &&
    typeof parsed.marker_notes === 'object' &&
    !Array.isArray(parsed.marker_notes)
      ? parsed.marker_notes
      : {}),
    ...photoFieldsFromParsed(parsed),
  });
  if (input.promptImage && !notes.task_match) {
    notes = { ...notes, task_match: 'unread' };
  }
  if (input.promptImage && notes.photo_question && !notes.photo_kind) {
    notes = { ...notes, photo_kind: inferPhotoKind(notes.photo_question) };
  }

  return normalizeResult({ ...parsed, word_count: parsed.word_count ?? wc }, input.content, notes);
}

/**
 * Score a writing attempt with OpenAI; fall back to heuristic scoring on failure.
 */
export async function scoreWritingAttempt(input: ScoreInput): Promise<ScoringResult> {
  try {
    if (!isOpenAIConfigured()) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    return await scoreWithOpenAI(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown OpenAI error';
    console.error('[scoring] OpenAI scoring failed, using heuristic fallback:', message);
    return scoreWritingAttemptHeuristic(input);
  }
}
