import { typeLabel } from '@/lib/units';

export const MARKER_KINDS = [
  'spelling',
  'punctuation',
  'sentence',
  'structure',
  'vocabulary',
  'content',
] as const;

export type MarkerKind = (typeof MARKER_KINDS)[number];

export type MarkerSet = 'A' | 'B';

export type MarkerAnnotation = {
  start: number;
  end: number;
  kind: MarkerKind;
  quote: string;
  issue: string;
  suggestion: string;
};

export type MarkerRewrite = {
  original: string;
  improved: string;
  why: string;
  set: MarkerSet;
};

export type MarkerNotes = {
  summary: string;
  strengths: string[];
  next_steps: string[];
  annotations: MarkerAnnotation[];
  rewrites: MarkerRewrite[];
};

export const MARKER_KIND_META: Record<
  MarkerKind,
  { label: string; set: MarkerSet; swatch: string }
> = {
  content: {
    label: 'Content & detail',
    set: 'A',
    swatch: 'bg-stone-200 text-stone-900',
  },
  structure: {
    label: 'Form & organisation',
    set: 'A',
    swatch: 'bg-sky-100 text-sky-950',
  },
  vocabulary: {
    label: 'Vocabulary & style',
    set: 'A',
    swatch: 'bg-teal-100 text-teal-950',
  },
  sentence: {
    label: 'Sentence control',
    set: 'B',
    swatch: 'bg-violet-100 text-violet-950',
  },
  punctuation: {
    label: 'Punctuation',
    set: 'B',
    swatch: 'bg-amber-100 text-amber-950',
  },
  spelling: {
    label: 'Spelling',
    set: 'B',
    swatch: 'bg-red-100 text-red-950',
  },
};

export const MARKER_HIGHLIGHT: Record<MarkerKind, string> = {
  spelling: 'bg-red-100 underline decoration-red-600 decoration-2 underline-offset-2',
  punctuation: 'bg-amber-100 underline decoration-amber-600 decoration-2 underline-offset-2',
  sentence: 'bg-violet-100 underline decoration-violet-600 decoration-2 underline-offset-2',
  structure: 'bg-sky-100 underline decoration-sky-600 decoration-2 underline-offset-2',
  vocabulary: 'bg-teal-100 underline decoration-teal-600 decoration-2 underline-offset-2',
  content: 'bg-stone-200 underline decoration-stone-600 decoration-2 underline-offset-2',
};

const COMMON_MISSPELLINGS: Record<string, string> = {
  alot: 'a lot',
  aswell: 'as well',
  becuase: 'because',
  begining: 'beginning',
  beleive: 'believe',
  definately: 'definitely',
  dissapear: 'disappear',
  enviroment: 'environment',
  freind: 'friend',
  gardian: 'guardian',
  grammer: 'grammar',
  independant: 'independent',
  knowlege: 'knowledge',
  neccessary: 'necessary',
  occured: 'occurred',
  recieve: 'receive',
  reccomend: 'recommend',
  seperate: 'separate',
  sentance: 'sentence',
  succsess: 'success',
  sucess: 'success',
  thier: 'their',
  tommorow: 'tomorrow',
  truely: 'truly',
  untill: 'until',
  wierd: 'weird',
  wich: 'which',
  writting: 'writing',
  accomodate: 'accommodate',
  arguement: 'argument',
  goverment: 'government',
  priviledge: 'privilege',
  refered: 'referred',
  speach: 'speech',
  surprize: 'surprise',
  usefull: 'useful',
  fourty: 'forty',
  hieght: 'height',
  existance: 'existence',
  maintainance: 'maintenance',
  occassion: 'occasion',
  persue: 'pursue',
  whereever: 'wherever',
};

const WEAK_WORDS = new Set([
  'very',
  'really',
  'nice',
  'good',
  'bad',
  'stuff',
  'things',
  'thing',
  'got',
  'get',
  'went',
  'go',
  'said',
  'big',
  'little',
  'amazing',
  'awesome',
]);

const MISSING_APOSTROPHE: Record<string, string> = {
  dont: "don't",
  cant: "can't",
  wont: "won't",
  didnt: "didn't",
  isnt: "isn't",
  wasnt: "wasn't",
  couldnt: "couldn't",
  wouldnt: "wouldn't",
  shouldnt: "shouldn't",
  im: "I'm",
  ive: "I've",
  thats: "that's",
  theyre: "they're",
  youre: "you're",
  hes: "he's",
  shes: "she's",
};

