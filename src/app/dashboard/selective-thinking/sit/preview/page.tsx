'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentId, getToken } from '@/lib/client-auth';
import { ExamThinkingPlayer } from '@/components/exam-thinking/player';
import {
  EXAM_THINKING_PREVIEW_QUESTIONS,
  EXAM_THINKING_PREVIEW_SECONDS,
} from '@/lib/exam-thinking-preview';

export default function SelectiveThinkingPreviewPage() {
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
    <ExamThinkingPlayer
      kind="preview"
      title="Computer test screen"
      timeLimitSeconds={EXAM_THINKING_PREVIEW_SECONDS}
      questions={EXAM_THINKING_PREVIEW_QUESTIONS}
      exitHref="/dashboard/selective-thinking"
      exitLabel="Back to Thinking Skills"
    />
  );
}
