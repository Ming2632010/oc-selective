'use client';

import { useMemo, useState } from 'react';
import {
  MARKER_HIGHLIGHT,
  MARKER_KIND_META,
  MARKER_KINDS,
  annotationSegments,
  type MarkerNotes,
} from '@/lib/marker-notes';

export function MarkedScript({
  content,
  notes,
}: {
  content: string;
  notes: MarkerNotes;
}) {
  const [open, setOpen] = useState<number | null>(notes.annotations[0] ? 0 : null);
  const segments = useMemo(
    () => annotationSegments(content, notes.annotations),
    [content, notes.annotations],
  );
  const usedKinds = useMemo(() => {
    const seen = new Set(notes.annotations.map((row) => row.kind));
    return MARKER_KINDS.filter((kind) => seen.has(kind));
  }, [notes.annotations]);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-200 p-4">
        <h2 className="text-lg font-medium">Teacher mark-up</h2>
        <p className="mt-1 text-sm text-stone-600">
          Highlighted like a class teacher would: spelling and punctuation
          (Set B), plus structure, vocabulary and detail (Set A). Tap a
          highlight to read the note.
        </p>
        {usedKinds.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {usedKinds.map((kind) => (
              <li
                key={kind}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${MARKER_KIND_META[kind].swatch}`}
              >
                {MARKER_KIND_META[kind].label} · Set {MARKER_KIND_META[kind].set}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-stone-900">
          {segments.map((part, index) =>
            part.noteIndex === null || !part.kind ? (
              <span key={`${index}-${part.text.slice(0, 8)}`}>{part.text}</span>
            ) : (
              <button
                key={`${index}-${part.noteIndex}`}
                type="button"
                onClick={() => setOpen(part.noteIndex)}
                className={`rounded-sm px-0.5 ${MARKER_HIGHLIGHT[part.kind]}`}
              >
                {part.text}
              </button>
            ),
          )}
        </p>
      </div>

      {notes.annotations.length > 0 ? (
        <ol className="space-y-2">
          {notes.annotations.map((note, index) => {
            const meta = MARKER_KIND_META[note.kind];
            const active = open === index;
            return (
              <li key={`${note.kind}-${note.start}-${index}`}>
                <button
                  type="button"
                  onClick={() => setOpen(index)}
                  className={`w-full rounded-lg border px-4 py-3 text-left ${
                    active
                      ? 'border-stone-900 bg-stone-50'
                      : 'border-stone-200 bg-white'
                  }`}
                >
                  <p className="flex flex-wrap items-center gap-2 text-xs font-medium">
                    <span className={`rounded-full px-2 py-0.5 ${meta.swatch}`}>
                      {meta.label} · Set {meta.set}
                    </span>
                    <span className="text-stone-500">“{note.quote}”</span>
                  </p>
                  <p className="mt-2 text-sm text-stone-800">{note.issue}</p>
                  <p className="mt-1 text-sm text-stone-700">
                    <span className="font-medium">Try this: </span>
                    {note.suggestion}
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      ) : null}

      {notes.rewrites.length > 0 ? (
        <section className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <h3 className="text-lg font-medium text-indigo-950">Write it better</h3>
          <p className="mt-1 text-sm text-indigo-900">
            These start from your sentences, not a new story. Keep your idea;
            make it easier for a Selective marker to reward.
          </p>
          <ul className="mt-3 space-y-3">
            {notes.rewrites.map((row) => (
              <li
                key={row.original}
                className="rounded-md border border-indigo-100 bg-white px-3 py-3 text-sm"
              >
                <p className="text-stone-500">Your line</p>
                <p className="text-stone-800">{row.original}</p>
                <p className="mt-2 text-indigo-800">Stronger version</p>
                <p className="font-medium text-indigo-950">{row.improved}</p>
                <p className="mt-1 text-xs text-indigo-800">
                  Set {row.set}: {row.why}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

export function MarkerSummary({
  notes,
}: {
  notes: MarkerNotes;
}) {
  if (!notes.summary && notes.strengths.length === 0 && notes.next_steps.length === 0) {
    return null;
  }
  return (
    <section className="rounded-lg border border-stone-200 p-4">
      <h2 className="mb-2 text-lg font-medium">Teacher comments</h2>
      {notes.summary ? (
        <p className="whitespace-pre-wrap text-stone-800">{notes.summary}</p>
      ) : null}
      {notes.strengths.length > 0 ? (
        <div className="mt-3">
          <h3 className="text-sm font-semibold text-emerald-800">Already working</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-stone-800">
            {notes.strengths.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {notes.next_steps.length > 0 ? (
        <div className="mt-3">
          <h3 className="text-sm font-semibold text-indigo-800">Do this next</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-stone-800">
            {notes.next_steps.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
