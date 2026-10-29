'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import { SelectiveMathOverview } from '@/components/dashboard/selective-math-home';
import { emptyExamMathOverview, type ExamMathOverview } from '@/lib/exam-math';

export default function SelectiveMathPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<ExamMathOverview | null>(null);
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
        const res = await apiFetch(`/api/exam-math/overview?student_id=${studentId}`);
        if (res.response.status === 401) {
          router.replace('/login');
          return;
        }
        if (!res.response.ok) {
          throw new Error(res.data.error || 'Could not load Selective Math');
        }
        setOverview({
          minis: res.data.minis,
          papers: res.data.papers,
          trials: res.data.trials ?? [],
          readyMiniCount: res.data.readyMiniCount,
          readyPaperCount: res.data.readyPaperCount,
          readyTrialCount: res.data.readyTrialCount ?? 0,
          openWrongCount: res.data.openWrongCount,
          access: res.data.access === 'trial' ? 'trial' : 'granted',
        });
        if (typeof res.data.student?.name === 'string') {
          setStudentName(res.data.student.name);
        }
      } catch (err) {
        setOverview(emptyExamMathOverview());
        setError(err instanceof Error ? err.message : 'Could not load Selective Math');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  if (loading) {
    return <main className="mx-auto max-w-5xl p-6">Loading Selective Math…</main>;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-6">
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <SelectiveMathOverview overview={overview} studentName={studentName} />
    </main>
  );
}
