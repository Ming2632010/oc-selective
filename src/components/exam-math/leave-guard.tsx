'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { isLeaveNavigationHref } from '@/lib/writing-leave';

const HISTORY_MARK = 'trialseedExamMathLeave';

export function ExamMathLeaveGuard({ enabled }: { enabled: boolean }) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const enabledRef = useRef(enabled);
  const pendingRef = useRef(pendingHref);
  const allowLeaveRef = useRef(false);
  const stayButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  enabledRef.current = enabled;
  pendingRef.current = pendingHref;

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (allowLeaveRef.current || !enabledRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (allowLeaveRef.current || !enabledRef.current || pendingRef.current) return;
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
      setPendingHref(href);
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (window.history.state?.[HISTORY_MARK] !== true) {
      window.history.pushState({ ...window.history.state, [HISTORY_MARK]: true }, '');
    }
    function onPopState() {
      if (allowLeaveRef.current || !enabledRef.current) return;
      window.history.pushState({ ...window.history.state, [HISTORY_MARK]: true }, '');
      setPendingHref('back');
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [enabled]);

  useEffect(() => {
    if (!pendingHref) return;
    stayButtonRef.current?.focus();
  }, [pendingHref]);

  if (!pendingHref) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="w-full max-w-md space-y-4 rounded-lg border border-warm-border bg-white p-6">
        <h2 id={titleId} className="font-serif text-xl font-semibold text-warm-ink">
          Leave this sitting?
        </h2>
        <p className="text-sm text-warm-muted">
          This sitting is not finished. If you leave now, the answers on this
          screen will be gone.
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            ref={stayButtonRef}
            type="button"
            className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-[#EDF3ED]"
            onClick={() => setPendingHref(null)}
          >
            Stay and keep going
          </button>
          <button
            type="button"
            className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
            onClick={() => {
              allowLeaveRef.current = true;
              if (pendingHref === 'back') {
                window.history.back();
                return;
              }
              window.location.assign(pendingHref);
            }}
          >
            Leave anyway
          </button>
        </div>
      </div>
    </div>
  );
}
