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
import { formatDimensionScore } from '@/lib/score-format';
import { writingUsesStimulusFocus, type StimulusFocus } from '@/lib/stimulus-focus';
import { hintCovered } from '@/lib/writing-hints';

export { formatDimensionScore };

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

export type PreviousDraftScore = {
  draft_number: number;
  content: string;
  score_set_a: number;
  score_set_b: number;
  overall_score: number;
  scores_breakdown: ScoresBreakdown;
  next_steps?: string[];
};

export type ScoreInput = {
  content: string;
  hintPoints: string[];
  promptType: string;
  promptTitle?: string;
  promptDescription?: string;
  examStyle?: boolean;
  promptImage?: { mimeType: string; bytes: Buffer } | null;
  draftNumber?: number;
  previousDrafts?: PreviousDraftScore[];
  stimulusFocus?: StimulusFocus | null;
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
- score_set_b: integer 0–10 (sentences, punctuation and spelling only)
- overall_score MUST equal score_set_a + score_set_b

Four-dimension breakdown (each 0–5, halves allowed: 3, 3.5, 4):
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
Task completion, topic match, and hint coverage belong in Set A (content and form), not Set B.

Draft memory (when previous_drafts is provided):
- Compare this draft with the previous draft.
- If the student improved vocabulary (for example “got scared” to “hid under her covers” or “a jolt of fear”) or fixed punctuation from previous feedback, you MUST increase the Vocabulary & style (vocabulary) or Sentences/punctuation (grammar) dimension by 0.5 or 1 from that previous draft. Reward their effort.
- Do not jump overall out of the fair band just because sentences were polished. If the plot still misses the picture’s key object or a required plan-change, keep overall in the 12–17 basic band (16/25 is fair for a generic cleanup story).

Picture prompts:
- If a picture is attached or stimulus_focus is given, look at that object. Do not give vague “add more detail” advice.
- If the student writes a generic cleanup story (sweeping leaves, falling trees, buying flowers) and misses the key visual object, you MUST name it. Example: “You missed the most interesting part of the picture: the overturned letterbox. What if Mia found a letter inside?”
- Missing the key object is a Set A content gap, not an off-task script, when the writing is still about this scene. Keep Set A at 10 or below and overall in 12–17.

Missed hints:
- If a hint such as “Introduce a discovery that changes the character’s plan” is missed, the first next_step and ai_feedback MUST explain how to fix the plot, with a concrete example.
- Example: “Instead of just buying flowers, have Mia open one of the scattered envelopes, which changes her whole morning plan.”

Script mark-up (required):
- Highlight exact phrases from the student writing (spelling, punctuation, sentence control, structure/form, vocabulary, content).
- Do not stamp every short sentence with the same “too short” note. One content comment for an under-developed piece is enough.
- Do not mark diary or letter greetings and sign-offs as missing a full stop or as choppy sentences. “Dear Diary,” / “Dear Mum,” / “From Stella” / “Yours sincerely” / “xx” are form conventions. A comma after Dear Diary is correct.
- If Set A (content or organisation) is a real weakness, you MUST include at least one content or structure annotation that tells the student what to add, cut, or reorder. Do not only rewrite sentences or comment on spelling.
- Content comments should name a moment to keep, a moment to cut, or a paragraph job (opening feeling, one developed scene, a close that looks back).
- Give a better version of 2–4 of the student’s weakest sentences. Keep that sentence’s idea. Fix spelling in the rewrite. Prefer one developed sentence, not a second new sentence. Do not rewrite greetings or sign-offs.
- Tie every comment to Set A (content, form, organisation, vocabulary/style) or Set B (sentences, punctuation, spelling).
- Write for a Year 5–6 student in Australian English. Be specific to their words, not generic.
- In student-facing text, say TrialSeed feedback or TrialSeed mark-up. Never call it a teacher mark.
- Do not mark “very” in phrases such as “the very end”. Do not mark “went” in “went off”.
- Do not say a diary is a full-day timetable if it already develops one moment with inner conflict (a choice, a fall, a decision). A sentence such as “Then came the 100-metre sprint” can open that moment; it is not a new event to cut.
- If a task hint is clearly covered, do not say it is still missing, and do not ask for extra opening activities that would turn a focused diary into a list.
- On draft 2+, do not repeat a next step the student already did. Name what improved, then give one new, smaller craft step.
- Do not say “the mark will rise when that idea is developed” when Set A is already 13 or above.
`.trim();

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clampHalf(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  const rounded = Math.round(value * 2) / 2;
  return Math.max(min, Math.min(max, rounded));
}

const WEAK_WORD_RE = /\b(very|really|nice|got|went|said|things|stuff)\b/gi;

export function detectDraftPolish(previous: string, current: string): {
  vocabulary: boolean;
  vocabularyStrong: boolean;
  accuracy: boolean;
} {
  const prev = previous ?? '';
  const cur = current ?? '';
  const pairs: { from: RegExp; to: RegExp; strong?: boolean }[] = [
    { from: /got scared/i, to: /jolt of fear|hid under|froze/i, strong: true },
    { from: /on the floor/i, to: /on the ground/i },
    { from: /raining cats and dogs/i, to: /raining heavily|pouring|lashing/i, strong: true },
    { from: /\bwent into the house\b/i, to: /hurried|ran into the house/i },
    { from: /felt sorry/i, to: /deep sadness|heart sank/i, strong: true },
  ];
  let vocabulary = false;
  let vocabularyStrong = false;
  for (const pair of pairs) {
    pair.from.lastIndex = 0;
    pair.to.lastIndex = 0;
    if (pair.from.test(prev) && pair.to.test(cur)) {
      vocabulary = true;
      if (pair.strong) vocabularyStrong = true;
    }
  }
  const prevWeak = prev.match(WEAK_WORD_RE)?.length ?? 0;
  WEAK_WORD_RE.lastIndex = 0;
  const curWeak = cur.match(WEAK_WORD_RE)?.length ?? 0;
  if (curWeak + 1 <= prevWeak && prevWeak > 0 && curWeak < prevWeak) {
    vocabulary = true;
  }
  const accuracy =
    (/\s ,/.test(prev) && !/\s ,/.test(cur)) ||
    (/\bdont\b/i.test(prev) && /\bdon't\b/i.test(cur)) ||
    (/\bwont\b/i.test(prev) && /\bwon't\b/i.test(cur)) ||
    (/\bwich\b/i.test(prev) && /\bwhich\b/i.test(cur));
  return { vocabulary, vocabularyStrong, accuracy };
}

export function applyDraftMemory(result: ScoringResult, input: ScoreInput): ScoringResult {
  const prev = [...(input.previousDrafts ?? [])]
    .filter((row) => row.draft_number < (input.draftNumber ?? Number.POSITIVE_INFINITY))
    .sort((a, b) => a.draft_number - b.draft_number)
    .at(-1);
  if (!prev || input.examStyle) return result;

  const polish = detectDraftPolish(prev.content, input.content);
  if (!polish.vocabulary && !polish.accuracy) return result;

  const prevBreak = prev.scores_breakdown;
  const breakdown = { ...result.scores_breakdown };
  const strengths = [...result.marker_notes.strengths];

  if (polish.vocabulary) {
    const lift = polish.vocabularyStrong ? 1 : 0.5;
    const rewarded = Math.min(5, (prevBreak?.vocabulary ?? 0) + lift);
    breakdown.vocabulary = clampHalf(Math.max(breakdown.vocabulary, rewarded), 0, 5);
    if (breakdown.vocabulary > (prevBreak?.vocabulary ?? 0)) {
      strengths.unshift(
        `Your vocabulary mark rose because you improved word choice from draft ${prev.draft_number}.`,
      );
    }
  }
  if (polish.accuracy) {
    const rewarded = Math.min(5, (prevBreak?.grammar ?? 0) + 0.5);
    breakdown.grammar = clampHalf(Math.max(breakdown.grammar, rewarded), 0, 5);
    if (breakdown.grammar > (prevBreak?.grammar ?? 0)) {
      strengths.unshift(
        `Your sentences/punctuation mark rose because you acted on draft ${prev.draft_number} accuracy notes.`,
      );
    }
  }

  return {
    ...result,
    scores_breakdown: breakdown,
    marker_notes: {
      ...result.marker_notes,
      strengths: uniqueNoteStrings(strengths).slice(0, 5),
    },
  };
}

function uniqueNoteStrings(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function wordCount(text: string): number {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  return parts.length;
}

function normalizeResult(
  partial: Partial<ScoringResult> & {
    scores_breakdown?: Partial<ScoresBreakdown>;
  },
  content: string,
  notes: MarkerNotes,
): ScoringResult {
  const wc = typeof partial.word_count === 'number' ? partial.word_count : wordCount(content);

  const structure = clampHalf(Number(partial.scores_breakdown?.structure ?? 0), 0, 5);
  const vocabulary = clampHalf(Number(partial.scores_breakdown?.vocabulary ?? 0), 0, 5);
  const audience = clampHalf(Number(partial.scores_breakdown?.audience ?? 0), 0, 5);
  const grammar = clampHalf(Number(partial.scores_breakdown?.grammar ?? 0), 0, 5);

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

/**
 * Missing the picture’s key object (letterbox, empty seat note, …) is a Set A
 * content gap, not an off-task script. Keep the overall in the basic 12–17 band
 * so sentence polish can still raise a dimension without inflating the total.
 */
export function applyMissedStimulusCap(result: ScoringResult, input: ScoreInput): ScoringResult {
  const focus = input.stimulusFocus;
  if (!focus || writingUsesStimulusFocus(input.content, focus)) return result;

  const breakdown = { ...result.scores_breakdown };
  breakdown.structure = Math.min(breakdown.structure, 3);
  breakdown.vocabulary = Math.min(breakdown.vocabulary, 3);
  breakdown.audience = Math.min(breakdown.audience, 2);
  const score_set_a = clamp(Math.min(result.score_set_a, 10), 0, 15);
  const score_set_b = clamp(Math.min(result.score_set_b, 6), 0, 10);
  return {
    ...result,
    score_set_a,
    score_set_b,
    overall_score: clamp(score_set_a + score_set_b, 0, 25),
    scores_breakdown: breakdown,
  };
}

function softenMissedFocusTaskMatch(result: ScoringResult, input: ScoreInput): ScoringResult {
  const focus = input.stimulusFocus;
  if (!focus || writingUsesStimulusFocus(input.content, focus)) return result;
  if (result.marker_notes.task_match !== 'no') return result;
  return {
    ...result,
    marker_notes: { ...result.marker_notes, task_match: 'partial' },
  };
}

function finalizeWritingScore(result: ScoringResult, input: ScoreInput): ScoringResult {
  return applyDraftMemory(
    applyMissedStimulusCap(applyPhotoTaskMatch(softenMissedFocusTaskMatch(result, input)), input),
    input,
  );
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
  const score_set_b = clamp(grammar + Math.floor(lengthScore / 2), 0, 10);
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
    stimulusFocus: input.stimulusFocus,
  });
  const marker_notes =
    input.promptImage && !input.stimulusFocus
      ? { ...notes, task_match: 'unread' as const }
      : notes;

  return finalizeWritingScore(
    {
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
    },
    input,
  );
}

async function scoreWithOpenAI(input: ScoreInput): Promise<ScoringResult> {
  const hints = [...input.hintPoints, '', '', ''].slice(0, 3);
  const wc = wordCount(input.content);

  const raw = await createJsonCompletion({
    temperature: 0.2,
    system: [
      'You mark NSW Selective writing practice for TrialSeed.',
      'Circle exact errors, give content-change advice when Set A is weak, and rewrite the student’s own weakest sentences. Never mark “Dear Diary,” as missing a full stop.',
      input.previousDrafts?.length && input.draftNumber
        ? `Compare Draft ${input.draftNumber} with the previous draft. If the student improved their vocabulary (e.g., 'got scared' to 'hid under her covers') or fixed punctuation based on previous feedback, you MUST increase the 'Vocabulary & style' (vocabulary) or 'Sentences/punctuation' (grammar) dimension score by 0.5 or 1 point from that previous draft. Reward their effort.`
        : 'If a previous draft is supplied, reward real vocabulary or punctuation improvement with +0.5 or +1 on that dimension.',
      input.stimulusFocus
        ? [
            `The visual prompt’s key object is: ${input.stimulusFocus.focus}.`,
            `If the student writes a generic cleanup story (e.g., sweeping leaves, falling trees) and completely misses the key visual object in the image, you must explicitly tell them. Do not just say 'add more detail'. Say: '${input.stimulusFocus.missedIssue.replace(/^Set A content:\s*/i, '')} ${input.stimulusFocus.missedSuggestion}'`,
            `If the 'plan change' hint is missed, provide a concrete example of how to alter the plot in the 'Do this next' section. Example: '${input.stimulusFocus.plotFix}'`,
            'Missing that object is a Set A content gap, not an off-task script, when the writing is still about this scene. Keep overall in the 12–17 band (16/25 is fair for a generic cleanup).',
          ].join('\n')
        : 'If a picture or stimulus_focus is supplied and the writing misses the key object, name that object. Do not only say add more detail.',
      'If a plan-change or discovery hint is missed, give a concrete plot example in next_steps.',
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
      draft_number: input.draftNumber ?? null,
      stimulus_focus: input.stimulusFocus
        ? {
            key_object: input.stimulusFocus.focus,
            missed_issue: input.stimulusFocus.missedIssue,
            missed_suggestion: input.stimulusFocus.missedSuggestion,
            plot_fix: input.stimulusFocus.plotFix,
          }
        : null,
      previous_drafts: (input.previousDrafts ?? []).map((row) => ({
        draft_number: row.draft_number,
        overall_score: row.overall_score,
        score_set_a: row.score_set_a,
        score_set_b: row.score_set_b,
        scores_breakdown: row.scores_breakdown,
        next_steps: row.next_steps ?? [],
        student_writing: row.content,
      })),
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
          structure: 'number 0-5 (halves allowed)',
          vocabulary: 'number 0-5 (halves allowed)',
          audience: 'number 0-5 (halves allowed)',
          grammar: 'number 0-5 (halves allowed)',
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
          next_steps: [
            'string: what to change next, tied to Set A or Set B. If a picture object or plan-change hint is missing, the first step must name the object and give a concrete plot example. If Set A is weak for another reason, the first step must say what to add, cut, or reorder',
          ],
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
    stimulusFocus: input.stimulusFocus,
  });
  let notes = combineRemoteMarkerNotes(
    input.content,
    local,
    {
      ...(parsed.marker_notes &&
      typeof parsed.marker_notes === 'object' &&
      !Array.isArray(parsed.marker_notes)
        ? parsed.marker_notes
        : {}),
      ...photoFieldsFromParsed(parsed),
    },
    {
      promptType: input.promptType,
      hintPoints: input.hintPoints,
      wordCount: wc,
    },
  );
  if (input.promptImage && !notes.task_match && !input.stimulusFocus) {
    notes = { ...notes, task_match: 'unread' };
  }
  if (input.promptImage && notes.photo_question && !notes.photo_kind) {
    notes = { ...notes, photo_kind: inferPhotoKind(notes.photo_question) };
  }

  return finalizeWritingScore(
    normalizeResult({ ...parsed, word_count: parsed.word_count ?? wc }, input.content, notes),
    input,
  );
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
