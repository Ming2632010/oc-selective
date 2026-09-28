'use client';

import { useEffect, useState } from 'react';

export type PromptStimulusData = {
  kind?: 'practice' | 'test' | 'bonus' | 'custom';
  description?: string | null;
  stimulus_image?: string | null;
  stimulus_quote?: string | null;
  purpose_note?: string | null;
};

export function PromptStimulus({
  prompt,
  showJobs = false,
}: {
  prompt: PromptStimulusData;
  showJobs?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const image = prompt.stimulus_image?.trim() || '';
  const description = prompt.description?.trim() || '';
  const customPhoto = prompt.kind === 'custom' && Boolean(image);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!image && !description && !prompt.stimulus_quote && !(showJobs && prompt.purpose_note)) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="text-lg font-medium">Prompt</h2>
      {image ? (
        <figure>
          <button type="button" onClick={() => setOpen(true)} className="block w-full">
            <img
              src={image}
              alt={customPhoto ? 'Writing task photo' : 'Writing stimulus'}
              className={
                customPhoto
                  ? 'max-h-[70vh] w-full rounded-md bg-stone-50 object-contain'
                  : 'max-h-80 w-full rounded-md object-cover'
              }
            />
          </button>
          {customPhoto ? (
            <figcaption className="mt-1 text-xs text-stone-500">
              Tap the photo to make it bigger. Write from what you can see in the photo.
            </figcaption>
          ) : null}
        </figure>
      ) : null}
      {open && image ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          aria-label="Close photo"
        >
          <img
            src={image}
            alt="Writing task photo, larger view"
            className="max-h-[92vh] max-w-[92vw] object-contain"
          />
        </button>
      ) : null}
      {prompt.stimulus_quote ? (
        <blockquote className="border-l-4 border-stone-400 pl-4 text-lg italic text-stone-800">
          {prompt.stimulus_quote}
        </blockquote>
      ) : null}
      {description ? (
        <p className="whitespace-pre-wrap text-stone-800">{description}</p>
      ) : null}
      {showJobs && prompt.purpose_note ? (
        <p className="rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-950">
          Two jobs: {prompt.purpose_note}
        </p>
      ) : null}
    </section>
  );
}
