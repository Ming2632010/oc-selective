import Image from 'next/image';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingHeader } from '@/components/marketing/header';
import { SubjectBlocks } from '@/components/marketing/subject-blocks';
import { SELECTIVE_SUBJECTS } from '@/lib/trials';
import { SUBJECT_PRICE_AUD } from '@/lib/subjects';

export const metadata = {
  title: 'Selective Trials · TrialSeed',
  description:
    'NSW Selective High School practice: Writing, Math, Thinking Skills, and Reading. $99 AUD per subject for one year.',
};

export default function SelectiveTrialPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800">
      <MarketingHeader current="selective" />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-indigo-600">
              Selective Trial
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
              NSW Selective High School
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Four subjects, including Writing. AI feedback shows where the
              student is strong and where marks are lost, then the next task
              aims at those gaps. Each subject will have a progress line and a
              chat so parent and student can see the improvement together. $
              {SUBJECT_PRICE_AUD} AUD per subject, one year, no auto-renewal.
            </p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
            <Image
              src="/marketing/selective-progress-chat.png"
              alt="A happy Selective student with a writing progress line and chat on a tablet"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <h2 className="text-2xl font-semibold text-slate-900">Subjects</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Writing is open now. Math, Thinking Skills, and Reading will open
            at the same price.
          </p>
          <div className="mt-8">
            <SubjectBlocks subjects={SELECTIVE_SUBJECTS} />
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
