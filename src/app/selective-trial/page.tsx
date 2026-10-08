import { ProgramPage } from '@/components/marketing/program-page';
import { getProgram } from '@/lib/programs';

const program = getProgram('selective');

export const metadata = {
  title: program.metaTitle,
  description: program.metaDescription,
  alternates: { canonical: program.href },
};

export default function SelectiveTrialPage() {
  return <ProgramPage program={program} />;
}
