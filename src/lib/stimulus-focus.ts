export type StimulusFocus = {
  /** Short picture object the student should write from. */
  focus: string;
  /** Words that count as using the object. */
  terms: string[];
  /** Set A content note when the object is missing. */
  missedIssue: string;
  /** What to try instead of “add more detail”. */
  missedSuggestion: string;
  /** Concrete plot change for a missed discovery/plan hint. */
  plotFix: string;
};

const FOCUS_BY_PATH: Record<string, StimulusFocus> = {
  '/stimuli/after-the-storm.jpg': {
    focus: 'an overturned letterbox spilling envelopes onto a wet suburban street',
    terms: ['letterbox', 'mailbox', 'envelope', 'envelopes', 'letter', 'letters'],
    missedIssue:
      'Set A content: You missed the most interesting part of the picture: the overturned letterbox.',
    missedSuggestion:
      'What if Mia found a letter inside? Write from the spilled envelopes, not a generic cleanup.',
    plotFix:
      'Instead of just buying flowers, have Mia open one of the scattered envelopes, which changes her whole morning plan.',
  },
  '/stimuli/empty-seat.jpg': {
    focus: 'an empty bus seat with a folded note left on it',
    terms: ['seat', 'note', 'scrap', 'message', 'paper'],
    missedIssue:
      'Set A content: you missed the most interesting part of the picture: the empty seat and the note.',
    missedSuggestion:
      'What if the character picked up the folded note? Let that object start the story.',
    plotFix:
      'Instead of a generic bus ride, have the character read the note on the empty seat — that should change what they do next.',
  },
  '/stimuli/school-fair.jpg': {
    focus: 'the school fair on the oval, with stalls, food, and families',
    terms: ['fair', 'stall', 'oval', 'sausage', 'face-paint', 'ride'],
    missedIssue:
      'Set A content: you missed the most interesting part of the picture: the fair itself.',
    missedSuggestion:
      'Name a stall, a smell, or a crowd from the photo so families can picture this fair.',
    plotFix:
      'Instead of only saying “it will be fun”, pick one thing from the picture (a stall, the oval, the food) and tell the reader what to do next.',
  },
  '/stimuli/last-bus.jpg': {
    focus: 'the last bus about to leave, with the character still not on it',
    terms: ['bus', 'doors', 'driver', 'pass', 'stop'],
    missedIssue:
      'Set A content: you missed the most interesting part of the picture: the last bus leaving.',
    missedSuggestion:
      'Put the character at those closing doors. What is stopping them from getting on?',
    plotFix:
      'Instead of a quiet walk home, have the last bus start to leave — that should change the character’s plan in the next sentence.',
  },
};

const FOCUS_BY_TITLE: Record<string, StimulusFocus> = {
  'After the storm': FOCUS_BY_PATH['/stimuli/after-the-storm.jpg'],
  'The empty seat': FOCUS_BY_PATH['/stimuli/empty-seat.jpg'],
  'Advertise the school fair': FOCUS_BY_PATH['/stimuli/school-fair.jpg'],
  'Term review: The last bus home': FOCUS_BY_PATH['/stimuli/last-bus.jpg'],
};

export function stimulusFocusFor(
  imagePath?: string | null,
  title?: string | null,
): StimulusFocus | null {
  if (imagePath && FOCUS_BY_PATH[imagePath]) return FOCUS_BY_PATH[imagePath];
  if (title && FOCUS_BY_TITLE[title]) return FOCUS_BY_TITLE[title];
  return null;
}

export function writingUsesStimulusFocus(content: string, focus: StimulusFocus): boolean {
  const hay = content.toLowerCase();
  return focus.terms.some((term) => hay.includes(term.toLowerCase()));
}
