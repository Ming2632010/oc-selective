import Image from 'next/image';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingHeader } from '@/components/marketing/header';
import { SubjectBlocks } from '@/components/marketing/subject-blocks';
import type { Program } from '@/lib/programs';

export function ProgramPage({ program }: { program: Program }) {
  return (
    <div className="min-h-screen bg-warm-page text-warm-ink">
      <MarketingHeader current={program.id} />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-brand">
              {program.eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-warm-ink">
              {program.headline}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-warm-muted">{program.summary}</p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-warm-border bg-warm-card shadow-card">
            <Image
              src={program.image.src}
              alt={program.image.alt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <h2 className="text-2xl font-semibold text-warm-ink">Subjects</h2>
          <p className="mt-2 max-w-2xl text-sm text-warm-muted">{program.subjectsIntro}</p>
          <div className="mt-8">
            <SubjectBlocks subjects={program.subjects} />
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
