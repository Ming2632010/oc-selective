import { createJsonCompletion, isOpenAIConfigured } from '@/lib/openai';
import {
  buildMarkerNotesHeuristic,
  combineRemoteMarkerNotes,
  type MarkerNotes,
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

High-band responses typically:
- Address the task fully and develop ideas with relevant detail
- Use a clear structure matched to the required form
- Maintain an appropriate audience/purpose throughout
- Use ambitious but controlled vocabulary
- Show mostly accurate grammar and punctuation

Mid-band responses typically:
- Cover the task with some development, but uneven detail or organisation
- Show partial awareness of form/audience
- Use adequate vocabulary with limited precision
- Include noticeable but not overwhelming accuracy issues

Low-band responses typically:
- Are brief, off-task, or poorly organised
- Show weak audience/form awareness
- Use limited vocabulary and frequent accuracy errors

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

  return {
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

  return {
    score_set_a,
    score_set_b,
    overall_score,
    scores_breakdown: { structure, vocabulary, audience, grammar },
    ai_feedback: notes.summary || ai_feedback,
    marker_notes: notes,
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
    ].filter(Boolean).join('\n'),
    user: {
      prompt_type: input.promptType,
      prompt_title: input.promptTitle ?? null,
      prompt_description: input.promptDescription ?? null,
      hint_points: input.examStyle ? [] : hints,
      exam_style: Boolean(input.examStyle),
      word_count: wc,
      student_writing: input.content,
      required_json_schema: {
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
  };
  const local = buildMarkerNotesHeuristic({
    content: input.content,
    promptType: input.promptType,
    promptTitle: input.promptTitle,
    hintPoints: input.hintPoints,
    examStyle: input.examStyle,
    wordCount: wc,
  });
  const notes = combineRemoteMarkerNotes(input.content, local, parsed.marker_notes);

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
