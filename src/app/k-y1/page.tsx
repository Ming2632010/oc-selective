import { ProgramPage } from '@/components/marketing/program-page';
import { getProgram } from '@/lib/programs';

const program = getProgram('k-y1');

export const metadata = {
  title: program.metaTitle,
  description: program.metaDescription,
  alternates: { canonical: program.href },
};

export default function KindergartenYear1Page() {
  return <ProgramPage program={program} />;
}
