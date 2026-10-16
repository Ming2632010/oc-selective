'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentId, getToken } from '@/lib/client-auth';
import { ExamMathPlayer } from '@/components/exam-math/player';
import {
  EXAM_MATH_PREVIEW_QUESTIONS,
  EXAM_MATH_PREVIEW_SECONDS,
} from '@/lib/exam-math-preview';

export default function SelectiveMathPreviewPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    if (!getStudentId()) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <ExamMathPlayer
      kind="preview"
      title="Computer test screen"
      timeLimitSeconds={EXAM_MATH_PREVIEW_SECONDS}
      questions={EXAM_MATH_PREVIEW_QUESTIONS}
      exitHref="/dashboard/selective-math"
      exitLabel="Back to Selective Math"
    />
  );
}