const FORM_SHAPE: Record<string, string> = {
  narrative:
    'A Selective narrative usually needs a hook, a problem or change in the middle, and an ending that lands.',
  diary_entry:
    'A diary usually names the moment, tells what happened, shows a feeling, then looks a little ahead.',
  news_report:
    'A news report usually leads with what happened, then who/where/when, a quote or impact, and a close.',
  explanation:
    'An explanation usually says what the topic is, then the steps or reasons, then the result.',
  advice_sheet:
    'An advice sheet usually states the problem, gives numbered or headed tips, then a short close.',
  review:
    'A review usually names what is being judged, gives reasons with examples, then a recommendation.',
  advertisement:
    'An advertisement usually hooks the reader, names the offer, gives a reason to want it, then a call to action.',
  persuasive_text:
    'A persuasive piece usually states a view, gives reasons and a small example, then a firm close.',
  formal_letter:
    'A formal letter usually has a greeting, a clear purpose, reasons, and a polite sign-off.',
  speech:
    'A speech usually greets the listeners, states why you are speaking, develops one or two points, then ends with a memorable close.',
  email:
    'An email usually has a subject, a greeting, a purpose in the first lines, and a clear close.',
};

export type MarkerNotesInput = {
  content: string;
  promptType: string;
  promptTitle?: string;
  hintPoints?: string[];
  examStyle?: boolean;
  wordCount?: number;
};

function isMarkerKind(value: unknown): value is MarkerKind {
  return typeof value === 'string' && (MARKER_KINDS as readonly string[]).includes(value);
}

function clampOffset(value: number, max: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.round(value)));
}

function wordCountOf(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function splitSentences(content: string): { text: string; start: number; end: number }[] {
  const found: { text: string; start: number; end: number }[] = [];
  const pattern = /[^.!?\n]+[.!?]?/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content))) {
    const text = match[0];
    if (!text.trim()) continue;
    found.push({ text, start: match.index, end: match.index + text.length });
  }
  return found;
}

function firstSentenceSpan(content: string) {
  const sentences = splitSentences(content);
  return sentences[0] ?? { text: content.slice(0, 48), start: 0, end: Math.min(content.length, 48) };
}

function lastSentenceSpan(content: string) {
  const sentences = splitSentences(content);
  return sentences[sentences.length - 1] ?? firstSentenceSpan(content);
}

export function locateQuote(
  content: string,
  quote: string,
): { start: number; end: number } | null {
  const needle = quote.trim();
  if (!needle || !content) return null;
  const index = content.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return null;
  return { start: index, end: index + needle.length };
}

function pushNote(
  notes: MarkerAnnotation[],
  content: string,
  kind: MarkerKind,
  quote: string,
  issue: string,
  suggestion: string,
) {
  const located = locateQuote(content, quote) ?? firstSentenceSpan(content);
  notes.push({
    start: located.start,
    end: located.end,
    kind,
    quote: content.slice(located.start, located.end).trim() || quote.trim(),
    issue,
    suggestion,
  });
}

function eachWord(
  content: string,
  visit: (word: string, start: number, end: number) => void,
) {
  const pattern = /[A-Za-z']+/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content))) {
    visit(match[0], match.index, match.index + match[0].length);
  }
}

function hasParagraphBreak(content: string) {
  return /\n\s*\n/.test(content) || (content.match(/\n/g) ?? []).length >= 2;
}

function formLooksWrong(promptType: string, content: string) {
  const text = content.toLowerCase();
  if (promptType === 'formal_letter' || promptType === 'email') {
    return !/\bdear\b|\bhi\b|\bhello\b|subject:/.test(text);
  }
  if (promptType === 'news_report') {
    return !/\breport\b|\bsaid\b|\baccording\b|\byesterday\b|\btoday\b/.test(text) && wordCountOf(content) > 40;
  }
  if (promptType === 'diary_entry') {
    return /\bdear principal\b|\bto whom it may concern\b/.test(text);
  }
  if (promptType === 'speech') {
    return !/\bwelcome\b|\bladies\b|\bgentlemen\b|\bfriends\b|\btoday i\b|\bi stand\b/.test(text) &&
      wordCountOf(content) > 50;
  }
  return false;
}

