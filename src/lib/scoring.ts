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
  checked_hint_1: boolean;
  checked_hint_2: boolean;
  checked_hint_3: boolean;
  word_count: number;
};

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

/**
 * Lightweight heuristic scorer so drafts get immediate feedback
 * without an external AI provider. Replace later with model scoring.
 */
export function scoreWritingAttempt(input: {
  content: string;
  hintPoints: string[];
  promptType: string;
}): ScoringResult {
  const content = input.content ?? '';
  const wc = wordCount(content);
  const hints = [...input.hintPoints, '', '', ''].slice(0, 3);
  const checked = hints.map((hint) => (hint ? hintCovered(content, hint) : false));
  const hintScore = checked.filter(Boolean).length;

  // Length band roughly aligned to 30-min selective responses
  let lengthScore = 0;
  if (wc >= 220) lengthScore = 5;
  else if (wc >= 160) lengthScore = 4;
  else if (wc >= 110) lengthScore = 3;
  else if (wc >= 70) lengthScore = 2;
  else if (wc >= 40) lengthScore = 1;

  const hasParagraphs = (content.match(/\n\s*\n/g) ?? []).length >= 1 || content.includes('\n');
  const hasTitleLike =
    /newspaper_report|advice_sheet/.test(input.promptType) &&
    /[A-Z][A-Z\s]{6,}/.test(content.slice(0, 80));
  const audienceCue =
    /dear |subject:|dear diary|welcome|report|according to|said/i.test(content) ||
    input.promptType === 'diary_entry';

  const structure = clamp(2 + (hasParagraphs ? 2 : 0) + hintScore, 0, 5);
  const vocabulary = clamp(1 + lengthScore * 0.6 + (wc > 140 ? 1 : 0), 0, 5);
  const audience = clamp(1 + (audienceCue ? 2 : 0) + (hasTitleLike ? 1 : 0) + hintScore * 0.5, 0, 5);
  const grammar = clamp(2 + (wc > 60 ? 1 : 0) + (content.includes('.') ? 1 : 0), 0, 5);

  const score_set_a = clamp(structure + vocabulary + audience, 0, 15);
  const score_set_b = clamp(grammar + hintScore + Math.floor(lengthScore / 2), 0, 10);
  const overall_score = clamp(score_set_a + score_set_b, 0, 25);

  const covered = checked
    .map((ok, i) => (ok ? `✓ Hint ${i + 1} covered` : `✗ Hint ${i + 1} not clearly covered`))
    .join('\n');

  const ai_feedback = [
    `Overall ${overall_score}/25 (Set A ${score_set_a}/15, Set B ${score_set_b}/10).`,
    wc < 100
      ? 'Your response is quite short for a 30-minute selective task — aim to develop each idea with detail and examples.'
      : wc > 280
        ? 'Strong length. Tighten any repetition so every sentence earns its place.'
        : 'Length is in a solid practice range. Keep building precise detail.',
    hasParagraphs
      ? 'Organisation shows paragraphing — keep using clear sections for each idea.'
      : 'Try clearer paragraph breaks so structure and audience purpose stand out.',
    'Hint checklist:',
    covered,
    'Next draft: strengthen any missing hint, polish word choice, and re-check opening/closing for audience.',
  ].join('\n');

  return {
    score_set_a,
    score_set_b,
    overall_score,
    scores_breakdown: { structure, vocabulary, audience, grammar },
    ai_feedback,
    checked_hint_1: checked[0] ?? false,
    checked_hint_2: checked[1] ?? false,
    checked_hint_3: checked[2] ?? false,
    word_count: wc,
  };
}
