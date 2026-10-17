'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import { SelectiveThinkingOverview } from '@/components/dashboard/selective-thinking-home';
import { emptyExamThinkingOverview, type ExamThinkingOverview } from '@/lib/exam-thinking';

export default function SelectiveThinkingPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<ExamThinkingOverview | null>(null);
  const [studentName, setStudentName] = useState('this child');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = getToken();
      const studentId = getStudentId();
      if (!token) {
        router.replace('/login');
        return;
      }
      if (!studentId) {
        router.replace('/dashboard');
        return;
      }
      try {
        const res = await apiFetch(`/api/exam-thinking/overview?student_id=${studentId}`);
        if (res.response.status === 401) {
          router.replace('/login');
          return;
        }
        if (!res.response.ok) {
          throw new Error(res.data.error || 'Could not load Selective Thinking Skills');
        }
        setOverview({
          minis: res.data.minis,
          papers: res.data.papers,
          readyMiniCount: res.data.readyMiniCount,
          readyPaperCount: res.data.readyPaperCount,
          openWrongCount: res.data.openWrongCount,
        });
        if (typeof res.data.student?.name === 'string') {
          setStudentName(res.data.student.name);
        }
      } catch (err) {
        setOverview(emptyExamThinkingOverview());
        setError(err instanceof Error ? err.message : 'Could not load Selective Thinking Skills');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  if (loading) {
    return <main className="mx-auto max-w-5xl p-6">Loading Selective Thinking Skills…</main>;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-6">
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <SelectiveThinkingOverview overview={overview} studentName={studentName} />
    </main>
  );
}
