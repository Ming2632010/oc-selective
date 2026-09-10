'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/client-auth';

type ChatMessage = {
  id: string;
  sender: 'parent' | 'student';
  body: string;
  created_at: string;
};

export function SubjectChat({
  studentId,
  subject = 'writing',
}: {
  studentId: string;
  subject?: 'writing' | 'math' | 'thinking' | 'reading';
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sender, setSender] = useState<'parent' | 'student'>('parent');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    async function load() {
      const res = await apiFetch(
        `/api/subjects/chat?student_id=${studentId}&subject=${subject}`,
      );
      if (res.response.ok) {
        setMessages((res.data.messages as ChatMessage[]) || []);
        setError(null);
      } else {
        setError(res.data.error || 'Could not load chat');
      }
    }
    void load();
  }, [open, studentId, subject]);

  async function onSend(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await apiFetch('/api/subjects/chat', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          subject,
          sender,
          body: body.trim(),
        }),
      });
      if (!res.response.ok) {
        throw new Error(res.data.error || 'Could not send');
      }
      setMessages((prev) => [...prev, res.data.message as ChatMessage]);
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="flex h-full min-h-[18rem] flex-col rounded-lg border border-warm-border bg-warm-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-warm-ink">Writing chat</h2>
          <p className="mt-1 text-sm text-warm-muted">
            Notes between parent and student about this subject.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-[#EDF3ED]"
        >
          {open ? 'Close' : 'Open chat'}
        </button>
      </div>

      {!open ? (
        <p className="mt-6 text-sm text-warm-subtle">
          Open chat when you want to read or add a note.
        </p>
      ) : (
        <>

      <ul className="mt-4 max-h-56 flex-1 space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <li className="text-sm text-warm-subtle">
            No messages yet. Say what went well, or what to practise next.
          </li>
        ) : (
          messages.map((message) => (
            <li
              key={message.id}
              className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                message.sender === 'parent'
                  ? 'ml-auto bg-[#F5EEE6] text-warm-ink'
                  : 'bg-[#F0EBE3] text-warm-ink'
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-warm-subtle">
                {message.sender === 'parent' ? 'Parent' : 'Student'}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap">{message.body}</p>
            </li>
          ))
        )}
      </ul>

      {error ? (
        <p className="mt-2 text-sm text-red-700">{error}</p>
      ) : null}

      <form onSubmit={onSend} className="mt-3 space-y-2">
        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="sender"
              checked={sender === 'parent'}
              onChange={() => setSender('parent')}
              className="accent-brand"
            />
            Parent
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="sender"
              checked={sender === 'student'}
              onChange={() => setSender('student')}
              className="accent-brand"
            />
            Student
          </label>
        </div>
        <div className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            placeholder="Write a short note…"
            className="min-w-0 flex-1 rounded-lg border border-warm-border bg-warm-card px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="rounded-full bg-terracotta px-3 py-2 text-sm font-medium text-white hover:bg-terracotta-hover disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
        </>
      )}
    </section>
  );
}
