'use client';

import { ExamMathStimulusView } from '@/components/exam-math/stimulus';
import type { ExamMathWorking } from '@/lib/exam-math-working';

export function ExamMathWorkingView({ steps }: { steps: ExamMathWorking }) {
  if (steps.length === 0) return null;
  return (
    <ol className="space-y-4 border-t border-warm-border pt-4">
      {steps.map((step, index) => (
        <li key={`${step.heading}-${index}`} className="space-y-2">
          <p className="text-sm font-semibold text-warm-ink">
            {index + 1}. {step.heading}
          </p>
          {step.body ? <p className="text-sm leading-relaxed text-warm-muted">{step.body}</p> : null}
          <ExamMathStimulusView stimulus={step.stimulus} />
        </li>
      ))}
    </ol>
  );
}