function matchCase(source: string, replacement: string) {
  if (source === source.toUpperCase() && source.length > 1) return replacement.toUpperCase();
  if (source[0] && source[0] === source[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function tidyAccuracy(text: string) {
  return text.replace(/[A-Za-z']+/g, (word) => {
    const key = word.toLowerCase();
    if (COMMON_MISSPELLINGS[key]) return matchCase(word, COMMON_MISSPELLINGS[key]);
    if (MISSING_APOSTROPHE[key] && !word.includes("'")) return MISSING_APOSTROPHE[key];
    return word;
  });
}

function improveSentence(sentence: string, promptType: string, index = 0): string {
  const trimmed = sentence.trim().replace(/\s+/g, ' ');
  const core = tidyAccuracy(trimmed.replace(/[.!?]+$/, ''));
  if (!core) return trimmed;
  const lower = core.toLowerCase();
  if (promptType === 'narrative' || promptType === 'diary_entry') {
    if (/\bsat\b|\bstood\b|\bturned\b|\bopened\b|\bhandle\b/.test(lower)) {
      return `${core}, slower than I meant to, and the sound of it stayed in the room.`;
    }
    if (/\bempty\b|\bquiet\b|\bdark\b|\bdust\b|\bhung\b/.test(lower)) {
      return `${core}, and I could hear my own breathing more than anything else.`;
    }
    if (/\bran\b|\bwent\b|\bmoved\b|\bpocket\b|\btrain\b/.test(lower)) {
      return `${core} I counted three steps before I dared to look back.`;
    }
    if (/\bdon't\b|\bknow\b|\blook\b/.test(lower)) {
      return `${core} My hands found the seat edge and stayed there.`;
    }
    const extras = [
      `${core}, and a small, exact detail hung in the next breath.`,
      `${core} Then something shifted, just enough to make the next line matter.`,
      `${core} I kept the moment going instead of stopping there.`,
    ];
    return extras[index % extras.length];
  }
  if (promptType === 'news_report') {
    return `${core}, witnesses said, as people nearby tried to make sense of what came next.`;
  }
  if (promptType === 'formal_letter' || promptType === 'email') {
    return `${core}. I am writing to ask that this be looked into this week.`;
  }
  if (promptType === 'persuasive_text' || promptType === 'speech' || promptType === 'advertisement') {
    return `${core} That is why this should change now, not later.`;
  }
  return `${core}, which helps the reader follow the next step.`;
}

function rewriteWhy(promptType: string, kind: 'open' | 'develop' | 'close'): string {
  const form = typeLabel(promptType);
  if (kind === 'open') {
    return `Set A rewards an opening that fits a ${form} and makes the reader want the next line.`;
  }
  if (kind === 'close') {
    return `Set A rewards an ending that resolves the ${form} instead of stopping mid-thought.`;
  }
  return `Set A rewards developed detail. Keep your idea, but let the marker see it happen.`;
}

function uniqueStrings(values: string[]) {
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

export function emptyMarkerNotes(): MarkerNotes {
  return {
    summary: '',
    strengths: [],
    next_steps: [],
    annotations: [],
    rewrites: [],
  };
}

export function normalizeMarkerNotes(raw: unknown, content: string): MarkerNotes {
  const empty = emptyMarkerNotes();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return empty;
  const row = raw as Record<string, unknown>;

  const annotations: MarkerAnnotation[] = [];
  const seen = new Set<string>();
  if (Array.isArray(row.annotations)) {
    for (const item of row.annotations) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const note = item as Record<string, unknown>;
      if (!isMarkerKind(note.kind)) continue;
      const issue = typeof note.issue === 'string' ? note.issue.trim() : '';
      const suggestion = typeof note.suggestion === 'string' ? note.suggestion.trim() : '';
      if (!issue || !suggestion) continue;
      const quote =
        typeof note.quote === 'string' && note.quote.trim()
          ? note.quote.trim()
          : content.slice(
              clampOffset(Number(note.start), content.length),
              clampOffset(Number(note.end), content.length),
            );
      if (!quote) continue;
      const located =
        locateQuote(content, quote) ??
        (Number.isFinite(Number(note.start)) && Number.isFinite(Number(note.end))
          ? {
              start: clampOffset(Number(note.start), content.length),
              end: clampOffset(Number(note.end), content.length),
            }
          : firstSentenceSpan(content));
      if (located.end <= located.start) continue;
      const key = `${note.kind}:${located.start}:${located.end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      annotations.push({
        start: located.start,
        end: located.end,
        kind: note.kind,
        quote: content.slice(located.start, located.end) || quote,
        issue,
        suggestion,
      });
    }
  }

  const rewrites: MarkerRewrite[] = [];
  if (Array.isArray(row.rewrites)) {
    for (const item of row.rewrites) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const note = item as Record<string, unknown>;
      const original = typeof note.original === 'string' ? note.original.trim() : '';
      const improved = typeof note.improved === 'string' ? note.improved.trim() : '';
      const why = typeof note.why === 'string' ? note.why.trim() : '';
      if (!original || !improved || original === improved) continue;
      rewrites.push({
        original,
        improved,
        why: why || 'Keep your idea, but make it clearer for a Selective marker.',
        set: note.set === 'B' ? 'B' : 'A',
      });
    }
  }

  return {
    summary: typeof row.summary === 'string' ? row.summary.trim() : '',
    strengths: uniqueStrings(Array.isArray(row.strengths) ? row.strengths.map(String) : []),
    next_steps: uniqueStrings(Array.isArray(row.next_steps) ? row.next_steps.map(String) : []),
    annotations: annotations.sort((a, b) => a.start - b.start || a.end - b.end),
    rewrites: rewrites.slice(0, 4),
  };
}

function mergeAgainstContent(base: MarkerNotes, extra: MarkerNotes, content: string): MarkerNotes {
  return normalizeMarkerNotes(
    {
      summary: extra.summary || base.summary,
      strengths: [...extra.strengths, ...base.strengths],
      next_steps: [...extra.next_steps, ...base.next_steps],
      annotations: [...extra.annotations, ...base.annotations],
      rewrites: extra.rewrites.length > 0 ? extra.rewrites : base.rewrites,
    },
    content,
  );
}

export function buildMarkerNotesHeuristic(input: MarkerNotesInput): MarkerNotes {
  const content = input.content ?? '';
  const promptType = input.promptType || 'narrative';
  const wc = input.wordCount ?? wordCountOf(content);
  const hints = (input.hintPoints ?? []).filter(Boolean).slice(0, 3);
  const examStyle = Boolean(input.examStyle);
  const form = typeLabel(promptType);
  const used = Array.from({ length: content.length }, () => false);
  const annotations: MarkerAnnotation[] = [];
  const strengths: string[] = [];
  const nextSteps: string[] = [];

  eachWord(content, (word, start, end) => {
    const key = word.toLowerCase();
    const spelling = COMMON_MISSPELLINGS[key];
    if (spelling) {
      annotations.push({
        start,
        end,
        kind: 'spelling',
        quote: word,
        issue: `Set B spelling: “${word}” is not the standard spelling.`,
        suggestion: `Write “${spelling}”. Selective markers count everyday spelling as well as harder words.`,
      });
      for (let i = start; i < end; i += 1) used[i] = true;
      return;
    }
    const apostrophe = MISSING_APOSTROPHE[key];
    if (apostrophe && !word.includes("'")) {
      annotations.push({
        start,
        end,
        kind: 'punctuation',
        quote: word,
        issue: `Set B punctuation: this contraction needs an apostrophe.`,
        suggestion: `Write “${apostrophe}”. Apostrophes are part of the accuracy mark.`,
      });
      for (let i = start; i < end; i += 1) used[i] = true;
    }
  });

  const sentences = splitSentences(content);
  for (const sentence of sentences) {
    const text = sentence.text.trim();
    if (!text) continue;
    const lead = text.replace(/^\s+/, '');
    if (/^[a-z]/.test(lead)) {
      pushNote(
        annotations,
        content,
        'punctuation',
        lead.slice(0, Math.min(18, lead.length)),
        'Set B punctuation: this sentence does not start with a capital letter.',
        'Start each new sentence with a capital so the marker can see the sentence boundary.',
      );
    }
    if (/^[A-Za-z].+[,:;]$/.test(text) || (/^[A-Za-z].+[a-z]$/.test(text) && text.length > 12)) {
      pushNote(
        annotations,
        content,
        'punctuation',
        text.slice(-12),
        'Set B punctuation: this sentence has no clear full stop, question mark, or exclamation mark.',
        'Finish the sentence so Set B (sentences, punctuation and spelling) can be marked cleanly.',
      );
    }
    if (wordCountOf(text) >= 38) {
      pushNote(
        annotations,
        content,
        'sentence',
        text.slice(0, 42),
        'Set B sentence control: this sentence is running on.',
        'Split it into two or three sentences, or add a joining word the marker can follow.',
      );
    }
    if (wordCountOf(text) <= 4 && wc >= 12 && sentences.length >= 3) {
      pushNote(
        annotations,
        content,
        'sentence',
        text,
        'Set B sentence control: several very short sentences in a row can sound choppy.',
        'Keep one short line for impact, then join the next idea with a clause that adds detail.',
      );
    }
  }

  if (/\s,[^\s]|[.][A-Za-z]/.test(content)) {
    const quote = content.match(/\s,[^\s]|[.][A-Za-z]/)?.[0] ?? content.slice(0, 8);
    pushNote(
      annotations,
      content,
      'punctuation',
      quote,
      'Set B punctuation: a space is missing around a comma or full stop.',
      'Put one space after a comma or full stop. Markers notice crowding.',
    );
  }

  let weakHits = 0;
  eachWord(content, (word, start, end) => {
    if (used.slice(start, end).some(Boolean)) return;
    if (!WEAK_WORDS.has(word.toLowerCase())) return;
    weakHits += 1;
    if (weakHits > 4) return;
    annotations.push({
      start,
      end,
      kind: 'vocabulary',
      quote: word,
      issue: `Set A vocabulary: “${word}” is a general word. Markers look for a more precise choice.`,
      suggestion: 'Swap it for a verb or noun that shows what happened, how it felt, or how it looked.',
    });
    for (let i = start; i < end; i += 1) used[i] = true;
  });

  if (wc < 80) {
    pushNote(
      annotations,
      content,
      'content',
      firstSentenceSpan(content).text.trim().slice(0, 48),
      `Set A content: this is only ${wc} words. A 30-minute Selective task needs developed ideas, not a sketch.`,
      'Keep your idea, then add what the character saw, heard, and did next so the marker has details to reward.',
    );
  } else {
    strengths.push('You wrote enough for a marker to follow a developed idea.');
  }

  if (wc >= 70 && !hasParagraphBreak(content)) {
    pushNote(
      annotations,
      content,
      'structure',
      firstSentenceSpan(content).text.trim().slice(0, 40),
      'Set A organisation: the writing runs as one block. Selective markers look for paragraphs or clear sections.',
      `Start a new paragraph when the ${form.toLowerCase()} moves to a new moment, reason, or speaker.`,
    );
  } else if (hasParagraphBreak(content)) {
    strengths.push('You used paragraph breaks, which helps the organisation mark.');
  }

  if (formLooksWrong(promptType, content)) {
    pushNote(
      annotations,
      content,
      'structure',
      firstSentenceSpan(content).text.trim().slice(0, 40),
      `Set A form: this does not yet read as a ${form.toLowerCase()}.`,
      FORM_SHAPE[promptType] ?? `Match the conventions of a ${form.toLowerCase()}.`,
    );
  }

  const last = lastSentenceSpan(content);
  if (wc >= 12 && last.text.trim().length < 28 && !/[.!?]$/.test(last.text.trim())) {
    pushNote(
      annotations,
      content,
      'structure',
      last.text.trim(),
      'Set A organisation: the ending stops rather than closes the form.',
      FORM_SHAPE[promptType] ?? 'Give the last line a job: resolve, recommend, or look ahead.',
    );
  }

  for (const hint of hints) {
    const keywords = hint
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .slice(0, 5);
    const hay = content.toLowerCase();
    const hits = keywords.filter((word) => hay.includes(word)).length;
    if (keywords.length > 0 && hits < Math.min(2, keywords.length)) {
      nextSteps.push(`Cover this task hint in the writing itself: ${hint}`);
    }
  }

  const usableSentences = sentences
    .map((row) => row.text.trim())
    .filter((text) => wordCountOf(text) >= 3)
    .slice(0, 3);
  const rewrites: MarkerRewrite[] = usableSentences.map((text, index) => ({
    original: text,
    improved: improveSentence(text, promptType, index),
    why: rewriteWhy(promptType, index === 0 ? 'open' : index === usableSentences.length - 1 ? 'close' : 'develop'),
    set: 'A',
  }));

  if (annotations.some((row) => row.kind === 'spelling' || row.kind === 'punctuation')) {
    nextSteps.push('Proofread once for Set B: spelling, capitals, apostrophes, and full stops.');
  }
  nextSteps.push(FORM_SHAPE[promptType] ?? `Shape the piece as a ${form.toLowerCase()}.`);
  if (wc < 160) {
    nextSteps.push('Aim for about 160–250 words in 30 minutes so each idea has room.');
  }
  if (!examStyle) {
    nextSteps.push('On the next draft, keep your idea and add one precise detail in every paragraph.');
  } else {
    nextSteps.push('On the day there is one sitting. Leave three minutes to check spelling and paragraphing.');
  }

  if (annotations.some((row) => row.kind === 'spelling') === false && wc >= 20) {
    strengths.push('Everyday spelling is holding, which helps Set B.');
  }
  if (usableSentences.length > 0) {
    strengths.push('There is a clear idea to build on — the mark will rise when that idea is developed.');
  }

  const spellingCount = annotations.filter((row) => row.kind === 'spelling').length;
  const punctuationCount = annotations.filter((row) => row.kind === 'punctuation').length;
  const summary = [
    `Teacher mark-up for this ${form.toLowerCase()}, using the NSW Selective writing criteria.`,
    `Set A (content, form, organisation, vocabulary/style) looks at whether the piece does the job of a ${form.toLowerCase()}.`,
    `Set B (sentences, punctuation, spelling) looks at accuracy. This sitting has ${spellingCount} spelling note${spellingCount === 1 ? '' : 's'} and ${punctuationCount} punctuation note${punctuationCount === 1 ? '' : 's'}.`,
    wc < 80
      ? `At ${wc} words the main gap is development: keep your idea, then show the moment in enough detail for a 30-minute paper.`
      : 'Read the highlighted lines, then the “Write it better” rewrites that start from your own sentences.',
  ].join(' ');

  return normalizeMarkerNotes(
    {
      summary,
      strengths: uniqueStrings(strengths).slice(0, 4),
      next_steps: uniqueStrings(nextSteps).slice(0, 5),
      annotations,
      rewrites,
    },
    content,
  );
}

export function markerNotesFromUnknown(raw: unknown, content: string): MarkerNotes | null {
  const notes = normalizeMarkerNotes(raw, content);
  if (
    !notes.summary &&
    notes.annotations.length === 0 &&
    notes.rewrites.length === 0 &&
    notes.strengths.length === 0
  ) {
    return null;
  }
  return notes;
}

export function combineRemoteMarkerNotes(
  content: string,
  local: MarkerNotes,
  remote: unknown,
): MarkerNotes {
  const parsed = markerNotesFromUnknown(remote, content);
  if (!parsed) return local;
  return mergeAgainstContent(local, parsed, content);
}

const MARKER_PRIORITY: Record<MarkerKind, number> = {
  spelling: 6,
  punctuation: 5,
  sentence: 4,
  vocabulary: 3,
  structure: 2,
  content: 1,
};

export function annotationSegments(content: string, annotations: MarkerAnnotation[]) {
  const owner = Array.from({ length: content.length }, () => -1);
  const kindAt: Array<MarkerKind | null> = Array.from({ length: content.length }, () => null);
  annotations.forEach((note, index) => {
    if (note.end <= note.start) return;
    for (let i = note.start; i < note.end && i < content.length; i += 1) {
      const current = kindAt[i];
      if (!current || MARKER_PRIORITY[note.kind] > MARKER_PRIORITY[current]) {
        owner[i] = index;
        kindAt[i] = note.kind;
      }
    }
  });
  const segments: { text: string; noteIndex: number | null; kind: MarkerKind | null }[] = [];
  let cursor = 0;
  while (cursor < content.length) {
    const index = owner[cursor];
    const kind = kindAt[cursor];
    let end = cursor + 1;
    while (end < content.length && owner[end] === index && kindAt[end] === kind) end += 1;
    segments.push({
      text: content.slice(cursor, end),
      noteIndex: index >= 0 ? index : null,
      kind,
    });
    cursor = end;
  }
  return segments;
}
