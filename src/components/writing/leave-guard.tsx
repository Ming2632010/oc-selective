'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  hasUnsavedWriting,
  isLeaveNavigationHref,
  writingLeaveCopy,
  writingLeaveKindForHref,
  type WritingLeaveKind,
} from '@/lib/writing-leave';

const HISTORY_MARK = 'trialseedLeaveGuard';

type PendingLeave = {
  kind: WritingLeaveKind;
  href?: string;
  via: 'link' | 'back';
};

export function LeaveGuard({
  plan,
  content,
  enabled,
}: {
  plan: string;
  content: string;
  enabled: boolean;
}) {
  const dirty = enabled && hasUnsavedWriting(plan, content);
  const [pending, setPending] = useState<PendingLeave | null>(null);
  const dirtyRef = useRef(dirty);
  const pendingRef = useRef(pending);
  const allowLeaveRef = useRef(false);
  const stayButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  dirtyRef.current = dirty;
  pendingRef.current = pending;

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (allowLeaveRef.current || !dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (allowLeaveRef.current || !dirtyRef.current || pendingRef.current) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return;
      }
      const href = anchor.getAttribute('href');
      if (!isLeaveNavigationHref(href)) return;

      event.preventDefault();
      event.stopPropagation();
      setPending({
        kind: writingLeaveKindForHref(href),
        href: href ?? undefined,
        via: 'link',
      });
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    if (window.history.state?.[HISTORY_MARK] !== true) {
      window.history.pushState({ ...window.history.state, [HISTORY_MARK]: true }, '');
    }
    function onPopState() {
      if (allowLeaveRef.current || !dirtyRef.current) return;
      setPending({ kind: 'leave', via: 'back' });
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [dirty]);

  useEffect(() => {
    if (!pending) return;
    stayButtonRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        stay();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [pending]);

  function stay() {
    if (pendingRef.current?.via === 'back' && window.history.state?.[HISTORY_MARK] !== true) {
      window.history.pushState({ ...window.history.state, [HISTORY_MARK]: true }, '');
    }
    setPending(null);
  }

  function leave() {
    const dest = pendingRef.current;
    allowLeaveRef.current = true;
    dirtyRef.current = false;
    setPending(null);
    if (dest?.via === 'back') {
      window.history.back();
      return;
    }
    if (dest?.href) {
      window.location.assign(dest.href);
    }
  }

  if (!pending) return null;
  const copy = writingLeaveCopy(pending.kind);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/50 p-4"
      role="presentation"
      onClick={stay}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md space-y-4 rounded-lg border border-stone-200 bg-white p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-xl font-semibold text-stone-900">
          {copy.title}
        </h2>
        <p className="text-stone-700">{copy.body}</p>
        {copy.extra ? <p className="text-stone-700">{copy.extra}</p> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={leave}
            className="rounded-md border border-stone-300 px-4 py-2 text-stone-800"
          >
            {copy.leave}
          </button>
          <button
            ref={stayButtonRef}
            type="button"
            onClick={stay}
            className="rounded-md bg-stone-900 px-4 py-2 text-white"
          >
            {copy.stay}
          </button>
        </div>
      </div>
    </div>
  );
}
